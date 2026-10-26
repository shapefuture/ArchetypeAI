// Round 25 probe (critic), emulator + the real backfill: the 24th pass says ensureTherapistBusySlots "sends only slots the
// busy-slot rule accepts". Its filter (booking.ts SLOT_TIME) checks the shape of the day (01-31) but not that the day
// exists in its month. The rule converts the date with timestamp.date(...) (firestore.rules slotDay). One legacy
// appointment on an impossible date then refuses the whole batch, so the valid appointment beside it gets no lock.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { ensureTherapistBusySlots } from './booking';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist';
const TEMAIL = 'therapist@example.com';
const C = 'uid_client';
const YEAR = new Date().getUTCFullYear();
const VALID_START = `${YEAR + 1}-06-05T10:00`;
const VALID_END = `${YEAR + 1}-06-05T11:00`;
const IMPOSSIBLE_START = `${YEAR + 1}-02-30T10:00`;
const IMPOSSIBLE_END = `${YEAR + 1}-02-30T11:00`;

describe.skipIf(!EMULATOR)('round25: the backfill sends only slots the busy-slot rule can evaluate', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round25-date', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'appointments', 'appt_valid'), {
        clientUid: C, clientEmail: 'c@example.com', therapistUid: T, therapistEmail: TEMAIL,
        start: VALID_START, end: VALID_END, status: 'pending', createdAt: '2026-10-01T10:00:00.000Z', accessGranted: true,
      });
      await setDoc(doc(db, 'appointments', 'appt_impossible'), {
        clientUid: C, clientEmail: 'c@example.com', therapistUid: T, therapistEmail: TEMAIL,
        start: IMPOSSIBLE_START, end: IMPOSSIBLE_END, status: 'pending', createdAt: '2026-10-01T10:00:00.000Z', accessGranted: true,
      });
    });
  });

  const asTherapist = (): Firestore => testEnv.authenticatedContext(T, { email: TEMAIL, email_verified: true }).firestore();

  it('control: the valid appointment alone is backfilled', async () => {
    state.db = asTherapist();
    await assertSucceeds(ensureTherapistBusySlots(T, [{ id: 'appt_valid', therapistUid: T, status: 'pending', start: VALID_START, end: VALID_END } as any]));
    expect((await getDoc(doc(asTherapist(), 'therapistBusySlots', `${T}_${VALID_START}`))).exists()).toBe(true);
  });

  it('a valid appointment is backfilled even when a legacy appointment sits on 30 February', async () => {
    state.db = asTherapist();
    const items = [
      { id: 'appt_impossible', therapistUid: T, status: 'pending', start: IMPOSSIBLE_START, end: IMPOSSIBLE_END },
      { id: 'appt_valid', therapistUid: T, status: 'pending', start: VALID_START, end: VALID_END },
    ] as any[];
    await assertSucceeds(ensureTherapistBusySlots(T, items));
    const lock = await getDoc(doc(asTherapist(), 'therapistBusySlots', `${T}_${VALID_START}`));
    expect(lock.exists(), 'busy-slot lock for the valid appointment').toBe(true);
  });
});
