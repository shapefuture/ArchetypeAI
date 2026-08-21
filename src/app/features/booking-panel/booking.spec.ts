import { describe, it, expect } from 'vitest';
import {
  parseHM,
  weekdayOf,
  slotsForDate,
  freeSlots,
  bookableDays,
  endOfSlot,
  slotEnd,
  overlaps,
  DEFAULT_AVAILABILITY,
} from './booking';

const WEEKDAYS = DEFAULT_AVAILABILITY; // Mon–Fri 09:00–17:00, 60 min

describe('booking — parseHM', () => {
  it('parses HH:MM to minutes since midnight', () => {
    expect(parseHM('09:00')).toBe(540);
    expect(parseHM('17:30')).toBe(1050);
    expect(parseHM('00:00')).toBe(0);
  });
  it('rejects garbage', () => {
    expect(parseHM('')).toBe(-1);
    expect(parseHM('9am')).toBe(-1);
    expect(parseHM('25:00')).toBe(-1);
  });
});

describe('booking — weekdayOf / overlaps', () => {
  it('maps ISO dates to 1=Mon … 7=Sun', () => {
    expect(weekdayOf('2026-08-17')).toBe(1); // Monday
    expect(weekdayOf('2026-08-21')).toBe(5); // Friday
    expect(weekdayOf('2026-08-23')).toBe(7); // Sunday
  });
  it('detects interval overlap', () => {
    expect(overlaps('2026-08-18T09:00', '2026-08-18T10:00', '2026-08-18T09:30', '2026-08-18T10:30')).toBe(true);
    expect(overlaps('2026-08-18T09:00', '2026-08-18T10:00', '2026-08-18T10:00', '2026-08-18T11:00')).toBe(false);
  });
});

describe('booking — slotsForDate', () => {
  it('generates 60-min slots for a weekday', () => {
    const slots = slotsForDate(WEEKDAYS, '2026-08-17'); // Monday
    expect(slots.length).toBe(8); // 09:00 … 16:00
    expect(slots[0]).toBe('2026-08-17T09:00');
    expect(slots[7]).toBe('2026-08-17T16:00');
  });
  it('generates nothing on a non-working day', () => {
    expect(slotsForDate(WEEKDAYS, '2026-08-22')).toEqual([]); // Saturday
  });
  it('honours window minutes (30-min slots)', () => {
    const avail = [{ days: [1], start: '09:00', end: '10:00', minutes: 30 }];
    expect(slotsForDate(avail, '2026-08-17')).toEqual([
      '2026-08-17T09:00', '2026-08-17T09:30',
    ]);
  });
});

describe('booking — freeSlots', () => {
  const date = '2026-08-18'; // Tuesday
  it('excludes slots overlapping pending/approved bookings', () => {
    const booked = [
      { start: `${date}T10:00`, end: `${date}T11:00`, status: 'pending' },
      { start: `${date}T12:00`, end: `${date}T13:00`, status: 'approved' },
    ];
    const free = freeSlots(WEEKDAYS, booked, date, new Date('2026-01-01T00:00:00'));
    expect(free).not.toContain(`${date}T10:00`);
    expect(free).not.toContain(`${date}T12:00`);
    expect(free.length).toBe(6);
  });
  it('keeps slots blocked only by declined/cancelled appointments free', () => {
    const booked = [{ start: `${date}T10:00`, end: `${date}T11:00`, status: 'cancelled' }];
    const free = freeSlots(WEEKDAYS, booked, date, new Date('2026-01-01T00:00:00'));
    expect(free).toContain(`${date}T10:00`);
  });
  it('drops past slots relative to now', () => {
    const free = freeSlots(WEEKDAYS, [], date, new Date('2026-08-18T11:30:00'));
    expect(free[0]).toBe(`${date}T12:00`);
  });
});

describe('booking — endOfSlot / slotEnd', () => {
  it('extends a slot by the window minutes', () => {
    expect(endOfSlot('2026-08-17T09:00', WEEKDAYS)).toBe('2026-08-17T10:00');
    expect(endOfSlot('2026-08-17T09:00', [{ days: [1], start: '09:00', end: '17:00', minutes: 30 }]))
      .toBe('2026-08-17T09:30');
    expect(slotEnd('2026-08-17T09:00', 45)).toBe('2026-08-17T09:45');
  });
});

describe('booking — bookableDays', () => {
  it('returns up to 14 upcoming dates that match availability', () => {
    const from = new Date('2026-08-17T00:00:00'); // Monday
    const days = bookableDays(WEEKDAYS, from, 14);
    expect(days.length).toBe(14);
    // starts tomorrow, never includes the start day itself
    expect(days[0]).toBe('2026-08-18');
    // every returned date is a weekday
    for (const d of days) {
      expect(weekdayOf(d)).toBeGreaterThanOrEqual(1);
      expect(weekdayOf(d)).toBeLessThanOrEqual(5);
    }
  });
});
