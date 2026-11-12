import { describe, expect, it } from 'vitest';
import { CATALOG_EXERCISE_IDS } from './practice-catalog';
import { EXERCISE_COPY } from '../../shared/i18n/strings';
import { GAP_COPY, NEED_COPY, NEED_PRACTICE } from '../../shared/core/data/assessment2/content';
import { NEEDS } from '../../shared/core/data/assessment2/taxonomy';

describe('need to practice map (build-and-fix plan B1)', () => {
  it('maps every need to an id in the practice catalog', () => {
    for (const need of NEEDS) expect(CATALOG_EXERCISE_IDS).toContain(NEED_PRACTICE[need]);
  });

  it('has exactly one entry per need', () => {
    expect(Object.keys(NEED_PRACTICE).sort()).toEqual([...NEEDS].sort());
  });

  it('keeps the drafted pairs', () => {
    expect(NEED_PRACTICE).toEqual({
      safety: 'build-safe-place',
      connection: 'self-compassion-break',
      attunement: 'what-was-it-like',
      worth: 'noticing-reframe',
      agency: 'possible-selves',
      aliveness: 'body-scan-3min',
    });
  });

  it('has a catalog title in both languages for every mapped id', () => {
    for (const id of Object.values(NEED_PRACTICE)) {
      expect(EXERCISE_COPY[id].en.title).toBeTruthy();
      expect(EXERCISE_COPY[id].ru.title).toBeTruthy();
    }
  });
});

describe('gap copy (build-and-fix plan B1)', () => {
  it('keeps the English wording, with the need in the placeholder', () => {
    expect(GAP_COPY.en).toBe('Nothing comes to mind for {need} yet. Notice that. It is not a score.');
  });

  it('fills the need name in both languages', () => {
    for (const need of NEEDS) {
      for (const lang of ['en', 'ru'] as const) {
        const line = GAP_COPY[lang].replace('{need}', NEED_COPY[need][lang]);
        expect(line).not.toContain('{need}');
        expect(line).toContain(NEED_COPY[need][lang]);
      }
    }
  });

  it('never uses «ты» in Russian', () => {
    // \b is ASCII-only in JavaScript, so the check uses Unicode letter lookarounds instead.
    expect(GAP_COPY.ru).not.toMatch(/(?<!\p{L})ты(?!\p{L})/iu);
  });
});
