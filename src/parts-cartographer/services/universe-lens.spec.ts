import { describe, expect, it } from 'vitest';
import {
  archetypeCoordinatePosition,
  archetypeLensOffset,
  coordinateAffinity,
  DEFAULT_AXES,
  dimensionalLensOffset,
  normalizeAxes,
  sanitizeArchetypeCoordinates,
  setAxisChoice,
  ZERO_DIMENSIONS,
} from './universe-lens';

const dimensions = (overrides: Partial<typeof ZERO_DIMENSIONS> = {}) => ({ ...ZERO_DIMENSIONS, ...overrides });

describe('universe dimensional lens', () => {
  it('rejects malformed coordinate records and clamps valid imported values', () => {
    expect(sanitizeArchetypeCoordinates([0, 0, Number.NaN, 0])).toBeNull();
    expect(sanitizeArchetypeCoordinates([0, 1, 2, 0])).toEqual([0, 1, 1, 0]);
    expect(sanitizeArchetypeCoordinates([0, '1', 0, 0])).toBeNull();
  });

  it('projects each four-dimensional archetype point to a distinct stable scene position', () => {
    expect(archetypeCoordinatePosition([0, 0, 0, 0])).toEqual([0, 0, 0]);
    expect(archetypeCoordinatePosition([1, 0, 0, 0])).toEqual([10, 0, 0]);
    expect(archetypeCoordinatePosition([0, 0, 1, 0])).toEqual([0, 0, 10]);
    expect(archetypeCoordinatePosition([0, 0, 0, 1])).toEqual([0, 0, 0]);
  });

  it('maps selected dimensions and isolates the attachment plane exactly like Angular', () => {
    expect(archetypeCoordinatePosition([.2, .4, .6, .8], ['ATTACHMENT', 'TEMPERATURE', 'AGENCY'])).toEqual([8, 4, 2]);
    expect(archetypeCoordinatePosition([.2, .4, .6, .8], undefined, 'ATTACHMENT')).toEqual([2, 8, 0]);
    expect(archetypeCoordinatePosition([.2, .4, .6, .8], undefined, 'FOCUS')).toEqual([0, 0, 6]);
  });

  it('uses canonical weighted Gaussian affinity without moving coordinates', () => {
    expect(coordinateAffinity([1, 0, 0, 0], ZERO_DIMENSIONS)).toBe(0);
    expect(coordinateAffinity([1, 0, 0, 0], ZERO_DIMENSIONS, true)).toBe(.5);
    expect(coordinateAffinity([1, 0, 0, 0], dimensions({ AGENCY: 1 }))).toBe(1);
    expect(coordinateAffinity([-1, 0, 0, 0], dimensions({ AGENCY: 1 }))).toBeCloseTo(Math.exp(-8));
  });

  it('applies visual dimension controls against individual coordinates', () => {
    const expression = dimensions({ AGENCY: 1, TEMPERATURE: 0.5, FOCUS: -0.5, ATTACHMENT: 1 });
    expect(archetypeLensOffset([1, 0.5, -0.5, 1], expression)).toEqual([4, 4, 0]);
    expect(archetypeLensOffset([0, 0, 0, 0], expression)).toEqual([0, 0, 0]);
  });

  it('leaves every family at its original position when all expressions are neutral', () => {
    for (const family of ['manager', 'firefighter', 'exile', 'resource'] as const) {
      expect(dimensionalLensOffset(family, ZERO_DIMENSIONS)).toEqual([0, 0, 0]);
    }
  });

  it('moves families according to each visual axis without changing part data', () => {
    const expectOffset = (actual: number[], expected: number[]) => {
      actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 10));
    };
    expectOffset(dimensionalLensOffset('manager', dimensions({ AGENCY: 1 })), [-2.56, 0, 2.56]);
    expectOffset(dimensionalLensOffset('exile', dimensions({ TEMPERATURE: 1 })), [0, 2.08, 0]);
    expectOffset(dimensionalLensOffset('resource', dimensions({ FOCUS: 1 })), [1.12, 0, 0]);
    expectOffset(dimensionalLensOffset('firefighter', dimensions({ ATTACHMENT: 1 })), [0, 1.6, 1.6]);
  });

  it('keeps the three spatial axes distinct when a chosen axis is already in use', () => {
    expect(setAxisChoice(['AGENCY', 'TEMPERATURE', 'FOCUS'], 1, 'AGENCY')).toEqual(['TEMPERATURE', 'AGENCY', 'FOCUS']);
    expect(setAxisChoice(['AGENCY', 'TEMPERATURE', 'FOCUS'], 0, 'AGENCY')).toEqual(['AGENCY', 'TEMPERATURE', 'FOCUS']);
    expect(setAxisChoice(['AGENCY', 'TEMPERATURE', 'FOCUS'], 2, 'ATTACHMENT')).toEqual(['AGENCY', 'TEMPERATURE', 'ATTACHMENT']);
  });

  it('normalizes unusable axis tuples to the default distinct projection', () => {
    expect(normalizeAxes(['AGENCY', 'AGENCY', 'FOCUS'])).toEqual(DEFAULT_AXES);
    expect(normalizeAxes(['ATTACHMENT', 'TEMPERATURE', 'AGENCY'])).toEqual(['ATTACHMENT', 'TEMPERATURE', 'AGENCY']);
    expect(normalizeAxes(['AGENCY', 'NOPE', 'FOCUS'])).toEqual(DEFAULT_AXES);
    expect(normalizeAxes(undefined)).toEqual(DEFAULT_AXES);
  });

  it('combines expressions linearly and differentiates family clusters', () => {
    const lens = dimensions({ AGENCY: 0.5, TEMPERATURE: -0.25, FOCUS: 0.75, ATTACHMENT: 1 });
    const manager = dimensionalLensOffset('manager', lens);
    const resource = dimensionalLensOffset('resource', lens);
    expect(manager).toHaveLength(3);
    expect(manager.every(Number.isFinite)).toBe(true);
    expect(resource).toHaveLength(3);
    expect(resource).not.toEqual(manager);
  });
});
