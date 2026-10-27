// Round 29 probe (critic), pure: a Russian legacy 64-item report must not contain English prose. generateArchetypes(responses, 'ru')
// picks each text field from the Russian pool of the archetype's cluster and falls back to the English pool when a Russian
// pool is missing (shared/core/data/scoring.ts getPool). Every text field must therefore carry Cyrillic. Control: the English
// run of the same responses is English, and the Russian run has Cyrillic names.
import { describe, expect, it } from 'vitest';
import { generateArchetypes } from '../../shared/core/data/scoring';

const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
const TEXT_FIELDS = ['description', 'wound', 'shadow', 'invitation', 'coreBelief', 'attracts'] as const;

/** Deterministic 64-answer vectors (1..5) from a linear congruential generator. */
function vectors(count: number): number[][] {
  let seed = 20261026;
  const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed; };
  return Array.from({ length: count }, () => Array.from({ length: 64 }, () => 1 + (next() % 5)));
}

describe('round29: the Russian legacy report is written in Russian', () => {
  const samples = vectors(60);

  it('control: the English run of the same answers is English and the Russian run has Cyrillic names', () => {
    const en = generateArchetypes(samples[0], 'en');
    const ru = generateArchetypes(samples[0], 'ru');
    expect(en.archetypes[0].description).not.toMatch(CYRILLIC);
    expect(ru.archetypes[0].name).toMatch(CYRILLIC);
  });

  it('every archetype text field of a Russian report carries Russian text, not an English fallback', () => {
    const leaks: string[] = [];
    samples.forEach((responses, sample) => {
      for (const archetype of generateArchetypes(responses, 'ru').archetypes) {
        for (const field of TEXT_FIELDS) {
          const value = String(archetype[field]);
          if (!CYRILLIC.test(value)) leaks.push(`sample ${sample} ${archetype.cluster} ${field}: ${value.slice(0, 90)}`);
        }
      }
    });
    expect(leaks.slice(0, 20), `English text in a Russian report (${leaks.length} fields)`).toEqual([]);
  });
});
