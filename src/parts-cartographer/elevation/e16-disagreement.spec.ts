import { describe, expect, it } from 'vitest';
import { AXES, coordinatesFromTuple, type Axis, type Coordinate } from '../core/analytic-coordinates';
import type { Relationship } from '../core/therapist-access';
import {
  compareResults, completenessOf, renderPlan, therapistReadDecision, threePlusOne, visibleNotes,
  type HistoricalNote, type Instrument, type ResultRecord,
} from './e16-disagreement';

const NOW = new Date('2026-05-10T00:00:00Z');
const MEASURED = coordinatesFromTuple([0.5, -0.25, 0.75, 0.1], 'measured');
const REFERENCE = coordinatesFromTuple([0.5, 0.25, 0.75, -0.1], 'reference');

function rec(recordId: string, instrument: Instrument, over: Partial<ResultRecord> = {}): ResultRecord {
  const coordinates = instrument === '64' ? MEASURED : REFERENCE;
  return { recordId, instrument, instrumentVersion: instrument === '64' ? 'v1' : 'ref-2025', context: 'work', takenAt: '2026-03-01T10:00:00Z', coordinates, ...over };
}

function rel(over: Partial<Relationship> = {}): Relationship {
  return { therapistUid: 't1', clientUid: 'c1', state: 'linked', grants: { booking: true, report: true }, ...over };
}

function note(over: Partial<HistoricalNote> & Pick<HistoricalNote, 'noteId' | 'authorUid' | 'authorRole'>): HistoricalNote {
  return { provenance: 'hypothesis', writtenAt: '2026-03-02T09:00:00Z', refRecordIds: ['r64'], recipientUids: [], text: 'Possible tension between the two readings.', ...over };
}

describe('E16 comparison derivations', () => {
  it('compares 64 and 147 as separate source records and labels the cross-instrument pair', () => {
    const out = compareResults(rec('r64', '64'), rec('r147', '147'));
    if (!out.ok) throw new Error(out.reason);
    const c = out.comparison;
    expect(c.comparability).toBe('cross-instrument');
    expect([c.left.instrument, c.right.instrument]).toEqual(['64', '147']);
    expect([c.left.instrumentVersion, c.right.instrumentVersion]).toEqual(['v1', 'ref-2025']);
    expect(c.left.provenance).toBe('canonical-measurement');
    expect(c.axes.map((a) => a.relation)).toEqual(['equal', 'different', 'equal', 'different']);
    expect(c.axes.map((a) => a.right.status)).toEqual(['reference', 'reference', 'reference', 'reference']);
  });

  it('labels two contexts and two times without merging them', () => {
    const a = rec('a', '64', { context: 'work', takenAt: '2026-03-01T10:00:00Z' });
    const otherContext = rec('b', '64', { context: 'home', takenAt: '2026-03-01T10:00:00Z' });
    const otherTime = rec('c', '64', { context: 'work', takenAt: '2026-04-01T10:00:00Z' });
    const crossBoth = rec('d', '147', { context: 'home', takenAt: '2026-04-01T10:00:00Z' });
    const sameContextDifferentTime = compareResults(a, otherTime);
    const sameTimeDifferentContext = compareResults(a, otherContext);
    const bothDiffer = compareResults(a, crossBoth);
    if (!sameContextDifferentTime.ok || !sameTimeDifferentContext.ok || !bothDiffer.ok) throw new Error('unexpected refusal');
    expect([sameContextDifferentTime.comparison.sameContext, sameContextDifferentTime.comparison.sameTime]).toEqual([true, false]);
    expect([sameTimeDifferentContext.comparison.sameContext, sameTimeDifferentContext.comparison.sameTime]).toEqual([false, true]);
    expect([bothDiffer.comparison.comparability, bothDiffer.comparison.sameContext, bothDiffer.comparison.sameTime]).toEqual(['cross-instrument', false, false]);
  });

  it('keeps an unknown axis unknown and never imputes zero', () => {
    const sparse147 = rec('r147', '147', { coordinates: coordinatesFromTuple([0.5, undefined, 0.75, 0.1], 'reference') });
    const out = compareResults(rec('r64', '64'), sparse147);
    if (!out.ok) throw new Error(out.reason);
    expect(out.comparison.unknownAxes).toEqual([1]);
    expect(out.comparison.axes[1].right.value).toBeNull();
    expect(out.comparison.axes[1].right.status).toBe('unknown');
    expect(out.comparison.axes[1].left.value).toBe(-0.25);
    expect(out.comparison.axes[1].relation).toBe('unknown');
  });

  it('compares at two-decimal display precision without false precision', () => {
    const base = rec('a', '64', { coordinates: coordinatesFromTuple([0.5, 0, 0, 0], 'measured') });
    const close = rec('b', '64', { coordinates: coordinatesFromTuple([0.501, -0.001, 0, 0], 'measured') });
    const far = rec('c', '64', { coordinates: coordinatesFromTuple([0.51, 0, 0, 0], 'measured') });
    const near = compareResults(base, close);
    const apart = compareResults(base, far);
    if (!near.ok || !apart.ok) throw new Error('unexpected refusal');
    expect(near.comparison.axes.map((a) => a.relation)).toEqual(['equal', 'equal', 'equal', 'equal']);
    expect(apart.comparison.axes[0].relation).toBe('different');
    expect(compareResults(base, base)).toEqual({ ok: false, reason: 'same-record' });
  });

  it('leaves the original instrument records unchanged', () => {
    const a = Object.freeze(rec('r64', '64'));
    const b = Object.freeze(rec('r147', '147'));
    const before = JSON.stringify([a, b]);
    compareResults(a, b);
    threePlusOne(a.coordinates, [0, 1, 2]);
    expect(JSON.stringify([a, b])).toBe(before);
  });

  it('classifies sparse and empty results without filling them', () => {
    expect(completenessOf(MEASURED)).toBe('complete');
    expect(completenessOf(coordinatesFromTuple([0.2], 'derived'))).toBe('sparse');
    expect(completenessOf(coordinatesFromTuple([], 'derived'))).toBe('empty');
  });
});

describe('E16 full-vector and 3+1 projection', () => {
  it('projects every ordered choice of three distinct axes, with the fourth kept as +1', () => {
    let count = 0;
    for (const x of AXES) for (const y of AXES) for (const z of AXES) {
      if (new Set([x, y, z]).size !== 3) continue;
      const out = threePlusOne(MEASURED, [x, y, z]);
      if (!out.ok) throw new Error(out.reason);
      const p = out.projection;
      count += 1;
      expect(p.rows).toHaveLength(4);
      expect(new Set(p.rows.map((r) => r.axis))).toEqual(new Set<Axis>([0, 1, 2, 3]));
      expect(p.rows[3]).toMatchObject({ role: 'plus', axis: p.plus });
      expect(p.matchesFullVector).toBe(true);
      for (const row of p.rows) expect(row.value).toBe(MEASURED[row.axis].value);
    }
    expect(count).toBe(24);
  });

  it('rejects a repeated or out-of-range axis in the 3+1 choice', () => {
    expect(threePlusOne(MEASURED, [0, 0, 1])).toEqual({ ok: false, reason: 'duplicate-axis' });
    expect(threePlusOne(MEASURED, [0, 1, 4] as unknown as [Axis, Axis, Axis])).toEqual({ ok: false, reason: 'invalid-axis' });
  });

  it('keeps the +1 row and unknown values in a sparse projection', () => {
    const sparse: Coordinate[] = coordinatesFromTuple([0.3, undefined, undefined, undefined], 'derived');
    const out = threePlusOne(sparse, [0, 1, 2]);
    if (!out.ok) throw new Error(out.reason);
    expect(out.projection.rows.map((r) => [r.axis, r.value, r.status])).toEqual([[0, 0.3, 'derived'], [1, null, 'unknown'], [2, null, 'unknown'], [3, null, 'unknown']]);
    expect(out.projection.matchesFullVector).toBe(true);
  });
});

describe('E16 recovery: renderer loss, expired grants, notes', () => {
  it('keeps the table and text when the renderer is lost', () => {
    const out = threePlusOne(MEASURED, [0, 1, 2]);
    if (!out.ok) throw new Error(out.reason);
    const lost = renderPlan(out.projection, false);
    expect(lost.mode).toBe('table');
    expect(lost.rows).toHaveLength(4);
    expect(lost.text).toContain('+1 Axis 4: 0.10 (measured)');
    expect(renderPlan(out.projection, true).mode).toBe('scene');
  });

  it('denies therapist reads after a report grant expires, and fails closed on an unreadable expiry', () => {
    const r = rel();
    expect(therapistReadDecision({ therapistUid: 't1', relationship: r, grant: { expiresAt: '2026-05-01T00:00:00Z' }, now: NOW })).toEqual({ allowed: false, reason: 'grant-expired' });
    expect(therapistReadDecision({ therapistUid: 't1', relationship: r, grant: { expiresAt: '2026-06-01T00:00:00Z' }, now: NOW })).toEqual({ allowed: true });
    expect(therapistReadDecision({ therapistUid: 't1', relationship: r, grant: { expiresAt: 'not-a-date' }, now: NOW })).toEqual({ allowed: false, reason: 'grant-expired' });
    expect(therapistReadDecision({ therapistUid: 't1', relationship: rel({ state: 'revoked' }), grant: { expiresAt: '2026-06-01T00:00:00Z' }, now: NOW })).toEqual({ allowed: false, reason: 'revoked' });
  });

  it('keeps historical therapist notes owned by their author and not merged into the comparison', () => {
    const therapistNote = note({ noteId: 'n1', authorUid: 't1', authorRole: 'therapist', provenance: 'hypothesis', refRecordIds: ['r64', 'r147'] });
    const clientNote = note({ noteId: 'n2', authorUid: 'c1', authorRole: 'client', provenance: 'user-authored', refRecordIds: ['r64'] });
    const notes = [therapistNote, clientNote];
    const seen = visibleNotes(notes, { uid: 't1', role: 'therapist' }, rel(), null, NOW);
    expect(seen[0]).toBe(therapistNote);
    expect(seen).toHaveLength(2);
    const out = compareResults(rec('r64', '64'), rec('r147', '147'));
    if (!out.ok) throw new Error(out.reason);
    expect(Object.keys(out.comparison)).not.toContain('notes');
    expect(therapistNote).toMatchObject({ authorUid: 't1', authorRole: 'therapist', provenance: 'hypothesis', refRecordIds: ['r64', 'r147'] });
    expect(clientNote.provenance).toBe('user-authored');
  });

  it('shows a client only their own notes and therapist notes addressed to them', () => {
    const toClient = note({ noteId: 'n1', authorUid: 't1', authorRole: 'therapist', recipientUids: ['c1'] });
    const toNobody = note({ noteId: 'n3', authorUid: 't1', authorRole: 'therapist', recipientUids: [] });
    const own = note({ noteId: 'n2', authorUid: 'c1', authorRole: 'client', provenance: 'user-authored' });
    const seen = visibleNotes([toClient, toNobody, own], { uid: 'c1', role: 'client' }, rel(), null, NOW);
    expect(seen.map((n) => n.noteId)).toEqual(['n1', 'n2']);
  });

  it('shows no therapist notes after the link is revoked, while the client keeps their own', () => {
    const therapistNote = note({ noteId: 'n1', authorUid: 't1', authorRole: 'therapist', recipientUids: ['c1'] });
    const own = note({ noteId: 'n2', authorUid: 'c1', authorRole: 'client', provenance: 'user-authored' });
    const revoked = rel({ state: 'revoked' });
    expect(visibleNotes([therapistNote, own], { uid: 't1', role: 'therapist' }, revoked, null, NOW)).toEqual([]);
    expect(visibleNotes([therapistNote, own], { uid: 'c1', role: 'client' }, revoked, null, NOW).map((n) => n.noteId)).toEqual(['n2']);
  });
});
