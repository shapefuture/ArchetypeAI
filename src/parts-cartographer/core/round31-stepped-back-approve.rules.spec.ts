// Round 31 probe (critic), emulator + the real client code: createBooking(), stopBeingTherapist() (user-directory.ts) and
// setAppointmentStatus() (booking.ts).
// firestore.rules says a therapist who stepped back (deleted their profile) loses their rights: "A therapist who stepped
// back (deleted their profile) loses these rights" (the roster and share gate, line 207), and "A stepped-back therapist
// (no therapist profile) moves nothing" (line 51). The appointments update rule for the therapist checks only
// therapistUid == auth.uid. It never checks the therapist profile, so the same therapist can still approve a pending request
// after stepping back, and the client is told the session is approved by a practitioner who has left the directory.
// Control: while the profile exists, the therapist approves the request. Expected (probe assertion): the approval is refused
// after the therapist steps back. Observed: it is accepted.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, type DocumentSnapshot, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { createBooking, setAppointmentStatus } from './booking';
import { stopBeingTherapist } from './user-directory';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist_r31s';
const TEMAIL = 'therapist-r31s@example.com';
const C = 'uid_client_r31s';
const CEMAIL = 'client-r31s@example.com';

/** A slot `days` out at 10:00 in the therapist's wall clock. */
function slotIn(days: number): { start: string; end: string } {
  const day = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  return { start: `${day}T10:00`, end: `${day}T11:00` };
}

describe.skipIf(!EMULATOR)('round31: a therapist who stepped back cannot decide a pending request', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-r31-stepback', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'therapists', T), { email: TEMAIL, availability: [] });
    });
    state.db = asUser(C, CEMAIL);
  });

  it('control: while the profile exists, the therapist approves a pending request', async () => {
    const id = await createBooking({ clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL, ...slotIn(10) });
    state.db = asUser(T, TEMAIL);
    await expect(setAppointmentStatus(id, 'approved', 'therapist')).resolves.toBeUndefined();
  });

  it('after stopping, the same therapist cannot approve a pending request', async () => {
    const id = await createBooking({ clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL, ...slotIn(11) });
    state.db = asUser(T, TEMAIL);
    await stopBeingTherapist({ uid: T, email: TEMAIL, emailVerified: true, linked: true, provider: 'email', displayName: null });
    // Precondition: the profile is gone, so the therapist has stepped back.
    let profile: DocumentSnapshot | undefined;
    await testEnv.withSecurityRulesDisabled(async (context) => { profile = await getDoc(doc(context.firestore(), 'therapists', T)); });
    expect(profile?.exists(), 'precondition: stopBeingTherapist removed the therapist profile').toBe(false);
    await expect(setAppointmentStatus(id, 'approved', 'therapist')).rejects.toThrow();
  });
});
