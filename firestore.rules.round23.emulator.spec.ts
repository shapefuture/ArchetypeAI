import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, writeBatch, type Firestore } from 'firebase/firestore';

// Round 23: two rules facts the app relies on.
// - A share code that another device already revoked is gone; the owner's delete of it must succeed (a no-op),
//   and the rules must still refuse anyone else's delete of a live code.
// - A busy slot is written only for a day from yesterday on (validSlotRange). The client backfills only those, so a
//   finished appointment never reaches the rules.

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const OWNER = 'uid_owner';
const OTHER = 'uid_other';
const LIVE_CODE = 'livecode12ab';
const GONE_CODE = 'revokedcode9';
const THERAPIST = 'uid_therapist';
const CLIENT = 'uid_client';
const YEAR = new Date().getUTCFullYear();

describe.skipIf(!EMULATOR)('round23: share-code revoke and busy-slot window (emulator)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round23', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'shareCodes', LIVE_CODE), { uid: OWNER, createdAt: '2026-10-26T10:00:00.000Z' });
    });
  });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();

  it('control: the owner revokes a live share code', async () => {
    await assertSucceeds(deleteDoc(doc(asUser(OWNER, 'owner@example.com'), 'shareCodes', LIVE_CODE)));
  });

  it('another signed-in user cannot revoke a live share code', async () => {
    await assertFails(deleteDoc(doc(asUser(OTHER, 'other@example.com'), 'shareCodes', LIVE_CODE)));
  });

  it('the owner can revoke a code that no longer exists (revoked on another device)', async () => {
    await assertSucceeds(deleteDoc(doc(asUser(OWNER, 'owner@example.com'), 'shareCodes', GONE_CODE)));
  });

  /** The batch the client writes for one appointment with no busy slot yet (core/booking.ts ensureTherapistBusySlots). */
  async function backfillSlot(start: string, end: string): Promise<void> {
    const therapist = asUser(THERAPIST, 'therapist@example.com');
    const batch = writeBatch(therapist);
    batch.set(doc(therapist, 'therapistBusySlots', `${THERAPIST}_${start}`), { therapistUid: THERAPIST, appointmentId: 'appt', start, end });
    await batch.commit();
  }

  it('control: a busy slot on a future day is accepted', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'appointments', 'appt'), {
        clientUid: CLIENT, clientEmail: 'client@example.com', therapistUid: THERAPIST, therapistEmail: 'therapist@example.com',
        start: `${YEAR + 1}-10-05T10:00`, end: `${YEAR + 1}-10-05T11:00`, status: 'pending', createdAt: `${YEAR}-01-01T00:00:00.000Z`, accessGranted: true,
      });
    });
    await assertSucceeds(backfillSlot(`${YEAR + 1}-10-05T10:00`, `${YEAR + 1}-10-05T11:00`));
  });

  it('the rules refuse a busy slot on a day before yesterday, so the client does not write one', async () => {
    await assertFails(backfillSlot(`${YEAR - 1}-10-05T10:00`, `${YEAR - 1}-10-05T11:00`));
  });
});
