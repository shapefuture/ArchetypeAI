// Round 32 probe (critic), emulator + the real client code. firestore.rules says (therapistClients header): "A therapist/client
// roster row is valid only when backed by a booking share or a client-created invite code." The consent text says
// "Cancelling this appointment revokes that access". When the sole open booking is declined (therapist) or cancelled
// (client), setAppointmentStatus -> keepBookingAccess (booking.ts) finds no other open appointment and returns without
// touching the roster row. The row keeps source 'booking', the closed appointmentId and the client's clientEmail, and the
// rules still let the therapist list it (the list rule checks only therapistUid, exists(therapist) and source == 'booking')
// and read it. The therapist's "Мои клиенты" list then shows the client as a current client with a live booking link.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, where, type Firestore } from 'firebase/firestore';

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
const START = `${YEAR + 1}-11-05T10:00`;
const END = `${YEAR + 1}-11-05T11:00`;
const ROSTER_ID = `${T}_${C}`;

describe.skipIf(!EMULATOR)('round32: a closed sole booking leaves a roster row the therapist can still list', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-r32-roster', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  async function seedSoleBooking() {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'appointments', 'appt_sole'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: START, end: END, status: 'pending', createdAt: '2026-10-20T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'therapistBusySlots', `${T}_${START}`), {
        therapistUid: T, appointmentId: 'appt_sole', start: START, end: END,
      });
      await setDoc(doc(db, 'clientShares', ROSTER_ID), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, grantedAt: '2026-10-20T10:00:00.000Z', source: 'booking', appointmentId: 'appt_sole',
      });
      // As createBooking writes it: the roster row names the same booking and carries the client's email.
      await setDoc(doc(db, 'therapistClients', ROSTER_ID), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: '2026-10-20T10:00:00.000Z', source: 'booking', appointmentId: 'appt_sole',
      });
    });
  }

  // The same query linkedClients (therapist-link.ts) runs for the therapist's booking rows.
  const therapistBookingRowIds = async () => {
    const snap = await getDocs(query(collection(asUser(T, TEMAIL), 'therapistClients'),
      where('therapistUid', '==', T), where('source', '==', 'booking')));
    return snap.docs.map((entry) => entry.id);
  };

  it('control: while the booking is open the therapist lists the client', async () => {
    await seedSoleBooking();
    await assertSucceeds(therapistBookingRowIds());
    expect(await therapistBookingRowIds()).toContain(ROSTER_ID);
  });

  it('therapist declines the only booking: the client is no longer listed as a current client', async () => {
    await seedSoleBooking();
    state.db = asUser(T, TEMAIL);
    await setAppointmentStatus('appt_sole', 'declined', 'therapist');
    // Expected: no open booking backs the row, so it is not listed (roster-row header in firestore.rules).
    expect(await therapistBookingRowIds()).not.toContain(ROSTER_ID);
  });

  it('client cancels the only booking: the therapist can no longer read the client email from the roster row', async () => {
    await seedSoleBooking();
    state.db = asUser(C, CEMAIL);
    await setAppointmentStatus('appt_sole', 'cancelled', 'client');
    // Expected by the consent text ("Cancelling this appointment revokes that access"): the row is gone. The rules refuse a read
    // of a missing row (a permission error), which is the same outcome: no email reaches the therapist.
    let email: unknown;
    try {
      const row = await getDoc(doc(asUser(T, TEMAIL), 'therapistClients', ROSTER_ID));
      email = row.exists() ? row.data()?.clientEmail : undefined;
    } catch (error) {
      expect((error as { code?: string }).code).toBe('permission-denied');
    }
    expect(email).toBeUndefined();
  });
});
