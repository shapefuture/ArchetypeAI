// Round 26 probe (critic), emulator + the real client code. The consent text (src/parts-cartographer/i18n/strings.ts
// bookingShareConsent) says "I can cancel to revoke access". The last commit's model (booking.ts nextActiveAppointmentId /
// keepBookingAccess) says "an approved booking long past no longer counts as open": the app never moves the share to one.
// But the new second allow update on clientShares (firestore.rules) lets the therapist point the share at ANY pending or
// approved appointment with that client, with no date check. So after the client cancels the booking that carried access,
// the therapist can re-point the share at an old approved booking the app treats as closed, and read the saved history again.
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
import { revokeTherapistAccess } from './therapist-link';

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
const FUTURE_START = `${YEAR + 1}-11-03T10:00`;
const FUTURE_END = `${YEAR + 1}-11-03T11:00`;

describe.skipIf(!EMULATOR)('round26: a therapist cannot re-grant access through a booking the app treats as closed', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round26b', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  // OLD is approved and from last year: the app's own model never closes it, and never moves access to it.
  // NOW is the booking that carries access. FUTURE is an approved booking the client has not cancelled, in the future.
  async function seedBookings(withFuture: boolean) {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'appointments', 'appt_old'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: OLD_START, end: OLD_END, status: 'approved', createdAt: '2026-02-20T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'appointments', 'appt_now'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: NOW_START, end: NOW_END, status: 'pending', createdAt: '2026-10-20T10:00:00.000Z', accessGranted: true,
      });
      if (withFuture) {
        await setDoc(doc(db, 'appointments', 'appt_future'), {
          clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
          start: FUTURE_START, end: FUTURE_END, status: 'approved', createdAt: '2026-10-21T10:00:00.000Z', accessGranted: true,
        });
      }
      await setDoc(doc(db, 'therapistBusySlots', `${T}_${NOW_START}`), {
        therapistUid: T, appointmentId: 'appt_now', start: NOW_START, end: NOW_END,
      });
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

  const therapistReadsHistory = () => getDoc(doc(asUser(T, TEMAIL), 'users', C, 'history', 'h1'));
  const therapistPointsShareAt = (appointmentId: string) => setDoc(
    doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`),
    { appointmentId, grantedAt: '2026-10-26T09:00:00.000Z' },
    { merge: true },
  );

  it('control: the therapist cannot read the saved history once the client cancels the only carrying booking', async () => {
    await seedBookings(false);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    await assertFails(therapistReadsHistory());
  });

  it('control: the app itself does not move access to the long-past approved booking when the client cancels', async () => {
    await seedBookings(false);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    const share = await getDoc(doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`));
    expect(share.data()?.appointmentId).toBe('appt_now');
  });

  it('control: the therapist can re-point the share at a booking that is still in the future and open', async () => {
    await seedBookings(true);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    // The client-side path already moves the share here, so this is the designed behaviour.
    await assertSucceeds(therapistPointsShareAt('appt_future'));
  });

  it('the therapist cannot point the share at the long-past approved booking after the client cancelled the carrying one', async () => {
    // Expected by the app model (approved long past does not count as open) and the consent text (cancelling revokes).
    // Actual on 8c77953: firestore.rules hasActiveAppointment() accepts any approved appointment, so the write succeeds.
    await seedBookings(false);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    await assertFails(therapistPointsShareAt('appt_old'));
  });

  it('control: the client full revoke (revokeTherapistAccess) deletes the share, so the therapist cannot re-point it', async () => {
    await seedBookings(false);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    await revokeTherapistAccess(C);
    await assertFails(therapistPointsShareAt('appt_old'));
  });

  it('control: the app path (therapist declines the carrying booking) does not move access to the long-past approved booking', async () => {
    await seedBookings(false);
    state.db = asUser(T, TEMAIL);
    await setAppointmentStatus('appt_now', 'declined', 'therapist');
    const share = await getDoc(doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`));
    expect(share.data()?.appointmentId).toBe('appt_now');
    await assertFails(therapistReadsHistory());
  });

  it('after that re-point the therapist reads the saved history the client had revoked', async () => {
    await seedBookings(false);
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_now', 'cancelled', 'client');
    await therapistPointsShareAt('appt_old').catch(() => undefined);
    await assertFails(therapistReadsHistory());
  });
});
