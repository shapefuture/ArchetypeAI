// Round 29 probe (critic), pure: the Russian clinical export of a legacy 64-item report (buildLegacyClinicalMarkdown(report, 'ru'))
// must not contain English prose. A line that carries a run of three or more English words of four or more letters and no
// Cyrillic is an English sentence. Identifiers such as the version token are single words and are not counted.
// The probe reads the export, the text the person saves and shares, not the report object (which keeps both languages).
import { describe, expect, it } from 'vitest';
import { buildLegacyClinicalMarkdown, buildLegacyReportData } from './legacy-report-data';

const CYRILLIC = /\p{Script=Cyrillic}/u;
const ENGLISH_SENTENCE = /\b[A-Za-z]{4,}\b[^\p{Script=Cyrillic}\n]*?\b[A-Za-z]{4,}\b[^\p{Script=Cyrillic}\n]*?\b[A-Za-z]{4,}\b/u;

function vector(seed: number): number[] {
  let state = seed;
  return Array.from({ length: 64 }, () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return 1 + (state % 5);
  });
}

function englishLines(markdown: string): string[] {
  return markdown.split('\n').filter((line) => !CYRILLIC.test(line) && ENGLISH_SENTENCE.test(line));
}

describe('round29: the Russian clinical export contains no English sentences', () => {
  it('control: the English export does contain English sentences', () => {
    const en = buildLegacyClinicalMarkdown(buildLegacyReportData(vector(7), 'en'), 'en');
    expect(englishLines(en).length).toBeGreaterThan(0);
  });

  it('no line of a Russian clinical export is an English sentence', () => {
    const leaks: string[] = [];
    for (let seed = 1; seed <= 25; seed += 1) {
      const markdown = buildLegacyClinicalMarkdown(buildLegacyReportData(vector(seed * 9973), 'ru'), 'ru');
      for (const line of englishLines(markdown)) leaks.push(`seed ${seed}: ${line.slice(0, 140)}`);
    }
    expect(leaks.slice(0, 20), `English sentences in a Russian export (${leaks.length} lines)`).toEqual([]);
  });
});
