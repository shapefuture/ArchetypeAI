// Round 25 probe (critic), emulator + the real client code: the 24th pass says a cancel releases only the lock that names
// the cancelled appointment, and a client can still revoke access by cancelling while another booking holds the lock at
// the same start. These are the controls for that claim (they are expected to pass). Also: a cancel must still be refused
// while the lock names the cancelled appointment itself and the lock is left in place.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { setAppointmentStatus } from './booking';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist';
const TEMAIL = 'therapist@example.com';
const C1 = 'uid_client_one';
const C2 = 'uid_client_two';
const YEAR = new Date().getUTCFullYear();
const START = `${YEAR + 1}-11-05T10:00`;
const END = `${YEAR + 1}-11-05T11:00`;

describe.skipIf(!EMULATOR)('round25: a cancel releases only its own slot lock', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round25-lock', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      // Appointment A: a pre-migration pending booking with no lock of its own.
      await setDoc(doc(db, 'appointments', 'appt_a'), {
        clientUid: C1, clientEmail: 'one@example.com', therapistUid: T, therapistEmail: TEMAIL,
        start: START, end: END, status: 'pending', createdAt: '2026-10-20T10:00:00.000Z', accessGranted: true,
      });
      // Appointment B: a booking that holds the lock at the same start.
      await setDoc(doc(db, 'appointments', 'appt_b'), {
        clientUid: C2, clientEmail: 'two@example.com', therapistUid: T, therapistEmail: TEMAIL,
        start: START, end: END, status: 'pending', createdAt: '2026-10-21T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'therapistBusySlots', `${T}_${START}`), { therapistUid: T, appointmentId: 'appt_b', start: START, end: END });
    });
  });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();

  it('control: a client cancel of A succeeds while B holds the lock, and B keeps its lock', async () => {
    state.db = asUser(C1, 'one@example.com');
    await assertSucceeds(setAppointmentStatus('appt_a', 'cancelled', 'client'));
    const lock = await getDoc(doc(asUser(T, TEMAIL), 'therapistBusySlots', `${T}_${START}`));
    expect(lock.exists() && lock.data()?.appointmentId).toBe('appt_b');
  });

  it('control: a therapist decline of A succeeds while B holds the lock', async () => {
    state.db = asUser(T, TEMAIL);
    await assertSucceeds(setAppointmentStatus('appt_a', 'declined', 'therapist'));
    const lock = await getDoc(doc(asUser(T, TEMAIL), 'therapistBusySlots', `${T}_${START}`));
    expect(lock.exists() && lock.data()?.appointmentId).toBe('appt_b');
  });

  it('control: a client cannot cancel A while the lock names A and is left in place', async () => {
    // Re-create the lock for A, then try a raw cancel that keeps it: the rule must refuse.
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapistBusySlots', `${T}_${START}`), { therapistUid: T, appointmentId: 'appt_a', start: START, end: END });
    });
    const db = asUser(C1, 'one@example.com');
    await assertFails(updateDoc(doc(db, 'appointments', 'appt_a'), { status: 'cancelled' }));
  });

  it('control: a client cancel of B releases the lock B holds', async () => {
    state.db = asUser(C2, 'two@example.com');
    await assertSucceeds(setAppointmentStatus('appt_b', 'cancelled', 'client'));
    const lock = await getDoc(doc(asUser(T, TEMAIL), 'therapistBusySlots', `${T}_${START}`));
    expect(lock.exists()).toBe(false);
  });
});
