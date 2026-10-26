// Round 23 probe (critic): a sweep of biased complete assessments. Every result the scorer produces from valid answers must
// pass the validators that History (validClinicalScore) and backup restore (validProfile, validMapParts) apply.
import { describe, expect, it } from 'vitest';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter.ts';
import { validClinicalScore, validProfile } from './profile-contract';
import { validMapParts } from './backup';

const ITEMS = 147;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

/** Biased samples: each sample draws answers from a random subset of the scale ends, so extreme mixes are common. */
function samples(count: number): Array<{ name: string; answers: number[] }> {
  const random = rng(7230261);
  const out: Array<{ name: string; answers: number[] }> = [];
  for (let n = 0; n < count; n += 1) {
    const pool = [[1, 5], [1, 2], [4, 5], [1, 2, 3], [3, 4, 5], [1, 5, 3]][n % 6];
    const block = 1 + (n % 7);
    const answers = Array.from({ length: ITEMS }, (_, i) => (
      Math.floor(i / block) % 3 === 0 ? pool[Math.floor(random() * pool.length)] : 1 + Math.floor(random() * 5)
    ));
    out.push({ name: `biased ${n}`, answers });
  }
  return out;
}

function failures(answers: number[]): string[] {
  const scored = scoreProfile(toAssessmentInput(answers));
  const problems: string[] = [];
  if (!validClinicalScore(scored)) problems.push('validClinicalScore(scored)');
  const adapted = adaptClinicalProfile(scored, 'en');
  if (!validProfile({ ...adapted.profile, testModel: 'angular-v2' })) problems.push('validProfile(profile)');
  if (!validMapParts(adapted.parts)) problems.push('validMapParts(parts)');
  return problems;
}

describe('round23: every scored assessment in a biased sweep passes the History and restore validators', () => {
  it('control: the sweep scores a finite self energy for every sample', () => {
    for (const sample of samples(20)) {
      expect(Number.isFinite(scoreProfile(toAssessmentInput(sample.answers)).selfEnergy)).toBe(true);
    }
  });

  it('no biased assessment produces a result that the validators refuse', () => {
    const refused: string[] = [];
    for (const sample of samples(600)) {
      const problems = failures(sample.answers);
      if (problems.length) refused.push(`${sample.name}: ${problems.join(', ')}`);
    }
    expect(refused, `refused results (first 5 of ${refused.length})`).toEqual([]);
  });
});
