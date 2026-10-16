// Boundaries for qualified facilitated practice and reviewed contributions (ArchetypeAI-28h.6.4). Pure.
// The app never issues a clinical credential, never ranks authenticity publicly, and never applies pressure to
// recruit. A facilitator profile that asks for any of these is refused.

export const APP_ISSUES_CLINICAL_CREDENTIAL = false;
export const PUBLIC_AUTHENTICITY_RANKING = false;
export const RECRUITMENT_PRESSURE = false;

export interface FacilitatorProfile { name: string; statement: string; qualificationProvidedBy: 'facilitator' | 'app'; }

export function validateFacilitatorProfile(profile: FacilitatorProfile & Record<string, unknown>): { ok: true } | { ok: false; reason: 'app-credential' | 'ranking-field' | 'pressure-field' } {
  if (profile.qualificationProvidedBy !== 'facilitator') return { ok: false, reason: 'app-credential' };
  if ('rank' in profile || 'authenticityScore' in profile) return { ok: false, reason: 'ranking-field' };
  if ('deadline' in profile || 'recruitTarget' in profile) return { ok: false, reason: 'pressure-field' };
  return { ok: true };
}
