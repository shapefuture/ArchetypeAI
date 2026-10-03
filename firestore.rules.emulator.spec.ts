import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const UIDS = {
  attacker: 'uid_attacker',
  victim: 'uid_victim',
  admin: 'uid_admin',
  client: 'uid_client',
  therapist: 'uid_therapist',
} as const;

const THERAPIST_SUMMARY = {
  headline: 'Grounded',
  burden: 36,
  selfEnergy: 62,
  parts: { manager: { T: 52.1, tier: 'mild' } },
  activeComplexes: [],
  copingStack: { l1: 'pause', floor: 'support' },
  adherence: { done: 3, skipped: 1 },
};

/** The suite is a no-op under ordinary `npm test`; `npm run test:rules` starts the emulator. */
describe.skipIf(!EMULATOR)('Firestore security rules (emulator)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-archetypeai',
      firestore: { rules: RULES },
    });
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  function asUser(uid: string, email?: string, emailVerified = true): Firestore {
    return email
      ? testEnv.authenticatedContext(uid, { email, email_verified: emailVerified }).firestore()
      : testEnv.authenticatedContext(uid).firestore();
  }

  function asAnon(): Firestore {
    return testEnv.unauthenticatedContext().firestore();
  }

  async function seed(fn: (db: Firestore) => Promise<void>): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => fn(context.firestore()));
  }

  async function seedVictimRecords(uid = UIDS.victim): Promise<void> {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', uid, 'assessment', 'current'), {
        answers: { mwt: 'grief', shadow: 'abandonment' },
        at: '2026-10-01T00:00:00.000Z',
      });
      await setDoc(doc(db, 'users', uid, 'history', 'h1'), {
        at: '2026-09-01T00:00:00.000Z',
        note: 'session summary',
      });
    });
  }

  async function seedAllowlistedAdmin(email = 'admin@example.com'): Promise<void> {
    await seed(async (db) => {
      await setDoc(doc(db, 'adminAllowlist', email), {
        email,
        createdAt: '2026-10-01T00:00:00.000Z',
        createdByUid: UIDS.admin,
      });
    });
  }

  async function seedTherapistProfile(): Promise<void> {
    await assertSucceeds(setDoc(doc(asUser(UIDS.therapist, 'therapist@example.com'), 'therapists', UIDS.therapist), {
      email: 'therapist@example.com',
      availability: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', minutes: 60 }],
    }));
  }

  async function createValidBooking(appointmentId = `${UIDS.client}_1000`): Promise<void> {
    const client = asUser(UIDS.client, 'client@example.com');
    await seedTherapistProfile();
    const start = '2026-10-05T10:00';
    const end = '2026-10-05T11:00';
    const bookingBatch = writeBatch(client);
    bookingBatch.set(doc(client, 'appointments', appointmentId), {
      clientUid: UIDS.client,
      clientEmail: 'client@example.com',
      therapistUid: UIDS.therapist,
      therapistEmail: 'therapist@example.com',
      start,
      end,
      status: 'pending',
      createdAt: '2026-10-01T00:00:00.000Z',
      accessGranted: true,
    });
    bookingBatch.set(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${start}`), {
      therapistUid: UIDS.therapist,
      appointmentId,
      start,
      end,
    });
    await assertSucceeds(bookingBatch.commit());
    await assertSucceeds(setDoc(doc(client, 'clientShares', `${UIDS.therapist}_${UIDS.client}`), {
      clientUid: UIDS.client,
      clientEmail: 'client@example.com',
      therapistUid: UIDS.therapist,
      grantedAt: '2026-10-01T00:00:00.000Z',
      source: 'booking',
      appointmentId,
    }));
    await assertSucceeds(setDoc(doc(client, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`), {
      therapistUid: UIDS.therapist,
      clientUid: UIDS.client,
      clientEmail: 'client@example.com',
      linkedAt: '2026-10-01T00:00:00.000Z',
      source: 'booking',
      appointmentId,
    }));
  }

  describe('admin privilege boundaries', () => {
    it('blocks a normal user from creating an adminClients relationship', async () => {
      const attacker = asUser(UIDS.attacker, 'attacker@example.com');
      await assertFails(setDoc(doc(attacker, 'adminClients', `${UIDS.attacker}_${UIDS.victim}`), {
        adminUid: UIDS.attacker,
        clientUid: UIDS.victim,
        clientEmail: 'victim@example.com',
        notes: '',
        addedAt: '2026-10-01T00:00:00.000Z',
        addedByUid: UIDS.attacker,
      }));
    });

    it('does not let a forged legacy adminClients document unlock assessment or history reads', async () => {
      await seedVictimRecords();
      await seed(async (db) => {
        await setDoc(doc(db, 'adminClients', `${UIDS.attacker}_${UIDS.victim}`), {
          adminUid: UIDS.attacker,
          clientUid: UIDS.victim,
          notes: '',
        });
      });
      const attacker = asUser(UIDS.attacker, 'attacker@example.com');
      await assertFails(getDoc(doc(attacker, 'users', UIDS.victim, 'assessment', 'current')));
      await assertFails(getDoc(doc(attacker, 'users', UIDS.victim, 'history', 'h1')));
      await assertFails(getDocs(collection(attacker, 'users', UIDS.victim, 'assessment')));
    });

    it('denies self-promotion and non-admin allowlist writes', async () => {
      const attacker = asUser(UIDS.attacker, 'attacker@example.com');
      await assertFails(setDoc(doc(attacker, 'adminAllowlist', 'attacker@example.com'), {
        email: 'attacker@example.com', createdAt: '2026-10-01T00:00:00.000Z', createdByUid: UIDS.attacker,
      }));
      await assertFails(setDoc(doc(attacker, 'adminAllowlist', 'someone-else@example.com'), {
        email: 'someone-else@example.com', createdAt: '2026-10-01T00:00:00.000Z', createdByUid: UIDS.attacker,
      }));
    });

    it('allows the verified bootstrap admin to manage the allowlist and a linked client', async () => {
      await seedVictimRecords();
      const root = asUser('uid_root', 'wmobilas@gmail.com');
      await assertSucceeds(setDoc(doc(root, 'adminAllowlist', 'admin@example.com'), {
        email: 'admin@example.com', createdAt: '2026-10-01T00:00:00.000Z', createdByUid: 'uid_root',
      }));
      const admin = asUser(UIDS.admin, 'admin@example.com');
      await assertSucceeds(setDoc(doc(admin, 'adminClients', `${UIDS.admin}_${UIDS.victim}`), {
        adminUid: UIDS.admin,
        clientUid: UIDS.victim,
        clientEmail: 'victim@example.com',
        notes: '',
        addedAt: '2026-10-01T00:00:00.000Z',
        addedByUid: UIDS.admin,
      }));
      await assertSucceeds(getDoc(doc(admin, 'users', UIDS.victim, 'assessment', 'current')));
      await assertSucceeds(getDoc(doc(admin, 'users', UIDS.victim, 'history', 'h1')));
      // Preserve the UI's constrained list query. The rule must authorize via
      // the `adminUid` field, not require a document-ID predicate it cannot prove.
      const adminLinks = await getDocs(query(
        collection(admin, 'adminClients'),
        where('adminUid', '==', UIDS.admin),
      ));
      expect(adminLinks.docs.map((entry) => entry.id)).toEqual([`${UIDS.admin}_${UIDS.victim}`]);
    });

    it('does not treat an unverified bootstrap email as an admin', async () => {
      const unverified = asUser('uid_unverified', 'wmobilas@gmail.com', false);
      await assertFails(setDoc(doc(unverified, 'adminClients', `uid_unverified_${UIDS.victim}`), {
        adminUid: 'uid_unverified',
        clientUid: UIDS.victim,
        clientEmail: null,
        notes: '',
        addedAt: '2026-10-01T00:00:00.000Z',
        addedByUid: 'uid_unverified',
      }));
    });
  });

  describe('user-owned records and limited collections', () => {
    it('allows owners to read and write their assessment/history, but not another user tree', async () => {
      await seedVictimRecords();
      const victim = asUser(UIDS.victim, 'victim@example.com');
      const attacker = asUser(UIDS.attacker, 'attacker@example.com');
      await assertSucceeds(getDoc(doc(victim, 'users', UIDS.victim, 'assessment', 'current')));
      await assertSucceeds(getDoc(doc(victim, 'users', UIDS.victim, 'history', 'h1')));
      await assertSucceeds(setDoc(doc(victim, 'users', UIDS.victim, 'assessment', 'new'), { answers: {}, at: 'now' }));
      await assertFails(getDoc(doc(attacker, 'users', UIDS.victim, 'assessment', 'current')));
      await assertFails(setDoc(doc(attacker, 'users', UIDS.victim, 'assessment', 'forged'), { answers: {}, at: 'now' }));
      await assertFails(getDoc(doc(asAnon(), 'users', UIDS.victim, 'assessment', 'current')));
    });

    it('requires Firebase auth for telemetry and rejects oversized payloads', async () => {
      await assertFails(setDoc(doc(asAnon(), 'telemetryResponses', 'anonymous'), { payload: '{}', at: 'now' }));
      const client = asUser(UIDS.client, 'client@example.com');
      await assertSucceeds(setDoc(doc(client, 'telemetryResponses', 'valid'), { payload: '{"schema":1}', at: 'now' }));
      await assertFails(setDoc(doc(client, 'telemetryResponses', 'oversized'), { payload: 'x'.repeat(33_000), at: 'now' }));
    });

    it('binds each push token to the authenticated owner', async () => {
      await assertFails(setDoc(doc(asAnon(), 'pushTokens', 'token-anon'), {
        token: 'token-anon', uid: UIDS.attacker, createdAt: 'now',
      }));
      const owner = asUser(UIDS.victim, 'victim@example.com');
      await assertSucceeds(setDoc(doc(owner, 'pushTokens', 'token-victim'), {
        token: 'token-victim', uid: UIDS.victim, createdAt: 'now',
      }));
      await assertFails(setDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'pushTokens', 'token-victim'), {
        token: 'token-victim', uid: UIDS.attacker, createdAt: 'now',
      }));
    });

    it('allows authenticated single-code lookup but denies share-code collection listing', async () => {
      const owner = asUser(UIDS.victim, 'victim@example.com');
      await assertSucceeds(setDoc(doc(owner, 'shareCodes', 'abc123xy'), {
        uid: UIDS.victim, createdAt: '2026-10-01T00:00:00.000Z',
      }));
      await assertSucceeds(getDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'shareCodes', 'abc123xy')));
      await assertFails(getDocs(collection(asUser(UIDS.attacker, 'attacker@example.com'), 'shareCodes')));
      await assertFails(getDoc(doc(asAnon(), 'shareCodes', 'abc123xy')));
    });

    it('allows a signed-in code recipient to read an explicitly shared map snapshot without listing codes', async () => {
      const owner = asUser(UIDS.victim, 'victim@example.com');
      const codeRef = doc(owner, 'shareCodes', 'map123code45');
      await assertSucceeds(setDoc(codeRef, {
        uid: UIDS.victim,
        createdAt: '2026-10-01T00:00:00.000Z',
        schema: 'parts-cartographer.v1',
        mapSnapshot: {
          schema: 'parts-cartographer.v1',
          profile: { headlineConstellation: 'A map' },
          parts: [{ id: 'part-1', name: 'A part' }],
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      }));
      const recipient = asUser(UIDS.attacker, 'attacker@example.com');
      const shared = await assertSucceeds(getDoc(doc(recipient, 'shareCodes', 'map123code45')));
      expect(shared.data()?.mapSnapshot.parts).toHaveLength(1);
      await assertFails(deleteDoc(doc(recipient, 'shareCodes', 'map123code45')));
      await assertSucceeds(deleteDoc(codeRef));
    });

    it('supports legacy assessment share codes through a bounded embedded snapshot', async () => {
      const owner = asUser(UIDS.victim, 'victim@example.com');
      await assertSucceeds(setDoc(doc(owner, 'shareCodes', 'legacy123'), {
        uid: UIDS.victim,
        createdAt: '2026-10-01T00:00:00.000Z',
        assessment: {
          responses: Array(64).fill(3),
          dimensionalExpressions: { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
          results: { analysis: 'report', pantheon: [] },
          scoringMethod: 'deterministic',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      }));
    });

    it('keeps public profile writes owner-only and available to signed-in therapist lookup', async () => {
      const victim = asUser(UIDS.victim, 'victim@example.com');
      await assertSucceeds(setDoc(doc(victim, 'publicProfiles', UIDS.victim), {
        emailLower: 'victim@example.com', email: 'victim@example.com', displayName: 'Vic', updatedAt: 'now',
      }));
      await assertSucceeds(getDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'publicProfiles', UIDS.victim)));
      await assertFails(setDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'publicProfiles', UIDS.victim), {
        emailLower: 'attacker@example.com', email: 'attacker@example.com', displayName: 'Impostor', updatedAt: 'now',
      }));
      await assertFails(setDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'publicProfiles', UIDS.attacker), {
        emailLower: 'victim@example.com', email: 'attacker@example.com', displayName: 'Impostor', updatedAt: 'now',
      }));
    });
  });

  describe('therapist and booking relationships', () => {
    it('denies fake booking shares and therapist roster rows', async () => {
      const client = asUser(UIDS.client, 'client@example.com');
      await assertFails(setDoc(doc(client, 'clientShares', `${UIDS.therapist}_${UIDS.client}`), {
        clientUid: UIDS.client,
        clientEmail: 'client@example.com',
        therapistUid: UIDS.therapist,
        grantedAt: 'now',
        source: 'booking',
        appointmentId: 'not-a-real-booking',
      }));
      await assertFails(setDoc(doc(client, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`), {
        therapistUid: UIDS.therapist,
        clientUid: UIDS.client,
        clientEmail: 'client@example.com',
        linkedAt: 'now',
        source: 'booking',
        appointmentId: 'not-a-real-booking',
      }));
      await assertFails(setDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'therapistClients', `${UIDS.attacker}_${UIDS.victim}`), {
        therapistUid: UIDS.attacker,
        clientUid: UIDS.victim,
        linkedAt: 'now',
        source: 'invite',
        linkCode: 'BADCODE123',
        summary: THERAPIST_SUMMARY,
      }));
    });

    it('exposes only busy intervals to clients and blocks a duplicate start-time reservation', async () => {
      const appointmentId = 'private-random-appointment-id';
      await createValidBooking(appointmentId);
      const visitor = asUser(UIDS.attacker, 'attacker@example.com');
      const publicSlots = query(
        collection(visitor, 'therapistBusySlots'),
        where('therapistUid', '==', UIDS.therapist),
      );
      const slots = await assertSucceeds(getDocs(publicSlots));
      expect(slots.size).toBe(1);
      expect(slots.docs[0].data()).not.toHaveProperty('clientUid');
      expect(slots.docs[0].data()).not.toHaveProperty('clientEmail');
      await assertFails(getDoc(doc(visitor, 'appointments', appointmentId)));

      const secondClient = asUser(UIDS.attacker, 'attacker@example.com');
      const duplicate = writeBatch(secondClient);
      duplicate.set(doc(secondClient, 'appointments', 'second-random-id'), {
        clientUid: UIDS.attacker,
        clientEmail: 'attacker@example.com',
        therapistUid: UIDS.therapist,
        therapistEmail: 'therapist@example.com',
        start: '2026-10-05T10:00',
        end: '2026-10-05T11:00',
        status: 'pending',
        createdAt: '2026-10-01T00:00:00.000Z',
        accessGranted: true,
      });
      duplicate.set(doc(secondClient, 'therapistBusySlots', `${UIDS.therapist}_2026-10-05T10:00`), {
        therapistUid: UIDS.therapist,
        appointmentId: 'second-random-id',
        start: '2026-10-05T10:00',
        end: '2026-10-05T11:00',
      });
      await assertFails(duplicate.commit());
    });

    it('allows a valid appointment share and revokes cross-user reads when the appointment is declined', async () => {
      await seedVictimRecords(UIDS.client);
      await createValidBooking();
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertSucceeds(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'current')));
      await assertSucceeds(getDoc(doc(therapist, 'users', UIDS.client, 'history', 'h1')));
      const decline = writeBatch(therapist);
      decline.update(doc(therapist, 'appointments', `${UIDS.client}_1000`), { status: 'declined' });
      decline.delete(doc(therapist, 'therapistBusySlots', `${UIDS.therapist}_2026-10-05T10:00`));
      await assertSucceeds(decline.commit());
      await assertFails(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'current')));
    });

    it('rejects appointment field injection and invalid status transitions', async () => {
      await seedTherapistProfile();
      const client = asUser(UIDS.client, 'client@example.com');
      const base = {
        clientUid: UIDS.client,
        clientEmail: 'client@example.com',
        therapistUid: UIDS.therapist,
        therapistEmail: 'therapist@example.com',
        start: '2026-10-05T10:00',
        end: '2026-10-05T11:00',
        status: 'pending',
        createdAt: '2026-10-01T00:00:00.000Z',
        accessGranted: true,
      };
      await assertFails(setDoc(doc(client, 'appointments', 'injected'), { ...base, approvedBy: UIDS.client }));
      await assertFails(setDoc(doc(client, 'appointments', 'wrong-client'), { ...base, clientUid: UIDS.victim }));
      // A direct appointment create cannot skip the matching slot reservation.
      await assertFails(setDoc(doc(client, 'appointments', `${UIDS.client}_2000`), base));
      await createValidBooking(`${UIDS.client}_2000`);
      await assertFails(updateDoc(doc(client, 'appointments', `${UIDS.client}_2000`), { status: 'approved' }));
      await assertFails(updateDoc(doc(client, 'appointments', `${UIDS.client}_2000`), { status: 'cancelled' }));
      const cancel = writeBatch(client);
      cancel.update(doc(client, 'appointments', `${UIDS.client}_2000`), { status: 'cancelled' });
      cancel.delete(doc(client, 'therapistBusySlots', `${UIDS.therapist}_2026-10-05T10:00`));
      await assertSucceeds(cancel.commit());
    });

    it('allows a therapist to claim only a client-created invite code', async () => {
      const client = asUser(UIDS.client, 'client@example.com');
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      const code = 'ABC2345678';
      await assertSucceeds(setDoc(doc(client, 'therapistLinks', code), {
        clientUid: UIDS.client,
        createdAt: '2026-10-01T00:00:00.000Z',
        summary: THERAPIST_SUMMARY,
      }));
      await assertSucceeds(getDoc(doc(therapist, 'therapistLinks', code)));
      await assertSucceeds(setDoc(doc(therapist, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`), {
        therapistUid: UIDS.therapist,
        clientUid: UIDS.client,
        linkedAt: '2026-10-01T00:00:00.000Z',
        source: 'invite',
        linkCode: code,
        summary: THERAPIST_SUMMARY,
      }));
      await assertSucceeds(getDoc(doc(therapist, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`)));
    });

    it('requires a trusted roster relationship before exercise assignment', async () => {
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertFails(setDoc(doc(therapist, 'assignments', 'bad-assignment'), {
        id: 'bad-assignment', therapistUid: UIDS.therapist, clientUid: UIDS.victim,
        exerciseId: 'e1', frequency: 'once', assignedAt: 'now',
      }));
      await createValidBooking();
      await assertSucceeds(setDoc(doc(therapist, 'assignments', 'good-assignment'), {
        id: 'good-assignment', therapistUid: UIDS.therapist, clientUid: UIDS.client,
        exerciseId: 'e1', frequency: 'once', assignedAt: 'now',
      }));
    });
  });
});
