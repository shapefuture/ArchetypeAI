import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import {
  appointmentTimeFromRecord, bookableDays, bookingTimeMismatch, endOfSlot, freeSlots, normalizeAvailability,
  parseHM, slotEnd, slotOccurrences, slotTime, slotsForDate, stampWindowZones, therapistTimeZone, weekdayOf,
  type AvailabilityWindow,
  appointmentDisplayTime, nextActiveAppointmentId, therapistWallLabel, ZONE_TIME_WRITES_ENABLED,
} from './booking';
import { formatInstantInZone } from './appointment-time';

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

// ---------------------------------------------------------------------------
// Zone-aware booking. Expected instants are fixed by the 2026 IANA transitions:
// New York springs forward 2026-03-08 02:00 EST (07:00Z) and falls back
// 2026-11-01 02:00 EDT (06:00Z), so 01:30 on 2026-11-01 maps to 05:30Z and 06:30Z.
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const LONDON = 'Europe/London';
const EARLY = new Date('2026-01-01T00:00:00Z');
const hourWindow = (timeZone?: string): AvailabilityWindow => ({
  days: [7], start: '01:00', end: '04:00', minutes: 30, ...(timeZone ? { timeZone } : {}),
});

describe('zone-aware slots (IANA zones, 2026 DST)', () => {
  it('drops the skipped spring wall times and keeps the times either side', () => {
    expect(freeSlots([hourWindow(NY)], [], '2026-03-08', EARLY, { timeZone: NY })).toEqual([
      '2026-03-08T01:00', '2026-03-08T01:30', '2026-03-08T03:00', '2026-03-08T03:30',
    ]);
  });

  it('offers the repeated autumn wall time once, with an earlier and a later instant', () => {
    const slots = freeSlots([hourWindow(NY)], [], '2026-11-01', EARLY, { timeZone: NY });
    expect(slots.filter((slot) => slot === '2026-11-01T01:30')).toHaveLength(1);
    expect(slotOccurrences('2026-11-01T01:30', NY, EARLY)).toEqual([
      { fold: 'earlier', startMs: Date.parse('2026-11-01T05:30:00Z'), offered: true },
      { fold: 'later', startMs: Date.parse('2026-11-01T06:30:00Z'), offered: true },
    ]);
    expect(slotOccurrences('2026-03-08T02:30', NY, EARLY)).toEqual([]);
  });

  it('keeps a repeated time offered while its later pass is still ahead', () => {
    const betweenPasses = new Date('2026-11-01T05:45:00Z');
    expect(freeSlots([hourWindow(NY)], [], '2026-11-01', betweenPasses, { timeZone: NY })).toContain('2026-11-01T01:30');
    expect(slotOccurrences('2026-11-01T01:30', NY, betweenPasses).map((o) => o.offered)).toEqual([false, true]);
    const afterBoth = new Date('2026-11-01T06:45:00Z');
    expect(freeSlots([hourWindow(NY)], [], '2026-11-01', afterBoth, { timeZone: NY })).not.toContain('2026-11-01T01:30');
  });

  it('judges "already started" in the therapist zone, not on the device clock', () => {
    const nineAM = [{ days: [1], start: '09:00', end: '10:00', minutes: 60 }];
    const now = new Date('2026-06-15T12:30:00Z'); // 08:30 in New York, 13:30 in London
    expect(freeSlots(nineAM, [], '2026-06-15', now, { timeZone: NY })).toContain('2026-06-15T09:00');
    expect(freeSlots(nineAM, [], '2026-06-15', now, { timeZone: LONDON })).not.toContain('2026-06-15T09:00');
  });

  it('checks conflicts on wall-clock intervals in the same zone', () => {
    const nineAM = [{ days: [1], start: '09:00', end: '11:00', minutes: 60 }];
    const booked = [{ start: '2026-06-15T09:00', end: '2026-06-15T10:00', status: 'approved' }];
    expect(freeSlots(nineAM, booked, '2026-06-15', EARLY, { timeZone: NY })).toEqual(['2026-06-15T10:00']);
  });

  it('yields no slots for an invalid zone instead of falling back to the device clock', () => {
    const nineAM = [{ days: [1], start: '09:00', end: '10:00', minutes: 60 }];
    expect(freeSlots(nineAM, [], '2026-06-15', EARLY, { timeZone: '+05:00' })).toEqual([]);
  });

  it('shows the therapist wall time in the client zone', () => {
    const [occurrence] = slotOccurrences('2026-06-15T09:00', NY, EARLY);
    expect(formatInstantInZone(occurrence.startMs, LONDON)).toBe('2026-06-15T14:00');
    expect(formatInstantInZone(occurrence.startMs, NY)).toBe('2026-06-15T09:00');
  });

  it('builds the stored time from the therapist zone and refuses a skipped wall time', () => {
    const built = slotTime({ slot: '2026-03-08T03:00', availability: [hourWindow(NY)], timeZone: NY });
    expect(built.ok && built.time.startUtc).toBe('2026-03-08T07:00:00.000Z');
    expect(built.ok && built.time.endUtc).toBe('2026-03-08T07:30:00.000Z');
    const skipped = slotTime({ slot: '2026-03-08T02:00', availability: [hourWindow(NY)], timeZone: NY });
    expect(skipped).toEqual({ ok: false, reason: 'nonexistent-local-time' });
  });

  it('requires an explicit pass for a repeated time and records the other instant', () => {
    expect(slotTime({ slot: '2026-11-01T01:30', availability: [hourWindow(NY)], timeZone: NY }))
      .toEqual({ ok: false, reason: 'repeated-local-time-needs-choice' });
    const later = slotTime({ slot: '2026-11-01T01:30', availability: [hourWindow(NY)], timeZone: NY, fold: 'later' });
    expect(later.ok && later.time.startUtc).toBe('2026-11-01T06:30:00.000Z');
    expect(later.ok && later.time.repeatedWallTime).toEqual({ choice: 'later', otherUtc: '2026-11-01T05:30:00.000Z' });
  });

  it('takes bookable days from the therapist date, so late evening in New York stays on that day', () => {
    const lateSundayNewYork = new Date('2026-06-14T23:30:00Z'); // Sun 19:30 in New York, Mon 00:30 in London
    const mondays = [{ days: [1], start: '09:00', end: '10:00', minutes: 60 }];
    expect(bookableDays(mondays, lateSundayNewYork, 14, { timeZone: NY })[0]).toBe('2026-06-15');
    expect(bookableDays(mondays, lateSundayNewYork, 14, { timeZone: LONDON })[0]).toBe('2026-06-22');
  });

  it('computes weekdays from the calendar date alone', () => {
    expect(weekdayOf('2026-06-15')).toBe(1);
    expect(weekdayOf('2026-11-01')).toBe(7);
  });
});

describe('therapist availability zones', () => {
  it('reports one zone only when every window carries the same valid zone', () => {
    expect(therapistTimeZone([hourWindow(NY), { ...hourWindow(NY), days: [1] }])).toBe(NY);
    expect(therapistTimeZone([hourWindow(NY), hourWindow()])).toBeNull();
    expect(therapistTimeZone([hourWindow(NY), hourWindow(LONDON)])).toBeNull();
    expect(therapistTimeZone([hourWindow('+05:00')])).toBeNull();
    expect(therapistTimeZone([])).toBeNull();
  });

  it('stamps zone-less windows with the fallback zone and keeps an explicit zone', () => {
    const input = [hourWindow(LONDON), hourWindow()];
    const stamped = stampWindowZones(input, NY);
    expect(stamped.map((w) => w.timeZone)).toEqual([LONDON, NY]);
    expect('timeZone' in input[1]).toBe(false); // input is not mutated
  });

  it('refuses to save a window that has no zone and no fallback', () => {
    expect(() => stampWindowZones([hourWindow()], null)).toThrow(/valid IANA time zone/);
  });

  it('keeps a valid stored zone and gives an invalid or missing one the fallback zone', () => {
    const normalized = normalizeAvailability([
      { days: [1], start: '09:00', end: '17:00', minutes: 60, timeZone: 'Europe/Paris' },
      { days: [2], start: '09:00', end: '17:00', minutes: 60, timeZone: '+01:00' },
      { days: [3], start: '09:00', end: '17:00', minutes: 60 },
    ], 'America/New_York');
    expect(normalized[0].timeZone).toBe('Europe/Paris');
    expect(normalized[1].timeZone).toBe('America/New_York');
    expect(normalized[2].timeZone).toBe('America/New_York');
    expect(normalized.map((w) => w.zoneFallback)).toEqual([undefined, true, true]);
  });

  it('uses the device zone for legacy windows and the default schedule by default', () => {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(therapistTimeZone(normalizeAvailability([{ days: [3], start: '09:00', end: '17:00', minutes: 60 }]))).toBe(device);
    expect(therapistTimeZone(normalizeAvailability(undefined))).toBe(device);
  });

  it('keeps legacy windows zone-less only when the caller passes no fallback zone', () => {
    const normalized = normalizeAvailability([{ days: [3], start: '09:00', end: '17:00', minutes: 60 }], null);
    expect('timeZone' in normalized[0]).toBe(false);
    expect(therapistTimeZone(normalized)).toBeNull();
  });
});

describe('stored appointment times', () => {
  const legacy = { clientUid: 'c', therapistUid: 't', start: '2026-06-15T09:00', end: '2026-06-15T10:00', status: 'pending' };

  it('classifies a record with no time map as legacy-naive, with no instant', () => {
    const { time, timeClass } = appointmentTimeFromRecord(legacy);
    expect(time).toBeNull();
    expect(timeClass).toEqual({ kind: 'legacy-naive', start: '2026-06-15T09:00', end: '2026-06-15T10:00', requiresConfirmation: true, instant: null });
  });

  it('reads a valid nested schemaVersion-2 time', () => {
    const built = slotTime({ slot: '2026-06-15T09:00', availability: [hourWindow(NY)], timeZone: NY });
    if (!built.ok) throw new Error('setup failed');
    const { time, timeClass } = appointmentTimeFromRecord({ ...legacy, time: built.time });
    expect(timeClass.kind).toBe('v2');
    expect(time?.startUtc).toBe(built.time.startUtc);
  });

  it('never reads a malformed nested time as legacy', () => {
    const { timeClass } = appointmentTimeFromRecord({ ...legacy, time: { schemaVersion: 2, startUtc: 'not-an-instant' } });
    expect(timeClass.kind).toBe('invalid');
  });

  it('refuses a stored time that does not echo its slot', () => {
    const built = slotTime({ slot: '2026-06-15T09:00', availability: [hourWindow(NY)], timeZone: NY });
    if (!built.ok) throw new Error('setup failed');
    expect(bookingTimeMismatch(built.time, '2026-06-15T09:00')).toBeNull();
    expect(bookingTimeMismatch(built.time, '2026-06-15T10:00')).toBe('slot-mismatch');
    expect(bookingTimeMismatch({ ...built.time, durationMinutes: 90 }, '2026-06-15T09:00')).toBe('invalid-time');
  });
});

describe('appointmentDisplayTime', () => {
  const time = {
    schemaVersion: 2, startUtc: '2026-11-02T15:00:00.000Z', endUtc: '2026-11-02T16:00:00.000Z', durationMinutes: 60,
    timeZone: 'America/New_York', wallStart: '2026-11-02T10:00', repeatedWallTime: null, source: { kind: 'availability-slot' },
  } as any;

  it('shows a zone-aware booking in the viewer\'s own time', () => {
    const shown = appointmentDisplayTime({ start: '2026-11-02T10:00', time }, 'ru-RU', 'Europe/Moscow');
    expect(shown.therapistWallClock).toBe(false);
    expect(shown.text).toContain('18:00');
  });

  it('labels a legacy booking as the therapist\'s wall clock instead of passing it off as local', () => {
    const shown = appointmentDisplayTime({ start: '2026-11-02T10:00', time: null }, 'ru-RU', 'Europe/Moscow');
    expect(shown).toEqual({ text: expect.stringContaining('10:00'), therapistWallClock: true });
  });

  it('writes the zone time on new bookings', () => {
    expect(ZONE_TIME_WRITES_ENABLED).toBe(true);
  });
});

describe('nextActiveAppointmentId', () => {
  it('finds another active appointment with the same therapist, and nothing else', () => {
    const list = [
      { id: 'b', therapistUid: 't', status: 'cancelled' },
      { id: 'x', therapistUid: 'other', status: 'approved' },
      { id: 'a', therapistUid: 't', status: 'approved' },
    ] as const;
    expect(nextActiveAppointmentId(list as any, 't', 'b')).toBe('a');
    expect(nextActiveAppointmentId(list as any, 't', 'a')).toBeNull();
  });
});

describe('therapistWallLabel', () => {
  const repeated = {
    schemaVersion: 2, startUtc: '2026-10-25T00:30:00.000Z', endUtc: '2026-10-25T01:30:00.000Z', durationMinutes: 60,
    timeZone: 'Europe/London', wallStart: '2026-10-25T01:30',
    repeatedWallTime: { choice: 'later', otherUtc: '2026-10-25T00:30:00.000Z' }, source: { kind: 'availability-slot' },
  } as any;

  it('shows the therapist wall clock unshifted, with zone and repeated-hour pass', () => {
    const label = therapistWallLabel({ start: '2026-10-25T01:30', time: repeated }, 'ru');
    expect(label).toContain('01:30');
    expect(label).toContain('Europe/London');
    expect(label).toContain('второй из двух');
  });

  it('keeps a legacy wall clock as written', () => {
    expect(therapistWallLabel({ start: '2027-03-28T02:30', time: null }, 'en')).toContain('02:30');
  });
});
