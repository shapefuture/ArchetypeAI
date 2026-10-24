/**
 * Shows the built-in sample parts in the reader's language.
 *
 * Sample parts are saved into the user's own parts list, and scored parts are
 * derived from them, so their text is stored in English. A field is shown in
 * Russian only while it still holds a sample part's English text; anything the
 * user typed is left as written. Before saving, translated fields are mapped
 * back to English, so switching language later still works.
 */
import { SEED_PART_COPY, type SeedPartCopy } from '../../shared/i18n/strings';

type Field = keyof SeedPartCopy;
const FIELDS: Field[] = ['name', 'role', 'blurb', 'burden', 'need', 'voice', 'since'];

function buildMaps(from: 'en' | 'ru', to: 'en' | 'ru'): Record<Field, Map<string, string>> {
  const maps = {} as Record<Field, Map<string, string>>;
  for (const field of FIELDS) {
    maps[field] = new Map();
    for (const copy of Object.values(SEED_PART_COPY)) {
      // A placeholder such as «—» is the same in both languages.
      if (copy[from][field] !== copy[to][field]) maps[field].set(copy[from][field], copy[to][field]);
    }
  }
  return maps;
}

const EN_TO_RU = buildMaps('en', 'ru');
const RU_TO_EN = buildMaps('ru', 'en');

function translate<T extends Partial<Record<Field, unknown>>>(part: T, maps: Record<Field, Map<string, string>>): T {
  let next: T | null = null;
  for (const field of FIELDS) {
    const value = part[field];
    if (typeof value !== 'string') continue;
    const translated = maps[field].get(value);
    if (translated === undefined) continue;
    next ??= { ...part };
    (next as Record<Field, unknown>)[field] = translated;
  }
  return next ?? part;
}

/** Parts as the reader sees them. Returns the same array when nothing changes. */
export function localizeParts<T extends Partial<Record<Field, unknown>>>(parts: T[], lang: string): T[] {
  if (lang !== 'ru' || !Array.isArray(parts)) return parts;
  let changed = false;
  const next = parts.map((part) => {
    const shown = translate(part, EN_TO_RU);
    if (shown !== part) changed = true;
    return shown;
  });
  return changed ? next : parts;
}

/** Parts as they are stored: sample text goes back to its English source. */
export function storedParts<T extends Partial<Record<Field, unknown>>>(parts: T[]): T[] {
  if (!Array.isArray(parts)) return parts;
  return parts.map((part) => translate(part, RU_TO_EN));
}
