// Recall-first review (ArchetypeAI-28h.3.3). Pure: no storage, no scoring service.
// A missed recall never shortens the schedule, never costs a score, and never reads as absence.
// Boundary probes and external adjustments happen only when the person chooses them.

export const REVIEW_RESULTS = ['recalled', 'cue-helped', 'could-not-recall', 'skipped'] as const;
export type ReviewResult = (typeof REVIEW_RESULTS)[number];

export const MIN_INTERVAL_DAYS = 1;
export const MAX_INTERVAL_DAYS = 365;

export interface ReviewItem {
  id: string;
  intervalDays: number;
}

const clampInterval = (days: number) => Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.round(days)));

/** Next interval after one review. A recall grows it; every other result keeps it. Nothing shortens it. */
export function nextInterval(item: ReviewItem, result: ReviewResult): number {
  const current = clampInterval(item.intervalDays);
  return result === 'recalled' ? clampInterval(current * 2) : current;
}

/** Memory gaps are not scored. Every result returns null, so no absence can be recorded as a score. */
export function scoreFor(_result: ReviewResult): null {
  return null;
}

export interface BoundaryProbe {
  id: string;
  text: string;
  /** Only probes the person has switched on are ever shown. */
  userSelected: boolean;
}

export function activeProbes(probes: ReadonlyArray<BoundaryProbe>): BoundaryProbe[] {
  return probes.filter((probe) => probe.userSelected);
}

export type ExternalAdjustment = { kind: 'set-interval-days'; days: number };

/**
 * Applies an external adjustment only when the person has confirmed it. Without confirmation the item
 * is returned unchanged, so no adjustment happens by default.
 */
export function applyAdjustment(item: ReviewItem, adjustment: ExternalAdjustment, userConfirmed: boolean): { item: ReviewItem; applied: boolean } {
  if (!userConfirmed) return { item, applied: false };
  return { item: { ...item, intervalDays: clampInterval(adjustment.days) }, applied: true };
}
