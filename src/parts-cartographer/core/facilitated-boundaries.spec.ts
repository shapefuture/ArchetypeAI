import { describe, expect, it } from 'vitest';
import { APP_ISSUES_CLINICAL_CREDENTIAL, PUBLIC_AUTHENTICITY_RANKING, RECRUITMENT_PRESSURE, validateFacilitatorProfile } from './facilitated-boundaries.ts';

const profile = { name: 'Dr Lee', statement: 'Group facilitation', qualificationProvidedBy: 'facilitator' as const };

describe('facilitated practice boundaries', () => {
  it('keeps the three prohibited behaviours off', () => {
    expect(APP_ISSUES_CLINICAL_CREDENTIAL).toBe(false);
    expect(PUBLIC_AUTHENTICITY_RANKING).toBe(false);
    expect(RECRUITMENT_PRESSURE).toBe(false);
  });

  it('accepts a profile whose qualification comes from the facilitator', () => {
    expect(validateFacilitatorProfile(profile)).toEqual({ ok: true });
  });

  it('refuses an app-issued credential, a ranking field, or recruitment pressure', () => {
    expect(validateFacilitatorProfile({ ...profile, qualificationProvidedBy: 'app' as never })).toEqual({ ok: false, reason: 'app-credential' });
    expect(validateFacilitatorProfile({ ...profile, authenticityScore: 0.9 })).toEqual({ ok: false, reason: 'ranking-field' });
    expect(validateFacilitatorProfile({ ...profile, deadline: '2026-12-01' })).toEqual({ ok: false, reason: 'pressure-field' });
  });
});
