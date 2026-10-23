import { describe, expect, it } from 'vitest';
import { graduate, leaveOrRest, type WorldState } from './quiet-mode.ts';

const world: WorldState = { places: ['garden', 'harbour'], progress: 3 };

describe('quiet mode and graduation', () => {
  it('returns the same world on leave or rest, so nothing is harmed', () => {
    expect(leaveOrRest(world)).toBe(world);
  });

  it('graduates only on an explicit choice', () => {
    expect(graduate(world, false)).toEqual({ world, graduated: false });
    expect(graduate(world, true).graduated).toBe(true);
  });
});
