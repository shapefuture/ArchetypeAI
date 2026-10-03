import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from '../../environments/firebase-init';
import type { AuthUser } from './ports';

/** Minimal identity projection exposed by publicProfiles/{uid}. */
export interface PublicUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { result: PublicUserProfile | null; expiresAt: number }>();

function readCache(key: string): PublicUserProfile | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.result;
}

function writeCache(key: string, result: PublicUserProfile | null): void {
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Keep only the user's email and display name in the signed-in directory so
 * clients can resolve a therapist by email. No assessment or clinical data is
 * sent by this operation. This is best-effort and must not block sign-in.
 */
export async function syncPublicProfile(user: AuthUser): Promise<void> {
  if (!user.linked || !user.email) return;
  const email = user.email.trim();
  if (!email) return;
  await setDoc(doc(getFirestoreDb(), 'publicProfiles', user.uid), {
    emailLower: email.toLowerCase(),
    email,
    displayName: user.displayName?.trim() || null,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  cache.delete(`uid:${user.uid}`);
  cache.delete(`email:${email.toLowerCase()}`);
}

export async function lookupByUid(uid: string): Promise<PublicUserProfile | null> {
  const normalized = (uid || '').trim();
  if (!normalized) return null;
  const key = `uid:${normalized}`;
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const snap = await getDoc(doc(getFirestoreDb(), 'publicProfiles', normalized));
  if (!snap.exists()) {
    writeCache(key, null);
    return null;
  }
  const data = snap.data();
  const profile: PublicUserProfile = {
    uid: snap.id,
    email: typeof data.email === 'string' ? data.email : null,
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
  };
  writeCache(key, profile);
  if (profile.email) writeCache(`email:${profile.email.toLowerCase()}`, profile);
  return profile;
}

export async function lookupByEmail(email: string): Promise<PublicUserProfile | null> {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return null;
  const key = `email:${normalized}`;
  const cached = readCache(key);
  if (cached !== undefined) return cached;

  const snap = await getDocs(query(
    collection(getFirestoreDb(), 'publicProfiles'),
    where('emailLower', '==', normalized),
  ));
  if (snap.empty) {
    writeCache(key, null);
    return null;
  }
  const first = snap.docs[0];
  const data = first.data();
  const profile: PublicUserProfile = {
    uid: first.id,
    email: typeof data.email === 'string' ? data.email : null,
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
  };
  writeCache(key, profile);
  writeCache(`uid:${profile.uid}`, profile);
  return profile;
}

export function clearUserDirectoryCache(): void {
  cache.clear();
}
