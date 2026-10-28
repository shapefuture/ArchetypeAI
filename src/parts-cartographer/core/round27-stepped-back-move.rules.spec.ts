// Round 27 probe (critic), emulator only (no app code). firestore.rules states that a therapist who stepped back (deleted
// their therapist profile) loses these rights: line 181 ("loses these rights", the trusted-link rights) and line 199 ("loses
// booking-based reads too"). The round-26 clientShares and therapistClients update rules (lines 622-630 and 670-679) check
// hasOpenBooking() but not exists(/therapists/{uid}). So a stepped-back therapist can still re-point the booking share and
// the roster row at another open booking with the client. Reads stay closed (control), so the gap is a write right the
// stated model says the therapist lost.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

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

describe.skipIf(!EMULATOR)('round27: a therapist who stepped back cannot move the booking grant', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round27b', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  // The therapist profile is deliberately NOT seeded: T has stepped back. A is pending and carries the share; B is approved and open.
  async function seedSteppedBack() {
    await seed(async (db) => {
      await setDoc(doc(db, 'appointments', 'appt_a'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: A_START, end: A_END, status: 'pending', createdAt: CREATED, accessGranted: true,
      });
      await setDoc(doc(db, 'appointments', 'appt_b'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: B_START, end: B_END, status: 'approved', createdAt: '2026-10-10T10:00:00.000Z', accessGranted: true,
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

  it('control: a stepped-back therapist cannot read the client history through the share', async () => {
    await seedSteppedBack();
    await assertFails(getDoc(doc(asUser(T, TEMAIL), 'users', C, 'history', 'h1')));
  });

  it('control: a stepped-back therapist cannot assign a practice to the client', async () => {
    await seedSteppedBack();
    await assertFails(setDoc(doc(asUser(T, TEMAIL), 'assignments', 'asg_1'), {
      id: 'asg_1', therapistUid: T, clientUid: C, exerciseId: 'breath-pause', frequency: 'daily', assignedAt: '2026-10-26T09:00:00.000Z',
    }));
  });

  it('control: an active therapist (profile present) may re-point the same share at B', async () => {
    await seedSteppedBack();
    await seed((db) => setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] }));
    await assertSucceeds(setDoc(
      doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`),
      { appointmentId: 'appt_b', grantedAt: '2026-10-26T09:00:00.000Z' },
      { merge: true },
    ));
  });

  // Expected by firestore.rules:181 and 199: a stepped-back therapist holds no booking-based rights. Observed on 44f85d5: the
  // share update is accepted, because hasOpenBooking() does not test exists(/therapists/{uid}).
  it('a stepped-back therapist cannot re-point the booking share at the open booking B', async () => {
    await seedSteppedBack();
    await assertFails(setDoc(
      doc(asUser(T, TEMAIL), 'clientShares', `${T}_${C}`),
      { appointmentId: 'appt_b', grantedAt: '2026-10-26T09:00:00.000Z' },
      { merge: true },
    ));
  });

  // Same gap on the roster row the therapist's assignments are checked against.
  it('a stepped-back therapist cannot re-point the roster row at the open booking B', async () => {
    await seedSteppedBack();
    await assertFails(setDoc(
      doc(asUser(T, TEMAIL), 'therapistClients', `${T}_${C}`),
      { appointmentId: 'appt_b', linkedAt: '2026-10-26T09:00:00.000Z' },
      { merge: true },
    ));
  });
});
