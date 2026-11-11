// Pilot analysis tools for Assessment 2.0 (plan §10–11; build-and-fix O3). Pure: no storage, network or clock reads.
// No pilot results exist yet. The tests use synthetic-* fixtures only, and no number this file produces is a finding.
// The thresholds are the plan's own. A flag only says that a value crosses a plan threshold, and it is not a pass.
// Every function returns null when its input is empty or unknown. An unknown value is never reported as zero.

import { MAP_AXIS_KEYS, type MapAxisKey, type MapCoordinates } from '../map-axes';

/** The plan's targets (plan §2) and the correlation threshold (plan §10). */
export const PILOT_TARGETS = {
  medianMinutes: 9,
  completionRate: 0.7,
  agreementWith147: 0.6,
  correlationFlag: 0.6,
} as const;

/** Share of starters who completed. Null when nobody started, which is unknown, not 0%. */
export function completionRate(starts: ReadonlyArray<{ completed: boolean }>): number | null {
  if (starts.length === 0) return null;
  return starts.filter((start) => start.completed).length / starts.length;
}

/** Median of the durations in minutes. Null when the list is empty, or when any value is not a finite, non-negative number. */
export function medianMinutes(minutes: ReadonlyArray<number>): number | null {
  if (minutes.length === 0 || !minutes.every((m) => Number.isFinite(m) && m >= 0)) return null;
  const sorted = [...minutes].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Whether two of the top three parts repeat between two runs. Null unless both runs list exactly three distinct parts. */
export function retestTopThree(first: ReadonlyArray<string>, second: ReadonlyArray<string>): boolean | null {
  const isTopThree = (run: ReadonlyArray<string>) => run.length === 3 && new Set(run).size === 3;
  if (!isTopThree(first) || !isTopThree(second)) return null;
  const repeated = first.filter((part) => second.includes(part)).length;
  return repeated >= 2;
}

/**
 * Share of people whose 2.0 top family matches the family of the 147's top part (plan §2: 60%). A person counts only
 * when both families are known. Null when no person has both.
 */
export function agreementWith147(people: ReadonlyArray<{ twoFamily: string | null; oneFortySevenFamily: string | null }>): number | null {
  const known = people.filter((person) => person.twoFamily !== null && person.oneFortySevenFamily !== null);
  if (known.length === 0) return null;
  return known.filter((person) => person.twoFamily === person.oneFortySevenFamily).length / known.length;
}

/** Pearson correlation of two equal-length lists. Null with fewer than three pairs, or when one list has no spread. */
export function pearson(xs: ReadonlyArray<number>, ys: ReadonlyArray<number>): number | null {
  if (xs.length !== ys.length) throw new Error('pearson needs two lists of the same length');
  const n = xs.length;
  if (n < 3) return null;
  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;
  let cross = 0;
  let spreadX = 0;
  let spreadY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cross += dx * dy;
    spreadX += dx * dx;
    spreadY += dy * dy;
  }
  if (spreadX === 0 || spreadY === 0) return null;
  return cross / Math.sqrt(spreadX * spreadY);
}

export interface AxisPairCorrelation {
  readonly pair: readonly [MapAxisKey, MapAxisKey];
  /** Placed parts that set both axes. */
  readonly n: number;
  readonly r: number | null;
  /** True when the magnitude of r is above the threshold (plan §10: no pair may correlate above 0.6). */
  readonly flagged: boolean;
}

/**
 * Pairwise correlations of Energy, Direction and Depth across placed parts. Only parts that are placed, and that set
 * both axes of a pair, count for that pair. Defaults are left out, because a default is not a measurement of the person.
 */
export function axisCorrelations(
  parts: ReadonlyArray<{ placement: 'placed' | 'default'; coordinates: MapCoordinates; unmeasuredAxes: ReadonlyArray<MapAxisKey> }>,
): AxisPairCorrelation[] {
  const placed = parts.filter((part) => part.placement === 'placed');
  const pairs: Array<readonly [MapAxisKey, MapAxisKey]> = [['ENERGY', 'DIRECTION'], ['ENERGY', 'DEPTH'], ['DIRECTION', 'DEPTH']];
  return pairs.map(([a, b]) => {
    const both = placed.filter((part) => !part.unmeasuredAxes.includes(a) && !part.unmeasuredAxes.includes(b));
    const indexA = MAP_AXIS_KEYS.indexOf(a);
    const indexB = MAP_AXIS_KEYS.indexOf(b);
    const r = pearson(both.map((part) => part.coordinates[indexA]), both.map((part) => part.coordinates[indexB]));
    return { pair: [a, b], n: both.length, r, flagged: r !== null && Math.abs(r) > PILOT_TARGETS.correlationFlag };
  });
}

/**
 * Reframe against Withdraw across people. The plan wants the scores not to move together above 0.6, so a flag is a
 * positive correlation above the threshold. A person counts only when both scores are known.
 */
export function reframeWithdrawCorrelation(people: ReadonlyArray<{ reframe: number | null; withdraw: number | null }>): {
  readonly n: number;
  readonly r: number | null;
  readonly flagged: boolean;
} {
  const both = people.filter((person): person is { reframe: number; withdraw: number } => person.reframe !== null && person.withdraw !== null);
  const r = pearson(both.map((person) => person.reframe), both.map((person) => person.withdraw));
  return { n: both.length, r, flagged: r !== null && r > PILOT_TARGETS.correlationFlag };
}

/**
 * Mean "fits me" rating of the 2.0 top three parts, minus the mean for the 147's top three (plan §10: higher for 2.0).
 * Null when either side has no rating, or when a rating is not a finite number.
 */
export function fitsMeDelta(twoRatings: ReadonlyArray<number>, oneFortySevenRatings: ReadonlyArray<number>): number | null {
  const allFinite = (values: ReadonlyArray<number>) => values.every((value) => Number.isFinite(value));
  if (twoRatings.length === 0 || oneFortySevenRatings.length === 0) return null;
  if (!allFinite(twoRatings) || !allFinite(oneFortySevenRatings)) return null;
  const mean = (values: ReadonlyArray<number>) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return mean(twoRatings) - mean(oneFortySevenRatings);
}
