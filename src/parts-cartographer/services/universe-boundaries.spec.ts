import { describe, expect, it } from 'vitest';
import { isMapCoordinates } from '../../shared/core/data/map-axes';
import { overlapOffsets } from './universe-3plus1';
import { coordinateAffinity } from './universe-lens';

// Thresholds of the map display, tested at the threshold. A relational-operator mutation sample of these modules
// found these three boundaries unchecked. (haloFor at exactly 0 is not here: at zero strength both hues give the
// same neutral colour, so that change cannot be observed.)

describe('map display thresholds, at the threshold', () => {
  it('treats a lens of total strength 0.01 as no lens: no affinity, or the resource middle', () => {
    expect(0.01).toBe(Math.abs(0.01)); // the fixture sum is exactly the threshold
    expect(coordinateAffinity([0, 0, 0, 0], { ENERGY: 0.01, DIRECTION: 0, DEPTH: 0, BLENDING: 0 })).toBe(0);
    expect(coordinateAffinity([0, 0, 0, 0], { ENERGY: 0.01, DIRECTION: 0, DEPTH: 0, BLENDING: 0 }, true)).toBe(0.5);
    expect(coordinateAffinity([0, 0, 0, 0], { ENERGY: 0.02, DIRECTION: 0, DEPTH: 0, BLENDING: 0 })).toBeGreaterThan(0);
  });

  it('spreads parts closer than the reach, and leaves parts exactly the reach apart where they are', () => {
    const at = (gap: number) => overlapOffsets([{ id: 'a', position: [0, 0, 0] }, { id: 'b', position: [gap, 0, 0] }], 2);
    expect(at(2).size).toBe(0);
    expect(at(1.99).size).toBe(2);
  });

  it('accepts a coordinate of exactly ±1, and rejects one beyond it', () => {
    expect(isMapCoordinates([1, -1, 0, 0])).toBe(true);
    expect(isMapCoordinates([1.0001, 0, 0, 0])).toBe(false);
  });
});
