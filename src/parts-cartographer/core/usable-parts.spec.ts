import { describe, expect, it } from 'vitest';
import { SEED_PARTS, type Part } from '../pal/traits';
import { MAP_AXIS_KEYS } from '../../shared/core/data/map-axes';
import { migrateArchetypeAxes } from './usable-parts';

const studioPart = (coordinates: number[], extra: Record<string, unknown> = {}): Part => ({
  ...SEED_PARTS[0],
  archetype: { schema: 'archetype-map.v1', sourceAssessment: 'studio', coordinates, cluster: 'managers', prominence: 55, size: 0.8, ...extra },
} as unknown as Part);

describe('a studio placeholder is unknown on every axis (G38)', () => {
  it('marks an all-zero studio placement unknown on all four axes, when it was written at axis version 2', () => {
    const migrated = migrateArchetypeAxes(studioPart([0, 0, 0, 0], { axisVersion: 2 }));
    expect(migrated.archetype?.unmeasuredAxes).toEqual([...MAP_AXIS_KEYS]);
  });

  it('marks an older all-zero studio placement unknown on all four axes too', () => {
    const migrated = migrateArchetypeAxes(studioPart([0, 0, 0, 0]));
    expect(migrated.archetype?.unmeasuredAxes).toEqual([...MAP_AXIS_KEYS]);
    expect(migrated.archetype?.axisVersion).toBe(2);
  });

  it('leaves a studio placement with real values untouched', () => {
    const part = studioPart([0.4, -0.2, 0.1, 0.3], { axisVersion: 2 });
    expect(migrateArchetypeAxes(part)).toBe(part);
  });
});
