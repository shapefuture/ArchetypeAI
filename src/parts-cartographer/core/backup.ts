import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { ALL_PART_IDS, CRISIS_TRIGGERS } from '../../shared/core/data/state-v2';
import type { AssessmentInput } from '../../shared/core/data/scoring-v2';
import type { Lang } from '../i18n/strings';
import { KEYS } from './local-store';
import { validClinicalScore, validProfile } from './profile-contract';
import { DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY, isDescentDraft } from './assessment-draft';
import { sanitizeLegacyAiAnalysis } from './legacy-ai-analysis';
import { SHAPES, EYES, MOUTHS, HEADS, FACES, type Part } from '../pal/traits';
import { readGoalRecord } from '../elevation/e01-goal';
import { ladderRung } from '../../shared/core/data/exercises';

const MAX_BYTES = 20 * 1024 * 1024;
const BASE_KEYS = [KEYS.parts, KEYS.profile, KEYS.history, KEYS.charter, KEYS.syn,
  'ifs.lang', 'ifs.theme', 'ifs.onboarded', 'ifs.assessment.draft', 'ifs.legacy64.result',
  'ifs.journal', 'ifs.sealed', 'ifs.sealed.verdict', 'ifs.universe.dimensions.v1',
  DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY, 'INNERVERSE_FUTURE_SELF_V1', 'INNERVERSE_PROFILE_V1',
  'INNERVERSE_CHECKINS_V1', 'INNERVERSE_SEALED_VERDICTS_V1', 'INNERVERSE_JITAI_V1',
  'INNERVERSE_CHARTER_V1', 'INNERVERSE_EVENTS_V1', 'INNERVERSE_GOAL_V1', 'INNERVERSE_PRACTICE_V1', 'INNERVERSE_SYNASTRY_RUNS_V1',
  'ARCHETYPE_ASSESSMENT_RESPONSES', 'ARCHETYPE_ASSESSMENT_INDEX', 'ARCHETYPE_COMPLETED_BACKUP',
  'archetype_scoring_method', 'ARCHETYPE_SYNASTRY_CONNECTIONS', 'ARCHETYPE_SYNASTRY_REPORTS', 'ARCHETYPE_SYNASTRY_PARTNER'];
/**
 * Everything the person writes is portable: every key with an app prefix,
 * except sign-in, billing, push and telemetry data, device-only presentation
 * and hardware choices, and bearer share codes. BASE_KEYS remain the keys with
 * their own shape checks below.
 */
const APP_KEY = /^(ifs\.|INNERVERSE_|ARCHETYPE_|archetype_)/;
const NOT_PORTABLE = new Set([
  'ifs.auth', 'ifs.billing', 'ifs.billing.verified.v2', 'ifs.billing.pending', 'ifs.telemetry', 'ifs.chunk-reload', 'ifs.share.codes', 'ifs.state',
  'ifs.sensory.v1', 'INNERVERSE_PUSH_TOKEN_V1', 'INNERVERSE_PUSH_LAST_NUDGE_V1', 'INNERVERSE_DEVICE_ENVELOPE_V1',
  // Holds the partner code of each synastry run: a bearer code that must not leave the device.
  'INNERVERSE_SYNASTRY_RUNS_V1',
]);
export function isPortableKey(key: string): boolean {
  const base = key.endsWith('.hist') ? key.slice(0, -5) : key;
  return APP_KEY.test(base) && !NOT_PORTABLE.has(base);
}
export const PORTABLE_KEYS = { has: isPortableKey };
/** Keys the app stores as a bare string rather than JSON; they are exported and restored as written. */
const RAW_STRING_KEYS = new Set(['archetype_scoring_method']);
/** Device preferences a "replace" restore keeps when the backup does not carry them. */
const DEVICE_PREFERENCES = new Set(['ifs.lang', 'ifs.theme', 'ifs.onboarded', 'ifs.help.seen', 'ifs.install.seen']);
void BASE_KEYS;
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
      || !['nameEn', 'nameRu'].every((field) => part[field] === undefined || typeof part[field] === 'string')
      || !Number.isFinite(part.energy) || part.energy < 0 || part.energy > 100 || !object(part.traits)) return false;
    // Cards and the Cabinet draw these as text; an object here would break the screen.
    if (!['role', 'blurb', 'burden', 'need', 'voice', 'since'].every((field) => part[field] === undefined || typeof part[field] === 'string')) return false;
    ids.add(part.id);
    const traits = part.traits;
    if (traits.characterSeed !== undefined && (!Number.isInteger(traits.characterSeed) || traits.characterSeed < 0 || traits.characterSeed > 0xffffffff)) return false;
    return SHAPES.includes(traits.shape) && EYES.includes(traits.eyes) && MOUTHS.includes(traits.mouth)
      && HEADS.includes(traits.head) && FACES.includes(traits.face) && /^#[a-f0-9]{3,8}$/i.test(traits.color)
      && (!part.archetype || object(part.archetype) && Array.isArray(part.archetype.coordinates)
        && part.archetype.coordinates.length === 4 && part.archetype.coordinates.every((n: unknown) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1)
        && (part.archetype.cluster === undefined || typeof part.archetype.cluster === 'string')
        // The scene scales each node by these two numbers: a word here would draw the node at NaN.
        && (part.archetype.size === undefined || Number.isFinite(part.archetype.size))
        && (part.archetype.prominence === undefined || Number.isFinite(part.archetype.prominence)));
  });
}

/**
 * An archive (`<key>.hist`) is a list of packed copies of its key. Each copy is judged alone: one that fails the
 * key's validator is dropped, and the readable copies beside it are kept.
 */
function readableCopies(key: string, value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 1000) return null;
  const base = key.slice(0, -5);
  return value.filter((item): item is string => {
    if (typeof item !== 'string') return false;
    try {
      const copy = JSON.parse(item);
      // History screens read a report copy through its scored result, so an older copy stays while that result is complete.
      return validEntry(base, copy) || ((base === KEYS.history || base === KEYS.profile) && object(copy) && validClinicalScore(copy.clinical));
    } catch { return false; }
  });
}

function validEntry(key: string, value: unknown): boolean {
  if (key === KEYS.parts) return validMapParts(value);
  if (key === KEYS.profile || key === KEYS.history) return value === null || validProfile(value);
  if (key === 'ifs.legacy64.result') return value === null || object(value);
  if (key === 'INNERVERSE_PROFILE_V1') return isCanonicalAssessmentInput(value);
  if (key === 'INNERVERSE_GOAL_V1') return readGoalRecord(value).status !== 'rejected';
  if (key === DESCENT_DRAFT_KEY) return isDescentDraft(value);
  if (key === LEGACY_DESCENT_DRAFT_KEY) return object(value) && ratings(value.answers, 147, true);
  // Journal entries are listed and prepended to: each needs its text and an id.
  if (key === 'ifs.journal') return Array.isArray(value) && value.length <= 5000
    && value.every((item) => object(item) && typeof item.what === 'string' && item.what.length <= 20_000 && (typeof item.id === 'number' || typeof item.id === 'string')
      && typeof item.kind === 'string' && ['where', 'part', 'note'].every((field) => item[field] === undefined || item[field] === null || typeof item[field] === 'string'));
  // Check-ins and charter records are lists; a single value in their place would break the check-in screen.
  if (key === 'INNERVERSE_CHECKINS_V1') return Array.isArray(value);
  if (key === 'INNERVERSE_CHARTER_V1') return Array.isArray(value) && value.every((item) => object(item));
  // Sealed notes resurface on open: each needs a numeric due time and its text.
  if (key === 'ifs.sealed') return Array.isArray(value) && value.length <= 500
    && value.every((item) => object(item) && typeof item.until === 'number' && Number.isFinite(item.until) && typeof item.text === 'string' && item.text.length <= 20_000);
  if (key === 'INNERVERSE_FUTURE_SELF_V1') return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'string' && item.length <= 20_000);
  if (key === 'ARCHETYPE_ASSESSMENT_RESPONSES') return ratings(value, 64, true);
  if (key === 'ARCHETYPE_ASSESSMENT_INDEX') return Number.isInteger(value) && Number(value) >= 0 && Number(value) < 64;
  if (key === 'archetype_scoring_method') return value === 'deterministic' || value === 'fallback';
  if (key === 'ifs.lang') return value === 'en' || value === 'ru';
  if (key === 'ifs.theme') return value === 'light' || value === 'dark';
  if (key === 'ifs.onboarded') return typeof value === 'boolean';
  // Other keys may hold an object, a list, or a plain flag, preference or timestamp
  // (for example the capacity preference is the string 'low', 'medium' or 'high').
  return object(value) || Array.isArray(value) || ['string', 'number', 'boolean'].includes(typeof value);
}

/** A check-in the engine can read: a time, an arousal from -2 to 2, and an event type it knows if one is set. */
function readableCheckIn(row: unknown): boolean {
  const item = row as Record<string, unknown> | null;
  return object(item) && typeof item.date === 'string' && Number.isFinite(Date.parse(item.date))
    && Number.isInteger(item.arousal) && (item.arousal as number) >= -2 && (item.arousal as number) <= 2
    && (item.eventType === undefined || (typeof item.eventType === 'string' && Object.hasOwn(CRISIS_TRIGGERS, item.eventType)))
    && (item.confirmedPart == null || ALL_PART_IDS.includes(item.confirmedPart as never))
    && (item.predictedPart == null || ALL_PART_IDS.includes(item.predictedPart as never));
}

/** `skipped` lists keys whose stored value had the wrong shape; the rest restores. */
export interface PreparedBackup { schema: 'parts-cartographer.backup.v2'; source: string; entries: Record<string, unknown>; skipped: string[]; }

/** Parse first and write only after the entire import validates. Accept historical Angular formats. */
export async function prepareBackup(text: string, lang: Lang, existingParts: Part[] = []): Promise<PreparedBackup> {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Backup is too large');
  const parsed = JSON.parse(text, (key, value) => {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Invalid backup key');
    return value;
  });
  const entries: Record<string, unknown> = {};
  const skipped: string[] = [];
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
        if (!isPortableKey(key)) continue;
        // One malformed value must not make the rest of a person's backup unrestorable.
        if (key.endsWith('.hist')) {
          const copies = readableCopies(key, value);
          if (copies === null || (copies.length === 0 && value.length > 0)) skipped.push(key);
          else entries[key] = copies;
          continue;
        }
        if (!validEntry(key, value)) { skipped.push(key); continue; }
        entries[key] = key === 'INNERVERSE_CHECKINS_V1' && Array.isArray(value) ? value.filter(readableCheckIn) : value;
      }
    }
  }
  if (!Object.keys(entries).length) throw new Error('No supported data in backup');
  const savedLang = entries['ifs.lang'] === 'ru' || entries['ifs.lang'] === 'en' ? entries['ifs.lang'] as Lang : lang;
  // The saved profile may be one restored from History or the cloud, not the last test taken here,
  // so its own score wins over the raw answers of the last test.
  const savedScore = (entries[KEYS.profile] as any)?.testModel === 'angular-v2' ? (entries[KEYS.profile] as any).clinical : undefined;
  if (savedScore || isCanonicalAssessmentInput(entries.INNERVERSE_PROFILE_V1)) {
    const [{ scoreProfile }, { adaptClinicalProfile, archetypeOf }] = await Promise.all([import('../../shared/core/data/scoring-v2'), import('./clinical-profile-adapter')]);
    const rebuilt = adaptClinicalProfile(savedScore ?? scoreProfile(entries.INNERVERSE_PROFILE_V1 as any), savedLang);
    const map = validMapParts(entries[KEYS.parts]) ? entries[KEYS.parts] as Part[] : existingParts;
    const ids = new Set(rebuilt.parts.map((part) => part.id));
    // Saved edits (traits, need, star, ...) win; canonical placement and provenance are rebuilt from the assessment.
    entries[KEYS.parts] = [...rebuilt.parts.map((part) => {
      const old = map.find((item) => item.id === part.id);
      // A name the person typed wins; the canonical name is only the fallback.
      return { ...part, ...old, archetype: part.archetype && archetypeOf(old?.family ?? part.family, part.archetype), name: old?.name ?? part.name };
    }),
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
  return { schema: 'parts-cartographer.backup.v2', source, entries, skipped };
}

/** Transactional local merge/replace. Roll back every affected key on quota or storage failure. */
function storageKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) { const key = storage.key(i); if (key !== null) keys.push(key); }
  return keys;
}

/** Lists a merge combines with the device's own copy instead of replacing them. Items match by id (or date). */
interface MergedList {
  idOf: (item: any) => unknown;
  /** Which of this device's own items the merge keeps. */
  keep?: (item: any) => boolean;
  /** When this device holds the same record, whether its copy beats the file's (for example a re-rating made here). */
  keepDevice?: (device: any, incoming: any) => boolean;
  sort?: (a: any, b: any) => number;
  /** Keep only the newest this many (the list is in order by then). */
  cap?: number;
}
/** A record's content as a key: the same record matches however its keys were ordered when written. */
const contentKey = (value: unknown): string => JSON.stringify(value, (_key, item) => (item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item));
/** A stored time: an ISO string or a number of milliseconds. Unreadable times sort first. */
const timeOf = (value: unknown): number => (typeof value === 'number' ? value : Date.parse(String(value))) || 0;
const MERGED_LISTS: Record<string, MergedList> = {
  'ifs.journal': { idOf: (item) => item?.id, sort: (a, b) => (Number(b?.at) || 0) - (Number(a?.at) || 0) },
  // Records without an id are matched by their content: the same record is kept once, a different one is kept too.
  'ifs.charter': { idOf: contentKey },
  'ifs.sealed': { idOf: contentKey },
  INNERVERSE_CHARTER_V1: { idOf: contentKey, sort: (a, b) => timeOf(a?.at) - timeOf(b?.at) },
  INNERVERSE_EVENTS_V1: { idOf: contentKey, sort: (a, b) => timeOf(a?.at) - timeOf(b?.at) },
  INNERVERSE_SEALED_VERDICTS_V1: {
    idOf: (item) => item?.createdAt ?? contentKey(item),
    // A re-rating made on this device is newer than the file's copy of the same verdict.
    keepDevice: (device, incoming) => Boolean(device?.reRating) && !incoming?.reRating,
    sort: (a, b) => timeOf(a?.createdAt) - timeOf(b?.createdAt),
  },
  [KEYS.parts]: { idOf: (item) => item?.id, keep: (item) => !String(item?.id ?? '').startsWith('seed-') },
  INNERVERSE_CHECKINS_V1: { idOf: (item) => item?.date, sort: (a, b) => (Date.parse(a?.date) || 0) - (Date.parse(b?.date) || 0) },
};

function readList(storage: Storage, key: string): unknown[] {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

/** The incoming items plus this device's items the file does not carry, in the list's own order. */
function mergeLists(incoming: unknown[], existing: unknown[], list: MergedList): unknown[] {
  const deviceById = new Map(existing.filter((item) => list.idOf(item) !== undefined).map((item) => [list.idOf(item), item]));
  const incomingIds = new Set(incoming.map(list.idOf).filter((id) => id !== undefined));
  const taken = incoming.map((item) => {
    const device = deviceById.get(list.idOf(item));
    return device !== undefined && list.keepDevice?.(device, item) ? device : item;
  });
  const kept = existing.filter((item) => (!list.keep || list.keep(item))
    && (list.idOf(item) === undefined || !incomingIds.has(list.idOf(item))));
  const merged = [...taken, ...kept];
  const ordered = list.sort ? merged.sort(list.sort) : merged;
  return list.cap ? ordered.slice(-list.cap) : ordered;
}

/** A report archive (`<key>.hist`) holds packed copies, oldest first. A merge keeps both sides' copies, newest last. */
const archiveTime = (packed: unknown): number => {
  try { const value = JSON.parse(String(packed)); return timeOf(value?.createdAt ?? value?.at); } catch { return 0; }
};
const ARCHIVE_LIST: MergedList = { idOf: (item) => item, sort: (a, b) => archiveTime(a) - archiveTime(b), cap: 30 };

/** Objects a merge combines field by field: their lists are merged by the rules given here; `combine` sets other fields by a rule. */
interface MergedObject {
  fields?: Record<string, MergedList>;
  everyField?: MergedList;
  combine?: Record<string, (device: any, incoming: any) => unknown>;
}
/** The furthest practice rung reached for each exercise, on this device or in the file: a merge never moves a skill back. */
function furthestLadders(device: any, incoming: any): unknown {
  if (!isPlainObject(incoming)) return device;
  if (!isPlainObject(device)) return incoming;
  const rung = (state: unknown): number => (isPlainObject(state) ? ladderRung(state) : -1);
  const out: Record<string, unknown> = { ...device };
  const planOf = (entry: any): string | undefined => (typeof entry?.ifThen === 'string' && entry.ifThen.trim() ? entry.ifThen : undefined);
  for (const [id, state] of Object.entries(incoming)) {
    const deviceFurther = rung(device[id]) > rung(state);
    const further = deviceFurther ? device[id] : state;
    const earlier = deviceFurther ? state : device[id];
    // The furthest entry is the skill's record, but a plan written on the other side is text the file may not carry.
    const plan = planOf(further) ?? planOf(earlier);
    out[id] = plan === undefined ? further : { ...further, ifThen: plan };
  }
  return out;
}
/** The later of this device's time and the file's: a merge keeps the most recent suggestion. */
const laterTime = (device: any, incoming: any): unknown => (incoming === undefined || timeOf(incoming) < timeOf(device) ? device : incoming);
const MERGED_OBJECTS: Record<string, MergedObject> = {
  INNERVERSE_MEMORY_V1: { fields: { memories: { idOf: (memory) => memory?.id }, corrections: { idOf: contentKey } } },
  // Part edit history: one list of versions per part.
  INNERVERSE_PART_VERSIONS_V1: { everyField: { idOf: contentKey, sort: (a, b) => timeOf(a?.at) - timeOf(b?.at) } },
  // Practice: completed practices are kept from both sides, each ladder keeps its furthest rung, and the latest suggestion wins.
  INNERVERSE_PRACTICE_V1: {
    fields: { completed: { idOf: (id) => id } },
    combine: { ladder: furthestLadders, lastSuggestedAt: laterTime },
  },
};
const isPlainObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);

function readObject(storage: Storage, key: string): Record<string, any> {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null');
    return isPlainObject(value) ? value : {};
  } catch { return {}; }
}

/** The file's object with each merged field combined with this device's copy of it. */
function mergeObjects(incoming: Record<string, any>, existing: Record<string, any>, spec: MergedObject): Record<string, any> {
  const out: Record<string, any> = { ...existing, ...incoming };
  for (const field of new Set([...Object.keys(incoming), ...Object.keys(existing)])) {
    const list = spec.fields?.[field] ?? spec.everyField;
    if (!list || (!Array.isArray(incoming[field]) && !Array.isArray(existing[field]))) continue;
    out[field] = mergeLists(Array.isArray(incoming[field]) ? incoming[field] : [], Array.isArray(existing[field]) ? existing[field] : [], list);
  }
  for (const [field, combine] of Object.entries(spec.combine ?? {})) {
    if (incoming[field] !== undefined || existing[field] !== undefined) out[field] = combine(existing[field], incoming[field]);
  }
  return out;
}

export function applyBackup(backup: PreparedBackup, storage: Storage = localStorage, mode: 'merge' | 'replace' = 'merge'): void {
  // Replace clears portable data the backup does not carry, but never a key it
  // reported as damaged (the local copy stays) nor this device's preferences.
  const keep = new Set([...(backup.skipped ?? []), ...(backup.skipped ?? []).map((key) => `${key}.hist`), ...DEVICE_PREFERENCES]);
  const keys = mode === 'replace'
    ? [...new Set([...storageKeys(storage).filter((key) => isPortableKey(key) && !keep.has(key)), ...Object.keys(backup.entries)])]
    : Object.keys(backup.entries);
  const before = new Map(keys.map((key) => [key, storage.getItem(key)]));
  try {
    for (const key of keys) {
      if (Object.hasOwn(backup.entries, key)) {
        const list = mode === 'merge' ? (MERGED_LISTS[key] ?? (key.endsWith('.hist') ? ARCHIVE_LIST : undefined)) : undefined;
        const objectSpec = mode === 'merge' ? MERGED_OBJECTS[key] : undefined;
        const incoming = backup.entries[key];
        // A merge keeps this device's own copies that the file does not carry: journal, parts, check-ins, archives, memories.
        if (list && Array.isArray(incoming)) storage.setItem(key, JSON.stringify(mergeLists(incoming, readList(storage, key), list)));
        else if (objectSpec && isPlainObject(incoming)) storage.setItem(key, JSON.stringify(mergeObjects(incoming, readObject(storage, key), objectSpec)));
        else storage.setItem(key, key === 'ARCHETYPE_ASSESSMENT_INDEX' || RAW_STRING_KEYS.has(key)
          ? String(incoming) : JSON.stringify(incoming));
      }
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
  for (const key of storageKeys(storage).filter(isPortableKey).sort()) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    if (RAW_STRING_KEYS.has(key)) { data[key] = raw; continue; }
    try { data[key] = JSON.parse(raw); } catch { /* skip malformed records */ }
  }
  return { schema: 'parts-cartographer.backup.v2', exportedAt: new Date().toISOString(), data };
}
