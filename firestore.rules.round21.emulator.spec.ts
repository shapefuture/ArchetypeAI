import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { EXERCISES, EXERCISE_TYPES } from './src/shared/core/data/exercises';

// Round 21: a RED exercise (exile contact, §3E.3) must not be assignable through the rules. The app gates RED in
// client code (therapist-link.ts assignExercise; the dashboard picker omits RED), and the container that unlocks it is
// client-side state the rules cannot read, so the rules refuse every RED exercise id.

const NEXT_YEAR = new Date().getUTCFullYear() + 1;
const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const UIDS = { therapist: 'uid_therapist', client: 'uid_client' } as const;
const ROSTER = `${UIDS.therapist}_${UIDS.client}`;
const RED_EXERCISES = EXERCISES.filter((exercise) => EXERCISE_TYPES[exercise.type].gate === 'red').map((exercise) => exercise.id);
const GREEN_EXERCISE = 'paced-breath'; // type 'regulation', gate 'green'
/** The RED ids the rules list, read from the rules text itself. */
const RULES_RED = (/exerciseId in \[([^\]]*)\]/.exec(RULES)?.[1] ?? '')
  .split(',').map((id) => id.trim().replace(/^'|'$/g, '')).filter(Boolean);

describe('round21: the rules refuse the RED exercises the app defines', () => {
  it('lists exactly the RED exercises of the app', () => {
    expect(RED_EXERCISES.length).toBeGreaterThan(0);
    expect([...RULES_RED].sort()).toEqual([...RED_EXERCISES].sort());
  });
});

describe.skipIf(!EMULATOR)('round21: RED exercise assignment in the rules (emulator)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round21', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  /** A trusted booking relationship, written the way core/booking.ts writes it. */
  async function createTrustedRelationship(): Promise<void> {
    const client = asUser(UIDS.client, 'client@example.com');
    await assertSucceeds(setDoc(doc(asUser(UIDS.therapist, 'therapist@example.com'), 'therapists', UIDS.therapist), {
      email: 'therapist@example.com', availability: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', minutes: 60 }],
    }));
    const start = `${NEXT_YEAR}-10-05T10:00`;
    const end = `${NEXT_YEAR}-10-05T11:00`;
    const batch = writeBatch(client);
    batch.set(doc(client, 'appointments', 'appt_A'), {
      clientUid: UIDS.client, clientEmail: 'client@example.com', therapistUid: UIDS.therapist, therapistEmail: 'therapist@example.com',
      start, end, status: 'pending', createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, accessGranted: true,
    });
    batch.set(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${start}`), { therapistUid: UIDS.therapist, appointmentId: 'appt_A', start, end });
    await assertSucceeds(batch.commit());
    await assertSucceeds(setDoc(doc(client, 'clientShares', ROSTER), {
      clientUid: UIDS.client, clientEmail: 'client@example.com', therapistUid: UIDS.therapist,
      grantedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, source: 'booking', appointmentId: 'appt_A',
    }));
    await assertSucceeds(setDoc(doc(client, 'therapistClients', ROSTER), {
      therapistUid: UIDS.therapist, clientUid: UIDS.client, clientEmail: 'client@example.com',
      linkedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, source: 'booking', appointmentId: 'appt_A',
    }));
  }

  it('control: a trusted therapist can assign a green practice', async () => {
    await createTrustedRelationship();
    const therapist = asUser(UIDS.therapist, 'therapist@example.com');
    await assertSucceeds(setDoc(doc(therapist, 'assignments', 'a-green'), {
      id: 'a-green', therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId: GREEN_EXERCISE, frequency: 'daily', assignedAt: 'now',
    }));
  });

  it.each(RED_EXERCISES)('a trusted therapist cannot write a RED assignment (%s)', async (exerciseId) => {
    await createTrustedRelationship();
    const therapist = asUser(UIDS.therapist, 'therapist@example.com');
    await assertFails(setDoc(doc(therapist, 'assignments', `a-red-${exerciseId}`), {
      id: `a-red-${exerciseId}`, therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId, frequency: 'once', assignedAt: 'now',
    }));
  });
});
