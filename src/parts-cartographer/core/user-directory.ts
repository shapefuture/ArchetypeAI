import { doc, getDoc, writeBatch } from 'firebase/firestore';
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
  // Only a verified address may appear in the directory (the rules require it).
  if (!user.linked || !user.email || user.emailVerified !== true) return;
  const email = user.email.trim();
  if (!email) return;
  const db = getFirestoreDb();
  const updatedAt = new Date().toISOString();
  // The profile and its email-index entry are written together. The index lets
  // others resolve this address without being able to list the directory.
  const batch = writeBatch(db);
  batch.set(doc(db, 'publicProfiles', user.uid), {
    emailLower: email.toLowerCase(),
    email,
    displayName: user.displayName?.trim() || null,
    updatedAt,
  }, { merge: true });
  batch.set(doc(db, 'directoryEmails', email.toLowerCase()), { uid: user.uid, updatedAt });
  await batch.commit();
  cache.delete(`uid:${user.uid}`);
  cache.delete(`email:${email.toLowerCase()}`);
}

/**
 * Sign-in refresh of the directory. Only therapists (accounts with a therapist
 * profile) are listed: anyone signed in can look an address up, so listing
 * every account would reveal who uses the app. Anyone else's earlier entry is
 * removed.
 */
export async function refreshDirectoryEntry(user: AuthUser): Promise<void> {
  if (!user.linked || !user.email) return;
  const db = getFirestoreDb();
  const therapist = await getDoc(doc(db, 'therapists', user.uid));
  if (therapist.exists()) { await syncPublicProfile(user); return; }
  const emailLower = user.email.trim().toLowerCase();
  const [profile, entry] = await Promise.all([
    getDoc(doc(db, 'publicProfiles', user.uid)),
    getDoc(doc(db, 'directoryEmails', emailLower)),
  ]);
  const ownsEntry = entry.exists() && entry.data()?.uid === user.uid;
  if (!profile.exists() && !ownsEntry) return;
  const batch = writeBatch(db);
  if (profile.exists()) batch.delete(doc(db, 'publicProfiles', user.uid));
  if (ownsEntry) batch.delete(doc(db, 'directoryEmails', emailLower));
  await batch.commit();
  cache.delete(`uid:${user.uid}`);
  cache.delete(`email:${emailLower}`);
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

  // The directory cannot be listed, so an address resolves through its index entry.
  const entry = await getDoc(doc(getFirestoreDb(), 'directoryEmails', normalized));
  const uid = entry.exists() ? entry.data().uid : null;
  const found = typeof uid === 'string' && uid ? await lookupByUid(uid) : null;
  // A stale entry (the profile's address has since changed) resolves to nobody.
  const profile = found?.email?.toLowerCase() === normalized ? found : null;
  writeCache(key, profile);
  return profile;
}

export function clearUserDirectoryCache(): void {
  cache.clear();
}
