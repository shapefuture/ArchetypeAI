import { describe, expect, it } from 'vitest';
import { BLENDING_OPTIONS, COSTUMES, EXILES, FAMILIES, NEEDS, PROVIDER_ACCESS, PROVIDER_FORMS, type FamilyId } from './taxonomy';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, isAssessment2Result, type Assessment2Input, type SceneAnswer } from './scoring';

// assessment2.spec.ts keeps its fixtures private, so the ones this spec needs are copied here.
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

/**
 * A protector with a guard, a costume, blending and a placement; an exile with a need and a provider; two capacities.
 * The self-critical protector and the ashamed exile also give one conflict.
 */
const fullInput = (): Assessment2Input => ({
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

/** A plain copy of the built result, as it reads back from storage. Each test edits its own copy. */
type Stored = Record<string, any>;
const valid = (): Stored => JSON.parse(JSON.stringify(buildAssessment2Result(fullInput())));
const protector = (result: Stored): Stored => result.parts.find((part: Stored) => part.kind === 'protector');
const exile = (result: Stored): Stored => result.parts.find((part: Stored) => part.kind === 'exile');

const CONFLICT_TYPES = ['strategy-against-strategy', 'protector-against-exile', 'critic-against-criticised', 'need-against-need'];
const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];

describe('stored result validator: every field the result view reads', () => {
  it('accepts a plain copy of a built result, which has parts of every kind and a conflict', () => {
    const result = valid();
    expect(new Set(result.parts.map((part: Stored) => part.kind))).toEqual(new Set(['protector', 'exile', 'capacity']));
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(isAssessment2Result(result)).toBe(true);
  });

  const tamperings: Array<[string, (result: Stored) => void]> = [
    ['a topFamilies entry whose family is not a family', (r) => { r.topFamilies[0].family = 'bogus'; }],
    ['a topFamilies entry that is not a record', (r) => { r.topFamilies[0] = null; }],
    ['a topFamilies entry whose rank is not an integer', (r) => { r.topFamilies[0].rank = 1.5; }],
    ['a topFamilies entry whose score is not a number', (r) => { r.topFamilies[0].score = '1'; }],
    ['a topFamilies entry whose score is outside [-1, 1]', (r) => { r.topFamilies[0].score = 2; }],
    ['a guard that is not an exile', (r) => { protector(r).guards = ['notAnExile']; }],
    ['a guard list that is a string', (r) => { protector(r).guards = 'ashamed'; }],
    ['a guard list with a null entry', (r) => { protector(r).guards = [null]; }],
    ['a part with no guards list', (r) => { delete protector(r).guards; }],
    ['an unknown costume', (r) => { protector(r).costume = 'bogus'; }],
    ['an unknown blending', (r) => { protector(r).blending = 'bogus'; }],
    ['a rank that is not an integer', (r) => { protector(r).rank = 1.5; }],
    ['a rank that is a string', (r) => { protector(r).rank = '1'; }],
    ['an unknown confidence', (r) => { protector(r).confidence = 'certain'; }],
    ['a confidence that names an object property', (r) => { protector(r).confidence = '__proto__'; }],
    ['a protector need that is not a need', (r) => { protector(r).need = 'bogus'; }],
    ['an exile need that is not a need', (r) => { exile(r).need = 'bogus'; }],
    ['a provider that is null', (r) => { exile(r).provider = null; }],
    ['an unknown provider access', (r) => { exile(r).provider.access = 'maybe'; }],
    ['an unknown provider form', (r) => { exile(r).provider.form = 'bogus'; }],
    ['a part key that is not a string', (r) => { protector(r).key = 7; }],
    ['an unknown conflict type', (r) => { r.conflicts = [{ type: 'bogus', keys: [] }]; }],
    ['a conflict that is not a record', (r) => { r.conflicts = [null]; }],
    ['conflict keys that are not strings', (r) => { r.conflicts = [{ type: 'need-against-need', keys: [7] }]; }],
    ['a supportPrompt that is not a boolean', (r) => { r.supportPrompt = 'yes'; }],
    ['a supportPrompt that is null', (r) => { r.supportPrompt = null; }],
  ];

  it.each(tamperings)('rejects %s', (_label, tamper) => {
    const result = valid();
    tamper(result);
    expect(isAssessment2Result(result)).toBe(false);
  });

  it('accepts every value the taxonomy allows in those fields', () => {
    const accepts = (edit: (result: Stored) => void) => {
      const result = valid();
      edit(result);
      return isAssessment2Result(result);
    };
    for (const family of FAMILIES) expect(accepts((r) => { r.topFamilies[0].family = family; })).toBe(true);
    for (const guard of EXILES) expect(accepts((r) => { protector(r).guards = [guard]; })).toBe(true);
    for (const costume of COSTUMES) expect(accepts((r) => { protector(r).costume = costume; })).toBe(true);
    for (const blending of BLENDING_OPTIONS) expect(accepts((r) => { protector(r).blending = blending; })).toBe(true);
    for (const need of NEEDS) expect(accepts((r) => { protector(r).need = need; exile(r).need = need; })).toBe(true);
    for (const confidence of CONFIDENCE_LEVELS) expect(accepts((r) => { protector(r).confidence = confidence; })).toBe(true);
    for (const type of CONFLICT_TYPES) expect(accepts((r) => { r.conflicts = [{ type, keys: ['member:inner_critic', 'exile:ashamed'] }]; })).toBe(true);
    for (const access of PROVIDER_ACCESS) expect(accepts((r) => { exile(r).provider.access = access; })).toBe(true);
    for (const form of [...PROVIDER_FORMS, null]) expect(accepts((r) => { exile(r).provider.form = form; })).toBe(true);
    for (const supportPrompt of [true, false]) expect(accepts((r) => { r.supportPrompt = supportPrompt; })).toBe(true);
  });

  it('accepts supportPrompt when it is absent', () => {
    const result = valid();
    delete result.supportPrompt;
    expect(isAssessment2Result(result)).toBe(true);
  });

  it('accepts null where the type allows it: rank, confidence, costume and blending on a protector, and no conflicts', () => {
    const result = valid();
    Object.assign(protector(result), { rank: null, confidence: null, costume: null, blending: null });
    result.conflicts = [];
    expect(isAssessment2Result(result)).toBe(true);
  });
});
