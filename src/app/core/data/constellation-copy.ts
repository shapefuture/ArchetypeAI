/**
 * Bilingual copy for constellation headlines (§1.4) and subtype names (§1.5).
 *
 * All bilingual copy now lives in src/i18n/strings.ts (CONSTELLATION section).
 * This module imports from strings and preserves the original export shapes.
 * Names are DATA — hand-written, never generated.
 */
import type { ConstellationDef } from './constellations';
import {
  CONSTELLATION_ESSAYS,
  CONSTELLATION_RU_NAME,
  CONSTELLATION_RU_SUBTYPE,
  CONSTELLATION_PART_NAME_RU,
  CONSTELLATION_RESOURCE_NAME_RU,
  COMPLEX_COPY_RU,
  CONSTELLATION_POLARIZATION_NAME_RU,
} from '../../../i18n/strings';

export type Lang = 'en' | 'ru';

const KEY = (p: string, e: string) => `${p}x${e}`;

const BASE_OF_FAMILY: Record<string, string> = {
  manager: 'taskmaster', firefighter: 'numb', exile: 'abandoned', resource: 'sage',
};

export const PART_NAME_RU = CONSTELLATION_PART_NAME_RU;

export function constellationName(def: ConstellationDef, lang: Lang): string {
  return lang === 'ru' ? CONSTELLATION_RU_NAME[KEY(def.protector, def.exile)] ?? def.name : def.name;
}

/**
 * Long-form essay when available; falls back to the one-line essay.
 * EN: long.en → def.essay (unless 'Spec-locked.', then short.en)
 * RU: long.ru → short.ru → def.essay
 */
export function constellationEssay(def: ConstellationDef, lang: Lang): string {
  const key = KEY(def.protector, def.exile);
  const entry = CONSTELLATION_ESSAYS[key];
  if (entry?.long) {
    const longVal = lang === 'ru' ? entry.long.ru : entry.long.en;
    if (longVal) return longVal;
  }
  if (lang === 'ru') {
    return entry?.short?.ru ?? def.essay;
  }
  // EN fallback: Spec-locked → short.en (EN_ESSAY_FIXES equivalent), else def.essay
  return def.essay === 'Spec-locked.' ? entry?.short?.en ?? def.essay : def.essay;
}

export function subtypeName(family: string, slug: string, en: string, lang: Lang): string {
  if (lang !== 'ru') return en;
  const baseId = BASE_OF_FAMILY[family];
  return CONSTELLATION_RU_SUBTYPE[`${family}:${slug}`] ?? (baseId ? CONSTELLATION_PART_NAME_RU[baseId] ?? en : en);
}

export function resourceName(id: string, lang: Lang): string {
  return lang === 'ru' ? CONSTELLATION_RESOURCE_NAME_RU[id] ?? id : id;
}

export { COMPLEX_COPY_RU };

export function polarizationName(en: string, lang: Lang): string {
  return lang === 'ru' ? CONSTELLATION_POLARIZATION_NAME_RU[en] ?? en : en;
}
