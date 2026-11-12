// core/assessment-routes.ts — route contract for the assessment entries.
// Pure data and predicates: no storage, no UI. Screens read these keys and labels
// instead of redefining them, so the 64 and 147 instruments cannot drift together.

import { DESCENT_DRAFT_KEY, LEGACY_DESCENT_DRAFT_KEY } from './assessment-draft';

/** Storage keys per route. The 64-item and 147-item routes never share a key. */
export const ROUTE_KEYS = {
  reflection64: {
    responses: 'ARCHETYPE_ASSESSMENT_RESPONSES',
    index: 'ARCHETYPE_ASSESSMENT_INDEX',
    result: 'ifs.legacy64.result',
  },
  battery147: {
    /** The current ID-keyed draft. */
    draft: DESCENT_DRAFT_KEY,
    /** The historical positional draft, read only for explicit migration. */
    legacyDraft: LEGACY_DESCENT_DRAFT_KEY,
    futureSelf: 'INNERVERSE_FUTURE_SELF_V1',
    rawInput: 'INNERVERSE_PROFILE_V1',
  },
  quickMap: {
    draft: 'ifs.assessment.draft',
  },
  /** Assessment 2.0, the default route. Its result never shares a key with the 64 or 147 routes. */
  parts2: {
    draft: 'ifs.parts2.draft',
    result: 'ifs.parts2.result',
  },
} as const;

export type RouteId = 'parts-two' | 'situation-inquiry' | 'reflection-64' | 'battery-147' | 'quick-map-sample';

/** `focus` names an element the destination moves focus to on arrival. */
export type RouteDestination = { kind: 'state'; state: string; focus?: string } | { kind: 'overlay'; overlay: string; focus?: string };

export interface AssessmentRoute {
  id: RouteId;
  /** Primary entries are offered side by side; secondary tools are labelled as limited. */
  tier: 'primary' | 'secondary';
  /** A full record type the app keeps (Assessment 2.0, the 64-item and the 147-item routes). It need not be a measurement; see `measured`. */
  canonical: boolean;
  /** A measured record: only the 64-item and 147-item instruments. Assessment 2.0 is kept but is not measured. */
  measured: boolean;
  /** Whether this build has a destination for the route. */
  available: boolean;
  /** Scored item count for item instruments; null for non-item routes. */
  itemCount: number | null;
  /** What a completed route can write. */
  produces: 'canonical-parts-2' | 'canonical-147' | 'canonical-64' | 'sample' | 'none';
  destination: RouteDestination | null;
  /** i18n keys for ordinary-language copy. */
  copy: { title: string; tag: string; purpose: string; effort: string };
  /** i18n key explaining why an unavailable route cannot be opened. */
  unavailableNote?: string;
}

export const ASSESSMENT_ROUTES: readonly AssessmentRoute[] = [
  {
    // The default route (Assessment 2.0, docs/plans/assessment-2/plan.md): stages 0 to 6, about nine minutes.
    id: 'parts-two', tier: 'primary', canonical: true, measured: false, available: true, itemCount: null, produces: 'canonical-parts-2',
    destination: { kind: 'state', state: 'parts-two' },
    copy: { title: 'routeTwoTitle', tag: 'routeDefaultTag', purpose: 'routeTwoPurpose', effort: 'routeTwoEffort' },
  },
  {
    // A complete route of its own (docs/80-20-plan.md §9.2, bounded situation inquiry): it opens the
    // inquiry in the check-in layer, writes no score and never funnels into the 64 or 147 items.
    id: 'situation-inquiry', tier: 'primary', canonical: false, measured: false, available: true, itemCount: null, produces: 'none',
    destination: { kind: 'overlay', overlay: 'checkin', focus: 'situation-inquiry' },
    copy: { title: 'routeInquiryTitle', tag: 'routeInquiryTag', purpose: 'routeInquiryPurpose', effort: 'routeInquiryEffort' },
  },
  {
    id: 'reflection-64', tier: 'primary', canonical: true, measured: true, available: true, itemCount: 64, produces: 'canonical-64',
    destination: { kind: 'state', state: 'legacy-assessment' },
    copy: { title: 'route64Title', tag: 'routeCanonicalTag', purpose: 'route64Purpose', effort: 'route64Effort' },
  },
  {
    id: 'battery-147', tier: 'primary', canonical: true, measured: true, available: true, itemCount: 147, produces: 'canonical-147',
    destination: { kind: 'state', state: 'full-assessment' },
    copy: { title: 'startTest', tag: 'routeDeepTag', purpose: 'route147Purpose', effort: 'route147Effort' },
  },
  {
    id: 'quick-map-sample', tier: 'secondary', canonical: false, measured: false, available: true, itemCount: null, produces: 'sample',
    destination: { kind: 'state', state: 'assessment' },
    copy: { title: 'quickAssessment', tag: 'routeSampleTag', purpose: 'sampleMapPurpose', effort: 'sampleMapEffort' },
  },
];

export const primaryRoutes = (): AssessmentRoute[] => ASSESSMENT_ROUTES.filter((route) => route.tier === 'primary');
export const secondaryRoutes = (): AssessmentRoute[] => ASSESSMENT_ROUTES.filter((route) => route.tier === 'secondary');

const isRecord = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);

/** A canonical 147-item profile: the only profile shape the battery writes. */
export function isCanonicalProfile(value: unknown): boolean {
  return isRecord(value) && value.testModel === 'angular-v2' && isRecord(value.clinical);
}

/**
 * Sample profiles come from the eight-part route. They carry `sample: true` when written by this build.
 * Older copies have no marker, but the eight-part scorer is the only writer of a non-canonical v2 profile.
 */
export function isSampleProfile(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.sample === true) return true;
  return value.version === 'v2' && value.testModel !== 'angular-v2' && !value.clinical;
}

/** Label a sample result so it can never be read as a measured profile. */
export function markSample<T extends object>(profile: T): T & { sample: true; route: 'quick-map-sample' } {
  return { ...profile, sample: true, route: 'quick-map-sample' };
}

/**
 * A sample never replaces a canonical map. It is kept in history only, and the user is told so.
 */
export function sampleSavePlan(currentProfile: unknown): 'replace-current' | 'archive-only' {
  return isCanonicalProfile(currentProfile) ? 'archive-only' : 'replace-current';
}

/** Built-in example cast (SEED_PARTS, ids `seed-*`). It is not the user's own part. */
export function isExamplePart(part: unknown): boolean {
  return isRecord(part) && String(part.id ?? '').startsWith('seed-');
}
