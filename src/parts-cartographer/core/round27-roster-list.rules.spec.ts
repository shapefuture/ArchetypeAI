// Round 27 probe (critic), emulator + the real therapist-link.ts linkedClients() (the therapist dashboard's client list).
// firestore.rules therapistClients read (lines 637-644) has a second clause that reads resource.data.source (and, for
// invite rows, resource.data.linkCode) with no query constraint on those fields. The list query the dashboard runs,
// where('therapistUid', '==', uid), is then rejected by the rules engine: "Property clientUid is undefined on object.
// for 'list' @ L638". A single document read by id is accepted (control), and so are the client's own list and the
// therapist's appointment and assignment lists (controls). The clause was added in 78649d1 (twentieth gauntlet pass);
// the rules at 78649d1^ pass the defect assertions. Set ROUND27_RULES to a rules file to run the same assertions against
// another revision, for example: ROUND27_RULES=<path to 78649d1^:firestore.rules>.
// innerverse.jsx (therapist refresh, Promise.allSettled) turns a rejected linkedClients() into setClients([]) and the
// therapistLoadFailed message, so the therapist sees no clients.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { linkedClients } from './therapist-link';

const RULES = readFileSync(process.env.ROUND27_RULES ?? resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist';
const TEMAIL = 'therapist@example.com';
const C = 'uid_client';
const CEMAIL = 'client@example.com';
const CREATED = '2026-10-20T10:00:00.000Z';

describe.skipIf(!EMULATOR)('round27: a therapist can list the roster rows the dashboard shows', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round27d', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  // One booking-sourced roster row, exactly as createBooking writes it, with the therapist profile present.
  async function seedOneRow() {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'appointments', 'appt_c'), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: '2030-11-05T10:00', end: '2030-11-05T11:00', status: 'pending', createdAt: CREATED, accessGranted: true,
      });
      await setDoc(doc(db, 'clientShares', `${T}_${C}`), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, grantedAt: CREATED, source: 'booking', appointmentId: 'appt_c',
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: CREATED, source: 'booking', appointmentId: 'appt_c',
      });
    });
  }

  it('control: the therapist can read the roster row by its document id', async () => {
    await seedOneRow();
    await assertSucceeds(getDoc(doc(asUser(T, TEMAIL), 'therapistClients', `${T}_${C}`)));
  });

  it('control: the client can list its own roster rows', async () => {
    await seedOneRow();
    await assertSucceeds(getDocs(query(collection(asUser(C, CEMAIL), 'therapistClients'), where('clientUid', '==', C))));
  });

  it('control: the therapist can list their own appointments and assignments', async () => {
    await seedOneRow();
    await assertSucceeds(getDocs(query(collection(asUser(T, TEMAIL), 'appointments'), where('therapistUid', '==', T))));
    await assertSucceeds(getDocs(query(collection(asUser(T, TEMAIL), 'assignments'), where('therapistUid', '==', T))));
  });

  // Expected: the therapist's roster list (the query behind linkedClients) returns the one row. Observed on 2991ad9: the rules
  // reject the query with permission-denied, "Property clientUid is undefined on object. for 'list' @ L638".
  it('the therapist can list their own booking roster rows (the query the dashboard runs)', async () => {
    await seedOneRow();
    const snap = await getDocs(query(collection(asUser(T, TEMAIL), 'therapistClients'),
      where('therapistUid', '==', T), where('source', '==', 'booking')));
    expect(snap.size).toBe(1);
  });

  // Invite rows are read through the therapist's live codes, so an unconstrained roster list stays refused by design.
  it('an unconstrained therapist roster list is refused once an invite row is on the roster', async () => {
    await seedOneRow();
    await seed(async (db) => {
      await setDoc(doc(db, 'therapistLinks', 'INVITE1234'), { clientUid: 'uid_invite', createdAt: CREATED, summary: {}, claimedBy: T });
      await setDoc(doc(db, 'therapistClients', `${T}_uid_invite`), {
        therapistUid: T, clientUid: 'uid_invite', clientEmail: 'invite@example.com', linkedAt: CREATED, source: 'invite', linkCode: 'INVITE1234', summary: {},
      });
    });
    await assertFails(getDocs(query(collection(asUser(T, TEMAIL), 'therapistClients'), where('therapistUid', '==', T))));
  });

  it('linkedClients shows an invite client through the therapist\'s live code, and drops the client once the code is removed', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'therapistLinks', 'INVITE1234'), { clientUid: C, createdAt: CREATED, summary: {}, claimedBy: T });
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: CREATED, source: 'invite', linkCode: 'INVITE1234', summary: {},
      });
    });
    state.db = asUser(T, TEMAIL);
    expect((await linkedClients(T)).map((client) => client.clientUid)).toEqual([C]);
    await seed((db) => deleteDoc(doc(db, 'therapistLinks', 'INVITE1234')));
    expect(await linkedClients(T)).toEqual([]);
  });

  // The dashboard path itself (innerverse.jsx refresh calls linkedClients(user.uid)).
  it('linkedClients resolves with the client the therapist has a booking with', async () => {
    await seedOneRow();
    state.db = asUser(T, TEMAIL);
    const rows = await linkedClients(T);
    expect(rows.map((row) => row.clientUid)).toEqual([C]);
  });
});
