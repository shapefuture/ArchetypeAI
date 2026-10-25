import { describe, expect, it } from 'vitest';
import { computeSynastry } from './synastry';

describe('сравнение (legacy) Russian sentences', () => {
  const sentences = (a: number, b: number) =>
    computeSynastry(Array(64).fill(a), Array(64).fill(b), 'ru').dimensionalResonance.map((d) => d.descriptionRu);

  it('no sentence pairs «Ваша» with a masculine adjective or «Вы оба» with a singular one', () => {
    for (const text of [...sentences(3, 3), ...sentences(1, 5), ...sentences(5, 1)]) {
      expect(text).not.toMatch(/Ваша (фокус|инициативность|эмоциональность|близость)/);
      expect(text).not.toMatch(/Вы оба (сбалансированный|прагматичный|эмпатичный|сдержанный|выразительный)\b/);
      expect(text).not.toMatch(/ в (фокус|инициативность|эмоциональность|близость)/);
    }
  });

  it('describes the same dimension the same way for both people, using the shared label', () => {
    const text = sentences(3, 3)[2];
    expect(text).toContain('«фокус внимания»');
  });
});
