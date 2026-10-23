import { describe, expect, it } from 'vitest';
import { feltDna } from './felt-dna';
import { SEED_PARTS, SHAPES, randomTraits, withCharacterSeed } from './traits';
import { buildData } from '../../../felt-atelier/src/builder.js';
import { feltHex } from '../../../felt-atelier/src/dna.js';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';

describe('merged Felt Atelier character bridge', () => {
  it('builds every assessment and saved seed character without invalid or missing geometry', () => {
    const canonical = adaptClinicalProfile(scoreProfile(toAssessmentInput(Array(147).fill(3))), 'en').parts;
    for (const part of [...canonical, ...SEED_PARTS]) {
      const built = buildData(feltDna(part.traits), { lod: 'map' });
      expect(built.parts.length, part.id).toBeGreaterThan(0);
      for (const mesh of built.parts) {
        expect(Array.from(mesh.geo.getAttribute('position').array).every(Number.isFinite), part.id).toBe(true);
        mesh.geo.dispose();
      }
    }
  }, 30_000); // Sews ~150 characters; the default 5s budget is exceeded when suites run in parallel.
  it('uses stable sewn DNA for cards and universe without changing existing trait records', () => {
    const part = SEED_PARTS[0];
    const before = JSON.stringify(part);
    const card = feltDna(part.traits);
    const universe = feltDna(part.traits, part);
    expect(card).toEqual(universe);
    expect(JSON.stringify(part)).toBe(before);
    expect(card.v).toBe(2);
    expect(card.body.t).toBe(part.traits.shape);
    expect(feltHex(card.collection, card.felt)).toBe(part.traits.color);
  });

  it('keeps stable character seeds, supports all merged body outlines, and maps legacy egg records', () => {
    for (const shape of SHAPES) {
      const dna = feltDna({ ...SEED_PARTS[0].traits, shape, characterSeed: 42 });
      expect(dna.body.t).toBe(shape === 'egg' ? 'drop' : shape);
      expect(dna.seed).toBeGreaterThanOrEqual(42);
    }
  });

  it('sews real front/back felt, thread and appliqué geometry with crowd LOD', () => {
    const dna = feltDna(SEED_PARTS[0].traits);
    const built = buildData(dna, { lod: 'map' });
    expect(built.parts.length).toBeGreaterThanOrEqual(2);
    const positions = built.parts.flatMap((part) => Array.from(part.geo.getAttribute('position').array));
    expect(positions.every(Number.isFinite)).toBe(true);
    const z = positions.filter((_, index) => index % 3 === 2);
    expect(Math.max(...z) - Math.min(...z)).toBeGreaterThan(.1);
    expect(built.flat.length).toBeGreaterThan(0);
    built.parts.forEach((part) => part.geo.dispose());
  });

  it('preserves eyewear, bow and blush customization as visible sewn details', () => {
    const traits = { ...SEED_PARTS[0].traits, face: 'glasses' as const, bow: true, cheeks: true };
    const dna = feltDna(traits);
    expect(dna.facewear).toBe('glasses');
    expect(dna.bow).toBe(true);
    expect(dna.cheeks).toBe(true);
    const detailed = buildData(dna, { lod: 'map' });
    const plain = buildData({ ...dna, facewear: 'none', bow: false, cheeks: false }, { lod: 'map' });
    expect(detailed.flat.length).toBeGreaterThan(plain.flat.length);
    [...detailed.parts, ...plain.parts].forEach((part) => part.geo.dispose());
  });
});

describe('character identity across customization and saved history', () => {
  // Seeds that the saved characters sew from today. A change here re-sews existing cards and universe nodes.
  const PINNED_SEEDS: Record<string, number> = {
    'seed-planner': 1434430917, 'seed-critic': 1303029907, 'seed-pleaser': 2401590885,
    'seed-guardian': 4193065465, 'seed-scroller': 1495723507, 'seed-sweet': 2707496615,
    'seed-rage': 3419979155, 'seed-binge': 1475428253, 'seed-little': 2675925653,
    'seed-hidden': 3370784235, 'seed-grief': 3334528908, 'seed-first': 3732843369,
    'seed-self': 3730753846, 'seed-witness': 756758835, 'seed-coach': 21530028,
  };

  it('keeps every saved seed character sewing from the seed it already renders with', () => {
    for (const part of SEED_PARTS) {
      expect(feltDna(part.traits).seed, part.id).toBe(PINNED_SEEDS[part.id]);
    }
  });

  it('freezes a legacy implicit seed without changing the sewn character', () => {
    for (const part of SEED_PARTS) {
      expect(feltDna(withCharacterSeed(part.traits)), part.id).toEqual(feltDna(part.traits));
    }
  });

  it('keeps the same seed and body when a frozen character is recolored or re-eyed', () => {
    const frozen = withCharacterSeed(SEED_PARTS[0].traits);
    const edited = { ...frozen, color: '#FF2D8A', eyes: 'closed' as const, face: 'glasses' as const };
    expect(feltDna(edited).seed).toBe(feltDna(frozen).seed);
    expect(feltDna(edited).body).toEqual(feltDna(frozen).body);
  });

  it('gives every new character a stable integer seed that later edits keep', () => {
    const traits = randomTraits('exile');
    expect(Number.isInteger(traits.characterSeed)).toBe(true);
    expect(traits.characterSeed).toBeGreaterThanOrEqual(0);
    expect(traits.characterSeed).toBeLessThanOrEqual(0xffffffff);
    expect(feltDna({ ...traits, color: '#3B9BFF' }).seed).toBe(feltDna(traits).seed);
  });
});
