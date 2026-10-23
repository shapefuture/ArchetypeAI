// E15 human-session continuity: consent-bounded preparation and session lifecycle transitions
// (ArchetypeAI-mgby, step 04). The recovery cases of ArchetypeAI-5cuk (step 07) are tested in the spec.
// Pure: no React, DOM, network, storage or clock reads. `now` is always injected.
// Reuses booking.ts (freeSlots, slotOccurrences, AppointmentStatus) and therapist-access.ts (decideAccess).
// Rules: an agenda stays a local draft until the client confirms the exact previewed scope; a therapist reads
// shared items only at read time, so a revoked link wins even after confirmation; requested is not confirmed;
// the client's own withdrawal (cancel, time acknowledgement, next step) never needs a live link; only the
// client's chosen next step is retained.
// NOT done: screens (step 05), wiring to the booking service, Firestore rules and the coach (step 06), evidence and
// acceptance (steps 10-12). Next-step retention has no reviewed contract: it is 'pending-contract'. Slot conflicts
// for a therapist time change belong to the booking transaction.

import { freeSlots, slotOccurrences, type AppointmentStatus, type AvailabilityWindow, type BusyInterval } from '../core/booking';
import { decideAccess, type AccessDecision, type Relationship } from '../core/therapist-access';

export type SessionPhase = 'requested' | 'confirmed' | 'declined' | 'cancelled';
export type SessionView = 'requested' | 'confirmed' | 'time-changed' | 'declined' | 'cancelled';
export type Outcome = 'not-recorded' | 'held' | 'absent';
export type Role = 'client' | 'therapist';
export type Timing = 'before-start' | 'after-start' | 'unknown';
type AccessDeny = Extract<AccessDecision, { allowed: false }>['reason'];
export type Denial = AccessDeny | 'stale-version' | 'invalid-transition' | 'invalid-time' | 'too-early'
  | 'timing-unknown' | 'post-session-only' | 'empty-next-step' | 'empty-scope' | 'stale-preview'
  | 'consent-mismatch' | 'slot-unavailable';
export type Step<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: Denial };
export interface Actor { readonly uid: string; readonly role: Role; }

export interface SessionRecord {
  readonly appointmentId: string;
  readonly clientUid: string;
  readonly therapistUid: string;
  readonly phase: SessionPhase;
  /** Wall-clock YYYY-MM-DDTHH:mm in `timeZone`: the booking echo (observation from the booking record). */
  readonly start: string;
  readonly timeZone: string;
  /** The start the client last acknowledged; differs from `start` after an unacknowledged time change. */
  readonly ackedStart: string | null;
  readonly outcome: Outcome;
  /** Client-chosen (user-authored); only settable after an outcome is recorded. */
  readonly nextStep: string | null;
  readonly version: number;
}

const fail = (reason: Denial): { readonly ok: false; readonly reason: Denial } => ({ ok: false, reason });
function ok<T>(value: T): { readonly ok: true; readonly value: T } { return { ok: true, value }; }
const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const PHASE_OF: Record<AppointmentStatus, SessionPhase> = { pending: 'requested', approved: 'confirmed', declined: 'declined', cancelled: 'cancelled' };

/** Booking status to session phase: a pending booking is a request; only an approved one is confirmed. */
export function phaseFromAppointmentStatus(status: AppointmentStatus): SessionPhase { return PHASE_OF[status]; }

/** Link-level denial from decideAccess. A missing report grant is not a link problem for lifecycle actions. */
function linkDenial(actor: Actor, record: SessionRecord, rel: Relationship | null): Denial | null {
  if (!rel || rel.clientUid !== record.clientUid || rel.therapistUid !== record.therapistUid) return 'no-relationship';
  const probe = decideAccess({ actorUid: actor.uid, actorRole: actor.role, action: actor.role === 'client' ? 'read-report' : 'read-client-map', relationship: rel });
  if (probe.allowed === false && probe.reason !== 'report-not-granted') return probe.reason;
  return null;
}

/** Trims, drops blanks and repeats. A local draft only: nothing is sent, shared or stored here. */
export interface AgendaDraft { readonly appointmentId: string; readonly status: 'draft' | 'empty'; readonly items: ReadonlyArray<string>; }
export function prepareAgenda(appointmentId: string, rawItems: ReadonlyArray<string>): AgendaDraft {
  const items = [...new Set(rawItems.map((s) => s.trim()).filter((s) => s.length > 0))];
  return { appointmentId, status: items.length > 0 ? 'draft' : 'empty', items };
}

/** Categories never part of a session share unless a later reviewed contract adds them. */
export const NOT_INCLUDED = ['canonical-measurement', 'coach-context', 'general-journal'] as const;

export interface ShareItem { readonly id: 'agenda' | 'discussion-note'; readonly provenance: 'user-authored'; readonly values: ReadonlyArray<string>; }
export interface SharePreview {
  readonly appointmentId: string;
  readonly items: ReadonlyArray<ShareItem>;
  /** Binds any later confirmation to exactly this content. */
  readonly scopeKey: string;
  readonly notIncluded: typeof NOT_INCLUDED;
}

/** The exact scope a therapist would see. The key goes stale when any previewed value changes. */
export function previewShare(agenda: AgendaDraft, discussionNote: string | null): SharePreview {
  const note = (discussionNote ?? '').trim();
  const items: ShareItem[] = [];
  if (agenda.items.length > 0) items.push({ id: 'agenda', provenance: 'user-authored', values: agenda.items });
  if (note.length > 0) items.push({ id: 'discussion-note', provenance: 'user-authored', values: [note] });
  return { appointmentId: agenda.appointmentId, items, scopeKey: JSON.stringify([agenda.appointmentId, items]), notIncluded: NOT_INCLUDED };
}

export interface ConfirmedShare {
  readonly status: 'confirmed'; readonly appointmentId: string; readonly clientUid: string; readonly therapistUid: string;
  readonly scopeKey: string; readonly items: ReadonlyArray<ShareItem>; readonly confirmedAt: string;
}

/** Only the client confirms, on a live link, for the exact scope shown, with each item consented to separately. */
export function confirmShare(input: {
  readonly preview: SharePreview; readonly record: SessionRecord; readonly actor: Actor; readonly relationship: Relationship | null;
  readonly scopeKey: string; readonly consented: ReadonlyArray<ShareItem['id']>; readonly now: Date;
}): Step<ConfirmedShare> {
  const { preview, record, actor } = input;
  if (actor.role !== 'client' || actor.uid !== record.clientUid) return fail('wrong-account');
  if (record.phase !== 'requested' && record.phase !== 'confirmed') return fail('invalid-transition');
  const link = linkDenial(actor, record, input.relationship);
  if (link) return fail(link);
  if (preview.appointmentId !== record.appointmentId || input.scopeKey !== preview.scopeKey) return fail('stale-preview');
  if (preview.items.length === 0) return fail('empty-scope');
  const want = preview.items.map((i) => i.id).sort().join(',');
  if (want !== [...new Set(input.consented)].sort().join(',')) return fail('consent-mismatch');
  return ok<ConfirmedShare>({
    status: 'confirmed', appointmentId: record.appointmentId, clientUid: record.clientUid, therapistUid: record.therapistUid,
    scopeKey: preview.scopeKey, items: preview.items, confirmedAt: input.now.toISOString(),
  });
}

/** A confirmed session whose start the client has not acknowledged is a time change awaiting the client. */
export function sessionView(r: SessionRecord): SessionView {
  if (r.phase !== 'confirmed') return r.phase;
  return r.ackedStart === r.start ? 'confirmed' : 'time-changed';
}

/** Whether the start has passed, in the session's own zone. Repeated (ambiguous) wall times stay unknown. */
export function startTiming(r: SessionRecord, now: Date): Timing {
  const occurrences = slotOccurrences(r.start, r.timeZone, now);
  if (occurrences.length === 0) return 'unknown';
  if (occurrences.every((o) => o.offered)) return 'before-start';
  return occurrences.every((o) => !o.offered) ? 'after-start' : 'unknown';
}

export interface TherapistSessionView {
  readonly status: SessionView; readonly statusProvenance: 'observation'; readonly start: string; readonly outcome: Outcome;
  readonly sharedItems: ReadonlyArray<ShareItem>; readonly withheld: Denial | 'not-confirmed' | null;
}

/** A therapist sees booking status and the confirmed, granted items only. Never the client's private next step. */
export function therapistSessionView(input: {
  readonly record: SessionRecord; readonly relationship: Relationship | null; readonly share: ConfirmedShare | null;
}): Step<TherapistSessionView> {
  const { record, relationship, share } = input;
  const link = linkDenial({ uid: record.therapistUid, role: 'therapist' }, record, relationship);
  if (link) return fail(link);
  const base = { status: sessionView(record), statusProvenance: 'observation' as const, start: record.start, outcome: record.outcome };
  if (!share || share.appointmentId !== record.appointmentId) return ok<TherapistSessionView>({ ...base, sharedItems: [], withheld: 'not-confirmed' });
  const probe = decideAccess({ actorUid: record.therapistUid, actorRole: 'therapist', action: 'read-report', relationship });
  if (probe.allowed === false) return ok<TherapistSessionView>({ ...base, sharedItems: [], withheld: probe.reason });
  return ok<TherapistSessionView>({ ...base, sharedItems: share.items, withheld: null });
}

export interface RequestInput {
  readonly appointmentId: string; readonly actor: Actor; readonly relationship: Relationship | null;
  readonly availability: AvailabilityWindow[]; readonly booked: BusyInterval[];
  readonly start: string; readonly timeZone: string; readonly now: Date;
}

/** A client request: creates a requested session only. The therapist's approval makes it confirmed. */
export function requestSession(input: RequestInput): Step<SessionRecord> {
  const rel = input.relationship;
  if (input.actor.role !== 'client' || !rel) return fail(rel ? 'wrong-account' : 'no-relationship');
  const access = decideAccess({ actorUid: input.actor.uid, actorRole: 'client', action: 'book', relationship: rel });
  if (access.allowed === false) return fail(access.reason);
  const free = freeSlots(input.availability, input.booked, input.start.slice(0, 10), input.now, { timeZone: input.timeZone });
  if (!free.includes(input.start)) return fail('slot-unavailable');
  const record: SessionRecord = {
    appointmentId: input.appointmentId, clientUid: rel.clientUid, therapistUid: rel.therapistUid, phase: 'requested',
    start: input.start, timeZone: input.timeZone, ackedStart: input.start, outcome: 'not-recorded', nextStep: null, version: 0,
  };
  return ok(record);
}

export type SessionEvent =
  | { readonly type: 'approve' } | { readonly type: 'decline' } | { readonly type: 'change-time'; readonly start: string }
  | { readonly type: 'acknowledge-time' } | { readonly type: 'cancel' }
  | { readonly type: 'record-outcome'; readonly outcome: 'held' | 'absent' }
  | { readonly type: 'save-next-step'; readonly text: string } | { readonly type: 'delete-next-step' };

const ROLE_FOR: Record<SessionEvent['type'], Role | 'either'> = {
  approve: 'therapist', decline: 'therapist', 'change-time': 'therapist',
  'acknowledge-time': 'client', 'save-next-step': 'client', 'delete-next-step': 'client',
  cancel: 'either', 'record-outcome': 'either',
};

export interface TransitionInput {
  readonly record: SessionRecord; readonly event: SessionEvent; readonly actor: Actor;
  readonly relationship: Relationship | null; readonly expectedVersion: number; readonly now: Date;
}

/** Returns a new record or a denial. The input is never mutated, so an interrupted save keeps the prior state. */
export function transition(input: TransitionInput): Step<SessionRecord> {
  const { record: r, event: e, actor, now } = input;
  if (input.expectedVersion !== r.version) return fail('stale-version');
  const allowedRole = ROLE_FOR[e.type];
  if (allowedRole !== 'either' && allowedRole !== actor.role) return fail('wrong-account');
  if (actor.uid !== (actor.role === 'client' ? r.clientUid : r.therapistUid)) return fail('wrong-account');
  if (actor.role === 'therapist') {
    const link = linkDenial(actor, r, input.relationship);
    if (link) return fail(link);
  }
  const next = (patch: Partial<SessionRecord>): Step<SessionRecord> => ok<SessionRecord>({ ...r, ...patch, version: r.version + 1 });
  switch (e.type) {
    case 'approve': return r.phase === 'requested' ? next({ phase: 'confirmed' }) : fail('invalid-transition');
    case 'decline': return r.phase === 'requested' ? next({ phase: 'declined' }) : fail('invalid-transition');
    case 'change-time':
      if (!WALL_CLOCK.test(e.start) || e.start === r.start) return fail('invalid-time');
      return r.phase === 'requested' || r.phase === 'confirmed' ? next({ start: e.start }) : fail('invalid-transition');
    case 'acknowledge-time':
      return r.phase === 'confirmed' && r.start !== r.ackedStart ? next({ ackedStart: r.start }) : fail('invalid-transition');
    case 'cancel':
      return r.phase === 'requested' || r.phase === 'confirmed' ? next({ phase: 'cancelled' }) : fail('invalid-transition');
    case 'record-outcome': {
      if (sessionView(r) !== 'confirmed' || r.outcome !== 'not-recorded') return fail('invalid-transition');
      const timing = startTiming(r, now);
      if (timing === 'unknown') return fail('timing-unknown');
      return timing === 'after-start' ? next({ outcome: e.outcome }) : fail('too-early');
    }
    case 'save-next-step': {
      if (r.phase !== 'confirmed') return fail('invalid-transition');
      if (r.outcome === 'not-recorded') return fail('post-session-only');
      const text = e.text.trim();
      return text.length > 0 ? next({ nextStep: text }) : fail('empty-next-step');
    }
    case 'delete-next-step': return next({ nextStep: null });
    default: return fail('invalid-transition');
  }
}

export const NEXT_STEP_RETENTION = 'pending-contract' as const;

export interface RetainedSessionRecord {
  readonly appointmentId: string; readonly clientUid: string; readonly therapistUid: string; readonly start: string;
  readonly timeZone: string; readonly phase: SessionPhase; readonly outcome: Outcome; readonly nextStep: string;
  readonly provenance: { readonly phase: 'observation'; readonly nextStep: 'user-authored' };
  readonly retention: typeof NEXT_STEP_RETENTION;
}

/** Keeps only the client's chosen next step with minimal linkage. Null when the client chose none. */
export function retainedRecord(r: SessionRecord): RetainedSessionRecord | null {
  if (r.nextStep === null) return null;
  return {
    appointmentId: r.appointmentId, clientUid: r.clientUid, therapistUid: r.therapistUid, start: r.start, timeZone: r.timeZone,
    phase: r.phase, outcome: r.outcome, nextStep: r.nextStep,
    provenance: { phase: 'observation', nextStep: 'user-authored' }, retention: NEXT_STEP_RETENTION,
  };
}
