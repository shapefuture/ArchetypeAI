// core/parts-two-store.ts — the last saved Assessment 2.0 result (build-and-fix B9; plan §6; G23, G27).
// Stored as { savedAt, result } under ROUTE_KEYS.parts2.result. A read validates the stored value and recomputes
// the derived conflicts (plan §6, "recomputed on read"), and never writes. A save is claimed only after its own
// read-back matches.

import { deriveConflicts, isAssessment2Result, type Assessment2Result, type Conflict } from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from './assessment-routes';
import { store } from './local-store';

/** What is written: the result and the time it was saved (ISO text). */
export interface SavedLastResult { savedAt: string; result: Assessment2Result }

/** What is read. `savedAt` is null for a bare result saved before the envelope existed. */
export interface LastResult {
  savedAt: string | null;
  result: Assessment2Result;
  /**
   * True when a protector has no `classKnown` field. A result saved before the timing fix (plan D1) has none, so its
   * timing may be a default (G27). A result from the timing fix always carries the field, even when timing was skipped.
   */
  predatesTimingFix: boolean;
}

const isRecord = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Validates one stored value and returns the result with its conflicts derived. The reader and the backup validator
 * both use this, so a backup keeps exactly what the reader would show. Returns null for anything else.
 */
export function parseLastResult(value: unknown): LastResult | null {
  // The bare result is the shape saved before the envelope existed. It has no save time.
  if (isAssessment2Result(value)) return withDerivedConflicts(value, null);
  if (!isRecord(value)) return null;
  const { savedAt, result } = value;
  return typeof savedAt === 'string' && Number.isFinite(Date.parse(savedAt)) && isAssessment2Result(result)
    ? withDerivedConflicts(result, savedAt) : null;
}

/** Reads the last saved result. Never writes: invalid data gives null and stays as it is in storage. */
export function readLastResult(): LastResult | null {
  return parseLastResult(store.load<unknown>(ROUTE_KEYS.parts2.result, null));
}

/**
 * Saves the result, then reads it back. Returns true only when the read-back gives the same result. A save that does
 * not read back is undone, so an earlier saved result is not replaced by one that will not load. A refused write
 * stores nothing and returns false.
 */
export function saveLastResult(result: Assessment2Result, now: Date = new Date()): boolean {
  const key = ROUTE_KEYS.parts2.result;
  try {
    const previous = store.load<unknown>(key, null);
    const saved: SavedLastResult = { savedAt: now.toISOString(), result };
    if (!store.save(key, saved)) return false;
    const back = readLastResult();
    if (back !== null && JSON.stringify(back.result) === JSON.stringify(result)) return true;
    // Put the earlier value back. With no earlier value this writes null, which reads as no result.
    store.save(key, previous);
    return false;
  } catch {
    return false;
  }
}

function withDerivedConflicts(stored: Assessment2Result, savedAt: string | null): LastResult | null {
  let conflicts: Conflict[];
  // isAssessment2Result checks every field the derivation reads, so a part it accepts can be derived. A failure here is still invalid data.
  try { conflicts = deriveConflicts(stored.parts); } catch { return null; }
  return {
    savedAt,
    result: { ...stored, conflicts },
    predatesTimingFix: stored.parts.some((part) => part.kind === 'protector' && part.classKnown === undefined),
  };
}
