import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, writeBatch, type Firestore } from 'firebase/firestore';

// Round 20: invite claims and roster reads, run by npm run test:rules (see vitest.rules.config.ts).

const NEXT_YEAR = new Date().getUTCFullYear() + 1;
const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const UIDS = { therapist: 'uid_therapist', client: 'uid_client' } as const;
const SUMMARY = {
  headline: 'Grounded', burden: 36, selfEnergy: 62, parts: { manager: { T: 52.1, tier: 'mild' } },
  activeComplexes: [], copingStack: { l1: 'pause', floor: 'support' }, adherence: { done: 3, skipped: 1 },
};
const ROSTER = `${UIDS.therapist}_${UIDS.client}`;

describe.skipIf(!EMULATOR)('round20: invite claim and roster reads (emulator)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round20', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
  const seed = (fn: (db: Firestore) => Promise<void>) => testEnv.withSecurityRulesDisabled(async (c) => fn(c.firestore()));

  async function seedTherapistProfile(): Promise<void> {
    await assertSucceeds(setDoc(doc(asUser(UIDS.therapist, 'therapist@example.com'), 'therapists', UIDS.therapist), {
      email: 'therapist@example.com', availability: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', minutes: 60 }],
    }));
  }

  /** The real booking path: appointment, busy slot, share and roster row (source 'booking'), as core/booking.ts writes them. */
  async function createBookingRoster(appointmentId: string): Promise<void> {
    const client = asUser(UIDS.client, 'client@example.com');
    await seedTherapistProfile();
    const start = `${NEXT_YEAR}-10-05T10:00`;
    const end = `${NEXT_YEAR}-10-05T11:00`;
    const batch = writeBatch(client);
    batch.set(doc(client, 'appointments', appointmentId), {
      clientUid: UIDS.client, clientEmail: 'client@example.com', therapistUid: UIDS.therapist, therapistEmail: 'therapist@example.com',
      start, end, status: 'pending', createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, accessGranted: true,
    });
    batch.set(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${start}`), { therapistUid: UIDS.therapist, appointmentId, start, end });
    await assertSucceeds(batch.commit());
    await assertSucceeds(setDoc(doc(client, 'clientShares', ROSTER), {
      clientUid: UIDS.client, clientEmail: 'client@example.com', therapistUid: UIDS.therapist,
      grantedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, source: 'booking', appointmentId,
    }));
    await assertSucceeds(setDoc(doc(client, 'therapistClients', ROSTER), {
      therapistUid: UIDS.therapist, clientUid: UIDS.client, clientEmail: 'client@example.com',
      linkedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, source: 'booking', appointmentId,
    }));
  }

  async function clientCreatesCode(code: string): Promise<void> {
    await assertSucceeds(setDoc(doc(asUser(UIDS.client, 'client@example.com'), 'therapistLinks', code), {
      clientUid: UIDS.client, createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, summary: SUMMARY,
    }));
  }

  /** Exactly the batch core/therapist-link.ts claimTherapistLink() commits: claim the code, then merge the roster row. */
  function appClaim(therapist: Firestore, code: string) {
    const batch = writeBatch(therapist);
    batch.update(doc(therapist, 'therapistLinks', code), { claimedBy: UIDS.therapist });
    batch.set(doc(therapist, 'therapistClients', ROSTER), {
      therapistUid: UIDS.therapist, clientUid: UIDS.client, linkedAt: `${NEXT_YEAR}-10-02T00:00:00.000Z`,
      source: 'invite', linkCode: code, summary: SUMMARY,
    }, { merge: true });
    return batch.commit();
  }

  it('control: the app claim succeeds when the client has no earlier booking row', async () => {
    await seedTherapistProfile();
    await clientCreatesCode('CTRLCLAIM2');
    await assertSucceeds(appClaim(asUser(UIDS.therapist, 'therapist@example.com'), 'CTRLCLAIM2'));
  });

  it('a therapist who already holds a booking roster row for the client can claim the client invite code', async () => {
    await createBookingRoster('appt_r20');
    await clientCreatesCode('BOOKFIRST2');
    await assertSucceeds(appClaim(asUser(UIDS.therapist, 'therapist@example.com'), 'BOOKFIRST2'));
  });

  it('a claim cannot change the booking email the client wrote on the roster row', async () => {
    await createBookingRoster('appt_r20b');
    await clientCreatesCode('EMAILCHG2');
    const therapist = asUser(UIDS.therapist, 'therapist@example.com');
    const batch = writeBatch(therapist);
    batch.update(doc(therapist, 'therapistLinks', 'EMAILCHG2'), { claimedBy: UIDS.therapist });
    batch.set(doc(therapist, 'therapistClients', ROSTER), {
      therapistUid: UIDS.therapist, clientUid: UIDS.client, clientEmail: 'someone.else@example.com',
      linkedAt: `${NEXT_YEAR}-10-02T00:00:00.000Z`, source: 'invite', linkCode: 'EMAILCHG2', summary: SUMMARY,
    }, { merge: true });
    await assertFails(batch.commit());
  });

  it('while the code is live, the therapist can read the claimed summary row (control)', async () => {
    await seedTherapistProfile();
    await clientCreatesCode('LIVEREAD2');
    await assertSucceeds(appClaim(asUser(UIDS.therapist, 'therapist@example.com'), 'LIVEREAD2'));
    await assertSucceeds(getDoc(doc(asUser(UIDS.therapist, 'therapist@example.com'), 'therapistClients', ROSTER)));
  });

  it('after the client deletes only the invite code, the therapist cannot still read the summary row', async () => {
    await seedTherapistProfile();
    await clientCreatesCode('PARTDEL22');
    await assertSucceeds(appClaim(asUser(UIDS.therapist, 'therapist@example.com'), 'PARTDEL22'));
    // The client deletes the code (the rules' stated revocation); the roster row is left behind.
    await assertSucceeds(deleteDoc(doc(asUser(UIDS.client, 'client@example.com'), 'therapistLinks', 'PARTDEL22')));
    await assertFails(getDoc(doc(asUser(UIDS.therapist, 'therapist@example.com'), 'therapistClients', ROSTER)));
  });
});
