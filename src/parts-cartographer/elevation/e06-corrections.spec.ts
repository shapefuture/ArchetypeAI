import { describe, expect, it } from 'vitest';
import {
  addNode, deleteSource, effectiveStatus, emptyCorrections, filterRetrieval, parseCorrections, rebuildProjection, rejectHypothesis,
  reviseHypothesis, undoRejection, type Ctx, type CorrectionState, type Receipt, type Result,
} from './e06-corrections.ts';

const ctx = (over: Partial<Ctx> = {}): Ctx => ({ actor: 'user', expectedRevision: 0, now: 1_000, receiptId: 'r1', ...over });
const H1 = 'I felt rushed by the schedule';
const SUM1 = 'Recently you felt rushed by the schedule';

function apply(r: Result): CorrectionState {
  if (!r.ok) throw new Error(`refused: ${r.reason}`);
  return r.state;
}
function receiptOf(r: Result): Receipt {
  if (!r.ok || !r.receipt) throw new Error('no receipt');
  return r.receipt;
}
const nodeOf = (s: CorrectionState, id: string) => s.nodes.find((n) => n.id === id)!;

/** Observation o1 -> hypothesis h1 -> summary sum1 -> context ctx1, plus canonical cm64. Revision 5. */
function seeded(): CorrectionState {
  let s = emptyCorrections();
  s = apply(addNode(s, { id: 'o1', kind: 'observation', text: 'The call ended abruptly' }, ctx({ expectedRevision: 0 })));
  s = apply(addNode(s, { id: 'h1', kind: 'hypothesis', text: H1, derivedFrom: ['o1'] }, ctx({ actor: 'model', expectedRevision: 1 })));
  s = apply(addNode(s, { id: 'sum1', kind: 'summary', text: SUM1, derivedFrom: ['o1', 'h1'] }, ctx({ actor: 'model', expectedRevision: 2 })));
  s = apply(addNode(s, { id: 'ctx1', kind: 'context', text: 'Summary: rushed by the schedule', derivedFrom: ['sum1'] }, ctx({ actor: 'model', expectedRevision: 3 })));
  s = apply(addNode(s, { id: 'cm64', kind: 'canonical-measurement', text: '64-item reference result' }, ctx({ expectedRevision: 4 })));
  return s;
}

describe('E06 precise invalidation and restoration without rewriting canonical scores', () => {
  it('rejecting a hypothesis marks its derived summary and context stale and writes a receipt naming what was left alone', () => {
    const r = rejectHypothesis(seeded(), 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1', now: 2_000 }));
    if (!r.ok) throw new Error(r.reason);
    expect(effectiveStatus(r.state, 'h1')).toBe('rejected');
    expect(effectiveStatus(r.state, 'sum1')).toBe('stale');
    expect(effectiveStatus(r.state, 'ctx1')).toBe('stale');
    expect(r.receipt).toMatchObject({ action: 'reject', target: 'h1', changed: ['h1'], marked: ['sum1', 'ctx1'], at: 2_000, scoreDelta: 0, causalClaim: false });
    expect(r.receipt?.unchanged).toEqual(['o1', 'cm64']);
  });

  it('undo restores the hypothesis, while projections stay stale until rebuilt from active sources', () => {
    const rejected = apply(rejectHypothesis(seeded(), 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    const undone = apply(undoRejection(rejected, 'h1', ctx({ expectedRevision: 6, receiptId: 'undo-1' })));
    expect(effectiveStatus(undone, 'h1')).toBe('active');
    expect(effectiveStatus(undone, 'sum1')).toBe('stale');
    const rebuilt = apply(rebuildProjection(undone, 'sum1', 'Recently the schedule felt rushed', ['o1', 'h1'], ctx({ actor: 'model', expectedRevision: 7, receiptId: 'b1' })));
    expect(effectiveStatus(rebuilt, 'sum1')).toBe('active');
    expect(effectiveStatus(rebuilt, 'ctx1')).toBe('stale');
    expect(nodeOf(rebuilt, 'sum1').versions.map((v) => v.text)).toHaveLength(2);
  });

  it('deleting a source erases its wording and everything derived from it; undo afterwards is refused and cached copies stay blocked', () => {
    const base = seeded();
    const rejected = apply(rejectHypothesis(base, 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    const deleted = apply(deleteSource(rejected, 'o1', ctx({ expectedRevision: 6, receiptId: 'del-1' })));
    for (const id of ['o1', 'h1', 'sum1', 'ctx1']) {
      expect(nodeOf(deleted, id)).toMatchObject({ status: 'deleted', text: '', saved: false });
      expect(nodeOf(deleted, id).versions).toHaveLength(0);
    }
    expect(nodeOf(deleted, 'cm64')).toBe(nodeOf(base, 'cm64'));
    expect(receiptOf({ ok: true, state: deleted, receipt: deleted.receipts[deleted.receipts.length - 1] }).changed).toEqual(['o1', 'h1', 'sum1', 'ctx1']);
    expect(undoRejection(deleted, 'h1', ctx({ expectedRevision: 7, receiptId: 'undo-x' }))).toEqual({ ok: false, reason: 'deleted' });
    expect(filterRetrieval(deleted, [{ nodeId: 'ctx1', text: 'Summary: rushed by the schedule', basedOn: 4 }]).blocked)
      .toEqual([{ nodeId: 'ctx1', reason: 'deleted' }]);
    expect(JSON.stringify(deleted.receipts)).not.toContain('rushed');
  });

  it('a rejected interpretation never reappears through stale or fresh retrieval, by id or by wording', () => {
    const rejected = apply(rejectHypothesis(seeded(), 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    expect(filterRetrieval(rejected, [{ nodeId: 'h1', text: H1, basedOn: 6 }]).blocked).toEqual([{ nodeId: 'h1', reason: 'rejected' }]);
    expect(filterRetrieval(rejected, [{ nodeId: 'h9', text: 'i felt  rushed by the schedule', basedOn: 6 }]).blocked)
      .toEqual([{ nodeId: 'h9', reason: 'rejected-wording' }]);
    expect(filterRetrieval(rejected, [{ nodeId: 'sum1', text: SUM1, basedOn: 3 }]).blocked).toEqual([{ nodeId: 'sum1', reason: 'stale' }]);
    const undone = apply(undoRejection(rejected, 'h1', ctx({ expectedRevision: 6, receiptId: 'undo-1' })));
    expect(filterRetrieval(undone, [{ nodeId: 'h1', text: H1, basedOn: 7 }]).allowed).toHaveLength(1);
    expect(filterRetrieval(undone, [{ nodeId: 'h1', text: H1, basedOn: 3 }]).blocked).toEqual([{ nodeId: 'h1', reason: 'stale-snapshot' }]);
  });

  it('revising a reading supersedes its wording, keeps the old wording on record as rejected, and marks its summaries stale', () => {
    const r = reviseHypothesis(seeded(), 'h1', 'h1b', 'It was about money, not the schedule', ctx({ expectedRevision: 5, receiptId: 'rv' }));
    if (!r.ok) throw new Error(r.reason);
    expect(r.state.nodes.find((n) => n.id === 'h1b')).toMatchObject({ kind: 'user-authorship', source: 'user-entry', status: 'active', derivedFrom: ['o1'] });
    expect(effectiveStatus(r.state, 'h1')).toBe('rejected');
    expect(effectiveStatus(r.state, 'sum1')).toBe('stale');
    expect(r.receipt).toMatchObject({ action: 'revise', changed: ['h1', 'h1b'], marked: ['sum1', 'ctx1'] });
    expect(addNode(r.state, { id: 'h2', kind: 'hypothesis', text: H1, derivedFrom: ['o1'] }, ctx({ actor: 'model', expectedRevision: 6 })))
      .toEqual({ ok: false, reason: 'rejected-wording' });
  });

  it('canonical measurements are never modified, corrected, deleted or used as a parent', () => {
    const s0 = seeded();
    const canon = nodeOf(s0, 'cm64');
    const undone = apply(undoRejection(apply(rejectHypothesis(s0, 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' }))), 'h1', ctx({ expectedRevision: 6, receiptId: 'undo-1' })));
    expect(nodeOf(undone, 'cm64')).toBe(canon);
    expect(rejectHypothesis(s0, 'cm64', ctx({ expectedRevision: 5 }))).toEqual({ ok: false, reason: 'canonical-immutable' });
    expect(reviseHypothesis(s0, 'cm64', 'x2', 'Changed', ctx({ expectedRevision: 5 }))).toEqual({ ok: false, reason: 'canonical-immutable' });
    expect(deleteSource(s0, 'cm64', ctx({ expectedRevision: 5 }))).toEqual({ ok: false, reason: 'canonical-immutable' });
    expect(addNode(s0, { id: 'sumC', kind: 'summary', text: 'A summary', derivedFrom: ['cm64'] }, ctx({ actor: 'model', expectedRevision: 5 })))
      .toEqual({ ok: false, reason: 'canonical-parent' });
  });

  it('the model may add interpretations and rebuild projections, but cannot reject, undo, revise, delete or author observations', () => {
    const s0 = seeded();
    const model = (rev: number) => ctx({ actor: 'model', expectedRevision: rev });
    expect(rejectHypothesis(s0, 'h1', model(5))).toEqual({ ok: false, reason: 'not-authorized' });
    expect(deleteSource(s0, 'o1', model(5))).toEqual({ ok: false, reason: 'not-authorized' });
    expect(reviseHypothesis(s0, 'h1', 'h1b', 'Mine', model(5))).toEqual({ ok: false, reason: 'not-authorized' });
    const rejected = apply(rejectHypothesis(s0, 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    expect(undoRejection(rejected, 'h1', model(6))).toEqual({ ok: false, reason: 'not-authorized' });
    expect(addNode(s0, { id: 'o9', kind: 'observation', text: 'Model-written' }, model(5))).toEqual({ ok: false, reason: 'not-authorized' });
    expect(rebuildProjection(s0, 'sum1', 'The schedule was tight that day', ['o1'], model(5)).ok).toBe(true);
  });

  it('a model rebuild cannot reintroduce rejected wording or build on a rejected source', () => {
    const rejected = apply(rejectHypothesis(seeded(), 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    const model = ctx({ actor: 'model', expectedRevision: 6 });
    expect(rebuildProjection(rejected, 'sum1', H1, ['o1'], model)).toEqual({ ok: false, reason: 'rejected-wording' });
    expect(rebuildProjection(rejected, 'sum1', 'Some other wording', ['o1', 'h1'], model)).toEqual({ ok: false, reason: 'rejected-source' });
    expect(rebuildProjection(rejected, 'sum1', 'The schedule was tight that day', ['o1'], model).ok).toBe(true);
  });

  it('a correction creates no score, streak or causal claim, refuses overclaiming wording, and needs no canonical record', () => {
    let s = apply(addNode(emptyCorrections(), { id: 'o1', kind: 'observation', text: 'A tense call' }, ctx({ expectedRevision: 0 })));
    expect(addNode(s, { id: 'h1', kind: 'hypothesis', text: 'You are an anxious person', derivedFrom: ['o1'] }, ctx({ actor: 'model', expectedRevision: 1 })))
      .toEqual({ ok: false, reason: 'overclaim' });
    s = apply(addNode(s, { id: 'h1', kind: 'hypothesis', text: 'I may have felt rushed', derivedFrom: ['o1'] }, ctx({ actor: 'model', expectedRevision: 1 })));
    const r = apply(rejectHypothesis(s, 'h1', ctx({ expectedRevision: 2, receiptId: 'r' })));
    const receipt = r.receipts[0];
    expect(Object.keys(receipt).sort()).toEqual(['action', 'at', 'causalClaim', 'changed', 'id', 'marked', 'scoreDelta', 'target', 'unchanged'].sort());
    expect(receipt).toMatchObject({ scoreDelta: 0, causalClaim: false });
    expect(r.nodes.some((n) => n.kind === 'canonical-measurement')).toBe(false);
  });

  it('recovery, stale summaries: cached copies are blocked, and a rebuild from active sources restores the summary but not the context until it is rebuilt', () => {
    const rejected = apply(rejectHypothesis(seeded(), 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    const rebuilt = apply(rebuildProjection(rejected, 'sum1', 'The schedule was tight that day', ['o1'], ctx({ actor: 'model', expectedRevision: 6, receiptId: 'b1' })));
    expect(filterRetrieval(rebuilt, [{ nodeId: 'sum1', text: SUM1, basedOn: 3 }]).blocked).toEqual([{ nodeId: 'sum1', reason: 'stale-snapshot' }]);
    expect(filterRetrieval(rebuilt, [{ nodeId: 'sum1', text: 'The schedule was tight that day', basedOn: 7 }]).allowed).toHaveLength(1);
    expect(effectiveStatus(rebuilt, 'ctx1')).toBe('stale');
    expect(filterRetrieval(rebuilt, [{ nodeId: 'ctx1', text: 'Summary: rushed by the schedule', basedOn: 4 }]).blocked).toEqual([{ nodeId: 'ctx1', reason: 'stale' }]);
  });

  it('recovery, concurrent revisions: a second write from an old revision is refused and leaves no receipt', () => {
    const s = seeded();
    const a = rejectHypothesis(s, 'h1', ctx({ expectedRevision: 5, receiptId: 'a' }));
    // The second writer still holds revision 5 after the first write moved the state to revision 6.
    const b = reviseHypothesis(apply(a), 'h1', 'h1b', 'Something else', ctx({ expectedRevision: 5, receiptId: 'b' }));
    expect(b).toEqual({ ok: false, reason: 'stale-revision' });
    expect(s.receipts).toHaveLength(0);
  });

  it('recovery, failed propagation: a broken lineage refuses the correction and leaves the original state untouched', () => {
    const s = seeded();
    const broken: CorrectionState = { ...s, nodes: s.nodes.map((n) => (n.id === 'sum1' ? { ...n, derivedFrom: ['ghost'] } : n)) };
    expect(rejectHypothesis(broken, 'h1', ctx({ expectedRevision: 5, receiptId: 'x' }))).toEqual({ ok: false, reason: 'corrupt-lineage' });
    expect(broken.receipts).toHaveLength(0);
    expect(nodeOf(broken, 'h1').status).toBe('active');
  });

  it('recovery, retry: a correction retried with a known receipt id returns the original receipt and is not applied twice', () => {
    const once = apply(rejectHypothesis(seeded(), 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    const retry = rejectHypothesis(once, 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' }));
    expect(retry.ok).toBe(true);
    if (!retry.ok) return;
    expect(retry.state).toBe(once);
    expect(retry.state.revision).toBe(6);
    expect(retry.receipt).toEqual(once.receipts[0]);
  });

  it('recovery, storage: malformed or tampered stored state is refused, and a valid state keeps its retrieval decisions', () => {
    expect(parseCorrections(null)).toBeNull();
    const s = seeded();
    const tampered = { ...s, nodes: s.nodes.map((n) => (n.id === 'h1' ? { ...n, text: 'Something else' } : n)) };
    expect(parseCorrections(tampered)).toBeNull();
    const dangling = { ...s, nodes: s.nodes.map((n) => (n.id === 'sum1' ? { ...n, derivedFrom: ['ghost'] } : n)) };
    expect(parseCorrections(JSON.parse(JSON.stringify(dangling)))).toBeNull();
    expect(parseCorrections(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const rejected = apply(rejectHypothesis(s, 'h1', ctx({ expectedRevision: 5, receiptId: 'rej-1' })));
    const parsed = parseCorrections(JSON.parse(JSON.stringify(rejected)));
    expect(parsed).not.toBeNull();
    const candidates = [{ nodeId: 'h1', text: H1, basedOn: 6 }, { nodeId: 'sum1', text: SUM1, basedOn: 3 }];
    expect(filterRetrieval(parsed!, candidates)).toEqual(filterRetrieval(rejected, candidates));
  });
});
