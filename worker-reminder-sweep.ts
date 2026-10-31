// Sends the reminders that are due (plan §3.9). The cron trigger in worker.ts runs it every 15 minutes. Each schedule
// is read, decided by worker-reminders.ts, and written back before anything is sent. A run that dies midway can
// therefore miss a push, but it cannot send the same push twice.
import {
  deleteDocument,
  openSession,
  parseServiceAccount,
  patchDocument,
  queryDocuments,
  sendPush,
  type FetchLike,
  type FirestoreDocument,
  type GoogleSession,
} from './worker-google';
import {
  decideDue,
  NEVER,
  nextDueAfter,
  parseReminderSchedule,
  pushMessageFor,
  type ReminderSchedule,
} from './worker-reminders';

/** Bounds the work per run, so one busy slot cannot exhaust the Worker's CPU budget. The rest wait for the next run. */
export const MAX_SCHEDULES_PER_RUN = 50;
export const MAX_TOKENS_PER_PERSON = 5;

export interface SweepEnv {
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
}

export interface SweepSummary {
  due: number;
  sent: number;
  rescheduled: number;
  skipped: number;
  pruned: number;
  failed: number;
}

export async function runReminderSweep(
  env: SweepEnv,
  now: number,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
): Promise<SweepSummary> {
  const summary: SweepSummary = { due: 0, sent: 0, rescheduled: 0, skipped: 0, pruned: 0, failed: 0 };
  const account = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!account || account.projectId !== env.FIREBASE_PROJECT_ID) {
    console.error('[config] The reminder sender needs FIREBASE_SERVICE_ACCOUNT_JSON for the project in FIREBASE_PROJECT_ID. Set it with: wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON');
    return summary;
  }
  const session = await openSession(account, fetchImpl, now);
  const documents = await queryDocuments(
    session,
    'reminderSchedules',
    { field: 'nextDueAt', op: 'LESS_THAN_OR_EQUAL', value: now },
    MAX_SCHEDULES_PER_RUN,
    'nextDueAt',
  );
  summary.due = documents.length;
  for (const document of documents) {
    try {
      await handleSchedule(session, document, now, summary);
    } catch {
      summary.failed += 1;
      console.error('[reminders] A schedule could not be processed');
    }
  }
  return summary;
}

async function handleSchedule(
  session: GoogleSession,
  document: FirestoreDocument,
  now: number,
  summary: SweepSummary,
): Promise<void> {
  const uid = document.name.split('/').pop() ?? '';
  const path = `reminderSchedules/${encodeURIComponent(uid)}`;
  const schedule = parseReminderSchedule(document.fields);
  if (!schedule) {
    // A malformed schedule is parked, so it stops taking a slot in every run. The app has to write a new one.
    await patchDocument(session, path, { nextDueAt: NEVER }, document.updateTime);
    summary.skipped += 1;
    return;
  }

  const decision = decideDue(schedule, schedule.nextDueAt, now);
  if (decision.action === 'reschedule') {
    await reschedule(session, path, document, schedule, now, summary);
    return;
  }

  const tokens = await tokensFor(session, uid);
  if (tokens.length === 0) {
    await reschedule(session, path, document, schedule, now, summary);
    return;
  }

  // Claim the day before sending: the write is what prevents a second push on the same day.
  const next = nextDueAfter({ ...schedule, lastSentDay: decision.date }, now);
  const claimed = await patchDocument(
    session,
    path,
    { nextDueAt: next?.at ?? NEVER, lastSentDay: decision.date },
    document.updateTime,
  );
  if (!claimed) {
    summary.skipped += 1;
    return;
  }

  const message = pushMessageFor(decision.cadence, schedule.lang);
  for (const token of tokens) {
    const result = await sendPush(session, token, message);
    if (result === 'sent') {
      summary.sent += 1;
    } else if (result === 'unregistered') {
      await deleteDocument(session, `pushTokens/${encodeURIComponent(token)}`);
      summary.pruned += 1;
    } else {
      summary.failed += 1;
    }
  }
}

async function reschedule(
  session: GoogleSession,
  path: string,
  document: FirestoreDocument,
  schedule: ReminderSchedule,
  now: number,
  summary: SweepSummary,
): Promise<void> {
  const next = nextDueAfter(schedule, now);
  const moved = await patchDocument(session, path, { nextDueAt: next?.at ?? NEVER }, document.updateTime);
  summary[moved ? 'rescheduled' : 'skipped'] += 1;
}

async function tokensFor(session: GoogleSession, uid: string): Promise<string[]> {
  const rows = await queryDocuments(
    session,
    'pushTokens',
    { field: 'uid', op: 'EQUAL', value: uid },
    MAX_TOKENS_PER_PERSON,
  );
  return rows
    .map((row) => row.fields.token)
    .filter((token): token is string => typeof token === 'string' && token.length > 0 && token.length <= 4096);
}
