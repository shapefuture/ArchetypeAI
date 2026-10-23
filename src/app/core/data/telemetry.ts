/**
 * INNERVERSE — Telemetry (REVAMP §4 step 10).
 *
 * Anonymized item-response distributions for future norm updates (§1.3 says
 * provisional norms are replaced after ~5k users). Records ONLY per-item
 * Likert counts — no user ids, no free text, no somatic zones, no timestamps
 * beyond a coarse week bucket. Stored locally; exportTelemetry() yields the
 * exact payload a future endpoint would receive. Nothing leaves the device
 * without explicit user action.
 */
import type { AssessmentInput } from '../../../shared/core/data/scoring-v2';
import { SHADOW_PARTS, RESOURCES, SELF_QUALITIES, type ShadowPartId, type ResourceId } from '../../../shared/core/data/parts';

const STORE_KEY = 'INNERVERSE_TELEMETRY_V1';

/** key → counts per Likert 1..5 (index 0 unused for direct indexing). */
export type Distributions = Record<string, [number, number, number, number, number, number]>;

const itemKey = (prefix: string, id: string, q: number) => `${prefix}.${id}.q${q}`;

/** Fold one completed assessment into per-item distributions. */
export function recordResponses(input: AssessmentInput, into: Distributions = {}): Distributions {
  const bump = (key: string, v: number) => {
    const row = (into[key] ??= [0, 0, 0, 0, 0, 0]);
    row[v] += 1;
  };
  for (const p of SHADOW_PARTS) {
    input.shadow[p].forEach((v, i) => bump(itemKey('items', p, i + 1), v));
  }
  for (const r of RESOURCES) {
    input.resources[r].forEach((v, i) => bump(itemKey('resources', r, i + 1), v));
  }
  input.self.forEach((v, i) => bump(itemKey('self', SELF_QUALITIES[i], i + 1), v));
  // validity items carry the same signal (attention is intentionally excluded:
  // its distribution measures instruction-following, not the construct)
  bump('validity.attention', input.validity.attention);
  return into;
}

/** n completed assessments represented in a distribution set. */
export function totalResponses(d: Distributions): number {
  const first = Object.values(d)[0];
  return first ? first.reduce((s, n) => s + n, 0) : 0;
}

export function storeTelemetry(d: Distributions): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch { /* unavailable */ }
}

export function loadTelemetry(): Distributions {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as Distributions; }
  catch { return {}; }
}

export function recordAndStore(input: AssessmentInput): Distributions {
  const merged = recordResponses(input, loadTelemetry());
  storeTelemetry(merged);
  return merged;
}

/** The payload for norm research — item keys + counts only, zero PII. */
export function exportTelemetry(d: Distributions): string {
  const out: Record<string, number[]> = {};
  for (const [k, counts] of Object.entries(d)) out[k] = counts.slice(1);
  return JSON.stringify({ schema: 1, kind: 'innerverse-item-distributions', items: out });
}

// --- Cloud sink (§4 step 10, issue 8m4): Firestore `telemetryResponses` ---
// One anonymous doc per completion: item keys + counts only. No uid, no dates
// beyond the server timestamp, no free text. The endpoint decision (h8c's
// sibling) is thereby the existing Firebase project.

export type TelemetryWriter = (payload: string) => Promise<void>;

export function cloudWriter(): TelemetryWriter {
  // Lazy import shape kept sync-friendly: firebase already bundled app-side.
  return async (payload: string) => {
    const { collection, addDoc, getFirestore } = await import('firebase/firestore');
    const { getFirestoreDb } = await import('../../../environments/firebase-init');
    void getFirestore; // use the shared long-lived instance
    await addDoc(collection(getFirestoreDb(), 'telemetryResponses'), {
      payload, at: new Date().toISOString(),
    });
  };
}

export async function syncTelemetry(d: Distributions, write: TelemetryWriter = cloudWriter()): Promise<boolean> {
  try {
    await write(exportTelemetry(d));
    return true;
  } catch { return false; } // offline / rules pending: local copy remains intact
}

/** Convenience for tests/consumers: raw per-part totals. */
export function partResponseTotals(
  d: Distributions, part: ShadowPartId | ResourceId,
): number {
  return Object.entries(d)
    .filter(([k]) => k.startsWith(`items.${part}.`) || k.startsWith(`resources.${part}.`))
    .reduce((s, [, counts]) => s + counts.reduce((x, n) => x + n, 0), 0);
}
