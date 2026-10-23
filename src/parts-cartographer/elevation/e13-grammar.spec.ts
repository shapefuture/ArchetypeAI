import { describe, expect, it } from 'vitest';
import { DESCENT_ITEM_IDS, type DescentDraft } from '../core/assessment-draft.ts';
import { navEntry, type NavView } from '../core/navigation-history.ts';
import type { Relationship } from '../core/therapist-access.ts';
import {
  REGISTRY,
  assessmentFree,
  assessmentReturn,
  beginSave,
  bookingRequestAllowed,
  canonicalCoordinatesKept,
  canonicalResultAllowed,
  closeLayer,
  createRecord,
  edit,
  interrupt,
  pause,
  persistedLabel,
  predict,
  predictAll,
  provenanceOf,
  provenanceOfMemory,
  reconcile,
  resume,
  settleSave,
  undo,
  type PartLike,
  type RecordState,
} from './e13-grammar.ts';

const STAMP = '2026-10-16T09:00:00.000Z';

/** Completes the write of the current shown value, reading back exactly what was written. */
function saveShown<T>(s: RecordState<T>, requestId = 'r1', at = STAMP): RecordState<T> {
  const begun = beginSave(s, requestId);
  return settleSave(begun.state, requestId, { ok: true, readBack: JSON.stringify(s.shown) }, at);
}

const base: NavView = { route: 'assessment', overlay: null, sheet: null };
const withHelp: NavView = { route: 'assessment', overlay: 'help', sheet: null };
const helpEntry = navEntry(withHelp, base);

describe('E13.04 primitives: prediction, provenance and canonical gates', () => {
  it('predicts save, undo, pause, inspect and return on all four core paths, with a reason for each refusal', () => {
    const rows = predictAll();
    expect(rows).toHaveLength(20);
    for (const row of rows) {
      if (row.support.supported) expect(row.support.owner.length).toBeGreaterThan(0);
      else expect(row.support.reason.length).toBeGreaterThan(0);
    }
    const refused = rows.filter((row) => !row.support.supported).map((row) => `${row.path}.${row.primitive}`);
    expect(refused).toEqual(['map.pause', 'coach.undo', 'booking.undo', 'booking.pause']);
  });

  it('keeps coach pause, return and inspect available without a completed assessment', () => {
    expect(assessmentFree('coach')).toBe(true);
    expect(predict('coach', 'pause').supported).toBe(true);
    expect(predict('coach', 'return').supported).toBe(true);
    expect(predict('coach', 'inspect').supported).toBe(true);
    expect(assessmentFree('map')).toBe(false);
  });

  it('distinguishes observation, hypothesis, user authorship and canonical measurement', () => {
    expect(provenanceOf('map', 'coordinates')).toBe('canonical-measurement');
    expect(provenanceOf('map', 'name')).toBe('user-authorship');
    expect(provenanceOf('coach', 'reply')).toBe('hypothesis');
    expect(provenanceOf('booking', 'status')).toBe('observation');
    expect(provenanceOf('map', 'unknown-field')).toBeNull();
    expect(provenanceOfMemory('model-inference')).toBe('hypothesis');
    expect(provenanceOfMemory('assessment')).toBe('canonical-measurement');
    expect(provenanceOfMemory('user-entry')).toBe('user-authorship');
    const used = new Set(Object.values(REGISTRY).flatMap((contract) => Object.values(contract.provenance)));
    expect([...used].sort()).toEqual(['canonical-measurement', 'hypothesis', 'observation', 'user-authorship']);
  });

  it('produces no canonical result from an incomplete assessment and resumes at the stored item', () => {
    expect(DESCENT_ITEM_IDS).toHaveLength(147);
    const partial = Object.fromEntries(DESCENT_ITEM_IDS.slice(0, 5).map((id) => [id, 3]));
    expect(canonicalResultAllowed(partial)).toBe(false);
    const full = Object.fromEntries(DESCENT_ITEM_IDS.map((id) => [id, 3]));
    expect(canonicalResultAllowed(full)).toBe(true);
    const draft: DescentDraft = {
      schema: 'descent-draft.v2',
      answers: partial,
      cursor: { itemId: DESCENT_ITEM_IDS[5], stage: 'item' },
      savedAt: STAMP,
    };
    expect(assessmentReturn(draft)).toEqual({ stage: 'item', index: 5 });
  });

  it('keeps canonical coordinates through a rename, an addition and an undo, and refuses a moved or deleted placement', () => {
    const before: PartLike[] = [
      { id: 'p1', name: 'Planner', archetype: { coordinates: [0.1, 0.2, 0.3, 0.4] } },
      { id: 'p2', name: 'Critic', archetype: null },
    ];
    const renamed = before.map((part) => (part.id === 'p1' ? { ...part, name: 'Organiser' } : part));
    expect(canonicalCoordinatesKept(before, renamed)).toBe(true);
    expect(canonicalCoordinatesKept(before, [...renamed, { id: 'p3', name: 'New' }])).toBe(true);
    const moved = before.map((part) => (part.id === 'p1' ? { ...part, archetype: { coordinates: [0.9, 0.2, 0.3, 0.4] } } : part));
    expect(canonicalCoordinatesKept(before, moved)).toBe(false);
    expect(canonicalCoordinatesKept(before, before.slice(1))).toBe(false);
    const map = edit(createRecord(before), renamed);
    expect(canonicalCoordinatesKept(before, undo(map).state.shown)).toBe(true);
  });
});

describe('E13.04 primitives: save, undo and pause', () => {
  it('marks a save as saved only after the read-back matches what was written', () => {
    const dirty = edit(createRecord('a', '2026-10-01T00:00:00.000Z'), 'b');
    expect(persistedLabel(dirty)).toBe('unsaved');
    const begun = beginSave(dirty, 'r1');
    expect(begun.started).toBe(true);
    expect(persistedLabel(begun.state)).toBe('saving');
    const done = settleSave(begun.state, 'r1', { ok: true, readBack: JSON.stringify('b') }, STAMP);
    expect(persistedLabel(done)).toBe('saved');
    expect(done.durable).toBe('b');
    expect(done.savedAt).toBe(STAMP);
  });

  it('shows an undone value as unsaved until it is saved again, so the stored value never changes silently', () => {
    const saved = saveShown(edit(createRecord('a'), 'b'));
    expect(persistedLabel(saved)).toBe('saved');
    const back = undo(saved);
    expect(back.reason).toBe('undone');
    expect(back.state.shown).toBe('a');
    expect(back.state.durable).toBe('b');
    expect(persistedLabel(back.state)).toBe('unsaved');
    const resaved = saveShown(back.state, 'r2');
    expect(persistedLabel(resaved)).toBe('saved');
    expect(resaved.durable).toBe('a');
  });

  it('pause with unsaved edits is not safe to leave; after a verified save it is', () => {
    const dirty = edit(createRecord('a'), 'b');
    const paused = pause(dirty);
    expect(paused.label).toBe('unsaved');
    expect(paused.safeToLeave).toBe(false);
    const clean = pause(saveShown(dirty));
    expect(clean.label).toBe('saved');
    expect(clean.safeToLeave).toBe(true);
    expect(resume(paused.state).paused).toBe(false);
  });

  it('handles empty and denied states: nothing to undo or save on a fresh record, and no booking without a grant or a live link', () => {
    const fresh = createRecord('a');
    expect(undo(fresh).reason).toBe('nothing-to-undo');
    expect(beginSave(fresh, 'r1')).toMatchObject({ started: false, reason: 'nothing-to-save' });
    const linked: Relationship = { therapistUid: 't1', clientUid: 'c1', state: 'linked', grants: { booking: true, report: false } };
    expect(bookingRequestAllowed(null, 'c1')).toBe(false);
    expect(bookingRequestAllowed({ ...linked, state: 'revoked' }, 'c1')).toBe(false);
    expect(bookingRequestAllowed({ ...linked, grants: { booking: false, report: true } }, 'c1')).toBe(false);
    expect(bookingRequestAllowed(linked, 'c1')).toBe(true);
  });
});

describe('E13.07 recovery: interruption, keyboard return, duplicates and save failure', () => {
  it('recovers modal history: Back mirrors the history without a new entry and keeps unsaved edits', () => {
    const pending = edit(createRecord('a'), 'b');
    const closed = closeLayer({ current: helpEntry, next: base, trigger: 'help-button', triggerPresent: true, cause: 'back' });
    expect(closed.steps).toEqual([]);
    expect(closed.focus).toEqual({ kind: 'trigger', id: 'help-button' });
    const after = interrupt(pending);
    expect(after.shown).toBe('b');
    expect(after.durable).toBe('a');
    expect(persistedLabel(after)).toBe('unsaved');
  });

  it('recovers keyboard return: Escape pops the layer and returns focus to its trigger; a removed trigger or a route change falls back to the route heading', () => {
    const escaped = closeLayer({ current: helpEntry, next: base, trigger: 'help-button', triggerPresent: true, cause: 'escape' });
    expect(escaped.steps).toEqual([{ op: 'back' }]);
    expect(escaped.focus).toEqual({ kind: 'trigger', id: 'help-button' });
    const removed = closeLayer({ current: helpEntry, next: base, trigger: 'help-button', triggerPresent: false, cause: 'escape' });
    expect(removed.focus).toEqual({ kind: 'route-heading', route: 'assessment' });
    const moved = closeLayer({ current: helpEntry, next: { route: 'map', overlay: null, sheet: null }, trigger: 'help-button', triggerPresent: true, cause: 'route-change' });
    expect(moved.focus).toEqual({ kind: 'route-heading', route: 'map' });
  });

  it('recovers duplicate submissions: a second submit while a write is in flight is ignored, and a late duplicate settle is dropped', () => {
    const first = beginSave(edit(createRecord('a'), 'b'), 'r1');
    const second = beginSave(first.state, 'r2');
    expect(second).toMatchObject({ started: false, reason: 'duplicate-ignored' });
    expect(second.state).toBe(first.state);
    expect(settleSave(first.state, 'r2', { ok: true, readBack: JSON.stringify('b') }, STAMP)).toBe(first.state);
    const saved = settleSave(first.state, 'r1', { ok: true, readBack: JSON.stringify('b') }, STAMP);
    expect(persistedLabel(saved)).toBe('saved');
    expect(beginSave(saved, 'r3').reason).toBe('nothing-to-save');
  });

  it('recovers save failure: a quota error keeps the edit on screen, claims nothing, and allows a retry', () => {
    const begun = beginSave(edit(createRecord('a'), 'b'), 'r1');
    const failed = settleSave(begun.state, 'r1', { ok: false, error: { name: 'QuotaExceededError' } }, STAMP);
    expect(failed.failure).toBe('quota');
    expect(failed.shown).toBe('b');
    expect(failed.durable).toBe('a');
    expect(failed.savedAt).toBeNull();
    expect(persistedLabel(failed)).toBe('failed');
    expect(beginSave(failed, 'r2').started).toBe(true);
  });

  it('recovers save failure: a read-back that differs from the write is a verify failure, not a save', () => {
    const begun = beginSave(edit(createRecord('a'), 'b'), 'r1');
    const failed = settleSave(begun.state, 'r1', { ok: true, readBack: JSON.stringify('a') }, STAMP);
    expect(failed.failure).toBe('verify-failed');
    expect(failed.durable).toBe('a');
    expect(persistedLabel(failed)).toBe('failed');
  });

  it('recovers interrupted saves: an unconfirmed write is re-read before it is claimed either way', () => {
    const unconfirmed = interrupt(beginSave(edit(createRecord('a'), 'b'), 'r1').state);
    expect(persistedLabel(unconfirmed)).toBe('unconfirmed');
    expect(beginSave(unconfirmed, 'r2').reason).toBe('reconcile-first');
    expect(undo(unconfirmed).reason).toBe('save-unconfirmed');
    const landed = reconcile(unconfirmed, JSON.stringify('b'), STAMP);
    expect(persistedLabel(landed)).toBe('saved');
    expect(landed.savedAt).toBe(STAMP);
    const notLanded = reconcile(unconfirmed, JSON.stringify('a'), STAMP);
    expect(persistedLabel(notLanded)).toBe('unsaved');
    expect(notLanded.durable).toBe('a');
  });
});
