// Satisfying adaptation feedback: idempotent, truthful, optional acknowledgements (ArchetypeAI-zl7, step E09.04). Pure.
// One confirmed action by the person selects at most one acknowledgement, deduplicated by eventId. Each line states its
// basis: the observation restates the action, the hypothesis is optional, hedged and never a cause, the referenced
// action is user-authored, and canonical measurement is untouched. Feedback is never a score, ranking, streak, count or
// hidden tally. Every line passes a truthfulness check before it can be selected.
// NOT done here: rendering (step 05), wiring to screens or storage (step 06), and any evidence that feedback helps a
// person (steps 10-12). Recovery cases are exercised in the colocated spec (step E09.07).
// Reuses experiment-outcome (OutcomeEntry) for the declined-recording adapter.
import type { OutcomeEntry } from '../core/experiment-outcome';

export const ACTION_KINDS = ['plan-revised', 'exception-noticed', 'help-requested', 'rest-chosen', 'recording-declined'] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];
export type FeedbackId = 'revised-plan' | 'noticed-exception' | 'asked-for-help' | 'chose-rest' | 'declined-recording';
const FEEDBACK_FOR: Readonly<Record<ActionKind, FeedbackId>> = {
  'plan-revised': 'revised-plan',
  'exception-noticed': 'noticed-exception',
  'help-requested': 'asked-for-help',
  'rest-chosen': 'chose-rest',
  'recording-declined': 'declined-recording',
};

export type Origin = 'person' | 'app' | 'model' | 'therapist';
export type Actor = Origin;
/** A person's action, confirmed by them. eventId is the idempotency key fixed at confirmation. */
export interface ConfirmedAction { eventId: string; kind: ActionKind; subjectId: string; confirmed: boolean; origin: Origin; }

export interface FeedbackBasis {
  /** Restates the confirmed action only. */
  observation: string;
  /** Optional, hedged, labelled tentative reading. Null in quiet mode and when no hypothesis is offered. */
  hypothesis: string | null;
  /** Feedback copy is app-authored; the plan, exception or words it refers to are the person's own. */
  authorship: { feedbackText: 'app-authored'; referencedAction: 'user-authored' };
  canonicalMeasurement: 'untouched';
}
export interface FeedbackItem { eventId: string; kind: ActionKind; feedbackId: FeedbackId; optional: true; scoreDelta: 0; basis: FeedbackBasis; }

export type Mode = 'full' | 'quiet' | 'off';
export interface Preference { mode: Mode; }

export type DeliveryStatus = 'pending' | 'shown' | 'dismissed' | 'revoked';
/** kind is null only for a revocation recorded before any feedback was selected for that event. */
export interface LedgerEntry { eventId: string; kind: ActionKind | null; status: DeliveryStatus; }
export type Ledger = ReadonlyArray<LedgerEntry>;

export type RefusalReason =
  | 'invalid-event' | 'not-person-origin' | 'not-confirmed' | 'unknown-kind' | 'revoked'
  | 'duplicate' | 'feedback-off' | 'missing-copy' | 'untruthful-copy';
export type Selection = { status: 'show'; item: FeedbackItem } | { status: 'refused'; reason: RefusalReason };

export interface CopyLine { observation: string; hypothesis: string | null; }
export type Catalog = Readonly<Partial<Record<ActionKind, CopyLine>>>;

export const CATALOG: Catalog = {
  'plan-revised': { observation: 'You revised this plan.', hypothesis: 'The new version may fit this situation better. Only you can judge that.' },
  'exception-noticed': { observation: 'You noticed a time when things went differently.', hypothesis: 'That difference may be worth a look, if you want one.' },
  'help-requested': { observation: 'You asked for help. Asking is a complete step on its own.', hypothesis: null },
  'rest-chosen': { observation: 'You chose to rest. Resting is a complete choice, and nothing is owed.', hypothesis: null },
  'recording-declined': { observation: 'You chose not to record this. Nothing was saved and no outcome was written.', hypothesis: null },
};

const FORBIDDEN = /\b(improv\w*|worked|works|helped|progress\w*|streaks?|points?|scores?|scoring|rank\w*|badges?|missed|should have|proves?|cures?|treat\w*|therap\w*|valid\w*|clinical\w*|effective\w*|benefit\w*|because|caus\w*)\b|\d/i;
const HEDGE = /\b(may|might|could|possibly|maybe)\b/i;

/** No copy may score, rank, count, streak, validate or assert a cause. A hypothesis must also be hedged. */
export function isTruthfulCopy(line: CopyLine): boolean {
  if (!line.observation.trim() || FORBIDDEN.test(line.observation)) return false;
  return line.hypothesis === null || (HEDGE.test(line.hypothesis) && !FORBIDDEN.test(line.hypothesis));
}

function build(eventId: string, kind: ActionKind, mode: Mode, catalog: Catalog): FeedbackItem | RefusalReason {
  const line = catalog[kind];
  if (!line) return 'missing-copy';
  if (!isTruthfulCopy(line)) return 'untruthful-copy';
  return {
    eventId,
    kind,
    feedbackId: FEEDBACK_FOR[kind],
    optional: true,
    scoreDelta: 0,
    basis: {
      observation: line.observation,
      hypothesis: mode === 'quiet' ? null : line.hypothesis,
      authorship: { feedbackText: 'app-authored', referencedAction: 'user-authored' },
      canonicalMeasurement: 'untouched',
    },
  };
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/**
 * Selects at most one acknowledgement for a confirmed person action. Pure and deterministic: the same inputs always
 * give the same selection. A pending entry for the same event resumes the same item; any other prior entry is a duplicate.
 */
export function selectFeedback(action: ConfirmedAction, ledger: Ledger, pref: Preference, catalog: Catalog = CATALOG): Selection {
  const refuse = (reason: RefusalReason): Selection => ({ status: 'refused', reason });
  if (!action || !isText(action.eventId) || !isText(action.subjectId)) return refuse('invalid-event');
  if (action.origin !== 'person') return refuse('not-person-origin');
  if (action.confirmed !== true) return refuse('not-confirmed');
  if (!(ACTION_KINDS as readonly string[]).includes(action.kind)) return refuse('unknown-kind');
  const prior = ledger.find((e) => e.eventId === action.eventId);
  if (prior?.status === 'revoked') return refuse('revoked');
  if (prior && (prior.status !== 'pending' || prior.kind !== action.kind)) return refuse('duplicate');
  if (pref.mode === 'off') return refuse('feedback-off');
  const built = build(action.eventId, action.kind, pref.mode, catalog);
  return typeof built === 'string' ? refuse(built) : { status: 'show', item: built };
}

/** Records a selected item as pending. Idempotent: an event already in the ledger, in any state, is left as it is. */
export function recordSelection(ledger: Ledger, item: FeedbackItem): Ledger {
  return ledger.some((e) => e.eventId === item.eventId) ? ledger : [...ledger, { eventId: item.eventId, kind: item.kind, status: 'pending' }];
}

const move = (ledger: Ledger, eventId: string, from: ReadonlyArray<DeliveryStatus>, to: DeliveryStatus): Ledger =>
  ledger.map((e) => (e.eventId === eventId && from.includes(e.status) ? { ...e, status: to } : e));

export const markShown = (ledger: Ledger, eventId: string): Ledger => move(ledger, eventId, ['pending'], 'shown');
export const dismiss = (ledger: Ledger, eventId: string): Ledger => move(ledger, eventId, ['pending', 'shown'], 'dismissed');

/** Only the person can revoke an outcome. A revocation of an unknown event is kept, so later feedback is refused. */
export function revoke(ledger: Ledger, eventId: string, actor: Actor): Ledger {
  if (actor !== 'person') return ledger;
  if (!ledger.some((e) => e.eventId === eventId)) return [...ledger, { eventId, kind: null, status: 'revoked' }];
  return move(ledger, eventId, ['pending', 'shown', 'dismissed'], 'revoked');
}

/** Pending items to resume after an interruption. Empty when feedback is off; nothing is deleted. */
export function pendingItems(ledger: Ledger, pref: Preference, catalog: Catalog = CATALOG): FeedbackItem[] {
  if (pref.mode === 'off') return [];
  return ledger.flatMap((e) => {
    if (e.status !== 'pending' || e.kind === null) return [];
    const built = build(e.eventId, e.kind, pref.mode, catalog);
    return typeof built === 'string' ? [] : [built];
  });
}

const STATUSES: ReadonlyArray<string> = ['pending', 'shown', 'dismissed', 'revoked'];

/**
 * Rebuilds a ledger from untrusted storage. Malformed entries are dropped, nothing is invented, and one entry is kept
 * per event. A revoked entry wins over any other entry for the same event.
 */
export function normalizeLedger(raw: unknown): Ledger {
  if (!Array.isArray(raw)) return [];
  const byEvent = new Map<string, LedgerEntry>();
  for (const item of raw as unknown[]) {
    if (!item || typeof item !== 'object') continue;
    const { eventId, kind, status } = item as Record<string, unknown>;
    if (!isText(eventId) || typeof status !== 'string' || !STATUSES.includes(status)) continue;
    const knownKind = ACTION_KINDS.find((k) => k === kind) ?? null;
    if (status !== 'revoked' && knownKind === null) continue;
    const entry: LedgerEntry = { eventId, kind: knownKind, status: status as DeliveryStatus };
    const prior = byEvent.get(entry.eventId);
    if (!prior || (entry.status === 'revoked' && prior.status !== 'revoked')) byEvent.set(entry.eventId, entry);
  }
  return [...byEvent.values()];
}

/** A declined recording is a confirmed person action. A recorded outcome is not acknowledged here, so it returns null. */
export function actionFromOutcome(entry: OutcomeEntry, eventId: string, subjectId: string, confirmed: boolean): ConfirmedAction | null {
  return entry.recorded ? null : { eventId, kind: 'recording-declined', subjectId, confirmed, origin: 'person' };
}
