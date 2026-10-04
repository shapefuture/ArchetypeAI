import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { endOfSlot, freeSlots, parseHM, slotEnd, slotsForDate } from './booking';

describe('React booking wall-clock boundaries', () => {
  it('skips nonexistent DST slots and does not duplicate the repeated autumn wall time', () => {
    const module = pathToFileURL(resolve('src/parts-cartographer/core/booking.ts')).href;
    const script = `import { freeSlots } from ${JSON.stringify(module)};
      const windows = [{ days: [7], start: '01:00', end: '04:00', minutes: 30 }];
      console.log(JSON.stringify({ spring: freeSlots(windows, [], '2026-03-08', new Date('2026-01-01')),
        autumn: freeSlots(windows, [], '2026-11-01', new Date('2026-01-01')) }));`;
    // A separate process makes the IANA timezone effective even under Vitest worker threads.
    const actual = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
      env: { ...process.env, TZ: 'America/New_York' }, encoding: 'utf8',
    }));
    expect(actual.spring).not.toContain('2026-03-08T02:00');
    expect(actual.spring).not.toContain('2026-03-08T02:30');
    expect(actual.spring).toContain('2026-03-08T03:00');
    expect(actual.autumn.filter((slot: string) => slot === '2026-11-01T01:30')).toHaveLength(1);
  });
  it('rolls a midnight slot into the next calendar day', () => {
    const windows = [{ days: [1], start: '23:00', end: '24:00', minutes: 60 }];
    expect(slotsForDate(windows, '2026-08-17')).toEqual(['2026-08-17T23:00']);
    expect(endOfSlot('2026-08-17T23:00', windows)).toBe('2026-08-18T00:00');
    expect(slotEnd('2026-12-31T23:30', 60)).toBe('2027-01-01T00:30');
    expect(parseHM('24:01')).toBe(-1);
  });
  it('deduplicates overlapping windows and chooses the matching window duration', () => {
    const windows = [
      { days: [1], start: '09:00', end: '10:00', minutes: 60 },
      { days: [1], start: '12:00', end: '13:00', minutes: 30 },
      { days: [1], start: '12:00', end: '13:00', minutes: 30 },
    ];
    expect(slotsForDate(windows, '2026-08-17')).toEqual(['2026-08-17T09:00', '2026-08-17T12:00', '2026-08-17T12:30']);
    expect(endOfSlot('2026-08-17T12:30', windows)).toBe('2026-08-17T13:00');
    expect(freeSlots(windows, [{ start: '2026-08-17T12:30', end: '2026-08-17T13:00', status: 'approved' }], '2026-08-17', new Date('2026-01-01'))).not.toContain('2026-08-17T12:30');
  });
});
