// Critic 19: the §1.10 unburdening moment compares flare RATES between two 30-day windows.
// The rate is flares divided by (check-ins in the window / 7), so a window's check-in count
// stands in for its length. A person who checks in more often in the recent window gets a
// lower rate even when their flares went up.
import { describe, expect, it } from 'vitest';
import { unburdeningInWindows, type CheckIn } from './state-v2';

const at = (date: string, arousal: number, confirmedPart?: string): CheckIn =>
  ({ date, arousal, confirmedPart: confirmedPart ?? null } as CheckIn);

describe('unburdening moment compares flare counts, not check-in counts (round 19)', () => {
  it('does not report a part as unburdened when its flares rose from 4 to 5 in the last 30 days', () => {
    const now = new Date('2026-08-10T12:00:00');
    // Prior window (31-60 days back): 8 check-ins, 4 of them flares of "abandoned", self-report far from centre.
    const prior = [
      at('2026-06-12T09:00:00', 2, 'abandoned'), at('2026-06-16T09:00:00', -2),
      at('2026-06-20T09:00:00', 2, 'abandoned'), at('2026-06-24T09:00:00', -2),
      at('2026-06-28T09:00:00', 2, 'abandoned'), at('2026-07-02T09:00:00', -2),
      at('2026-07-05T09:00:00', 2, 'abandoned'), at('2026-07-08T09:00:00', -2),
    ];
    // Recent window (0-30 days back): 16 check-ins, 5 of them flares of "abandoned", self-report centred.
    const recentDays = ['07-12', '07-14', '07-15', '07-17', '07-19', '07-21', '07-22', '07-24',
      '07-26', '07-28', '07-29', '07-31', '08-02', '08-04', '08-07', '08-09'];
    const recent = recentDays.map((day, i) => at(`2026-${day}T09:00:00`, 0, i < 5 ? 'abandoned' : undefined));
    const moments = unburdeningInWindows([...prior, ...recent], now);
    // Expected: 4 flares before and 5 after is a rise, so no unburdening moment.
    expect(moments).not.toContain('abandoned');
  });
});
