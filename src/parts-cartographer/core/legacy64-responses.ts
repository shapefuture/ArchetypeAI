const RESPONSE_COUNT = 64;

export function validateLegacy64Responses(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === RESPONSE_COUNT
    && value.every((answer) => Number.isInteger(answer) && answer >= 1 && answer <= 5);
}

/** Read the old assessment's local answer key without exposing it to network calls. */
export function readLocalLegacy64Responses(storage: Pick<Storage, 'getItem'> | null = globalThis.localStorage ?? null): number[] | null {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES') ?? 'null') as unknown;
    return validateLegacy64Responses(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
