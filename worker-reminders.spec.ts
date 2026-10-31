import { describe, expect, it } from 'vitest';
import {
  decideDue,
  instantOf,
  isValidTimeZone,
  localDateKey,
  nextDueAfter,
  parseReminderSchedule,
  pushMessageFor,
  wallClock,
  type ReminderSchedule,
} from './worker-reminders';

const base: ReminderSchedule = {
  timeZone: 'Europe/Moscow',
  lang: 'ru',
  daily: { enabled: true, hour: 20, minute: 30 },
  weekly: { enabled: false, weekday: 0, hour: 19, minute: 0 },
  monthly: { enabled: false, day: 1, hour: 10, minute: 0 },
  quietHours: { startHour: 22, endHour: 8 },
  skipDate: null,
  pausedUntil: null,
  lastCheckInDay: null,
  lastSentDay: null,
  nextDueAt: 0,
};

const schedule = (overrides: Partial<ReminderSchedule> = {}): ReminderSchedule => ({ ...base, ...overrides });
const moscow = (year: number, month: number, day: number, hour: number, minute: number) =>
  instantOf('Europe/Moscow', year, month, day, hour, minute);
const MINUTE = 60_000;

describe('wall-clock conversion', () => {
  it('converts Moscow wall time to UTC', () => {
    expect(instantOf('Europe/Moscow', 2026, 10, 29, 20, 30)).toBe(Date.UTC(2026, 9, 29, 17, 30));
  });

  it('follows the New York DST change in both directions', () => {
    // DST starts on 8 March 2026 at 02:00 local.
    expect(instantOf('America/New_York', 2026, 3, 8, 9, 0)).toBe(Date.UTC(2026, 2, 8, 13, 0));
    expect(instantOf('America/New_York', 2026, 3, 8, 1, 30)).toBe(Date.UTC(2026, 2, 8, 6, 30));
    // DST ends on 1 November 2026.
    expect(instantOf('America/New_York', 2026, 11, 1, 9, 0)).toBe(Date.UTC(2026, 10, 1, 14, 0));
  });

  it('handles zones with a half-hour offset', () => {
    expect(instantOf('Asia/Kolkata', 2026, 10, 29, 8, 0)).toBe(Date.UTC(2026, 9, 29, 2, 30));
  });

  it('reads the local date and weekday', () => {
    expect(localDateKey(Date.UTC(2026, 9, 29, 22, 30), 'Europe/Moscow')).toBe('2026-10-30');
    expect(wallClock(Date.UTC(2026, 10, 1, 12, 0), 'Europe/Moscow').weekday).toBe(0);
  });

  it('recognises valid and invalid zones', () => {
    expect(isValidTimeZone('Europe/Moscow')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });
});

describe('next push', () => {
  it('sends the daily push at 20:30 local, on the next day once today has passed', () => {
    expect(nextDueAfter(base, moscow(2026, 10, 29, 21, 0))).toEqual({
      at: moscow(2026, 10, 30, 20, 30),
      date: '2026-10-30',
      cadence: 'daily',
    });
  });

  it('lets the weekly push replace the daily one on its day', () => {
    const weekly = schedule({ weekly: { enabled: true, weekday: 0, hour: 19, minute: 0 } });
    const sunday = nextDueAfter(weekly, moscow(2026, 10, 31, 21, 0));
    expect(sunday).toEqual({ at: moscow(2026, 11, 1, 19, 0), date: '2026-11-01', cadence: 'weekly' });
    // Once the weekly push has gone, Monday's daily push is next.
    const afterSunday = schedule({ ...weekly, lastSentDay: '2026-11-01' });
    expect(nextDueAfter(afterSunday, sunday!.at)?.date).toBe('2026-11-02');
  });

  it('lets the monthly push replace the weekly one on the first', () => {
    // 1 November 2026 is a Sunday and the first of the month.
    const both = schedule({
      weekly: { enabled: true, weekday: 0, hour: 19, minute: 0 },
      monthly: { enabled: true, day: 1, hour: 10, minute: 0 },
    });
    expect(nextDueAfter(both, moscow(2026, 10, 31, 21, 0))).toEqual({
      at: moscow(2026, 11, 1, 10, 0),
      date: '2026-11-01',
      cadence: 'monthly',
    });
  });

  it('has nothing due when no cadence is enabled', () => {
    expect(nextDueAfter(schedule({ daily: { enabled: false, hour: 20, minute: 30 } }), moscow(2026, 10, 29, 21, 0))).toBeNull();
  });

  it('never picks a time inside quiet hours', () => {
    expect(nextDueAfter(schedule({ daily: { enabled: true, hour: 23, minute: 0 } }), moscow(2026, 10, 29, 21, 0))).toBeNull();
  });

  it('skips the day the person skipped', () => {
    const skipped = schedule({ skipDate: '2026-10-30' });
    expect(nextDueAfter(skipped, moscow(2026, 10, 29, 21, 0))?.date).toBe('2026-10-31');
  });

  it('holds pushes until a pause ends', () => {
    const paused = schedule({ pausedUntil: moscow(2026, 11, 5, 0, 0) });
    expect(nextDueAfter(paused, moscow(2026, 10, 29, 21, 0))).toEqual({
      at: moscow(2026, 11, 5, 20, 30),
      date: '2026-11-05',
      cadence: 'daily',
    });
  });

  it('cancels that day after a check-in', () => {
    const checkedIn = schedule({ lastCheckInDay: '2026-10-29' });
    expect(nextDueAfter(checkedIn, moscow(2026, 10, 29, 12, 0))?.date).toBe('2026-10-30');
  });
});

describe('when a due push goes out', () => {
  const dueAt = moscow(2026, 10, 29, 20, 30);

  it('sends inside the catch-up window', () => {
    expect(decideDue(base, dueAt, dueAt + 10 * MINUTE)).toEqual({ action: 'send', cadence: 'daily', date: '2026-10-29' });
  });

  it('drops a push that is more than two hours late', () => {
    expect(decideDue(base, dueAt, dueAt + 120 * MINUTE + MINUTE)).toEqual({ action: 'reschedule' });
  });

  it('holds a push that is due in quiet hours at send time', () => {
    const late = schedule({ daily: { enabled: true, hour: 21, minute: 30 } });
    expect(decideDue(late, moscow(2026, 10, 29, 21, 30), moscow(2026, 10, 29, 22, 10))).toEqual({ action: 'reschedule' });
  });

  it('does not send twice on one day', () => {
    expect(decideDue(schedule({ lastSentDay: '2026-10-29' }), dueAt, dueAt + 10 * MINUTE)).toEqual({ action: 'reschedule' });
  });

  it('does not send after a skip or a check-in that day', () => {
    expect(decideDue(schedule({ skipDate: '2026-10-29' }), dueAt, dueAt + 10 * MINUTE)).toEqual({ action: 'reschedule' });
    expect(decideDue(schedule({ lastCheckInDay: '2026-10-29' }), dueAt, dueAt + 10 * MINUTE)).toEqual({ action: 'reschedule' });
  });

  it('recomputes when the time was changed after it was set', () => {
    const moved = schedule({ daily: { enabled: true, hour: 21, minute: 0 } });
    expect(decideDue(moved, dueAt, dueAt + 10 * MINUTE)).toEqual({ action: 'reschedule' });
  });

  it('never sends before the due time', () => {
    expect(decideDue(base, dueAt, dueAt - MINUTE)).toEqual({ action: 'reschedule' });
  });
});

describe('lock-screen text', () => {
  const PART_OR_FEELING = /часть|чувств|тест|part|feel|test|шапокляк|завхоз|официант|кролик|знайк|ёжик|тигра|залипашка|карлсон|чебурашка|заяц|сова|богатыр|обнимашк|незнайк/i;

  it('names no part, feeling or test in any cadence or language', () => {
    for (const lang of ['ru', 'en'] as const) {
      for (const cadence of ['daily', 'weekly', 'monthly'] as const) {
        expect(pushMessageFor(cadence, lang).body).not.toMatch(PART_OR_FEELING);
      }
    }
  });

  it('opens one screen per cadence', () => {
    expect(pushMessageFor('daily', 'ru')).toEqual({
      title: 'Innerverse',
      body: 'Луна на связи. Минутка про сегодня?',
      link: 'https://innerverseai.web.app/#checkin',
    });
    expect(pushMessageFor('weekly', 'ru').link).toBe('https://innerverseai.web.app/#weekly');
    expect(pushMessageFor('monthly', 'en').link).toBe('https://innerverseai.web.app/#monthly');
  });
});

describe('parseReminderSchedule', () => {
  const fields = {
    timeZone: 'Europe/Moscow',
    lang: 'ru',
    daily: { enabled: true, hour: 20, minute: 30 },
    weekly: { enabled: false, weekday: 0, hour: 19, minute: 0 },
    monthly: { enabled: false, day: 1, hour: 10, minute: 0 },
    quietHours: { startHour: 22, endHour: 8 },
    skipDate: null,
    pausedUntil: null,
    lastCheckInDay: null,
    lastSentDay: null,
    nextDueAt: 0,
  };

  it('reads a complete document', () => {
    expect(parseReminderSchedule(fields)).toEqual(base);
  });

  it('accepts no quiet hours when they are switched off', () => {
    expect(parseReminderSchedule({ ...fields, quietHours: null })?.quietHours).toBeNull();
  });

  it('rejects an unknown time zone', () => {
    expect(parseReminderSchedule({ ...fields, timeZone: 'Mars/Olympus' })).toBeNull();
  });

  it('rejects a missing field instead of filling in a default', () => {
    const { skipDate: _omitted, ...missing } = fields;
    expect(parseReminderSchedule(missing)).toBeNull();
  });

  it('rejects an hour out of range and a malformed date', () => {
    expect(parseReminderSchedule({ ...fields, daily: { enabled: true, hour: 25, minute: 30 } })).toBeNull();
    expect(parseReminderSchedule({ ...fields, skipDate: '2026/10/29' })).toBeNull();
  });
});
