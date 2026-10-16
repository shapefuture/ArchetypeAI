import { describe, expect, it } from 'vitest';
import { decideExpansion } from './replay-evaluation.ts';

describe('Replay expansion gate', () => {
  it('does not expand on playtime alone', () => {
    expect(decideExpansion({ playtimeMinutes: 5000, userBenefitReports: 0, demandRecords: 0, complexityNotes: [] })).toBe('pending');
  });

  it('expands only with reported benefit, recorded demand and a recorded trade-off', () => {
    expect(decideExpansion({ playtimeMinutes: 10, userBenefitReports: 3, demandRecords: 2, complexityNotes: ['Needs a longer setup'] })).toBe('expand');
  });

  it('does not expand when the trade-off is missing', () => {
    expect(decideExpansion({ playtimeMinutes: 10, userBenefitReports: 3, demandRecords: 2, complexityNotes: ['  '] })).toBe('no-expansion');
  });
});
