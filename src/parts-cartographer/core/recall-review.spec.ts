import { describe, expect, it } from 'vitest';
import { REVIEW_RESULTS, activeProbes, applyAdjustment, MAX_INTERVAL_DAYS, nextInterval, scoreFor, type BoundaryProbe } from './recall-review.ts';

const item = { id: 'r1', intervalDays: 4 };

describe('recall-first review', () => {
  it('never shortens the schedule, whatever the result', () => {
    for (const result of REVIEW_RESULTS) {
      expect(nextInterval(item, result)).toBeGreaterThanOrEqual(item.intervalDays);
    }
  });

  it('keeps the same interval after a missed recall, with no punishment', () => {
    expect(nextInterval(item, 'could-not-recall')).toBe(4);
    expect(nextInterval(item, 'skipped')).toBe(4);
    expect(nextInterval(item, 'cue-helped')).toBe(4);
  });

  it('grows the interval after a recall, within the bounds', () => {
    expect(nextInterval(item, 'recalled')).toBe(8);
    expect(nextInterval({ id: 'r2', intervalDays: MAX_INTERVAL_DAYS }, 'recalled')).toBe(MAX_INTERVAL_DAYS);
  });

  it('scores no result, so a memory gap is never recorded as absence', () => {
    for (const result of REVIEW_RESULTS) {
      expect(scoreFor(result)).toBeNull();
    }
  });

  it('shows only the boundary probes the person has switched on', () => {
    const probes: BoundaryProbe[] = [
      { id: 'p1', text: 'Was it a different room?', userSelected: true },
      { id: 'p2', text: 'Was it a different day?', userSelected: false },
    ];
    expect(activeProbes(probes).map((probe) => probe.id)).toEqual(['p1']);
    expect(activeProbes([])).toEqual([]);
  });

  it('applies an external adjustment only after the person confirms it', () => {
    expect(applyAdjustment(item, { kind: 'set-interval-days', days: 10 }, false)).toEqual({ item, applied: false });
    expect(applyAdjustment(item, { kind: 'set-interval-days', days: 10 }, true)).toEqual({ item: { id: 'r1', intervalDays: 10 }, applied: true });
    expect(applyAdjustment(item, { kind: 'set-interval-days', days: 0 }, true).item.intervalDays).toBe(1);
  });
});
