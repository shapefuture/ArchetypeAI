/**
 * INNERVERSE — session booking data layer.
 *
 * Firestore model:
 *   therapists/{uid}                 — { email, availability: AvailabilityWindow[] }
 *   appointments/{id}                — { clientUid, clientEmail, therapistUid,
 *                                       therapistEmail, start, end, status,
 *                                       createdAt, accessGranted }
 *   therapistBusySlots/{uid}_{start}  — public schedule-only slot lock, written
 *                                       atomically with the appointment to stop
 *                                       two clients reserving the same start
 *   clientShares/{tUid}_{cUid}       — booking grants the therapist read access
 *                                       to the client's profile/answers
 *   therapistClients/{tUid}_{cUid}   — the therapist panel's «Мои клиенты»
 *                                       list picks the client up immediately
 *                                       (existing share mechanism, reused).
 *
 * Time zones: availability windows carry the IANA zone their hours were entered
 * in (`timeZone`). Slots are wall-clock times in that zone; a client sees each
 * slot in their own zone. `start`/`end` on an appointment stay the wall-clock
 * echo in the therapist's zone, so the busy-slot lock keeps working. An
 * optional `time` map (appointment-time.ts, schemaVersion 2) adds the absolute
 * instant and zone. Writing `time` needs an appointments rule change first; see
 * ZONE_TIME_WRITES_ENABLED. Records without a zone are classified as legacy and
 * are never reinterpreted.
 *
 * Pure helpers (parseHM / slotsForDate / freeSlots / bookableDays / slotTime and
 * others) are unit-tested in booking.spec.ts without Firestore.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../environments/firebase-init';
import {
  buildAppointmentTime,
  classifyAppointmentRecord,
  formatInstantInZone,
  isValidIanaZone,
  resolveWallClock,
  type AppointmentRecordClass,
  type AppointmentTimeV2,
  type BuildResult,
  type FoldChoice,
} from './appointment-time';

/**
 * One availability window: weekdays (1=Mon … 7=Sun), HH:MM bounds, slot length,
 * and the IANA zone the hours were entered in. A window with no `timeZone` was
 * saved before zones existed; its zone is unknown and must not be assumed.
 */
export interface AvailabilityWindow {
  days: number[];
  start: string;
  end: string;
  minutes: number;
  timeZone?: string;
}

/** Default: weekdays 09:00–17:00, 60-minute slots. */
export const DEFAULT_AVAILABILITY: AvailabilityWindow[] = [
  { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', minutes: 60 },
];

/**
 * Whether new bookings also write the schemaVersion-2 `time` map. Off by default:
 * firestore.rules (appointments create) accepts only the legacy key set, so
 * turning this on before the rule change would reject every booking. Enable it
 * only after the rule accepts an optional `time` map on create.
 */
export const ZONE_TIME_WRITES_ENABLED = false;

export type AppointmentStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export interface Appointment {
  id: string;
  clientUid: string;
  clientEmail: string | null;
  therapistUid: string;
  therapistEmail: string | null;
  /** Wall-clock YYYY-MM-DDTHH:mm in the therapist's zone (see `time.timeZone`). */
  start: string;
  end: string;
  status: AppointmentStatus;
  createdAt: string;
  accessGranted?: boolean;
  /** Zone-aware time, present only on records that carry a valid schemaVersion-2 `time` map. */
  time?: AppointmentTimeV2 | null;
  /** How the stored time was classified. 'legacy-naive' records need explicit confirmation. */
  timeClass?: AppointmentRecordClass;
}

/** A booked busy interval — any Appointment-shaped subset works. */
export interface BusyInterval {
  start: string;
  end: string;
  status: AppointmentStatus | string;
}

// ---------------------------------------------------------------------------
// Pure slot math
// ---------------------------------------------------------------------------

/** '09:30' → 570 minutes since midnight. Returns -1 for garbage input. */
export function parseHM(hm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hm || '').trim());
  if (!m) return -1;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 24 || (h === 24 && min !== 0) || min < 0 || min > 59) return -1;
  return h * 60 + min;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function minutesToHM(total: number): string {
  return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
}

function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Weekday (1=Mon … 7=Sun) for a YYYY-MM-DD string. A calendar date has one
 * weekday in every zone, so this uses UTC arithmetic and is independent of the
 * device zone.
 */
export function weekdayOf(dateISO: string): number {
  const ms = Date.parse(`${dateISO}T00:00:00Z`);
  if (isNaN(ms)) return 0;
  const js = new Date(ms).getUTCDay(); // 0=Sun … 6=Sat
  return js === 0 ? 7 : js;
}

/** Do [aStart,aEnd) and [bStart,bEnd) overlap? */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * All slot start times a therapist's availability generates for a date,
 * ignoring existing bookings. Slot length comes from each window's `minutes`
 * (default 60).
 */
export function slotsForDate(availability: AvailabilityWindow[], dateISO: string): string[] {
  const day = weekdayOf(dateISO);
  const out: string[] = [];
  for (const w of availability) {
    if (!w || !(w.days || []).includes(day)) continue;
    const start = parseHM(w.start);
    const end = parseHM(w.end);
    const minutes = Number.isFinite(w.minutes) && w.minutes > 0 ? Math.max(1, Math.round(w.minutes)) : 60;
    if (start < 0 || end <= start) continue;
    for (let t = start; t + minutes <= end; t += minutes) {
      out.push(`${dateISO}T${minutesToHM(t)}`);
    }
  }
  return [...new Set(out)].sort();
}

/** Options for the zone-aware helpers. Omitting `timeZone` keeps the original device-clock behaviour. */
export interface SlotOptions {
  /** IANA zone the availability hours are written in. */
  timeZone?: string;
}

/** The device's IANA zone, or null when the runtime does not report a valid one. */
export function deviceTimeZone(): string | null {
  try {
    const zone: unknown = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidIanaZone(zone) ? zone : null;
  } catch {
    return null;
  }
}

/**
 * The one zone every window was entered in. Null when the list is empty, when a
 * window has no valid zone (legacy), or when the windows disagree.
 */
export function therapistTimeZone(availability: AvailabilityWindow[]): string | null {
  let zone: string | null = null;
  for (const w of availability) {
    if (!w || !isValidIanaZone(w.timeZone)) return null;
    if (zone !== null && zone !== w.timeZone) return null;
    zone = w.timeZone;
  }
  return zone;
}

/**
 * Stamp every window with its zone. A valid zone already on a window is kept.
 * Otherwise the fallback (by default this device's zone at save time) is used.
 * Throws when no valid zone is available, so nothing is saved without one.
 */
export function stampWindowZones(
  availability: AvailabilityWindow[],
  fallbackZone: string | null = deviceTimeZone(),
): AvailabilityWindow[] {
  return availability.map((w) => {
    const timeZone = isValidIanaZone(w.timeZone) ? w.timeZone : fallbackZone;
    if (!isValidIanaZone(timeZone)) throw new Error('A valid IANA time zone is required to save availability');
    return { days: w.days, start: w.start, end: w.end, minutes: w.minutes, timeZone };
  });
}

/** One instant a wall-clock slot can map to. `fold` is set only when the wall time repeats. */
export interface SlotOccurrence {
  fold: FoldChoice | null;
  startMs: number;
  /** False once this instant has already started. */
  offered: boolean;
}

/**
 * The instants behind a wall-clock slot in a zone. Empty when the wall time does
 * not exist (spring gap), one when it is unique, and two (earlier, later) when the
 * clock repeats it (autumn fold).
 */
export function slotOccurrences(slot: string, timeZone: string, now: Date = new Date()): SlotOccurrence[] {
  const resolved = resolveWallClock(slot, timeZone);
  if (!resolved.ok || resolved.kind === 'nonexistent') return [];
  const nowMs = now.getTime();
  if (resolved.kind === 'unique') {
    return [{ fold: null, startMs: resolved.startMs, offered: resolved.startMs > nowMs }];
  }
  return [
    { fold: 'earlier', startMs: resolved.earlierMs, offered: resolved.earlierMs > nowMs },
    { fold: 'later', startMs: resolved.laterMs, offered: resolved.laterMs > nowMs },
  ];
}

/** Slot length in minutes, from the window whose grid contains the slot start (60 when none does). */
export function slotMinutesAt(slotISO: string, availability: AvailabilityWindow[]): number {
  const dateISO = slotISO.slice(0, 10);
  const day = weekdayOf(dateISO);
  const startMin = parseHM(slotISO.slice(11));
  for (const w of availability) {
    if ((w.days || []).includes(day)) {
      const wStart = parseHM(w.start);
      const wMinutes = w.minutes > 0 ? w.minutes : 60;
      // The slot belongs to the window whose grid contains its start.
      if (wStart >= 0 && startMin >= wStart && startMin < parseHM(w.end) && (startMin - wStart) % wMinutes === 0) {
        return wMinutes;
      }
    }
  }
  return 60;
}

/**
 * The schemaVersion-2 time for a generated slot, in the therapist's zone. The
 * duration comes from the slot's window. `fold` is required only when the wall
 * time repeats.
 */
export function slotTime(input: {
  slot: string;
  availability: AvailabilityWindow[];
  timeZone: string;
  fold?: FoldChoice;
}): BuildResult {
  return buildAppointmentTime({
    wallStart: input.slot,
    durationMinutes: slotMinutesAt(input.slot, input.availability),
    timeZone: input.timeZone,
    fold: input.fold,
    source: { kind: 'availability-slot' },
  });
}

/**
 * Free slots for a date: generated slots minus
 *   - slots overlapping a pending/approved appointment, and
 *   - slots that already started (relative to `now`).
 *
 * With `options.timeZone`, slots are wall-clock times in that zone: nonexistent
 * times are dropped, and a repeated time is offered while either pass is still
 * ahead. Without it, the original device-clock behaviour is kept.
 */
export function freeSlots(
  availability: AvailabilityWindow[],
  booked: BusyInterval[],
  dateISO: string,
  now: Date = new Date(),
  options: SlotOptions = {},
): string[] {
  const busy = (booked || []).filter(b => b && (b.status === 'pending' || b.status === 'approved'));
  if (options.timeZone !== undefined) return zoneFreeSlots(availability, busy, dateISO, now, options.timeZone);
  return slotsForDate(availability, dateISO).filter(slot => {
    const startAt = new Date(slot);
    // A nonexistent wall time during the DST spring transition must not normalize into another slot.
    if (isNaN(startAt.getTime()) || localDateISO(startAt) !== dateISO || minutesToHM(startAt.getHours() * 60 + startAt.getMinutes()) !== slot.slice(11)) return false;
    if (startAt.getTime() <= now.getTime()) return false;
    const slotEndISO = endOfSlot(slot, availability);
    return !busy.some(b => overlaps(slot, slotEndISO, b.start, b.end));
  });
}

function zoneFreeSlots(
  availability: AvailabilityWindow[],
  busy: BusyInterval[],
  dateISO: string,
  now: Date,
  timeZone: string,
): string[] {
  if (!isValidIanaZone(timeZone)) return [];
  return slotsForDate(availability, dateISO).filter((slot) => {
    if (!slotOccurrences(slot, timeZone, now).some((occurrence) => occurrence.offered)) return false;
    const slotEndISO = endOfSlot(slot, availability);
    return !busy.some(b => overlaps(slot, slotEndISO, b.start, b.end));
  });
}

/** End time of a generated slot, given the availability it came from. */
export function endOfSlot(slotISO: string, availability: AvailabilityWindow[]): string {
  const dateISO = slotISO.slice(0, 10);
  const startMin = parseHM(slotISO.slice(11));
  return addSlotMinutes(`${dateISO}T${minutesToHM(startMin)}`, slotMinutesAt(slotISO, availability));
}

/**
 * Next `days` dates (starting tomorrow) whose weekday has availability. With
 * `options.timeZone`, "today" and the weekdays are taken in that zone; without
 * it, the device clock is used as before.
 */
export function bookableDays(
  availability: AvailabilityWindow[],
  from: Date = new Date(),
  days: number = 14,
  options: SlotOptions = {},
): string[] {
  const enabled = new Set<number>();
  for (const w of availability) for (const d of w.days || []) enabled.add(d);
  if (options.timeZone !== undefined) {
    const today = isValidIanaZone(options.timeZone) ? formatInstantInZone(from.getTime(), options.timeZone) : null;
    if (!today) return [];
    const zoned: string[] = [];
    let cursorMs = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
    for (let i = 0; i < days + 7 && zoned.length < days; i++) {
      cursorMs += 86_400_000;
      const iso = new Date(cursorMs).toISOString().slice(0, 10);
      if (enabled.has(weekdayOf(iso))) zoned.push(iso);
    }
    return zoned;
  }
  const out: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < days + 7 && out.length < days; i++) {
    cursor.setDate(cursor.getDate() + 1);
    const js = cursor.getDay();
    const weekday = js === 0 ? 7 : js;
    if (enabled.has(weekday)) out.push(localDateISO(cursor));
  }
  return out;
}

/** Wall-clock calendar arithmetic keeps midnight rollover explicit in the stored Angular contract. */
function addSlotMinutes(slotISO: string, minutes: number): string {
  const base = new Date(`${slotISO}Z`);
  if (!Number.isFinite(base.getTime()) || !Number.isFinite(minutes)) throw new Error('Invalid slot');
  base.setUTCMinutes(base.getUTCMinutes() + minutes);
  return base.toISOString().slice(0, 16);
}

/** End of a slot the client is about to book (uses DEFAULT grid fallback). */
export function slotEnd(slotISO: string, minutes = 60): string {
  return addSlotMinutes(slotISO, minutes);
}

// ---------------------------------------------------------------------------
// Firestore operations
// ---------------------------------------------------------------------------

export function normalizeAvailability(raw: unknown): AvailabilityWindow[] {
  if (!Array.isArray(raw)) return DEFAULT_AVAILABILITY;
  if (raw.length === 0) return [];
  return raw
    .filter((w): w is AvailabilityWindow => !!w && typeof w === 'object')
    .map(w => {
      const window: AvailabilityWindow = {
        days: Array.isArray(w.days) ? w.days : [],
        start: typeof w.start === 'string' ? w.start : '09:00',
        end: typeof w.end === 'string' ? w.end : '17:00',
        minutes: typeof w.minutes === 'number' && w.minutes > 0 ? w.minutes : 60,
      };
      // A window without a valid zone stays zone-less. Its zone is never assumed.
      if (isValidIanaZone(w.timeZone)) window.timeZone = w.timeZone;
      return window;
    })
    .filter(w => w.days.length > 0);
}

/**
 * Classify the time of a stored appointment. A nested `time` map is classified
 * strictly, so a malformed v2 record is never read as legacy. A record without
 * one is classified from its naive start/end, which yields 'legacy-naive'.
 */
export function appointmentTimeFromRecord(data: Record<string, unknown>): {
  time: AppointmentTimeV2 | null;
  timeClass: AppointmentRecordClass;
} {
  const nested = data['time'];
  const timeClass = nested !== undefined && nested !== null
    ? classifyAppointmentRecord(nested)
    : classifyAppointmentRecord(data);
  return { time: timeClass.kind === 'v2' ? timeClass.time : null, timeClass };
}

/**
 * A zone-aware booking time must be a valid v2 time that echoes the slot it
 * reserves. Returns a reason, or null when the pair is consistent.
 */
export function bookingTimeMismatch(time: AppointmentTimeV2, start: string): string | null {
  if (classifyAppointmentRecord(time).kind !== 'v2') return 'invalid-time';
  if (time.wallStart !== start) return 'slot-mismatch';
  return null;
}

export interface TherapistProfile {
  uid: string;
  email: string | null;
  availability: AvailabilityWindow[];
}

/** A therapist is bookable only after their profile/availability is saved. */
export async function getTherapistProfile(therapistUid: string): Promise<TherapistProfile | null> {
  const snap = await getDoc(doc(getFirestoreDb(), 'therapists', therapistUid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    email: typeof data.email === 'string' ? data.email : null,
    availability: normalizeAvailability(data.availability),
  };
}

export async function getTherapistAvailability(therapistUid: string): Promise<AvailabilityWindow[]> {
  const profile = await getTherapistProfile(therapistUid);
  return profile?.availability ?? DEFAULT_AVAILABILITY;
}

export async function saveTherapistAvailability(
  therapistUid: string,
  availability: AvailabilityWindow[],
  email: string | null = null,
): Promise<void> {
  const db = getFirestoreDb();
  // Throws before any write when no valid zone is available.
  const windows = stampWindowZones(availability);
  await setDoc(doc(db, 'therapists', therapistUid), { email, availability: windows }, { merge: true });
}

function toAppointment(id: string, data: Record<string, unknown>): Appointment {
  const { time, timeClass } = appointmentTimeFromRecord(data);
  return {
    id,
    clientUid: (data['clientUid'] as string) ?? '',
    clientEmail: (data['clientEmail'] as string) ?? null,
    therapistUid: (data['therapistUid'] as string) ?? '',
    therapistEmail: (data['therapistEmail'] as string) ?? null,
    start: (data['start'] as string) ?? '',
    end: (data['end'] as string) ?? '',
    status: (data['status'] as AppointmentStatus) ?? 'pending',
    createdAt: (data['createdAt'] as string) ?? '',
    accessGranted: (data['accessGranted'] as boolean) ?? false,
    time,
    timeClass,
  };
}

export async function myAppointments(clientUid: string): Promise<Appointment[]> {
  const db = getFirestoreDb();
  const q = query(collection(db, 'appointments'), where('clientUid', '==', clientUid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => toAppointment(d.id, d.data()))
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
}

export async function therapistAppointments(therapistUid: string): Promise<Appointment[]> {
  const db = getFirestoreDb();
  const q = query(collection(db, 'appointments'), where('therapistUid', '==', therapistUid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => toAppointment(d.id, d.data()))
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
}

/** Public schedule projection: exposes occupied intervals, never client identity. */
export async function therapistBusyIntervals(therapistUid: string): Promise<BusyInterval[]> {
  const db = getFirestoreDb();
  const snap = await getDocs(query(
    collection(db, 'therapistBusySlots'),
    where('therapistUid', '==', therapistUid),
  ));
  return snap.docs
    .map((entry) => {
      const data = entry.data();
      return {
        start: typeof data.start === 'string' ? data.start : '',
        end: typeof data.end === 'string' ? data.end : '',
        status: 'pending',
      };
    })
    .filter((entry) => !!entry.start && !!entry.end);
}

export function therapistBusySlotId(therapistUid: string, start: string): string {
  return `${therapistUid}_${start}`;
}

/** Backfill the public slot projection for active appointments made pre-migration. */
export async function ensureTherapistBusySlots(therapistUid: string, appointments: Appointment[]): Promise<void> {
  const db = getFirestoreDb();
  const activeByStart = new Map<string, Appointment>();
  for (const appointment of appointments) {
    if (appointment.therapistUid !== therapistUid || !['pending', 'approved'].includes(appointment.status)) continue;
    if (appointment.start && appointment.end && !activeByStart.has(appointment.start)) {
      activeByStart.set(appointment.start, appointment);
    }
  }
  const entries = [...activeByStart.values()];
  const existing = await Promise.all(entries.map((appointment) => getDoc(doc(
    db, 'therapistBusySlots', therapistBusySlotId(therapistUid, appointment.start),
  ))));
  const batch = writeBatch(db);
  let writes = 0;
  entries.forEach((appointment, index) => {
    if (existing[index].exists()) return;
    batch.set(doc(db, 'therapistBusySlots', therapistBusySlotId(therapistUid, appointment.start)), {
      therapistUid,
      appointmentId: appointment.id,
      start: appointment.start,
      end: appointment.end,
    });
    writes += 1;
  });
  if (writes) await batch.commit();
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const db = getFirestoreDb();
  const appointmentRef = doc(db, 'appointments', id);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(appointmentRef);
    if (!snap.exists()) throw new Error('Appointment not found');
    const data = snap.data();
    if (['declined', 'cancelled'].includes(data.status) && ['pending', 'approved'].includes(status)) {
      throw new Error('This appointment is already closed');
    }
    const releasing = status === 'declined' || status === 'cancelled';
    const busyRef = doc(db, 'therapistBusySlots', therapistBusySlotId(String(data.therapistUid), String(data.start)));
    const busySnap = releasing ? await transaction.get(busyRef) : null;
    transaction.update(appointmentRef, { status });
    // A retried cancellation must never delete a newer booking's reservation.
    if (busySnap?.exists() && busySnap.data().appointmentId === id) transaction.delete(busyRef);
  });
}

/**
 * Create a booking. Creating the appointment ALSO grants the therapist read
 * access to the client's profile/answers: a `clientShares` doc is written
 * (source: 'booking'), and the existing `therapistClients` share mechanism is
 * reused so the therapist's «Мои клиенты» list picks the client up
 * immediately (the doc is merged — an already-claimed client keeps their
 * summary and archive flag).
 */
export async function createBooking(input: {
  clientUid: string;
  clientEmail: string | null;
  therapistUid: string;
  therapistEmail: string | null;
  /** Wall-clock slot in the therapist's zone. */
  start: string;
  end: string;
  /**
   * Optional schemaVersion-2 time for the slot. It is written as the `time` map
   * only when present. Requires the appointments rule to accept `time`.
   */
  time?: AppointmentTimeV2;
}): Promise<string> {
  if (input.time) {
    const mismatch = bookingTimeMismatch(input.time, input.start);
    if (mismatch) throw new Error(`Booking time rejected: ${mismatch}`);
  }
  const db = getFirestoreDb();
  const appointmentRef = doc(collection(db, 'appointments'));
  const id = appointmentRef.id;
  const now = new Date().toISOString();
  const busyRef = doc(db, 'therapistBusySlots', therapistBusySlotId(input.therapistUid, input.start));
  const bookingBatch = writeBatch(db);
  bookingBatch.set(appointmentRef, {
    clientUid: input.clientUid,
    clientEmail: input.clientEmail,
    therapistUid: input.therapistUid,
    therapistEmail: input.therapistEmail,
    start: input.start,
    end: input.end,
    status: 'pending' as AppointmentStatus,
    createdAt: now,
    accessGranted: true,
    ...(input.time ? { time: input.time } : {}),
  });
  // The deterministic slot document is the concurrency guard: only one
  // booking batch can reserve a therapist/start-time pair. Its public shape
  // contains schedule data only; the random appointment ID carries no UID.
  bookingBatch.set(busyRef, {
    therapistUid: input.therapistUid,
    appointmentId: id,
    start: input.start,
    end: input.end,
  });
  await bookingBatch.commit();
  await setDoc(
    doc(db, 'clientShares', `${input.therapistUid}_${input.clientUid}`),
    {
      clientUid: input.clientUid,
      clientEmail: input.clientEmail,
      therapistUid: input.therapistUid,
      grantedAt: now,
      source: 'booking',
      appointmentId: id,
    },
    { merge: true },
  );
  await setDoc(
    doc(db, 'therapistClients', `${input.therapistUid}_${input.clientUid}`),
    {
      therapistUid: input.therapistUid,
      clientUid: input.clientUid,
      clientEmail: input.clientEmail,
      linkedAt: now,
      source: 'booking',
      appointmentId: id,
    },
    { merge: true },
  );
  return id;
}
