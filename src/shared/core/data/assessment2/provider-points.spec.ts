import { describe, expect, it } from 'vitest';
import { EXILE_NEED, EXILES, NEED_PROVIDER, PROVIDER_ROLES, type ExileId, type FamilyId } from './taxonomy';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, isAssessment2Result, type Assessment2Input, type Assessment2Result, type MapPart, type SceneAnswer } from './scoring';

// Provider points (plan §5.1, build-and-fix B7): one point beside each exile whose provider is easy or effort.
// The other 2.0 specs keep their fixtures private, so the ones this spec needs are copied here.

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

/** One protector who fears `exile`, which puts that exile on the map. */
const withExile = (exile: ExileId, extra: Partial<Assessment2Input> = {}): Assessment2Input => ({
  ...blank(),
  completedStages: [1, 2, 3, 4],
  scenes: scenesFavouring('attack', 'withdraw'),
  picks: { attack: 'inner_critic' },
  timing: { inner_critic: 'preventive' },
  confirm: { inner_critic: [4, 5, 4] },
  fears: { inner_critic: exile },
  exileLevel: { [exile]: 3 },
  ...extra,
});

/** A plain copy of a built result, as it reads back from storage. */
type Stored = Record<string, any>;
const stored = (result: Assessment2Result): Stored => JSON.parse(JSON.stringify(result));

const pointsOf = (result: Assessment2Result): MapPart[] => result.parts.filter((part) => part.kind === 'provider');

function pointFor(result: Assessment2Result, exile: ExileId): MapPart {
  const point = result.parts.find((part) => part.kind === 'provider' && part.exile === exile);
  if (!point) throw new Error(`no provider point for ${exile}`);
  return point;
}

function exileFor(result: Assessment2Result, exile: ExileId): MapPart {
  const part = result.parts.find((p) => p.kind === 'exile' && p.exile === exile);
  if (!part) throw new Error(`no exile part for ${exile}`);
  return part;
}

describe('a provider point is given for easy or effort access', () => {
  it.each(['easy', 'effort'] as const)('gives one point beside the exile when access is %s', (access) => {
    const result = buildAssessment2Result({ ...withExile('frightened'), providers: { frightened: { access } } });
    expect(pointsOf(result)).toHaveLength(1);
    expect(pointFor(result, 'frightened').exile).toBe('frightened');
  });

  it('gives no point when access is none', () => {
    const result = buildAssessment2Result({ ...withExile('frightened'), providers: { frightened: { access: 'none' } } });
    expect(pointsOf(result)).toHaveLength(0);
  });

  it('gives no point when the provider was never asked', () => {
    expect(pointsOf(buildAssessment2Result(withExile('frightened')))).toHaveLength(0);
  });

  it('gives no point on the lighter path, and none for an exile that is not on the map', () => {
    const lighter = buildAssessment2Result({ ...withExile('frightened', { lighter: true }), providers: { frightened: { access: 'easy' } } });
    const notOnMap = buildAssessment2Result({ ...withExile('frightened'), providers: { betrayed: { access: 'easy' } } });
    expect(pointsOf(lighter)).toHaveLength(0);
    expect(pointsOf(notOnMap)).toHaveLength(0);
  });
});

describe('the point sits beside its exile (plan §5.1, B7)', () => {
  it('adds 0.25 to the exile energy and direction, and keeps its depth and blending slot at 0', () => {
    const result = buildAssessment2Result({
      ...withExile('frightened', { placed: { 'exile:frightened': { energy: 0.4, direction: -0.2, depth: -0.5 } } }),
      providers: { frightened: { access: 'effort' } },
    });
    const exile = exileFor(result, 'frightened');
    const point = pointFor(result, 'frightened');
    expect(exile.coordinates[0]).toBeCloseTo(0.4, 10);
    expect(point.coordinates[0]).toBeCloseTo(0.65, 10);
    expect(point.coordinates[1]).toBeCloseTo(0.05, 10);
    expect(point.coordinates[2]).toBe(exile.coordinates[2]);
    expect(point.coordinates[2]).toBe(-0.5);
    expect(point.coordinates[3]).toBe(0);
  });

  it('clamps energy and direction at 1 when the exile is above 0.75', () => {
    const result = buildAssessment2Result({
      ...withExile('frightened', { placed: { 'exile:frightened': { energy: 0.8, direction: 0.9 } } }),
      providers: { frightened: { access: 'easy' } },
    });
    expect(pointFor(result, 'frightened').coordinates.slice(0, 2)).toEqual([1, 1]);
  });

  it('keeps an unknown energy unknown on the point, and copies the exile unmeasured axes', () => {
    const result = buildAssessment2Result({
      ...withExile('frightened', { placed: { 'exile:frightened': { direction: 0.2 } } }),
      providers: { frightened: { access: 'easy' } },
    });
    const exile = exileFor(result, 'frightened');
    const point = pointFor(result, 'frightened');
    expect(exile.unmeasuredAxes).toContain('ENERGY');
    expect(point.unmeasuredAxes).toEqual(exile.unmeasuredAxes);
    expect(point.unmeasuredAxes).toContain('ENERGY');
    expect(point.placement).toBe(exile.placement);
    expect(point.depthState).toBe(exile.depthState);
  });

  it('keeps blending unknown on the point even when the exile blending is known', () => {
    const result = buildAssessment2Result({
      ...withExile('frightened', { blending: { 'exile:frightened': 'curious' } }),
      providers: { frightened: { access: 'easy' } },
    });
    const exile = exileFor(result, 'frightened');
    const point = pointFor(result, 'frightened');
    expect(exile.unmeasuredAxes).not.toContain('BLENDING');
    expect(point.unmeasuredAxes).toEqual(['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING']);
    expect(point.coordinates[3]).toBe(0);
    expect(point.blending).toBeNull();
  });

  it('has the key, kind and map family of a resource point, and no member, capacity, protector family or timing', () => {
    const point = pointFor(buildAssessment2Result({ ...withExile('frightened'), providers: { frightened: { access: 'easy' } } }), 'frightened');
    expect(point).toMatchObject({
      key: 'provider:frightened', kind: 'provider', exile: 'frightened', role: 'guardian', mapFamily: 'resource', classKnown: true,
      rank: null, level: null, confidence: null, guards: [], costume: null, blending: null,
    });
    expect(point.member).toBeUndefined();
    expect(point.capacity).toBeUndefined();
    expect(point.family).toBeUndefined();
    expect(point.timing).toBeUndefined();
    expect(point.target).toBeUndefined();
  });
});

describe('the role is the provider for the need the person chose (plan §5.1, B7)', () => {
  it('takes the role from the exile need: the table default unless the person chose one', () => {
    const table = pointFor(buildAssessment2Result({ ...withExile('ashamed'), providers: { ashamed: { access: 'easy' } } }), 'ashamed');
    expect(table.role).toBe(NEED_PROVIDER[EXILE_NEED.ashamed]);
    expect(table.role).toBe('blesser');
    const chosen = pointFor(buildAssessment2Result({
      ...withExile('ashamed', { exileNeed: { ashamed: 'safety' } }),
      providers: { ashamed: { access: 'easy' } },
    }), 'ashamed');
    expect(chosen.role).toBe('guardian');
  });

  it('names a provider role for every exile', () => {
    for (const exile of EXILES) {
      const result = buildAssessment2Result({ ...withExile(exile), providers: { [exile]: { access: 'effort' } } });
      expect(PROVIDER_ROLES).toContain(pointFor(result, exile).role);
    }
  });
});

describe('a provider point changes no protector, exile or conflict', () => {
  // A protector who is afraid of the ashamed exile at level 4, and a self-critical attack member: two conflicts.
  const conflictInput = (): Assessment2Input => ({
    ...withExile('ashamed'),
    blending: { 'member:inner_critic': 'afraid' },
    exileLevel: { ashamed: 4 },
  });

  // An exile records the provider access it was given in its `provider` field, as it did before points existed.
  // That record is the answer itself, so the comparison leaves it out and checks it on its own below.
  const withoutExileRecord = (parts: MapPart[]) => parts.map((part) => (part.kind === 'exile' ? { ...part, provider: undefined } : part));

  it('leaves the other parts, the conflicts and the scores as they are without the point', () => {
    const plain = buildAssessment2Result(conflictInput());
    const withPoint = buildAssessment2Result({ ...conflictInput(), providers: { ashamed: { access: 'effort', form: 'realPerson' } } });
    expect(plain.conflicts.map((conflict) => conflict.type)).toEqual(expect.arrayContaining(['protector-against-exile', 'critic-against-criticised']));
    expect(pointsOf(withPoint)).toHaveLength(1);
    expect(exileFor(withPoint, 'ashamed').provider).toEqual({ access: 'effort', form: 'realPerson' });
    expect(withoutExileRecord(withPoint.parts.filter((part) => part.kind !== 'provider'))).toEqual(withoutExileRecord(plain.parts));
    expect(withPoint.conflicts).toEqual(plain.conflicts);
    expect(withPoint.supportPrompt).toBe(plain.supportPrompt);
    expect(withPoint.topFamilies).toEqual(plain.topFamilies);
    expect(withPoint.familyScores).toEqual(plain.familyScores);
  });

  it('puts the points after the other parts, so those parts keep their order', () => {
    const plain = buildAssessment2Result(conflictInput());
    const withPoint = buildAssessment2Result({ ...conflictInput(), providers: { ashamed: { access: 'easy' } } });
    expect(withoutExileRecord(withPoint.parts.slice(0, plain.parts.length))).toEqual(withoutExileRecord(plain.parts));
    expect(withPoint.parts.slice(plain.parts.length).map((part) => part.kind)).toEqual(['provider']);
  });
});

describe('the stored-result validator accepts and checks provider points', () => {
  const built = (): Assessment2Result => buildAssessment2Result({ ...withExile('frightened'), providers: { frightened: { access: 'easy' } } });
  const pointOf = (result: Stored): Stored => result.parts.find((part: Stored) => part.kind === 'provider');

  it('accepts a result with a provider point, and a result saved before points existed', () => {
    const withPoint = stored(built());
    expect(pointOf(withPoint)).toBeDefined();
    expect(isAssessment2Result(withPoint)).toBe(true);
    expect(isAssessment2Result(stored(buildAssessment2Result(withExile('frightened'))))).toBe(true);
  });

  it.each(PROVIDER_ROLES)('accepts the provider role %s', (role) => {
    const result = stored(built());
    pointOf(result).role = role;
    expect(isAssessment2Result(result)).toBe(true);
  });

  const tamperings: Array<[string, (point: Stored) => void]> = [
    ['an exile that is not an exile', (point) => { point.exile = 'bogus'; }],
    ['no exile', (point) => { delete point.exile; }],
    ['a role that is not a provider role', (point) => { point.role = 'bogus'; }],
    ['no role', (point) => { delete point.role; }],
    ['a coordinate outside [-1, 1]', (point) => { point.coordinates[0] = 1.5; }],
    ['an unmeasured axis that is not an axis', (point) => { point.unmeasuredAxes = ['FOCUS']; }],
    ['depth set while depth is listed as unmeasured', (point) => { point.depthState = 'set'; }],
    ['guards that are not a list', (point) => { point.guards = 'frightened'; }],
  ];

  it.each(tamperings)('rejects a provider point with %s', (_label, tamper) => {
    const result = stored(built());
    tamper(pointOf(result));
    expect(isAssessment2Result(result)).toBe(false);
  });
});
