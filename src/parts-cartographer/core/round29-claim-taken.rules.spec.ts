// Round 29 probe (critic), emulator + the real claimTherapistLink() (therapist-link.ts) and the real rules.
// claimTherapistLink() documents: "a code another therapist already claimed resolves to null" (the dashboard then shows
// badCode). The code path reads the code first with getDoc. firestore.rules therapistLinks `allow get` refuses a claimed code
// to every signed-in user except its claimant and its client: a second therapist's getDoc is refused with permission-denied,
// so claimTherapistLink() rejects instead of resolving to null. innerverse.jsx claim() then reports therapistLoadFailed
// ("Could not load therapist data. Check your connection") for a code that is simply taken.
// Controls: a code that does not exist resolves to null; the first claim and a repeat claim by the same therapist succeed.
// Expected (probe assertion): the second therapist gets { ok: true, value: null }. Observed on 0f59c14: { ok: false, code: 'permission-denied' }.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { claimTherapistLink } from './therapist-link';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const CODE = 'ABCD2345EF';
const MISSING = 'ZZZZ2345EF';
const C = 'uid_client_r29';
const CEMAIL = 'client-r29@example.com';
const T1 = 'uid_therapist_first_r29';
const T1EMAIL = 'first-r29@example.com';
const T2 = 'uid_therapist_second_r29';
const T2EMAIL = 'second-r29@example.com';
const SUMMARY = {
  headline: 'Protector', burden: 40, selfEnergy: 55, parts: {}, activeComplexes: [],
  copingStack: { l1: 'Caretaker', floor: 'Shamed' }, adherence: { done: 1, skipped: 0 },
};

describe.skipIf(!EMULATOR)('round29: a code another therapist already claimed is refused, not reported as a failed load', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round29a', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapists', T1), { email: T1EMAIL, availability: [] });
      await setDoc(doc(db, 'therapists', T2), { email: T2EMAIL, availability: [] });
    });
    // The client issues the code (the rules let a client create its own code with a valid summary).
    state.db = asUser(C, CEMAIL);
    await setDoc(doc(asUser(C, CEMAIL), 'therapistLinks', CODE), {
      clientUid: C, createdAt: '2026-10-25T10:00:00.000Z', summary: SUMMARY,
    });
  });

  it('control: a code that does not exist resolves to null for a therapist', async () => {
    state.db = asUser(T2, T2EMAIL);
    await expect(claimTherapistLink(T2, MISSING)).resolves.toBeNull();
  });

  it('control: the first therapist claims the code and gets its summary', async () => {
    state.db = asUser(T1, T1EMAIL);
    await expect(claimTherapistLink(T1, CODE)).resolves.toEqual(SUMMARY);
  });

  it('control: the claimant may claim the same code again and still gets its summary', async () => {
    state.db = asUser(T1, T1EMAIL);
    await claimTherapistLink(T1, CODE);
    await expect(claimTherapistLink(T1, CODE)).resolves.toEqual(SUMMARY);
  });

  it('a second therapist who enters a code another therapist claimed resolves to null (single-use refusal), not an error', async () => {
    state.db = asUser(T1, T1EMAIL);
    await claimTherapistLink(T1, CODE);
    state.db = asUser(T2, T2EMAIL);
    const outcome = await claimTherapistLink(T2, CODE).then(
      (value) => ({ ok: true, value }),
      (error: { code?: string }) => ({ ok: false, code: error?.code }),
    );
    expect(outcome).toEqual({ ok: true, value: null });
  });
});
