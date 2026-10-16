import { RESOURCES, SHADOW_PARTS } from '../../app/core/data/parts';
import type { AssessmentInput } from '../../app/core/data/scoring-v2';
import type { Lang } from '../i18n/strings';
import { KEYS } from './local-store';
import { validProfile } from './profile-contract';
import { DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY, isDescentDraft } from './assessment-draft';
import { sanitizeLegacyAiAnalysis } from './legacy-ai-analysis';
import { SHAPES, EYES, MOUTHS, HEADS, FACES, type Part } from '../pal/traits';

const MAX_BYTES = 20 * 1024 * 1024;
const BASE_KEYS = [KEYS.parts, KEYS.profile, KEYS.history, KEYS.charter, KEYS.syn,
  'ifs.lang', 'ifs.theme', 'ifs.onboarded', 'ifs.assessment.draft', 'ifs.legacy64.result',
  'ifs.journal', 'ifs.sealed', 'ifs.sealed.verdict', 'ifs.universe.dimensions.v1',
  DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY, 'INNERVERSE_FUTURE_SELF_V1', 'INNERVERSE_PROFILE_V1',
  'INNERVERSE_CHECKINS_V1', 'INNERVERSE_SEALED_VERDICTS_V1', 'INNERVERSE_JITAI_V1',
  'INNERVERSE_CHARTER_V1', 'INNERVERSE_EVENTS_V1', 'INNERVERSE_PRACTICE_V1', 'INNERVERSE_SYNASTRY_RUNS_V1',
  'ARCHETYPE_ASSESSMENT_RESPONSES', 'ARCHETYPE_ASSESSMENT_INDEX', 'ARCHETYPE_COMPLETED_BACKUP',
  'archetype_scoring_method', 'ARCHETYPE_SYNASTRY_CONNECTIONS', 'ARCHETYPE_SYNASTRY_REPORTS', 'ARCHETYPE_SYNASTRY_PARTNER'];
export const PORTABLE_KEYS = new Set([...BASE_KEYS, ...BASE_KEYS.map((key) => `${key}.hist`)]);
const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const ratings = (value: unknown, count: number, draft = false): value is number[] => Array.isArray(value)
  && value.length === count && value.every((v) => Number.isInteger(v) && v >= (draft ? 0 : 1) && v <= 5);

export function isCanonicalAssessmentInput(input: unknown): input is AssessmentInput {
  return object(input) && SHADOW_PARTS.every((id) => ratings(input.shadow?.[id], 8))
    && RESOURCES.every((id) => ratings(input.resources?.[id], 6)) && ratings(input.self, 8)
    && Number.isInteger(input.validity?.attention) && input.validity.attention >= 1 && input.validity.attention <= 5
    && ratings(input.validity?.infrequency, 2);
}

export function validMapParts(value: unknown): value is Part[] {
  if (!Array.isArray(value) || value.length > 1000) return false;
  const ids = new Set<string>();
  return value.every((part) => {
    if (!object(part) || typeof part.id !== 'string' || !part.id || ids.has(part.id)
      || typeof part.name !== 'string' || !['manager', 'firefighter', 'exile', 'resource'].includes(part.family)
      || !Number.isFinite(part.energy) || part.energy < 0 || part.energy > 100 || !object(part.traits)) return false;
    ids.add(part.id);
    const traits = part.traits;
    if (traits.characterSeed !== undefined && (!Number.isInteger(traits.characterSeed) || traits.characterSeed < 0 || traits.characterSeed > 0xffffffff)) return false;
    return SHAPES.includes(traits.shape) && EYES.includes(traits.eyes) && MOUTHS.includes(traits.mouth)
      && HEADS.includes(traits.head) && FACES.includes(traits.face) && /^#[a-f0-9]{3,8}$/i.test(traits.color)
      && (!part.archetype || object(part.archetype) && Array.isArray(part.archetype.coordinates)
        && part.archetype.coordinates.length === 4 && part.archetype.coordinates.every((n: unknown) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1));
  });
}

function validEntry(key: string, value: unknown): boolean {
  if (key.endsWith('.hist')) return Array.isArray(value) && value.length <= 1000 && value.every((item) => {
    try { return typeof item === 'string' && validEntry(key.slice(0, -5), JSON.parse(item)); } catch { return false; }
  });
  if (key === KEYS.parts) return validMapParts(value);
  if (key === KEYS.profile || key === KEYS.history) return value === null || validProfile(value);
  if (key === 'ifs.legacy64.result') return value === null || object(value);
  if (key === 'INNERVERSE_PROFILE_V1') return isCanonicalAssessmentInput(value);
  if (key === DESCENT_DRAFT_KEY) return isDescentDraft(value);
  if (key === LEGACY_DESCENT_DRAFT_KEY) return object(value) && ratings(value.answers, 147, true);
  if (key === 'INNERVERSE_FUTURE_SELF_V1') return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'string' && item.length <= 20_000);
  if (key === 'ARCHETYPE_ASSESSMENT_RESPONSES') return ratings(value, 64, true);
  if (key === 'ARCHETYPE_ASSESSMENT_INDEX') return Number.isInteger(value) && Number(value) >= 0 && Number(value) < 64;
  if (key === 'archetype_scoring_method') return value === 'deterministic' || value === 'fallback';
  if (key === 'ifs.lang') return value === 'en' || value === 'ru';
  if (key === 'ifs.theme') return value === 'light' || value === 'dark';
  if (key === 'ifs.onboarded') return typeof value === 'boolean';
  return object(value) || Array.isArray(value);
}

export interface PreparedBackup { schema: 'parts-cartographer.backup.v2'; source: string; entries: Record<string, unknown>; }

/** Parse first and write only after the entire import validates. Accept historical Angular formats. */
export async function prepareBackup(text: string, lang: Lang, existingParts: Part[] = []): Promise<PreparedBackup> {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Backup is too large');
  const parsed = JSON.parse(text, (key, value) => {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Invalid backup key');
    return value;
  });
  const entries: Record<string, unknown> = {};
  let source = 'parts-cartographer';
  if (object(parsed) && parsed.schema?.startsWith('parts-cartographer.backup') && parsed.schema !== 'parts-cartographer.backup.v2') throw new Error('Unsupported backup version');
  let data = object(parsed) && parsed.schema === 'parts-cartographer.backup.v2' ? parsed.data : parsed;
  if (isCanonicalAssessmentInput(data)) {
    entries.INNERVERSE_PROFILE_V1 = { shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, data.shadow[id]])),
      resources: Object.fromEntries(RESOURCES.map((id) => [id, data.resources[id]])), self: data.self,
      validity: { attention: data.validity.attention, infrequency: data.validity.infrequency } };
    source = 'angular-descent147';
  }
  else {
    const responses = Array.isArray(data) ? data : object(data)
      ? data.assessmentResponses ?? data.responses ?? (Array.isArray(data.data) ? data.data.map((item: any) => object(item) ? item.response : item) : undefined) : undefined;
    if (responses !== undefined) {
      if (!ratings(responses, 64, true)) throw new Error('Invalid assessment responses');
      entries.ARCHETYPE_ASSESSMENT_RESPONSES = responses;
      const firstOpen = responses.findIndex((answer) => answer === 0);
      entries.ARCHETYPE_ASSESSMENT_INDEX = firstOpen >= 0 ? firstOpen : 63;
      if (object(data)) entries.ARCHETYPE_COMPLETED_BACKUP = { assessmentResponses: responses, results: data.results, version: data.version, language: data.language };
      source = 'angular-assessment64';
    } else {
      if (!object(data)) throw new Error('Unsupported backup format');
      for (const [key, value] of Object.entries(data)) {
        if (!PORTABLE_KEYS.has(key)) continue;
        if (!validEntry(key, value)) throw new Error(`Invalid data for ${key}`);
        entries[key] = value;
      }
    }
  }
  if (!Object.keys(entries).length) throw new Error('No supported data in backup');
  const savedLang = entries['ifs.lang'] === 'ru' || entries['ifs.lang'] === 'en' ? entries['ifs.lang'] as Lang : lang;
  if (isCanonicalAssessmentInput(entries.INNERVERSE_PROFILE_V1)) {
    const [{ scoreProfile }, { adaptClinicalProfile }] = await Promise.all([import('../../app/core/data/scoring-v2'), import('./clinical-profile-adapter')]);
    const rebuilt = adaptClinicalProfile(scoreProfile(entries.INNERVERSE_PROFILE_V1), savedLang);
    const map = validMapParts(entries[KEYS.parts]) ? entries[KEYS.parts] as Part[] : existingParts;
    const ids = new Set(rebuilt.parts.map((part) => part.id));
    // Saved edits (traits, need, star, ...) win; canonical placement and provenance are rebuilt from the assessment.
    entries[KEYS.parts] = [...rebuilt.parts.map((part) => ({ ...part, ...map.find((old) => old.id === part.id), archetype: part.archetype, name: part.name })),
      ...map.filter((part) => !ids.has(part.id) && !part.id.startsWith('seed-'))];
    entries[KEYS.profile] = { ...rebuilt.profile, createdAt: (entries[KEYS.profile] as any)?.createdAt ?? rebuilt.profile.createdAt };
  }
  const responses = entries.ARCHETYPE_ASSESSMENT_RESPONSES;
  if (ratings(responses, 64)) {
    const { buildLegacyReportData, applyLegacyAiAnalysis } = await import('../screens/legacy-report-data');
    const original = (entries.ARCHETYPE_COMPLETED_BACKUP as any)?.results ?? entries['ifs.legacy64.result'];
    const rebuilt = buildLegacyReportData(responses, savedLang);
    const ai = original?.aiAnalysis ?? (original?.analysis && Array.isArray(original.pantheon) ? original : null);
    if (ai && (!original.language || original.language === savedLang)) {
      try {
        entries['ifs.legacy64.result'] = applyLegacyAiAnalysis(rebuilt, sanitizeLegacyAiAnalysis(ai));
        entries.archetype_scoring_method = 'fallback';
      } catch { entries['ifs.legacy64.result'] = rebuilt; entries.archetype_scoring_method = 'deterministic'; }
    } else { entries['ifs.legacy64.result'] = rebuilt; entries.archetype_scoring_method = 'deterministic'; }
  } else if (responses) entries['ifs.legacy64.result'] = null;
  return { schema: 'parts-cartographer.backup.v2', source, entries };
}

/** Transactional local merge/replace. Roll back every affected key on quota or storage failure. */
export function applyBackup(backup: PreparedBackup, storage: Storage = localStorage, mode: 'merge' | 'replace' = 'merge'): void {
  const keys = mode === 'replace' ? [...PORTABLE_KEYS] : Object.keys(backup.entries);
  const before = new Map(keys.map((key) => [key, storage.getItem(key)]));
  try {
    for (const key of keys) {
      if (Object.hasOwn(backup.entries, key)) storage.setItem(key, key === 'ARCHETYPE_ASSESSMENT_INDEX'
        ? String(backup.entries[key]) : JSON.stringify(backup.entries[key]));
      else if (mode === 'replace') storage.removeItem(key);
    }
  } catch (error) {
    for (const [key, old] of before) { try { if (old === null) storage.removeItem(key); else storage.setItem(key, old); } catch { /* report original failure */ } }
    throw error;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('ifs:local-restored'));
}

export function exportBackup(storage: Storage = localStorage) {
  const data: Record<string, unknown> = {};
  for (const key of PORTABLE_KEYS) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    try { data[key] = JSON.parse(raw); } catch { /* skip malformed records */ }
  }
  return { schema: 'parts-cartographer.backup.v2', exportedAt: new Date().toISOString(), data };
}
