import { describe, expect, it } from 'vitest';
import type { ArchetypeCoordinates } from './universe-lens';
import {
  GHOST_FACTOR, HALO_NEGATIVE, HALO_NEUTRAL, HALO_POSITIVE, haloFor, isolationUnknown, overlapOffsets, presentationFor,
} from './universe-3plus1';

const at = (...values: number[]) => values as ArchetypeCoordinates;
const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('the isolation tag (G31, G38)', () => {
  it('tags a part whose isolated axis is listed as unmeasured, and tags nothing without an isolation', () => {
    expect(isolationUnknown(['BLENDING'], 'BLENDING')).toBe(true);
    expect(isolationUnknown(['BLENDING'], 'ENERGY')).toBe(false);
    expect(isolationUnknown(['BLENDING'], null)).toBe(false);
    expect(isolationUnknown(undefined, 'DEPTH')).toBe(false);
  });
});

describe('the +1 halo', () => {
  it('is faint and neutral at zero, and strong at either extreme', () => {
    expect(haloFor(0)).toEqual({ color: HALO_NEUTRAL, opacity: 0.12 });
    expect(haloFor(1)).toEqual({ color: HALO_POSITIVE, opacity: 0.8 });
    expect(haloFor(-1)).toEqual({ color: HALO_NEGATIVE, opacity: 0.8 });
  });

  it('shows the sign in the hue and the strength in the opacity', () => {
    expect(haloFor(0.5).opacity).toBeGreaterThan(haloFor(0).opacity);
    expect(haloFor(0.5).opacity).toBeLessThan(haloFor(1).opacity);
    expect(haloFor(-0.5).opacity).toBeCloseTo(haloFor(0.5).opacity, 10);
    expect(haloFor(-0.5).color).not.toBe(haloFor(0.5).color);
    // The warm end moves the red channel up from neutral; the cool end moves it down.
    expect((haloFor(1).color >> 16) & 0xff).toBeGreaterThan((HALO_NEUTRAL >> 16) & 0xff);
    expect((haloFor(-1).color >> 16) & 0xff).toBeLessThan((HALO_NEUTRAL >> 16) & 0xff);
  });

  it('clamps values outside the blending range', () => {
    expect(haloFor(5)).toEqual(haloFor(1));
    expect(haloFor(-9)).toEqual(haloFor(-1));
  });
});

describe('how a part is presented', () => {
  it('draws nothing extra for a part without coordinates', () => {
    expect(presentationFor({ coordinates: null, unmeasuredAxes: ['DEPTH'], coordinateBasis: 'self-placed-2' }))
      .toEqual({ notSet: [], notMeasured: [], ghost: false, halo: null });
  });

  it('neither fades nor rings a 147 reference part, whose blending is never measured', () => {
    const part = presentationFor({ coordinates: at(0.4, 0, 0.6, 0), unmeasuredAxes: ['BLENDING'], coordinateBasis: 'fixed-reference-147' });
    expect(part).toEqual({ notSet: [], notMeasured: ['BLENDING'], ghost: false, halo: null });
  });

  it('labels, but does not fade, the depth and blending a 64 part can never have', () => {
    const part = presentationFor({ coordinates: at(0.1, 0.2, 0, 0), unmeasuredAxes: ['DEPTH', 'BLENDING'], coordinateBasis: 'response-derived-64' });
    expect(part.ghost).toBe(false);
    expect(part.notMeasured).toEqual(['DEPTH', 'BLENDING']);
    expect(part.notSet).toEqual([]);
    expect(part.halo).toBeNull();
  });

  it('rings a fully placed 2.0 part by its blending, and does not fade it', () => {
    const part = presentationFor({ coordinates: at(0.2, 0.1, 0.3, 0.5), unmeasuredAxes: [], coordinateBasis: 'self-placed-2' });
    expect(part.ghost).toBe(false);
    expect(part.halo?.opacity).toBeCloseTo(0.12 + 0.68 * 0.5, 10);
  });

  it('fades an unplaced 2.0 part, because its position is still the person to set', () => {
    const part = presentationFor({ coordinates: at(0.5, 0, 0.6, 0), unmeasuredAxes: ['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING'], coordinateBasis: 'family-default-2' });
    expect(part.ghost).toBe(true);
    expect(part.notSet).toEqual(['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING']);
    expect(part.halo).toBeNull();
  });

  it('fades a 2.0 part whose depth is "not sure", but keeps its halo because blending is known', () => {
    const part = presentationFor({ coordinates: at(0.2, 0.1, 0.3, -0.6), unmeasuredAxes: ['DEPTH'], coordinateBasis: 'self-placed-2' });
    expect(part.ghost).toBe(true);
    expect(part.notSet).toEqual(['DEPTH']);
    expect(part.halo).not.toBeNull();
  });

  it('does not fade a 2.0 part that only skipped blending, because blending does not place the part', () => {
    const part = presentationFor({ coordinates: at(0.2, 0.1, 0.3, 0), unmeasuredAxes: ['BLENDING'], coordinateBasis: 'self-placed-2' });
    expect(part).toEqual({ notSet: ['BLENDING'], notMeasured: [], ghost: false, halo: null });
  });

  it('treats an unmeasured axis on a record with no basis as structural, not as a question for the person', () => {
    const part = presentationFor({ coordinates: at(0.2, 0.1, 0.3, 0), unmeasuredAxes: ['DEPTH'] });
    expect(part.ghost).toBe(false);
    expect(part.notMeasured).toEqual(['DEPTH']);
  });

  it('fades a part to half its opacity, which is clearly visible and keeps the part readable', () => {
    expect(GHOST_FACTOR).toBe(0.5);
  });
});

describe('display spread of overlapping parts', () => {
  it('returns no offsets for an empty scene or for parts that stand apart', () => {
    expect(overlapOffsets([]).size).toBe(0);
    const apart = overlapOffsets([
      { id: 'a', position: [0, 0, 0] },
      { id: 'b', position: [5, 0, 0] },
    ]);
    expect(apart.size).toBe(0);
  });

  it('spreads two identical parts apart on the horizontal plane only', () => {
    const points = [
      { id: 'a', position: [2, 3, 4] as [number, number, number] },
      { id: 'b', position: [2, 3, 4] as [number, number, number] },
    ];
    const offsets = overlapOffsets(points);
    const moved = points.map((point) => point.position.map((value, axis) => value + (offsets.get(point.id)?.[axis] ?? 0)));
    expect(offsets.get('a')?.[1]).toBe(0);
    expect(offsets.get('b')?.[1]).toBe(0);
    expect(distance(moved[0], moved[1])).toBeCloseTo(2, 10);
  });

  it('sets a pile of parts out in a row across the screen, spacing apart, at the pile\'s own height and depth', () => {
    const points = ['c', 'a', 'b'].map((id) => ({ id, position: [1, 2, 3] as [number, number, number] }));
    const offsets = overlapOffsets(points, 2, 3);
    const placed = (id: string) => [1, 2, 3].map((value, axis) => value + (offsets.get(id)?.[axis] ?? 0));
    expect(['a', 'b', 'c'].map((id) => placed(id)[0])).toEqual([-2, 1, 4]);
    for (const id of ['a', 'b', 'c']) {
      expect(placed(id)[1]).toBe(2);
      expect(placed(id)[2]).toBe(3);
    }
  });

  it('gives the same offsets whatever the order of the input', () => {
    const forward = [
      { id: 'a', position: [0, 0, 0] as [number, number, number] },
      { id: 'b', position: [0.2, 0, 0] as [number, number, number] },
      { id: 'c', position: [0, 0, 0.3] as [number, number, number] },
    ];
    const backward = [...forward].reverse();
    const one = overlapOffsets(forward);
    const two = overlapOffsets(backward);
    for (const id of ['a', 'b', 'c']) {
      expect(one.get(id)).toEqual(two.get(id));
    }
  });

  it('does not change its input', () => {
    const points = [
      { id: 'a', position: [0, 0, 0] as [number, number, number] },
      { id: 'b', position: [0, 0, 0] as [number, number, number] },
    ];
    overlapOffsets(points);
    expect(points[0].position).toEqual([0, 0, 0]);
    expect(points[1].position).toEqual([0, 0, 0]);
  });
});
