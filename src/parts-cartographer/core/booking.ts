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
 * Pure helpers (parseHM / slotsForDate / freeSlots / bookableDays) are
 * unit-tested in booking.spec.ts without Firestore.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../environments/firebase-init';

/** One availability window: weekdays (1=Mon … 7=Sun), HH:MM bounds, slot length. */
export interface AvailabilityWindow {
  days: number[];
  start: string;
  end: string;
  minutes: number;
}

/** Default: weekdays 09:00–17:00, 60-minute slots. */
export const DEFAULT_AVAILABILITY: AvailabilityWindow[] = [
  { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', minutes: 60 },
];

export type AppointmentStatus = 'pending' | 'approved' | 'declined' | 'cancelled';

export interface Appointment {
  id: string;
  clientUid: string;
  clientEmail: string | null;
  therapistUid: string;
  therapistEmail: string | null;
  /** naive local ISO: YYYY-MM-DDTHH:mm */
  start: string;
  end: string;
  status: AppointmentStatus;
  createdAt: string;
  accessGranted?: boolean;
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
  if (h < 0 || h > 24 || min < 0 || min > 59) return -1;
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

/** Local weekday (1=Mon … 7=Sun) for a YYYY-MM-DD string. */
export function weekdayOf(dateISO: string): number {
  const d = new Date(`${dateISO}T00:00:00`);
  if (isNaN(d.getTime())) return 0;
  const js = d.getDay(); // 0=Sun … 6=Sat
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
    const minutes = w.minutes > 0 ? w.minutes : 60;
    if (start < 0 || end <= start) continue;
    for (let t = start; t + minutes <= end; t += minutes) {
      out.push(`${dateISO}T${minutesToHM(t)}`);
    }
  }
  return out.sort();
}

/**
 * Free slots for a date: generated slots minus
 *   - slots overlapping a pending/approved appointment, and
 *   - slots that already started (relative to `now`).
 */
export function freeSlots(
  availability: AvailabilityWindow[],
  booked: BusyInterval[],
  dateISO: string,
  now: Date = new Date(),
): string[] {
  const busy = (booked || []).filter(b => b && (b.status === 'pending' || b.status === 'approved'));
  return slotsForDate(availability, dateISO).filter(slot => {
    const startAt = new Date(slot);
    if (!isNaN(startAt.getTime()) && startAt.getTime() <= now.getTime()) return false;
    const slotEndISO = endOfSlot(slot, availability);
    return !busy.some(b => overlaps(slot, slotEndISO, b.start, b.end));
  });
}

/** End time of a generated slot, given the availability it came from. */
export function endOfSlot(slotISO: string, availability: AvailabilityWindow[]): string {
  const dateISO = slotISO.slice(0, 10);
  const day = weekdayOf(dateISO);
  const startMin = parseHM(slotISO.slice(11));
  let minutes = 60;
  for (const w of availability) {
    if ((w.days || []).includes(day)) {
      const wStart = parseHM(w.start);
      const wMinutes = w.minutes > 0 ? w.minutes : 60;
      // The slot belongs to the window whose grid contains its start.
      if (wStart >= 0 && (startMin - wStart) % wMinutes === 0) {
        minutes = wMinutes;
        break;
      }
    }
  }
  return `${dateISO}T${minutesToHM(startMin + minutes)}`;
}

/** Next `days` dates (starting tomorrow) whose weekday has availability. */
export function bookableDays(
  availability: AvailabilityWindow[],
  from: Date = new Date(),
  days: number = 14,
): string[] {
  const enabled = new Set<number>();
  for (const w of availability) for (const d of w.days || []) enabled.add(d);
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

/** End of a slot the client is about to book (uses DEFAULT grid fallback). */
export function slotEnd(slotISO: string, minutes = 60): string {
  return `${slotISO.slice(0, 10)}T${minutesToHM(parseHM(slotISO.slice(11)) + minutes)}`;
}

// ---------------------------------------------------------------------------
// Firestore operations
// ---------------------------------------------------------------------------

function normalizeAvailability(raw: unknown): AvailabilityWindow[] {
  if (!Array.isArray(raw)) return DEFAULT_AVAILABILITY;
  if (raw.length === 0) return [];
  return raw
    .filter((w): w is AvailabilityWindow => !!w && typeof w === 'object')
    .map(w => ({
      days: Array.isArray(w.days) ? w.days : [],
      start: typeof w.start === 'string' ? w.start : '09:00',
      end: typeof w.end === 'string' ? w.end : '17:00',
      minutes: typeof w.minutes === 'number' && w.minutes > 0 ? w.minutes : 60,
    }))
    .filter(w => w.days.length > 0);
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
  await setDoc(doc(db, 'therapists', therapistUid), { email, availability }, { merge: true });
}

function toAppointment(id: string, data: Record<string, unknown>): Appointment {
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
  const snap = await getDoc(appointmentRef);
  if (!snap.exists()) throw new Error('Appointment not found');
  const data = snap.data();
  const batch = writeBatch(db);
  batch.update(appointmentRef, { status });

  if (status === 'declined' || status === 'cancelled') {
    const busyRef = doc(db, 'therapistBusySlots', therapistBusySlotId(String(data.therapistUid), String(data.start)));
    const busySnap = await getDoc(busyRef);
    if (busySnap.exists() && busySnap.data().appointmentId === id) batch.delete(busyRef);
  }
  await batch.commit();
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
  start: string;
  end: string;
}): Promise<string> {
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
