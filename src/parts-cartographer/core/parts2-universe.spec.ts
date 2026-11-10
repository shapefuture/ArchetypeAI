import { buildLegacyUniverseParts } from './legacy-universe-adapter';
import { describe, expect, it } from 'vitest';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, isAssessment2Result, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { FAMILIES, type FamilyId } from '../../shared/core/data/assessment2/taxonomy';
import { SEED_PARTS, type ArchetypeMapData, type Part } from '../pal/traits';
import { buildParts2UniverseParts, isParts2Part, PARTS2_SOURCE } from './parts2-universe-adapter';
import { migrateArchetypeAxes, usableParts } from './usable-parts';
import { IV_PARTS } from '../../shared/features/landing/stickers';
import { legacy64ToMapPlacement } from '../../shared/core/data/map-axes';
import { validMapParts } from './backup';

const blank = (): Assessment2Input => ({
  completedStages: [0, 1, 2, 3, 4, 5, 6], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

const scenesFavouring = (most: FamilyId, least: FamilyId): SceneAnswer[] =>
  SCENES.map((scene) => ({
    scene,
    most: SCENE_FAMILIES[scene].includes(most) ? most : SCENE_FAMILIES[scene][0],
    least: SCENE_FAMILIES[scene].includes(least) ? least : SCENE_FAMILIES[scene][1],
  }));

describe('Assessment 2.0 map parts', () => {
  const input: Assessment2Input = {
    ...blank(),
    scenes: scenesFavouring('attack', 'withdraw'),
    picks: { attack: 'rebel' as const },
    timing: { rebel: 'reactive' as const },
    fears: { rebel: 'frightened' as const },
    exileLevel: { frightened: 4 },
    blending: { 'member:rebel': 'curious' as const },
    placed: { 'member:rebel': { energy: 0.25, direction: 0.5, depth: 0.1 } },
    providers: { frightened: { access: 'easy' as const, form: 'faithFigure' as const } },
  };
  const result = buildAssessment2Result(input);
  const parts = buildParts2UniverseParts(result, 'en');

  it('makes one map part per result part, with unique prefixed ids and the 2.0 source', () => {
    expect(parts).toHaveLength(result.parts.length);
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length);
    expect(parts.every((p) => p.id.startsWith('parts2_') && p.archetype?.sourceAssessment === PARTS2_SOURCE)).toBe(true);
    expect(parts.every((p) => isParts2Part(p))).toBe(true);
  });

  it('marks a placed part as self-placed and a reference part as family-default, with unmeasured axes kept', () => {
    const rebel = parts.find((p) => p.id === 'parts2_member_rebel')!;
    expect(rebel.archetype?.coordinateBasis).toBe('self-placed-2');
    // Blending 'curious' is −0.6 (plan §5): the placed three axes, then the blending value.
    expect(rebel.archetype?.coordinates).toEqual([0.25, 0.5, 0.1, -0.6]);
    expect(rebel.archetype?.unmeasuredAxes).toEqual([]);
    const frightened = parts.find((p) => p.id === 'parts2_exile_frightened')!;
    expect(frightened.archetype?.coordinateBasis).toBe('family-default-2');
    // Unplaced and unblended: every axis is unknown, not only blending (plan §3.5, placement rules).
    expect(frightened.archetype?.unmeasuredAxes).toEqual(['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING']);
  });

  it('maps classes the way the existing map does: reactive is a firefighter, an exile is an exile', () => {
    expect(parts.find((p) => p.id === 'parts2_member_rebel')!.family).toBe('firefighter');
    expect(parts.find((p) => p.id === 'parts2_exile_frightened')!.family).toBe('exile');
  });

  it('writes parts that the existing validator accepts', () => {
    expect(validMapParts(parts)).toBe(true);
  });

  it('produces a result that the stored-result validator accepts', () => {
    expect(isAssessment2Result(JSON.parse(JSON.stringify(result)))).toBe(true);
  });

  it('is a fresh result each time, with no exile parts on the lighter path', () => {
    const light = buildParts2UniverseParts(buildAssessment2Result({ ...input, lighter: true }), 'ru');
    expect(light.some((p) => p.family === 'exile')).toBe(false);
    expect(light.every((p) => p.since === 'по карте 2.0')).toBe(true);
  });
});

describe('stored axes are converted once on load (plan §3.5)', () => {
  const base = (archetype: ArchetypeMapData): Part => ({ ...SEED_PARTS[0], id: 'legacy-part', archetype }) as Part;

  it('converts a 64-item tuple with the projection and marks depth and blending unmeasured', () => {
    const old: [number, number, number, number] = [0.5, -0.5, 0.2, 0.4];
    const migrated = migrateArchetypeAxes(base({ schema: 'archetype-map.v1', sourceAssessment: 'legacy64', coordinateBasis: 'response-derived-64', coordinates: old, cluster: 'x', prominence: 50, size: 0.8 }));
    expect(migrated.archetype?.coordinates).toEqual(legacy64ToMapPlacement(old).coordinates);
    expect(migrated.archetype?.unmeasuredAxes).toEqual(['DEPTH', 'BLENDING']);
    expect(migrated.archetype?.axisVersion).toBe(2);
  });

  it('recomputes a 147 reference part from its id, not from the old tuple', () => {
    const reference = IV_PARTS.find((p) => p.id === 'taskmaster')!;
    const migrated = migrateArchetypeAxes({ ...SEED_PARTS[0], id: 'taskmaster', archetype: { schema: 'archetype-map.v1', sourceAssessment: 'descent147', coordinateBasis: 'fixed-reference-147', coordinates: [0.9, 0.9, 0.9, 0.9], cluster: 'x', prominence: 50, size: 0.8 } } as Part);
    expect(migrated.archetype?.coordinates).toEqual([reference.ax.en, reference.ax.di, reference.ax.de, 0]);
    expect(migrated.archetype?.unmeasuredAxes).toEqual(['BLENDING']);
  });

  it('leaves records already on the map axes untouched', () => {
    const current = base({ schema: 'archetype-map.v1', sourceAssessment: 'parts-2', coordinateBasis: 'self-placed-2', coordinates: [0.1, 0.2, 0.3, 0.4], cluster: 'x', prominence: 50, size: 0.8, axisVersion: 2 });
    expect(migrateArchetypeAxes(current)).toBe(current);
  });

  it('drops coordinates it cannot interpret rather than reading them as the new axes', () => {
    const unknown = base({ schema: 'archetype-map.v1', sourceAssessment: 'studio', coordinates: [0.1, 0.2, 0.3, 0.4], cluster: 'x', prominence: 50, size: 0.8, coordinateBasis: 'mystery' as any });
    expect(migrateArchetypeAxes(unknown).archetype?.coordinates).toEqual(legacy64ToMapPlacement([0.1, 0.2, 0.3, 0.4]).coordinates);
    const dropped = base({ schema: 'archetype-map.v1', sourceAssessment: 'legacy64', coordinates: [0.1, 0.2, 0.3, 0.4], cluster: 'x', prominence: 50, size: 0.8, coordinateBasis: 'fixed-reference-147' });
    expect(migrateArchetypeAxes({ ...dropped, id: 'not-a-147-id' }).archetype).toBeUndefined();
  });

  it('applies the conversion in the stored-parts loader, so every reader sees map axes', () => {
    const [loaded] = usableParts([base({ schema: 'archetype-map.v1', sourceAssessment: 'legacy64', coordinateBasis: 'response-derived-64', coordinates: [0.5, -0.5, 0.2, 0.4], cluster: 'x', prominence: 50, size: 0.8 })]);
    expect(loaded.archetype?.axisVersion).toBe(2);
    expect(loaded.archetype?.unmeasuredAxes).toEqual(['DEPTH', 'BLENDING']);
  });
});

describe('FAMILIES is the 2.0 family list', () => {
  it('has eight families', () => {
    expect(FAMILIES).toHaveLength(8);
  });
});

describe('map parts keep their coordinates when they are loaded again', () => {
  it('keeps 64-derived coordinates unchanged on reload', () => {
    const report = { language: 'en', archetypes: [{ name: 'Gift', description: 'd', wound: 'w', shadow: 's', invitation: 'i', coreBelief: 'c', attracts: 'a', cluster: 'gift_archetypes', partType: 'manager', prominence: 50, size: 0.8, coordinates: [0.5, -0.5, 0.2, 0.4] }] } as any;
    const once = buildLegacyUniverseParts(report);
    const reloaded = usableParts(JSON.parse(JSON.stringify(once)));
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].archetype?.coordinates).toEqual(once[0].archetype?.coordinates);
  });

  it('keeps 2.0 placed coordinates unchanged on reload', () => {
    const result = buildAssessment2Result({ ...blank(), scenes: scenesFavouring('attack', 'withdraw'), picks: { attack: 'rebel' as const }, placed: { 'member:rebel': { energy: 0.25, direction: 0.5, depth: 0.1 } } });
    const once = buildParts2UniverseParts(result, 'en');
    const reloaded = usableParts(JSON.parse(JSON.stringify(once)));
    const before = once.find((p) => p.id === 'parts2_member_rebel');
    const after = reloaded.find((p) => p.id === 'parts2_member_rebel');
    expect(after?.archetype?.coordinates).toEqual(before?.archetype?.coordinates);
  });
});
