import { describe, expect, it } from 'vitest';
import {
  auditAppointmentRecords,
  buildAppointmentTime,
  classifyAppointmentRecord,
  confirmLegacyNaiveRecord,
  formatInstantInZone,
  isValidIanaZone,
  parseAppointmentTimeV2,
  resolveWallClock,
} from './appointment-time.ts';

// 2026 New York transitions: spring forward 2026-03-08 02:00 (02:30 never exists),
// fall back 2026-11-01 02:00 (01:30 happens twice).
const NY = 'America/New_York';
const SLOT = { kind: 'availability-slot' } as const;

describe('DST policy', () => {
  it('reports a nonexistent spring-forward wall time and never normalizes it', () => {
    expect(resolveWallClock('2026-03-08T02:30', NY)).toEqual({ ok: true, kind: 'nonexistent' });
    expect(buildAppointmentTime({ wallStart: '2026-03-08T02:30', durationMinutes: 50, timeZone: NY, source: SLOT }))
      .toEqual({ ok: false, reason: 'nonexistent-local-time' });
  });

  it('refuses a repeated fall-back wall time until the person picks an instant', () => {
    expect(buildAppointmentTime({ wallStart: '2026-11-01T01:30', durationMinutes: 50, timeZone: NY, source: SLOT }))
      .toEqual({ ok: false, reason: 'repeated-local-time-needs-choice' });
  });

  it('builds the earlier and later instants for a repeated wall time, each naming the other', () => {
    const earlier = buildAppointmentTime({ wallStart: '2026-11-01T01:30', durationMinutes: 50, timeZone: NY, fold: 'earlier', source: SLOT });
    const later = buildAppointmentTime({ wallStart: '2026-11-01T01:30', durationMinutes: 50, timeZone: NY, fold: 'later', source: SLOT });
    expect(earlier.ok && earlier.time.startUtc).toBe('2026-11-01T05:30:00.000Z');
    expect(earlier.ok && earlier.time.repeatedWallTime).toEqual({ choice: 'earlier', otherUtc: '2026-11-01T06:30:00.000Z' });
    expect(later.ok && later.time.startUtc).toBe('2026-11-01T06:30:00.000Z');
    expect(later.ok && later.time.repeatedWallTime).toEqual({ choice: 'later', otherUtc: '2026-11-01T05:30:00.000Z' });
  });

  it('keeps the session length absolute when it crosses a DST change', () => {
    // 2026-03-08 02:00 springs forward, so 01:30 EST plus two absolute hours ends at 04:30 EDT.
    const built = buildAppointmentTime({ wallStart: '2026-03-08T01:30', durationMinutes: 120, timeZone: NY, source: SLOT });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(Date.parse(built.time.endUtc) - Date.parse(built.time.startUtc)).toBe(120 * 60_000);
    // Two absolute hours from 01:30 EST end at 04:30 EDT, not at 03:30 wall time.
    expect(formatInstantInZone(built.time.endUtc, NY)).toBe('2026-03-08T04:30');
  });
});

describe('input validation', () => {
  it('rejects unknown zones, impossible dates and out-of-range durations', () => {
    expect(isValidIanaZone('Not/AZone')).toBe(false);
    expect(buildAppointmentTime({ wallStart: '2026-06-15T10:00', durationMinutes: 50, timeZone: 'Not/AZone', source: SLOT }))
      .toEqual({ ok: false, reason: 'invalid-zone' });
    expect(buildAppointmentTime({ wallStart: '2026-02-30T10:00', durationMinutes: 50, timeZone: NY, source: SLOT }))
      .toEqual({ ok: false, reason: 'invalid-wall-clock' });
    expect(buildAppointmentTime({ wallStart: '2026-06-15T10:00', durationMinutes: 4, timeZone: NY, source: SLOT }))
      .toEqual({ ok: false, reason: 'invalid-duration' });
    expect(buildAppointmentTime({ wallStart: '2026-06-15T10:00', durationMinutes: 481, timeZone: NY, source: SLOT }))
      .toEqual({ ok: false, reason: 'invalid-duration' });
  });

  it('round-trips a built v2 time through the strict parser unchanged', () => {
    const built = buildAppointmentTime({ wallStart: '2026-06-15T10:00', durationMinutes: 50, timeZone: 'Europe/Berlin', source: SLOT });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.time.startUtc).toBe('2026-06-15T08:00:00.000Z');
    expect(parseAppointmentTimeV2(JSON.parse(JSON.stringify(built.time)))).toEqual(built.time);
  });

  it('rejects a v2 record whose repeated-time claim does not match its wall time', () => {
    const built = buildAppointmentTime({ wallStart: '2026-11-01T01:30', durationMinutes: 50, timeZone: NY, fold: 'earlier', source: SLOT });
    if (!built.ok) throw new Error('setup failed');
    const tampered = { ...built.time, repeatedWallTime: { choice: 'earlier', otherUtc: '2026-11-01T05:00:00.000Z' } };
    expect(parseAppointmentTimeV2(tampered)).toBeNull();
  });
});

describe('legacy records', () => {
  it('classifies a schema-less naive record as needing confirmation, with no instant guessed', () => {
    expect(classifyAppointmentRecord({ start: '2026-06-15T10:00', end: '2026-06-15T10:50' }))
      .toEqual({ kind: 'legacy-naive', start: '2026-06-15T10:00', end: '2026-06-15T10:50', requiresConfirmation: true, instant: null });
  });

  it('never reinterprets a malformed schemaVersion 2 record as legacy', () => {
    expect(classifyAppointmentRecord({ schemaVersion: 2, start: '2026-06-15T10:00', end: '2026-06-15T10:50' }))
      .toEqual({ kind: 'invalid', reason: 'invalid-record' });
  });

  it('rejects an unknown schema version instead of guessing its shape', () => {
    expect(classifyAppointmentRecord({ schemaVersion: 3, start: '2026-06-15T10:00', end: '2026-06-15T10:50' }))
      .toEqual({ kind: 'invalid', reason: 'unknown-schema-version' });
  });

  it('converts a legacy record only with an explicit zone, preserving the original wall values', () => {
    const confirmed = confirmLegacyNaiveRecord(
      { start: '2026-06-15T10:00', end: '2026-06-15T10:50' },
      { timeZone: 'Europe/Berlin', confirmedBy: 'therapist', confirmedAt: '2026-06-10T09:00:00.000Z' },
    );
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(confirmed.time.startUtc).toBe('2026-06-15T08:00:00.000Z');
    expect(confirmed.time.durationMinutes).toBe(50);
    expect(confirmed.time.source).toEqual({
      kind: 'legacy-confirmed',
      originalStart: '2026-06-15T10:00',
      originalEnd: '2026-06-15T10:50',
      confirmedBy: 'therapist',
      confirmedAt: '2026-06-10T09:00:00.000Z',
    });
  });

  it('refuses to confirm a legacy time that repeats until the person picks an instant', () => {
    expect(confirmLegacyNaiveRecord(
      { start: '2026-11-01T01:30', end: '2026-11-01T02:20' },
      { timeZone: NY, confirmedBy: 'client', confirmedAt: '2026-10-20T09:00:00.000Z' },
    )).toEqual({ ok: false, reason: 'repeated-local-time-needs-choice' });
  });

  it('audits a mixed set read-only, counting each class without writing', () => {
    const records = [
      { id: 'a', data: buildAppointmentTime({ wallStart: '2026-06-15T10:00', durationMinutes: 50, timeZone: NY, source: SLOT }) },
      { id: 'b', data: { start: '2026-06-15T10:00', end: '2026-06-15T10:50' } },
      { id: 'c', data: { schemaVersion: 2, startUtc: 'garbled' } },
    ].map((row) => ({ id: row.id, data: 'time' in row.data ? row.data.time : row.data }));
    const report = auditAppointmentRecords(records);
    expect(report.total).toBe(3);
    expect(report.v2).toBe(1);
    expect(report.legacyNaive).toEqual([{ id: 'b', start: '2026-06-15T10:00', end: '2026-06-15T10:50' }]);
    expect(report.invalid).toEqual([{ id: 'c', reason: 'invalid-record' }]);
  });
});
