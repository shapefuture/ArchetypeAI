// Round 23 probe (critic): ensureTherapistBusySlots backfills a busy slot for every pending or approved appointment that has
// none. The busy-slot rule accepts only a day from yesterday on (firestore.rules validSlotRange), so a finished appointment's
// backfill is refused and the therapist dashboard reports an error on every load. A finished appointment needs no slot.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { batchSet, batchCommit } = vi.hoisted(() => ({ batchSet: vi.fn(), batchCommit: vi.fn(async () => undefined) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id })),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  writeBatch: vi.fn(() => ({ set: batchSet, commit: batchCommit })),
}));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));

import { ensureTherapistBusySlots } from './booking';

const THERAPIST = 'uid_therapist';
const YEAR = new Date().getUTCFullYear();

function appointment(id: string, start: string, end: string) {
  return { id, therapistUid: THERAPIST, status: 'pending', start, end } as any;
}

beforeEach(() => {
  batchSet.mockClear();
  batchCommit.mockClear();
});

describe('round23: the busy-slot backfill covers only days the busy-slot rule accepts', () => {
  it('control: a pending appointment on a future day is backfilled', async () => {
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_future', `${YEAR + 1}-10-05T10:00`, `${YEAR + 1}-10-05T11:00`)]);
    expect(batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_future' }));
    expect(batchCommit).toHaveBeenCalledTimes(1);
  });

  it('a pending appointment dated before yesterday gets no busy-slot write, so the rules never refuse the batch', async () => {
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_past', `${YEAR - 1}-10-05T10:00`, `${YEAR - 1}-10-05T11:00`)]);
    expect(batchSet).not.toHaveBeenCalled();
    expect(batchCommit).not.toHaveBeenCalled();
  });
});
