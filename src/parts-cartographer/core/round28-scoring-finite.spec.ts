// Round 28 probe (critic), pure: the canonical scorer and its clinical adapter must return finite numbers for every boundary
// input the backup validator accepts (every Likert answer 1..5, validity attention 1..5, infrequency 1..5), because the
// therapist summary and the share card draw these numbers directly. A NaN or Infinity anywhere in the scored profile is
// reported by the walker below with its path.
import { describe, expect, it } from 'vitest';
import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { scoreProfile, type AssessmentInput } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter';

function uniform(answer: number, length: number): number[] {
  return Array(length).fill(answer);
}

function input(pick: (index: number) => number, validity: { attention: number; infrequency: [number, number] }): AssessmentInput {
  return {
    self: Array.from({ length: 8 }, (_, i) => pick(i)),
    shadow: Object.fromEntries(SHADOW_PARTS.map((id, p) => [id, Array.from({ length: 8 }, (_, i) => pick(p * 8 + i))])),
    resources: Object.fromEntries(RESOURCES.map((id, p) => [id, Array.from({ length: 6 }, (_, i) => pick(100 + p * 6 + i))])),
    validity,
  } as AssessmentInput;
}

/** Every non-finite number reachable from the value, with its path. */
function nonFinite(value: unknown, path = 'root', out: string[] = []): string[] {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${path}=${String(value)}`);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => nonFinite(item, `${path}[${index}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) nonFinite(item, `${path}.${key}`, out);
  }
  return out;
}

describe('round28: scoring returns finite numbers at the boundaries the backup accepts', () => {
  const cases: Array<[string, AssessmentInput]> = [
    ['all 1', input(() => 1, { attention: 1, infrequency: [1, 1] })],
    ['all 5', input(() => 5, { attention: 5, infrequency: [5, 5] })],
    ['all 3, attention 3', input(() => 3, { attention: 3, infrequency: [3, 3] })],
    ['alternating 1 and 5', input((i) => (i % 2 ? 5 : 1), { attention: 1, infrequency: [5, 1] })],
    ['first item 5 rest 1', input((i) => (i === 0 ? 5 : 1), { attention: 5, infrequency: [1, 5] })],
  ];

  for (const [label, scored] of cases) {
    it(`scoreProfile and the clinical adapter stay finite for ${label}`, () => {
      const profile = scoreProfile(scored);
      expect(nonFinite(profile), 'scoreProfile output').toEqual([]);
      const adapted = adaptClinicalProfile(profile, 'en');
      expect(nonFinite(adapted), 'adaptClinicalProfile output').toEqual([]);
    });
  }

  it('control: uniform 3 answers score to finite numbers without any walker hits', () => {
    expect(nonFinite(scoreProfile(input(() => 3, { attention: 3, infrequency: [3, 3] })))).toEqual([]);
    expect(uniform(3, 2)).toEqual([3, 3]);
  });
});
