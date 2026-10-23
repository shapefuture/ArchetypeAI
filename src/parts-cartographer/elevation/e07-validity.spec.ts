// Specs for e07-validity.ts: validity transitions (ArchetypeAI-mfv) and recovery (ArchetypeAI-4pt).
//
// Recovery matrix (ArchetypeAI-4pt, E07.07). Each row names the test that exercises it.
//   sparse evidence           | one observation is described honestly; hypotheses never count  | recovery: sparse evidence
//   changed circumstances     | a context-specific source is excluded elsewhere, returns in its context | recovery: changed circumstances
//   declined resurfacing      | stays declined through marks and re-marks; quiet suppresses only resurfacing | recovery: declined resurfacing
//   interruption              | a staged change never lands by itself; the earlier mark survives | recovery: interruption
//   concurrency and storage   | a stale confirmation is refused; a refused write leaves the ledger; deletion drops marks | recovery: concurrency and storage
//   authority                 | the model cannot change validity, certainty or resurfacing     | authority: model cannot change marks
//   denied / failed / empty   | context label required; unknown source refused; empty retrieval infers nothing | denied, unknown, and empty cases

import { describe, expect, it } from 'vitest';
import type { Memory } from '../core/personal-memory';
import {
  PENDING_EVIDENCE, VALIDITY_LABELS, applyChange, confirmStaged, deleteSource, evidenceDepth, markFor,
  previewRetrieval, provenanceOf, reconcile, resurfacingCandidates, stageChange,
  type ChangeResult, type ValidityEvent, type ValidityLedger,
} from './e07-validity';

const memories: Memory[] = [
  { id: 'm1', text: 'I go quiet in team meetings', source: 'user-entry', derivedFrom: [], saved: true },
  { id: 'm2', text: 'I always avoid conflict', source: 'user-entry', derivedFrom: [], saved: true },
  { id: 'm3', text: 'Avoiding conflict looks like a pattern', source: 'model-inference', derivedFrom: ['m2'], saved: true },
  { id: 'm4', text: 'Result as the instrument reported it', source: 'assessment', derivedFrom: [], saved: true },
  { id: 'm5', text: 'A draft thought I never saved', source: 'user-entry', derivedFrom: [], saved: false },
];
const NOW = () => '2026-10-16T09:00:00Z';

function must(result: ChangeResult): Extract<ChangeResult, { ok: true }> {
  if (!result.ok) throw new Error(`refused: ${result.reason}`);
  return result;
}

describe('E07.04 validity transitions', () => {
  it('marks one source as fitting in some contexts and another as no longer fitting, and keeps both', () => {
    let ledger: ValidityLedger = must(applyChange(memories, [], 'm1', { type: 'validity', state: 'context-specific', contextLabel: 'team meetings' }, 'person')).ledger;
    ledger = must(applyChange(memories, ledger, 'm2', { type: 'validity', state: 'no-longer-fits' }, 'person')).ledger;
    expect(markFor(ledger, memories[0])).toMatchObject({ state: 'context-specific', contextLabel: 'team meetings' });
    expect(markFor(ledger, memories[1]).state).toBe('no-longer-fits');
    // A derived item is not marked automatically by a change to its parent.
    expect(markFor(ledger, memories[2]).state).toBe('unmarked');
  });

  it('preserves the original wording through every validity change, including after a later edit', () => {
    const marked = must(applyChange(memories, [], 'm1', { type: 'validity', state: 'context-specific', contextLabel: 'team meetings' }, 'person')).ledger;
    const later = must(applyChange(memories, marked, 'm1', { type: 'validity', state: 'no-longer-fits' }, 'person')).ledger;
    const edited = memories.map((m) => (m.id === 'm1' ? { ...m, text: 'I went quiet in one meeting' } : m));
    expect(markFor(later, edited[0]).originalWording).toBe('I go quiet in team meetings');
    expect(markFor(later, edited[0]).revision).toBe(2);
  });

  it("never downgrades the person's own certainty when validity changes", () => {
    let ledger = must(applyChange(memories, [], 'm2', { type: 'certainty', level: 'very-sure' }, 'person')).ledger;
    ledger = must(applyChange(memories, ledger, 'm2', { type: 'validity', state: 'no-longer-fits' }, 'person')).ledger;
    expect(markFor(ledger, memories[1]).certainty).toBe('very-sure');
    ledger = must(applyChange(memories, ledger, 'm2', { type: 'validity', state: 'context-specific', contextLabel: 'home' }, 'person')).ledger;
    expect(markFor(ledger, memories[1]).certainty).toBe('very-sure');
  });

  it('denied: a context-specific mark is refused until the person names the context', () => {
    expect(applyChange(memories, [], 'm1', { type: 'validity', state: 'context-specific', contextLabel: '   ' }, 'person'))
      .toEqual({ ok: false, reason: 'context-required', ledger: [] });
  });

  it('authority: the model cannot change validity, certainty or resurfacing', () => {
    const attempts: ValidityEvent[] = [
      { type: 'validity', state: 'still-fits' },
      { type: 'certainty', level: 'very-sure' },
      { type: 'resurfacing', choice: 'allowed' },
    ];
    for (const event of attempts) {
      expect(applyChange(memories, [], 'm1', event, 'model')).toEqual({ ok: false, reason: 'model-actor', ledger: [] });
    }
  });

  it('separates observation, hypothesis, user wording and canonical measurement, and validity never changes them', () => {
    expect(provenanceOf(memories[0])).toEqual({ kind: 'observation', wording: 'user', canonical: false });
    expect(provenanceOf(memories[2])).toEqual({ kind: 'hypothesis', wording: 'model', canonical: false });
    expect(provenanceOf(memories[3])).toEqual({ kind: 'canonical-measurement', wording: 'instrument', canonical: true });
    // Marking a hypothesis as still fitting does not turn it into an observation.
    const ledger = must(applyChange(memories, [], 'm3', { type: 'validity', state: 'still-fits' }, 'person')).ledger;
    const row = previewRetrieval(memories, ledger, { contextLabel: null, selectedIds: ['m3'] }).rows[0];
    expect(row).toMatchObject({ included: true, reason: 'included-still-fits', kind: 'hypothesis' });
  });

  it('canonical measurement: a no-longer-fits note is kept beside the result, with no score field', () => {
    const ledger = must(applyChange(memories, [], 'm4', { type: 'validity', state: 'no-longer-fits' }, 'person')).ledger;
    expect(markFor(ledger, memories[3]).state).toBe('no-longer-fits');
    expect(Object.keys(ledger[0]).sort()).toEqual(['certainty', 'contextLabel', 'memoryId', 'originalWording', 'resurfacing', 'revision', 'state']);
    expect(memories[3]).toMatchObject({ source: 'assessment', text: 'Result as the instrument reported it' });
  });

  it('retrieval preview explains each exclusion, considers only selected sources, and infers nothing when none are selected', () => {
    let ledger: ValidityLedger = must(applyChange(memories, [], 'm1', { type: 'validity', state: 'context-specific', contextLabel: 'team meetings' }, 'person')).ledger;
    ledger = must(applyChange(memories, ledger, 'm2', { type: 'validity', state: 'no-longer-fits' }, 'person')).ledger;
    const { rows, scopeNote } = previewRetrieval(memories, ledger, { contextLabel: 'Team Meetings', selectedIds: ['m1', 'm2', 'm3', 'm5', 'm9'] });
    const byId = Object.fromEntries(rows.map((r) => [r.memoryId, r]));
    expect(byId.m1).toMatchObject({ included: true, reason: 'included-context-match' });
    expect(byId.m2).toMatchObject({ included: false, reason: 'excluded-no-longer-fits', originalWording: 'I always avoid conflict' });
    expect(byId.m3).toMatchObject({ included: false, reason: 'excluded-parent-no-longer-fits' });
    expect(byId.m5).toMatchObject({ included: false, reason: 'excluded-unsaved' });
    expect(byId.m9).toMatchObject({ included: false, reason: 'excluded-missing' });
    expect(rows.every((r) => r.explanation.length > 0)).toBe(true);
    expect(rows.map((r) => r.memoryId)).not.toContain('m4');
    expect(scopeNote).toMatch(/Only the sources you selected/);
    expect(previewRetrieval(memories, ledger, { contextLabel: null, selectedIds: [] }).rows).toEqual([]);
  });

  it('unknown state: an unknown source is refused, and nothing is invented in its place', () => {
    expect(applyChange(memories, [], 'nope', { type: 'certainty', level: 'unsure' }, 'person'))
      .toEqual({ ok: false, reason: 'unknown-source', ledger: [] });
    expect(resurfacingCandidates([], [], false)).toEqual([]);
    expect(evidenceDepth([], []).message).toMatch(/No saved observations yet/);
  });

  it('user-facing labels claim no validation, proof or clinical meaning, and evidence stays pending', () => {
    for (const label of Object.values(VALIDITY_LABELS)) {
      expect(label).not.toMatch(/valid|proven|clinic|effective|diagnos|streak|points|rank|missed/i);
    }
    expect(PENDING_EVIDENCE).toEqual(expect.arrayContaining(['independent-review']));
  });
});

describe('E07.07 recovery', () => {
  it('recovery: sparse evidence describes one observation honestly, and removing the last one returns to empty with no pattern', () => {
    const one = evidenceDepth([memories[0], memories[2]], []);
    expect(one).toMatchObject({ usableObservations: 1, patternsAllowed: false });
    expect(one.message).toMatch(/one saved observation/);
    const ledger = must(applyChange(memories, [], 'm2', { type: 'validity', state: 'no-longer-fits' }, 'person')).ledger;
    expect(evidenceDepth(memories, ledger).usableObservations).toBe(1);
    const after = deleteSource(memories, ledger, 'm1');
    expect(after.removed).toEqual(['m1']);
    expect(evidenceDepth(after.memories, after.ledger).message).toMatch(/No saved observations yet/);
    const three: Memory[] = ['a', 'b', 'c'].map((id) => ({ id, text: `note ${id}`, source: 'user-entry', derivedFrom: [], saved: true }));
    expect(evidenceDepth(three, []).patternsAllowed).toBe(true);
  });

  it('recovery: changed circumstances excludes a context-specific source in another context and returns it in its own', () => {
    const ledger = must(applyChange(memories, [], 'm1', { type: 'validity', state: 'context-specific', contextLabel: 'team meetings' }, 'person')).ledger;
    const pick = (contextLabel: string | null) => previewRetrieval(memories, ledger, { contextLabel, selectedIds: ['m1'] }).rows[0];
    expect(pick('home')).toMatchObject({ included: false, reason: 'excluded-context-mismatch' });
    expect(pick(null)).toMatchObject({ included: false, reason: 'excluded-context-unspecified' });
    expect(pick('team meetings')).toMatchObject({ included: true, reason: 'included-context-match' });
    expect(markFor(ledger, memories[0]).state).toBe('context-specific');
  });

  it('recovery: declined resurfacing stays declined through marks and re-marks, and quiet suppresses only resurfacing', () => {
    let ledger = must(applyChange(memories, [], 'm1', { type: 'resurfacing', choice: 'declined' }, 'person')).ledger;
    ledger = must(applyChange(memories, ledger, 'm1', { type: 'validity', state: 'still-fits' }, 'person')).ledger;
    ledger = must(applyChange(memories, ledger, 'm1', { type: 'validity', state: 'context-specific', contextLabel: 'team meetings' }, 'person')).ledger;
    expect(markFor(ledger, memories[0]).resurfacing).toBe('declined');
    expect(previewRetrieval(memories, ledger, { contextLabel: 'team meetings', selectedIds: ['m1'] }).rows[0])
      .toMatchObject({ included: false, reason: 'excluded-resurfacing-declined' });
    expect(resurfacingCandidates(memories, ledger, false)).not.toContain('m1');
    // Only an explicit person choice lifts the decline.
    ledger = must(applyChange(memories, ledger, 'm1', { type: 'resurfacing', choice: 'allowed' }, 'person')).ledger;
    expect(resurfacingCandidates(memories, ledger, false)).toContain('m1');
    expect(resurfacingCandidates(memories, ledger, true)).toEqual([]);
    expect(previewRetrieval(memories, ledger, { contextLabel: 'team meetings', selectedIds: ['m1'] }).rows[0].included).toBe(true);
  });

  it('recovery: interruption stages a change without applying it, and the earlier mark survives until the person confirms', () => {
    const base = must(applyChange(memories, [], 'm1', { type: 'validity', state: 'still-fits' }, 'person')).ledger;
    const staged = stageChange(base, 'm1', { type: 'validity', state: 'no-longer-fits' }, NOW);
    expect(markFor(base, memories[0]).state).toBe('still-fits');
    expect(staged.startedAt).toBe('2026-10-16T09:00:00Z');
    const confirmed = must(confirmStaged(memories, base, staged, 'person'));
    expect(confirmed.mark.state).toBe('no-longer-fits');
    expect(confirmed.mark.revision).toBe(2);
  });

  it('recovery: concurrency and storage refuse a stale confirmation, keep the ledger on a refused write, and drop orphan marks on deletion', () => {
    const base = must(applyChange(memories, [], 'm1', { type: 'validity', state: 'still-fits' }, 'person')).ledger;
    const tabA = stageChange(base, 'm1', { type: 'validity', state: 'no-longer-fits' }, NOW);
    const tabB = must(applyChange(memories, base, 'm1', { type: 'validity', state: 'context-specific', contextLabel: 'home' }, 'person')).ledger;
    expect(confirmStaged(memories, tabB, tabA, 'person')).toEqual({ ok: false, reason: 'stale-revision', ledger: tabB });
    expect(markFor(tabB, memories[0]).state).toBe('context-specific');
    const snapshot = JSON.stringify(tabB);
    applyChange(memories, tabB, 'nope', { type: 'certainty', level: 'unsure' }, 'person');
    expect(JSON.stringify(tabB)).toBe(snapshot);
    const withM2 = must(applyChange(memories, tabB, 'm2', { type: 'validity', state: 'no-longer-fits' }, 'person')).ledger;
    const deleted = deleteSource(memories, withM2, 'm2');
    expect(deleted.removed.sort()).toEqual(['m2', 'm3']);
    expect(deleted.ledger.map((m) => m.memoryId)).toEqual(['m1']);
    const orphan = { ...withM2[0], memoryId: 'gone' };
    expect(reconcile(deleted.memories, [...withM2, orphan]).map((m) => m.memoryId)).toEqual(['m1']);
  });
});
