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

export function filterUniverseParts<T extends Part>(
  parts: T[],
  families: Partial<Record<Family, boolean>>,
  maxEnergy: number,
): T[] {
  const limit = Math.max(0, Math.min(100, Number(maxEnergy) || 0));
  return parts.filter((part) => families[part.family] !== false && normalizedEnergy(part) <= limit);
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
