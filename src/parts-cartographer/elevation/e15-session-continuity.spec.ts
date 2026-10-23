import { describe, expect, it } from 'vitest';
import type { Relationship } from '../core/therapist-access';
import {
  confirmShare, NOT_INCLUDED, phaseFromAppointmentStatus, prepareAgenda, previewShare, requestSession, retainedRecord,
  sessionView, startTiming, therapistSessionView, transition,
  type Actor, type SessionEvent, type SessionRecord, type Step,
} from './e15-session-continuity';

const AVAILABILITY = [{ days: [1, 2, 3, 4, 5, 6, 7], start: '09:00', end: '17:00', minutes: 60 }];
const BEFORE = new Date('2026-05-10T00:00:00Z');
const AFTER = new Date('2026-05-11T12:00:00Z');
const CLIENT: Actor = { uid: 'c1', role: 'client' };
const THERAPIST: Actor = { uid: 't1', role: 'therapist' };

function rel(over: Partial<Relationship> = {}): Relationship {
  return { therapistUid: 't1', clientUid: 'c1', state: 'linked', grants: { booking: true, report: true }, ...over };
}

function must(s: Step<SessionRecord>): SessionRecord {
  if (!s.ok) throw new Error(`unexpected denial: ${s.reason}`);
  return s.value;
}

function apply(record: SessionRecord, event: SessionEvent, actor: Actor, relationship: Relationship | null = rel(), now: Date = BEFORE): Step<SessionRecord> {
  return transition({ record, event, actor, relationship, expectedVersion: record.version, now });
}

/** A requested session for 2026-05-11 10:00 UTC (a Monday). */
function requested(): SessionRecord {
  return must(requestSession({
    appointmentId: 'a1', actor: CLIENT, relationship: rel(), availability: AVAILABILITY, booked: [],
    start: '2026-05-11T10:00', timeZone: 'UTC', now: BEFORE,
  }));
}

function confirmed(): SessionRecord {
  return must(apply(requested(), { type: 'approve' }, THERAPIST));
}

describe('E15 consent-bounded preparation', () => {
  it('prepares an agenda draft that is not shared until the exact scope is confirmed', () => {
    const draft = prepareAgenda('a1', ['  How to talk about money ', 'How to talk about money']);
    expect(draft.status).toBe('draft');
    expect(draft.items).toEqual(['How to talk about money']);
    const preview = previewShare(draft, null);
    expect(preview.items.map((i) => i.id)).toEqual(['agenda']);
    expect(preview.notIncluded).toEqual(NOT_INCLUDED);
    // Nothing reaches the therapist until the client confirms the previewed items.
    const record = confirmed();
    const view = must(therapistSessionView({ record, relationship: rel(), share: null }));
    expect(view.sharedItems).toEqual([]);
    expect(view.withheld).toBe('not-confirmed');
    expect(confirmShare({ preview, record, actor: CLIENT, relationship: rel(), scopeKey: preview.scopeKey, consented: [], now: BEFORE })).toEqual({ ok: false, reason: 'consent-mismatch' });
  });

  it('treats an empty agenda and an empty scope as empty states, not as a share', () => {
    const draft = prepareAgenda('a1', ['   ', '']);
    expect(draft.status).toBe('empty');
    const preview = previewShare(draft, '  ');
    expect(preview.items).toEqual([]);
    expect(confirmShare({ preview, record: confirmed(), actor: CLIENT, relationship: rel(), scopeKey: preview.scopeKey, consented: [], now: BEFORE })).toEqual({ ok: false, reason: 'empty-scope' });
  });

  it('rejects a confirmation whose scope key no longer matches the previewed scope', () => {
    const record = confirmed();
    const before = previewShare(prepareAgenda('a1', ['First question']), null);
    const after = previewShare(prepareAgenda('a1', ['First question', 'Second question']), null);
    // The client confirmed the first scope, then edited the agenda; the stale confirmation must not apply.
    const result = confirmShare({ preview: after, record, actor: CLIENT, relationship: rel(), scopeKey: before.scopeKey, consented: ['agenda'], now: BEFORE });
    expect(result).toEqual({ ok: false, reason: 'stale-preview' });
  });

  it('requests a session only through the booking grant and a free slot', () => {
    const base = { appointmentId: 'a1', actor: CLIENT, availability: AVAILABILITY, timeZone: 'UTC', now: BEFORE, start: '2026-05-11T10:00' };
    expect(requestSession({ ...base, relationship: rel({ grants: { booking: false, report: true } }), booked: [] })).toEqual({ ok: false, reason: 'booking-not-granted' });
    expect(requestSession({ ...base, relationship: rel(), booked: [], start: '2026-05-11T10:30' })).toEqual({ ok: false, reason: 'slot-unavailable' });
    const overlapping = [{ start: '2026-05-11T10:00', end: '2026-05-11T11:00', status: 'approved' }];
    expect(requestSession({ ...base, relationship: rel(), booked: overlapping })).toEqual({ ok: false, reason: 'slot-unavailable' });
    expect(must(requestSession({ ...base, relationship: rel(), booked: [] })).phase).toBe('requested');
  });

  it('distinguishes a requested session from a confirmed one', () => {
    expect(phaseFromAppointmentStatus('pending')).toBe('requested');
    expect(phaseFromAppointmentStatus('approved')).toBe('confirmed');
    const request = requested();
    expect(sessionView(request)).toBe('requested');
    expect(sessionView(confirmed())).toBe('confirmed');
  });

  it('shows a therapist time change as unconfirmed until the client acknowledges it', () => {
    const moved = must(apply(confirmed(), { type: 'change-time', start: '2026-05-11T11:00' }, THERAPIST));
    expect(sessionView(moved)).toBe('time-changed');
    expect(apply(moved, { type: 'acknowledge-time' }, THERAPIST)).toEqual({ ok: false, reason: 'wrong-account' });
    const acknowledged = must(apply(moved, { type: 'acknowledge-time' }, CLIENT));
    expect(sessionView(acknowledged)).toBe('confirmed');
  });

  it('lets a therapist read shared items only with a confirmed scope and a report grant', () => {
    const draft = prepareAgenda('a1', ['How to talk about money']);
    const preview = previewShare(draft, 'Bring the calendar');
    const record = confirmed();
    const share = confirmShare({ preview, record, actor: CLIENT, relationship: rel(), scopeKey: preview.scopeKey, consented: ['agenda', 'discussion-note'], now: BEFORE });
    if (!share.ok) throw new Error(share.reason);
    const view = must(therapistSessionView({ record, relationship: rel(), share: share.value }));
    expect(view.sharedItems.map((i) => i.id)).toEqual(['agenda', 'discussion-note']);
    expect(view.withheld).toBeNull();
    const noReport = must(therapistSessionView({ record, relationship: rel({ grants: { booking: true, report: false } }), share: share.value }));
    expect(noReport.sharedItems).toEqual([]);
    expect(noReport.withheld).toBe('report-not-granted');
  });

  it('retains only the client chosen next step after the session', () => {
    expect(retainedRecord(confirmed())).toBeNull();
    const held = must(apply(confirmed(), { type: 'record-outcome', outcome: 'held' }, THERAPIST, rel(), AFTER));
    const withStep = must(apply(held, { type: 'save-next-step', text: 'Try the boundary sentence once' }, CLIENT, rel(), AFTER));
    const kept = retainedRecord(withStep);
    expect(kept && Object.keys(kept).sort()).toEqual(['appointmentId', 'clientUid', 'nextStep', 'outcome', 'phase', 'provenance', 'retention', 'start', 'therapistUid', 'timeZone']);
    expect(kept?.nextStep).toBe('Try the boundary sentence once');
    expect(kept?.retention).toBe('pending-contract');
    expect(kept?.provenance).toEqual({ phase: 'observation', nextStep: 'user-authored' });
    expect(retainedRecord(must(apply(withStep, { type: 'delete-next-step' }, CLIENT, rel(), AFTER)))).toBeNull();
  });
});

describe('E15 session lifecycle recovery', () => {
  it('accepts a next step only from the client after an outcome is recorded', () => {
    const record = confirmed();
    expect(apply(record, { type: 'save-next-step', text: 'Call back' }, CLIENT, rel(), AFTER)).toEqual({ ok: false, reason: 'post-session-only' });
    const held = must(apply(record, { type: 'record-outcome', outcome: 'held' }, THERAPIST, rel(), AFTER));
    expect(apply(held, { type: 'save-next-step', text: 'Call back' }, THERAPIST, rel(), AFTER)).toEqual({ ok: false, reason: 'wrong-account' });
    expect(apply(held, { type: 'save-next-step', text: '   ' }, CLIENT, rel(), AFTER)).toEqual({ ok: false, reason: 'empty-next-step' });
  });

  it('records an absent outcome only after the start, and never on its own', () => {
    const record = confirmed();
    expect(apply(record, { type: 'record-outcome', outcome: 'absent' }, THERAPIST, rel(), BEFORE)).toEqual({ ok: false, reason: 'too-early' });
    // Quiet state: after the start with no outcome recorded, nothing changes automatically.
    expect(startTiming(record, AFTER)).toBe('after-start');
    expect(record.outcome).toBe('not-recorded');
    const absent = must(apply(record, { type: 'record-outcome', outcome: 'absent' }, CLIENT, rel(), AFTER));
    expect(absent.outcome).toBe('absent');
    expect(apply(absent, { type: 'record-outcome', outcome: 'held' }, THERAPIST, rel(), AFTER)).toEqual({ ok: false, reason: 'invalid-transition' });
  });

  it('keeps cancellation terminal and reachable for the client even after the link is revoked', () => {
    const revoked = rel({ state: 'revoked' });
    expect(apply(confirmed(), { type: 'cancel' }, THERAPIST, revoked)).toEqual({ ok: false, reason: 'revoked' });
    const cancelled = must(apply(confirmed(), { type: 'cancel' }, CLIENT, revoked));
    expect(cancelled.phase).toBe('cancelled');
    expect(apply(cancelled, { type: 'approve' }, THERAPIST)).toEqual({ ok: false, reason: 'invalid-transition' });
  });

  it('rejects a concurrent write made from a stale version', () => {
    const record = requested();
    const approvedFromTabA = must(transition({ record, event: { type: 'approve' }, actor: THERAPIST, relationship: rel(), expectedVersion: 0, now: BEFORE }));
    expect(approvedFromTabA.version).toBe(1);
    // The stored record is now version 1. A second writer that read version 0 tries to decline the same request.
    const declinedFromTabB = transition({ record: approvedFromTabA, event: { type: 'decline' }, actor: THERAPIST, relationship: rel(), expectedVersion: 0, now: BEFORE });
    expect(declinedFromTabB).toEqual({ ok: false, reason: 'stale-version' });
  });

  it('revokes therapist access even when a share was already confirmed, and keeps the client record intact', () => {
    const draft = prepareAgenda('a1', ['Ask about the timing']);
    const preview = previewShare(draft, null);
    const record = confirmed();
    const share = confirmShare({ preview, record, actor: CLIENT, relationship: rel(), scopeKey: preview.scopeKey, consented: ['agenda'], now: BEFORE });
    if (!share.ok) throw new Error(share.reason);
    expect(must(therapistSessionView({ record, relationship: rel(), share: share.value })).sharedItems).toHaveLength(1);
    // The link is revoked before the therapist opens the session again.
    expect(therapistSessionView({ record, relationship: rel({ state: 'revoked' }), share: share.value })).toEqual({ ok: false, reason: 'revoked' });
    // The client keeps their own record; the therapist's view above exposed nothing.
    expect(record.phase).toBe('confirmed');
    expect(confirmShare({ preview, record, actor: CLIENT, relationship: rel({ state: 'archived' }), scopeKey: preview.scopeKey, consented: ['agenda'], now: BEFORE })).toEqual({ ok: false, reason: 'archived' });
  });

  it('returns no session detail to a therapist without a live link, and refuses a wrong account', () => {
    const record = confirmed();
    expect(therapistSessionView({ record, relationship: null, share: null })).toEqual({ ok: false, reason: 'no-relationship' });
    expect(therapistSessionView({ record, relationship: rel({ state: 'archived' }), share: null })).toEqual({ ok: false, reason: 'archived' });
    const impostor: Actor = { uid: 'c2', role: 'client' };
    expect(apply(record, { type: 'cancel' }, impostor)).toEqual({ ok: false, reason: 'wrong-account' });
  });

  it('leaves the stored record untouched by any transition, so an interrupted save keeps the prior state', () => {
    const frozen = Object.freeze({ ...confirmed() });
    const snapshot = JSON.stringify(frozen);
    const result = apply(frozen, { type: 'record-outcome', outcome: 'held' }, THERAPIST, rel(), AFTER);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(frozen)).toBe(snapshot);
    const denied = apply(frozen, { type: 'cancel' }, THERAPIST, rel({ state: 'revoked' }));
    expect(denied.ok).toBe(false);
    expect(JSON.stringify(frozen)).toBe(snapshot);
  });
});
