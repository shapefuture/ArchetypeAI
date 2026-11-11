import { describe, expect, it } from 'vitest';
import { SEED_PARTS } from '../pal/traits';
import { canonicalEnergyPart, energyKnown, energyText, filterUniverseParts, normalizedEnergy, searchUniverseParts } from './universe-controls';

describe('the energy a person reads (G39)', () => {
  const unknown = { family: 'manager' as const, energy: 45, archetype: { levelKnown: false } } as any;
  const known = { family: 'manager' as const, energy: 60, archetype: { levelKnown: true } } as any;
  const legacy = { family: 'manager' as const, energy: 30 } as any;

  it('reads an unanswered level as unknown, and any other energy as known', () => {
    expect(energyKnown(unknown)).toBe(false);
    expect(energyKnown(known)).toBe(true);
    expect(energyKnown(legacy)).toBe(true);
  });

  it('shows an em dash for unknown energy, never the layout default', () => {
    expect(energyText(unknown)).toBe('—');
    expect(energyText(known)).toBe('60%');
    expect(energyText(legacy)).toBe('30%');
  });

  it('keeps a part of unknown energy in the energy filter, and filters known energy as before', () => {
    const visible = filterUniverseParts([unknown, known, legacy], { manager: true }, 30);
    expect(visible).toContain(unknown);
    expect(visible).toContain(legacy);
    expect(visible).not.toContain(known);
  });
});

describe('React universe controls', () => {
  it('reads parts on the 0..100 scale and clamps the ends', () => {
    expect(normalizedEnergy(SEED_PARTS[0])).toBe(74);
    expect(normalizedEnergy({ energy: 8 })).toBe(8);
    expect(normalizedEnergy({ energy: 1 })).toBe(1);
    expect(normalizedEnergy({ energy: 180 })).toBe(100);
  });

  it('converts a saved 0..1 fraction to 0..100 on load, and leaves whole numbers alone', () => {
    expect(canonicalEnergyPart({ energy: 0.74 }).energy).toBe(74);
    expect(canonicalEnergyPart({ energy: 0.555 }).energy).toBe(56);
    expect(canonicalEnergyPart({ energy: 74 }).energy).toBe(74);
    expect(canonicalEnergyPart({ energy: 0 }).energy).toBe(0);
  });

  it('applies both family and energy filters to the actual visible parts', () => {
    const visible = filterUniverseParts(SEED_PARTS, {
      manager: true, firefighter: false, exile: true, resource: false,
    }, 70);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((part) => ['manager', 'exile'].includes(part.family) && normalizedEnergy(part) <= 70)).toBe(true);
  });

  it('searches existing bilingual names and part text without fabricating results', () => {
    const localized = [{ ...SEED_PARTS[0], nameEn: 'Planner EN', nameRu: 'Планировщик RU' }];
    expect(searchUniverseParts(localized, 'planner en', 'en')).toHaveLength(1);
    expect(searchUniverseParts(localized, 'планировщик ru', 'ru')).toHaveLength(1);
    expect(searchUniverseParts(SEED_PARTS, 'no existing character', 'en')).toEqual([]);
    expect(searchUniverseParts(SEED_PARTS, '   ', 'en')).toEqual([]);
  });
});
