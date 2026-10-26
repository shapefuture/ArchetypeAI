// Round 26 probe (critic). A profile the app saves carries `clinical: scoreProfile(answers)` (clinical-profile-adapter.ts), and
// backup.ts restores a stored profile only when validProfile(profile) holds, which for angular-v2 requires
// validClinicalScore(profile.clinical). A score the app itself produces from valid answers must pass that validator, or
// the profile is skipped on restore.
import { describe, expect, it } from 'vitest';
import { scoreProfile, type AssessmentInput } from '../../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS, SELF_QUALITIES } from '../../shared/core/data/parts';
import { validClinicalScore, validProfile } from './profile-contract';

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomAnswers(next: () => number, fixed?: number): AssessmentInput {
  const likert = () => (fixed ?? (1 + Math.floor(next() * 5)));
  const shadow = Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array.from({ length: 8 }, likert)])) as AssessmentInput['shadow'];
  const resources = Object.fromEntries(RESOURCES.map((id) => [id, Array.from({ length: 6 }, likert)])) as AssessmentInput['resources'];
  return {
    shadow,
    resources,
    self: Array.from({ length: SELF_QUALITIES.length }, likert),
    validity: { attention: 3, infrequency: [1, 1] },
  };
}

describe('round26: a scored profile passes the validator that restores it from a backup', () => {
  it('control: the validator accepts a profile for mid-scale answers', () => {
    expect(validClinicalScore(scoreProfile(randomAnswers(rng(1), 3)))).toBe(true);
  });

  it('every profile scored from valid Likert answers passes validClinicalScore (3000 random answer sets)', () => {
    const next = rng(20261026);
    const failures: Array<{ index: number; keys: string[] }> = [];
    for (let index = 0; index < 3000; index += 1) {
      const score = scoreProfile(randomAnswers(next)) as unknown as Record<string, any>;
      if (!validClinicalScore(score)) {
        failures.push({ index, keys: Object.keys(score).filter((key) => key !== 'parts' && key !== 'resources') });
        if (failures.length >= 5) break;
      }
    }
    expect(failures, 'scored profiles the restore validator rejects').toEqual([]);
  });

  it('every saved angular-v2 profile wrapper passes validProfile (boundary answers: all 1s, all 5s)', () => {
    for (const value of [1, 5]) {
      const score = scoreProfile(randomAnswers(rng(7), value)) as unknown as Record<string, unknown>;
      const wrapper = { testModel: 'angular-v2', clinical: score, headlineConstellation: 'x', parts: [], selfEnergyRadar: {}, needHunger: {}, polarizations: [], copingStack: [], complexes: [] };
      expect(validProfile(wrapper), `answers all ${value}`).toBe(true);
    }
  });
});
