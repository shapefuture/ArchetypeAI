import { describe, expect, it } from 'vitest';
import {
  emptyState, evaluateAction, eligibleProbes, loadOrEmpty, markUnhelpful, nextProbe, offerActions, parseState, RECOVERY,
  RECOVERY_CASES, recordObservation, rejectReading, type ActionOption, type E05State, type EvidenceKind, type Probe, type Reading, type Result,
} from './e05-uncertainty-action.ts';
import type { ExperimentCard } from '../core/experiment-outcome.ts';

const card = (action: string, authoredBy: 'user' | 'model' = 'model', prediction?: string): ExperimentCard =>
  ({ id: 'c', situation: 'Before agreeing to a request', action, prediction, authoredBy });

const readingA: Reading = { id: 'A', text: 'The pause gave me time to find my preference', kind: 'hypothesis', standing: 'open', sources: ['observation'] };
const readingB: Reading = { id: 'B', text: 'The pause eased pressure but left the choice unclear', kind: 'hypothesis', standing: 'open', sources: ['observation'] };
const shared: ActionOption = {
  id: 'pause', card: card('Ask for ten minutes before agreeing, then revisit'), reversible: true, modest: true,
  supports: ['A', 'B'], sources: ['observation'], review: { schemaValid: true, evidence: { id: 'rev-1', reviewedBy: 'app-review' } },
};
const probe: Probe = { id: 'p1', text: 'What, if anything, changed during the pause?', distinguishes: ['A', 'B'] };
const base = (): E05State => ({ ...emptyState(), readings: [readingA, readingB], actions: [shared], probes: [probe] });

function ok(r: Result): E05State {
  if (!r.ok) throw new Error(`refused: ${r.reason}`);
  return r.state;
}

describe('E05 reviewed action eligibility across alternative explanations', () => {
  it('offers the one modest action two plausible readings share, and withholds one that serves only one reading', () => {
    const s = base();
    const offer = offerActions(s, { quiet: false });
    expect(offer.status).toBe('offered');
    expect(offer.offered.map((a) => a.id)).toEqual(['pause']);
    expect(evaluateAction(s, { ...shared, id: 'only-a', supports: ['A'] })).toEqual({ verdict: 'refused', reason: 'not-robust' });
  });

  it('an observation that points to one reading leans it, returns the other to open, and confirms neither', () => {
    const r = recordObservation(base(), { id: 'o1', probeId: 'p1', outcome: 'points-to', pointsTo: 'A', note: 'It did get clearer' }, 'user', 0);
    const s = ok(r);
    expect(s.readings.map((x) => x.standing)).toEqual(['leaning', 'open']);
    expect(s.observations[0]).toMatchObject({ kind: 'observation', outcome: 'points-to', pointsTo: 'A', note: 'It did get clearer' });
    expect(recordObservation(base(), { id: 'o2', probeId: 'p1', outcome: 'points-to', pointsTo: 'Z' }, 'user', 0))
      .toEqual({ ok: false, reason: 'invalid-pointer' });
  });

  it('inconclusive and contradictory outcomes never confirm a reading or become causal proof', () => {
    const inconclusive = ok(recordObservation(base(), { id: 'o1', probeId: 'p1', outcome: 'inconclusive', note: 'Not sure' }, 'user', 0));
    expect(inconclusive.readings.map((x) => x.standing)).toEqual(['open', 'open']);
    expect(inconclusive.observations[0].pointsTo).toBeNull();
    expect(offerActions(inconclusive, { quiet: false }).offered).toHaveLength(1);

    const leaning = ok(recordObservation(base(), { id: 'o1', probeId: 'p1', outcome: 'points-to', pointsTo: 'A' }, 'user', 0));
    const contradictory = ok(recordObservation(leaning, { id: 'o2', probeId: 'p1', outcome: 'contradictory', note: 'Both more and less' }, 'user', 1));
    expect(contradictory.readings.map((x) => x.standing)).toEqual(['open', 'open']);
    expect(contradictory.observations.map((o) => o.outcome)).toEqual(['points-to', 'contradictory']);
  });

  it('empty: with no readings, or with every reading rejected, nothing is offered', () => {
    expect(offerActions(emptyState(), { quiet: false })).toEqual({ status: 'no-readings', offered: [], withheld: [] });
    const once = ok(rejectReading(base(), 'A', 'user', 0));
    const all = ok(rejectReading(once, 'B', 'user', 1));
    expect(offerActions(all, { quiet: false }).status).toBe('no-readings');
    expect(rejectReading(all, 'A', 'user', 2)).toEqual({ ok: false, reason: 'invalid-input' });
  });

  it('denied: overclaiming, irreversible or large actions are refused with a plain reason', () => {
    const s = base();
    expect(evaluateAction(s, { ...shared, card: card('You are an anxious person, so step back') }).reason).toBe('overclaim');
    expect(evaluateAction(s, { ...shared, reversible: false }).reason).toBe('not-reversible');
    expect(evaluateAction(s, { ...shared, modest: false }).reason).toBe('not-modest');
  });

  it('canonical measurements are refused as a basis, even for the person\'s own action, and are never a reading', () => {
    const s = base();
    const canonicalReading: Reading = { ...readingB, sources: ['canonical-measurement'] as EvidenceKind[] };
    expect(evaluateAction({ ...s, readings: [readingA, canonicalReading] }, shared).reason).toBe('canonical-basis');
    expect(evaluateAction(s, { ...shared, sources: ['canonical-measurement'] }).reason).toBe('canonical-basis');
    const mine: ActionOption = { ...shared, id: 'mine', card: card('Write one sentence', 'user'), sources: ['canonical-measurement'] };
    expect(evaluateAction(s, mine).reason).toBe('canonical-basis');
    expect(s.readings.every((r) => r.sources.every((k) => k !== 'canonical-measurement'))).toBe(true);
  });

  it('model-authored actions need app review first, while the person\'s own action is their choice', () => {
    const s = base();
    expect(evaluateAction(s, { ...shared, id: 'u', review: { schemaValid: true, evidence: null } }))
      .toEqual({ verdict: 'needs-review', reason: 'needs-review' });
    expect(evaluateAction(s, { ...shared, id: 'b', review: { schemaValid: false, evidence: { id: 'x', reviewedBy: 'app-review' } } }).reason)
      .toBe('schema-refused');
    const mine: ActionOption = { ...shared, id: 'mine', card: card('Write one sentence before I answer', 'user'), supports: [], review: { schemaValid: false, evidence: null } };
    expect(evaluateAction(s, mine)).toEqual({ verdict: 'eligible', reason: 'user-choice' });
  });

  it('quiet presentation shows at most one action and asks no probe', () => {
    const second: ActionOption = { ...shared, id: 'sentence', card: card('Write one sentence before agreeing') };
    const s = { ...base(), actions: [shared, second] };
    expect(offerActions(s, { quiet: false }).offered).toHaveLength(2);
    expect(offerActions(s, { quiet: true }).offered).toHaveLength(1);
    expect(nextProbe(s, { quiet: true })).toBeNull();
    expect(nextProbe(s, { quiet: false })?.id).toBe('p1');
  });

  it('two writers from the same revision: the second is refused and the base state is never mutated', () => {
    const s = base();
    const first = recordObservation(s, { id: 'o1', probeId: 'p1', outcome: 'points-to', pointsTo: 'B' }, 'user', 0);
    expect(first.ok).toBe(true);
    // The second writer still holds revision 0 after the first write moved the state to revision 1.
    const second = recordObservation(ok(first), { id: 'o2', probeId: 'p1', outcome: 'inconclusive' }, 'user', 0);
    expect(second).toEqual({ ok: false, reason: 'stale-revision' });
    expect(s.observations).toHaveLength(0);
  });

  it('only the person can answer a probe, reject a reading or mark an action unhelpful', () => {
    const s = base();
    expect(recordObservation(s, { id: 'o1', probeId: 'p1', outcome: 'inconclusive' }, 'model', 0)).toEqual({ ok: false, reason: 'not-authorized' });
    expect(rejectReading(s, 'A', 'model', 0)).toEqual({ ok: false, reason: 'not-authorized' });
    expect(markUnhelpful(s, 'pause', 'model', 0)).toEqual({ ok: false, reason: 'not-authorized' });
  });

  it('recovery, inconclusive result: the next untried probe is offered, then the inquiry rests quietly', () => {
    const p2: Probe = { id: 'p2', text: 'Did the pressure ease, while the choice stayed unclear?', distinguishes: ['A', 'B'] };
    let s: E05State = { ...base(), probes: [probe, p2] };
    s = ok(recordObservation(s, { id: 'o1', probeId: 'p1', outcome: 'inconclusive' }, 'user', 0));
    expect(nextProbe(s, { quiet: false })?.id).toBe('p2');
    s = ok(recordObservation(s, { id: 'o2', probeId: 'p2', outcome: 'not-recorded' }, 'user', 1));
    expect(nextProbe(s, { quiet: false })).toBeNull();
    expect(eligibleProbes(s)).toHaveLength(0);
    expect(s.readings.every((r) => r.standing === 'open')).toBe(true);
  });

  it('recovery, unhelpful suggestion: that action is withdrawn alone, with no penalty, and another eligible action remains', () => {
    const second: ActionOption = { ...shared, id: 'sentence', card: card('Write one sentence before agreeing') };
    const s = { ...base(), actions: [shared, second] };
    const marked = ok(markUnhelpful(s, 'pause', 'user', 0));
    const offer = offerActions(marked, { quiet: false });
    expect(offer.offered.map((a) => a.id)).toEqual(['sentence']);
    expect(offer.withheld).toEqual([{ id: 'pause', reason: 'unhelpful' }]);
    expect(marked.readings).toEqual(s.readings);
  });

  it('recovery, interrupted probe: a refused write leaves it pending, and resuming records it exactly once', () => {
    const s = base();
    expect(recordObservation(s, { id: 'o1', probeId: 'p1', outcome: 'points-to', pointsTo: 'A' }, 'user', 7)).toEqual({ ok: false, reason: 'stale-revision' });
    expect(nextProbe(s, { quiet: false })?.id).toBe('p1');
    const resumed = ok(recordObservation(s, { id: 'o1', probeId: 'p1', outcome: 'points-to', pointsTo: 'A' }, 'user', 0));
    expect(resumed.observations).toHaveLength(1);
    expect(recordObservation(resumed, { id: 'o1', probeId: 'p1', outcome: 'inconclusive' }, 'user', 1)).toEqual({ ok: false, reason: 'invalid-input' });
    expect(nextProbe(resumed, { quiet: false })).toBeNull();
  });

  it('recovery, storage: malformed stored state never throws and falls back to empty; a valid state round-trips', () => {
    expect(parseState(null)).toBeNull();
    expect(parseState({ ...base(), revision: -1 })).toBeNull();
    expect(parseState({ ...base(), readings: [{ ...readingA, standing: 'confirmed' }, readingB] })).toBeNull();
    expect(parseState({ ...base(), readings: [{ ...readingA, standing: 'leaning' }, { ...readingB, standing: 'leaning' }] })).toBeNull();
    expect(loadOrEmpty('garbage')).toEqual(emptyState());
    const s = base();
    expect(parseState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('recovery matrix covers every case in plain wording with no streak, points, rank or pressure', () => {
    for (const c of RECOVERY_CASES) {
      expect(RECOVERY[c].handled.length).toBeGreaterThan(0);
      expect(RECOVERY[c].next.length).toBeGreaterThan(0);
      expect(`${RECOVERY[c].handled} ${RECOVERY[c].next}`).not.toMatch(/streak|missed|points|rank|badge/i);
    }
  });
});
