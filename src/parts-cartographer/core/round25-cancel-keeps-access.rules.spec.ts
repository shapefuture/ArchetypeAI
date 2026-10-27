// Round 25 probe (critic), emulator + the real client code. The consent screen says: "I can cancel to revoke access" and
// "Cancelling revokes access" (src/parts-cartographer/i18n/strings.ts bookingShareConsent; src/shared/i18n/strings.ts).
// setAppointmentStatus -> keepBookingAccess (booking.ts) repoints the booking share to ANY other pending or approved
// appointment with the therapist, with no date check. An approved appointment from months ago never closes (the model has
// no "completed" status), so cancelling the newest booking leaves the therapist able to read the client's saved history.
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
const NOW_START = `${YEAR + 1}-11-05T10:00`;
const NOW_END = `${YEAR + 1}-11-05T11:00`;
const OLD_START = `${YEAR - 1}-03-02T10:00`;
const OLD_END = `${YEAR - 1}-03-02T11:00`;

describe.skipIf(!EMULATOR)('round25: cancelling the booking that carries a therapist access', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round25', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  async function seedBookings(withPastApproved: boolean) {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      if (withPastApproved) {
        // An approved booking whose date has passed. The Cabinet still lists it as approved with a Cancel button
        // (cabinet.jsx), and the model has no completed status, so the rules keep it active.
        await setDoc(doc(db, 'appointments', 'appt_past'), {
          clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
          start: OLD_START, end: OLD_END, status: 'approved', createdAt: '2026-02-20T10:00:00.000Z', accessGranted: true,
        });
      }
      await setDoc(doc(db, 'appointments', 'appt_now'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: NOW_START, end: NOW_END, status: 'pending', createdAt: '2026-10-20T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'therapistBusySlots', `${T}_${NOW_START}`), {
        therapistUid: T, appointmentId: 'appt_now', start: NOW_START, end: NOW_END,
      });
      // The share points at the newest booking, as createBooking writes it.
      await setDoc(doc(db, 'clientShares', `${T}_${C}`), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, grantedAt: '2026-10-20T10:00:00.000Z', source: 'booking', appointmentId: 'appt_now',
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: '2026-10-20T10:00:00.000Z', source: 'booking', appointmentId: 'appt_now',
      });
      await setDoc(doc(db, 'users', C, 'history', 'h1'), {
        schema: 'parts-cartographer.v1', profile: { headlineConstellation: 'saved report' }, parts: [],
        createdAt: '2026-02-01T10:00:00.000Z', updatedAt: '2026-02-01T10:00:00.000Z',
      });
    });
  }

  const therapistReadsHistory = async () => {
    const therapistDb = asUser(T, TEMAIL);
    await getDoc(doc(therapistDb, 'users', C, 'history', 'h1'));
  };

  it('control: before the cancel the therapist reads the saved history', async () => {
    await seedBookings(true);
    await assertSucceeds(therapistReadsHistory());
  });

  it('control: with no other booking, cancelling the only booking ends the therapist read', async () => {
    await seedBookings(false);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    await assertFails(therapistReadsHistory());
  });

  it('control: pointing the share at the still-approved older booking restores the therapist read', async () => {
    await seedBookings(false);
    await seed(async (db) => {
      await setDoc(doc(db, 'appointments', 'appt_older'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: `${YEAR + 1}-11-03T10:00`, end: `${YEAR + 1}-11-03T11:00`, status: 'approved', createdAt: '2026-10-01T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'appointments', 'appt_now'), { status: 'declined' }, { merge: true });
      await setDoc(doc(db, 'clientShares', `${T}_${C}`), { appointmentId: 'appt_older' }, { merge: true });
    });
    await assertSucceeds(therapistReadsHistory());
  });

  it('the therapist declining the newest booking keeps the read that the still-approved older booking grants', async () => {
    // Same consent text ("while this appointment is pending or approved"). Here the older booking is in the future and
    // approved; the therapist declines the newer pending one, and the share moves to the approved one.
    await seedBookings(false);
    await seed(async (db) => {
      await setDoc(doc(db, 'appointments', 'appt_older'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: `${YEAR + 1}-11-03T10:00`, end: `${YEAR + 1}-11-03T11:00`, status: 'approved', createdAt: '2026-10-01T10:00:00.000Z', accessGranted: true,
      });
    });
    state.db = asUser(T, TEMAIL);
    await setAppointmentStatus('appt_now', 'declined', 'therapist');
    const share = await getDoc(doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`));
    expect(share.data()?.appointmentId).toBe('appt_older');
    await assertSucceeds(therapistReadsHistory());
  });

  it('cancelling the newest booking ends the therapist read even when an approved booking from March exists', async () => {
    await seedBookings(true);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    // Diagnostic (passes): the share stays on the cancelled booking, since the March appointment is long past and is not repointed to.
    const share = await getDoc(doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`));
    expect(share.data()?.appointmentId).toBe('appt_now');
    // Expected by the consent text ("Cancelling revokes access"): the therapist can no longer read the saved history.
    await assertFails(therapistReadsHistory());
  });
});
