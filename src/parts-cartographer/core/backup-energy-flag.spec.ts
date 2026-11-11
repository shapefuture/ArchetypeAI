import { describe, expect, it } from 'vitest';
import { SEED_PARTS } from '../pal/traits';
import { validMapParts } from './backup';

const withArchetype = (archetype: Record<string, unknown>) => [{ ...SEED_PARTS[0], archetype: { schema: 'archetype-map.v1', coordinates: [0, 0, 0, 0], ...archetype } }];

describe('a stored energy flag is a boolean (G39)', () => {
  it('accepts an archetype with a boolean energy flag, or with none', () => {
    expect(validMapParts(withArchetype({ levelKnown: true }))).toBe(true);
    expect(validMapParts(withArchetype({ levelKnown: false }))).toBe(true);
    expect(validMapParts(withArchetype({}))).toBe(true);
  });

  it('refuses an energy flag that is not a boolean, which would otherwise read as known', () => {
    expect(validMapParts(withArchetype({ levelKnown: 'no' }))).toBe(false);
    expect(validMapParts(withArchetype({ levelKnown: 0 }))).toBe(false);
  });
});
