/**
 * INNERVERSE — versioned appointment time contract (pure; no Firestore access).
 *
 * Supported scope, stated explicitly:
 *   - schemaVersion 2 names an absolute instant (startUtc/endUtc), the IANA zone
 *     in which the wall-clock choice was made, a whole-minute duration
 *     (5–480), and the source of that choice.
 *   - Wall-clock inputs are 'YYYY-MM-DDTHH:mm' in the Gregorian calendar for
 *     years 1970–2100. Zone names must be IANA identifiers accepted by the
 *     runtime's tz database.
 *   - Duration is absolute: endUtc = startUtc + durationMinutes, so a session
 *     that crosses a DST change keeps its length.
 *   - DST policy: a nonexistent wall time (spring gap) is never offered and is
 *     never normalized to a neighbouring slot. A repeated wall time (autumn
 *     fold) has two instants; the contract refuses to pick one unless the
 *     caller passes an explicit 'earlier' or 'later' choice. The UI should
 *     pre-select 'earlier' and disclose the alternative.
 *   - Legacy schema-less records with naive start/end are classified as
 *     'legacy-naive'. They carry no instant. They gain one only through
 *     confirmLegacyNaiveRecord, which requires an explicit zone, and the
 *     original wall values are preserved in the result.
 *   - A record that declares schemaVersion 2 is never reinterpreted as legacy,
 *     even when it is malformed.
 *   - Not covered here: persistence (current Firestore rules accept only the
 *     legacy appointment key set), the therapist's stored zone, guided
 *     per-record confirmation UI, migration writes, and server availability.
 */

export const APPOINTMENT_TIME_SCHEMA_VERSION = 2 as const;
export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 480;
const MIN_WALL_YEAR = 1970;
const MAX_WALL_YEAR = 2100;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export type FoldChoice = 'earlier' | 'later';
export type ConfirmingParty = 'client' | 'therapist';

export type AppointmentTimeSource =
  | { kind: 'availability-slot' }
  | {
      kind: 'legacy-confirmed';
      /** Naive wall values exactly as stored before confirmation. */
      originalStart: string;
      originalEnd: string;
      confirmedBy: ConfirmingParty;
      confirmedAt: string;
    };

export interface AppointmentTimeV2 {
  schemaVersion: typeof APPOINTMENT_TIME_SCHEMA_VERSION;
  /** ISO-8601 UTC instant, e.g. 2026-06-15T07:00:00.000Z. */
  startUtc: string;
  endUtc: string;
  durationMinutes: number;
  /** IANA zone in which the wall-clock choice was made. */
  timeZone: string;
  /** Wall-clock echo 'YYYY-MM-DDTHH:mm' in timeZone, for display and audit. */
  wallStart: string;
  /** Set only when the wall time repeats; names the choice and the other instant. */
  repeatedWallTime: null | { choice: FoldChoice; otherUtc: string };
  source: AppointmentTimeSource;
}

export type TimeContractError =
  | 'invalid-zone'
  | 'invalid-wall-clock'
  | 'invalid-duration'
  | 'nonexistent-local-time'
  | 'repeated-local-time-needs-choice'
  | 'invalid-record'
  | 'unknown-schema-version'
  | 'unknown-shape';

export type WallResolution =
  | { ok: true; kind: 'unique'; startMs: number }
  | { ok: true; kind: 'repeated'; earlierMs: number; laterMs: number }
  | { ok: true; kind: 'nonexistent' }
  | { ok: false; reason: 'invalid-zone' | 'invalid-wall-clock' };

export type BuildResult = { ok: true; time: AppointmentTimeV2 } | { ok: false; reason: TimeContractError };

export type AppointmentRecordClass =
  | { kind: 'v2'; time: AppointmentTimeV2 }
  | { kind: 'legacy-naive'; start: string; end: string; requiresConfirmation: true; instant: null }
  | { kind: 'invalid'; reason: TimeContractError };

export interface AppointmentAuditReport {
  total: number;
  v2: number;
  legacyNaive: Array<{ id: string; start: string; end: string }>;
  invalid: Array<{ id: string; reason: TimeContractError }>;
}

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const UTC_INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
// Shape check only; the runtime tz database decides which names exist.
const IANA_SHAPE_RE = /^[A-Za-z][A-Za-z_]*(\/[A-Za-z0-9_+-]+)*$/;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
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
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** True only for IANA zone names the runtime accepts. Offsets such as '+05:00' are rejected. */
export function isValidIanaZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string' || !IANA_SHAPE_RE.test(timeZone)) return false;
  try {
    zoneFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Zone offset (local minus UTC) in milliseconds at an absolute instant. */
function offsetMsAt(timeZone: string, epochMs: number): number {
  const parts = zoneFormatter(timeZone).formatToParts(new Date(epochMs));
  const field = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const wallAsUtc = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    field('hour') % 24,
    field('minute'),
    field('second'),
  );
  return wallAsUtc - Math.floor(epochMs / 1000) * 1000;
}

/** Strict 'YYYY-MM-DDTHH:mm' parse. Rejects impossible dates and out-of-scope years. */
export function parseWallClock(wall: unknown): { year: number; month: number; day: number; hour: number; minute: number } | null {
  if (typeof wall !== 'string') return null;
  const match = WALL_RE.exec(wall);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (year < MIN_WALL_YEAR || year > MAX_WALL_YEAR || month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day, hour, minute };
}

export function isSupportedDuration(minutes: unknown): minutes is number {
  return Number.isInteger(minutes) && (minutes as number) >= MIN_DURATION_MINUTES && (minutes as number) <= MAX_DURATION_MINUTES;
}

/** Wall-clock instant for a valid 'YYYY-MM-DDTHH:mm' string, as if it were UTC. */
function wallAsUtcMs(wall: string): number | null {
  const parts = parseWallClock(wall);
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

/**
 * Resolve a wall-clock time in an IANA zone to absolute instant(s). A wall time
 * is valid when converting it to an instant with the zone's offset round-trips
 * back to the same wall time. Probes at ±1 day cover the offsets in play
 * around the wall time.
 */
export function resolveWallClock(wall: string, timeZone: string): WallResolution {
  const asUtc = wallAsUtcMs(wall);
  if (asUtc === null) return { ok: false, reason: 'invalid-wall-clock' };
  if (!isValidIanaZone(timeZone)) return { ok: false, reason: 'invalid-zone' };
  const probeOffsets = new Set<number>();
  for (const probe of [asUtc - DAY_MS, asUtc, asUtc + DAY_MS]) probeOffsets.add(offsetMsAt(timeZone, probe));
  const candidates = new Set<number>();
  for (const offset of probeOffsets) {
    const instantMs = asUtc - offset;
    if (offsetMsAt(timeZone, instantMs) === offset) candidates.add(instantMs);
  }
  const sorted = [...candidates].sort((a, b) => a - b);
  if (sorted.length === 0) return { ok: true, kind: 'nonexistent' };
  if (sorted.length === 1) return { ok: true, kind: 'unique', startMs: sorted[0] };
  return { ok: true, kind: 'repeated', earlierMs: sorted[0], laterMs: sorted[sorted.length - 1] };
}

/** Wall-clock 'YYYY-MM-DDTHH:mm' shown for an instant in a zone, or null if inputs are invalid. */
export function formatInstantInZone(instant: string | number, timeZone: string): string | null {
  const ms = typeof instant === 'number' ? instant : UTC_INSTANT_RE.test(instant) ? Date.parse(instant) : NaN;
  if (!Number.isFinite(ms) || !isValidIanaZone(timeZone)) return null;
  const parts = zoneFormatter(timeZone).formatToParts(new Date(ms));
  const field = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const year = field('year');
  return `${year}-${pad2(field('month'))}-${pad2(field('day'))}T${pad2(field('hour') % 24)}:${pad2(field('minute'))}`;
}

export interface BuildAppointmentInput {
  wallStart: string;
  durationMinutes: number;
  timeZone: string;
  /** Required only when the wall time repeats. */
  fold?: FoldChoice;
  source: AppointmentTimeSource;
}

/** Build a v2 time from an explicit zone, wall start, duration and source. */
export function buildAppointmentTime(input: BuildAppointmentInput): BuildResult {
  if (!isSupportedDuration(input.durationMinutes)) return { ok: false, reason: 'invalid-duration' };
  const resolved = resolveWallClock(input.wallStart, input.timeZone);
  if (resolved.ok === false) return { ok: false, reason: resolved.reason };
  if (resolved.kind === 'nonexistent') return { ok: false, reason: 'nonexistent-local-time' };

  let startMs: number;
  let repeatedWallTime: AppointmentTimeV2['repeatedWallTime'] = null;
  if (resolved.kind === 'unique') {
    startMs = resolved.startMs;
  } else {
    if (input.fold !== 'earlier' && input.fold !== 'later') {
      return { ok: false, reason: 'repeated-local-time-needs-choice' };
    }
    const earlier = input.fold === 'earlier';
    startMs = earlier ? resolved.earlierMs : resolved.laterMs;
    repeatedWallTime = {
      choice: input.fold,
      otherUtc: new Date(earlier ? resolved.laterMs : resolved.earlierMs).toISOString(),
    };
  }

  return {
    ok: true,
    time: {
      schemaVersion: APPOINTMENT_TIME_SCHEMA_VERSION,
      startUtc: new Date(startMs).toISOString(),
      endUtc: new Date(startMs + input.durationMinutes * MINUTE_MS).toISOString(),
      durationMinutes: input.durationMinutes,
      timeZone: input.timeZone,
      wallStart: input.wallStart,
      repeatedWallTime,
      source: input.source,
    },
  };
}

function isWallOf(instant: string, timeZone: string, wall: string): boolean {
  return formatInstantInZone(instant, timeZone) === wall;
}

/**
 * Validate a stored v2 record. Returns a normalized copy, or null when the
 * record is malformed or internally inconsistent (for example, a wall echo that
 * does not match its instant in the stored zone).
 */
export function parseAppointmentTimeV2(raw: unknown): AppointmentTimeV2 | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.schemaVersion !== APPOINTMENT_TIME_SCHEMA_VERSION) return null;
  const { startUtc, endUtc, durationMinutes, timeZone, wallStart, repeatedWallTime, source } = r;
  if (typeof startUtc !== 'string' || typeof endUtc !== 'string') return null;
  if (!UTC_INSTANT_RE.test(startUtc) || !UTC_INSTANT_RE.test(endUtc)) return null;
  const startMs = Date.parse(startUtc);
  const endMs = Date.parse(endUtc);
  if (!isSupportedDuration(durationMinutes) || endMs - startMs !== durationMinutes * MINUTE_MS) return null;
  if (!isValidIanaZone(timeZone) || typeof wallStart !== 'string') return null;
  if (!isWallOf(startUtc, timeZone, wallStart)) return null;

  let repeated: AppointmentTimeV2['repeatedWallTime'] = null;
  if (repeatedWallTime !== null && repeatedWallTime !== undefined) {
    const rw = repeatedWallTime as Record<string, unknown>;
    if ((rw.choice !== 'earlier' && rw.choice !== 'later') || typeof rw.otherUtc !== 'string') return null;
    if (!UTC_INSTANT_RE.test(rw.otherUtc) || !isWallOf(rw.otherUtc, timeZone, wallStart)) return null;
    const other = Date.parse(rw.otherUtc);
    if (rw.choice === 'earlier' ? other <= startMs : other >= startMs) return null;
    repeated = { choice: rw.choice, otherUtc: rw.otherUtc };
  }

  const src = source as Record<string, unknown> | undefined;
  let normalizedSource: AppointmentTimeSource;
  if (src?.kind === 'availability-slot') {
    normalizedSource = { kind: 'availability-slot' };
  } else if (src?.kind === 'legacy-confirmed') {
    const { originalStart, originalEnd, confirmedBy, confirmedAt } = src;
    if (
      typeof originalStart !== 'string' || !parseWallClock(originalStart) ||
      typeof originalEnd !== 'string' || !parseWallClock(originalEnd) ||
      (confirmedBy !== 'client' && confirmedBy !== 'therapist') ||
      typeof confirmedAt !== 'string' || Number.isNaN(Date.parse(confirmedAt))
    ) return null;
    normalizedSource = { kind: 'legacy-confirmed', originalStart, originalEnd, confirmedBy, confirmedAt };
  } else {
    return null;
  }

  return {
    schemaVersion: APPOINTMENT_TIME_SCHEMA_VERSION,
    startUtc,
    endUtc,
    durationMinutes,
    timeZone,
    wallStart,
    repeatedWallTime: repeated,
    source: normalizedSource,
  };
}

/**
 * Classify a stored appointment record without converting it. A record that
 * declares schemaVersion 2 is parsed strictly and never falls back to legacy.
 * A schema-less record with naive start/end becomes 'legacy-naive' with no
 * instant, so nothing is guessed.
 */
export function classifyAppointmentRecord(raw: unknown): AppointmentRecordClass {
  if (!raw || typeof raw !== 'object') return { kind: 'invalid', reason: 'unknown-shape' };
  const r = raw as Record<string, unknown>;
  if (r.schemaVersion === APPOINTMENT_TIME_SCHEMA_VERSION) {
    const time = parseAppointmentTimeV2(raw);
    return time ? { kind: 'v2', time } : { kind: 'invalid', reason: 'invalid-record' };
  }
  if (r.schemaVersion !== undefined) return { kind: 'invalid', reason: 'unknown-schema-version' };
  const startMs = wallAsUtcMs(r.start as string);
  const endMs = wallAsUtcMs(r.end as string);
  if (startMs === null || endMs === null) return { kind: 'invalid', reason: 'unknown-shape' };
  const span = (endMs - startMs) / MINUTE_MS;
  if (!isSupportedDuration(span)) return { kind: 'invalid', reason: 'invalid-duration' };
  return { kind: 'legacy-naive', start: r.start as string, end: r.end as string, requiresConfirmation: true, instant: null };
}

export interface LegacyConfirmation {
  /** Explicit zone chosen by a party. There is no default. */
  timeZone: string;
  fold?: FoldChoice;
  confirmedBy: ConfirmingParty;
  /** ISO-8601 timestamp of the confirmation. */
  confirmedAt: string;
}

/**
 * Turn one confirmed legacy naive record into a v2 time. The wall-clock span is
 * the intended duration. The original naive values are kept in the source.
 */
export function confirmLegacyNaiveRecord(
  legacy: { start: string; end: string },
  decision: LegacyConfirmation,
): BuildResult {
  const startMs = wallAsUtcMs(legacy.start);
  const endMs = wallAsUtcMs(legacy.end);
  if (startMs === null || endMs === null) return { ok: false, reason: 'invalid-wall-clock' };
  if (Number.isNaN(Date.parse(decision.confirmedAt))) return { ok: false, reason: 'invalid-record' };
  return buildAppointmentTime({
    wallStart: legacy.start,
    durationMinutes: (endMs - startMs) / MINUTE_MS,
    timeZone: decision.timeZone,
    fold: decision.fold,
    source: {
      kind: 'legacy-confirmed',
      originalStart: legacy.start,
      originalEnd: legacy.end,
      confirmedBy: decision.confirmedBy,
      confirmedAt: decision.confirmedAt,
    },
  });
}

/** Read-only dry run over stored records. It writes nothing. */
export function auditAppointmentRecords(records: ReadonlyArray<{ id: string; data: unknown }>): AppointmentAuditReport {
  const report: AppointmentAuditReport = { total: records.length, v2: 0, legacyNaive: [], invalid: [] };
  for (const { id, data } of records) {
    const classified = classifyAppointmentRecord(data);
    if (classified.kind === 'v2') report.v2 += 1;
    else if (classified.kind === 'legacy-naive') report.legacyNaive.push({ id, start: classified.start, end: classified.end });
    else report.invalid.push({ id, reason: classified.reason });
  }
  return report;
}
