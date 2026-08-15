import { describe, it, expect } from 'vitest';
import { generateLinkCode, toTherapistSummary, CONSENT_TEXT } from './therapist-link';
import { scoreProfile, type AssessmentInput } from './scoring-v2';
import { SHADOW_PARTS, RESOURCES } from './parts';
import { redAllowed } from './exercises';

const all = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return { shadow, resources, self: Array(8).fill(fill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

describe('therapist link layer (§3B.4)', () => {
  it('codes are 6 chars from the unambiguous alphabet', () => {
    let seed = 42;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 50; i++) {
      const code = generateLinkCode(rand);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('the summary projection leaks ONLY consented constructs — no raw answers, no reflections', () => {
    const s = toTherapistSummary(scoreProfile(all(4)), { done: 3, skipped: 1 });
    const raw = JSON.stringify(s);
    expect(s.headline).toBeTruthy();
    expect(s.adherence).toEqual({ done: 3, skipped: 1 });
    expect(Object.keys(s.parts).length).toBe(14);
    expect(raw).not.toMatch(/reflection|somatic|answers|items\./i);
  });

  it('consent text exists in both languages and names both sides of the boundary', () => {
    for (const lang of ['en', 'ru'] as const) {
      expect(CONSENT_TEXT[lang]).toMatch(/sees|видит/i);
      expect(CONSENT_TEXT[lang]).toMatch(/never|никогда/i);
    }
  });

  it('RED still requires the container even for therapists (§3E.3 via §3B.1)', () => {
    const p = scoreProfile(all(4));
    expect(redAllowed(p, { safePlaceBuilt: false, resourcesMobilized: true }, true)).toBe(false);
  });
});
