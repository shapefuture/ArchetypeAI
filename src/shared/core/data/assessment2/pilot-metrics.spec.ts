import { describe, expect, it } from 'vitest';
import type { MapAxisKey, MapCoordinates } from '../map-axes';
import {
  PILOT_TARGETS, agreementWith147, axisCorrelations, completionRate, fitsMeDelta, medianMinutes, pearson, reframeWithdrawCorrelation, retestTopThree,
} from './pilot-metrics';

// Every fixture here is synthetic. No pilot has run, so no test reports a finding about people.

type Part = { placement: 'placed' | 'default'; coordinates: MapCoordinates; unmeasuredAxes: ReadonlyArray<MapAxisKey> };
const part = (placement: Part['placement'], coordinates: MapCoordinates, unmeasuredAxes: MapAxisKey[] = []): Part => ({ placement, coordinates, unmeasuredAxes });

describe('pilot measures on synthetic fixtures (plan §2, §10; O3)', () => {
  it('uses the targets written in the plan', () => {
    expect(PILOT_TARGETS).toEqual({ medianMinutes: 9, completionRate: 0.7, agreementWith147: 0.6, correlationFlag: 0.6 });
  });

  it('gives the completion share of starters, and unknown rather than zero when nobody started', () => {
    expect(completionRate([{ completed: true }, { completed: true }, { completed: true }, { completed: false }])).toBe(0.75);
    expect(completionRate([])).toBeNull();
  });

  it('gives the median minutes, and unknown when a duration is missing or negative', () => {
    expect(medianMinutes([7, 3, 11])).toBe(7);
    expect(medianMinutes([3, 7, 11, 13])).toBe(9);
    expect(medianMinutes([])).toBeNull();
    expect(medianMinutes([3, Number.NaN])).toBeNull();
    expect(medianMinutes([3, -1])).toBeNull();
  });

  it('counts a retest as repeating when two of the three top parts come back', () => {
    expect(retestTopThree(['synthetic-a', 'synthetic-b', 'synthetic-c'], ['synthetic-b', 'synthetic-c', 'synthetic-d'])).toBe(true);
    expect(retestTopThree(['synthetic-a', 'synthetic-b', 'synthetic-c'], ['synthetic-c', 'synthetic-d', 'synthetic-e'])).toBe(false);
    expect(retestTopThree(['synthetic-a', 'synthetic-b'], ['synthetic-a', 'synthetic-b', 'synthetic-c'])).toBeNull();
  });

  it('gives the share of people whose top families match the 147, leaving out anyone with an unknown family', () => {
    const people = [
      { twoFamily: 'attack', oneFortySevenFamily: 'attack' },
      { twoFamily: 'attack', oneFortySevenFamily: 'withdraw' },
      { twoFamily: 'pursue', oneFortySevenFamily: 'pursue' },
      { twoFamily: 'reframe', oneFortySevenFamily: 'reframe' },
      { twoFamily: 'appease', oneFortySevenFamily: 'withdraw' },
      { twoFamily: null, oneFortySevenFamily: 'attack' },
    ];
    expect(agreementWith147(people)).toBe(0.6);
    expect(agreementWith147([{ twoFamily: null, oneFortySevenFamily: null }])).toBeNull();
  });

  it('gives the Pearson correlation of two lists, and unknown with fewer than three pairs or no spread', () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
    expect(pearson([1, 2], [2, 4])).toBeNull();
    expect(pearson([1, 1, 1], [2, 4, 6])).toBeNull();
    expect(() => pearson([1, 2, 3], [1, 2])).toThrow();
  });

  it('flags a pair of plotted axes above 0.6 in either direction, and not one below it', () => {
    const energyDirection = [part('placed', [-0.5, -0.5, 0.5, 0]), part('placed', [0, 0, -0.5, 0]), part('placed', [0.5, 0.5, 0.5, 0]), part('placed', [1, 1, -0.5, 0])];
    const byPair = Object.fromEntries(axisCorrelations(energyDirection).map((row) => [row.pair.join('-'), row]));
    expect(byPair['ENERGY-DIRECTION'].r).toBeCloseTo(1, 10);
    expect(byPair['ENERGY-DIRECTION'].flagged).toBe(true);
    expect(byPair['ENERGY-DEPTH'].flagged).toBe(false);
    expect(byPair['DIRECTION-DEPTH'].flagged).toBe(false);

    const opposite = [part('placed', [-0.5, 0.5, 0, 0]), part('placed', [0, 0, 0.5, 0]), part('placed', [0.5, -0.5, -0.5, 0]), part('placed', [1, -1, 0.5, 0])];
    expect(Object.fromEntries(axisCorrelations(opposite).map((row) => [row.pair.join('-'), row]))['ENERGY-DIRECTION'].flagged).toBe(true);
  });

  it('uses only placed parts that set both axes of a pair, and leaves defaults out', () => {
    const parts: Part[] = [
      part('placed', [-0.5, -0.5, 0.5, 0]),
      part('placed', [0, 0, -0.5, 0]),
      part('placed', [0.5, 0.5, 0.5, 0]),
      part('placed', [1, 1, -0.5, 0]),
      part('placed', [0.9, 0.2, 0.1, 0], ['ENERGY']),
      part('default', [-1, 1, 1, 0]),
    ];
    const byPair = Object.fromEntries(axisCorrelations(parts).map((row) => [row.pair.join('-'), row]));
    expect(byPair['ENERGY-DIRECTION'].n).toBe(4);
    expect(byPair['ENERGY-DEPTH'].n).toBe(4);
    expect(byPair['DIRECTION-DEPTH'].n).toBe(5);
  });

  it('gives no correlation when a pair has fewer than three parts', () => {
    const [row] = axisCorrelations([part('placed', [0.1, 0.2, 0.3, 0]), part('placed', [0.4, 0.5, 0.6, 0])]);
    expect(row).toMatchObject({ n: 2, r: null, flagged: false });
  });

  it('flags reframe and withdraw only when they move together above 0.6', () => {
    const moving = [1, 2, 3, 4].map((value) => ({ reframe: value, withdraw: value * 2 + 1 }));
    const movingResult = reframeWithdrawCorrelation(moving);
    expect(movingResult.n).toBe(4);
    expect(movingResult.r).toBeCloseTo(1, 10);
    expect(movingResult.flagged).toBe(true);

    const opposite = [1, 2, 3, 4].map((value) => ({ reframe: value, withdraw: -value }));
    expect(reframeWithdrawCorrelation(opposite).flagged).toBe(false);
    expect(reframeWithdrawCorrelation([{ reframe: 1, withdraw: null }, { reframe: 2, withdraw: 4 }])).toEqual({ n: 1, r: null, flagged: false });
  });

  it('gives the mean "fits me" rating of 2.0 minus the 147, and unknown when either side has no rating', () => {
    expect(fitsMeDelta([4, 5, 4], [3, 3, 4])).toBeCloseTo(1, 10);
    expect(fitsMeDelta([], [3])).toBeNull();
    expect(fitsMeDelta([4], [])).toBeNull();
    expect(fitsMeDelta([4, Number.NaN], [3])).toBeNull();
  });
});
