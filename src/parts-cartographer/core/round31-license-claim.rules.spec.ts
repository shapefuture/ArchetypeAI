// Round 31 probe (critic), emulator + the real claimTherapistLink() (therapist-link.ts) and the real rules.
// Reproduced on 9437189: the attestation copy (STRINGS.attestB2) said "License is verified on the first incoming claim
// request." Nothing checks a license: no license field exists on therapists/{uid}, the claim path records no verification,
// and the Worker has no such route. A verified-email account with a therapist profile claims the code and receives the
// client's summary.
// Fixed: the copy now says Innerverse does not verify licenses. This probe checks the claim path matches that: a verified
// therapist's first claim returns the summary and writes no license record.
// Control: a therapist whose address is not verified is refused.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, type DocumentSnapshot, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { claimTherapistLink } from './therapist-link';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const CODE = 'ABCD2345EF';
const C = 'uid_client_r31l';
const CEMAIL = 'client-r31l@example.com';
const T = 'uid_therapist_r31l';
const TEMAIL = 'therapist-r31l@example.com';
const SUMMARY = {
  headline: 'Protector', burden: 40, selfEnergy: 55, parts: {}, activeComplexes: [],
  copingStack: { l1: 'Caretaker', floor: 'Shamed' }, adherence: { done: 1, skipped: 0 },
};

describe.skipIf(!EMULATOR)('round31: the first claim verifies the therapist license (attestB2 copy)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-r31-license', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });

  const asUser = (uid: string, email: string, verified = true): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: verified }).firestore();

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'therapists', T), { email: TEMAIL, availability: [] });
    });
    state.db = asUser(C, CEMAIL);
    await setDoc(doc(asUser(C, CEMAIL), 'therapistLinks', CODE), {
      clientUid: C, createdAt: '2026-10-25T10:00:00.000Z', summary: SUMMARY,
    });
  });

  it('control: a therapist whose address is not verified cannot claim the code', async () => {
    state.db = asUser(T, TEMAIL, false);
    await expect(claimTherapistLink(T, CODE)).rejects.toThrow();
  });

  it('the first claim by a verified therapist returns the summary and writes no license record', async () => {
    state.db = asUser(T, TEMAIL);
    await expect(claimTherapistLink(T, CODE)).resolves.toEqual(SUMMARY);
    let profile: DocumentSnapshot | undefined;
    await testEnv.withSecurityRulesDisabled(async (context) => { profile = await getDoc(doc(context.firestore(), 'therapists', T)); });
    expect(profile?.exists(), 'the therapist profile is still there after the claim').toBe(true);
    expect(profile?.data()?.licenseVerifiedAt, 'no license check happens at claim, so none is recorded').toBeUndefined();
  });
});
