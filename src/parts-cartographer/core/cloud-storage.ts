import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../environments/firebase-init';
import { withResilience } from '../../app/core/adapters/resilience';
import type { SynastryResult } from './synastry-v2';

export interface CloudMapSnapshot {
  id?: string;
  schema: 'parts-cartographer.v1';
  profile: Record<string, unknown>;
  parts: unknown[];
  createdAt: string;
  updatedAt?: string;
}

export interface SharedCloudMap {
  uid: string;
  snapshot?: CloudMapSnapshot;
  assessment?: { responses: number[]; results?: unknown; updatedAt?: string };
}

function snapshot(profile: unknown, parts: unknown[], at: string): CloudMapSnapshot {
  const safeProfile = profile && typeof profile === 'object' ? JSON.parse(JSON.stringify(profile)) : {};
  const safeParts = Array.isArray(parts) ? JSON.parse(JSON.stringify(parts)) : [];
  return {
    schema: 'parts-cartographer.v1',
    profile: safeProfile as Record<string, unknown>,
    parts: safeParts,
    createdAt: at,
    updatedAt: at,
  };
}

/** Explicit user-initiated cloud save; no map data is synced by auth bootstrap. */
export async function saveCloudMap(
  userId: string,
  profile: unknown,
  parts: unknown[],
): Promise<CloudMapSnapshot> {
  const db = getFirestoreDb();
  const now = new Date().toISOString();
  const data = snapshot(profile, parts, now);
  await withResilience(() => setDoc(doc(db, 'users', userId, 'assessment', 'current'), data));
  const historyRef = await withResilience(() => addDoc(collection(db, 'users', userId, 'history'), data));
  return { ...data, id: historyRef.id };
}

function fromDocument(id: string, raw: Record<string, unknown>): CloudMapSnapshot | null {
  if (!raw || typeof raw !== 'object' || raw.schema !== 'parts-cartographer.v1') return null;
  return {
    id,
    schema: 'parts-cartographer.v1',
    profile: (raw.profile && typeof raw.profile === 'object' ? raw.profile : {}) as Record<string, unknown>,
    parts: Array.isArray(raw.parts) ? raw.parts : [],
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

/** Load this user's latest cloud snapshot and up to 20 saved history entries. */
export async function loadCloudMapHistory(userId: string): Promise<CloudMapSnapshot[]> {
  const db = getFirestoreDb();
  return withResilience(async () => {
    const [historySnap, currentSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'users', userId, 'history'),
        orderBy('createdAt', 'desc'),
        limit(20),
      )),
      getDoc(doc(db, 'users', userId, 'assessment', 'current')),
    ]);
    const history = historySnap.docs
      .map((entry) => fromDocument(entry.id, entry.data()))
      .filter((entry): entry is CloudMapSnapshot => !!entry);
    if (history.length) return history;
    if (!currentSnap.exists()) return [];
    const current = fromDocument(currentSnap.id, currentSnap.data());
    return current ? [current] : [];
  });
}

export interface SavedCloudSynastry {
  id: string;
  partnerUid: string;
  shareCodeUsed: string;
  result: SynastryResult;
  updatedAt: string;
}

export async function saveCloudSynastry(
  userId: string,
  partnerUid: string,
  shareCodeUsed: string,
  result: SynastryResult,
): Promise<void> {
  const db = getFirestoreDb();
  const updatedAt = new Date().toISOString();
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userId, 'connections', partnerUid), {
    partnerUid,
    shareCodeUsed,
    updatedAt,
  }, { merge: true });
  batch.set(doc(db, 'users', userId, 'synastry', partnerUid), {
    schema: 'parts-cartographer.synastry.v1',
    partnerUid,
    shareCodeUsed,
    result,
    updatedAt,
  });
  await withResilience(() => batch.commit());
}

export async function loadCloudSynastry(userId: string): Promise<SavedCloudSynastry[]> {
  const db = getFirestoreDb();
  return withResilience(async () => {
    const saved = await getDocs(query(
      collection(db, 'users', userId, 'synastry'),
      orderBy('updatedAt', 'desc'),
      limit(50),
    ));
    return saved.docs.flatMap((entry) => {
      const data = entry.data();
      if (data.schema !== 'parts-cartographer.synastry.v1' || typeof data.partnerUid !== 'string'
        || typeof data.shareCodeUsed !== 'string' || !data.result || typeof data.result !== 'object') return [];
      return [{
        id: entry.id,
        partnerUid: data.partnerUid,
        shareCodeUsed: data.shareCodeUsed,
        result: data.result as SynastryResult,
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
      }];
    });
  });
}

function newShareCode(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(12);
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure random generation is unavailable');
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

/** Create a private bearer code containing only the explicitly approved map snapshot. */
export async function createCloudMapShareCode(
  userId: string,
  profile: unknown,
  parts: unknown[],
): Promise<string> {
  const db = getFirestoreDb();
  const mapSnapshot = snapshot(profile, parts, new Date().toISOString());
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newShareCode();
    try {
      await withResilience(() => setDoc(doc(db, 'shareCodes', code), {
        uid: userId,
        createdAt: new Date().toISOString(),
        schema: 'parts-cartographer.v1',
        mapSnapshot,
      }));
      return code;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not create a map share code');
}

/** Redeem a share code only for signed-in users; Firestore rules deny list access. */
export async function redeemCloudMapShareCode(code: string): Promise<SharedCloudMap | null> {
  const normalized = code.trim().toLowerCase();
  if (!/^[a-z0-9]{8,16}$/.test(normalized)) return null;
  const db = getFirestoreDb();
  return withResilience(async () => {
    const sharedDoc = await getDoc(doc(db, 'shareCodes', normalized));
    if (!sharedDoc.exists()) return null;
    const data = sharedDoc.data();
    if (typeof data.uid !== 'string') return null;
    if (data.schema === 'parts-cartographer.v1' && data.mapSnapshot && typeof data.mapSnapshot === 'object') {
      const sharedSnapshot = fromDocument(normalized, data.mapSnapshot as Record<string, unknown>);
      return sharedSnapshot ? { uid: data.uid, snapshot: sharedSnapshot } : null;
    }
    // Angular's legacy share-code payload carries a 64-response assessment
    // snapshot. Keep it typed and bounded; React's report adapter uses only a
    // deterministic fingerprint until the full scoring model is ported.
    const assessment = data.assessment as Record<string, unknown> | undefined;
    if (assessment && Array.isArray(assessment.responses)
      && assessment.responses.length <= 200
      && assessment.responses.every((value) => typeof value === 'number')) {
      return {
        uid: data.uid,
        assessment: {
          responses: assessment.responses as number[],
          results: assessment.results,
          updatedAt: typeof assessment.updatedAt === 'string' ? assessment.updatedAt : undefined,
        },
      };
    }
    return null;
  });
}

/** Revoke an issued bearer code. Codes are never enumerable to other users. */
export async function revokeCloudMapShareCode(code: string): Promise<void> {
  const normalized = code.trim().toLowerCase();
  if (!/^[a-z0-9]{8,16}$/.test(normalized)) return;
  const db = getFirestoreDb();
  await withResilience(() => deleteDoc(doc(db, 'shareCodes', normalized)));
}
