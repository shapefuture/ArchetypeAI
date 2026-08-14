/**
 * Specialist → Client linking service.
 *
 * Storage model: `adminClients/{adminUid}_{clientUid}` documents. The docId is
 * the join key (composite of admin + client UID with `_` separator), so the
 * specialist's "My clients" list is just a `getDocs(collection(db, 'adminClients'))`
 * filtered by prefix. No composite indexes needed, no subcollection fan-out.
 *
 * The pure helpers (buildDocId, parseDocId, clientMatchesAdmin) are extracted
 * to be unit-testable without Firestore, mirroring the
 * `FirebaseStorageAdapter.mergeCurrentIntoHistory` pattern.
 *
 * The Firestore-touching methods are covered with `vi.mock('firebase/firestore')`
 * to verify call shape (right docId, right payload) without booting the SDK.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the firebase/firestore module BEFORE importing the service under test,
// so the service picks up the mocks at module-init time.
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, name) => ({ __kind: 'collection', db, name })),
  doc: vi.fn((db, collectionName, docId) => ({
    __kind: 'doc',
    db,
    collectionName,
    docId,
  })),
  setDoc: vi.fn(async () => undefined),
  deleteDoc: vi.fn(async () => undefined),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  getDocs: vi.fn(async () => ({ docs: [] })),
  updateDoc: vi.fn(async () => undefined),
  query: vi.fn((coll, ...constraints) => ({ __kind: 'query', coll, constraints })),
  where: vi.fn((field, op, value) => ({ __kind: 'where', field, op, value })),
  orderBy: vi.fn((field, direction) => ({ __kind: 'orderBy', field, direction })),
  limit: vi.fn((value) => ({ __kind: 'limit', value })),
  initializeFirestore: vi.fn(() => ({ __mockDb: true })),
  initializeApp: vi.fn(() => ({ __mockApp: true })),
}));

// Mock the firebase-init shim so `getFirestoreDb()` doesn't try to call
// the real initializeApp / initializeFirestore — we just return a sentinel
// "db" object. The service only ever uses the `db` as the first arg to
// doc()/collection(), and the mocked firestore functions don't read it.
vi.mock('../environments/firebase-init', () => ({
  getFirestoreDb: vi.fn(() => ({ __mockDb: true })),
}));

import * as firestore from 'firebase/firestore';
import {
  SpecialistClientService,
  buildDocId,
  parseDocId,
  clientMatchesAdmin,
  ClientLink,
} from './specialist-client.service';

const mockedFirestore = firestore as unknown as {
  collection: ReturnType<typeof vi.fn>;
  doc: ReturnType<typeof vi.fn>;
  setDoc: ReturnType<typeof vi.fn>;
  deleteDoc: ReturnType<typeof vi.fn>;
  getDoc: ReturnType<typeof vi.fn>;
  getDocs: ReturnType<typeof vi.fn>;
  updateDoc: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

describe('buildDocId (pure helper)', () => {
  it('joins admin and client UIDs with a single underscore', () => {
    expect(buildDocId('admin123', 'client456')).toBe('admin123_client456');
  });

  it('preserves UIDs that already contain underscores (UIDs themselves never do, but defensive)', () => {
    // Firebase UIDs are alphanumeric, but the helper must not strip or
    // mangle input — caller is responsible for valid UIDs.
    expect(buildDocId('admin-abc', 'client-xyz')).toBe('admin-abc_client-xyz');
  });

  it('preserves empty UIDs as empty (does not throw) — caller must validate', () => {
    // We document the behavior but don't enforce validation here; the
    // service methods throw before calling this helper with bad input.
    expect(buildDocId('', 'client')).toBe('_client');
    expect(buildDocId('admin', '')).toBe('admin_');
  });
});

describe('parseDocId (pure helper)', () => {
  it('splits a valid docId on the FIRST underscore into { adminUid, clientUid }', () => {
    expect(parseDocId('admin123_client456')).toEqual({
      adminUid: 'admin123',
      clientUid: 'client456',
    });
  });

  it('treats additional underscores in the clientUid as part of the client side', () => {
    // The separator is the FIRST underscore. UIDs are alphanumeric so this
    // never happens in practice, but the helper must be deterministic.
    expect(parseDocId('admin_part1_part2')).toEqual({
      adminUid: 'admin',
      clientUid: 'part1_part2',
    });
  });

  it('returns null for docIds with no underscore (malformed)', () => {
    expect(parseDocId('adminclient')).toBeNull();
  });

  it('returns null for docIds with empty adminUid ("_client")', () => {
    expect(parseDocId('_client')).toBeNull();
  });

  it('returns null for docIds with empty clientUid ("admin_")', () => {
    expect(parseDocId('admin_')).toBeNull();
  });

  it('round-trips with buildDocId', () => {
    const admin = 'adm1n-2-xyz';
    const client = 'cl1ent-7-abc';
    expect(parseDocId(buildDocId(admin, client))).toEqual({
      adminUid: admin,
      clientUid: client,
    });
  });
});

describe('clientMatchesAdmin (pure helper)', () => {
  it('returns true when docId starts with `${adminUid}_`', () => {
    expect(clientMatchesAdmin('admin1_client1', 'admin1')).toBe(true);
    expect(clientMatchesAdmin('admin1_client2', 'admin1')).toBe(true);
  });

  it('returns false when docId does not start with the admin UID', () => {
    expect(clientMatchesAdmin('admin2_client1', 'admin1')).toBe(false);
  });

  it('returns false for a docId that EQUALS the admin UID (no separator)', () => {
    // A docId of "admin1" (no underscore) is not a valid link record.
    expect(clientMatchesAdmin('admin1', 'admin1')).toBe(false);
  });

  it('returns false for an admin UID that is a prefix of another admin UID without separator', () => {
    // "admin1" should NOT match "admin12_client1" — must check the separator.
    expect(clientMatchesAdmin('admin12_client1', 'admin1')).toBe(false);
  });
});

describe('SpecialistClientService — addClientByUid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects empty adminUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.addClientByUid('', 'client1')).rejects.toThrow(/adminUid/);
  });

  it('rejects empty clientUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.addClientByUid('admin1', '')).rejects.toThrow(/clientUid/);
  });

  it('writes a doc to adminClients/{adminUid}_{clientUid} with the full payload', async () => {
    const svc = new SpecialistClientService();
    await svc.addClientByUid('admin1', 'client1', 'c@e.com', 'admin-uid-1');

    // doc() must be called with collectionName='adminClients' and the joined docId
    expect(mockedFirestore.doc).toHaveBeenCalledWith(
      expect.anything(),
      'adminClients',
      'admin1_client1',
    );
    // setDoc must be called once with the doc ref
    expect(mockedFirestore.setDoc).toHaveBeenCalledTimes(1);
    const [docRef, payload] = mockedFirestore.setDoc.mock.calls[0];
    expect(docRef.docId).toBe('admin1_client1');
    expect(payload).toMatchObject({
      adminUid: 'admin1',
      clientUid: 'client1',
      clientEmail: 'c@e.com',
      addedByUid: 'admin-uid-1',
      notes: '',
    });
    expect(typeof payload.addedAt).toBe('string');
    // addedAt must be a parseable ISO timestamp
    expect(Number.isNaN(Date.parse(payload.addedAt))).toBe(false);
  });

  it('normalises null clientEmail to null in the payload', async () => {
    const svc = new SpecialistClientService();
    await svc.addClientByUid('admin1', 'client1', null, 'admin-uid-1');

    const [, payload] = mockedFirestore.setDoc.mock.calls[0];
    expect(payload.clientEmail).toBeNull();
  });
});

describe('SpecialistClientService — listMyClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty array when no docs exist', async () => {
    mockedFirestore.getDocs.mockResolvedValueOnce({ docs: [] });
    const svc = new SpecialistClientService();
    const list = await svc.listMyClients('admin1');
    expect(list).toEqual([]);
  });

  it('issues a `where("adminUid", "==", adminUid)` query (Firestore filters, not JS)', async () => {
    // The Firestore rules for `adminClients` require the `adminUid` field
    // filter — a full collection scan (`getDocs(collection(...))` without
    // a where) is not allowed by the rules engine. Verify the query is
    // shaped correctly so the rules can authorize it.
    mockedFirestore.getDocs.mockResolvedValueOnce({ docs: [] });
    const svc = new SpecialistClientService();
    await svc.listMyClients('admin1');

    // collection() must be called with the right name
    expect(mockedFirestore.collection).toHaveBeenCalledWith(
      expect.anything(),
      'adminClients',
    );
    // where() must be called with the adminUid equality filter
    expect(mockedFirestore.where).toHaveBeenCalledWith('adminUid', '==', 'admin1');
    // query() must wrap the collection + the where constraint
    expect(mockedFirestore.query).toHaveBeenCalledTimes(1);
    const queryArgs = mockedFirestore.query.mock.calls[0];
    expect(queryArgs[0]).toMatchObject({ __kind: 'collection', name: 'adminClients' });
    expect(queryArgs[1]).toMatchObject({ __kind: 'where', field: 'adminUid', op: '==', value: 'admin1' });
    // getDocs() receives the query, not the raw collection
    expect(mockedFirestore.getDocs).toHaveBeenCalledWith(
      expect.objectContaining({ __kind: 'query' }),
    );
  });

  it('returns docs that match the adminUid filter (the query already filtered them)', async () => {
    // Because the query is server-side filtered, the service trusts the
    // returned docs — it no longer does a docId-prefix filter in JS.
    // That's important: Firestore rules depend on the field, not docId.
    const linkA: ClientLink = {
      adminUid: 'admin1', clientUid: 'c1', clientEmail: 'a@e.com',
      notes: '', addedAt: '2026-06-01T00:00:00.000Z', addedByUid: 'admin1',
    };
    const linkB: ClientLink = {
      adminUid: 'admin1', clientUid: 'c2', clientEmail: 'b@e.com',
      notes: '', addedAt: '2026-06-02T00:00:00.000Z', addedByUid: 'admin1',
    };
    mockedFirestore.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'admin1_c1', data: () => linkA },
        { id: 'admin1_c2', data: () => linkB },
      ],
    });

    const svc = new SpecialistClientService();
    const list = await svc.listMyClients('admin1');

    expect(list).toHaveLength(2);
    const ids = list.map(l => l.clientUid).sort();
    expect(ids).toEqual(['c1', 'c2']);
  });

  it('falls back to parsing the docId when the `adminUid` field is missing (legacy docs)', async () => {
    // Older docs (pre-rule-update) may not have the `adminUid` field.
    // The service should still be able to display them by parsing the
    // canonical `{adminUid}_{clientUid}` docId.
    const legacyDoc = {
      adminUid: undefined,
      clientUid: undefined,
      clientEmail: 'legacy@e.com',
      notes: '',
      addedAt: '2026-01-01T00:00:00.000Z',
      addedByUid: 'someone',
    };
    mockedFirestore.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'admin1_legacyC', data: () => legacyDoc },
      ],
    });

    const svc = new SpecialistClientService();
    const list = await svc.listMyClients('admin1');

    expect(list).toHaveLength(1);
    expect(list[0].adminUid).toBe('admin1');
    expect(list[0].clientUid).toBe('legacyC');
    expect(list[0].clientEmail).toBe('legacy@e.com');
  });

  it('sorts results by addedAt descending (newest first)', async () => {
    const older: ClientLink = {
      adminUid: 'admin1', clientUid: 'c1', clientEmail: null,
      notes: '', addedAt: '2026-01-01T00:00:00.000Z', addedByUid: 'admin1',
    };
    const newer: ClientLink = {
      adminUid: 'admin1', clientUid: 'c2', clientEmail: null,
      notes: '', addedAt: '2026-06-01T00:00:00.000Z', addedByUid: 'admin1',
    };
    const middle: ClientLink = {
      adminUid: 'admin1', clientUid: 'c3', clientEmail: null,
      notes: '', addedAt: '2026-03-01T00:00:00.000Z', addedByUid: 'admin1',
    };
    mockedFirestore.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'admin1_c1', data: () => older },
        { id: 'admin1_c2', data: () => newer },
        { id: 'admin1_c3', data: () => middle },
      ],
    });

    const svc = new SpecialistClientService();
    const list = await svc.listMyClients('admin1');

    expect(list.map(l => l.clientUid)).toEqual(['c2', 'c3', 'c1']);
  });
});

describe('SpecialistClientService — removeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the adminClients/{adminUid}_{clientUid} doc', async () => {
    const svc = new SpecialistClientService();
    await svc.removeClient('admin1', 'client1');

    expect(mockedFirestore.doc).toHaveBeenCalledWith(
      expect.anything(),
      'adminClients',
      'admin1_client1',
    );
    expect(mockedFirestore.deleteDoc).toHaveBeenCalledTimes(1);
  });

  it('rejects empty adminUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.removeClient('', 'c1')).rejects.toThrow(/adminUid/);
  });

  it('rejects empty clientUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.removeClient('admin1', '')).rejects.toThrow(/clientUid/);
  });
});

describe('SpecialistClientService — updateNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates only the notes field on the existing doc (uses updateDoc, not setDoc-merge)', async () => {
    const svc = new SpecialistClientService();
    await svc.updateNotes('admin1', 'client1', 'prefers weekly check-ins');

    expect(mockedFirestore.doc).toHaveBeenCalledWith(
      expect.anything(),
      'adminClients',
      'admin1_client1',
    );
    expect(mockedFirestore.updateDoc).toHaveBeenCalledTimes(1);
    const [docRef, payload] = mockedFirestore.updateDoc.mock.calls[0];
    expect(docRef.docId).toBe('admin1_client1');
    expect(payload).toEqual({ notes: 'prefers weekly check-ins' });
  });

  it('rejects empty adminUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.updateNotes('', 'c1', 'note')).rejects.toThrow(/adminUid/);
  });

  it('rejects empty clientUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.updateNotes('admin1', '', 'note')).rejects.toThrow(/clientUid/);
  });
});

describe('SpecialistClientService — getClientLatestResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads users/{clientUid}/assessment/current and returns the doc data', async () => {
    const data = {
      responses: new Array(64).fill(3),
      dimensionalExpressions: { AGENCY: 0.5, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
      results: { analysis: 'x', pantheon: [] },
      scoringMethod: 'deterministic',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    mockedFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => data,
    });

    const svc = new SpecialistClientService();
    const result = await svc.getClientLatestResults('client1');

    expect(mockedFirestore.doc).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      'client1',
      'assessment',
      'current',
    );
    expect(result).toEqual(data);
  });

  it('returns null when the user has no current assessment', async () => {
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    const svc = new SpecialistClientService();
    const result = await svc.getClientLatestResults('client1');

    expect(result).toBeNull();
  });

  it('rejects empty clientUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.getClientLatestResults('')).rejects.toThrow(/clientUid/);
  });
});

describe('SpecialistClientService — getClientHistory', () => {
  // The specialist's "My clients" dashboard previously showed only the
  // LATEST assessment per client (getClientLatestResults). The user
  // reported they want to download any historical version individually,
  // not just the most recent one. getClientHistory reads the full
  // history subcollection so the cabinet can render one download button
  // per version.
  //
  // Storage layout (mirrors the storage adapter's loadHistory):
  //   users/{clientUid}/assessment/current   — latest snapshot
  //   users/{clientUid}/history/{docId}     — older snapshots
  //
  // De-dup: when the history collection is non-empty, it's the source of
  // truth and `current` is NOT prepended (avoids the duplicate-entry bug
  // — see firebase-storage.adapter.spec.ts for the original regression).
  // When history is empty but `current` exists, `current` is the fallback
  // (legacy users with only a `current` doc).

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeEntry = (createdAt: string, scoringMethod: string): any => ({
    responses: new Array(64).fill(3),
    dimensionalExpressions: { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
    results: { analysis: '', pantheon: [] },
    scoringMethod,
    createdAt,
    updatedAt: createdAt,
  });

  it('rejects empty clientUid', async () => {
    const svc = new SpecialistClientService();
    await expect(svc.getClientHistory('')).rejects.toThrow(/clientUid/);
  });

  it('returns [] when the client has no history AND no current snapshot', async () => {
    mockedFirestore.getDocs.mockResolvedValueOnce({ docs: [], empty: true });
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    const svc = new SpecialistClientService();
    const history = await svc.getClientHistory('client1');

    expect(history).toEqual([]);
  });

  it('falls back to `current` as the only entry when the history collection is empty (legacy user)', async () => {
    const current = makeEntry('2026-06-01T00:00:00.000Z', 'deterministic');
    mockedFirestore.getDocs.mockResolvedValueOnce({ docs: [], empty: true });
    mockedFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => current,
    });

    const svc = new SpecialistClientService();
    const history = await svc.getClientHistory('client1');

    expect(history).toEqual([current]);
  });

  it('returns history docs and IGNORES `current` when history is non-empty (de-dup)', async () => {
    // This is the regression scenario: if we naively prepended `current`
    // to the history list, the admin would see a phantom duplicate of
    // the newest entry. When history is non-empty, `current` is ignored.
    const historyEntry = makeEntry('2026-06-05T12:00:00.000Z', 'deterministic');
    const current = makeEntry('2026-06-05T12:00:01.000Z', 'deterministic');
    mockedFirestore.getDocs.mockResolvedValueOnce({
      docs: [{ id: 'h1', data: () => historyEntry }],
    });
    mockedFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => current,
    });

    const svc = new SpecialistClientService();
    const history = await svc.getClientHistory('client1');

    // Only the history entry is returned — `current` is dropped because
    // the history collection is already the source of truth.
    expect(history).toEqual([historyEntry]);
  });

  it('queries the history subcollection ordered by createdAt desc, with a limit', async () => {
    // The shape of the query matters for the Firestore rules + index.
    // We assert the query uses orderBy('createdAt', 'desc') and limit(20)
    // (the same shape as the storage adapter's loadHistory).
    mockedFirestore.getDocs.mockResolvedValueOnce({ docs: [], empty: true });
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    const svc = new SpecialistClientService();
    await svc.getClientHistory('client1');

    // collection() targets the history subcollection
    expect(mockedFirestore.collection).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      'client1',
      'history',
    );
    // orderBy + limit + where constraints were used in the query
    const queryArgs = mockedFirestore.query.mock.calls[0];
    expect(queryArgs.length).toBeGreaterThan(1);
    // Check that orderBy('createdAt', 'desc') was one of the constraints
    const hasOrderBy = queryArgs.some((c: any) =>
      c && c.__kind === 'orderBy' && c.field === 'createdAt' && c.direction === 'desc',
    );
    expect(hasOrderBy).toBe(true);
    // Check that limit(20) was one of the constraints
    const hasLimit = queryArgs.some((c: any) =>
      c && c.__kind === 'limit' && c.value === 20,
    );
    expect(hasLimit).toBe(true);
  });

  it('also reads users/{clientUid}/assessment/current (to use as fallback)', async () => {
    mockedFirestore.getDocs.mockResolvedValueOnce({ docs: [], empty: true });
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    const svc = new SpecialistClientService();
    await svc.getClientHistory('client1');

    // doc() for current must be called
    const currentDocCall = mockedFirestore.doc.mock.calls.find(
      (c: any[]) => c[1] === 'users' && c[2] === 'client1' && c[3] === 'assessment' && c[4] === 'current',
    );
    expect(currentDocCall).toBeDefined();
  });
});
