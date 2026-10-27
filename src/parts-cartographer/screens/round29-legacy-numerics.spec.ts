// Round 29 probe (critic), pure: the 64-item legacy report must hold finite numbers for every answer pattern the screen can
// produce (every answer 1..5, a single answer changed, alternating extremes). A NaN or Infinity in the report is drawn as
// "NaN%" or moves a bar to the edge. The walker reports every non-finite number with its path.
import { describe, expect, it } from 'vitest';
import { buildLegacyReportData } from './legacy-report-data';

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

const uniform = (answer: number) => Array.from({ length: 64 }, () => answer);
const alternating = (low: number, high: number) => Array.from({ length: 64 }, (_, i) => (i % 2 ? high : low));
const halves = (first: number, second: number) => Array.from({ length: 64 }, (_, i) => (i < 32 ? first : second));

describe('round29: the legacy 64-item report is finite at every boundary answer pattern', () => {
  const cases: Array<[string, number[]]> = [
    ['all 1', uniform(1)],
    ['all 5', uniform(5)],
    ['all 3', uniform(3)],
    ['alternating 1 and 5', alternating(1, 5)],
    ['first half 1, second half 5', halves(1, 5)],
    ['first half 5, second half 1', halves(5, 1)],
    ['one answer 5, rest 1', Array.from({ length: 64 }, (_, i) => (i === 0 ? 5 : 1))],
    ['one answer 1, rest 5', Array.from({ length: 64 }, (_, i) => (i === 63 ? 1 : 5))],
  ];

  for (const [label, responses] of cases) {
    for (const language of ['en', 'ru'] as const) {
      it(`buildLegacyReportData stays finite for ${label} (${language})`, () => {
        const report = buildLegacyReportData(responses, language, '2026-10-26T10:00:00.000Z');
        expect(nonFinite(report), 'non-finite numbers in the report').toEqual([]);
      });
    }
  }
});
