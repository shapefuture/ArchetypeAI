import { sanitizePlaced } from './scoring';
import { describe, expect, it } from 'vitest';
import {
  CAPACITIES, COSTUMES, EXILES, EXILE_NEED, FAMILIES, FAMILY_DEFAULT, GROUND_ITEMS, MEMBERS, MEMBER_DEFS, NEEDS, PROVIDER_FORMS, membersOf,
  exileDefault, protectorDefault, capacityDefault, mapFamilyFor, type MemberId,
} from './taxonomy';
import {
  SCENES, SCENE_FAMILIES, SELF_ATTACK_MEMBERS, buildAssessment2Result, confidenceOf, deriveConflicts, isAssessment2Result, leadsOf, levelOf, rankFamilies,
  scoreFamilies, skipsConfirm, type Assessment2Input, type MapPart, type SceneAnswer,
} from './scoring';
import { CONFIRM_COPY, CAPACITY_COPY, copyCoverage, GROUND_COPY, PROVIDER_FORM_COPY, REACTION_COPY, UI_COPY } from './content';
import { knownAxisValues, legacy64ToMapPlacement, referenceMapPlacement, isMapCoordinates, MAP_AXIS_KEYS, MAP_DEFAULT_PLOT } from '../map-axes';

const LEGACY_147_PROTECTORS = ['taskmaster', 'inner_critic', 'pleaser', 'controller', 'analyst', 'hermit', 'bypasser', 'numb', 'rebel', 'charmer'];

const blank = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

/** Answers every scene with the same most and least card, so one family wins clearly. */
const scenesFavouring = (most: (typeof FAMILIES)[number], least: (typeof FAMILIES)[number]): SceneAnswer[] =>
  SCENES.map((scene) => ({ scene, most: SCENE_FAMILIES[scene].includes(most) ? most : SCENE_FAMILIES[scene][0], least: SCENE_FAMILIES[scene].includes(least) ? least : SCENE_FAMILIES[scene][1] }));

/** Stage 1 answers that make pursue the top family, with a narrow lead over attack: pursue 0.75, attack 0.67, lead 0.083. */
const scenesNarrowPursue: SceneAnswer[] = [
  { scene: 'criticised', most: 'attack', least: null },
  { scene: 'leftOut', most: 'appease', least: null },
  { scene: 'lineCrossed', most: 'attack', least: null },
  { scene: 'fellThrough', most: 'pursue', least: null },
  { scene: 'planChanged', most: 'pursue', least: null },
  { scene: 'freeEvening', most: 'pursue', least: null },
];

describe('taxonomy invariants (plan §3)', () => {
  it('has 8 families, 28 members, 8 exiles, 6 needs and 8 capacities', () => {
    expect(FAMILIES).toHaveLength(8);
    expect(MEMBERS).toHaveLength(28);
    expect(EXILES).toHaveLength(8);
    expect(NEEDS).toHaveLength(6);
    expect(CAPACITIES).toHaveLength(8);
  });

  it('keeps the family sizes from the plan: 2, 3, 5, 4, 3, 3, 3, 5', () => {
    expect(FAMILIES.map((f) => membersOf(f).length)).toEqual([2, 3, 5, 4, 3, 3, 3, 5]);
  });

  it('keeps all ten protectors from the 147-item battery as members', () => {
    for (const id of LEGACY_147_PROTECTORS) expect(MEMBER_DEFS[id as keyof typeof MEMBER_DEFS].legacy147).toBe(true);
  });

  it('maps every exile to a need from the six', () => {
    for (const exile of EXILES) expect(NEEDS).toContain(EXILE_NEED[exile]);
  });

  it('keeps every default coordinate inside [−1, 1], with unknown blending', () => {
    for (const member of MEMBERS) {
      expect(isMapCoordinates(protectorDefault(member, 'preventive'))).toBe(true);
      expect(isMapCoordinates(protectorDefault(member, 'reactive'))).toBe(true);
      expect(protectorDefault(member, 'preventive')[3]).toBe(0);
    }
    for (const exile of EXILES) expect(isMapCoordinates(exileDefault(exile))).toBe(true);
    for (const capacity of CAPACITIES) expect(isMapCoordinates(capacityDefault(capacity))).toBe(true);
  });

  it('gives each family its plan default and maps classes as the map already does', () => {
    expect(FAMILY_DEFAULT.withdraw).toEqual({ energy: -0.4, direction: -0.8 });
    expect(mapFamilyFor('protector', 'preventive')).toBe('manager');
    expect(mapFamilyFor('protector', 'reactive')).toBe('firefighter');
    expect(mapFamilyFor('exile')).toBe('exile');
    expect(mapFamilyFor('capacity')).toBe('resource');
  });

  it('places faith and ancestry as costumes, provider forms and ground items, as the owner asked', () => {
    expect(COSTUMES).toEqual(expect.arrayContaining(['faith', 'ancestry']));
    expect(PROVIDER_FORMS).toEqual(expect.arrayContaining(['faithFigure', 'ancestor']));
    expect(GROUND_ITEMS).toEqual(expect.arrayContaining(['ritualOrPrayer', 'ancestralRemembrance']));
    expect(CAPACITY_COPY.meaningMaker.line.en).toMatch(/faith/);
  });
});

describe('map axes (plan §3.5, owner decision: replaced everywhere)', () => {
  it('uses Energy, Direction, Depth and Blending in that slot order, plotting energy, depth and direction', () => {
    expect(MAP_AXIS_KEYS).toEqual(['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING']);
    expect(MAP_DEFAULT_PLOT).toEqual(['ENERGY', 'DEPTH', 'DIRECTION']);
  });

  it('projects the 64 centres onto energy and direction, and leaves depth and blending unmeasured', () => {
    const placement = legacy64ToMapPlacement([0.5, -0.5, 0.2, 0.4]);
    expect(placement.coordinates[0]).toBeCloseTo((-0.5 + -0.5) / 2);
    expect(placement.coordinates[1]).toBeCloseTo((0.2 + 0.4) / 2);
    expect(placement.unmeasuredAxes).toEqual(['DEPTH', 'BLENDING']);
    expect(knownAxisValues(placement)).toEqual({ ENERGY: expect.any(Number), DIRECTION: expect.any(Number), DEPTH: null, BLENDING: null });
  });

  it('marks everything unmeasured when a 64 input is invalid, never a measured zero', () => {
    const placement = legacy64ToMapPlacement([0.5, NaN, 0, 0]);
    expect(placement.unmeasuredAxes).toEqual([...MAP_AXIS_KEYS]);
    expect(knownAxisValues(placement)).toEqual({ ENERGY: null, DIRECTION: null, DEPTH: null, BLENDING: null });
  });

  it('marks blending unmeasured for 147 reference parts', () => {
    expect(referenceMapPlacement(0.1, 0.2, 0.3).unmeasuredAxes).toEqual(['BLENDING']);
  });
});

describe('stage 1 scoring (plan §4.1, §5)', () => {
  it('shows Attack and Appease three times and every other family four times', () => {
    const counts = Object.fromEntries(FAMILIES.map((f) => [f, 0])) as Record<string, number>;
    for (const scene of SCENES) for (const f of SCENE_FAMILIES[scene]) counts[f] += 1;
    expect(counts.attack).toBe(3);
    expect(counts.appease).toBe(3);
    for (const f of FAMILIES.filter((x) => x !== 'attack' && x !== 'appease')) expect(counts[f]).toBe(4);
  });

  it('scores (most − least) over appearances, and returns null for a family never answered', () => {
    const scores = scoreFamilies([{ scene: 'criticised', most: 'attack', least: 'withdraw' }]);
    expect(scores.attack).toBe(1);
    expect(scores.withdraw).toBe(-1);
    expect(scores.pursue).toBeNull();
  });

  it('ranks the top three and adds a fourth only within the margin', () => {
    const scores = { overPerform: 0.9, overControl: 0.6, attack: 0.5, appease: 0.4, pursue: null, withdraw: 0, numbSoothe: -1, reframe: -0.5 } as const;
    expect(rankFamilies({ ...scores } as any).map((r) => r.family)).toEqual(['overPerform', 'overControl', 'attack', 'appease']);
    const wide = { ...scores, appease: 0.1 } as any;
    expect(rankFamilies(wide).map((r) => r.family)).toEqual(['overPerform', 'overControl', 'attack']);
  });

  it('skips confirmation when a family was chosen most in three quarters of its appearances and never least', () => {
    const scenes = scenesFavouring('attack', 'withdraw');
    expect(skipsConfirm('attack', scenes)).toBe(true);
    expect(skipsConfirm('withdraw', scenes)).toBe(false);
  });
});

describe('stage 3 level and confidence (plan §5)', () => {
  it('needs all three valid answers for a level, and rounds the mean', () => {
    expect(levelOf([4, null, null])).toBeNull();
    expect(levelOf([4, 5, null])).toBeNull();
    expect(levelOf([1, 2, 3])).toBe(2);
    expect(levelOf([9, 2, 3])).toBeNull();
    expect(levelOf([4, 5, 5])).toBe(4.67);
  });

  it('is high only when the confirmed level is at least 3 and the score is at least 0.25', () => {
    expect(confidenceOf(0.5, 4, false)).toBe('high');
    expect(confidenceOf(0.1, 4, false)).toBe('medium');
    expect(confidenceOf(0.5, 2, false)).toBe('low');
    expect(confidenceOf(0.5, null, true)).toBe('medium');
    expect(confidenceOf(0.5, null, false)).toBeNull();
    // A narrow lead over the next family makes the result low, however strong the level (plan §5).
    expect(confidenceOf(0.5, 4, false, 0.05)).toBe('low');
  });

  it('is low for a skipped confirm with a narrow lead, because the lead is checked first', () => {
    expect(confidenceOf(0.75, null, true, 0.083)).toBe('low');
  });

  it('keeps a skipped confirm with a wide lead at medium', () => {
    expect(confidenceOf(0.75, null, true, 0.33)).toBe('medium');
  });

  it('is low for a confirmed level of 5 with a narrow lead', () => {
    expect(confidenceOf(0.5, 5, false, 0.1)).toBe('low');
  });

  it('is high for a confirmed level of 5, a wide lead and a score of 0.67', () => {
    expect(confidenceOf(0.67, 5, false, 0.33)).toBe('high');
  });

  it('is low for a skipped pursue part with a narrow lead in the built result', () => {
    expect(skipsConfirm('pursue', scenesNarrowPursue)).toBe(true);
    expect(leadsOf(scoreFamilies(scenesNarrowPursue)).pursue).toBeCloseTo(0.083, 3);
    const part = buildAssessment2Result({ ...blank(), scenes: scenesNarrowPursue, picks: { pursue: 'charmer' as const } }).parts.find((p) => p.key === 'member:charmer')!;
    expect(part.confidence).toBe('low');
  });
});

describe('result building (plan §4, §6)', () => {
  it('never stores an unmeasured axis as a value, and reports blending as unmeasured without an answer', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const } };
    const result = buildAssessment2Result(input);
    const part = result.parts.find((p) => p.key === 'member:rebel')!;
    expect(part.unmeasuredAxes).toEqual(['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING']);
    expect(part.blending).toBeNull();
    expect(part.placement).toBe('default');
  });

  it('turns a blending answer into a value and removes it from the unmeasured list', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, placed: { 'member:rebel': { energy: 0.1, direction: 0.2, depth: 0.3 } }, blending: { 'member:rebel': 'itIsMe' as const } };
    const part = buildAssessment2Result(input).parts.find((p) => p.key === 'member:rebel')!;
    expect(part.coordinates[3]).toBe(1);
    expect(part.unmeasuredAxes).toEqual([]);
  });

  it('keeps a person placement exactly, and marks it placed', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, placed: { 'member:rebel': { energy: 0.25, direction: -0.5, depth: 0.1 } } };
    const part = buildAssessment2Result(input).parts.find((p) => p.key === 'member:rebel')!;
    expect(part.placement).toBe('placed');
    expect([part.coordinates[0], part.coordinates[1], part.coordinates[2]]).toEqual([0.25, -0.5, 0.1]);
  });

  it('adds exile parts only from fear answers, and none on the lighter path', () => {
    const base = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'inner_critic' as const }, fears: { inner_critic: 'ashamed' as const } };
    expect(buildAssessment2Result(base).parts.some((p) => p.kind === 'exile' && p.exile === 'ashamed')).toBe(true);
    expect(buildAssessment2Result({ ...base, lighter: true }).parts.some((p) => p.kind === 'exile')).toBe(false);
  });

  it('gives no guards and no exile parts on the lighter path, and restores the guard when lighter is turned off', () => {
    const input = { ...blank(), scenes: scenesNarrowPursue, picks: { pursue: 'charmer' as const }, fears: { charmer: 'frightened' as const } };
    const light = buildAssessment2Result({ ...input, lighter: true });
    expect(light.parts.find((p) => p.key === 'member:charmer')!.guards).toEqual([]);
    expect(light.parts.some((p) => p.kind === 'exile')).toBe(false);
    const full = buildAssessment2Result({ ...input, lighter: false });
    expect(full.parts.find((p) => p.key === 'member:charmer')!.guards).toContain('frightened');
  });

  it('defaults an exile need to its mapped need and keeps a person choice', () => {
    const base = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'inner_critic' as const }, fears: { inner_critic: 'ashamed' as const } };
    expect(buildAssessment2Result(base).parts.find((p) => p.exile === 'ashamed')!.need).toBe('worth');
    const chosen = buildAssessment2Result({ ...base, exileNeed: { ashamed: 'safety' as const } });
    expect(chosen.parts.find((p) => p.exile === 'ashamed')!.need).toBe('safety');
  });

  it('flags a support prompt when steadiness is 1 or three exiles are at level 5', () => {
    expect(buildAssessment2Result({ ...blank(), steadiness: 1 }).supportPrompt).toBe(true);
    expect(buildAssessment2Result({ ...blank(), steadiness: 3 }).supportPrompt).toBe(false);
  });

  it('keeps only known ground items and sorts completed stages', () => {
    const result = buildAssessment2Result({ ...blank(), completedStages: [3, 1, 3], ground: ['breath', 'bogus' as any] });
    expect(result.completedStages).toEqual([1, 3]);
    expect(result.ground).toEqual(['breath']);
  });

  it('builds a result that passes the validator, and rejects a tampered one', () => {
    const result = buildAssessment2Result({ ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, fears: { rebel: 'unseen' as const } });
    expect(isAssessment2Result(JSON.parse(JSON.stringify(result)))).toBe(true);
    const tampered = JSON.parse(JSON.stringify(result));
    tampered.parts[0].coordinates = [2, 0, 0, 0];
    expect(isAssessment2Result(tampered)).toBe(false);
    expect(isAssessment2Result({ ...result, instrument: 'legacy64' })).toBe(false);
  });
});

describe('conflicts (plan §3.4, §5.2)', () => {
  /** A minimal part: only the fields the conflict rules read. */
  const part = (over: Partial<MapPart>): MapPart => ({
    key: 'x', kind: 'protector', rank: null, level: null, confidence: null, guards: [], costume: null, placement: 'default',
    coordinates: [0, 0, 0, 0], unmeasuredAxes: [], blending: null, mapFamily: 'manager', ...over,
  } as MapPart);

  it('derives a need-against-need tension from the two strongest exiles with opposing needs', () => {
    const parts = [
      part({ key: 'exile:abandoned', kind: 'exile', exile: 'abandoned', need: 'connection', level: 5, mapFamily: 'exile' }),
      part({ key: 'exile:powerless', kind: 'exile', exile: 'powerless', need: 'agency', level: 4, mapFamily: 'exile' }),
    ];
    expect(deriveConflicts(parts)).toEqual([{ type: 'need-against-need', keys: ['exile:abandoned', 'exile:powerless'] }]);
  });

  it('does not flag need against need when the two strongest exiles share no opposing pair', () => {
    const parts = [
      part({ key: 'exile:abandoned', kind: 'exile', exile: 'abandoned', need: 'connection', level: 5, mapFamily: 'exile' }),
      part({ key: 'exile:outsider', kind: 'exile', exile: 'outsider', need: 'connection', level: 4, mapFamily: 'exile' }),
    ];
    expect(deriveConflicts(parts).some((c) => c.type === 'need-against-need')).toBe(false);
  });

  it('flags the critic against a shame part when both are present', () => {
    const parts = [
      part({ key: 'member:inner_critic', member: 'inner_critic' as MemberId, family: 'attack', target: 'self', guards: ['ashamed'] }),
      part({ key: 'exile:ashamed', kind: 'exile', exile: 'ashamed', need: 'worth', level: 2, mapFamily: 'exile' }),
    ];
    expect(deriveConflicts(parts).map((c) => c.type)).toContain('critic-against-criticised');
  });

  it('derives the type-3 critic from MEMBER_DEFS: exactly inner_critic', () => {
    expect(SELF_ATTACK_MEMBERS).toEqual(['inner_critic']);
  });

  it('flags two protectors that guard the same exile and sit a full unit apart', () => {
    const parts = [
      part({ key: 'member:rebel', member: 'rebel' as MemberId, family: 'attack', target: 'others', guards: ['frightened'], coordinates: [0.8, 0.3, 0.3, 0] }),
      part({ key: 'member:numb', member: 'numb' as MemberId, family: 'numbSoothe', target: 'self', guards: ['frightened'], coordinates: [-0.8, -0.5, 0.3, 0] }),
    ];
    expect(deriveConflicts(parts).map((c) => c.type)).toContain('strategy-against-strategy');
  });
});

describe('copy coverage (plan §7)', () => {
  it('covers every scene, family, member, exile, need, provider, capacity, ground item and costume', () => {
    for (const value of Object.values(copyCoverage)) expect(value).toBe(true);
  });

  it('keeps the exact ground, capacity and provider-form copy', () => {
    expect(GROUND_COPY.containerForLater.en).toBe('Set it down somewhere safe to come back to later');
    expect(CAPACITY_COPY.player.name).toEqual({ en: 'Player', ru: 'Исследователь' });
    for (const form of ['realPerson', 'idealParent'] as const) {
      expect(PROVIDER_FORMS).toContain(form);
      expect(PROVIDER_FORM_COPY[form].en).not.toBe('');
      expect(PROVIDER_FORM_COPY[form].ru).not.toBe('');
    }
  });

  it('has three confirm items for every member', () => {
    for (const member of MEMBERS) expect(CONFIRM_COPY[member]).toHaveLength(3);
  });

  it('has a reaction card for every family in every scene (30)', () => {
    expect(Object.keys(REACTION_COPY)).toHaveLength(30);
  });

  it('uses «вы» and never «ты» in Russian copy', () => {
    const ru: string[] = [];
    const walk = (value: unknown): void => {
      if (typeof value === 'string') return void ru.push(value);
      if (Array.isArray(value)) return value.forEach(walk);
      if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk({ scenes: copyCoverage, UI_COPY });
    walk(REACTION_COPY);
    walk(CONFIRM_COPY);
    for (const text of ru) expect(text).not.toMatch(/\bты\b/i);
  });
});

describe('review fixes', () => {
  it('ignores a fear left on a member who was changed to another pick', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, fears: { inner_critic: 'ashamed' as const } };
    expect(buildAssessment2Result(input).parts.some((p) => p.kind === 'exile')).toBe(false);
  });

  it('derives no conflict from exiles whose levels are unknown', () => {
    const parts = [
      { key: 'exile:abandoned', kind: 'exile', exile: 'abandoned', need: 'connection', level: null, guards: [], coordinates: [0, 0, 0, 0], unmeasuredAxes: [], blending: null, mapFamily: 'exile' },
      { key: 'exile:powerless', kind: 'exile', exile: 'powerless', need: 'agency', level: null, guards: [], coordinates: [0, 0, 0, 0], unmeasuredAxes: [], blending: null, mapFamily: 'exile' },
    ] as unknown as MapPart[];
    expect(deriveConflicts(parts)).toEqual([]);
  });
});

describe('placement answers: depth and unknown axes', () => {
  const rebelWith = (placed: Assessment2Input['placed']) => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, placed };
    return buildAssessment2Result(input).parts.find((p) => p.key === 'member:rebel')!;
  };

  it('treats a drag on the pad alone as no depth answer', () => {
    const part = rebelWith({ 'member:rebel': { energy: 0.25, direction: 0.5 } });
    expect(part.depthState).toBe('unanswered');
    expect(part.unmeasuredAxes).toContain('DEPTH');
    expect(part.unmeasuredAxes).not.toContain('ENERGY');
    expect(part.unmeasuredAxes).not.toContain('DIRECTION');
    expect(part.placement).toBe('placed');
  });

  it('records depth only when the person set it', () => {
    const part = rebelWith({ 'member:rebel': { energy: 0.25, direction: 0.5, depth: 0.3 } });
    expect(part.depthState).toBe('set');
    expect(part.unmeasuredAxes).not.toContain('DEPTH');
    expect(part.coordinates[2]).toBe(0.3);
  });

  it('keeps "not sure" distinct from "not answered", and both unknown', () => {
    const part = rebelWith({ 'member:rebel': { energy: 0.25, direction: 0.5, depth: null } });
    expect(part.depthState).toBe('unsure');
    expect(part.unmeasuredAxes).toContain('DEPTH');
  });

  it('marks every axis unknown when placement is skipped, and records no default as an answer', () => {
    const part = rebelWith({});
    expect(part.placement).toBe('default');
    expect(part.unmeasuredAxes).toEqual(expect.arrayContaining(['ENERGY', 'DIRECTION', 'DEPTH']));
    expect(part.depthState).toBe('unanswered');
  });

  it('does not separate two protectors on axes that neither has answered', () => {
    const base = { kind: 'protector', target: 'others', guards: ['frightened'], rank: null, level: null, confidence: null,
      placement: 'default', costume: null, blending: null, mapFamily: 'firefighter', depthState: 'unanswered', unmeasuredAxes: ['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING'] };
    const parts = [
      { ...base, key: 'member:rebel', member: 'rebel', family: 'attack', coordinates: [0.8, 0.3, 0.3, 0] },
      { ...base, key: 'member:numb', member: 'numb', family: 'numbSoothe', coordinates: [-0.8, -0.5, 0.3, 0] },
    ] as unknown as MapPart[];
    expect(deriveConflicts(parts).map((c) => c.type)).not.toContain('strategy-against-strategy');
  });

  it('rejects a stored result whose unknown-axis list names an axis that does not exist', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const } };
    const result = JSON.parse(JSON.stringify(buildAssessment2Result(input)));
    expect(isAssessment2Result({ ...result, parts: [{ ...result.parts[0], unmeasuredAxes: ['FOCUS'] }, ...result.parts.slice(1)] })).toBe(false);
  });
});

describe('depth answer rules: drafts, validator and conflicts', () => {
  it('keeps only real axis values from a draft, and keeps depth null as "not sure"', () => {
    expect(sanitizePlaced({ 'member:rebel': { energy: 'x', direction: 0.4, depth: null }, 'member:numb': { energy: NaN } }))
      .toEqual({ 'member:rebel': { direction: 0.4, depth: null } });
    expect(sanitizePlaced(null)).toEqual({});
  });

  it('requires a depth state that agrees with the unknown-axis list', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const } };
    const valid = JSON.parse(JSON.stringify(buildAssessment2Result(input)));
    expect(isAssessment2Result(valid)).toBe(true);
    const missingState = { ...valid, parts: valid.parts.map((p: any) => ({ ...p, depthState: undefined })) };
    expect(isAssessment2Result(missingState)).toBe(false);
    const claimsAnswer = { ...valid, parts: valid.parts.map((p: any) => ({ ...p, depthState: 'set' })) };
    expect(isAssessment2Result(claimsAnswer)).toBe(false);
  });

  it('does not separate two protectors when only one of them has answered an axis', () => {
    const base = { kind: 'protector', target: 'others', guards: ['frightened'], rank: null, level: null, confidence: null,
      placement: 'placed', costume: null, blending: null, mapFamily: 'firefighter', depthState: 'unanswered' };
    const parts = [
      { ...base, key: 'member:rebel', member: 'rebel', family: 'attack', coordinates: [0.8, 0.3, 0.3, 0], unmeasuredAxes: ['DIRECTION', 'DEPTH', 'BLENDING'] },
      { ...base, key: 'member:numb', member: 'numb', family: 'numbSoothe', coordinates: [-0.8, -0.5, 0.3, 0], unmeasuredAxes: ['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING'] },
    ] as unknown as MapPart[];
    expect(deriveConflicts(parts).map((c) => c.type)).not.toContain('strategy-against-strategy');
  });
});

describe('skipped timing is unknown, not a default (plan §3.1, D1)', () => {
  const skippedInputs: Array<Assessment2Input['timing']> = [{}, { rebel: null }];
  const rebelWithTiming = (timing: Assessment2Input['timing']) =>
    buildAssessment2Result({ ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, timing }).parts.find((p) => p.key === 'member:rebel')!;

  it('keeps a skipped timing unknown, whether the key is absent or null', () => {
    for (const timing of skippedInputs) {
      const part = rebelWithTiming(timing);
      expect(part.timing).toBeNull();
      expect(part.classKnown).toBe(false);
      expect(part.mapFamily).toBe('manager');
      expect(part.coordinates[2]).toBe(0.45);
      expect(part.unmeasuredAxes).toContain('DEPTH');
      expect([part.coordinates[0], part.coordinates[1]]).toEqual([FAMILY_DEFAULT.attack.energy, FAMILY_DEFAULT.attack.direction]);
    }
  });

  it('keeps an answered timing: reactive stays reactive and classKnown is true', () => {
    const part = rebelWithTiming({ rebel: 'reactive' as const });
    expect(part.timing).toBe('reactive');
    expect(part.classKnown).toBe(true);
    expect(part.mapFamily).toBe('firefighter');
  });

  it('accepts a null protector timing in the validator, and rejects any other timing value', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const } };
    const result = JSON.parse(JSON.stringify(buildAssessment2Result(input)));
    expect(isAssessment2Result(result)).toBe(true);
    const tampered = { ...result, parts: result.parts.map((p: any) => (p.key === 'member:rebel' ? { ...p, timing: 'sometimes' } : p)) } as any;
    expect(isAssessment2Result(tampered)).toBe(false);
  });
});

describe('exile need source (plan §4 stage 5, G15)', () => {
  const base = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'inner_critic' as const }, fears: { inner_critic: 'ashamed' as const } };
  const ashamed = (input: Assessment2Input) => buildAssessment2Result(input).parts.find((p) => p.exile === 'ashamed')!;

  it("marks a need the person stored as 'user'", () => {
    const part = ashamed({ ...base, exileNeed: { ashamed: 'safety' as const } });
    expect(part.need).toBe('safety');
    expect(part.needSource).toBe('user');
  });

  it("marks the table need as 'table' when nothing is stored", () => {
    const part = ashamed(base);
    expect(part.need).toBe(EXILE_NEED.ashamed);
    expect(part.needSource).toBe('table');
  });

  it('validates an exile part with or without needSource, and rejects any other value', () => {
    const result = JSON.parse(JSON.stringify(buildAssessment2Result({ ...base, exileNeed: { ashamed: 'safety' as const } })));
    const withSource = (value: unknown) => ({ ...result, parts: result.parts.map((p: any) => (p.kind === 'exile' ? { ...p, needSource: value } : p)) });
    const withoutSource = JSON.parse(JSON.stringify(result));
    for (const part of withoutSource.parts) delete part.needSource;
    expect(isAssessment2Result(withoutSource)).toBe(true);
    expect(isAssessment2Result(withSource('user'))).toBe(true);
    expect(isAssessment2Result(withSource('table'))).toBe(true);
    expect(isAssessment2Result(withSource('guess'))).toBe(false);
    expect(isAssessment2Result(withSource(null))).toBe(false);
  });
});
