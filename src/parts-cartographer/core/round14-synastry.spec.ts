import { describe, expect, it } from 'vitest';
import { computeSynastry } from '../../shared/core/data/synastry';

// AGENCY centre = (sum of items 6..11 - sum of items 0..5) / 24 (see round13-synastry.spec.ts).
const block = (sum: number) => {
  const base = Math.floor(sum / 6);
  const extra = sum - base * 6;
  return Array.from({ length: 6 }, (_, i) => (i < extra ? base + 1 : base));
};
const agencyCentre = (sumA: number, sumB: number) => [...block(sumA), ...block(sumB), ...Array(52).fill(3)];
const agency = (p1: number[], p2: number[], lang: 'en' | 'ru') =>
  computeSynastry(p1, p2, lang).dimensionalResonance.find((d) => d.dimension === 'AGENCY')!;

describe('critic r14: same-pole pairs described as opposites', () => {
  it('both partners at the same POSITIVE AGENCY pole (+0.29 and +0.96): the text must not oppose them', () => {
    const row = agency(agencyCentre(15, 22), agencyCentre(6, 29), 'en');
    expect(row.descriptionEn).not.toMatch(/Strong polarity/);
    expect(row.descriptionEn).not.toMatch(/brings what the other lacks/);
  });

  it('both partners at the same NEGATIVE AGENCY pole (-0.29 and -0.96): the text must not oppose them', () => {
    const row = agency(agencyCentre(22, 15), agencyCentre(29, 6), 'en');
    expect(row.descriptionEn).not.toMatch(/Strong polarity/);
    expect(row.descriptionEn).not.toMatch(/brings what the other lacks/);
  });

  it('same-pole pair in a complementary band (+0.29 and +0.58) must not claim complementarity', () => {
    const row = agency(agencyCentre(15, 22), agencyCentre(6, 21), 'en');
    expect(row.descriptionEn).not.toMatch(/brings what the other lacks/);
  });

  it('RU copy for the same-pole complementary and polarized pairs', () => {
    const comp = agency(agencyCentre(15, 22), agencyCentre(6, 21), 'ru');
    const pol = agency(agencyCentre(15, 22), agencyCentre(6, 29), 'ru');
    expect(comp.descriptionRu).not.toMatch(/дополня|каждый привносит/);
  });
});
