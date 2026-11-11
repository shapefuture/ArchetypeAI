import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, deriveConflicts, isAssessment2Result, type Assessment2Input, type Assessment2Result, type Conflict, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import type { FamilyId } from '../../shared/core/data/assessment2/taxonomy';
import type { MapCoordinates } from '../../shared/core/data/map-axes';
import { ROUTE_KEYS } from './assessment-routes';
import { store } from './local-store';
import { parseLastResult, readLastResult, saveLastResult } from './parts-two-store';

const KEY = ROUTE_KEYS.parts2.result;
const EARLIER = new Date('2026-11-10T18:00:00.000Z');
const NOW = new Date('2026-11-11T09:30:00.000Z');

/** Answers every scene so that `most` leads, as the result tests in assessment2.spec.ts do. */
const scenesFavouring = (most: FamilyId, least: FamilyId): SceneAnswer[] => SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes(most) ? most : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes(least) ? least : SCENE_FAMILIES[scene][1],
}));

/** One self-critical protector whose timing is answered, and the ashamed exile it fears. */
const input = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: scenesFavouring('attack', 'withdraw'),
  picks: { attack: 'inner_critic' }, timing: { inner_critic: 'preventive' }, costume: {}, confirm: {}, fears: { inner_critic: 'ashamed' },
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});
const built = (): Assessment2Result => buildAssessment2Result(input());

/** A result as an earlier build wrote it: its protectors carry no classKnown field (plan D1). */
const beforeTimingFix = (result: Assessment2Result): Assessment2Result => {
  const copy = JSON.parse(JSON.stringify(result));
  for (const part of copy.parts) if (part.kind === 'protector') delete part.classKnown;
  return copy;
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('saving the last Assessment 2.0 result (B9, G23)', () => {
  it('reads back the result it saved, with the time it was saved', () => {
    const result = built();
    expect(saveLastResult(result, NOW)).toBe(true);
    const back = readLastResult();
    expect(back?.savedAt).toBe(NOW.toISOString());
    expect(JSON.stringify(back?.result)).toBe(JSON.stringify(result));
  });

  it('stores the envelope { savedAt, result } under the parts2 result key', () => {
    saveLastResult(built(), NOW);
    const raw = JSON.parse(localStorage.getItem(KEY)!);
    expect(Object.keys(raw).sort()).toEqual(['result', 'savedAt']);
    expect(raw.savedAt).toBe(NOW.toISOString());
    expect(isAssessment2Result(raw.result)).toBe(true);
  });

  it('returns false and stores nothing when the storage layer refuses the write', () => {
    const save = vi.spyOn(store, 'save').mockReturnValueOnce(false);
    expect(saveLastResult(built(), NOW)).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('returns false and stores nothing when the browser throws on write (storage full)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    expect(saveLastResult(built(), NOW)).toBe(false);
    vi.restoreAllMocks();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('returns false when the copy does not read back, and puts the earlier result back byte for byte', () => {
    expect(saveLastResult(built(), EARLIER)).toBe(true);
    const earlier = localStorage.getItem(KEY);
    // NaN is stored as null by JSON, so the copy read back is not a valid result.
    const broken = built();
    broken.parts = broken.parts.map((part) => ({ ...part, coordinates: [Number.NaN, 0, 0, 0] as MapCoordinates }));
    expect(saveLastResult(broken, NOW)).toBe(false);
    expect(localStorage.getItem(KEY)).toBe(earlier);
    expect(readLastResult()?.savedAt).toBe(EARLIER.toISOString());
  });
});

describe('reading the last Assessment 2.0 result (B9)', () => {
  it('returns null when nothing is stored', () => {
    expect(readLastResult()).toBeNull();
  });

  it('reads an older bare result, with savedAt null', () => {
    const result = built();
    localStorage.setItem(KEY, JSON.stringify(result));
    const back = readLastResult();
    expect(back?.savedAt).toBeNull();
    expect(JSON.stringify(back?.result)).toBe(JSON.stringify(result));
  });

  it('reads the saved shape, with savedAt equal to the stored value', () => {
    const stored = EARLIER.toISOString();
    localStorage.setItem(KEY, JSON.stringify({ savedAt: stored, result: built() }));
    expect(readLastResult()?.savedAt).toBe(stored);
  });

  const withTiming = (result: Assessment2Result, timing: unknown) => ({ ...result, parts: result.parts.map((part) => (part.kind === 'protector' ? { ...part, timing } : part)) });
  const withoutGuards = () => {
    // Blending above 0.4 makes the derivation read the protector's guards. A part with no guards list is invalid data.
    const copy = JSON.parse(JSON.stringify(buildAssessment2Result({ ...input(), blending: { 'member:inner_critic': 'itIsMe' } })));
    for (const part of copy.parts) if (part.kind === 'protector') delete part.guards;
    return JSON.stringify(copy);
  };
  const invalidCases: Array<[string, () => string]> = [
    ['a JSON string', () => JSON.stringify('oops')],
    ['text that is not JSON', () => '{not json'],
    ['an envelope whose result is not a result', () => JSON.stringify({ savedAt: EARLIER.toISOString(), result: { instrument: 'parts-2', version: 1 } })],
    ['an envelope with an unreadable save time', () => JSON.stringify({ savedAt: 'yesterday', result: built() })],
    ['an envelope with no result', () => JSON.stringify({ savedAt: EARLIER.toISOString() })],
    ['a bare result with a timing that is not one', () => JSON.stringify(withTiming(built(), 'sometimes'))],
    ['a protector whose guards cannot be read', withoutGuards],
  ];

  it.each(invalidCases)('returns null and leaves storage byte-identical for %s', (_label, make) => {
    localStorage.setItem(KEY, make());
    const before = localStorage.getItem(KEY);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    expect(readLastResult()).toBeNull();
    expect(localStorage.getItem(KEY)).toBe(before);
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it('ignores stored conflicts and recomputes them from the parts, in both shapes', () => {
    const result = built();
    const fake: Conflict[] = [{ type: 'need-against-need', keys: ['exile:connection', 'exile:agency'] }];
    const derived = deriveConflicts(result.parts);
    expect(derived.length).toBeGreaterThan(0);
    localStorage.setItem(KEY, JSON.stringify({ savedAt: EARLIER.toISOString(), result: { ...result, conflicts: fake } }));
    expect(readLastResult()?.result.conflicts).toEqual(derived);
    localStorage.setItem(KEY, JSON.stringify({ ...result, conflicts: fake }));
    expect(readLastResult()?.result.conflicts).toEqual(derived);
  });
});

describe('results saved before the timing fix (G27)', () => {
  it('is false for a current result, including one whose timing was skipped', () => {
    saveLastResult(built(), NOW);
    expect(readLastResult()?.predatesTimingFix).toBe(false);
    const skipped = buildAssessment2Result({ ...input(), timing: {} });
    expect(skipped.parts.find((part) => part.kind === 'protector')!.classKnown).toBe(false);
    saveLastResult(skipped, NOW);
    expect(readLastResult()?.predatesTimingFix).toBe(false);
  });

  it('is true for a protector with no classKnown field, as a bare result or as a saved one', () => {
    localStorage.setItem(KEY, JSON.stringify(beforeTimingFix(built())));
    expect(readLastResult()?.predatesTimingFix).toBe(true);
    localStorage.setItem(KEY, JSON.stringify({ savedAt: EARLIER.toISOString(), result: beforeTimingFix(built()) }));
    expect(readLastResult()?.predatesTimingFix).toBe(true);
  });

  it('gives the same flag from the shared validator that the backup uses', () => {
    expect(parseLastResult(beforeTimingFix(built()))?.predatesTimingFix).toBe(true);
    expect(parseLastResult(built())?.predatesTimingFix).toBe(false);
  });
});
