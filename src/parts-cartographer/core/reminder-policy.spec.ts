import { describe, expect, it } from 'vitest';
import { canRemind, type Reminder } from './return-loop.ts';
import {
  defaultReminderSettings,
  localDateKey,
  readReminderSettings,
  reminderDecision,
  resumeToday,
  skipToday,
  type ReminderSettings,
} from './reminder-policy.ts';

const noon = new Date(2026, 9, 16, 12, 0, 0);
const lateNight = new Date(2026, 9, 16, 23, 30, 0);

const inApp: ReminderSettings = {
  ...defaultReminderSettings(),
  optIn: true,
  channel: 'in-app',
  quietHours: { startHour: 22, endHour: 7 },
};

describe('reminder decision', () => {
  it('shows nothing without an explicit opt-in', () => {
    expect(reminderDecision({ ...inApp, optIn: false }, noon)).toEqual({ send: false, channel: 'in-app', reason: 'not-opted-in' });
  });

  it('shows nothing when no channel is chosen', () => {
    expect(reminderDecision({ ...inApp, channel: null }, noon)).toEqual({ send: false, channel: null, reason: 'no-channel' });
  });

  it('never sends a device reminder until the device channel is confirmed', () => {
    const unconfirmed = reminderDecision({ ...inApp, channel: 'device', deviceConfirmed: false }, noon);
    expect(unconfirmed).toEqual({ send: false, channel: 'device', reason: 'device-not-confirmed' });
    expect(reminderDecision({ ...inApp, channel: 'device', deviceConfirmed: true }, noon)).toEqual({ send: true, channel: 'device', reason: 'ok' });
  });

  it('respects quiet hours across midnight', () => {
    expect(reminderDecision(inApp, lateNight)).toEqual({ send: false, channel: 'in-app', reason: 'quiet-hours' });
    expect(reminderDecision(inApp, noon)).toEqual({ send: true, channel: 'in-app', reason: 'ok' });
  });

  it('pauses for the local day that was skipped, and no longer after it', () => {
    const skipped = { ...inApp, skipDate: localDateKey(noon) };
    expect(reminderDecision(skipped, noon)).toEqual({ send: false, channel: 'in-app', reason: 'skipped-today' });
    expect(reminderDecision(skipped, new Date(2026, 9, 17, 12, 0, 0))).toEqual({ send: true, channel: 'in-app', reason: 'ok' });
  });

  it('refuses an invalid time instead of guessing an hour', () => {
    expect(reminderDecision(inApp, new Date('not a date')).reason).toBe('invalid-time');
  });

  it('treats missing settings as not opted in', () => {
    expect(reminderDecision(null, noon)).toEqual({ send: false, channel: null, reason: 'not-opted-in' });
  });

  it('agrees with canRemind whenever no skip is set', () => {
    const base: Reminder = { ...inApp };
    for (const hour of [0, 6, 7, 12, 21, 22, 23]) {
      const at = new Date(2026, 9, 16, hour, 0, 0);
      expect(reminderDecision(inApp, at).send).toBe(canRemind(base, hour));
    }
  });
});

describe('reading stored reminder settings', () => {
  it('falls back to not opted in for corrupt or foreign values', () => {
    for (const raw of [null, undefined, 'yes', 42, [], { optIn: 'true', channel: 'sms' }]) {
      const settings = readReminderSettings(raw);
      expect(settings.optIn).toBe(false);
      expect(settings.channel).toBeNull();
      expect(reminderDecision(settings, noon).send).toBe(false);
    }
  });

  it('will not turn reminders on from a stored opt-in without a channel', () => {
    expect(readReminderSettings({ optIn: true, channel: null }).optIn).toBe(false);
  });

  it('drops malformed quiet hours and bad skip dates', () => {
    const settings = readReminderSettings({ optIn: true, channel: 'in-app', quietHours: { startHour: 25, endHour: 7 }, skipDate: 'today' });
    expect(settings.quietHours).toBeNull();
    expect(settings.skipDate).toBeNull();
  });

  it('keeps valid values as they were stored', () => {
    const settings = readReminderSettings({ optIn: true, channel: 'device', deviceConfirmed: true, quietHours: { startHour: 22, endHour: 7 }, skipped: 2, skipDate: '2026-10-16', move: '  Call a friend ' });
    expect(settings).toEqual({ optIn: true, channel: 'device', deviceConfirmed: true, quietHours: { startHour: 22, endHour: 7 }, skipped: 2, skipDate: '2026-10-16', move: 'Call a friend' });
  });
});

describe('skip for today', () => {
  it('counts the skip, pauses for that day, and keeps reminders on', () => {
    const after = skipToday(inApp, noon);
    expect(after.skipped).toBe(1);
    expect(after.optIn).toBe(true);
    expect(after.channel).toBe('in-app');
    expect(after.skipDate).toBe(localDateKey(noon));
  });

  it('resumes the same day without removing the skip count', () => {
    const resumed = resumeToday(skipToday(inApp, noon));
    expect(resumed.skipDate).toBeNull();
    expect(resumed.skipped).toBe(1);
    expect(reminderDecision(resumed, noon).send).toBe(true);
  });
});
