// E17 operation status (ArchetypeAI-xdlo, step 04). Pure and deterministic.
// Typed state machines for one remote or local request and for one draft save, with effect-aware retry:
// reads and idempotent writes retry with bounded backoff; a non-idempotent write whose outcome is ambiguous
// (timeout or unavailable) without an idempotency key becomes "unknown" and is never re-sent automatically.
// Every event carries a request id, so a late reply from a superseded or cancelled request is ignored.
// A save is acknowledged only after a read-back matches what was written. Acknowledgement codes name the
// authority that confirmed them, and subjects are tagged as observation, hypothesis, user authorship or
// canonical measurement (canonical scores are never writable here).
// NOT done here: status copy and UI (step 05), wiring into storage, coach, booking, sharing or renderer code
// (step 06), evidence capture and participant, device or live-service acceptance (steps 10-12).
// No clock, storage, network or DOM access: time and observed outcomes are injected by the caller.
import { saveFailure, type SaveFailure } from '../core/assessment-draft';
import {
  decideAccess, setLinkState, type AccessAction, type AccessDecision, type Relationship, type Role,
} from '../core/therapist-access';

export type EffectClass = 'read' | 'idempotent-write' | 'non-idempotent-write';
export type FailureKind =
  | 'offline' | 'timeout' | 'unavailable' | 'verify-failed'          // transient, may retry
  | 'quota' | 'blocked'                                              // local storage, needs the person
  | 'rejected' | 'conflict' | 'expired' | 'revoked';                 // authority said no, never auto-retried
export type RetryHint = 'auto' | 'when-online' | 'user' | 'none';
/** What confirmed an effect: the server's response, a read-back of local storage, or a local load (renderer). */
export type Basis = 'server-response' | 'read-back' | 'local-load';
export type Subject = 'draft' | 'profile' | 'parts' | 'coach-reply' | 'booking' | 'share-grant' | 'renderer' | 'canonical-score';
export type EvidenceKind = 'observation' | 'hypothesis' | 'user-authorship' | 'canonical-measurement';
export type AckCode =
  | 'idle' | 'in-progress' | 'checking' | 'confirmed-by-server' | 'saved-on-device' | 'loaded-on-device'
  | 'already-confirmed' | 'not-completed' | 'not-saved' | 'cancelled';
export type Ignored = 'stale' | 'not-in-flight' | 'too-early' | 'nothing-to-do' | null;
export interface Step<S> { state: S; ignored: Ignored; }

export interface RetryPolicy { maxAttempts: number; baseDelayMs: number; maxDelayMs: number; attemptBudgetMs: number; }
export const DEFAULT_RETRY_POLICY: RetryPolicy = { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 4000, attemptBudgetMs: 15000 };
const TERMINAL: ReadonlyArray<FailureKind> = ['quota', 'blocked', 'rejected', 'conflict', 'expired', 'revoked'];

export type RequestState =
  | { status: 'idle' }
  | { status: 'pending'; requestId: string; effect: EffectClass; key: string | null; attempt: number; deadline: number }
  | { status: 'backoff'; requestId: string; effect: EffectClass; key: string | null; attempt: number; retryAt: number }
  | { status: 'unknown'; requestId: string; effect: EffectClass; key: string | null; attempt: number }
  | { status: 'confirmed'; requestId: string; basis: Basis; duplicate: boolean }
  | { status: 'failed'; requestId: string; failure: FailureKind; retry: RetryHint }
  | { status: 'cancelled'; requestId: string };

export type RequestEvent =
  | { type: 'start'; requestId: string; effect: EffectClass; key?: string | null; online: boolean; now: number }
  | { type: 'attemptFailed'; requestId: string; failure: FailureKind; now: number }
  | { type: 'succeeded'; requestId: string; basis: Basis; duplicate?: boolean }
  | { type: 'retryDue'; requestId: string; now: number }
  | { type: 'tick'; now: number }
  | { type: 'reconciled'; requestId: string; found: boolean }
  | { type: 'cancel'; requestId: string };

type Pending = Extract<RequestState, { status: 'pending' }>;
const idOf = (s: RequestState): string | null => (s.status === 'idle' ? null : s.requestId);
const miss = (state: RequestState): Step<RequestState> => ({ state, ignored: 'not-in-flight' });
const backoffDelay = (attempt: number, p: RetryPolicy): number => Math.min(p.maxDelayMs, p.baseDelayMs * 2 ** (attempt - 1));

function afterFailure(s: Pending, failure: FailureKind, now: number, policy: RetryPolicy): RequestState {
  const { requestId, effect, key, attempt } = s;
  if (failure === 'offline') return { status: 'failed', requestId, failure, retry: 'when-online' };
  if (TERMINAL.includes(failure)) {
    return { status: 'failed', requestId, failure, retry: failure === 'quota' || failure === 'blocked' ? 'user' : 'none' };
  }
  const ambiguous = failure === 'timeout' || failure === 'unavailable';
  // Effect-aware: an ambiguous outcome of a write with no idempotency key may already have landed. Do not re-send.
  if (ambiguous && effect === 'non-idempotent-write' && key === null) return { status: 'unknown', requestId, effect, key, attempt };
  if (attempt < policy.maxAttempts) {
    return { status: 'backoff', requestId, effect, key, attempt, retryAt: now + backoffDelay(attempt, policy) };
  }
  return { status: 'failed', requestId, failure, retry: ambiguous || failure === 'verify-failed' ? 'user' : 'none' };
}

/** One request. Late events for an earlier request id are "stale"; events after cancel are "not-in-flight". */
export function reduceRequest(state: RequestState, event: RequestEvent, policy: RetryPolicy = DEFAULT_RETRY_POLICY): Step<RequestState> {
  if (event.type === 'start') {
    const key = event.key ?? null;
    if (!event.online) return { state: { status: 'failed', requestId: event.requestId, failure: 'offline', retry: 'when-online' }, ignored: null };
    const deadline = event.now + policy.attemptBudgetMs;
    return { state: { status: 'pending', requestId: event.requestId, effect: event.effect, key, attempt: 1, deadline }, ignored: null };
  }
  if (event.type === 'tick') {
    if (state.status === 'pending' && event.now >= state.deadline) {
      return { state: afterFailure(state, 'timeout', event.now, policy), ignored: null };
    }
    return { state, ignored: 'not-in-flight' };
  }
  const id = idOf(state);
  if (id === null) return miss(state);
  if (event.requestId !== id) return { state, ignored: 'stale' };
  switch (event.type) {
    case 'attemptFailed':
      return state.status === 'pending' ? { state: afterFailure(state, event.failure, event.now, policy), ignored: null } : miss(state);
    case 'succeeded': {
      // A late success is honored (the server did confirm it) unless the person cancelled or it is already confirmed.
      if (state.status === 'cancelled' || state.status === 'confirmed') return miss(state);
      return { state: { status: 'confirmed', requestId: id, basis: event.basis, duplicate: event.duplicate === true }, ignored: null };
    }
    case 'retryDue': {
      if (state.status !== 'backoff') return miss(state);
      if (event.now < state.retryAt) return { state, ignored: 'too-early' };
      const next: Pending = { status: 'pending', requestId: id, effect: state.effect, key: state.key, attempt: state.attempt + 1, deadline: event.now + policy.attemptBudgetMs };
      return { state: next, ignored: null };
    }
    case 'reconciled': {
      if (state.status !== 'unknown') return miss(state);
      const next: RequestState = event.found
        ? { status: 'confirmed', requestId: id, basis: 'server-response', duplicate: false }
        : { status: 'failed', requestId: id, failure: 'timeout', retry: 'user' };
      return { state: next, ignored: null };
    }
    case 'cancel':
      return state.status === 'confirmed' ? miss(state) : { state: { status: 'cancelled', requestId: id }, ignored: null };
  }
}

/** Local pre-check before a booking request. The server response still decides; this only avoids an obvious duplicate or clash. */
export interface BusyRange { start: string; end: string; status: string; }
export type BookingPrecheck = { verdict: 'duplicate-of-confirmed' } | { verdict: 'conflict' } | { verdict: 'proceed' };
export function precheckBooking(input: { start: string; end: string; key: string; busy: ReadonlyArray<BusyRange>; confirmedKeys: ReadonlyArray<string> }): BookingPrecheck {
  if (input.confirmedKeys.includes(input.key)) return { verdict: 'duplicate-of-confirmed' };
  // Same half-open rule as core/booking.ts overlaps; not imported because booking.ts loads Firebase at runtime.
  // pending and approved hold a slot; declined and cancelled release it (core/booking.ts release rule).
  const clash = input.busy.some((b) => (b.status === 'pending' || b.status === 'approved') && input.start < b.end && b.start < input.end);
  return clash ? { verdict: 'conflict' } : { verdict: 'proceed' };
}

/** Save verification. A save counts only when the read-back equals what was written. */
export interface WriteObservation { expected: string; readBack: string | null; error?: unknown; }
export type SaveOutcome = { ok: true } | { ok: false; reason: SaveFailure | 'verify-failed' };
export function verifyWrite(o: WriteObservation): SaveOutcome {
  if (o.error !== undefined && o.error !== null) return { ok: false, reason: saveFailure(o.error) };
  return o.readBack === o.expected ? { ok: true } : { ok: false, reason: 'verify-failed' };
}

/** Draft persistence. A failed save keeps the edited draft. Only a verified save reaches "saved". */
export type PersistState =
  | { status: 'clean' }
  | { status: 'dirty'; draft: string }
  | { status: 'saving'; draft: string; attempt: number }
  | { status: 'saved'; draft: string; savedAt: number }
  | { status: 'failed'; draft: string; reason: SaveFailure | 'verify-failed'; attempt: number };
export type PersistEvent =
  | { type: 'edit'; draft: string }
  | { type: 'saveStart' }
  | { type: 'saveResult'; outcome: SaveOutcome; now: number }
  | { type: 'discard' };

export function reducePersist(state: PersistState, event: PersistEvent): Step<PersistState> {
  switch (event.type) {
    case 'edit':
      if (state.status === 'saved' && state.draft === event.draft) return { state, ignored: null };
      return { state: { status: 'dirty', draft: event.draft }, ignored: null };
    case 'saveStart':
      if (state.status === 'dirty') return { state: { status: 'saving', draft: state.draft, attempt: 1 }, ignored: null };
      if (state.status === 'failed') return { state: { status: 'saving', draft: state.draft, attempt: state.attempt + 1 }, ignored: null };
      return { state, ignored: 'nothing-to-do' };
    case 'saveResult': {
      // A result for a draft that was edited while saving arrives in state "dirty" and is ignored.
      if (state.status !== 'saving') return { state, ignored: 'not-in-flight' };
      const outcome = event.outcome;
      if (outcome.ok === true) return { state: { status: 'saved', draft: state.draft, savedAt: event.now }, ignored: null };
      const failed: PersistState = { status: 'failed', draft: state.draft, reason: outcome.reason, attempt: state.attempt };
      return { state: failed, ignored: null };
    }
    case 'discard':
      return state.status === 'dirty' || state.status === 'failed' ? { state: { status: 'clean' }, ignored: null } : { state, ignored: 'nothing-to-do' };
  }
}

/** Offline-aware read. A local copy is labelled as unverified, never as current. */
export interface ReadResolution { source: 'remote' | 'local' | 'none'; freshness: 'current' | 'local-unverified' | 'local-offline' | 'unavailable'; }
export function resolveRead(input: { online: boolean; remote: 'ok' | 'failed' | 'not-attempted'; hasLocal: boolean }): ReadResolution {
  if (input.online && input.remote === 'ok') return { source: 'remote', freshness: 'current' };
  if (input.hasLocal) return { source: 'local', freshness: input.online ? 'local-unverified' : 'local-offline' };
  return { source: 'none', freshness: 'unavailable' };
}

const SUBJECT_EVIDENCE: Record<Subject, EvidenceKind> = {
  draft: 'user-authorship', profile: 'user-authorship', parts: 'user-authorship', 'coach-reply': 'hypothesis',
  booking: 'observation', 'share-grant': 'observation', renderer: 'observation', 'canonical-score': 'canonical-measurement',
};
export const evidenceOf = (subject: Subject): EvidenceKind => SUBJECT_EVIDENCE[subject];
/** Canonical 64/147 scores are read-only in every status path. */
export const canWrite = (subject: Subject): boolean => subject !== 'canonical-score';

/** Revocation acknowledgement. Previously copied or viewed material is never recalled, so that stays true in every code. */
export type RevokeCode = 'server-revoked' | 'removed-on-device' | 'not-revoked';
export function revokeAck(input: { remote: 'confirmed' | 'failed' | 'unknown'; localRemoved: boolean }): { code: RevokeCode; copiesMayRemain: true } {
  if (input.remote === 'confirmed') return { code: 'server-revoked', copiesMayRemain: true };
  if (input.localRemoved) return { code: 'removed-on-device', copiesMayRemain: true };
  return { code: 'not-revoked', copiesMayRemain: true };
}
/** Client-side mirror of a revoked grant, using the existing access rules. Server rules still decide. */
export function accessAfterRevoke(relationship: Relationship, actorRole: Role, action: AccessAction): AccessDecision {
  const revoked = setLinkState(relationship, 'revoked');
  const actorUid = actorRole === 'client' ? revoked.clientUid : revoked.therapistUid;
  return decideAccess({ actorUid, actorRole, action, relationship: revoked });
}

export function requestAck(s: RequestState): AckCode {
  switch (s.status) {
    case 'idle': return 'idle';
    case 'pending': case 'backoff': return 'in-progress';
    case 'unknown': return 'checking';
    case 'confirmed':
      if (s.duplicate) return 'already-confirmed';
      return s.basis === 'read-back' ? 'saved-on-device' : s.basis === 'local-load' ? 'loaded-on-device' : 'confirmed-by-server';
    case 'failed': return 'not-completed';
    case 'cancelled': return 'cancelled';
  }
}

export function persistAck(s: PersistState): AckCode {
  switch (s.status) {
    case 'clean': return 'idle';
    case 'dirty': case 'failed': return 'not-saved';
    case 'saving': return 'in-progress';
    case 'saved': return 'saved-on-device';
  }
}
