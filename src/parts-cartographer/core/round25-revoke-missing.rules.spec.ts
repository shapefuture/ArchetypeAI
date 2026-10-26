// Round 25 probe (critic), emulator: controls for the 24th pass's revoke claim. A client's revoke batch deletes every
// record it found; a record another device removed in the meantime must be a no-op, so the batch is not refused. These
// controls run the real revokeTherapistAccess (therapist-link.ts) and a raw batch that names a record already gone.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where, writeBatch, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { revokeTherapistAccess } from './therapist-link';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist';
const C = 'uid_client';
const CEMAIL = 'client@example.com';

describe.skipIf(!EMULATOR)('round25: a revoke batch tolerates records another device already removed', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round25-revoke', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapists', T), { email: 'therapist@example.com', availability: [] });
      await setDoc(doc(db, 'clientShares', `${T}_${C}`), {
        clientUid: C, clientEmail: CEMAIL, therapistUid: T, grantedAt: '2026-10-20T10:00:00.000Z', source: 'booking', appointmentId: 'appt_1',
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${C}`), {
        therapistUid: T, clientUid: C, clientEmail: CEMAIL, linkedAt: '2026-10-20T10:00:00.000Z', source: 'booking', appointmentId: 'appt_1',
      });
      await setDoc(doc(db, 'therapistLinks', 'ABCDEFGH23'), { clientUid: C, createdAt: '2026-10-20T10:00:00.000Z', summary: { headline: 'x' } });
    });
  });

  const asUser = (uid: string): Firestore =>
    testEnv.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true }).firestore();

  it('control: the client revoke batch succeeds when one record was already removed on another device', async () => {
    // The share is already gone on another device; the batch still names it.
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await deleteDoc(doc(context.firestore(), 'clientShares', `${T}_${C}`));
    });
    const db = asUser(C);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'clientShares', `${T}_${C}`));
    batch.delete(doc(db, 'therapistClients', `${T}_${C}`));
    batch.delete(doc(db, 'therapistLinks', 'ABCDEFGH23'));
    await assertSucceeds(batch.commit());
  });

  it('control: revokeTherapistAccess deletes what remains and reports the count', async () => {
    state.db = asUser(C);
    const removed = await revokeTherapistAccess(C);
    expect(removed).toBe(3);
    const rows = await getDocs(query(collection(asUser(T), 'therapistClients'),
      where('therapistUid', '==', T), where('source', '==', 'booking')));
    expect(rows.empty).toBe(true);
  });

  it('control: a therapist roster delete of a row already gone is a no-op, not a refusal', async () => {
    const db = asUser(T);
    await assertSucceeds(deleteDoc(doc(db, 'therapistClients', `${T}_uid_gone`)));
  });
});
