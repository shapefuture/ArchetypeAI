// Round 24 probe (critic): ensureTherapistBusySlots compares appointment.start (a wall-clock string in the THERAPIST's zone,
// see the booking.ts header) with the UTC calendar date. For a therapist west of UTC, between the UTC midnight and their
// local midnight, the UTC date is already tomorrow, so a still-upcoming appointment on their local today is never backfilled.
// The busy-slot rule (firestore.rules validSlotRange) accepts that day, so the slot lock is simply missing.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { batchSet, batchCommit } = vi.hoisted(() => ({ batchSet: vi.fn(), batchCommit: vi.fn(async () => undefined) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id })),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  writeBatch: vi.fn(() => ({ set: batchSet, commit: batchCommit })),
}));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));

import { ensureTherapistBusySlots } from './booking';

const THERAPIST = 'uid_therapist';

function appointment(id: string, start: string, end: string) {
  return { id, therapistUid: THERAPIST, status: 'pending', start, end } as any;
}

beforeEach(() => {
  batchSet.mockClear();
  batchCommit.mockClear();
  vi.useFakeTimers({ toFake: ['Date'] });
});
afterEach(() => { vi.useRealTimers(); });

describe('round24: the busy-slot backfill uses the therapist-local day, not the UTC day', () => {
  it('control: the UTC day and the local day agree, and the appointment is backfilled', async () => {
    // 12:00 UTC on 25 Oct; a 22:00 slot on 25 Oct is ahead on both clocks.
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z'));
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_same_day', '2026-10-25T22:00', '2026-10-25T23:00')], 'UTC');
    expect(batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_same_day' }));
  });

  it('control: a future-day appointment is backfilled', async () => {
    vi.setSystemTime(new Date('2026-10-26T02:30:00Z'));
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_next_day', '2026-10-26T09:00', '2026-10-26T10:00')], 'UTC');
    expect(batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_next_day' }));
  });

  // New York is UTC-4 on 26 Oct 2026 (EDT). 02:30 UTC is 22:30 on 25 Oct locally; the 23:00 local slot is still ahead.
  it('a pending appointment still ahead on the therapist local clock is backfilled', async () => {
    vi.setSystemTime(new Date('2026-10-26T02:30:00Z'));
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_ny_tonight', '2026-10-25T23:00', '2026-10-25T23:50')], 'America/New_York');
    expect(batchSet, 'busy-slot writes for appt_ny_tonight').toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_ny_tonight' }));
  });
});
