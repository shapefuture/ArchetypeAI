// Reminder gate for the due-task reminder (ArchetypeAI-28h.3.5). Pure.
// Builds on return-loop.ts. Nothing is shown unless the person opted in, a device channel is confirmed, today is
// not skipped, and the hour is outside quiet hours. Each refusal names its reason in plain words.
import { inQuietHours, skip, type Channel, type Reminder } from './return-loop';

export const REMINDERS_KEY = 'INNERVERSE_REMINDERS_V1';

/** Reminder state as stored. `skipDate` is the local day ('YYYY-MM-DD') of a skip; `move` is a move the person chose. */
export interface ReminderSettings extends Reminder {
  skipDate: string | null;
  move: string | null;
}

export type ReminderReason =
  | 'ok'
  | 'not-opted-in'
  | 'no-channel'
  | 'device-not-confirmed'
  | 'skipped-today'
  | 'quiet-hours'
  | 'invalid-time';

export interface ReminderDecision { send: boolean; channel: Channel | null; reason: ReminderReason; }

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar day, so a skip covers the person's own day rather than UTC. */
export function localDateKey(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function defaultReminderSettings(): ReminderSettings {
  return { optIn: false, channel: null, deviceConfirmed: false, quietHours: null, skipped: 0, skipDate: null, move: null };
}

function isHour(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 23;
}

/** Validates a stored value. Anything malformed falls back to the default, which is not opted in. */
export function readReminderSettings(raw: unknown): ReminderSettings {
  const base = defaultReminderSettings();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const value = raw as Record<string, unknown>;
  const channel: Channel | null = value.channel === 'in-app' || value.channel === 'device' ? value.channel : null;
  const quiet = value.quietHours && typeof value.quietHours === 'object' ? (value.quietHours as Record<string, unknown>) : null;
  const quietHours = quiet && isHour(quiet.startHour) && isHour(quiet.endHour)
    ? { startHour: quiet.startHour, endHour: quiet.endHour }
    : null;
  const skipped = Number.isInteger(value.skipped) && (value.skipped as number) >= 0 ? (value.skipped as number) : 0;
  const skipDate = typeof value.skipDate === 'string' && DATE_KEY.test(value.skipDate) ? value.skipDate : null;
  const move = typeof value.move === 'string' && value.move.trim() ? value.move.trim() : null;
  return {
    optIn: value.optIn === true && channel !== null,
    channel,
    deviceConfirmed: value.deviceConfirmed === true,
    quietHours,
    skipped,
    skipDate,
    move,
  };
}

/** Whether the existing due-task reminder may fire now. Every condition is checked, and the first failing one is the reason. */
export function reminderDecision(settings: ReminderSettings | null | undefined, now: Date): ReminderDecision {
  const current = settings ?? defaultReminderSettings();
  if (Number.isNaN(now.getTime())) return { send: false, channel: current.channel, reason: 'invalid-time' };
  if (!current.optIn) return { send: false, channel: current.channel, reason: 'not-opted-in' };
  if (current.channel === null) return { send: false, channel: null, reason: 'no-channel' };
  if (current.channel === 'device' && !current.deviceConfirmed) return { send: false, channel: 'device', reason: 'device-not-confirmed' };
  if (current.skipDate === localDateKey(now)) return { send: false, channel: current.channel, reason: 'skipped-today' };
  if (inQuietHours(current.quietHours, now.getHours())) return { send: false, channel: current.channel, reason: 'quiet-hours' };
  return { send: true, channel: current.channel, reason: 'ok' };
}

/** Skipping today counts the skip and pauses reminders for this local day only. It never switches them off. */
export function skipToday(settings: ReminderSettings, now: Date): ReminderSettings {
  return { ...settings, ...skip(settings), skipDate: localDateKey(now) };
}

/** Clears today's skip. The skip count is kept, because it is a record of what happened. */
export function resumeToday(settings: ReminderSettings): ReminderSettings {
  return { ...settings, skipDate: null };
}
