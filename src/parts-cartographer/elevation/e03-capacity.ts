// Capacity-sensitive experience (ArchetypeAI-0wc, E03.04; recovery ArchetypeAI-h5o, E03.07). Pure.
// An explicit, reversible capacity choice changes step count, optional pauses and interaction length.
// It never reduces, reorders or rewrites inquiry answers, readings, the canonical 64 or 147 item order or
// scores. Sound, motion, texture and layout density stay on their own axis (core/sensory-preferences).
// Assessment-free support is available in every mode. Each plan states its provenance: the choice is the
// person's, steps are presentation only, and measurement is canonical only for the 64 and 147 routes.
// NOT done here: the chooser and effort copy (step 05), wiring into screens or storage (step 06), and any
// evidence that a mode helps comprehension, effort or access (steps 10-12). No storage, network, DOM or clock
// access: the caller saves, displays and times everything.
import { ASSESSMENT_ROUTES } from '../core/assessment-routes';
import { DESCENT_BREAK_INDEXES } from '../core/assessment-draft';
import { MAX_QUESTIONS, answer, nextQuestion, startInquiry, type Inquiry } from '../core/situation-inquiry';
import { DEFAULT_SENSORY_PREFERENCES, updateSensoryPreference, type SensoryPreferences } from '../core/sensory-preferences';

export type CapacityLevel = 'low' | 'medium' | 'high';
export type RouteMode = 'situation-inquiry' | 'reflection-64' | 'battery-147';
export type Lang = 'en' | 'ru';
export type SensoryKey = 'motion' | 'sound' | 'texture' | 'density';

export const CAPACITY_LEVELS: readonly CapacityLevel[] = ['low', 'medium', 'high'];
export const DEFAULT_CAPACITY: CapacityLevel = 'medium';
/** Inquiry questions per capacity, never above the situation-inquiry bound. */
export const QUESTION_LIMIT: Record<CapacityLevel, number> = { low: 1, medium: 2, high: MAX_QUESTIONS };
/** Items per step on the canonical item routes. Sitting boundaries apply on top of this. */
export const CHUNK_SIZE: Record<CapacityLevel, number> = { low: 8, medium: 16, high: 32 };
const INTERACTION_LENGTH: Record<CapacityLevel, 'short' | 'standard' | 'full'> = { low: 'short', medium: 'standard', high: 'full' };
const SITTING_ENDS: Partial<Record<RouteMode, readonly number[]>> = { 'battery-147': DESCENT_BREAK_INDEXES };

export interface PresentationPlan {
  route: RouteMode;
  capacity: CapacityLevel;
  /** Canonical instrument flag from assessment-routes. No capacity changes it. */
  canonical: boolean;
  /** Canonical item count, or null for the inquiry. */
  itemCount: number | null;
  /** Inquiry: questions offered. Item routes: steps shown. */
  stepCount: number;
  /** Index of the last item before each optional pause. */
  pauses: number[];
  /** Item indexes per step, always in canonical order. */
  chunks: number[][];
  interactionLength: 'short' | 'standard' | 'full';
  provenance: { capacity: 'user-choice'; steps: 'presentation-only'; measurement: 'canonical' | 'none'; scores: 'unchanged' };
  supportAvailable: true;
}

function pausesFor(count: number, size: number, sittingEnds: readonly number[]): number[] {
  const pauses: number[] = [];
  let start = 0;
  for (const end of [...sittingEnds, count - 1]) {
    for (let i = start + size - 1; i < end; i += size) pauses.push(i);
    if (end < count - 1) pauses.push(end);
    start = end + 1;
  }
  return pauses;
}

function chunksFor(count: number, pauses: readonly number[]): number[][] {
  const chunks: number[][] = [];
  let start = 0;
  for (const pause of [...pauses, count - 1]) {
    chunks.push(Array.from({ length: pause - start + 1 }, (_, k) => start + k));
    start = pause + 1;
  }
  return chunks;
}

/** Step plan for a route at a capacity. The canonical item order and count are identical at every capacity. */
export function presentationPlan(route: RouteMode, capacity: CapacityLevel): PresentationPlan {
  const entry = ASSESSMENT_ROUTES.find((r) => r.id === route);
  const canonical = entry?.canonical ?? false;
  const itemCount = entry?.itemCount ?? null;
  const base = {
    route,
    capacity,
    canonical,
    itemCount,
    interactionLength: INTERACTION_LENGTH[capacity],
    provenance: {
      capacity: 'user-choice' as const,
      steps: 'presentation-only' as const,
      measurement: canonical ? ('canonical' as const) : ('none' as const),
      scores: 'unchanged' as const,
    },
    supportAvailable: true as const,
  };
  if (itemCount === null) return { ...base, stepCount: QUESTION_LIMIT[capacity], pauses: [], chunks: [] };
  const pauses = pausesFor(itemCount, CHUNK_SIZE[capacity], SITTING_ENDS[route] ?? []);
  const chunks = chunksFor(itemCount, pauses);
  return { ...base, stepCount: chunks.length, pauses, chunks };
}

export interface CapacitySession {
  inquiry: Inquiry;
  capacity: CapacityLevel;
  /** Earlier capacity levels, most recent last. revertCapacity steps back one. */
  previous: CapacityLevel[];
  lang: Lang;
  /** Owning account, or null for a local session on this device. */
  accountId: string | null;
}

export const normalizeCapacity = (value: unknown): CapacityLevel =>
  (CAPACITY_LEVELS as readonly unknown[]).includes(value) ? (value as CapacityLevel) : DEFAULT_CAPACITY;

export function startCapacitySession(
  observation: string,
  options: { capacity?: unknown; lang?: Lang; accountId?: string | null } = {},
): CapacitySession | null {
  const inquiry = startInquiry(observation);
  if (!inquiry) return null;
  return { inquiry, capacity: normalizeCapacity(options.capacity), previous: [], lang: options.lang ?? 'en', accountId: options.accountId ?? null };
}

export function remainingQuestions(session: CapacitySession): number {
  return Math.max(0, QUESTION_LIMIT[session.capacity] - session.inquiry.questionsAsked);
}

/** Next question from the caller's ordered list, within the current capacity. Null at the limit. */
export function nextInquiryQuestion(session: CapacitySession, questions: readonly string[]): string | null {
  return remainingQuestions(session) > 0 ? nextQuestion(session.inquiry, questions) : null;
}

/** Adds an answer. Refused only at the current step limit, so the caller keeps the draft. Nothing given is changed. */
export function recordInquiryAnswer(
  session: CapacitySession,
  id: string,
  text: string,
): { ok: true; session: CapacitySession } | { ok: false; reason: 'step-limit' } {
  return remainingQuestions(session) > 0
    ? { ok: true, session: { ...session, inquiry: answer(session.inquiry, id, text) } }
    : { ok: false, reason: 'step-limit' };
}

/** Explicit, reversible capacity change mid-inquiry. The inquiry itself is not touched. */
export function switchCapacity(session: CapacitySession, level: CapacityLevel): CapacitySession {
  return level === session.capacity ? session : { ...session, capacity: level, previous: [...session.previous, session.capacity] };
}

/** Steps back to the previous capacity exactly. */
export function revertCapacity(session: CapacitySession): CapacitySession {
  const last = session.previous[session.previous.length - 1];
  return last === undefined ? session : { ...session, capacity: last, previous: session.previous.slice(0, -1) };
}

export function switchLanguage(session: CapacitySession, lang: Lang): CapacitySession {
  return { ...session, lang };
}

export type Visibility = { status: 'shown'; session: CapacitySession } | { status: 'held'; reason: 'other-account' };

/** A session owned by another account is held: neither shown nor deleted. Unowned local sessions stay on this device. */
export function visibleTo(session: CapacitySession, accountId: string | null): Visibility {
  return session.accountId === null || session.accountId === accountId
    ? { status: 'shown', session }
    : { status: 'held', reason: 'other-account' };
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const INQUIRY_LISTS = ['answers', 'hypotheses', 'unknowns', 'rejected', 'corrections'];

/** Validates a stored session after an interruption. An unknown capacity falls back to the default; a malformed inquiry is refused. */
export function restoreCapacitySession(raw: unknown): CapacitySession | null {
  if (!isRecord(raw) || !isRecord(raw.inquiry)) return null;
  const inquiry = raw.inquiry;
  const valid = typeof inquiry.observation === 'string'
    && typeof inquiry.questionsAsked === 'number'
    && INQUIRY_LISTS.every((key) => Array.isArray(inquiry[key]));
  if (!valid) return null;
  return {
    inquiry: { ...inquiry } as unknown as Inquiry,
    capacity: normalizeCapacity(raw.capacity),
    previous: Array.isArray(raw.previous) ? raw.previous.map((level) => normalizeCapacity(level)) : [],
    lang: raw.lang === 'ru' ? 'ru' : 'en',
    accountId: typeof raw.accountId === 'string' ? raw.accountId : null,
  };
}

export interface PreferenceState { value: SensoryPreferences; version: number; saved: boolean; }

export function startPreferences(value: SensoryPreferences = DEFAULT_SENSORY_PREFERENCES): PreferenceState {
  return { value, version: 0, saved: true };
}

/** Applies one sensory change at once, independently of the others and of capacity. The caller then saves. */
export function changePreference<K extends SensoryKey>(state: PreferenceState, key: K, value: SensoryPreferences[K]): PreferenceState {
  return { value: updateSensoryPreference(state.value, key, value), version: state.version + 1, saved: false };
}

/** The unsaved value and its version, or null when the latest value is stored. */
export function pendingSave(state: PreferenceState): { version: number; value: SensoryPreferences } | null {
  return state.saved ? null : { version: state.version, value: state.value };
}

/** A result for an older version is ignored, so a late acknowledgement cannot mark a newer change as saved. */
export function recordSaveResult(state: PreferenceState, version: number, ok: boolean): PreferenceState {
  return version === state.version ? { ...state, saved: ok } : state;
}
