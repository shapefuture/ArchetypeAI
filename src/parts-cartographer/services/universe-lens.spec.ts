import { describe, expect, it } from 'vitest';
import {
  archetypeCoordinatePosition,
  coordinateAffinity,
  DEFAULT_AXES,
  normalizeAxes,
  sanitizeArchetypeCoordinates,
  setAxisChoice,
  ZERO_DIMENSIONS,
} from './universe-lens';

const dimensions = (overrides: Partial<typeof ZERO_DIMENSIONS> = {}) => ({ ...ZERO_DIMENSIONS, ...overrides });

// Tuple order is energy, direction, depth, blending (plan §3.5). The default plot is energy (x), depth (y), direction (z).
describe('universe dimensional lens (map axes)', () => {
  it('rejects malformed coordinate records and clamps valid imported values', () => {
    expect(sanitizeArchetypeCoordinates([0, 0, Number.NaN, 0])).toBeNull();
    expect(sanitizeArchetypeCoordinates([0, 1, 2, 0])).toEqual([0, 1, 1, 0]);
    expect(sanitizeArchetypeCoordinates([0, '1', 0, 0])).toBeNull();
  });

  it('plots energy, depth and direction, and never plots blending', () => {
    expect(archetypeCoordinatePosition([0, 0, 0, 0])).toEqual([0, 0, 0]);
    expect(archetypeCoordinatePosition([1, 0, 0, 0])).toEqual([10, 0, 0]);
    expect(archetypeCoordinatePosition([0, 0, 1, 0])).toEqual([0, 10, 0]);
    expect(archetypeCoordinatePosition([0, 1, 0, 0])).toEqual([0, 0, 10]);
    expect(archetypeCoordinatePosition([0, 0, 0, 1])).toEqual([0, 0, 0]);
  });

  it('maps selected axes in the order chosen, and isolates blending or direction exactly', () => {
    expect(archetypeCoordinatePosition([.2, .4, .6, .8], ['BLENDING', 'DEPTH', 'ENERGY'])).toEqual([8, 6, 2]);
    expect(archetypeCoordinatePosition([.2, .4, .6, .8], undefined, 'BLENDING')).toEqual([2, 8, 0]);
    expect(archetypeCoordinatePosition([.2, .4, .6, .8], undefined, 'DIRECTION')).toEqual([0, 0, 4]);
  });

  it('uses weighted Gaussian affinity without moving coordinates', () => {
    expect(coordinateAffinity([1, 0, 0, 0], ZERO_DIMENSIONS)).toBe(0);
    expect(coordinateAffinity([1, 0, 0, 0], ZERO_DIMENSIONS, true)).toBe(.5);
    expect(coordinateAffinity([1, 0, 0, 0], dimensions({ ENERGY: 1 }))).toBe(1);
    expect(coordinateAffinity([-1, 0, 0, 0], dimensions({ ENERGY: 1 }))).toBeCloseTo(Math.exp(-8));
  });

  it('keeps the three plotted axes distinct when a chosen axis is already in use', () => {
    expect(setAxisChoice(['ENERGY', 'DIRECTION', 'DEPTH'], 1, 'ENERGY')).toEqual(['DIRECTION', 'ENERGY', 'DEPTH']);
    expect(setAxisChoice(['ENERGY', 'DIRECTION', 'DEPTH'], 0, 'ENERGY')).toEqual(['ENERGY', 'DIRECTION', 'DEPTH']);
    expect(setAxisChoice(['ENERGY', 'DIRECTION', 'DEPTH'], 2, 'BLENDING')).toEqual(['ENERGY', 'DIRECTION', 'BLENDING']);
  });

  it('normalizes unusable axis tuples to the default distinct projection', () => {
    expect(DEFAULT_AXES).toEqual(['ENERGY', 'DEPTH', 'DIRECTION']);
    expect(normalizeAxes(['ENERGY', 'ENERGY', 'DEPTH'])).toEqual(DEFAULT_AXES);
    expect(normalizeAxes(['BLENDING', 'DIRECTION', 'ENERGY'])).toEqual(['BLENDING', 'DIRECTION', 'ENERGY']);
    expect(normalizeAxes(['ENERGY', 'NOPE', 'DEPTH'])).toEqual(DEFAULT_AXES);
    expect(normalizeAxes(undefined)).toEqual(DEFAULT_AXES);
    // The old axis names are no longer valid, so a stored choice falls back to the default.
    expect(normalizeAxes(['AGENCY', 'TEMPERATURE', 'FOCUS'])).toEqual(DEFAULT_AXES);
  });
});

describe('unmeasured axes in the lens', () => {
  it('leaves an unmeasured axis out of the affinity, so its placeholder cannot move a part', () => {
    expect(coordinateAffinity([1, 0, 0, 0], dimensions({ ENERGY: 1 }), false, ['ENERGY'])).toBe(0);
    expect(coordinateAffinity([1, 0, 0, 0], dimensions({ ENERGY: 1, DEPTH: 1 }), false, ['DEPTH']))
      .toBeCloseTo(coordinateAffinity([1, 0, 0, 0], dimensions({ ENERGY: 1 })));
  });
});
