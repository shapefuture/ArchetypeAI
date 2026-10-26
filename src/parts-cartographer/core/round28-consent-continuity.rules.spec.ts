// Round 28 control (critic), emulator + the real createBooking() and setAppointmentStatus() (booking.ts, keepBookingAccess).
// Checks the booking consent copy (i18n bookingShareConsent): "Cancelling this appointment revokes that access; if another
// appointment with this therapist is still open, access continues through it." Each test is a control that should PASS
// on f0dec06: the share moves to the open appointment when the one carrying it closes, and access ends only when none is open.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { createBooking, setAppointmentStatus } from './booking';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist_consent';
const TEMAIL = 'therapist-consent@example.com';
const C = 'uid_client_consent';
const CEMAIL = 'client-consent@example.com';

/** A slot `days` out at 10:00 in the therapist's wall clock. */
function slotIn(days: number): { start: string; end: string } {
  const day = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  return { start: `${day}T10:00`, end: `${day}T11:00` };
}

describe.skipIf(!EMULATOR)('round28 control: the booking consent copy matches keepBookingAccess', () => {
  let testEnv: RulesTestEnvironment;
  let appointmentA = '';
  let appointmentB = '';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round28c', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'users', C, 'assessment', 'profile'), { testModel: 'angular-v2', updatedAt: '2026-10-20T10:00:00.000Z' });
    });
    const asClient = testEnv.authenticatedContext(C, { email: CEMAIL, email_verified: true }).firestore();
    state.db = asClient;
    appointmentA = await createBooking({ clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL, ...slotIn(10) });
    appointmentB = await createBooking({ clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL, ...slotIn(11) });
  });

  const therapistDb = (): Firestore => testEnv.authenticatedContext(T, { email: TEMAIL, email_verified: true }).firestore();
  // The share is read as the client, who may read their own grant (withSecurityRulesDisabled discards its callback's value).
  const shareOf = async (): Promise<unknown> => {
    const snap = await getDoc(doc(testEnv.authenticatedContext(C, { email: CEMAIL, email_verified: true }).firestore(), 'clientShares', `${T}_${C}`));
    return snap.data()?.appointmentId;
  };

  it('client cancels the appointment carrying access while another is open: the share moves to the open one and the therapist keeps reading', async () => {
    expect(await shareOf()).toBe(appointmentB);
    state.db = testEnv.authenticatedContext(C, { email: CEMAIL, email_verified: true }).firestore();
    await setAppointmentStatus(appointmentB, 'cancelled', 'client');
    expect(await shareOf()).toBe(appointmentA);
    await assertSucceeds(getDoc(doc(therapistDb(), 'users', C, 'assessment', 'profile')));
  });

  it('therapist declines the appointment carrying access while another is open: the share moves to the open one', async () => {
    state.db = testEnv.authenticatedContext(T, { email: TEMAIL, email_verified: true }).firestore();
    await setAppointmentStatus(appointmentB, 'declined', 'therapist');
    expect(await shareOf()).toBe(appointmentA);
  });

  it('once no other appointment is open, cancelling ends the therapist’s read of the saved profile', async () => {
    state.db = testEnv.authenticatedContext(C, { email: CEMAIL, email_verified: true }).firestore();
    await setAppointmentStatus(appointmentB, 'cancelled', 'client');
    await setAppointmentStatus(appointmentA, 'cancelled', 'client');
    await assertFails(getDoc(doc(therapistDb(), 'users', C, 'assessment', 'profile')));
  });
});
