// Round 26 probe (critic), emulator + the real client code (setAppointmentStatus in booking.ts).
// Defect: keepBookingAccess has the therapist actor move clientShares/{T}_{C} to the other open booking, but it deliberately
// leaves therapistClients/{T}_{C} pointing at the closed appointment ("Only the client may change the roster row").
// firestore.rules hasTrustedTherapistClientLink() requires the roster's appointmentId to equal the share's appointmentId
// (hasValidBookingShare), and the assignments create rule relies on it. So after a therapist decline, the share is valid for
// reads but every practice assignment to that client is refused.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { setAppointmentStatus } from './booking';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist';
const TEMAIL = 'therapist@example.com';
const C = 'uid_client';
const CEMAIL = 'client@example.com';
const YEAR = new Date().getUTCFullYear();
const A_START = `${YEAR + 1}-11-05T10:00`;
const A_END = `${YEAR + 1}-11-05T11:00`;
const B_START = `${YEAR + 1}-11-06T10:00`;
const B_END = `${YEAR + 1}-11-06T11:00`;
const CREATED = '2026-10-20T10:00:00.000Z';

describe.skipIf(!EMULATOR)('round26: the roster row follows the booking share after a therapist decline', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round26a', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  // Two open bookings with T. A (the one carrying access) is the newest; B is approved and in the future.
  async function seedTwoBookings() {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'appointments', 'appt_a'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: A_START, end: A_END, status: 'pending', createdAt: CREATED, accessGranted: true,
      });
      await setDoc(doc(db, 'appointments', 'appt_b'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: B_START, end: B_END, status: 'approved', createdAt: '2026-10-01T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'therapistBusySlots', `${T}_${A_START}`), {
        therapistUid: T, appointmentId: 'appt_a', start: A_START, end: A_END,
      });
      // The state createBooking writes: share and roster both point at the newest booking.
      await setDoc(doc(db, 'clientShares', `${T}_${C}`), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, grantedAt: CREATED, source: 'booking', appointmentId: 'appt_a',
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: CREATED, source: 'booking', appointmentId: 'appt_a',
      });
    });
  }

  const assignPractice = (db: Firestore) => setDoc(doc(db, 'assignments', 'asg_1'), {
    id: 'asg_1', therapistUid: T, clientUid: C, exerciseId: 'breath-pause', frequency: 'daily', assignedAt: '2026-10-26T09:00:00.000Z',
  });

  it('the therapist decline moves the booking share to the other open booking', async () => {
    await seedTwoBookings();
    state.db = asUser(T, TEMAIL);
    await setAppointmentStatus('appt_a', 'declined', 'therapist');
    const share = await getDoc(doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`));
    expect(share.data()?.appointmentId).toBe('appt_b');
  });

  it('control: after the client cancels the carrying booking, the therapist can assign a practice', async () => {
    await seedTwoBookings();
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_a', 'cancelled', 'client');
    await assertSucceeds(assignPractice(asUser(T, TEMAIL)));
  });

  it('control: with the roster row naming the same booking as the share, the same assignment succeeds (the roster is the cause)', async () => {
    await seedTwoBookings();
    state.db = asUser(T, TEMAIL);
    await setAppointmentStatus('appt_a', 'declined', 'therapist');
    await seed(async (db) => {
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), { appointmentId: 'appt_b' }, { merge: true });
    });
    await assertSucceeds(assignPractice(asUser(T, TEMAIL)));
  });

  it('after the therapist cancels the approved carrying booking, the therapist can still assign a practice to the client', async () => {
    // Same root cause on the therapist's cancel path (approved -> cancelled).
    await seedTwoBookings();
    await seed(async (db) => {
      await setDoc(doc(db, 'appointments', 'appt_a'), { status: 'approved' }, { merge: true });
    });
    state.db = asUser(T, TEMAIL);
    await setAppointmentStatus('appt_a', 'cancelled', 'therapist');
    await assertSucceeds(assignPractice(asUser(T, TEMAIL)));
  });

  it('after the therapist declines the carrying booking, the therapist can still assign a practice to the client', async () => {
    // Expected: the share now names appt_b (approved), and the roster row describes the same access.
    // Actual on ba7c5bb: the roster row still names the declined appt_a, so hasTrustedTherapistClientLink() is false.
    await seedTwoBookings();
    state.db = asUser(T, TEMAIL);
    await setAppointmentStatus('appt_a', 'declined', 'therapist');
    await assertSucceeds(assignPractice(asUser(T, TEMAIL)));
  });
});
