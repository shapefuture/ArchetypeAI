// core/assessment-routes.ts — route contract for the assessment entries.
// Pure data and predicates: no storage, no UI. Screens read these keys and labels
// instead of redefining them, so the 64 and 147 instruments cannot drift together.

/** Storage keys per route. The 64-item and 147-item routes never share a key. */
export const ROUTE_KEYS = {
  reflection64: {
    responses: 'ARCHETYPE_ASSESSMENT_RESPONSES',
    index: 'ARCHETYPE_ASSESSMENT_INDEX',
    result: 'ifs.legacy64.result',
  },
  battery147: {
    draft: 'INNERVERSE_DESCENT_V1',
    futureSelf: 'INNERVERSE_FUTURE_SELF_V1',
    rawInput: 'INNERVERSE_PROFILE_V1',
  },
  quickMap: {
    draft: 'ifs.assessment.draft',
  },
} as const;

export type RouteId = 'situation-inquiry' | 'reflection-64' | 'battery-147' | 'quick-map-sample' | 'quick-scan-teaser';

export type RouteDestination = { kind: 'state'; state: string } | { kind: 'overlay'; overlay: string };

export interface AssessmentRoute {
  id: RouteId;
  /** Primary entries are offered side by side; secondary tools are labelled as limited. */
  tier: 'primary' | 'secondary';
  /** Only the 64-item and 147-item instruments are canonical scored routes. */
  canonical: boolean;
  /** Whether this build has a destination for the route. */
  available: boolean;
  /** Scored item count for item instruments; null for non-item routes. */
  itemCount: number | null;
  /** What a completed route can write. */
  produces: 'canonical-147' | 'canonical-64' | 'sample' | 'teaser' | 'none';
  destination: RouteDestination | null;
  /** i18n keys for ordinary-language copy. */
  copy: { title: string; tag: string; purpose: string; effort: string };
  /** i18n key explaining why an unavailable route cannot be opened. */
  unavailableNote?: string;
}

export const ASSESSMENT_ROUTES: readonly AssessmentRoute[] = [
  {
    id: 'situation-inquiry', tier: 'primary', canonical: false, available: false, itemCount: null, produces: 'none', destination: null,
    copy: { title: 'routeInquiryTitle', tag: 'routeInquiryTag', purpose: 'routeInquiryPurpose', effort: 'routeInquiryEffort' },
    unavailableNote: 'routeInquiryUnavailable',
  },
  {
    id: 'reflection-64', tier: 'primary', canonical: true, available: true, itemCount: 64, produces: 'canonical-64',
    destination: { kind: 'state', state: 'legacy-assessment' },
    copy: { title: 'route64Title', tag: 'routeCanonicalTag', purpose: 'route64Purpose', effort: 'route64Effort' },
  },
  {
    id: 'battery-147', tier: 'primary', canonical: true, available: true, itemCount: 147, produces: 'canonical-147',
    destination: { kind: 'state', state: 'full-assessment' },
    copy: { title: 'startTest', tag: 'routeCanonicalTag', purpose: 'route147Purpose', effort: 'route147Effort' },
  },
  {
    id: 'quick-map-sample', tier: 'secondary', canonical: false, available: true, itemCount: null, produces: 'sample',
    destination: { kind: 'state', state: 'assessment' },
    copy: { title: 'quickAssessment', tag: 'routeSampleTag', purpose: 'sampleMapPurpose', effort: 'sampleMapEffort' },
  },
  {
    id: 'quick-scan-teaser', tier: 'secondary', canonical: false, available: true, itemCount: 14, produces: 'teaser',
    destination: { kind: 'overlay', overlay: 'quickscan' },
    copy: { title: 'quickscan', tag: 'routeTeaserTag', purpose: 'quickScanPurpose', effort: 'quickScanEffort' },
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
