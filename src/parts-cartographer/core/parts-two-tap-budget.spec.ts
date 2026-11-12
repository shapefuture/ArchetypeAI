import { describe, expect, it } from 'vitest';
import type { Assessment2Input } from '../../shared/core/data/assessment2/scoring';
import { buildScreens, namedExiles, namedMembers, type Parts2Screen } from './parts-two-flow';

// The tap budget (build-and-fix B11). The weights are the first estimates from B11 (G28): they are estimates, not
// measurements, and the pilot settles them. The owner raised the budgets on 2026-11-11, from 55 and 70 to the measured
// 57 and 73, with no change to the flow. Each budget is a bound on the taps of one path through the screens.

const TAPS: Record<Parts2Screen['kind'], number> = {
  ground: 1, scene: 2, pick: 1, timing: 2, confirm: 3, fear: 1, exile: 1, blend: 1, wants: 1, provider: 2,
  capacity: 2, centre: 3, ground2: 1, place: 2, result: 0,
};
const TYPICAL_BUDGET = 57;
const LONGEST_BUDGET = 73;

const tapsOf = (screens: Parts2Screen[]): number => screens.reduce((sum, screen) => sum + TAPS[screen.kind], 0);
const countOf = (screens: Parts2Screen[], kind: Parts2Screen['kind']): number => screens.filter((screen) => screen.kind === kind).length;

const blank = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

// Typical path: three protectors and three exiles. The attack protector's confirm is skipped, because attack is the
// most-chosen family in every one of its appearances and is never the least-chosen one.
const typical: Assessment2Input = {
  ...blank(),
  scenes: [
    { scene: 'criticised', most: 'attack', least: 'overPerform' },
    { scene: 'leftOut', most: 'attack', least: 'pursue' },
    { scene: 'lineCrossed', most: 'attack', least: 'overControl' },
    { scene: 'fellThrough', most: 'reframe', least: 'numbSoothe' },
    { scene: 'planChanged', most: 'reframe', least: 'overPerform' },
    { scene: 'freeEvening', most: 'withdraw', least: 'numbSoothe' },
  ],
  picks: { attack: 'inner_critic', reframe: 'bypasser', withdraw: 'hermit' },
  fears: { inner_critic: 'frightened', bypasser: 'unseen', hermit: 'ashamed' },
};

// Longest path: four protectors and four exiles, with lighter off. Every family scores 0, so the top four tie and the
// fourth family falls within the margin. No family is most-chosen often enough to skip a confirm.
const longest: Assessment2Input = {
  ...blank(),
  scenes: [
    { scene: 'criticised', most: 'attack', least: 'withdraw' },
    { scene: 'leftOut', most: 'appease', least: 'attack' },
    { scene: 'lineCrossed', most: 'withdraw', least: 'appease' },
    { scene: 'fellThrough', most: 'overPerform', least: 'pursue' },
    { scene: 'planChanged', most: 'overControl', least: 'overPerform' },
    { scene: 'freeEvening', most: 'pursue', least: 'overControl' },
  ],
  picks: { overPerform: 'taskmaster', overControl: 'controller', attack: 'inner_critic', appease: 'pleaser' },
  fears: { taskmaster: 'frightened', controller: 'unseen', inner_critic: 'ashamed', pleaser: 'abandoned' },
};

describe('the tap budget on the typical and longest paths (B11, G28)', () => {
  it('builds the typical path the budget describes: three protectors, three exiles, one confirm skipped', () => {
    const screens = buildScreens(typical);
    expect(namedMembers(typical)).toHaveLength(3);
    expect(namedExiles(typical)).toHaveLength(3);
    expect(countOf(screens, 'pick')).toBe(3);
    expect(countOf(screens, 'confirm')).toBe(2);
  });

  it('keeps the typical path within its budget, with the Centre counted', () => {
    const taps = tapsOf(buildScreens(typical));
    expect(taps, `typical path taps (budget ${TYPICAL_BUDGET})`).toBeLessThanOrEqual(TYPICAL_BUDGET);
  });

  it('builds the longest path the budget describes: four protectors, four exiles, lighter off', () => {
    const screens = buildScreens(longest);
    expect(namedMembers(longest)).toHaveLength(4);
    expect(namedExiles(longest)).toHaveLength(4);
    expect(countOf(screens, 'pick')).toBe(4);
    expect(countOf(screens, 'confirm')).toBe(4);
  });

  it('keeps the longest path within its budget, with the Centre counted', () => {
    const taps = tapsOf(buildScreens(longest));
    expect(taps, `longest path taps (budget ${LONGEST_BUDGET})`).toBeLessThanOrEqual(LONGEST_BUDGET);
  });
});
