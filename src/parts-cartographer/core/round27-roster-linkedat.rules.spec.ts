// Round 27 probe (critic), emulator + the real therapist-link.ts linkedClients().
// Round 27 probe (critic), emulator only. The therapist update rule for a booking roster row (firestore.rules:671-679)
// restricts the changed keys to appointmentId and linkedAt, but unlike the client booking branch (firestore.rules:714)
// and the invite branch (firestore.rules:699) it does not require request.resource.data.linkedAt to be a string. The
// therapist may therefore store a number there. Downstream, linkedClients() in therapist-link.ts sorts on
// (b.linkedAt || '').localeCompare(...), which throws on a number (not reproduced end to end: see round27-roster-list).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, type Firestore } from 'firebase/firestore';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist';
const TEMAIL = 'therapist@example.com';
const C_NUM = 'uid_a_client';
const C_OK = 'uid_z_client';
const CEMAIL = 'client@example.com';
const YEAR = new Date().getUTCFullYear();
const A_START = `${YEAR + 1}-11-05T10:00`;
const A_END = `${YEAR + 1}-11-05T11:00`;
const CREATED = '2026-10-20T10:00:00.000Z';

describe.skipIf(!EMULATOR)('round27: the therapist can only write a string linkedAt on a booking roster row', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round27c', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (write: (db: Firestore) => Promise<unknown>) =>
    testEnv.withSecurityRulesDisabled(async (context) => { await write(context.firestore()); });

  async function seedRoster(client: string) {
    await seed(async (db) => {
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      const appointmentId = `appt_${client}`;
      await setDoc(doc(db, 'appointments', appointmentId), {
        clientUid: client, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL,
        start: A_START, end: A_END, status: 'pending', createdAt: CREATED, accessGranted: true,
      });
      await setDoc(doc(db, 'clientShares', `${T}_${client}`), {
        clientUid: client, clientEmail: CEMAIL, therapistUid: T, grantedAt: CREATED, source: 'booking', appointmentId,
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${client}`), {
        therapistUid: T, clientUid: client, clientEmail: CEMAIL, linkedAt: CREATED, source: 'booking', appointmentId,
      });
    });
  }

  it('control: the therapist can write a string linkedAt on the booking roster row', async () => {
    await seedRoster(C_OK);
    await assertSucceeds(setDoc(
      doc(asUser(T, TEMAIL), 'therapistClients', `${T}_${C_OK}`),
      { linkedAt: '2026-10-26T09:00:00.000Z' },
      { merge: true },
    ));
  });

  it('control: the client cannot write a numeric linkedAt on its own booking roster row', async () => {
    await seedRoster(C_OK);
    await assertFails(setDoc(
      doc(asUser(C_OK, CEMAIL), 'therapistClients', `${T}_${C_OK}`),
      { linkedAt: 1761469200000 },
      { merge: true },
    ));
  });

  // Expected by the neighbouring rules (linkedAt must be a string). Observed on 44f85d5: the write is accepted.
  it('the therapist cannot write a numeric linkedAt on a booking roster row', async () => {
    await seedRoster(C_NUM);
    await assertFails(setDoc(
      doc(asUser(T, TEMAIL), 'therapistClients', `${T}_${C_NUM}`),
      { linkedAt: 1761469200000 },
      { merge: true },
    ));
  });
});
