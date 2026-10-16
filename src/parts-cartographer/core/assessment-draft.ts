/**
 * Durable draft for the 147-item descent (docs/80-20-plan.md §9.2 steps 5, 6, 9).
 *
 * - Answers are keyed by stable item IDs (part + item number, validity name),
 *   never by delivery position, so a re-ordered schedule cannot move an answer
 *   onto a different item.
 * - A save counts only when the store hands back exactly what was written.
 * - The historical positional draft (V1) is never read as current data. It is
 *   offered for migration by an explicit user action, or discarded by one.
 * - There is no skip value. Every scored item needs a rating from 1 to 5.
 */
import { buildItemSequence, type ItemRef } from '../../i18n/items';

export const DESCENT_DRAFT_KEY = 'INNERVERSE_DESCENT_V2';
export const LEGACY_DESCENT_DRAFT_KEY = 'INNERVERSE_DESCENT_V1';
/** Prefix for an unreadable draft copied aside before it is overwritten. Local only, never exported. */
export const UNREADABLE_DESCENT_DRAFT_PREFIX = 'INNERVERSE_DESCENT_V2_UNREADABLE.';
export const DESCENT_DRAFT_SCHEMA = 'descent-draft.v2';
export const DESCENT_ITEM_COUNT = 147;
/** Sitting boundaries: the last item of Descent I and Descent II (0-based). */
export const DESCENT_BREAK_INDEXES = [48, 97] as const;
export const DESCENT_LAST_INDEX = DESCENT_ITEM_COUNT - 1;

export type DescentStage = 'item' | 'break' | 'future-self';

export interface DescentDraft {
  schema: typeof DESCENT_DRAFT_SCHEMA;
  /** Stable item ID to rating (1..5). An absent ID is unanswered. There is no skip value. */
  answers: Record<string, number>;
  cursor: { itemId: string; stage: DescentStage };
  savedAt: string;
}

export type DraftRead =
  | { status: 'none' }
  | { status: 'draft'; draft: DescentDraft }
  | { status: 'legacy'; answers: number[] }
  | { status: 'rejected'; reason: 'unavailable' | 'corrupt' | 'unsupported' };

export type SaveFailure = 'quota' | 'blocked' | 'unavailable' | 'verify-failed';
export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: SaveFailure };

export function itemId(ref: ItemRef): string {
  switch (ref.kind) {
    case 'shadow': return `shadow.${ref.part}.${ref.index + 1}`;
    case 'resource': return `resource.${ref.part}.${ref.index + 1}`;
    case 'self': return `self.${ref.index + 1}`;
    case 'validity': return `validity.${ref.which}`;
  }
}

/** Item IDs in delivery order. Position i is the item shown at index i. */
export const DESCENT_ITEM_IDS: readonly string[] = buildItemSequence().map(itemId);
const ID_SET = new Set(DESCENT_ITEM_IDS);
const STAGES: readonly DescentStage[] = ['item', 'break', 'future-self'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const isRating = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;

export function isDescentDraft(value: unknown): value is DescentDraft {
  if (!isObject(value) || value.schema !== DESCENT_DRAFT_SCHEMA) return false;
  if (typeof value.savedAt !== 'string' || !isObject(value.answers) || !isObject(value.cursor)) return false;
  const { itemId: cursorId, stage } = value.cursor;
  if (typeof cursorId !== 'string' || !ID_SET.has(cursorId) || !STAGES.includes(stage as DescentStage)) return false;
  return Object.entries(value.answers).every(([id, rating]) => ID_SET.has(id) && isRating(rating));
}

/** Positional view for the screen: 0 means unanswered. */
export function toPositional(answers: Record<string, number>): number[] {
  return DESCENT_ITEM_IDS.map((id) => (isRating(answers[id]) ? answers[id] : 0));
}

/** Storage view from the positional screen state. Unanswered positions are omitted. */
export function fromPositional(positional: readonly number[]): Record<string, number> {
  const answers: Record<string, number> = {};
  positional.forEach((rating, index) => {
    if (isRating(rating)) answers[DESCENT_ITEM_IDS[index]] = rating;
  });
  return answers;
}

/** Ratings in scoring order, or null while any item is unanswered. */
export function completeRatings(answers: Record<string, number>): number[] | null {
  const positional = toPositional(answers);
  return positional.every((rating) => rating > 0) ? positional : null;
}

/** Where a stored draft resumes. A complete draft goes to the North Star step. */
export function resumePoint(draft: DescentDraft): { stage: DescentStage; index: number; positional: number[] } {
  const positional = toPositional(draft.answers);
  if (positional.every((rating) => rating > 0)) return { stage: 'future-self', index: DESCENT_LAST_INDEX, positional };
  const firstOpen = positional.findIndex((rating) => rating === 0);
  const cursorIndex = DESCENT_ITEM_IDS.indexOf(draft.cursor.itemId);
  if (draft.cursor.stage === 'break' && (DESCENT_BREAK_INDEXES as readonly number[]).includes(cursorIndex) && positional[cursorIndex] > 0) {
    return { stage: 'break', index: cursorIndex, positional };
  }
  const index = cursorIndex >= 0 && cursorIndex <= DESCENT_LAST_INDEX ? cursorIndex : firstOpen;
  return { stage: 'item', index, positional };
}

/** Explicit migration input: a V1 draft carries no IDs, so its positions are mapped onto the current schedule. */
export function draftFromLegacy(positional: readonly number[], savedAt: string): DescentDraft {
  const answers = fromPositional(positional);
  const firstOpen = positional.findIndex((rating) => rating < 1);
  const itemIndex = firstOpen < 0 ? DESCENT_LAST_INDEX : firstOpen;
  return {
    schema: DESCENT_DRAFT_SCHEMA,
    answers,
    cursor: { itemId: DESCENT_ITEM_IDS[itemIndex], stage: firstOpen < 0 ? 'future-self' : 'item' },
    savedAt,
  };
}

function isLegacyPositional(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === DESCENT_ITEM_COUNT
    && value.every((rating) => Number.isInteger(rating) && rating >= 0 && rating <= 5);
}

function parseJson(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return undefined; }
}

export function readDescentDraft(storage: Storage = localStorage): DraftRead {
  let raw: string | null;
  let legacyRaw: string | null = null;
  try {
    raw = storage.getItem(DESCENT_DRAFT_KEY);
    if (raw === null) legacyRaw = storage.getItem(LEGACY_DESCENT_DRAFT_KEY);
  } catch {
    return { status: 'rejected', reason: 'unavailable' };
  }
  if (raw !== null) {
    const parsed = parseJson(raw);
    if (isDescentDraft(parsed)) return { status: 'draft', draft: parsed };
    return { status: 'rejected', reason: isObject(parsed) && parsed.schema !== DESCENT_DRAFT_SCHEMA ? 'unsupported' : 'corrupt' };
  }
  if (legacyRaw === null) return { status: 'none' };
  const legacy = parseJson(legacyRaw);
  const answers = isObject(legacy) ? legacy.answers : undefined;
  if (!isLegacyPositional(answers)) return { status: 'rejected', reason: 'unsupported' };
  if (answers.every((rating) => rating === 0)) return { status: 'none' };
  return { status: 'legacy', answers };
}

export function saveFailure(error: unknown): SaveFailure {
  const name = error && typeof error === 'object' && 'name' in error ? String((error as { name: unknown }).name) : '';
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') return 'quota';
  if (name === 'SecurityError') return 'blocked';
  return 'unavailable';
}

/**
 * Writes the current-format draft and reads it back. An unreadable draft found
 * in the slot is copied aside first, so an overwrite never silently discards it.
 */
export function writeDescentDraft(draft: DescentDraft, storage: Storage = localStorage): SaveResult {
  const raw = JSON.stringify(draft);
  try {
    const existing = storage.getItem(DESCENT_DRAFT_KEY);
    if (existing !== null && !isDescentDraft(parseJson(existing))) {
      storage.setItem(`${UNREADABLE_DESCENT_DRAFT_PREFIX}${Date.now()}`, existing);
    }
    storage.setItem(DESCENT_DRAFT_KEY, raw);
    return storage.getItem(DESCENT_DRAFT_KEY) === raw
      ? { ok: true, savedAt: draft.savedAt }
      : { ok: false, reason: 'verify-failed' };
  } catch (error) {
    return { ok: false, reason: saveFailure(error) };
  }
}

/** Removes the current-format draft after a completed result, and verifies the removal. */
export function removeDescentDraft(storage: Storage = localStorage): boolean {
  try {
    storage.removeItem(DESCENT_DRAFT_KEY);
    return storage.getItem(DESCENT_DRAFT_KEY) === null;
  } catch {
    return false;
  }
}

/**
 * Removes the historical V1 draft and verifies the removal. Called after the
 * user explicitly rejects it, or after a migrated V2 draft has been verified.
 */
export function discardLegacyDescentDraft(storage: Storage = localStorage): boolean {
  try {
    storage.removeItem(LEGACY_DESCENT_DRAFT_KEY);
    return storage.getItem(LEGACY_DESCENT_DRAFT_KEY) === null;
  } catch {
    return false;
  }
}
