import type { Family, Part } from '../pal/traits';

export type SearchableUniversePart = Part & {
  nameEn?: string;
  nameRu?: string;
};

/** Parts store energy on 0..100. Parts saved before that held a 0..1 fraction; `canonicalEnergyPart` converts them on load. */
export function normalizedEnergy(part: Pick<Part, 'energy'>): number {
  const value = Number(part.energy);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/** A saved fraction is never a whole number except 0 and 1, so a fractional energy below 1 is converted to 0..100. */
export function canonicalEnergyPart<T extends Pick<Part, 'energy'>>(part: T): T {
  const value = Number(part.energy);
  return value > 0 && value < 1 ? { ...part, energy: Math.round(value * 100) } : part;
}

/**
 * Whether a part's energy is a finding. A 2.0 part with no answered level (a capacity, a provider point, or a protector or
 * exile without a level) has a layout default for energy, not a finding, so its energy is unknown (build-and-fix G39).
 * A part without the flag is read as known, as before.
 */
export function energyKnown(part: Pick<Part, 'archetype'>): boolean {
  return part.archetype?.levelKnown !== false;
}

/**
 * The energy a person reads: a percentage, or the word for unknown when the energy is unknown. The layout default is never
 * shown (G39). The word is in the reader's language, as the coordinates panel shows an unknown axis.
 */
export function energyText(part: Pick<Part, 'energy' | 'archetype'>, lang: 'en' | 'ru' = 'en'): string {
  return energyKnown(part) ? `${Math.round(normalizedEnergy(part))}%` : (lang === 'ru' ? 'неизвестно' : 'unknown');
}

/**
 * The tension of two parts, as the Chemistry check reads it: their mean energy, scaled by family. It is unknown (null) when
 * either energy is unknown, so no default is read as a value (G39).
 */
export function energyTension(
  a: Pick<Part, 'energy' | 'family' | 'archetype'>,
  b: Pick<Part, 'energy' | 'family' | 'archetype'>,
): number | null {
  if (!energyKnown(a) || !energyKnown(b)) return null;
  return Math.round(((normalizedEnergy(a) + normalizedEnergy(b)) / 2) * (a.family === b.family ? 0.7 : 1.15));
}

export function filterUniverseParts<T extends Part>(
  parts: T[],
  families: Partial<Record<Family, boolean>>,
  maxEnergy: number,
): T[] {
  const limit = Math.max(0, Math.min(100, Number(maxEnergy) || 0));
  // A part whose energy is unknown is not hidden by an energy it does not have (G39).
  return parts.filter((part) => families[part.family] !== false && (!energyKnown(part) || normalizedEnergy(part) <= limit));
}

/** Search existing parts only. Creation is a separate, explicit Studio action. */
export function searchUniverseParts<T extends SearchableUniversePart>(
  parts: T[],
  query: string,
  language: 'en' | 'ru',
): T[] {
  const needle = query.trim().toLocaleLowerCase(language === 'ru' ? 'ru-RU' : 'en-US');
  if (!needle) return [];
  return parts.filter((part) => [
    part.name,
    part.nameEn,
    part.nameRu,
    part.role,
    part.blurb,
    part.burden,
    part.need,
    part.voice,
  ].some((value) => typeof value === 'string'
    && value.toLocaleLowerCase(language === 'ru' ? 'ru-RU' : 'en-US').includes(needle)));
}
