/**
 * User directory service — public profile sync + UID/email lookup.
 *
 * The service does three things:
 *
 *  1. Sync a small public profile (uid, email, displayName) into
 *     `publicProfiles/{uid}` on every non-anonymous sign-in. The
 *     sync is debounced + best-effort.
 *
 *  2. `lookupByUid(uid)` and `lookupByEmail(email)` resolve a profile
 *     from the directory.
 *
 *  3. Cache resolved results in-memory for 5 minutes so the cabinet
 *     form can debounce keystrokes without hammering Firestore.
 *
 * `inject(AUTH_PORT)` is used in the constructor → tests must run
 * through TestBed (which is why the constructor-using services in
 * the codebase use TestBed, while pure-function services like
 * `SpecialistClientService` can be tested with `new`). The
 * `firebase/firestore` and `firebase-init` modules are mocked so
 * no real SDK boots.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Mock firebase/firestore BEFORE importing the service under test, so
// the service picks up the mocks at module-init time. The shapes match
// the real SDK: each function returns a "ref" object whose identity is
// stable enough to assert on.
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, name) => ({ __kind: 'collection', db, name })),
  doc: vi.fn((db, collectionName, docId) => ({
    __kind: 'doc',
    db,
    collectionName,
    docId,
  })),
  setDoc: vi.fn(async () => undefined),
  // Default `getDoc` returns a "doc does not exist" snapshot. The
  // service short-circuits on `exists: () => false`, so `id` and `data`
  // are not read in the default case. Individual tests that exercise
  // the "doc exists" path override this and provide `id` + `data`.
  getDoc: vi.fn(async () => ({ exists: () => false })),
  // Default `getDocs` returns an EMPTY snapshot. Mirrors the real
  // Firestore QuerySnapshot (`empty: true` when there are no docs).
  // Tests that return docs override this and set `empty: false` (or
  // just leave it undefined — the service only checks truthiness).
  getDocs: vi.fn(async () => ({ docs: [], empty: true })),
  query: vi.fn((coll, ...constraints) => ({ __kind: 'query', coll, constraints })),
  where: vi.fn((field, op, value) => ({ __kind: 'where', field, op, value })),
}));

vi.mock('../environments/firebase-init', () => ({
  getFirestoreDb: vi.fn(() => ({ __mockDb: true })),
}));

import * as firestore from 'firebase/firestore';
import { AUTH_PORT, User, AuthPort } from '../app/core/ports/auth.port';
import { UserDirectoryService, PublicUserProfile } from './user-directory.service';

const mockedFirestore = firestore as unknown as {
  collection: ReturnType<typeof vi.fn>;
  doc: ReturnType<typeof vi.fn>;
  setDoc: ReturnType<typeof vi.fn>;
  getDoc: ReturnType<typeof vi.fn>;
  getDocs: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
};

/**
 * Test double for AUTH_PORT. We only need `user$` for these tests; the
 * other AuthPort methods are stubbed so the type contract is satisfied.
 * The `user$` is a BehaviorSubject so the constructor's subscription
 * synchronously replays whatever we set BEFORE `TestBed.inject(...)`.
 */
class MockAuthPort {
  readonly user$ = new BehaviorSubject<User | null>(null);
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);
  async signInAnonymously() { /* noop */ }
  async signInWithGoogle() { /* noop */ }
  async signInWithGoogleRedirect() { /* noop */ }
  async signInWithEmail() { /* noop */ }
  async signUpWithEmail() { /* noop */ }
  async linkAnonymousToGoogle() { /* noop */ }
  async linkAnonymousToGoogleRedirect() { /* noop */ }
  async linkAnonymousToEmail() { /* noop */ }
  async signOut() { /* noop */ }
}

const makeUser = (overrides: Partial<User> = {}): User => ({
  uid: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  isAnonymous: false,
  ...overrides,
});

/**
 * Build a fresh TestBed + service. Each test gets a new service (and
 * therefore a new in-memory cache). The mockAuth is the same object
 * the service subscribes to, so the test can drive sign-in events by
 * calling `mockAuth.user$.next(...)`.
 */
const setup = (mockAuth: MockAuthPort): UserDirectoryService => {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: AUTH_PORT, useValue: mockAuth },
    ],
  });
  return TestBed.inject(UserDirectoryService);
};

describe('UserDirectoryService — writeMyProfile', () => {
  let mockAuth: MockAuthPort;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = new MockAuthPort();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('writes a doc to publicProfiles/{uid} with merge: true', async () => {
    const svc = setup(mockAuth);
    await svc.writeMyProfile(makeUser());

    // doc() must point at the right collection and docId
    expect(mockedFirestore.doc).toHaveBeenCalledWith(
      expect.anything(),
      'publicProfiles',
      'user-1',
    );
    // setDoc receives the doc ref + the payload + the merge option
    expect(mockedFirestore.setDoc).toHaveBeenCalledTimes(1);
    const [docRef, payload, options] = mockedFirestore.setDoc.mock.calls[0];
    expect(docRef.docId).toBe('user-1');
    expect(options).toEqual({ merge: true });
    expect(payload).toMatchObject({
      emailLower: 'alice@example.com',
      email: 'alice@example.com',
      displayName: 'Alice',
    });
    // updatedAt must be a parseable ISO timestamp
    expect(typeof payload.updatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(payload.updatedAt))).toBe(false);
  });

  it('stores the lowercased email in emailLower but preserves the original case in email', async () => {
    const svc = setup(mockAuth);
    await svc.writeMyProfile(makeUser({ email: 'Alice@Example.COM' }));

    const [, payload] = mockedFirestore.setDoc.mock.calls[0];
    expect(payload.emailLower).toBe('alice@example.com');
    expect(payload.email).toBe('Alice@Example.COM');
  });

  it('normalises null email/displayName to null and an empty emailLower string', async () => {
    const svc = setup(mockAuth);
    await svc.writeMyProfile(makeUser({ email: null, displayName: null }));

    const [, payload] = mockedFirestore.setDoc.mock.calls[0];
    // emailLower is the search key — empty string keeps the index usable
    expect(payload.emailLower).toBe('');
    // The original fields are null so callers can tell "no email" from "empty string"
    expect(payload.email).toBeNull();
    expect(payload.displayName).toBeNull();
  });
});

describe('UserDirectoryService — lookupByUid', () => {
  let mockAuth: MockAuthPort;
  let svc: UserDirectoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = new MockAuthPort();
    svc = setup(mockAuth);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('returns null for empty input without hitting Firestore', async () => {
    const result = await svc.lookupByUid('');
    expect(result).toBeNull();
    expect(mockedFirestore.getDoc).not.toHaveBeenCalled();
  });

  it('returns null for whitespace-only input without hitting Firestore', async () => {
    const result = await svc.lookupByUid('   ');
    expect(result).toBeNull();
    expect(mockedFirestore.getDoc).not.toHaveBeenCalled();
  });

  it('trims the UID before reading the doc', async () => {
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });
    await svc.lookupByUid('  user-1  ');

    expect(mockedFirestore.doc).toHaveBeenCalledWith(
      expect.anything(),
      'publicProfiles',
      'user-1',
    );
  });

  it('returns null and caches the negative result when the doc does not exist', async () => {
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });

    const first = await svc.lookupByUid('user-1');
    expect(first).toBeNull();
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(1);

    // Second lookup must NOT hit Firestore again — the negative result is cached
    const second = await svc.lookupByUid('user-1');
    expect(second).toBeNull();
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(1);
  });

  it('returns a PublicUserProfile when the doc exists', async () => {
    mockedFirestore.getDoc.mockResolvedValueOnce({
      id: 'user-1',
      exists: () => true,
      data: () => ({ email: 'a@e.com', displayName: 'Alice' }),
    });

    const result = await svc.lookupByUid('user-1');
    expect(result).toEqual({
      uid: 'user-1',
      email: 'a@e.com',
      displayName: 'Alice',
    });
  });

  it('normalises missing email/displayName fields to null (defensive)', async () => {
    // Older or partially-written docs may not have all fields.
    mockedFirestore.getDoc.mockResolvedValueOnce({
      id: 'user-1',
      exists: () => true,
      data: () => ({}),
    });

    const result = await svc.lookupByUid('user-1');
    expect(result).toEqual({ uid: 'user-1', email: null, displayName: null });
  });
});

describe('UserDirectoryService — lookupByEmail', () => {
  let mockAuth: MockAuthPort;
  let svc: UserDirectoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = new MockAuthPort();
    svc = setup(mockAuth);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('returns null for empty input without hitting Firestore', async () => {
    const result = await svc.lookupByEmail('');
    expect(result).toBeNull();
    expect(mockedFirestore.getDocs).not.toHaveBeenCalled();
  });

  it('normalises the email to lowercase before querying', async () => {
    // Default mock returns an empty snapshot ({ docs: [], empty: true })
    // which is exactly what we need here — the test only cares about
    // the `where` argument, not the result.
    await svc.lookupByEmail('Alice@Example.COM');

    expect(mockedFirestore.where).toHaveBeenCalledWith('emailLower', '==', 'alice@example.com');
  });

  it('issues a `where(emailLower, ==, normalized)` query on publicProfiles (index-required)', async () => {
    // The `where` query needs the `emailLower` index declared in
    // firestore.indexes.json. We assert the query shape matches what
    // the index supports: collection-scoped, single `where`, equality
    // comparison.
    await svc.lookupByEmail('alice@example.com');

    expect(mockedFirestore.collection).toHaveBeenCalledWith(
      expect.anything(),
      'publicProfiles',
    );
    expect(mockedFirestore.query).toHaveBeenCalledTimes(1);
    const queryArgs = mockedFirestore.query.mock.calls[0];
    expect(queryArgs[0]).toMatchObject({ __kind: 'collection', name: 'publicProfiles' });
    expect(queryArgs[1]).toMatchObject({
      __kind: 'where',
      field: 'emailLower',
      op: '==',
      value: 'alice@example.com',
    });
    expect(mockedFirestore.getDocs).toHaveBeenCalledWith(
      expect.objectContaining({ __kind: 'query' }),
    );
  });

  it('returns null and caches the negative result when no docs match', async () => {
    mockedFirestore.getDocs.mockResolvedValueOnce({ docs: [], empty: true });

    const first = await svc.lookupByEmail('alice@example.com');
    expect(first).toBeNull();
    expect(mockedFirestore.getDocs).toHaveBeenCalledTimes(1);

    // Second lookup must hit the cache, not Firestore
    const second = await svc.lookupByEmail('alice@example.com');
    expect(second).toBeNull();
    expect(mockedFirestore.getDocs).toHaveBeenCalledTimes(1);
  });

  it('returns the first matching doc as a PublicUserProfile (uid = doc id)', async () => {
    mockedFirestore.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'user-1', data: () => ({ email: 'alice@example.com', displayName: 'Alice' }) },
        { id: 'user-2', data: () => ({ email: 'alice@example.com', displayName: 'Alice 2' }) },
      ],
    });

    const result = await svc.lookupByEmail('alice@example.com');
    // The service takes the first doc — email lookups should be unique
    // (the index isn't unique, but in practice emails are), so the
    // first one is fine.
    expect(result).toEqual({
      uid: 'user-1',
      email: 'alice@example.com',
      displayName: 'Alice',
    });
  });
});

describe('UserDirectoryService — clearCache', () => {
  let mockAuth: MockAuthPort;
  let svc: UserDirectoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = new MockAuthPort();
    svc = setup(mockAuth);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('forces the next lookup to hit Firestore again', async () => {
    mockedFirestore.getDoc.mockResolvedValue({ exists: () => false });

    await svc.lookupByUid('user-1');
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(1);

    svc.clearCache();

    await svc.lookupByUid('user-1');
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(2);
  });
});

describe('UserDirectoryService — cache TTL (5 minutes)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('serves cached results until the 5-minute TTL elapses', async () => {
    const mockAuth = new MockAuthPort();
    const svc = setup(mockAuth);
    mockedFirestore.getDoc.mockResolvedValue({ exists: () => false });

    await svc.lookupByUid('user-1');
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(1);

    // Just under 5 minutes — still cached
    vi.advanceTimersByTime(5 * 60 * 1000 - 1000);
    await svc.lookupByUid('user-1');
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(1);

    // Past 5 minutes — cache expired, re-fetch
    vi.advanceTimersByTime(2000);
    await svc.lookupByUid('user-1');
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(2);
  });
});

describe('UserDirectoryService — constructor auth subscription', () => {
  // The constructor subscribes to AUTH_PORT.user$ and:
  //   - skips null and anonymous users
  //   - debounces 500ms before calling writeMyProfile
  //   - invalidates cache entries for the signed-in user
  // These tests use vi.useFakeTimers() to control the 500ms debounce.

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('does NOT call setDoc when the current user is null', () => {
    const mockAuth = new MockAuthPort();
    // Default value: null
    setup(mockAuth);
    vi.advanceTimersByTime(1000);
    expect(mockedFirestore.setDoc).not.toHaveBeenCalled();
  });

  it('does NOT call setDoc when the current user is anonymous', () => {
    const mockAuth = new MockAuthPort();
    mockAuth.user$.next(makeUser({ isAnonymous: true }));
    setup(mockAuth);
    vi.advanceTimersByTime(1000);
    expect(mockedFirestore.setDoc).not.toHaveBeenCalled();
  });

  it('calls setDoc exactly once for a non-anonymous user, after the 500ms debounce', () => {
    const mockAuth = new MockAuthPort();
    mockAuth.user$.next(makeUser());
    setup(mockAuth);

    // Before the debounce fires — no write
    expect(mockedFirestore.setDoc).not.toHaveBeenCalled();

    // After 500ms — debounce fires, write happens
    vi.advanceTimersByTime(500);
    expect(mockedFirestore.setDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockedFirestore.setDoc.mock.calls[0];
    expect(payload).toMatchObject({
      emailLower: 'alice@example.com',
      email: 'alice@example.com',
      displayName: 'Alice',
    });
  });

  it('coalesces rapid sign-in events into a single write (debounce batches)', () => {
    // Three sign-in events in quick succession should produce ONE
    // write, not three. This is the point of the debounce.
    const mockAuth = new MockAuthPort();
    mockAuth.user$.next(makeUser({ displayName: 'V1' }));
    vi.advanceTimersByTime(100);
    mockAuth.user$.next(makeUser({ displayName: 'V2' }));
    vi.advanceTimersByTime(100);
    mockAuth.user$.next(makeUser({ displayName: 'V3' }));
    // Total elapsed: 200ms — still within the 500ms debounce window
    expect(mockedFirestore.setDoc).not.toHaveBeenCalled();

    setup(mockAuth);
    vi.advanceTimersByTime(500);
    expect(mockedFirestore.setDoc).toHaveBeenCalledTimes(1);
    // The last value (V3) wins — that's the semantics of debounceTime
    const [, payload] = mockedFirestore.setDoc.mock.calls[0];
    expect(payload.displayName).toBe('V3');
  });

  it('best-effort: catches setDoc errors and logs a warning instead of throwing', async () => {
    // The profile sync must NEVER break the auth flow. If Firestore is
    // unreachable, the .catch handler in the constructor must swallow
    // the error and log it.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setDocError = new Error('Firestore unreachable');
    mockedFirestore.setDoc.mockRejectedValueOnce(setDocError);

    const mockAuth = new MockAuthPort();
    mockAuth.user$.next(makeUser());
    setup(mockAuth);

    // Fire the debounce
    vi.advanceTimersByTime(500);
    // Drain the microtask queue so the .catch handler runs
    await vi.runAllTimersAsync();
    // A couple more awaits to settle any pending microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UserDirectory]'),
      setDocError,
    );
    warnSpy.mockRestore();
  });

  it('invalidates cache entries for the signed-in user (re-lookup re-fetches)', async () => {
    // After the user signs in, the cache for their own uid/email is
    // cleared so a freshly-updated email is visible immediately. We
    // pre-populate the cache, sign the user in, and verify the next
    // lookup re-fetches.
    const mockAuth = new MockAuthPort();
    const svc = setup(mockAuth);

    // Pre-populate the cache with a "not found" result for user-1
    mockedFirestore.getDoc.mockResolvedValueOnce({ exists: () => false });
    await svc.lookupByUid('user-1');
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(1);

    // Sign the user in — this should clear `uid:user-1` from the cache
    // (and `email:alice@example.com`, but we didn't look that up).
    mockAuth.user$.next(makeUser({ email: 'alice@example.com' }));

    // Drain the debounce so the writeMyProfile (which we don't care
    // about here) finishes.
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    // Now look up the user again — cache was invalidated, so this
    // MUST hit Firestore a second time.
    mockedFirestore.getDoc.mockResolvedValueOnce({
      id: 'user-1',
      exists: () => true,
      data: () => ({ email: 'alice@example.com', displayName: 'Alice' }),
    });
    const result = await svc.lookupByUid('user-1');
    expect(result).toEqual({
      uid: 'user-1',
      email: 'alice@example.com',
      displayName: 'Alice',
    });
    expect(mockedFirestore.getDoc).toHaveBeenCalledTimes(2);
  });
});
