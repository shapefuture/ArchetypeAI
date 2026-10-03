import { describe, expect, it } from 'vitest';
import { feltDna } from './felt-dna';
import { SEED_PARTS, SHAPES } from './traits';
import { buildData } from '../../../felt-atelier/src/builder.js';
import { feltHex } from '../../../felt-atelier/src/dna.js';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';
import { scoreProfile } from '../../app/core/data/scoring-v2';
import { toAssessmentInput } from '../../app/core/data/assessment-adapter';

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
  });
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
