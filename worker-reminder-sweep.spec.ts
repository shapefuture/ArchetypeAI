// @vitest-environment node
import { exportPKCS8, generateKeyPair, jwtVerify, type KeyLike } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { runReminderSweep, type SweepEnv } from './worker-reminder-sweep';
import { instantOf, NEVER } from './worker-reminders';

const PROJECT = 'archetype-ai-3e43b';
const CLIENT_EMAIL = 'reminders@archetype-ai-3e43b.iam.gserviceaccount.com';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DAILY_TEXT = 'Луна на связи. Минутка про сегодня?';
const MINUTE = 60_000;

const moscow = (year: number, month: number, day: number, hour: number, minute: number) =>
  instantOf('Europe/Moscow', year, month, day, hour, minute);

let publicKey: KeyLike;
let serviceAccountJson: string;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true });
  publicKey = pair.publicKey;
  serviceAccountJson = JSON.stringify({
    project_id: PROJECT,
    client_email: CLIENT_EMAIL,
    private_key: await exportPKCS8(pair.privateKey),
  });
});

const env: SweepEnv = {
  get FIREBASE_PROJECT_ID() { return PROJECT; },
  get FIREBASE_SERVICE_ACCOUNT_JSON() { return serviceAccountJson; },
};

/** Encodes a plain value the way Firestore's REST API does. */
function toRest(value: unknown): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  const fields = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toRest(item)]));
  return { mapValue: { fields } };
}

function scheduleRow(uid: string, fields: Record<string, unknown>, updateTime = '2026-10-29T17:00:00.000000Z') {
  return {
    document: {
      name: `projects/${PROJECT}/databases/(default)/documents/reminderSchedules/${uid}`,
      fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, toRest(value)])),
      updateTime,
    },
    readTime: '2026-10-29T17:40:00.000000Z',
  };
}

function scheduleFields(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    timeZone: 'Europe/Moscow',
    lang: 'ru',
    daily: { enabled: true, hour: 20, minute: 30 },
    weekly: { enabled: false, weekday: 0, hour: 19, minute: 0 },
    monthly: { enabled: false, day: 1, hour: 10, minute: 0 },
    quietHours: { startHour: 22, endHour: 8 },
    skipDate: null,
    pausedUntil: null,
    lastCheckInDay: null,
    lastSentDay: null,
    nextDueAt: moscow(2026, 10, 29, 20, 30),
    ...overrides,
  };
}

interface Call {
  url: string;
  method: string;
  body: any;
  headers: Record<string, string>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

interface FakeOptions {
  schedules: unknown[];
  tokens?: string[];
  fcm?: (token: string) => Response;
  patchStatus?: number;
}

/** A stand-in for Google: records every call and answers the few endpoints the sweep uses. */
function fakeGoogle(options: FakeOptions) {
  const calls: Call[] = [];
  const fetchImpl = async (input: string, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const raw = init?.body;
    const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    calls.push({ url: input, method, body, headers: (init?.headers ?? {}) as Record<string, string> });

    if (input === TOKEN_URL) return json({ access_token: 'access-1', expires_in: 3600 });
    if (input.endsWith(':runQuery')) {
      const collection = body.structuredQuery.from[0].collectionId as string;
      if (collection === 'reminderSchedules') return json(options.schedules);
      const tokens = options.tokens ?? [];
      return json(tokens.map((token) => ({
        document: {
          name: `projects/${PROJECT}/databases/(default)/documents/pushTokens/${token}`,
          fields: { token: { stringValue: token }, uid: { stringValue: 'uid-1' } },
          updateTime: '2026-10-01T00:00:00.000000Z',
        },
        readTime: '2026-10-29T17:40:00.000000Z',
      })));
    }
    if (method === 'PATCH') return json({}, options.patchStatus ?? 200);
    if (method === 'DELETE') return json({});
    if (input.startsWith('https://fcm.googleapis.com/')) {
      const token = body.message.token as string;
      return options.fcm ? options.fcm(token) : json({ name: 'message' });
    }
    return json({ error: 'unexpected call' }, 500);
  };
  return { calls, fetchImpl };
}

const callsTo = (calls: Call[], method: string, match: (url: string) => boolean) =>
  calls.filter((call) => call.method === method && match(call.url));
const fcmCalls = (calls: Call[]) => calls.filter((call) => call.url.startsWith('https://fcm.googleapis.com/'));
const patchCalls = (calls: Call[]) => callsTo(calls, 'PATCH', (url) => url.includes('/reminderSchedules/'));

describe('reminder sweep: sending', () => {
  it('claims the day, then sends to every token', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-1', scheduleFields({ nextDueAt: dueAt }))],
      tokens: ['token-a', 'token-b'],
    });

    const summary = await runReminderSweep(env, dueAt + 10 * MINUTE, fetchImpl);

    expect(summary).toEqual({ due: 1, sent: 2, rescheduled: 0, skipped: 0, pruned: 0, failed: 0 });
    const [claim] = patchCalls(calls);
    expect(claim.url).toContain('currentDocument.updateTime=2026-10-29T17%3A00%3A00.000000Z');
    expect(claim.body.fields.lastSentDay).toEqual({ stringValue: '2026-10-29' });
    expect(claim.body.fields.nextDueAt).toEqual({ integerValue: String(moscow(2026, 10, 30, 20, 30)) });
    const sends = fcmCalls(calls);
    expect(sends.map((call) => call.body.message.token)).toEqual(['token-a', 'token-b']);
    expect(sends[0].body.message.notification).toEqual({ title: 'Innerverse', body: DAILY_TEXT });
    expect(sends[0].body.message.webpush.fcm_options.link).toBe('https://innerverseai.web.app/#checkin');
    expect(sends[0].headers.Authorization).toBe('Bearer access-1');
    expect(calls.indexOf(claim)).toBeLessThan(calls.indexOf(sends[0]));
  });

  it('signs a token request that Google can verify, scoped to Firestore and FCM', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({ schedules: [], tokens: [] });

    await runReminderSweep(env, dueAt, fetchImpl);

    const exchange = calls.find((call) => call.url === TOKEN_URL);
    const assertion = (exchange?.body as URLSearchParams).get('assertion') ?? '';
    // The token is issued from the sweep's clock (dueAt), so verify it at that instant, not the wall clock.
    const { payload } = await jwtVerify(assertion, publicKey, { issuer: CLIENT_EMAIL, audience: TOKEN_URL, currentDate: new Date(dueAt) });
    expect(payload.sub).toBe(CLIENT_EMAIL);
    expect(String(payload.scope)).toContain('https://www.googleapis.com/auth/datastore');
    expect(String(payload.scope)).toContain('https://www.googleapis.com/auth/firebase.messaging');
  });

  it('deletes a token that FCM reports as unregistered and sends to the rest', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-1', scheduleFields({ nextDueAt: dueAt }))],
      tokens: ['token-a', 'token-b'],
      fcm: (token) => (token === 'token-b'
        ? json({ error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] } }, 404)
        : json({ name: 'message' })),
    });

    const summary = await runReminderSweep(env, dueAt + 10 * MINUTE, fetchImpl);

    expect(summary).toMatchObject({ sent: 1, pruned: 1, failed: 0 });
    const deletes = callsTo(calls, 'DELETE', (url) => url.includes('/pushTokens/'));
    expect(deletes.map((call) => call.url)).toEqual([
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/pushTokens/token-b`,
    ]);
  });

  it('keeps a token after any other FCM error', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-1', scheduleFields({ nextDueAt: dueAt }))],
      tokens: ['token-a'],
      fcm: () => json({ error: { status: 'INVALID_ARGUMENT', details: [] } }, 400),
    });

    const summary = await runReminderSweep(env, dueAt + 10 * MINUTE, fetchImpl);

    expect(summary).toMatchObject({ sent: 0, pruned: 0, failed: 1 });
    expect(callsTo(calls, 'DELETE', () => true)).toHaveLength(0);
  });

  it('reschedules without sending when the person has no token', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-1', scheduleFields({ nextDueAt: dueAt }))],
      tokens: [],
    });

    const summary = await runReminderSweep(env, dueAt + 10 * MINUTE, fetchImpl);

    expect(summary).toMatchObject({ rescheduled: 1, sent: 0 });
    expect(fcmCalls(calls)).toHaveLength(0);
    const [move] = patchCalls(calls);
    expect(move.body.fields.nextDueAt).toEqual({ integerValue: String(moscow(2026, 10, 30, 20, 30)) });
    expect(move.body.fields.lastSentDay).toBeUndefined();
  });

  it('sends nothing when another write got there first', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-1', scheduleFields({ nextDueAt: dueAt }))],
      tokens: ['token-a'],
      patchStatus: 400,
    });

    const summary = await runReminderSweep(env, dueAt + 10 * MINUTE, fetchImpl);

    expect(summary).toMatchObject({ skipped: 1, sent: 0 });
    expect(fcmCalls(calls)).toHaveLength(0);
  });

  it('parks a malformed schedule so it stops taking a slot in every run', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-2', scheduleFields({ timeZone: 'Mars/Olympus', nextDueAt: dueAt }))],
      tokens: ['token-a'],
    });

    const summary = await runReminderSweep(env, dueAt + 10 * MINUTE, fetchImpl);

    expect(summary).toMatchObject({ skipped: 1, sent: 0 });
    expect(fcmCalls(calls)).toHaveLength(0);
    expect(patchCalls(calls)[0].body.fields.nextDueAt).toEqual({ integerValue: String(NEVER) });
  });

  it('never sends a push more than two hours late', async () => {
    const dueAt = moscow(2026, 10, 29, 20, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-1', scheduleFields({ nextDueAt: dueAt }))],
      tokens: ['token-a'],
    });

    const summary = await runReminderSweep(env, dueAt + 3 * 60 * MINUTE, fetchImpl);

    expect(summary).toMatchObject({ rescheduled: 1, sent: 0 });
    expect(fcmCalls(calls)).toHaveLength(0);
  });

  it('holds a push that falls due inside quiet hours', async () => {
    const dueAt = moscow(2026, 10, 29, 21, 30);
    const { calls, fetchImpl } = fakeGoogle({
      schedules: [scheduleRow('uid-1', scheduleFields({ daily: { enabled: true, hour: 21, minute: 30 }, nextDueAt: dueAt }))],
      tokens: ['token-a'],
    });

    const summary = await runReminderSweep(env, moscow(2026, 10, 29, 22, 10), fetchImpl);

    expect(summary).toMatchObject({ rescheduled: 1, sent: 0 });
    expect(fcmCalls(calls)).toHaveLength(0);
  });
});

describe('reminder sweep: configuration', () => {
  it('does nothing without the service account secret', async () => {
    const { calls, fetchImpl } = fakeGoogle({ schedules: [scheduleRow('uid-1', scheduleFields())] });

    const summary = await runReminderSweep({ FIREBASE_PROJECT_ID: PROJECT }, moscow(2026, 10, 29, 20, 40), fetchImpl);

    expect(summary).toEqual({ due: 0, sent: 0, rescheduled: 0, skipped: 0, pruned: 0, failed: 0 });
    expect(calls).toHaveLength(0);
  });

  it('refuses a service account for another project', async () => {
    const { calls, fetchImpl } = fakeGoogle({ schedules: [scheduleRow('uid-1', scheduleFields())] });

    const summary = await runReminderSweep(
      { FIREBASE_PROJECT_ID: 'another-project', FIREBASE_SERVICE_ACCOUNT_JSON: serviceAccountJson },
      moscow(2026, 10, 29, 20, 40),
      fetchImpl,
    );

    expect(summary.due).toBe(0);
    expect(calls).toHaveLength(0);
  });
});
