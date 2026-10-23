import { saveFailure, type SaveResult } from './assessment-draft';
import { ROUTE_KEYS } from './assessment-routes';

const RESPONSE_COUNT = 64;
const RESPONSE_KEY = ROUTE_KEYS.reflection64.responses;
const INDEX_KEY = ROUTE_KEYS.reflection64.index;

export function validateLegacy64Responses(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === RESPONSE_COUNT
    && value.every((answer) => Number.isInteger(answer) && answer >= 1 && answer <= 5);
}

/** Read the old assessment's local answer key without exposing it to network calls. */
export function readLocalLegacy64Responses(storage: Pick<Storage, 'getItem'> | null = globalThis.localStorage ?? null): number[] | null {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(RESPONSE_KEY) ?? 'null') as unknown;
    return validateLegacy64Responses(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Saves the in-progress 64-item answers and position, then reads both back.
 * A save counts only when the store returns exactly what was written
 * (docs/80-20-plan.md §9.2 step 6); 0 marks an unanswered item.
 */
export function writeLegacy64Draft(answers: readonly number[], index: number, storage: Storage = localStorage): SaveResult {
  const raw = JSON.stringify(answers);
  const position = String(index);
  try {
    storage.setItem(RESPONSE_KEY, raw);
    storage.setItem(INDEX_KEY, position);
    return storage.getItem(RESPONSE_KEY) === raw && storage.getItem(INDEX_KEY) === position
      ? { ok: true, savedAt: new Date().toISOString() }
      : { ok: false, reason: 'verify-failed' };
  } catch (error) {
    return { ok: false, reason: saveFailure(error) };
  }
}
