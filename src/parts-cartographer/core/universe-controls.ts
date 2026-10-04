import type { Family, Part } from '../pal/traits';

export type SearchableUniversePart = Part & {
  nameEn?: string;
  nameRu?: string;
};

/** Legacy assessment projections use 0..1; native Parts Cartographer values use 0..100. */
export function normalizedEnergy(part: Pick<Part, 'energy'>): number {
  const value = Number(part.energy);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
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
