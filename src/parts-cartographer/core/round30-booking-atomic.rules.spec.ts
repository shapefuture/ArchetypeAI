// Round 30 probe (critic), emulator + the real createBooking() (booking.ts). The appointment and its busy slot are committed in
// one batch, and the client share and roster row are written afterwards. A network failure at the share step leaves a pending
// request with no access behind, while the client is told the booking failed: the slot stays held and a retry is refused.
// Here the share step is refused: a batch carrying a share never commits, and a standalone share write throws.
// Expected: a booking that reports failure leaves no request and holds no slot. Control: a normal booking holds the slot.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown, failShares: false } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  const touchesShares = (batchOps: string[]) => batchOps.some((path) => path.startsWith('clientShares/'));
  return {
    ...actual,
    // The share step fails: a batch that carries a share never commits, as a dropped request would not.
    writeBatch: (db: unknown) => {
      const batch = actual.writeBatch(db as Parameters<typeof actual.writeBatch>[0]);
      const paths: string[] = [];
      const set = batch.set.bind(batch);
      const commit = batch.commit.bind(batch);
      batch.set = ((ref: { path: string }, data: unknown, options?: unknown) => {
        paths.push(ref.path);
        return (set as (...args: unknown[]) => unknown)(ref, data, options);
      }) as typeof batch.set;
      batch.commit = (async () => {
        if (state.failShares && touchesShares(paths)) throw new Error('Network request failed');
        return commit();
      }) as typeof batch.commit;
      return batch;
    },
    // A standalone share write fails the same way.
    setDoc: ((ref: { path: string }, ...args: unknown[]) => {
      if (state.failShares && ref.path.startsWith('clientShares/')) return Promise.reject(new Error('Network request failed'));
      return (actual.setDoc as (...a: unknown[]) => Promise<void>)(ref, ...args);
    }) as typeof actual.setDoc,
  };
});

import { createBooking } from './booking';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist_atomic_r30';
const TEMAIL = 'therapist-atomic@example.com';
const C = 'uid_client_atomic_r30';
const CEMAIL = 'client-atomic@example.com';

/** A slot `days` out at 10:00 in the therapist's wall clock. */
function slotIn(days: number): { start: string; end: string } {
  const day = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  return { start: `${day}T10:00`, end: `${day}T11:00` };
}

describe.skipIf(!EMULATOR)('round30: a booking that fails at the share step leaves no request behind', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round30atomic', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => {
    state.failShares = false;
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
    });
    state.db = testEnv.authenticatedContext(C, { email: CEMAIL, email_verified: true }).firestore();
  });

  const clientRequests = async (): Promise<number> => {
    const snap = await getDocs(query(collection(state.db as never, 'appointments'), where('clientUid', '==', C)));
    return snap.size;
  };

  it('control: a booking with a working share holds its slot and grants access', async () => {
    const slot = slotIn(10);
    await createBooking({ clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL, ...slot });
    expect(await clientRequests()).toBe(1);
  });

  it('a booking whose share step fails is reported as failed and leaves no request holding the slot', async () => {
    const slot = slotIn(11);
    state.failShares = true;
    await expect(createBooking({ clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL, ...slot })).rejects.toThrow();
    expect(await clientRequests(), 'no pending request is left behind a booking that reported failure').toBe(0);
    state.failShares = false;
    await expect(
      createBooking({ clientUid: C, clientEmail: CEMAIL, therapistUid: T, therapistEmail: TEMAIL, ...slot }),
      'the client can retry the same slot',
    ).resolves.toBeTruthy();
  });
});
