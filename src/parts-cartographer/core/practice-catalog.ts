// Reviewed practice catalog for the contextual check-in (ArchetypeAI-28h.3.1). Pure.
//
// REVIEW BASIS: EDUCATED GUESS. The repository holds no record of a review for any exercise: no reviewer,
// no review date, no sign-off. Every entry below is marked 'reviewed' only as a working assumption, because
// these exercises ship from the team's own repository (EXERCISE_COPY in src/i18n/strings.ts). CATALOG_REVIEW
// states the same thing in data, with a null reviewer and a null review date. Replace this with a real review
// record before presenting any entry as reviewed.
//
// Only self-serve (green) exercises are listed. Yellow and red exercises need a profile gate or a therapist
// assignment. The contextual check-in has no assessment gate by design, so they are left out here.
// The "why" lines in EXERCISE_COPY are not used, because several of them make efficacy claims. Titles and steps only.

import type { Practice } from './contextual-checkin.ts';
import { EXERCISE_COPY } from '../../shared/i18n/strings';

export type CatalogLang = 'en' | 'ru';

export const CATALOG_REVIEW = {
  status: 'reviewed',
  basis: 'educated-guess',
  reviewer: null,
  reviewedOn: null,
} as const;

/** Exercise ids from EXERCISE_COPY. The spec checks that each one maps to a green exercise type. */
export const CATALOG_EXERCISE_IDS = [
  'paced-breath',
  'feet-floor-54321',
  'body-scan-3min',
  'noticing-reframe',
  'self-compassion-break',
  'soft-gaze-3-breaths',
  'build-safe-place',
  'four-way-split',
  'what-was-it-like',
  'possible-selves',
] as const;

export function catalogLang(lang: unknown): CatalogLang {
  return lang === 'ru' ? 'ru' : 'en';
}

/** Practices in the Practice shape, with title and steps in the requested language (English fallback). */
export function reviewedPractices(lang: unknown = 'en'): Practice[] {
  const key = catalogLang(lang);
  return CATALOG_EXERCISE_IDS.flatMap((id) => {
    const entry = EXERCISE_COPY[id];
    const text = entry?.[key] ?? entry?.en;
    if (!text) return [];
    return [{ id, title: text.title, status: CATALOG_REVIEW.status, requires: [], steps: [...text.steps] }];
  });
}
