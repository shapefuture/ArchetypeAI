// Round 28 probe (critic), emulator + the real therapist-link.ts linkedClients() (the therapist dashboard's client list).
// linkedClients() reads every invite row through getDoc, one per code the therapist claimed (therapist-link.ts, the
// `inviteRows` Promise.all). A single document read is refused by the rules once the invite code the row names is gone
// (firestore.rules therapistClients `allow get`, hasLiveInviteLink). Firestore rejects the whole read, so the Promise.all
// rejects and linkedClients() rejects with it. innerverse.jsx then sets clients to [] for every therapist, not just for the
// one client whose row broke.
// The client owns each code and the rules let the client delete any one of them (therapistLinks `allow delete`). The app
// deletes all codes at once (revokeTherapistAccess), so this state is reached through a single-code delete, not the UI.
// Expected: the other client's booking row still shows. Observed on f0dec06: the promise rejects.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { linkedClients } from './therapist-link';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist';
const TEMAIL = 'therapist@example.com';
const C = 'uid_client_codes';
const CEMAIL = 'codes@example.com';
const D = 'uid_client_booking';
const DEMAIL = 'booking@example.com';
const CODE_A = 'ROUNDA2345';
const CODE_B = 'ROUNDB2345';
const SUMMARY = { headline: 'Keeper', burden: 40, selfEnergy: 60, parts: {}, activeComplexes: [], copingStack: { l1: 'Keeper' }, adherence: { done: 1, skipped: 0 } };

describe.skipIf(!EMULATOR)('round28: one client deleting a code must not blank the therapist roster', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round28a', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  // Client C holds two live codes, both claimed by T. The roster row for T and C points at the second code (the claim
  // rewrites linkCode). Client D has an ordinary booking row with T.
  async function seedRoster() {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'therapistLinks', CODE_A), { clientUid: C, createdAt: '2026-10-19T10:00:00.000Z', summary: SUMMARY, claimedBy: T });
      await setDoc(doc(db, 'therapistLinks', CODE_B), { clientUid: C, createdAt: '2026-10-20T10:00:00.000Z', summary: SUMMARY, claimedBy: T });
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: '2026-10-20T10:00:00.000Z',
        source: 'invite', linkCode: CODE_B, summary: SUMMARY,
      });
      await setDoc(doc(db, 'appointments', 'appt_d'), {
        clientUid: D, clientEmail: DEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: '2030-11-05T10:00', end: '2030-11-05T11:00', status: 'pending', createdAt: '2026-10-21T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'clientShares', `${T}_${D}`), {
        clientUid: D, clientEmail: DEMAIL, therapistUid: T, grantedAt: '2026-10-21T10:00:00.000Z', source: 'booking', appointmentId: 'appt_d',
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${D}`), {
        therapistUid: T, clientUid: D, clientEmail: DEMAIL, linkedAt: '2026-10-21T10:00:00.000Z', source: 'booking', appointmentId: 'appt_d',
      });
    });
  }

  it('control: before any delete, the roster lists both clients', async () => {
    await seedRoster();
    state.db = asUser(T, TEMAIL);
    const rows = await linkedClients(T);
    expect(rows.map((row) => row.clientUid)).toEqual([D, C]);
  });

  it('the roster still loads after client C deletes the code its roster row names (client D must still be listed)', async () => {
    await seedRoster();
    // The client deletes one of their own codes (the rules allow it: therapistLinks allow delete, isOwner(clientUid)).
    await assertSucceeds(deleteDoc(doc(asUser(C, CEMAIL), 'therapistLinks', CODE_B)));
    state.db = asUser(T, TEMAIL);
    await expect(linkedClients(T)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ clientUid: D })]));
  });
});
