import { describe, expect, it, vi } from 'vitest';
import {
  EXPRESSIONS,
  FAMILY_ROLE,
  FELT_ROLES,
  GESTURES,
  IDLE_REQUESTS,
  MAX_GESTURE_PLAYS,
  authorRole,
  cancelRequest,
  gestureFor,
  gesturesMissingStaticEquivalent,
  limitGesture,
  muteGesture,
  normalizeAuthoredRole,
  normalizeLedger,
  recordGesture,
  selectFeltExpression,
  settleRequest,
  startRequest,
  type FeltAppState,
  type FeltExpression,
  type FeltGesture,
  type FeltMoment,
  type FeltSelection,
} from './e11-felt-expression';

const QUIET_STATE: FeltAppState = {
  arrival: 'loading', arrivalGreeted: false, selectedPart: null, authoredRole: null,
  bookmark: 'none', request: 'none', scoredItemActive: false,
};
const LIVELY: FeltMoment = { motion: 'lively', systemReducedMotion: false, ambience: { hidden: false, typing: false, error: false } };
const part = { id: 'p1', family: 'firefighter' as const };
const withState = (patch: Partial<FeltAppState>): FeltAppState => ({ ...QUIET_STATE, ...patch });

describe('E11.04 selectFeltExpression: expressions follow the actual app state', () => {
  it('greets once on a ready arrival and rests after the greeting is recorded', () => {
    expect(selectFeltExpression(withState({ arrival: 'ready' }), LIVELY)).toMatchObject({
      expression: 'greet', reason: 'arrival', basis: 'observation', staticEquivalent: 'greet',
    });
    expect(selectFeltExpression(withState({ arrival: 'ready', arrivalGreeted: true }), LIVELY).expression).toBe('rest');
  });

  it('follows requested, saved and selected states in a fixed priority order', () => {
    const table: Array<[string, Partial<FeltAppState>, FeltExpression]> = [
      ['denied request beats a saved bookmark and a selection', { request: 'denied', bookmark: 'saved', selectedPart: part }, 'steady'],
      ['failed request shows steady, not confirm', { request: 'failed', bookmark: 'saved' }, 'steady'],
      ['pending request shows wait over selection', { request: 'in-flight', selectedPart: part }, 'wait'],
      ['confirmed request shows confirm', { request: 'confirmed', bookmark: 'saved' }, 'confirm'],
      ['failed save shows steady, never keep', { bookmark: 'failed', selectedPart: part }, 'steady'],
      ['pending save shows wait', { bookmark: 'saving' }, 'wait'],
      ['saved bookmark shows keep over selection', { bookmark: 'saved', selectedPart: part }, 'keep'],
      ['selected part attends', { selectedPart: part }, 'attend'],
    ];
    for (const [label, patch, expected] of table) {
      expect(selectFeltExpression(withState(patch), LIVELY).expression, label).toBe(expected);
    }
  });

  it('a selected part attends with an observation pose and a hypothesis role from the authored family map', () => {
    expect(selectFeltExpression(withState({ selectedPart: part }), LIVELY)).toMatchObject({
      expression: 'attend', reason: 'part-selected', basis: 'observation', role: { id: 'guardian', basis: 'hypothesis' },
    });
    expect(FAMILY_ROLE).toEqual({ manager: 'steward', firefighter: 'guardian', exile: 'tender', resource: 'companion' });
  });

  it('an empty snapshot (arrival loading, nothing selected or saved) rests quietly with no role', () => {
    expect(selectFeltExpression(QUIET_STATE, LIVELY)).toEqual({
      expression: 'rest', reason: 'quiet', basis: 'observation', gesture: null, staticEquivalent: 'rest', role: null,
    });
  });

  it('a canonical scored item is neutral and still: no saved, selected or requested state changes it', () => {
    const busy: Partial<FeltAppState>[] = [
      { bookmark: 'saved' }, { selectedPart: part }, { request: 'confirmed' }, { arrival: 'ready' }, { request: 'failed', bookmark: 'failed' },
    ];
    for (const patch of busy) {
      const scored = selectFeltExpression(withState({ ...patch, scoredItemActive: true }), LIVELY);
      expect(scored, JSON.stringify(patch)).toMatchObject({
        expression: 'rest', reason: 'scored-item', basis: 'canonical-measurement', gesture: null, staticEquivalent: 'rest',
      });
    }
  });

  it('every gesture has a static equivalent, and a gap in a catalogue is reported', () => {
    expect(gesturesMissingStaticEquivalent()).toEqual([]);
    expect(GESTURES.every((gesture) => (EXPRESSIONS as ReadonlyArray<string>).includes(gesture.expression))).toBe(true);
    const broken: FeltGesture[] = [{ id: 'nod', expression: 'confirm', staticEquivalent: 'spin' as unknown as FeltExpression }];
    expect(gesturesMissingStaticEquivalent(broken)).toEqual(['nod']);
  });

  it('is deterministic and never reads randomness: the authored role set is fixed', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('random identity is not allowed'); });
    try {
      const first = selectFeltExpression(withState({ selectedPart: part }), LIVELY);
      expect(selectFeltExpression(withState({ selectedPart: part }), LIVELY)).toEqual(first);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
    expect(FELT_ROLES).toEqual(['steward', 'guardian', 'tender', 'companion']);
  });
});

describe('E11.07 recovery: interruption, reduced motion, recurrence, storage, concurrency and authority', () => {
  it('interrupted animation: suspended ambience (hidden, typing or error) keeps the still pose and the gesture restarts on resume', () => {
    const selected = withState({ selectedPart: part });
    for (const signal of ['hidden', 'typing', 'error'] as const) {
      const interrupted = selectFeltExpression(selected, { ...LIVELY, ambience: { hidden: false, typing: false, error: false, [signal]: true } });
      expect(interrupted, signal).toMatchObject({ expression: 'attend', gesture: null, staticEquivalent: 'attend' });
    }
    expect(selectFeltExpression(selected, LIVELY).gesture).toBe('tilt');
    expect(gestureFor('greet', { ...LIVELY, ambience: { hidden: true, typing: false, error: false } })).toBeNull();
  });

  it('reduced motion and the still preference remove gestures but keep the saved and selected poses', () => {
    const reduced = selectFeltExpression(withState({ selectedPart: part }), { ...LIVELY, systemReducedMotion: true });
    expect(reduced).toMatchObject({ expression: 'attend', gesture: null, staticEquivalent: 'attend' });
    const still = selectFeltExpression(withState({ bookmark: 'saved' }), { ...LIVELY, motion: 'still' });
    expect(still).toMatchObject({ expression: 'keep', gesture: null, staticEquivalent: 'keep' });
  });

  it('an interrupted request leaves no wait pose behind once it is cancelled', () => {
    const started = startRequest(IDLE_REQUESTS);
    const cancelled = cancelRequest(started.tracker);
    expect(cancelled.status).toBe('none');
    expect(selectFeltExpression(withState({ request: cancelled.status }), LIVELY).expression).not.toBe('wait');
  });

  it('concurrency: a stale or already-settled response is ignored and only the latest request settles', () => {
    const first = startRequest(IDLE_REQUESTS);
    const second = startRequest(first.tracker);
    expect(settleRequest(second.tracker, first.id, 'confirmed').status, 'stale id').toBe('in-flight');
    const denied = settleRequest(second.tracker, second.id, 'denied');
    expect(denied.status).toBe('denied');
    expect(settleRequest(denied, second.id, 'confirmed').status, 'already settled').toBe('denied');
    expect(settleRequest(cancelRequest(second.tracker), second.id, 'confirmed').status, 'cancelled').toBe('none');
  });

  it('unwanted recurrence: a gesture stops after the play limit or when muted, while the saved pose stays', () => {
    let ledger = normalizeLedger(null);
    const attend = selectFeltExpression(withState({ selectedPart: part }), LIVELY);
    for (let i = 0; i < MAX_GESTURE_PLAYS; i += 1) {
      const shown = limitGesture(attend, ledger);
      expect(shown.gesture).toBe('tilt');
      ledger = recordGesture(ledger, shown);
    }
    expect(limitGesture(attend, ledger)).toMatchObject({ expression: 'attend', gesture: null, staticEquivalent: 'attend' });

    const keep = selectFeltExpression(withState({ bookmark: 'saved' }), LIVELY);
    expect(limitGesture(keep, normalizeLedger(null)).gesture).toBe('bounce');
    expect(limitGesture(keep, muteGesture(normalizeLedger(null), 'bounce'))).toMatchObject({ expression: 'keep', gesture: null, staticEquivalent: 'keep' });
  });

  it('storage: malformed, foreign or oversized ledger data normalises without throwing', () => {
    expect(normalizeLedger('nonsense')).toEqual({ plays: {}, muted: [] });
    expect(normalizeLedger(null)).toEqual({ plays: {}, muted: [] });
    expect(normalizeLedger({ plays: { wave: 99, nod: -1, unknown: 4, tilt: 1.5 }, muted: ['sway', 'nope', 'sway'] }))
      .toEqual({ plays: { wave: MAX_GESTURE_PLAYS }, muted: ['sway'] });
  });

  it('storage: a failed bookmark save never shows keep, so no false success is presented', () => {
    const failed = selectFeltExpression(withState({ bookmark: 'failed', selectedPart: part }), LIVELY);
    expect(failed).toMatchObject({ expression: 'steady', reason: 'bookmark-failed' });
    expect(failed.expression).not.toBe('keep');
  });

  it('authority: a family hypothesis never replaces a role the person authored, and unknown roles are refused', () => {
    const authored = authorRole(withState({}), 'p1', 'tender');
    expect(selectFeltExpression({ ...authored, selectedPart: part }, LIVELY).role).toEqual({ id: 'tender', basis: 'user-authorship' });
    const otherPart: FeltSelection['role'] = selectFeltExpression({ ...authored, selectedPart: { id: 'p2', family: 'firefighter' } }, LIVELY).role;
    expect(otherPart).toEqual({ id: 'guardian', basis: 'hypothesis' });
    expect(authorRole(authored, 'p1', 'dragon' as never)).toBe(authored);
    expect(normalizeAuthoredRole({ partId: 'p1', role: 'dragon' })).toBeNull();
    expect(normalizeAuthoredRole({ partId: '', role: 'tender' })).toBeNull();
    expect(normalizeAuthoredRole({ partId: 'p1', role: 'tender' })).toEqual({ partId: 'p1', role: 'tender' });
  });
});
