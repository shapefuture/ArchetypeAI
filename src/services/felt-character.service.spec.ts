import { describe, expect, it } from 'vitest';
import { ALL_ARCHETYPES } from './universe-state.service';
import { FeltCharacterService } from './felt-character.service';

describe('FeltCharacterService', () => {
  it('assigns stable, distinct generator DNA to the 18 core parts', () => {
    const service = new FeltCharacterService();
    const dna = ALL_ARCHETYPES.map((archetype) => service.dnaFor(archetype));

    expect(dna).toHaveLength(18);
    expect(dna.every((character) => !!character.body && !!character.felt && !!character.eyes && !!character.mouth)).toBe(true);
    expect(new Set(dna.map((character) => JSON.stringify(character))).size).toBe(18);
    expect(ALL_ARCHETYPES.every((archetype, index) => service.dnaFor(archetype) === dna[index])).toBe(true);
  });

  it('derives stable DNA for generated map archetypes from their id and coordinates', () => {
    const service = new FeltCharacterService();
    const dynamicPart = {
      ...ALL_ARCHETYPES[0],
      id: 'studio_smoke_test',
      coordinates: [0.24, -0.18, 0.71, 0.32] as [number, number, number, number],
      cluster: 'resources' as const,
    };

    const first = service.dnaFor(dynamicPart);
    const repeated = service.dnaFor({ ...dynamicPart, coordinates: [...dynamicPart.coordinates] as [number, number, number, number] });
    const shifted = service.dnaFor({
      ...dynamicPart,
      coordinates: [0.25, -0.18, 0.71, 0.32],
    });

    expect(repeated).toEqual(first);
    expect(shifted).not.toEqual(first);
  });
});
