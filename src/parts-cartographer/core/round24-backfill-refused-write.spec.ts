// Round 24 probe (critic): the round-23 comment on ensureTherapistBusySlots says the backfill "never sends a refused write". The
// busy-slot rule (firestore.rules validSlotRange) also requires end to fall on the same calendar day as start, end > start, and
// canonical YYYY-MM-DDTHH:MM times. The client filter checks only that start is today or later (booking.ts). A legacy pending
// appointment that ends after midnight is therefore written, the rule refuses the batch, and the therapist list load throws
// (overlays.jsx refreshAppointments awaits the backfill before setAppointments).
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

describe('round24: the busy-slot backfill writes only slots the busy-slot rule accepts', () => {
  it('control: a same-day future appointment is written', async () => {
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_same_day', `${YEAR + 1}-10-05T23:00`, `${YEAR + 1}-10-05T23:59`)]);
    expect(batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_same_day' }));
  });

  it('a future appointment that ends on the next calendar day is not written, since the rule refuses it', async () => {
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_cross_day', `${YEAR + 1}-10-05T23:30`, `${YEAR + 1}-10-06T00:30`)]);
    expect(batchSet, 'busy-slot writes for appt_cross_day').not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_cross_day' }));
  });

  it('a future appointment whose end is not after its start is not written, since the rule refuses it', async () => {
    await ensureTherapistBusySlots(THERAPIST, [appointment('appt_backwards', `${YEAR + 1}-10-05T11:00`, `${YEAR + 1}-10-05T10:00`)]);
    expect(batchSet, 'busy-slot writes for appt_backwards').not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ appointmentId: 'appt_backwards' }));
  });
});
