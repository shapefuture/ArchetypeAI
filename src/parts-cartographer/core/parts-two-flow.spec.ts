import { describe, expect, it } from 'vitest';
import { SCENES, SCENE_FAMILIES, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { FAMILIES, type ExileId, type FamilyId } from '../../shared/core/data/assessment2/taxonomy';
import { buildScreens, completedStagesFor, namedExiles, namedMembers, stageOf, type Parts2Screen } from './parts-two-flow';

const blank = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

/** Every scene answered, with the same family most and least where the scene shows it. */
const scenesFavouring = (most: FamilyId, least: FamilyId): SceneAnswer[] =>
  SCENES.map((scene) => ({
    scene,
    most: SCENE_FAMILIES[scene].includes(most) ? most : SCENE_FAMILIES[scene][0],
    least: SCENE_FAMILIES[scene].includes(least) ? least : SCENE_FAMILIES[scene][1],
  }));

const kinds = (screens: Parts2Screen[]) => screens.map((s) => s.kind);

describe('Assessment 2.0 screen order (plan §4)', () => {
  it('asks the ground question, then six scenes, and nothing else until every scene is answered', () => {
    const screens = buildScreens(blank());
    expect(kinds(screens)).toEqual(['ground', 'scene', 'scene', 'scene', 'scene', 'scene', 'scene']);
    const partial = { ...blank(), scenes: scenesFavouring('attack', 'withdraw').slice(0, 5) };
    expect(buildScreens(partial)).toHaveLength(7);
  });

  it('then picks one member per top family, times and confirms the picks, and ends with the result', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, timing: { rebel: 'reactive' as const } };
    const list = kinds(buildScreens(input));
    expect(list.slice(7, 9)).toEqual(['pick', 'pick']);
    expect(list.slice(-4)).toEqual(['capacity', 'ground2', 'place', 'result']);
    expect(list).toContain('timing');
  });

  it('keeps the exile questions on by default, and skips them all on the lighter path', () => {
    const picked = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'inner_critic' as const }, fears: { inner_critic: 'ashamed' as const } };
    expect(kinds(buildScreens(picked))).toEqual(expect.arrayContaining(['fear', 'exile', 'provider']));
    const lighter = buildScreens({ ...picked, lighter: true });
    expect(kinds(lighter)).not.toEqual(expect.arrayContaining(['fear', 'exile', 'provider']));
    expect(lighter.some((s) => s.kind === 'blend' && s.key === 'member:inner_critic')).toBe(true);
    expect(lighter.some((s) => s.kind === 'blend' && s.key.startsWith('exile:'))).toBe(false);
  });

  it('asks a confirm screen only where the skip rule does not apply', () => {
    const scenes = scenesFavouring('attack', 'withdraw');
    const input = { ...blank(), scenes, picks: { attack: 'rebel' as const, withdraw: 'hermit' as const } };
    const confirms = buildScreens(input).filter((s) => s.kind === 'confirm').map((s) => (s as { member: string }).member);
    expect(confirms).toEqual(['hermit']);
  });

  it('keeps every stage in order and assigns each screen to exactly one stage', () => {
    const input = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'inner_critic' as const }, fears: { inner_critic: 'ashamed' as const } };
    const stages = buildScreens(input).map(stageOf);
    expect(stages).toEqual([...stages].sort((a, b) => a - b));
    // Stage 3 is absent: the scenes settle attack, so its confirm screen is skipped (plan §5).
    expect(new Set(stages)).toEqual(new Set([0, 1, 2, 4, 5, 6, 7]));
  });

  it('names the members and exiles the person has chosen, in a fixed order', () => {
    const input = { ...blank(), picks: { attack: 'rebel' as const, withdraw: 'none' as const }, fears: { rebel: 'frightened' as const, inner_critic: 'none' as const } };
    expect(namedMembers(input)).toEqual(['rebel']);
    expect(namedExiles(input)).toEqual(['frightened']);
  });

  it('leaves stage 4 out of the completed stages on the lighter path, and keeps the rest', () => {
    expect(completedStagesFor(blank())).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(completedStagesFor({ ...blank(), lighter: true })).toEqual([0, 1, 2, 3, 5, 6]);
  });

  it('gives the screens the stages the plan names', () => {
    expect(FAMILIES).toHaveLength(8);
    expect(stageOf({ kind: 'ground' })).toBe(0);
    expect(stageOf({ kind: 'scene', scene: 'criticised', index: 0 })).toBe(1);
    expect(stageOf({ kind: 'timing', member: 'rebel' })).toBe(2);
    expect(stageOf({ kind: 'confirm', member: 'rebel' })).toBe(3);
    expect(stageOf({ kind: 'fear', member: 'rebel' })).toBe(4);
    expect(stageOf({ kind: 'wants', exile: 'frightened' })).toBe(5);
    expect(stageOf({ kind: 'provider', exile: 'frightened' })).toBe(5);
    expect(stageOf({ kind: 'place' })).toBe(6);
    expect(stageOf({ kind: 'result' })).toBe(7);
  });
});

describe('exile names follow the picks', () => {
  it('names no exile from a fear left on a member who is no longer picked', () => {
    expect(namedExiles({ ...blank(), picks: { attack: 'inner_critic' as const }, fears: { rebel: 'frightened' as const } })).toEqual([]);
  });
});

describe('the wants screen sits between the exile blend and the provider (plan §4 stage 5)', () => {
  const picked = { ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'inner_critic' as const }, fears: { inner_critic: 'ashamed' as const } };

  it('orders exile level (stage 4), then exile blend, wants and provider (stage 5)', () => {
    const screens = buildScreens(picked);
    const at = (match: (screen: Parts2Screen) => boolean) => screens.findIndex(match);
    const exileAt = at((s) => s.kind === 'exile' && s.exile === 'ashamed');
    const blendAt = at((s) => s.kind === 'blend' && s.key === 'exile:ashamed');
    const wantsAt = at((s) => s.kind === 'wants' && s.exile === 'ashamed');
    const providerAt = at((s) => s.kind === 'provider' && s.exile === 'ashamed');
    expect([exileAt, blendAt, wantsAt, providerAt].every((index) => index > -1)).toBe(true);
    expect(exileAt).toBeLessThan(blendAt);
    expect(blendAt).toBeLessThan(wantsAt);
    expect(wantsAt).toBeLessThan(providerAt);
    expect([stageOf(screens[exileAt]), stageOf(screens[wantsAt]), stageOf(screens[providerAt])]).toEqual([4, 5, 5]);
  });

  it('has one wants screen per named exile, in the exile order', () => {
    const two = { ...picked, picks: { attack: 'inner_critic' as const, withdraw: 'hermit' as const }, fears: { inner_critic: 'ashamed' as const, hermit: 'powerless' as const } };
    expect(buildScreens(two).filter((s) => s.kind === 'wants').map((s) => (s as { exile: ExileId }).exile)).toEqual(['ashamed', 'powerless']);
  });

  it('has no wants screen on the lighter path', () => {
    expect(kinds(buildScreens({ ...picked, lighter: true }))).not.toContain('wants');
  });
});
