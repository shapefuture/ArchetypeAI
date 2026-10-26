import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch, type Firestore } from 'firebase/firestore';

// Round 24: three rules facts the app relies on.
// - An appointment is released (cancelled or declined) when no slot lock names it, even if another booking holds a lock at
//   the same start. The lock check must not block a client from revoking access through a cancel.
// - A client's revoke batch deletes records; deleting a record another device already removed is a no-op, not an error.
// - A busy slot is written only for an appointment that starts and ends on one calendar day, end after start.

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const THERAPIST = 'uid_therapist';
const THERAPIST_EMAIL = 'therapist@example.com';
const C1 = 'uid_client_one';
const C2 = 'uid_client_two';
const YEAR = new Date().getUTCFullYear();
const START = `${YEAR + 1}-10-05T10:00`;
const END = `${YEAR + 1}-10-05T11:00`;
const LIVE_CODE = 'LIVECODE1';
const GONE_CODE = 'GONECODE2';
const ROSTER = `${THERAPIST}_${C2}`;

describe.skipIf(!EMULATOR)('round24: slot locks, revoke and busy-slot window (emulator)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round24', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  describe('an appointment that holds no slot lock of its own', () => {
    beforeEach(async () => {
      await seed(async (db) => {
        await setDoc(doc(db, 'therapists', THERAPIST), { email: THERAPIST_EMAIL });
        // Appointment A, written with no slot lock (legacy, or skipped by the backfill).
        await setDoc(doc(db, 'appointments', 'appt_a'), {
          clientUid: C1, clientEmail: 'one@example.com', therapistUid: THERAPIST, therapistEmail: THERAPIST_EMAIL,
          start: START, end: END, status: 'pending', createdAt: '2026-10-01T10:00:00.000Z', accessGranted: true,
        });
        await setDoc(doc(db, 'clientShares', `${THERAPIST}_${C1}`), {
          clientUid: C1, clientEmail: 'one@example.com', therapistUid: THERAPIST, grantedAt: '2026-10-01T10:00:00.000Z',
          source: 'booking', appointmentId: 'appt_a',
        });
        await setDoc(doc(db, 'users', C1, 'history', 'h1'), {
          schema: 'parts-cartographer.v1', profile: { headlineConstellation: 'x' }, parts: [],
          createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
        });
      });
    });

    /** Client two books the same start: the appointment and its slot lock in one batch. */
    async function bookSameStart(): Promise<void> {
      const db = asUser(C2, 'two@example.com');
      const batch = writeBatch(db);
      batch.set(doc(db, 'appointments', 'appt_b'), {
        clientUid: C2, clientEmail: 'two@example.com', therapistUid: THERAPIST, therapistEmail: THERAPIST_EMAIL,
        start: START, end: END, status: 'pending', createdAt: '2026-10-02T10:00:00.000Z', accessGranted: true,
      });
      batch.set(doc(db, 'therapistBusySlots', `${THERAPIST}_${START}`), {
        therapistUid: THERAPIST, appointmentId: 'appt_b', start: START, end: END,
      });
      await assertSucceeds(batch.commit());
    }

    it('control: client one cancels appointment A while no other lock sits at its start', async () => {
      await assertSucceeds(updateDoc(doc(asUser(C1, 'one@example.com'), 'appointments', 'appt_a'), { status: 'cancelled' }));
    });

    it('control: once client one cancels with no other lock, the therapist can no longer read her history', async () => {
      await assertSucceeds(updateDoc(doc(asUser(C1, 'one@example.com'), 'appointments', 'appt_a'), { status: 'cancelled' }));
      await assertFails(getDoc(doc(asUser(THERAPIST, THERAPIST_EMAIL), 'users', C1, 'history', 'h1')));
    });

    it('control: the holder of a slot lock cancels its own appointment with the lock release in the same batch', async () => {
      await bookSameStart();
      const db = asUser(C2, 'two@example.com');
      const batch = writeBatch(db);
      batch.update(doc(db, 'appointments', 'appt_b'), { status: 'cancelled' });
      batch.delete(doc(db, 'therapistBusySlots', `${THERAPIST}_${START}`));
      await assertSucceeds(batch.commit());
    });

    it('client one can cancel appointment A although another appointment holds the slot lock at the same start', async () => {
      await bookSameStart();
      await assertSucceeds(updateDoc(doc(asUser(C1, 'one@example.com'), 'appointments', 'appt_a'), { status: 'cancelled' }));
    });

    it('the therapist can decline appointment A although another appointment holds the slot lock at the same start', async () => {
      await bookSameStart();
      await assertSucceeds(updateDoc(doc(asUser(THERAPIST, THERAPIST_EMAIL), 'appointments', 'appt_a'), { status: 'declined' }));
    });

    it('after client one cancels while another lock sits at the start, the therapist can no longer read her history', async () => {
      await bookSameStart();
      await assertSucceeds(updateDoc(doc(asUser(C1, 'one@example.com'), 'appointments', 'appt_a'), { status: 'cancelled' }));
      await assertFails(getDoc(doc(asUser(THERAPIST, THERAPIST_EMAIL), 'users', C1, 'history', 'h1')));
    });
  });

  describe('a client revoke whose records were already removed on another device', () => {
    beforeEach(async () => {
      await seed(async (db) => {
        await setDoc(doc(db, 'therapistLinks', LIVE_CODE), { clientUid: C2, createdAt: '2026-10-01T10:00:00.000Z', summary: {}, claimedBy: THERAPIST });
        await setDoc(doc(db, 'therapistClients', ROSTER), { therapistUid: THERAPIST, clientUid: C2, clientEmail: 'two@example.com', linkedAt: '2026-10-01T10:00:00.000Z', source: 'booking', appointmentId: 'appt_1' });
        await setDoc(doc(db, 'clientShares', ROSTER), { clientUid: C2, clientEmail: 'two@example.com', therapistUid: THERAPIST, grantedAt: '2026-10-01T10:00:00.000Z', source: 'booking', appointmentId: 'appt_1' });
        await setDoc(doc(db, 'assignments', 'asg_1'), { id: 'asg_1', therapistUid: THERAPIST, clientUid: C2, exerciseId: 'breathing', frequency: 'once', assignedAt: '2026-10-01T10:00:00.000Z' });
        await setDoc(doc(db, 'shareCodes', 'livecode12ab'), { uid: C2, createdAt: '2026-10-01T10:00:00.000Z' });
      });
    });

    const asClient = (): Firestore => asUser(C2, 'two@example.com');

    /** The batch revokeTherapistAccess commits, built from a read taken before another device removed one record. */
    function revokeBatch(db: Firestore) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'therapistLinks', LIVE_CODE));
      batch.delete(doc(db, 'therapistClients', ROSTER));
      batch.delete(doc(db, 'clientShares', ROSTER));
      batch.delete(doc(db, 'assignments', 'asg_1'));
      return batch;
    }

    it('control: the client removes every record of a live revoke in one batch', async () => {
      await assertSucceeds(revokeBatch(asClient()).commit());
    });

    it('control: the client deletes a share code another device already removed', async () => {
      await assertSucceeds(deleteDoc(doc(asClient(), 'shareCodes', 'gonecode34cd')));
    });

    it('a single invite code another device already removed can be deleted again, as a no-op', async () => {
      await assertSucceeds(deleteDoc(doc(asClient(), 'therapistLinks', GONE_CODE)));
    });

    it('the revoke batch succeeds when one of its records was removed on another device after the read', async () => {
      await seed((db) => deleteDoc(doc(db, 'therapistClients', ROSTER)));
      await assertSucceeds(revokeBatch(asClient()).commit());
    });

    it('a stale clientShares delete of a removed share is a no-op', async () => {
      await seed((db) => deleteDoc(doc(db, 'clientShares', ROSTER)));
      await assertSucceeds(deleteDoc(doc(asClient(), 'clientShares', ROSTER)));
    });

    it('a stale therapistClients delete of a removed roster row is a no-op', async () => {
      await seed((db) => deleteDoc(doc(db, 'therapistClients', ROSTER)));
      await assertSucceeds(deleteDoc(doc(asClient(), 'therapistClients', ROSTER)));
    });

    it('a stale assignment delete of a removed practice is a no-op', async () => {
      await seed((db) => deleteDoc(doc(db, 'assignments', 'asg_1')));
      await assertSucceeds(deleteDoc(doc(asClient(), 'assignments', 'asg_1')));
    });
  });

  describe('the busy-slot window', () => {
    /** The batch the client backfills for one appointment with no slot yet (core/booking.ts ensureTherapistBusySlots). */
    async function backfill(start: string, end: string) {
      const therapist = asUser(THERAPIST, THERAPIST_EMAIL);
      const batch = writeBatch(therapist);
      batch.set(doc(therapist, 'therapistBusySlots', `${THERAPIST}_${start}`), { therapistUid: THERAPIST, appointmentId: 'appt', start, end });
      return batch.commit();
    }

    async function seedAppointment(start: string, end: string): Promise<void> {
      await seed(async (db) => {
        await setDoc(doc(db, 'therapists', THERAPIST), { email: THERAPIST_EMAIL });
        await setDoc(doc(db, 'appointments', 'appt'), {
          clientUid: C1, clientEmail: 'one@example.com', therapistUid: THERAPIST, therapistEmail: THERAPIST_EMAIL,
          start, end, status: 'pending', createdAt: '2026-10-01T10:00:00.000Z', accessGranted: true,
        });
      });
    }

    it('control: a backfill for a same-day appointment is accepted', async () => {
      const start = `${YEAR + 1}-10-05T23:00`;
      await seedAppointment(start, `${YEAR + 1}-10-05T23:59`);
      await assertSucceeds(backfill(start, `${YEAR + 1}-10-05T23:59`));
    });

    it('the rules refuse a backfill for an appointment that ends on the next day', async () => {
      const start = `${YEAR + 1}-10-05T23:30`;
      await seedAppointment(start, `${YEAR + 1}-10-06T00:30`);
      await assertFails(backfill(start, `${YEAR + 1}-10-06T00:30`));
    });

    it('the rules refuse a backfill for an appointment that ends before it starts', async () => {
      const start = `${YEAR + 1}-10-05T11:00`;
      await seedAppointment(start, `${YEAR + 1}-10-05T10:00`);
      await assertFails(backfill(start, `${YEAR + 1}-10-05T10:00`));
    });
  });
});
