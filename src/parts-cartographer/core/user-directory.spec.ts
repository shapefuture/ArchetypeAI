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
      commit: async () => { commits.push(writes); for (const w of writes) store.set(w.path, w.data); },
    };
  },
}));

import { clearUserDirectoryCache, lookupByEmail, syncPublicProfile } from './user-directory';

const user = (uid: string, email: string) => ({ uid, email, displayName: 'Dr Vale', linked: true, emailVerified: true }) as any;

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

  it('writes nothing for an anonymous session', async () => {
    await syncPublicProfile({ uid: 'anon', email: null, linked: false } as any);
    expect(commits).toHaveLength(0);
  });

  it('writes nothing until the email address is verified', async () => {
    await syncPublicProfile({ ...user('uid_t', 'vale@example.com'), emailVerified: false });
    expect(commits).toHaveLength(0);
    expect(store.has('directoryEmails/vale@example.com')).toBe(false);
  });
});
