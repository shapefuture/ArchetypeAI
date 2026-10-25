import { describe, expect, it } from 'vitest';
import { computeSynastry } from '../../shared/core/data/synastry';

// AGENCY centre = (sum of items 6..11 - sum of items 0..5) / 24.
const block = (sum: number) => {
  const base = Math.floor(sum / 6);
  const extra = sum - base * 6;
  return Array.from({ length: 6 }, (_, i) => (i < extra ? base + 1 : base));
};
const agencyCentre = (sumA: number, sumB: number) => [...block(sumA), ...block(sumB), ...Array(52).fill(3)];

describe('critic r13: complementary synastry sentence with two balanced partners', () => {
  it('a complementary AGENCY pair does not say both people are balanced and then that they complement each other', () => {
    const p1 = agencyCentre(18, 22); // centre +4/24 = +0.167 (balanced)
    const p2 = agencyCentre(22, 18); // centre -4/24 = -0.167 (balanced)
    const row = computeSynastry(p1, p2, 'en').dimensionalResonance.find((d) => d.dimension === 'AGENCY')!;
    console.log('ROW', JSON.stringify(row));
    expect(row.pattern).toBe('complementary');
    expect(row.descriptionEn).not.toMatch(/Person 1 is balanced, Person 2 is balanced/);
  });
});
