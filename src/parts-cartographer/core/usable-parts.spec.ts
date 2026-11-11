import { describe, expect, it } from 'vitest';
import { SEED_PARTS, type Part } from '../pal/traits';
import { MAP_AXIS_KEYS } from '../../shared/core/data/map-axes';
import { migrateArchetypeAxes } from './usable-parts';

const studioPart = (coordinates: number[], extra: Record<string, unknown> = {}): Part => ({
  ...SEED_PARTS[0],
  archetype: { schema: 'archetype-map.v1', sourceAssessment: 'studio', coordinates, cluster: 'managers', prominence: 55, size: 0.8, ...extra },
} as unknown as Part);

const parts2Record = (prominence: number, extra: Record<string, unknown> = {}): Part => ({
  ...SEED_PARTS[0],
  archetype: {
    schema: 'archetype-map.v1', sourceAssessment: 'parts-2', coordinates: [0.1, 0.2, 0.3, 0], unmeasuredAxes: ['BLENDING'],
    axisVersion: 2, depthRecord: 2, cluster: 'parts_two_exile', prominence, size: 0.8, ...extra,
  },
} as unknown as Part);

describe('an older 2.0 record gets its energy flag on load (G39)', () => {
  it('reads a prominence of 45 as the unanswered default, and any other prominence as a known level', () => {
    expect(migrateArchetypeAxes(parts2Record(45)).archetype?.levelKnown).toBe(false);
    expect(migrateArchetypeAxes(parts2Record(60)).archetype?.levelKnown).toBe(true);
    expect(migrateArchetypeAxes(parts2Record(47)).archetype?.levelKnown).toBe(true);
  });

  it('keeps a flag the record already has', () => {
    const part = parts2Record(45, { levelKnown: true });
    expect(migrateArchetypeAxes(part)).toBe(part);
  });
});

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
