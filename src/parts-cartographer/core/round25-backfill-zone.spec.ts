// Round 25 probe (critic): ensureTherapistBusySlots takes "today" from its timeZone argument, which defaults to the
// DEVICE zone. The commit says the backfill uses the therapist's calendar day in their zone, but every caller omits the
// argument: innerverse.jsx:533 (therapist availability is fetched in the same Promise.allSettled), overlays.jsx:1139
// and overlays.jsx:1153. A therapist whose device zone is ahead of their availability zone loses the busy-slot lock of a
// slot that is still upcoming today, so another client can book that start.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { batchSet, batchCommit } = vi.hoisted(() => ({ batchSet: vi.fn(), batchCommit: vi.fn(async () => undefined) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id })),
  // The therapist's profile is saved with an availability zone; no busy-slot document exists yet.
  getDoc: vi.fn(async (ref: { collection: string; id: string }) => (ref.collection === 'therapists'
    ? { exists: () => true, id: ref.id, data: () => ({ email: null, availability: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', minutes: 60, timeZone: 'America/Los_Angeles' }] }) }
    : { exists: () => false })),
  writeBatch: vi.fn(() => ({ set: batchSet, commit: batchCommit })),
}));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));

import { ensureTherapistBusySlots } from './booking';

const THERAPIST = 'uid_therapist';
const ORIGINAL_TZ = process.env.TZ;

// 2026-10-26T20:00Z. In Los Angeles (UTC-7, DST still on) it is 13:00 on 26 Oct. In Tokyo (UTC+9) it is 05:00 on 27 Oct.
const NOW = new Date('2026-10-26T20:00:00Z');
// A pending legacy appointment at 15:00 wall-clock in the therapist's zone: two hours from now.
const UPCOMING = { id: 'appt_upcoming', therapistUid: THERAPIST, status: 'pending', start: '2026-10-26T15:00', end: '2026-10-26T16:00' } as any;

beforeEach(() => {
  batchSet.mockClear();
  batchCommit.mockClear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  if (ORIGINAL_TZ === undefined) delete process.env.TZ; else process.env.TZ = ORIGINAL_TZ;
});

describe('round25: the busy-slot backfill decides today in the therapist zone', () => {
  it('control: with the therapist zone passed, the upcoming slot gets its lock even when the device is in Tokyo', async () => {
    process.env.TZ = 'Asia/Tokyo';
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Tokyo');
    await ensureTherapistBusySlots(THERAPIST, [UPCOMING], 'America/Los_Angeles');
    expect(batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_upcoming' }));
  });

  it('control: the caller form writes the upcoming slot when the device is in the therapist zone', async () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles');
    await ensureTherapistBusySlots(THERAPIST, [UPCOMING]);
    expect(batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_upcoming' }));
  });

  it('the caller form (no zone argument, as innerverse.jsx:533 and overlays.jsx:1139 call it) writes the upcoming slot', async () => {
    process.env.TZ = 'Asia/Tokyo';
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Tokyo');
    await ensureTherapistBusySlots(THERAPIST, [UPCOMING]);
    expect(batchSet, 'busy-slot writes for appt_upcoming (therapist zone America/Los_Angeles, device Asia/Tokyo)')
      .toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_upcoming' }));
  });
});
