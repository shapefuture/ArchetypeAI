import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const commits = vi.hoisted(() => [] as Array<Array<{ path: string; data: Record<string, unknown> }>>);

vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
  getDoc: async (ref: { path: string }) => ({
    exists: () => store.has(ref.path),
    data: () => store.get(ref.path),
    id: ref.path.split('/').pop(),
  }),
  writeBatch: () => {
    const writes: Array<{ path: string; data: Record<string, unknown> }> = [];
    return {
      set: (ref: { path: string }, data: Record<string, unknown>) => { writes.push({ path: ref.path, data }); },
      delete: (ref: { path: string }) => { writes.push({ path: ref.path, data: { deleted: true } }); },
      commit: async () => {
        commits.push(writes);
        for (const w of writes) { if (w.data.deleted) store.delete(w.path); else store.set(w.path, w.data); }
      },
    };
  },
}));

import { clearUserDirectoryCache, lookupByEmail, refreshDirectoryEntry, syncPublicProfile } from './user-directory';

const user = (uid: string, email: string, emailVerified = true) => ({ uid, email, displayName: 'Dr Vale', linked: true, emailVerified }) as any;

beforeEach(() => {
  store.clear();
  commits.length = 0;
  clearUserDirectoryCache();
});

describe('user directory without a listable collection', () => {
  it('writes the profile and its email-index entry in one batch on sign-in', async () => {
    await syncPublicProfile(user('uid_t', 'Vale@Example.com'));
    expect(commits).toHaveLength(1);
    expect(commits[0].map((w) => w.path)).toEqual(['publicProfiles/uid_t', 'directoryEmails/vale@example.com']);
    expect(commits[0][1].data).toMatchObject({ uid: 'uid_t' });
    expect(Object.keys(commits[0][1].data).sort()).toEqual(['uid', 'updatedAt']);
  });

  it('resolves a known address through the index, in any letter case', async () => {
    await syncPublicProfile(user('uid_t', 'vale@example.com'));
    clearUserDirectoryCache();
    expect(await lookupByEmail('  VALE@example.com ')).toEqual({ uid: 'uid_t', email: 'vale@example.com', displayName: 'Dr Vale' });
  });

  it('finds nobody for an unknown address or a stale index entry', async () => {
    expect(await lookupByEmail('nobody@example.com')).toBeNull();
    store.set('directoryEmails/old@example.com', { uid: 'uid_t', updatedAt: 'x' });
    store.set('publicProfiles/uid_t', { email: 'new@example.com', emailLower: 'new@example.com', displayName: null });
    expect(await lookupByEmail('old@example.com')).toBeNull();
  });

  it('writes nothing for an unverified address, so it cannot be found by email or UID', async () => {
    await syncPublicProfile(user('uid_u', 'unverified@example.com', false));
    expect(commits).toHaveLength(0);
    clearUserDirectoryCache();
    expect(await lookupByEmail('unverified@example.com')).toBeNull();
  });

  it('writes nothing for an anonymous session', async () => {
    await syncPublicProfile({ uid: 'anon', email: null, linked: false } as any);
    expect(commits).toHaveLength(0);
  });
});

describe('directory refresh on sign-in', () => {
  it('lists a therapist', async () => {
    store.set('therapists/uid_t', { email: 'vale@example.com', availability: [] });
    await refreshDirectoryEntry(user('uid_t', 'vale@example.com'));
    expect(store.has('directoryEmails/vale@example.com')).toBe(true);
  });

  it('removes an earlier entry of an account that is not a therapist, so it cannot be looked up', async () => {
    store.set('publicProfiles/uid_m', { email: 'member@example.com', emailLower: 'member@example.com', displayName: 'M' });
    store.set('directoryEmails/member@example.com', { uid: 'uid_m', updatedAt: 'x' });
    await refreshDirectoryEntry(user('uid_m', 'member@example.com'));
    expect(store.has('publicProfiles/uid_m')).toBe(false);
    expect(store.has('directoryEmails/member@example.com')).toBe(false);
    clearUserDirectoryCache();
    expect(await lookupByEmail('member@example.com')).toBeNull();
  });

  it('never deletes an index entry that belongs to someone else', async () => {
    store.set('directoryEmails/shared@example.com', { uid: 'uid_other', updatedAt: 'x' });
    await refreshDirectoryEntry(user('uid_m', 'shared@example.com'));
    expect(store.get('directoryEmails/shared@example.com')).toEqual({ uid: 'uid_other', updatedAt: 'x' });
  });
});
