import { describe, expect, it } from 'vitest';
import { coordinatesFromTuple } from '../core/analytic-coordinates';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, type Assessment2Input, type Assessment2Result, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import type { FamilyId } from '../../shared/core/data/assessment2/taxonomy';
import { PARTS2_CONTEXT, compareResults, provenanceOf, resultRecordsFromParts2, type ResultRecord } from './e16-disagreement';

// Assessment 2.0 parts as E16 records (B10). The 2.0 fixture is copied here, as the other 2.0 specs copy theirs.
const blank = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

/** Answers every scene so that `most` leads and `least` trails. */
const scenesFavouring = (most: FamilyId, least: FamilyId): SceneAnswer[] => SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes(most) ? most : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes(least) ? least : SCENE_FAMILIES[scene][1],
}));

/** A protector who is not placed, and a frightened exile the person placed, with an easy provider. */
const built: Assessment2Result = buildAssessment2Result({
  ...blank(),
  completedStages: [1, 2, 3, 4],
  scenes: scenesFavouring('attack', 'withdraw'),
  picks: { attack: 'inner_critic' },
  timing: { inner_critic: 'preventive' },
  confirm: { inner_critic: [4, 5, 4] },
  fears: { inner_critic: 'frightened' },
  exileLevel: { frightened: 3 },
  providers: { frightened: { access: 'easy' } },
  placed: { 'exile:frightened': { energy: 0.4, direction: -0.2, depth: -0.5 } },
});

const TAKEN = '2026-04-01T09:00:00Z';
const records = resultRecordsFromParts2(built, TAKEN);

const recordOf = (key: string): ResultRecord => {
  const found = records.find((record) => record.recordId === `parts-2:${key}`);
  if (!found) throw new Error(`no record for ${key}`);
  return found;
};

/** A 147 reference part, built the way the 147 specs build theirs. */
const reference147 = (values: number[]): ResultRecord => ({
  recordId: 'r147', instrument: '147', instrumentVersion: 'ref-2025', context: 'work', takenAt: '2026-03-01T10:00:00Z',
  coordinates: coordinatesFromTuple(values, 'reference'),
});

describe('Assessment 2.0 parts as E16 records (B10)', () => {
  it('makes one record per part, with the 2.0 instrument, the result version and the time it was taken', () => {
    expect(records.map((record) => record.recordId).sort()).toEqual(built.parts.map((part) => `parts-2:${part.key}`).sort());
    expect(records.every((record) => record.instrument === 'parts-2' && record.instrumentVersion === '1' && record.takenAt === TAKEN)).toBe(true);
  });

  it('keeps each axis in its own slot, and leaves an unmeasured axis unknown, never zero', () => {
    const exile = recordOf('exile:frightened');
    expect(exile.coordinates.map((c) => c.axis)).toEqual([0, 1, 2, 3]);
    expect(exile.coordinates.slice(0, 3).map((c) => c.value)).toEqual([0.4, -0.2, -0.5]);
    expect(exile.coordinates.slice(0, 3).every((c) => c.status === 'derived')).toBe(true);
    expect(exile.coordinates[3]).toEqual({ axis: 3, value: null, status: 'unknown' });
  });

  it('gives a placed 2.0 part against a 147 reference part a relation per axis, keeps the unknown axis, and labels both sides', () => {
    const out = compareResults(recordOf('exile:frightened'), reference147([0.9, -0.2, -0.5, 0.3]));
    if (out.ok === false) throw new Error(out.reason);
    const c = out.comparison;
    expect(c.comparability).toBe('cross-instrument');
    expect(c.axes.map((a) => a.relation)).toEqual(['different', 'equal', 'equal', 'unknown']);
    expect(c.unknownAxes).toEqual([3]);
    expect([c.left.provenance, c.right.provenance]).toEqual(['user-authorship', 'canonical-measurement']);
    expect(c.sameContext).toBe(false);
  });

  it('labels a default 2.0 part as a hypothesis, and only a placed part as the person\'s own authorship', () => {
    expect(recordOf('member:inner_critic').placement).toBe('default');
    expect(provenanceOf(recordOf('member:inner_critic'))).toBe('hypothesis');
    expect(provenanceOf(recordOf('exile:frightened'))).toBe('user-authorship');
  });

  it('treats a 2.0 record with no placement as a hypothesis, so authorship is never assumed', () => {
    expect(provenanceOf({ ...recordOf('exile:frightened'), placement: undefined })).toBe('hypothesis');
  });

  it('never calls two 2.0 records the same context, because 2.0 asks for no context', () => {
    const out = compareResults(recordOf('exile:frightened'), recordOf('member:inner_critic'));
    if (out.ok === false) throw new Error(out.reason);
    expect(out.comparison.comparability).toBe('same-instrument');
    expect(out.comparison.sameContext).toBe(false);
    expect(PARTS2_CONTEXT).toBe('unspecified');
  });
});
