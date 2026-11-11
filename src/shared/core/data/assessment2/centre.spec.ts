import { describe, expect, it } from 'vitest';
import { SELF_QUALITIES } from '../parts';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, isAssessment2Result, sanitizeCentre, type Assessment2Input, type SceneAnswer } from './scoring';
import type { FamilyId } from './taxonomy';

// The Centre (plan §3.3, build-and-fix B6): the sanitizer, its place on the result, and the stored-result validator.
// It is not a map part, so it must never change the parts or the conflicts.

// assessment2.spec.ts and result-validator.spec.ts keep their fixtures private, so the ones this spec needs are copied here.
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

/** Parts of three kinds (a protector, an exile and two capacities) and one conflict. */
const withParts = (): Assessment2Input => ({
  ...blank(),
  completedStages: [1, 2, 3],
  steadiness: 3,
  scenes: scenesFavouring('attack', 'withdraw'),
  picks: { attack: 'inner_critic' },
  timing: { inner_critic: 'preventive' },
  costume: { inner_critic: 'faith' },
  confirm: { inner_critic: [4, 5, 4] },
  fears: { inner_critic: 'ashamed' },
  exileLevel: { ashamed: 2 },
  exileNeed: { ashamed: 'safety' },
  blending: { 'member:inner_critic': 'warm' },
  providers: { ashamed: { access: 'effort', form: 'realPerson' } },
  capacityEasiest: 'maker',
  capacityHardest: 'warrior',
  ground: ['breath'],
  placed: { 'member:inner_critic': { energy: 0.2, direction: -0.3, depth: 0.4 } },
});

describe('the Centre sanitizer', () => {
  it.each([0, 6, -1, 2.5, '3', true, Number.NaN, null, undefined])('turns the rating %s into null', (rating) => {
    expect(sanitizeCentre({ awareness: rating, will: rating })).toEqual({ awareness: null, will: null, qualities: [] });
  });

  it.each([1, 2, 3, 4, 5])('keeps the rating %s', (rating) => {
    expect(sanitizeCentre({ awareness: rating, will: rating })).toEqual({ awareness: rating, will: rating, qualities: [] });
  });

  it('keeps only values from SELF_QUALITIES', () => {
    expect(sanitizeCentre({ qualities: ['calm', 'bogus', 'Calm', 7, null, 'toString', 'connectedness'] }).qualities)
      .toEqual(['calm', 'connectedness']);
  });

  it('keeps at most three qualities, in the order given', () => {
    expect(sanitizeCentre({ qualities: ['connectedness', 'calm', 'courage', 'clarity'] }).qualities)
      .toEqual(['connectedness', 'calm', 'courage']);
  });

  it('drops repeats, keeps the first of each, and counts only distinct qualities toward the three', () => {
    expect(sanitizeCentre({ qualities: ['calm', 'calm', 'calm', 'clarity', 'courage', 'creativity'] }).qualities)
      .toEqual(['calm', 'clarity', 'courage']);
    expect(sanitizeCentre({ qualities: ['calm', 'clarity', 'calm'] }).qualities).toEqual(['calm', 'clarity']);
  });

  it('is all unanswered for an absent or non-record centre, and reads a qualities value that is not a list as none', () => {
    for (const centre of [undefined, null, 'calm', [], 3]) {
      expect(sanitizeCentre(centre)).toEqual({ awareness: null, will: null, qualities: [] });
    }
    expect(sanitizeCentre({ awareness: 4, qualities: 'calm' })).toEqual({ awareness: 4, will: null, qualities: [] });
  });
});

describe('the Centre on the result', () => {
  it('is all unanswered when the input has no centre', () => {
    expect(buildAssessment2Result(blank()).centre).toEqual({ awareness: null, will: null, qualities: [] });
  });

  it('carries awareness 3, will 5 and two qualities through unchanged', () => {
    const centre: Assessment2Input['centre'] = { awareness: 3, will: 5, qualities: ['calm', 'courage'] };
    expect(buildAssessment2Result({ ...blank(), centre }).centre).toEqual({ awareness: 3, will: 5, qualities: ['calm', 'courage'] });
  });

  it('stores the sanitized value, not the raw answers', () => {
    const raw: unknown = { awareness: 9, will: '5', qualities: ['calm', 'calm', 'bogus', 'clarity', 'courage', 'creativity'] };
    expect(buildAssessment2Result({ ...blank(), centre: raw as Assessment2Input['centre'] }).centre)
      .toEqual({ awareness: null, will: null, qualities: ['calm', 'clarity', 'courage'] });
  });

  it('has the same parts and conflicts with a centre as without one', () => {
    const without = buildAssessment2Result(withParts());
    const withCentre = buildAssessment2Result({ ...withParts(), centre: { awareness: 3, will: 5, qualities: ['calm', 'courage'] } });
    expect(without.conflicts.length).toBeGreaterThan(0);
    expect(withCentre.parts).toEqual(without.parts);
    expect(withCentre.conflicts).toEqual(without.conflicts);
  });
});

/** A plain copy of the built result, as it reads back from storage. Each test edits its own copy. */
type Stored = Record<string, any>;
const valid = (): Stored => JSON.parse(JSON.stringify(buildAssessment2Result(withParts())));

/** Whether the stored result, with this centre in place, passes the validator. */
const acceptsCentre = (centre: unknown): boolean => {
  const result = valid();
  result.centre = centre;
  return isAssessment2Result(result);
};

describe('the Centre in the stored result validator', () => {
  it('accepts a built result, which carries a centre', () => {
    expect(valid().centre).toEqual({ awareness: null, will: null, qualities: [] });
    expect(isAssessment2Result(valid())).toBe(true);
  });

  it('accepts a result saved before the Centre existed, which has no centre field', () => {
    const result = valid();
    delete result.centre;
    expect(isAssessment2Result(result)).toBe(true);
  });

  it('accepts a valid centre, including skipped ratings and no qualities', () => {
    expect(acceptsCentre({ awareness: 3, will: 5, qualities: ['calm', 'courage'] })).toBe(true);
    expect(acceptsCentre({ awareness: null, will: null, qualities: [] })).toBe(true);
  });

  it('accepts every rating from 1 to 5, every quality on its own, and three qualities', () => {
    for (const rating of [1, 2, 3, 4, 5]) expect(acceptsCentre({ awareness: rating, will: rating, qualities: [] })).toBe(true);
    for (const quality of SELF_QUALITIES) expect(acceptsCentre({ awareness: null, will: null, qualities: [quality] })).toBe(true);
    expect(acceptsCentre({ awareness: null, will: null, qualities: SELF_QUALITIES.slice(0, 3) })).toBe(true);
  });

  it('accepts whatever the sanitizer returns for invalid answers', () => {
    const raw: unknown = { awareness: 0, will: 2.5, qualities: ['calm', 'calm', 'bogus', 'clarity', 'courage', 'creativity'] };
    expect(acceptsCentre(sanitizeCentre(raw))).toBe(true);
  });

  const rejected: Array<[string, unknown]> = [
    ['awareness 0', { awareness: 0, will: 5, qualities: [] }],
    ['awareness 6', { awareness: 6, will: 5, qualities: [] }],
    ['awareness 2.5', { awareness: 2.5, will: 5, qualities: [] }],
    ['will as a string', { awareness: 3, will: '5', qualities: [] }],
    ['four qualities', { awareness: 3, will: 5, qualities: ['calm', 'clarity', 'compassion', 'curiosity'] }],
    ['a quality outside SELF_QUALITIES', { awareness: 3, will: 5, qualities: ['bogus'] }],
    ['a duplicated quality', { awareness: 3, will: 5, qualities: ['calm', 'calm'] }],
    ['no awareness field', { will: 5, qualities: [] }],
    ['qualities that is not a list', { awareness: 3, will: 5, qualities: 'calm' }],
    ['a centre that is null', null],
    ['a centre that is a list', []],
    ['a centre that is a number', 3],
  ];

  it.each(rejected)('rejects %s', (_label, centre) => {
    expect(acceptsCentre(centre)).toBe(false);
  });
});
