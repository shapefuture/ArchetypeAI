import { describe, expect, it } from 'vitest';
import { membersOf, type MemberId } from './taxonomy';
import {
  RANK_MARGIN, SCENES, SCENE_FAMILIES, buildAssessment2Result, confidenceOf, deriveConflicts, isAssessment2Result, levelOf, rankFamilies,
  skipsConfirm, type Assessment2Input, type FamilyScores, type MapPart, type SceneAnswer,
} from './scoring';

// The plan's thresholds, tested at the threshold itself. A mutation sample of scoring.ts showed that every line was
// run, but nine of sixteen off-by-one changes at these thresholds left the suite green. Each case below sits
// exactly on a boundary, so moving it by one step either way fails a test.

const blank = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

const scores = (values: Partial<FamilyScores>): FamilyScores => ({
  overPerform: null, attack: null, appease: null, withdraw: null, reframe: null, pursue: null, numbSoothe: null, overControl: null, ...values,
} as FamilyScores);

/** A minimal part: only the fields the conflict rules read (as in assessment2.spec.ts). */
const part = (over: Partial<MapPart>): MapPart => ({
  key: 'x', kind: 'protector', rank: null, level: null, confidence: null, guards: [], costume: null, placement: 'default',
  coordinates: [0, 0, 0, 0], unmeasuredAxes: [], blending: null, mapFamily: 'manager', ...over,
} as MapPart);

describe('scoring thresholds, at the threshold (plan §5, G3)', () => {
  it('ranks a fourth family that is exactly RANK_MARGIN below the third, and not one just below that', () => {
    expect(0.3 - 0.15).toBe(RANK_MARGIN); // the fixture's gap is exactly the margin in floating point
    const at = rankFamilies(scores({ attack: 0.7, pursue: 0.5, withdraw: 0.3, appease: 0.15 }));
    expect(at.map((entry) => entry.family)).toEqual(['attack', 'pursue', 'withdraw', 'appease']);
    const beyond = rankFamilies(scores({ attack: 0.7, pursue: 0.5, withdraw: 0.3, appease: 0.14 }));
    expect(beyond.map((entry) => entry.family)).toEqual(['attack', 'pursue', 'withdraw']);
  });

  it('skips the confirm step at exactly three quarters "most", and never once the family was chosen "least"', () => {
    const overPerformScenes = SCENES.filter((scene) => SCENE_FAMILIES[scene].includes('overPerform'));
    expect(overPerformScenes).toHaveLength(4);
    const other = (scene: SceneAnswer['scene']) => SCENE_FAMILIES[scene].find((family) => family !== 'overPerform')!;
    // Most in three of four appearances, and in the fourth neither: 0.75, never least.
    const threeOfFour: SceneAnswer[] = overPerformScenes.map((scene, index) => ({ scene, most: index < 3 ? 'overPerform' : other(scene), least: null }));
    expect(skipsConfirm('overPerform', threeOfFour)).toBe(true);
    // The same share, but chosen least once.
    const onceLeast: SceneAnswer[] = threeOfFour.map((answer, index) => (index === 3 ? { ...answer, least: 'overPerform' } : answer));
    expect(skipsConfirm('overPerform', onceLeast)).toBe(false);
  });

  it('counts only 1–5 answers toward a level, so an out-of-range answer leaves it unknown', () => {
    expect(levelOf([5, 5, 5])).toBe(5);
    expect(levelOf([6, 5, 5])).toBeNull();
    expect(levelOf([0, 5, 5])).toBeNull();
  });

  it('keeps a level to two decimals', () => {
    expect(levelOf([4, 4, 5])).toBe(4.33);
  });

  it('gives low confidence below the margin, and not at exactly the margin', () => {
    expect(confidenceOf(0.5, 4, false, RANK_MARGIN - 0.01)).toBe('low');
    expect(confidenceOf(0.5, 4, false, RANK_MARGIN)).toBe('high');
    expect(confidenceOf(0.5, null, true, RANK_MARGIN)).toBe('medium');
  });

  it('gives low confidence below level 3, and not at level 3', () => {
    expect(confidenceOf(0.5, 2.99, false)).toBe('low');
    expect(confidenceOf(0.5, 3, false)).toBe('high');
  });

  it('gives high confidence from a score of exactly 0.25, and medium just below it', () => {
    expect(confidenceOf(0.25, 4, false)).toBe('high');
    expect(confidenceOf(0.24, 4, false)).toBe('medium');
  });
});

describe('conflict thresholds, at the threshold (plan §3.4)', () => {
  it('flags two protectors guarding one exile at exactly one unit apart, and not just under it', () => {
    const pair = (x: number) => [
      part({ key: 'member:a', family: 'attack', guards: ['frightened'], coordinates: [x, 0, 0, 0] }),
      part({ key: 'member:b', family: 'withdraw', guards: ['frightened'], coordinates: [x - 1, 0, 0, 0] }),
    ];
    expect(deriveConflicts(pair(0.5)).map((c) => c.type)).toContain('strategy-against-strategy');
    const near = [part({ key: 'member:a', family: 'attack', guards: ['frightened'], coordinates: [0.5, 0, 0, 0] }), part({ key: 'member:b', family: 'withdraw', guards: ['frightened'], coordinates: [-0.49, 0, 0, 0] })];
    expect(deriveConflicts(near).map((c) => c.type)).not.toContain('strategy-against-strategy');
  });

  it('flags a blended protector against an exile it guards from level 4, and not at level 3', () => {
    const withLevel = (level: number) => [
      part({ key: 'member:a', family: 'attack', guards: ['frightened'], blending: 'annoyed' }),
      part({ key: 'exile:frightened', kind: 'exile', exile: 'frightened', level, mapFamily: 'exile' }),
    ];
    expect(deriveConflicts(withLevel(4)).map((c) => c.type)).toContain('protector-against-exile');
    expect(deriveConflicts(withLevel(3)).map((c) => c.type)).not.toContain('protector-against-exile');
  });
});

describe('support prompt thresholds (plan §6)', () => {
  /** One member from each of three families, each fearing a different exile, every exile at the given level. */
  const threeExilesAt = (levels: [number, number, number]): Assessment2Input => {
    const families = ['attack', 'withdraw', 'numbSoothe'] as const;
    const exiles = ['frightened', 'abandoned', 'ashamed'] as const;
    const members = families.map((family) => membersOf(family)[0] as MemberId);
    return {
      ...blank(),
      picks: Object.fromEntries(families.map((family, i) => [family, members[i]])),
      fears: Object.fromEntries(members.map((member, i) => [member, exiles[i]])),
      exileLevel: Object.fromEntries(exiles.map((exile, i) => [exile, levels[i]])),
    };
  };

  it('asks at exactly three exiles at level 5, and not at two', () => {
    expect(buildAssessment2Result(threeExilesAt([5, 5, 5])).supportPrompt).toBe(true);
    expect(buildAssessment2Result(threeExilesAt([5, 5, 4])).supportPrompt).toBe(false);
  });

  it('asks at steadiness 1, and not at steadiness 2', () => {
    expect(buildAssessment2Result({ ...blank(), steadiness: 1 }).supportPrompt).toBe(true);
    expect(buildAssessment2Result({ ...blank(), steadiness: 2 }).supportPrompt).toBe(false);
  });
});

describe('result validator ranges', () => {
  it('rejects a stored part level above 5', () => {
    const result = buildAssessment2Result({ ...blank(), picks: { attack: membersOf('attack')[0] }, fears: { [membersOf('attack')[0]]: 'frightened' }, exileLevel: { frightened: 5 } });
    expect(isAssessment2Result(result)).toBe(true);
    const tampered = JSON.parse(JSON.stringify(result));
    const exile = tampered.parts.find((p: MapPart) => p.kind === 'exile');
    exile.level = 6;
    expect(isAssessment2Result(tampered)).toBe(false);
  });
});
