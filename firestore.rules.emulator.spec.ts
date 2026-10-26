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

// Booking dates must be real, upcoming and within two years, so fixtures use next year.
const NEXT_YEAR = new Date().getUTCFullYear() + 1;
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

  /** Only therapists may join the email directory; these accounts have a therapist profile. */
  async function seedDirectoryTherapists(): Promise<void> {
    await seed(async (db) => {
      for (const uid of [UIDS.victim, UIDS.therapist, 'uid_mixed']) {
        await setDoc(doc(db, 'therapists', uid), { email: null, availability: [] });
      }
    });
  }

  async function seedVictimRecords(uid = UIDS.victim): Promise<void> {
    await seed(async (db) => {
      await setDoc(doc(db, 'users', uid, 'assessment', 'current'), {
        answers: { mwt: 'grief', shadow: 'abandonment' },
        at: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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
    const start = `${NEXT_YEAR}-10-05T10:00`;
    const end = `${NEXT_YEAR}-10-05T11:00`;
    const bookingBatch = writeBatch(client);
    bookingBatch.set(doc(client, 'appointments', appointmentId), {
      clientUid: UIDS.client,
      clientEmail: 'client@example.com',
      therapistUid: UIDS.therapist,
      therapistEmail: 'therapist@example.com',
      start,
      end,
      status: 'pending',
      createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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
      grantedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
      source: 'booking',
      appointmentId,
    }));
    await assertSucceeds(setDoc(doc(client, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`), {
      therapistUid: UIDS.therapist,
      clientUid: UIDS.client,
      clientEmail: 'client@example.com',
      linkedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
      source: 'booking',
      appointmentId,
    }));
  }

  describe('admin privilege boundaries', () => {
    it('an unverified account cannot read the admin allowlist entry for its own address', async () => {
      await seedAllowlistedAdmin('ops-admin@example.com');
      const unverified = asUser('uid_probe', 'ops-admin@example.com', false);
      await assertFails(getDoc(doc(unverified, 'adminAllowlist', 'ops-admin@example.com')));
      const verified = asUser('uid_probe2', 'ops-admin@example.com', true);
      await assertSucceeds(getDoc(doc(verified, 'adminAllowlist', 'ops-admin@example.com')));
    });

    it('blocks a normal user from creating an adminClients relationship', async () => {
      const attacker = asUser(UIDS.attacker, 'attacker@example.com');
      await assertFails(setDoc(doc(attacker, 'adminClients', `${UIDS.attacker}_${UIDS.victim}`), {
        adminUid: UIDS.attacker,
        clientUid: UIDS.victim,
        clientEmail: 'victim@example.com',
        notes: '',
        addedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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
        email: 'attacker@example.com', createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, createdByUid: UIDS.attacker,
      }));
      await assertFails(setDoc(doc(attacker, 'adminAllowlist', 'someone-else@example.com'), {
        email: 'someone-else@example.com', createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, createdByUid: UIDS.attacker,
      }));
    });

    it('allows the verified bootstrap admin to manage the allowlist and a linked client', async () => {
      await seedVictimRecords();
      const root = asUser('uid_root', 'wmobilas@gmail.com');
      await assertSucceeds(setDoc(doc(root, 'adminAllowlist', 'admin@example.com'), {
        email: 'admin@example.com', createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, createdByUid: 'uid_root',
      }));
      const admin = asUser(UIDS.admin, 'admin@example.com');
      await assertSucceeds(setDoc(doc(admin, 'adminClients', `${UIDS.admin}_${UIDS.victim}`), {
        adminUid: UIDS.admin,
        clientUid: UIDS.victim,
        clientEmail: 'victim@example.com',
        notes: '',
        addedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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
        addedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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

    it('caps the parts in an owner map at 100, the same limit the client enforces', async () => {
      const victim = asUser(UIDS.victim, 'victim@example.com');
      const map = (count: number) => ({
        schema: 'parts-cartographer.v1',
        profile: { headlineConstellation: 'x' },
        parts: Array.from({ length: count }, (_, i) => ({ id: `p${i}` })),
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      });
      await assertSucceeds(setDoc(doc(victim, 'users', UIDS.victim, 'history', 'at-limit'), map(100)));
      await assertFails(setDoc(doc(victim, 'users', UIDS.victim, 'history', 'over-limit'), map(101)));
      await assertFails(setDoc(doc(victim, 'users', UIDS.victim, 'assessment', 'current'), map(5000)));
      // Deleting a saved map is never blocked by the size rule.
      await assertSucceeds(deleteDoc(doc(victim, 'users', UIDS.victim, 'history', 'at-limit')));
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
      await assertFails(deleteDoc(doc(asUser(UIDS.attacker), 'pushTokens', 'token-victim')));
      await assertSucceeds(deleteDoc(doc(owner, 'pushTokens', 'token-victim')));
    });

    it('allows authenticated single-code lookup but denies share-code collection listing', async () => {
      const owner = asUser(UIDS.victim, 'victim@example.com');
      await assertSucceeds(setDoc(doc(owner, 'shareCodes', 'abc123xy'), {
        uid: UIDS.victim, createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
        schema: 'parts-cartographer.v1',
        mapSnapshot: {
          schema: 'parts-cartographer.v1',
          profile: { headlineConstellation: 'A map' },
          parts: [{ id: 'part-1', name: 'A part' }],
          createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
          updatedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
        },
      }));
      const recipient = asUser(UIDS.attacker, 'attacker@example.com');
      const shared = await assertSucceeds(getDoc(doc(recipient, 'shareCodes', 'map123code45')));
      expect(shared.data()?.mapSnapshot.parts).toHaveLength(1);
      await assertFails(deleteDoc(doc(recipient, 'shareCodes', 'map123code45')));
      await assertFails(updateDoc(doc(recipient, 'shareCodes', 'map123code45'), { uid: UIDS.attacker }));
      await assertSucceeds(deleteDoc(codeRef));
      expect((await assertSucceeds(getDoc(doc(recipient, 'shareCodes', 'map123code45')))).exists()).toBe(false);
    });

    it('supports legacy assessment share codes through a bounded embedded snapshot', async () => {
      const owner = asUser(UIDS.victim, 'victim@example.com');
      await assertSucceeds(setDoc(doc(owner, 'shareCodes', 'legacy123'), {
        uid: UIDS.victim,
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
        assessment: {
          responses: Array(64).fill(3),
          dimensionalExpressions: { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
          results: { analysis: 'report', pantheon: [] },
          scoringMethod: 'deterministic',
          updatedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
        },
      }));
    });

    it('keeps public profile writes owner-only and available to signed-in therapist lookup', async () => {
      await seedDirectoryTherapists();
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

    it('never lets anyone list the directory, so emails cannot be harvested', async () => {
      await seedDirectoryTherapists();
      await assertSucceeds(setDoc(doc(asUser(UIDS.victim, 'victim@example.com'), 'publicProfiles', UIDS.victim), {
        emailLower: 'victim@example.com', email: 'victim@example.com', displayName: 'Vic', updatedAt: 'now',
      }));
      const stranger = asUser(UIDS.attacker, 'attacker@example.com');
      await assertFails(getDocs(collection(stranger, 'publicProfiles')));
      await assertFails(getDocs(query(collection(stranger, 'publicProfiles'), where('emailLower', '==', 'victim@example.com'))));
      await assertFails(getDocs(collection(stranger, 'directoryEmails')));
    });

    it('resolves a known email through the index, which only the email owner can write', async () => {
      await seedDirectoryTherapists();
      const victim = asUser(UIDS.victim, 'victim@example.com');
      await assertSucceeds(setDoc(doc(victim, 'directoryEmails', 'victim@example.com'), { uid: UIDS.victim, updatedAt: 'now' }));
      // A known address resolves for any signed-in user, one document at a time.
      const stranger = asUser(UIDS.attacker, 'attacker@example.com');
      await assertSucceeds(getDoc(doc(stranger, 'directoryEmails', 'victim@example.com')));
      // No one can claim another person's address, point their own address at someone else, or add fields.
      await assertFails(setDoc(doc(stranger, 'directoryEmails', 'victim@example.com'), { uid: UIDS.attacker, updatedAt: 'now' }));
      await assertFails(setDoc(doc(stranger, 'directoryEmails', 'attacker@example.com'), { uid: UIDS.victim, updatedAt: 'now' }));
      await assertFails(setDoc(doc(stranger, 'directoryEmails', 'attacker@example.com'), { uid: UIDS.attacker, updatedAt: 'now', note: 'x' }));
      await assertFails(deleteDoc(doc(stranger, 'directoryEmails', 'victim@example.com')));
      await assertFails(getDoc(doc(asAnon(), 'directoryEmails', 'victim@example.com')));
      await assertSucceeds(deleteDoc(doc(victim, 'directoryEmails', 'victim@example.com')));
    });

    it('refuses an index entry for an unverified address, so no one can squat a therapist email', async () => {
      await seedDirectoryTherapists();
      const squatter = asUser(UIDS.attacker, 'therapist@example.com', false);
      await assertFails(setDoc(doc(squatter, 'directoryEmails', 'therapist@example.com'), { uid: UIDS.attacker, updatedAt: 'now' }));
      const verified = asUser(UIDS.therapist, 'therapist@example.com', true);
      await assertSucceeds(setDoc(doc(verified, 'directoryEmails', 'therapist@example.com'), { uid: UIDS.therapist, updatedAt: 'now' }));
    });

    it('accepts a public profile for a verified address with capital letters', async () => {
      await seedDirectoryTherapists();
      const mixed = asUser('uid_mixed', 'Bob@Example.test', true);
      await assertSucceeds(setDoc(doc(mixed, 'publicProfiles', 'uid_mixed'), {
        emailLower: 'bob@example.test', email: 'Bob@Example.test', displayName: null, updatedAt: 'now',
      }));
    });

    it('keeps accounts that are not therapists out of the directory', async () => {
      const member = asUser(UIDS.client, 'client@example.com');
      await assertFails(setDoc(doc(member, 'publicProfiles', UIDS.client), {
        emailLower: 'client@example.com', email: 'client@example.com', displayName: 'Client', updatedAt: 'now',
      }));
      await assertFails(setDoc(doc(member, 'directoryEmails', 'client@example.com'), { uid: UIDS.client, updatedAt: 'now' }));
    });

    it('refuses a public profile for an unverified address', async () => {
      await seedDirectoryTherapists();
      const profile = { emailLower: 'therapist@example.com', email: 'therapist@example.com', displayName: 'Dr Vale', updatedAt: 'now' };
      await assertFails(setDoc(doc(asUser(UIDS.attacker, 'therapist@example.com', false), 'publicProfiles', UIDS.attacker), profile));
      await assertSucceeds(setDoc(doc(asUser(UIDS.therapist, 'therapist@example.com', true), 'publicProfiles', UIDS.therapist), profile));
    });
  });

  describe('therapist and booking relationships', () => {
    it('a booked therapist cannot read raw answers kept in an older assessment or history record', async () => {
      await createValidBooking();
      await seed(async (db) => {
        await setDoc(doc(db, 'users', UIDS.client, 'assessment', 'current'), {
          responses: Array(64).fill(3), createdAt: '2025-01-01T00:00:00.000Z',
        });
        await setDoc(doc(db, 'users', UIDS.client, 'history', 'legacy'), {
          schema: 'parts-cartographer.v1', responses: Array(64).fill(4), profile: {}, parts: [], createdAt: '2025-01-01T00:00:00.000Z',
        });
        await setDoc(doc(db, 'users', UIDS.client, 'assessment', 'summary'), {
          parts: [{ id: 'p1' }], createdAt: '2026-10-01T00:00:00.000Z',
        });
      });
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertFails(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'current')));
      await assertFails(getDoc(doc(therapist, 'users', UIDS.client, 'history', 'legacy')));
      await assertSucceeds(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'summary')));
    });

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
        start: `${NEXT_YEAR}-10-05T10:00`,
        end: `${NEXT_YEAR}-10-05T11:00`,
        status: 'pending',
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
        accessGranted: true,
      });
      duplicate.set(doc(secondClient, 'therapistBusySlots', `${UIDS.therapist}_${NEXT_YEAR}-10-05T10:00`), {
        therapistUid: UIDS.therapist,
        appointmentId: 'second-random-id',
        start: `${NEXT_YEAR}-10-05T10:00`,
        end: `${NEXT_YEAR}-10-05T11:00`,
      });
      await assertFails(duplicate.commit());
    });

    it('permits exactly one concurrent client reservation for the same therapist slot', async () => {
      await seedTherapistProfile();
      const attempts = [UIDS.client, UIDS.attacker].map((clientUid, index) => {
        const db = asUser(clientUid, `client${index}@example.com`);
        const id = `concurrent-${index}`;
        const batch = writeBatch(db);
        batch.set(doc(db, 'appointments', id), {
          clientUid, clientEmail: `client${index}@example.com`, therapistUid: UIDS.therapist,
          therapistEmail: 'therapist@example.com', start: `${NEXT_YEAR}-10-05T10:00`, end: `${NEXT_YEAR}-10-05T11:00`,
          status: 'pending', createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, accessGranted: true,
        });
        batch.set(doc(db, 'therapistBusySlots', `${UIDS.therapist}_${NEXT_YEAR}-10-05T10:00`), {
          therapistUid: UIDS.therapist, appointmentId: id, start: `${NEXT_YEAR}-10-05T10:00`, end: `${NEXT_YEAR}-10-05T11:00`,
        });
        return batch.commit();
      });
      const results = await Promise.allSettled(attempts);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
      await seed(async (db) => {
        expect((await getDocs(collection(db, 'appointments'))).size).toBe(1);
        expect((await getDocs(collection(db, 'therapistBusySlots'))).size).toBe(1);
      });
    });

    it('allows a valid appointment share and revokes cross-user reads when the appointment is declined', async () => {
      await seedVictimRecords(UIDS.client);
      await createValidBooking();
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertSucceeds(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'current')));
      await assertSucceeds(getDoc(doc(therapist, 'users', UIDS.client, 'history', 'h1')));
      const decline = writeBatch(therapist);
      decline.update(doc(therapist, 'appointments', `${UIDS.client}_1000`), { status: 'declined' });
      decline.delete(doc(therapist, 'therapistBusySlots', `${UIDS.therapist}_${NEXT_YEAR}-10-05T10:00`));
      await assertSucceeds(decline.commit());
      await assertFails(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'current')));
    });

    it('accepts an optional therapist statement up to 600 characters and refuses longer, non-string or extra fields', async () => {
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      const profile = (extra: Record<string, unknown>) => ({
        email: 'therapist@example.com',
        availability: [{ days: [1], start: '09:00', end: '17:00', minutes: 60, timeZone: 'UTC' }],
        ...extra,
      });
      await assertSucceeds(setDoc(doc(therapist, 'therapists', UIDS.therapist), profile({ statement: 'A calm, plain-language introduction.' })));
      await assertSucceeds(setDoc(doc(therapist, 'therapists', UIDS.therapist), profile({ statement: '' })));
      await assertFails(setDoc(doc(therapist, 'therapists', UIDS.therapist), profile({ statement: 'x'.repeat(601) })));
      await assertFails(setDoc(doc(therapist, 'therapists', UIDS.therapist), profile({ statement: 42 })));
      await assertFails(setDoc(doc(therapist, 'therapists', UIDS.therapist), profile({ statement: 'ok', rank: 1 })));
    });

    it('accepts a schemaVersion-2 zone time with its slot reservation and refuses malformed time fields', async () => {
      await seedTherapistProfile();
      const client = asUser(UIDS.client, 'client@example.com');
      const valid = {
        schemaVersion: 2,
        startUtc: `${NEXT_YEAR}-10-06T14:00:00.000Z`,
        endUtc: `${NEXT_YEAR}-10-06T15:00:00.000Z`,
        durationMinutes: 60,
        timeZone: 'America/New_York',
        wallStart: `${NEXT_YEAR}-10-06T10:00`,
        repeatedWallTime: null,
        source: { kind: 'availability-slot' },
      };
      // The same batch shape the client uses: the appointment and its slot reservation commit together.
      const bookWithTime = (appointmentId: string, time: unknown, start: string, end: string) => {
        const batch = writeBatch(client);
        batch.set(doc(client, 'appointments', appointmentId), {
          clientUid: UIDS.client,
          clientEmail: 'client@example.com',
          therapistUid: UIDS.therapist,
          therapistEmail: 'therapist@example.com',
          start,
          end,
          status: 'pending',
          createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
          accessGranted: true,
          time,
        });
        batch.set(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${start}`), {
          therapistUid: UIDS.therapist,
          appointmentId,
          start,
          end,
        });
        return batch.commit();
      };

      await assertSucceeds(bookWithTime(`${UIDS.client}_3100`, valid, `${NEXT_YEAR}-10-06T10:00`, `${NEXT_YEAR}-10-06T11:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3101`, 'nope', `${NEXT_YEAR}-10-06T11:00`, `${NEXT_YEAR}-10-06T12:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3102`, { ...valid, schemaVersion: 1 }, `${NEXT_YEAR}-10-06T12:00`, `${NEXT_YEAR}-10-06T13:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3103`, { ...valid, approvedBy: UIDS.client }, `${NEXT_YEAR}-10-06T13:00`, `${NEXT_YEAR}-10-06T14:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3104`, { ...valid, timeZone: 'x'.repeat(65) }, `${NEXT_YEAR}-10-06T14:00`, `${NEXT_YEAR}-10-06T15:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3105`, { ...valid, durationMinutes: 'sixty' }, `${NEXT_YEAR}-10-06T15:00`, `${NEXT_YEAR}-10-06T16:00`));
      // The zone time must describe the slot it reserves.
      const at = (hour: string) => ({ ...valid, wallStart: `${NEXT_YEAR}-10-07T${hour}:00` });
      await assertSucceeds(bookWithTime(`${UIDS.client}_3200`, at('09'), `${NEXT_YEAR}-10-07T09:00`, `${NEXT_YEAR}-10-07T10:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3201`, { ...at('10'), wallStart: `${NEXT_YEAR}-10-07T03:00` }, `${NEXT_YEAR}-10-07T10:00`, `${NEXT_YEAR}-10-07T11:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3202`, { ...at('11'), durationMinutes: -5 }, `${NEXT_YEAR}-10-07T11:00`, `${NEXT_YEAR}-10-07T12:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3203`, { ...at('12'), endUtc: '2020-01-01T00:00:00.000Z' }, `${NEXT_YEAR}-10-07T12:00`, `${NEXT_YEAR}-10-07T13:00`));
      await assertFails(bookWithTime(`${UIDS.client}_3204`, { ...at('13'), timeZone: 'Not a zone!' }, `${NEXT_YEAR}-10-07T13:00`, `${NEXT_YEAR}-10-07T14:00`));
    });

    it('rejects appointment field injection and invalid status transitions', async () => {
      await seedTherapistProfile();
      const client = asUser(UIDS.client, 'client@example.com');
      const base = {
        clientUid: UIDS.client,
        clientEmail: 'client@example.com',
        therapistUid: UIDS.therapist,
        therapistEmail: 'therapist@example.com',
        start: `${NEXT_YEAR}-10-05T10:00`,
        end: `${NEXT_YEAR}-10-05T11:00`,
        status: 'pending',
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
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
      cancel.delete(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${NEXT_YEAR}-10-05T10:00`));
      await assertSucceeds(cancel.commit());
    });

    it('allows a therapist to claim only a client-created invite code', async () => {
      await seedTherapistProfile();
      const client = asUser(UIDS.client, 'client@example.com');
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      const code = 'ABC2345678';
      await assertSucceeds(setDoc(doc(client, 'therapistLinks', code), {
        clientUid: UIDS.client,
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
        summary: THERAPIST_SUMMARY,
      }));
      await assertSucceeds(getDoc(doc(therapist, 'therapistLinks', code)));
      await assertSucceeds(claimInvite(therapist, UIDS.therapist, code));
      await assertSucceeds(getDoc(doc(therapist, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`)));
    });

    function inviteRow(therapistUid: string, code: string) {
      return {
        therapistUid,
        clientUid: UIDS.client,
        linkedAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`,
        source: 'invite',
        linkCode: code,
        summary: THERAPIST_SUMMARY,
      };
    }

    /** The claim marks the code as used by this therapist and adds the roster row in one batch. */
    function claimInvite(db: Firestore, therapistUid: string, code: string) {
      const batch = writeBatch(db);
      batch.update(doc(db, 'therapistLinks', code), { claimedBy: therapistUid });
      batch.set(doc(db, 'therapistClients', `${therapistUid}_${UIDS.client}`), inviteRow(therapistUid, code));
      return batch.commit();
    }

    async function seedInvite(code: string) {
      // The claiming therapist in these tests has a therapist profile; the attacker does not.
      await seedTherapistProfile();
      await assertSucceeds(setDoc(doc(asUser(UIDS.client, 'client@example.com'), 'therapistLinks', code), {
        clientUid: UIDS.client, createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, summary: THERAPIST_SUMMARY,
      }));
    }

    it('lets only one therapist claim an invite code', async () => {
      const code = 'ONEUSE2345';
      await seedInvite(code);
      const first = asUser(UIDS.therapist, 'therapist@example.com');
      const second = asUser(UIDS.attacker, 'attacker@example.com');
      // Without marking the code as claimed, the roster row is refused.
      await assertFails(setDoc(doc(second, 'therapistClients', `${UIDS.attacker}_${UIDS.client}`), inviteRow(UIDS.attacker, code)));
      await assertSucceeds(claimInvite(first, UIDS.therapist, code));
      await assertFails(claimInvite(second, UIDS.attacker, code));
      await assertFails(setDoc(doc(second, 'therapistClients', `${UIDS.attacker}_${UIDS.client}`), inviteRow(UIDS.attacker, code)));
      await assertFails(claimInvite(asAnon(), 'anon', code));
      // The client cannot claim their own code.
      await assertFails(updateDoc(doc(asUser(UIDS.client, 'client@example.com'), 'therapistLinks', code), { claimedBy: UIDS.client }));
    });

    it('does not let a booking turn an invite link into a booking link', async () => {
      const code = 'KEEPIN2345';
      await seedInvite(code);
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      const client = asUser(UIDS.client, 'client@example.com');
      await assertSucceeds(claimInvite(therapist, UIDS.therapist, code));
      await createValidBooking('appt_I').catch(() => undefined);
      // The booking's roster merge must not flip source: the invite keeps its trust.
      await assertFails(setDoc(doc(client, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`),
        { source: 'booking', appointmentId: 'appt_I', clientEmail: 'client@example.com', linkedAt: 'x' }, { merge: true }));
      await assertSucceeds(setDoc(doc(therapist, 'assignments', 'a-invite'), {
        id: 'a-invite', therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId: 'e1', frequency: 'once', assignedAt: 'now',
      }));
    });

    it('lets only a verified therapist claim a code', async () => {
      await seedInvite('THERONLY23');
      const anon = asUser('uid_anon_claimer');
      const anonClaim = writeBatch(anon);
      anonClaim.update(doc(anon, 'therapistLinks', 'THERONLY23'), { claimedBy: 'uid_anon_claimer' });
      anonClaim.set(doc(anon, 'therapistClients', `uid_anon_claimer_${UIDS.client}`), inviteRow('uid_anon_claimer', 'THERONLY23'));
      await assertFails(anonClaim.commit());
      await assertSucceeds(claimInvite(asUser(UIDS.therapist, 'therapist@example.com'), UIDS.therapist, 'THERONLY23'));
    });

    it('keeps an invite roster row free of booking fields, and lets the client remove assignments', async () => {
      await seedInvite('ROWKEYS234');
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertSucceeds(claimInvite(therapist, UIDS.therapist, 'ROWKEYS234'));
      await assertFails(setDoc(doc(therapist, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`),
        { ...inviteRow(UIDS.therapist, 'ROWKEYS234'), clientEmail: 'someone@else.test', appointmentId: 'fake' }));
      await assertSucceeds(setDoc(doc(therapist, 'assignments', 'a-del'), {
        id: 'a-del', therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId: 'e1', frequency: 'once', assignedAt: 'now',
      }));
      await assertFails(deleteDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'assignments', 'a-del')));
      await assertSucceeds(deleteDoc(doc(asUser(UIDS.client, 'client@example.com'), 'assignments', 'a-del')));
    });

    it('ends assignment and roster access when the therapist steps back', async () => {
      await seedInvite('STEPBACK23');
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertSucceeds(claimInvite(therapist, UIDS.therapist, 'STEPBACK23'));
      await assertSucceeds(deleteDoc(doc(therapist, 'therapists', UIDS.therapist)));
      await assertFails(setDoc(doc(therapist, 'assignments', 'a-after-stepback'), {
        id: 'a-after-stepback', therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId: 'red-1', frequency: 'daily', assignedAt: 'now',
      }));
      await assertFails(getDoc(doc(therapist, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`)));
      // The client still sees their own row.
      await assertSucceeds(getDoc(doc(asUser(UIDS.client, 'client@example.com'), 'therapistClients', `${UIDS.therapist}_${UIDS.client}`)));
    });

    it('ends summary and assessment reads when the therapist steps back', async () => {
      // A booking grants assessment reads; a claimed invite grants the summary.
      await createValidBooking('appt_SB');
      await seedVictimRecords(UIDS.client);
      await seedInvite('SUMMARY234');
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertSucceeds(claimInvite(therapist, UIDS.therapist, 'SUMMARY234'));
      await assertSucceeds(getDoc(doc(therapist, 'therapistLinks', 'SUMMARY234')));
      await assertSucceeds(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'current')));
      await assertSucceeds(deleteDoc(doc(therapist, 'therapists', UIDS.therapist)));
      await assertFails(getDoc(doc(therapist, 'therapistLinks', 'SUMMARY234')));
      await assertFails(getDoc(doc(therapist, 'users', UIDS.client, 'assessment', 'current')));
      await assertFails(getDoc(doc(therapist, 'users', UIDS.client, 'history', 'h1')));
    });

    it('lets the client find and delete codes nobody has claimed yet', async () => {
      await seedInvite('UNUSED2345');
      const client = asUser(UIDS.client, 'client@example.com');
      const mine = await getDocs(query(collection(client, 'therapistLinks'), where('clientUid', '==', UIDS.client)));
      expect(mine.docs.map((d) => d.id)).toContain('UNUSED2345');
      await assertFails(getDocs(query(collection(asUser(UIDS.attacker, 'attacker@example.com'), 'therapistLinks'), where('clientUid', '==', UIDS.client))));
      await assertSucceeds(deleteDoc(doc(client, 'therapistLinks', 'UNUSED2345')));
    });

    it('marks a code claimed only together with the roster row, and hides a claimed code from others', async () => {
      const code = 'CLAIMED234';
      await seedInvite(code);
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await assertFails(updateDoc(doc(therapist, 'therapistLinks', code), { claimedBy: UIDS.therapist }));
      await assertSucceeds(claimInvite(therapist, UIDS.therapist, code));
      await assertSucceeds(getDoc(doc(therapist, 'therapistLinks', code)));
      await assertSucceeds(getDoc(doc(asUser(UIDS.client, 'client@example.com'), 'therapistLinks', code)));
      await assertFails(getDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'therapistLinks', code)));
      // A code that does not exist can still be checked, so new codes avoid collisions.
      await assertSucceeds(getDoc(doc(asUser(UIDS.client, 'client@example.com'), 'therapistLinks', 'NOSUCH2345')));
    });

    it('lets the client revoke an invite link, which ends assignment rights and roster access', async () => {
      const code = 'REVOKE2345';
      await seedInvite(code);
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      const client = asUser(UIDS.client, 'client@example.com');
      await assertSucceeds(claimInvite(therapist, UIDS.therapist, code));
      await assertSucceeds(setDoc(doc(therapist, 'assignments', 'a-before'), {
        id: 'a-before', therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId: 'e1', frequency: 'once', assignedAt: 'now',
      }));
      // The client can find their own relationships to end them.
      await assertSucceeds(getDocs(query(collection(client, 'therapistClients'), where('clientUid', '==', UIDS.client))));
      await assertSucceeds(getDocs(query(collection(client, 'clientShares'), where('clientUid', '==', UIDS.client))));
      // Nobody but the two parties can delete the roster row.
      await assertFails(deleteDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'therapistClients', `${UIDS.therapist}_${UIDS.client}`)));
      const revoke = writeBatch(client);
      revoke.delete(doc(client, 'therapistLinks', code));
      revoke.delete(doc(client, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`));
      await assertSucceeds(revoke.commit());
      await assertFails(getDoc(doc(therapist, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`)));
      await assertFails(setDoc(doc(therapist, 'assignments', 'a-after'), {
        id: 'a-after', therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId: 'e1', frequency: 'once', assignedAt: 'now',
      }));
    });

    it('refuses a booking from an unverified address, so no one can book as someone else', async () => {
      await seedTherapistProfile();
      const impostor = asUser(UIDS.attacker, 'client@example.com', false);
      const start = `${NEXT_YEAR}-10-06T10:00`;
      const batch = writeBatch(impostor);
      batch.set(doc(impostor, 'appointments', `${UIDS.attacker}_1`), {
        clientUid: UIDS.attacker, clientEmail: 'client@example.com', therapistUid: UIDS.therapist,
        therapistEmail: 'therapist@example.com', start, end: `${NEXT_YEAR}-10-06T11:00`, status: 'pending',
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, accessGranted: true,
      });
      batch.set(doc(impostor, 'therapistBusySlots', `${UIDS.therapist}_${start}`), {
        therapistUid: UIDS.therapist, appointmentId: `${UIDS.attacker}_1`, start, end: `${NEXT_YEAR}-10-06T11:00`,
      });
      await assertFails(batch.commit());
    });

    it('lets a therapist cancel an approved appointment, releasing its slot', async () => {
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await createValidBooking('appt_T');
      await assertSucceeds(updateDoc(doc(therapist, 'appointments', 'appt_T'), { status: 'approved' }));
      // Without releasing the slot the cancellation is refused.
      await assertFails(updateDoc(doc(therapist, 'appointments', 'appt_T'), { status: 'cancelled' }));
      const cancel = writeBatch(therapist);
      cancel.update(doc(therapist, 'appointments', 'appt_T'), { status: 'cancelled' });
      cancel.delete(doc(therapist, 'therapistBusySlots', `${UIDS.therapist}_${NEXT_YEAR}-10-05T10:00`));
      await assertSucceeds(cancel.commit());
    });

    it('rejects bookings in the past or longer than one day', async () => {
      await seedTherapistProfile();
      const client = asUser(UIDS.client, 'client@example.com');
      const attempt = async (id: string, start: string, end: string) => {
        const batch = writeBatch(client);
        batch.set(doc(client, 'appointments', id), {
          clientUid: UIDS.client, clientEmail: 'client@example.com', therapistUid: UIDS.therapist,
          therapistEmail: 'therapist@example.com', start, end, status: 'pending',
          createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, accessGranted: true,
        });
        batch.set(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${start}`), { therapistUid: UIDS.therapist, appointmentId: id, start, end });
        return batch.commit();
      };
      await assertFails(attempt(`${UIDS.client}_past`, '2000-01-01T03:00', '2000-01-01T04:00'));
      await assertFails(attempt(`${UIDS.client}_long`, `${NEXT_YEAR}-01-01T03:00`, '2170-12-31T23:59'));
      await assertFails(attempt(`${UIDS.client}_far`, '9999-01-01T03:00', '9999-01-01T04:00'));
      const soon = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
      await assertSucceeds(attempt(`${UIDS.client}_ok`, `${soon}T03:00`, `${soon}T04:00`));
    });

    it('rejects impossible appointment times', async () => {
      await seedTherapistProfile();
      const client = asUser(UIDS.client, 'client@example.com');
      const start = `${NEXT_YEAR}-13-45T25:99`;
      const batch = writeBatch(client);
      batch.set(doc(client, 'appointments', `${UIDS.client}_bad`), {
        clientUid: UIDS.client, clientEmail: 'client@example.com', therapistUid: UIDS.therapist,
        therapistEmail: 'therapist@example.com', start, end: `${NEXT_YEAR}-13-45T26:99`, status: 'pending',
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, accessGranted: true,
      });
      batch.set(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${start}`), {
        therapistUid: UIDS.therapist, appointmentId: `${UIDS.client}_bad`, start, end: `${NEXT_YEAR}-13-45T26:99`,
      });
      await assertFails(batch.commit());
    });

    it('does not let anyone list therapists or publish a profile under an address they do not hold', async () => {
      await seedTherapistProfile();
      // Every visitor is signed in, at least anonymously.
      const visitor = asUser('uid_visitor');
      await assertFails(getDocs(collection(visitor, 'therapists')));
      await assertSucceeds(getDoc(doc(visitor, 'therapists', UIDS.therapist)));
      await assertFails(setDoc(doc(visitor, 'therapists', 'uid_visitor'), { email: 'famous@clinic.test', availability: [] }));
      await assertSucceeds(setDoc(doc(visitor, 'therapists', 'uid_visitor'), { email: null, availability: [] }));
      await assertFails(setDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'therapists', UIDS.attacker), { email: 'famous@clinic.test', availability: [] }));
      await assertFails(setDoc(doc(asUser(UIDS.attacker, 'attacker@example.com', false), 'therapists', UIDS.attacker), { email: 'attacker@example.com', availability: [] }));
      await assertSucceeds(setDoc(doc(asUser(UIDS.attacker, 'attacker@example.com'), 'therapists', UIDS.attacker), { email: 'attacker@example.com', availability: [] }));
    });

    it('lets the client keep a therapist\'s access on an approved booking after cancelling a newer one', async () => {
      const client = asUser(UIDS.client, 'client@example.com');
      const therapist = asUser(UIDS.therapist, 'therapist@example.com');
      await createValidBooking('appt_A');
      await assertSucceeds(updateDoc(doc(therapist, 'appointments', 'appt_A'), { status: 'approved' }));
      const bStart = `${NEXT_YEAR}-10-07T10:00`;
      const book = writeBatch(client);
      book.set(doc(client, 'appointments', 'appt_B'), {
        clientUid: UIDS.client, clientEmail: 'client@example.com', therapistUid: UIDS.therapist,
        therapistEmail: 'therapist@example.com', start: bStart, end: `${NEXT_YEAR}-10-07T11:00`, status: 'pending',
        createdAt: `${NEXT_YEAR}-10-01T00:00:00.000Z`, accessGranted: true,
      });
      book.set(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${bStart}`), {
        therapistUid: UIDS.therapist, appointmentId: 'appt_B', start: bStart, end: `${NEXT_YEAR}-10-07T11:00`,
      });
      await assertSucceeds(book.commit());
      const share = doc(client, 'clientShares', `${UIDS.therapist}_${UIDS.client}`);
      const roster = doc(client, 'therapistClients', `${UIDS.therapist}_${UIDS.client}`);
      await assertSucceeds(setDoc(share, { appointmentId: 'appt_B', grantedAt: 'later' }, { merge: true }));
      await assertSucceeds(setDoc(roster, { appointmentId: 'appt_B', linkedAt: 'later' }, { merge: true }));
      const cancel = writeBatch(client);
      cancel.update(doc(client, 'appointments', 'appt_B'), { status: 'cancelled' });
      cancel.delete(doc(client, 'therapistBusySlots', `${UIDS.therapist}_${bStart}`));
      await assertSucceeds(cancel.commit());
      const assign = (id: string) => setDoc(doc(therapist, 'assignments', id), {
        id, therapistUid: UIDS.therapist, clientUid: UIDS.client, exerciseId: 'e1', frequency: 'once', assignedAt: 'now',
      });
      // Pointing at the cancelled booking, the therapist is cut off...
      await assertFails(assign('a-cut'));
      // ...and the client's re-point to the approved one (keepBookingAccess) restores access.
      await assertSucceeds(setDoc(share, { appointmentId: 'appt_A', grantedAt: 'again' }, { merge: true }));
      await assertSucceeds(setDoc(roster, { appointmentId: 'appt_A', linkedAt: 'again' }, { merge: true }));
      await assertSucceeds(assign('a-kept'));
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
