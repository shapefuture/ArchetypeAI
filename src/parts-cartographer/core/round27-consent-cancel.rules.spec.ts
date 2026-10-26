// Round 27 probe (critic), emulator + the real client code (setAppointmentStatus in booking.ts).
// Consent copy: bookingShareConsent (src/parts-cartographer/i18n/strings.ts:400) says "I can cancel to revoke access";
// the Russian copy says "Отмена записи отзывает доступ" (cancelling the booking revokes access).
// Claim under test: when the client cancels the booking that carries the therapist's share, and another pending or
// approved booking with the same therapist exists, keepBookingAccess re-points the share at that other booking, so the
// therapist keeps reading the saved history after the cancel the copy says revokes access. Nothing on the cancel path
// tells the client that access continues. The first control shows the copy holds when there is no second booking.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertFails,
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
const B_START = `${YEAR + 1}-11-20T10:00`;
const B_END = `${YEAR + 1}-11-20T11:00`;
const CREATED = '2026-10-20T10:00:00.000Z';

describe.skipIf(!EMULATOR)('round27: cancelling the booking that carries access revokes the therapist read', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round27a', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  // A is the booking that carries access (pending, the newest). B is a second open booking with the same therapist.
  async function seedBookings(withSecond: boolean) {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'appointments', 'appt_a'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: A_START, end: A_END, status: 'pending', createdAt: CREATED, accessGranted: true,
      });
      if (withSecond) {
        await setDoc(doc(db, 'appointments', 'appt_b'), {
          clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
          start: B_START, end: B_END, status: 'approved', createdAt: '2026-10-10T10:00:00.000Z', accessGranted: true,
        });
        await setDoc(doc(db, 'therapistBusySlots', `${T}_${B_START}`), {
          therapistUid: T, appointmentId: 'appt_b', start: B_START, end: B_END,
        });
      }
      await setDoc(doc(db, 'therapistBusySlots', `${T}_${A_START}`), {
        therapistUid: T, appointmentId: 'appt_a', start: A_START, end: A_END,
      });
      await setDoc(doc(db, 'clientShares', `${T}_${C}`), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, grantedAt: CREATED, source: 'booking', appointmentId: 'appt_a',
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: CREATED, source: 'booking', appointmentId: 'appt_a',
      });
      await setDoc(doc(db, 'users', C, 'history', 'h1'), {
        schema: 'parts-cartographer.v1', profile: { headlineConstellation: 'saved report' }, parts: [],
        createdAt: '2026-02-01T10:00:00.000Z', updatedAt: '2026-02-01T10:00:00.000Z',
      });
    });
  }

  const therapistReadsHistory = () => getDoc(doc(asUser(T, TEMAIL), 'users', C, 'history', 'h1'));

  it('control: with one booking only, the client cancel leaves the therapist unable to read the saved history', async () => {
    await seedBookings(false);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_a', 'cancelled', 'client');
    await assertFails(therapistReadsHistory());
  });

  it('control: with a second open booking, the app moves the share to it (the designed behaviour)', async () => {
    await seedBookings(true);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_a', 'cancelled', 'client');
    const share = await getDoc(doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`));
    expect(share.data()?.appointmentId).toBe('appt_b');
  });

  // The consent copy now says access continues through another open appointment, so the read still succeeds.
  it('after the client cancels the booking that carries access, the therapist keeps reading through the open booking B', async () => {
    await seedBookings(true);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_a', 'cancelled', 'client');
    await assertSucceeds(therapistReadsHistory());
  });
});
