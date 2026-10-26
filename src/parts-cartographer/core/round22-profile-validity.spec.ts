// Round 22 probe (critic): every result the app can produce from a complete 147-item assessment must pass the same
// validators that a backup restore applies. If one does not, the export written by the app is refused or drops the profile
// on restore (backup.ts validEntry -> validProfile -> validClinicalScore; validMapParts for the parts).
import { describe, expect, it } from 'vitest';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter.ts';
import { validClinicalScore, validProfile } from './profile-contract';
import { validMapParts, isCanonicalAssessmentInput } from './backup';

const ITEMS = 147;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function patterns(): Array<{ name: string; answers: number[] }> {
  const out: Array<{ name: string; answers: number[] }> = [];
  for (const v of [1, 2, 3, 4, 5]) out.push({ name: `constant ${v}`, answers: Array(ITEMS).fill(v) });
  out.push({ name: 'alternating 1/5', answers: Array.from({ length: ITEMS }, (_, i) => (i % 2 ? 5 : 1)) });
  out.push({ name: 'ramp 1..5', answers: Array.from({ length: ITEMS }, (_, i) => (i % 5) + 1) });
  const random = rng(20261026);
  for (let n = 0; n < 40; n += 1) out.push({ name: `random ${n}`, answers: Array.from({ length: ITEMS }, () => 1 + Math.floor(random() * 5)) });
  return out;
}

describe('round22: every app-produced assessment result passes its own backup validators', () => {
  it('control: the scorer accepts 147 answers and returns a finite self energy', () => {
    const scored = scoreProfile(toAssessmentInput(Array(ITEMS).fill(3)));
    expect(Number.isFinite(scored.selfEnergy)).toBe(true);
  });

  for (const sample of patterns()) {
    it(`the stored profile and parts of "${sample.name}" pass the restore validators`, () => {
      const scored = scoreProfile(toAssessmentInput(sample.answers));
      expect(validClinicalScore(scored), 'validClinicalScore(scored)').toBe(true);
      const adapted = adaptClinicalProfile(scored, 'en');
      expect(validProfile({ ...adapted.profile, testModel: 'angular-v2' }), 'validProfile(profile)').toBe(true);
      expect(validMapParts(adapted.parts), 'validMapParts(parts)').toBe(true);
    });
  }

  it('the raw 147-item assessment input passes the canonical input check used by backup restore', () => {
    const input = toAssessmentInput(Array(ITEMS).fill(5));
    expect(isCanonicalAssessmentInput(input)).toBe(true);
  });
});
