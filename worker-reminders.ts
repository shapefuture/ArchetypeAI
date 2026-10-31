// Reminder schedule for the server-side sender (plan §3.9). Pure: no network and no clock reads, so every rule can
// be tested. The app writes one document per person to `reminderSchedules/{uid}`. worker-reminder-sweep.ts reads the
// due ones and writes back `nextDueAt` and `lastSentDay`. Times are wall-clock times in the person's own time zone.

export type Cadence = 'daily' | 'weekly' | 'monthly';
export type Lang = 'ru' | 'en';

interface Rule {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface ReminderSchedule {
  timeZone: string;
  lang: Lang;
  daily: Rule;
  weekly: Rule & { weekday: number };
  monthly: Rule & { day: number };
  quietHours: { startHour: number; endHour: number } | null;
  skipDate: string | null;
  pausedUntil: number | null;
  lastCheckInDay: string | null;
  lastSentDay: string | null;
  /** When the next push is due, in epoch ms. NEVER means nothing is scheduled. */
  nextDueAt: number;
}

export interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 is Sunday. */
  weekday: number;
}

export interface Due {
  at: number;
  date: string;
  cadence: Cadence;
}

export type DueDecision =
  | { action: 'send'; cadence: Cadence; date: string }
  | { action: 'reschedule' };

export interface PushMessage {
  title: string;
  body: string;
  link: string;
}

/** A push this late is dropped and rescheduled, so an outage never releases a backlog at once. */
export const CATCH_UP_MS = 2 * 60 * 60 * 1000;
/** Parks a schedule with nothing enabled. Far in the future, so the sweep never picks it up. */
export const NEVER = Number.MAX_SAFE_INTEGER;

const DAYS_TO_SEARCH = 62;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const APP_ORIGIN = 'https://innerverseai.web.app';

// Draft copy. The owner reads it aloud before launch (plan §6). Lock-screen text names no part, feeling or test.
const COPY: Record<Lang, Record<Cadence, { body: string; screen: string }>> = {
  ru: {
    daily: { body: 'Луна на связи. Минутка про сегодня?', screen: 'checkin' },
    weekly: { body: 'Неделя в небе готова.', screen: 'weekly' },
    monthly: { body: 'Месяц позади. Как ты?', screen: 'monthly' },
  },
  en: {
    daily: { body: 'Luna here. A minute about today?', screen: 'checkin' },
    weekly: { body: 'Your week in the sky is ready.', screen: 'weekly' },
    monthly: { body: 'The month is behind us. How are you?', screen: 'monthly' },
  },
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function wallClock(instant: number, timeZone: string): WallClock {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(instant))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour % 24,
    minute: parts.minute,
    second: parts.second,
    weekday: new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(),
  };
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function localDateKey(instant: number, timeZone: string): string {
  const clock = wallClock(instant, timeZone);
  return dateKey(clock.year, clock.month, clock.day);
}

/** The zone's offset from UTC at an instant, in ms. */
function offsetMs(timeZone: string, instant: number): number {
  const clock = wallClock(instant, timeZone);
  const wallAsUtc = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second);
  return wallAsUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant of a wall-clock time in a zone. The second pass picks the right side of a DST change. */
export function instantOf(timeZone: string, year: number, month: number, day: number, hour: number, minute: number): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const first = wall - offsetMs(timeZone, wall);
  return wall - offsetMs(timeZone, first);
}

export function inQuietHours(quiet: ReminderSchedule['quietHours'], hour: number): boolean {
  if (!quiet) return false;
  return quiet.startHour <= quiet.endHour
    ? hour >= quiet.startHour && hour < quiet.endHour
    : hour >= quiet.startHour || hour < quiet.endHour;
}

/** One push per local day. Monthly beats weekly, and weekly beats daily (plan §3.9). */
export function slotForDay(
  schedule: ReminderSchedule,
  year: number,
  month: number,
  day: number,
): { cadence: Cadence; hour: number; minute: number } | null {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  if (schedule.monthly.enabled && day === schedule.monthly.day) {
    return { cadence: 'monthly', hour: schedule.monthly.hour, minute: schedule.monthly.minute };
  }
  if (schedule.weekly.enabled && weekday === schedule.weekly.weekday) {
    return { cadence: 'weekly', hour: schedule.weekly.hour, minute: schedule.weekly.minute };
  }
  if (schedule.daily.enabled) {
    return { cadence: 'daily', hour: schedule.daily.hour, minute: schedule.daily.minute };
  }
  return null;
}

/** A local day is out when it is skipped, has a check-in, or already has a push. */
function dayBlocked(schedule: ReminderSchedule, date: string): boolean {
  return schedule.skipDate === date || schedule.lastCheckInDay === date || schedule.lastSentDay === date;
}

/** A pause and quiet hours apply to the moment of sending. */
function timeBlocked(schedule: ReminderSchedule, instant: number): boolean {
  if (schedule.pausedUntil !== null && instant < schedule.pausedUntil) return true;
  return inQuietHours(schedule.quietHours, wallClock(instant, schedule.timeZone).hour);
}

/** The next push that may go out strictly after `after`, or null when none falls in the next two months. */
export function nextDueAfter(schedule: ReminderSchedule, after: number): Due | null {
  const start = wallClock(after, schedule.timeZone);
  for (let offset = 0; offset < DAYS_TO_SEARCH; offset += 1) {
    const day = new Date(Date.UTC(start.year, start.month - 1, start.day + offset));
    const year = day.getUTCFullYear();
    const month = day.getUTCMonth() + 1;
    const dayOfMonth = day.getUTCDate();
    const slot = slotForDay(schedule, year, month, dayOfMonth);
    if (!slot) continue;
    const date = dateKey(year, month, dayOfMonth);
    if (dayBlocked(schedule, date)) continue;
    const at = instantOf(schedule.timeZone, year, month, dayOfMonth, slot.hour, slot.minute);
    if (at <= after || timeBlocked(schedule, at)) continue;
    return { at, date, cadence: slot.cadence };
  }
  return null;
}

/** Whether a push due at `dueAt` should go out at `now`. The sweep does the reads and writes around this. */
export function decideDue(schedule: ReminderSchedule, dueAt: number, now: number): DueDecision {
  if (dueAt > now || now - dueAt > CATCH_UP_MS) return { action: 'reschedule' };
  const local = wallClock(dueAt, schedule.timeZone);
  const slot = slotForDay(schedule, local.year, local.month, local.day);
  // The schedule changed after this time was set, so it no longer matches. Recompute it.
  if (!slot || slot.hour !== local.hour || slot.minute !== local.minute) return { action: 'reschedule' };
  const date = dateKey(local.year, local.month, local.day);
  if (dayBlocked(schedule, date) || timeBlocked(schedule, now)) return { action: 'reschedule' };
  return { action: 'send', cadence: slot.cadence, date };
}

/** Lock-screen text is the same for everyone. The link opens one screen in the app. */
export function pushMessageFor(cadence: Cadence, lang: Lang): PushMessage {
  const copy = COPY[lang][cadence];
  return { title: 'Innerverse', body: copy.body, link: `${APP_ORIGIN}/#${copy.screen}` };
}

type Fields = Record<string, unknown>;

function asRecord(value: unknown): Fields | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Fields) : null;
}

function isInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/** A date key, or null when unset. Returns undefined when the value is malformed. */
function optionalDate(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' && DATE_KEY.test(value) ? value : undefined;
}

function readRule(map: Fields): Rule | null {
  if (typeof map.enabled !== 'boolean' || !isInteger(map.hour, 0, 23) || !isInteger(map.minute, 0, 59)) return null;
  return { enabled: map.enabled, hour: map.hour, minute: map.minute };
}

/**
 * Validates a schedule document. Every field must be present and well formed, and a document that is not sends nothing.
 * Missing values are not filled in with defaults, so a half-written document cannot send at the wrong time.
 */
export function parseReminderSchedule(fields: Fields): ReminderSchedule | null {
  const timeZone = fields.timeZone;
  const lang = fields.lang;
  if (typeof timeZone !== 'string' || !isValidTimeZone(timeZone)) return null;
  if (lang !== 'ru' && lang !== 'en') return null;

  const daily = asRecord(fields.daily);
  const weekly = asRecord(fields.weekly);
  const monthly = asRecord(fields.monthly);
  if (!daily || !weekly || !monthly) return null;
  const dailyRule = readRule(daily);
  const weeklyRule = readRule(weekly);
  const monthlyRule = readRule(monthly);
  if (!dailyRule || !weeklyRule || !monthlyRule) return null;
  const weekday = weekly.weekday;
  const monthDay = monthly.day;
  if (!isInteger(weekday, 0, 6) || !isInteger(monthDay, 1, 28)) return null;

  let quietHours: ReminderSchedule['quietHours'] = null;
  if (fields.quietHours !== null) {
    const quiet = asRecord(fields.quietHours);
    if (!quiet || !isInteger(quiet.startHour, 0, 23) || !isInteger(quiet.endHour, 0, 23)) return null;
    quietHours = { startHour: quiet.startHour, endHour: quiet.endHour };
  }

  const skipDate = optionalDate(fields.skipDate);
  const lastCheckInDay = optionalDate(fields.lastCheckInDay);
  const lastSentDay = optionalDate(fields.lastSentDay);
  if (skipDate === undefined || lastCheckInDay === undefined || lastSentDay === undefined) return null;

  const pausedUntil = fields.pausedUntil === null ? null : fields.pausedUntil;
  if (pausedUntil !== null && !isInteger(pausedUntil, 0, NEVER)) return null;

  const nextDueAt = fields.nextDueAt;
  if (!isInteger(nextDueAt, 0, NEVER)) return null;

  return {
    timeZone,
    lang,
    daily: dailyRule,
    weekly: { ...weeklyRule, weekday },
    monthly: { ...monthlyRule, day: monthDay },
    quietHours,
    skipDate,
    pausedUntil,
    lastCheckInDay,
    lastSentDay,
    nextDueAt,
  };
}
