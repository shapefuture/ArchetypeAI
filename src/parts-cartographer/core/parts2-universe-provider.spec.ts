import { describe, expect, it } from 'vitest';
import { EXILE_COPY, PROVIDER_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, type Assessment2Input, type Assessment2Result, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import type { FamilyId } from '../../shared/core/data/assessment2/taxonomy';
import type { Part } from '../pal/traits';
import { validMapParts } from './backup';
import { buildParts2UniverseParts, isParts2Part } from './parts2-universe-adapter';

// The universe view of a provider point (plan §5.1, build-and-fix B7): one resource part beside its exile.
// The other 2.0 specs keep their fixtures private, so the ones this spec needs are copied here.

const blank = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

/** Answers every scene so that `most` leads and `least` trails. */
const scenesFavouring = (most: FamilyId, least: FamilyId): SceneAnswer[] => SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes(most) ? most : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes(least) ? least : SCENE_FAMILIES[scene][1],
}));

/** One protector who fears the frightened exile, which the person has placed. */
const withFrightened = (extra: Partial<Assessment2Input> = {}): Assessment2Input => ({
  ...blank(),
  completedStages: [1, 2, 3, 4],
  scenes: scenesFavouring('attack', 'withdraw'),
  picks: { attack: 'inner_critic' },
  timing: { inner_critic: 'preventive' },
  confirm: { inner_critic: [4, 5, 4] },
  fears: { inner_critic: 'frightened' },
  exileLevel: { frightened: 3 },
  placed: { 'exile:frightened': { energy: 0.4, direction: -0.2, depth: -0.5 } },
  ...extra,
});

const withEasyProvider = (): Assessment2Input => withFrightened({ providers: { frightened: { access: 'easy' } } });

const universeOf = (result: Assessment2Result, lang: 'en' | 'ru' = 'en'): Part[] => buildParts2UniverseParts(result, lang);
const providerPartsOf = (parts: Part[]): Part[] => parts.filter((part) => part.id.startsWith('parts2_provider_'));

describe('a provider point in the universe (plan §5.1, B7)', () => {
  it('is one resource part with the point coordinates, and no partType', () => {
    const result = buildAssessment2Result(withEasyProvider());
    const provider = result.parts.find((part) => part.kind === 'provider')!;
    const points = providerPartsOf(universeOf(result));
    expect(points.map((part) => part.id)).toEqual(['parts2_provider_frightened']);
    const [point] = points;
    expect(point.family).toBe('resource');
    expect(point.archetype?.partType).toBeUndefined();
    expect(point.archetype?.sourceAssessment).toBe('parts-2');
    expect(point.archetype?.coordinates).toEqual(provider.coordinates);
    // The exile is placed at energy 0.4 and direction −0.2, so the point is at 0.65 and 0.05 (plan §5.1), at the exile's depth.
    expect(point.archetype?.coordinates[0]).toBeCloseTo(0.65, 10);
    expect(point.archetype?.coordinates[1]).toBeCloseTo(0.05, 10);
    expect(point.archetype?.coordinates[2]).toBe(-0.5);
    expect(point.archetype?.unmeasuredAxes).toEqual(['BLENDING']);
  });

  it('is named for its role in English and Russian, and its role label is Provider', () => {
    const result = buildAssessment2Result(withEasyProvider());
    const [en] = providerPartsOf(universeOf(result, 'en'));
    const [ru] = providerPartsOf(universeOf(result, 'ru'));
    expect(en.name).toBe(PROVIDER_COPY.guardian.en);
    expect(ru.name).toBe(PROVIDER_COPY.guardian.ru);
    expect(en.role).toBe(UI_COPY.providerLabel.en);
    expect(ru.role).toBe(UI_COPY.providerLabel.ru);
  });

  it('keeps a fixed 2.0 id, so a rerun replaces it', () => {
    const first = providerPartsOf(universeOf(buildAssessment2Result(withEasyProvider())));
    const second = providerPartsOf(universeOf(buildAssessment2Result(withEasyProvider())));
    expect(second.map((part) => part.id)).toEqual(first.map((part) => part.id));
    expect(first.every((part) => isParts2Part(part))).toBe(true);
  });

  it('is accepted by the stored-part validator', () => {
    expect(validMapParts(universeOf(buildAssessment2Result(withEasyProvider())))).toBe(true);
  });

  it('changes no other universe part', () => {
    const withPoint = universeOf(buildAssessment2Result(withEasyProvider()));
    const withoutPoint = universeOf(buildAssessment2Result(withFrightened()));
    expect(withPoint.filter((part) => !part.id.startsWith('parts2_provider_'))).toEqual(withoutPoint);
  });
});

describe('a result with no provider point gives the same universe parts as before', () => {
  // A guard: this passes on the code before the provider change as well, because nothing about these parts has changed.
  it('keeps the protector and the exile parts, with their ids, families and coordinates', () => {
    const parts = universeOf(buildAssessment2Result(withFrightened()));
    expect(parts.map((part) => part.id)).toEqual(['parts2_member_inner_critic', 'parts2_exile_frightened']);
    expect(parts.some((part) => part.family === 'resource')).toBe(false);
    const exile = parts.find((part) => part.id === 'parts2_exile_frightened')!;
    expect(exile.name).toBe(EXILE_COPY.frightened.name.en);
    expect(exile.family).toBe('exile');
    expect(exile.archetype?.partType).toBe('exile');
    expect(exile.archetype?.coordinates).toEqual([0.4, -0.2, -0.5, 0]);
    expect(exile.archetype?.unmeasuredAxes).toEqual(['BLENDING']);
  });
});
