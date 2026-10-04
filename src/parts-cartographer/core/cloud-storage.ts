import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../environments/firebase-init';
import { withResilience } from '../../app/core/adapters/resilience';
import { validProfile } from './profile-contract';
import { validMapParts } from './backup';
import type { SynastryResult } from './synastry-v2';

export interface CloudMapSnapshot {
  id?: string;
  schema: 'parts-cartographer.v1';
  profile: Record<string, unknown>;
  parts: unknown[];
  createdAt: string;
  updatedAt?: string;
  source?: { schema: 'angular-assessment64'; responses: number[]; results?: unknown };
}

export interface SharedCloudMap {
  uid: string;
  snapshot?: CloudMapSnapshot;
  assessment?: { responses: number[]; results?: unknown; updatedAt?: string };
}

const pick = (value: unknown, keys: string[]): Record<string, any> => {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(keys.filter((key) => record[key] !== undefined).map((key) => [key, record[key]]));
};
/** Allowlisted projection: no raw answers, free-text journal, future self, auth or body-map data. */
export function snapshot(profile: unknown, parts: unknown[], at: string): CloudMapSnapshot {
  const safeProfile = pick(profile, ['version', 'testModel', 'createdAt', 'parts', 'resources', 'resourceLeaks', 'strongestResource',
    'selfEnergy', 'selfEnergyRadar', 'burden', 'headlineConstellation', 'headlineRu', 'constellationEssay', 'constellationEssayEn',
    'constellationEssayRu', 'subtypes', 'subtypesEn', 'subtypesRu', 'polarizations', 'attachment', 'attachmentScores',
    'complexes', 'activeComplexes', 'needHunger', 'copingStack', 'validity', 'validityFlags', 'crisisFlag', 'clinical']);
  if (Array.isArray(safeProfile.parts)) safeProfile.parts = safeProfile.parts.map((part: unknown) => pick(part, ['id', 'name', 'nameEn', 'nameRu', 'family', 'energy', 'scoreT', 'felt']));
  if (safeProfile.clinical) {
    const clinical = pick(safeProfile.clinical, ['parts', 'resources', 'resourceLeaks', 'strongestResource',
      'selfEnergy', 'selfRadar', 'burden', 'headline', 'subtypes', 'polarizations', 'attachment', 'complexes', 'activeComplexes',
      'needHunger', 'topHunger', 'copingStack', 'validity', 'crisis']);
    const mapValues = (v: unknown, fields: string[]) => Object.fromEntries(Object.entries(pick(v, Object.keys((v as any) ?? {}))).map(([id, item]) => [id, pick(item, fields)]));
    clinical.parts = mapValues(clinical.parts, ['id', 'raw', 'T', 'tier']);
    clinical.resources = mapValues(clinical.resources, ['id', 'raw', 'T', 'tier', 'band']);
    clinical.subtypes = mapValues(clinical.subtypes, ['name', 'slug', 'modifier']);
    clinical.complexes = mapValues(clinical.complexes, ['id', 'activation', 'tier']);
    clinical.activeComplexes = Array.isArray(clinical.activeComplexes) ? clinical.activeComplexes.map((c: unknown) => pick(c, ['id', 'activation', 'tier'])) : [];
    clinical.strongestResource = pick(clinical.strongestResource, ['id', 'raw', 'T', 'tier', 'band']);
    clinical.headline = pick(clinical.headline, ['protector', 'exile', 'name', 'essay', 'final']);
    clinical.attachment = pick(clinical.attachment, ['anxious', 'avoidant', 'secure', 'disorganized']);
    clinical.copingStack = pick(clinical.copingStack, ['l1', 'l2', 'l3', 'floor']);
    clinical.validity = pick(clinical.validity, ['ok', 'flags']);
    if (clinical.topHunger) clinical.topHunger = pick(clinical.topHunger, ['need', 'hunger']);
    clinical.polarizations = Array.isArray(clinical.polarizations) ? clinical.polarizations.map((p: unknown) => pick(p, ['pair', 'name'])) : [];
    clinical.resourceLeaks = Array.isArray(clinical.resourceLeaks) ? clinical.resourceLeaks.map((p: unknown) => pick(p, ['resource', 'spillPart'])) : [];
    safeProfile.clinical = clinical;
  }
  const safeParts = Array.isArray(parts) ? parts.slice(0, 100).map((part) => {
    const projected = pick(part, ['id', 'name', 'nameEn', 'nameRu', 'family', 'traits', 'role', 'blurb', 'energy', 'burden', 'need', 'voice', 'star', 'since', 'archetype']);
    projected.traits = pick(projected.traits, ['characterSeed', 'shape', 'color', 'eyes', 'mouth', 'head', 'face', 'bow', 'cheeks']);
    if (projected.archetype) projected.archetype = pick(projected.archetype, ['schema', 'sourceAssessment', 'coordinates', 'cluster', 'prominence', 'size', 'partType', 'developmentalOrigin', 'description', 'wound', 'shadow', 'invitation', 'coreBelief', 'attracts']);
    return projected;
  }) : [];
  return {
    schema: 'parts-cartographer.v1',
    profile: JSON.parse(JSON.stringify(safeProfile)),
    parts: JSON.parse(JSON.stringify(safeParts)),
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
  const historyRef = doc(collection(db, 'users', userId, 'history'));
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userId, 'assessment', 'current'), data);
  batch.set(historyRef, data);
  await withResilience(() => batch.commit());
  return { ...data, id: historyRef.id };
}

export async function fromDocument(id: string, raw: Record<string, unknown>): Promise<CloudMapSnapshot | null> {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.schema !== 'parts-cartographer.v1') {
    const responses = raw.responses;
    if (!Array.isArray(responses) || responses.length !== 64 || !responses.every((n) => Number.isInteger(n) && n >= 1 && n <= 5)) return null;
    const [{ buildLegacyReportData }, { buildLegacyUniverseParts }] = await Promise.all([import('../screens/legacy-report-data'), import('./legacy-universe-adapter')]);
    const report = buildLegacyReportData(responses, 'en');
    return { id, schema: 'parts-cartographer.v1', profile: { headlineConstellation: report.archetypes[0]?.name ?? 'Relational assessment' },
      parts: buildLegacyUniverseParts(report), createdAt: String(raw.createdAt ?? raw.updatedAt ?? ''),
      source: { schema: 'angular-assessment64', responses, results: raw.results } };
  }
  if (!validProfile(raw.profile) || !validMapParts(raw.parts)) return null;
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
    const history = (await Promise.all(historySnap.docs
      .map((entry) => fromDocument(entry.id, entry.data()))))
      .filter((entry): entry is CloudMapSnapshot => !!entry);
    if (history.length) return history;
    if (!currentSnap.exists()) return [];
    const current = await fromDocument(currentSnap.id, currentSnap.data());
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
  const mapSnapshot = snapshot(profile, parts, new Date().toISOString());
  return createPrivateShareCode({ uid: userId, schema: 'parts-cartographer.v1', mapSnapshot });
}

/** Legacy comparison requires the response vector; called only after its separate, explicit consent. */
export async function createCloudLegacy64ShareCode(userId: string, responses: number[]): Promise<string> {
  if (responses.length !== 64 || !responses.every((n) => Number.isInteger(n) && n >= 1 && n <= 5)) throw new Error('A complete 64-answer assessment is required');
  return createPrivateShareCode({ uid: userId, assessment: {
    responses: [...responses], dimensionalExpressions: {}, results: null,
    scoringMethod: 'deterministic', updatedAt: new Date().toISOString(),
  } });
}

async function createPrivateShareCode(payload: Record<string, unknown>): Promise<string> {
  const db = getFirestoreDb();
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newShareCode();
    try {
      const created = await withResilience(() => runTransaction(db, async (transaction) => {
        const ref = doc(db, 'shareCodes', code);
        if ((await transaction.get(ref)).exists()) return false;
        transaction.set(ref, {
        ...payload,
        createdAt: new Date().toISOString(),
        });
        return true;
      }));
      if (created) return code;
      lastError = new Error('Share code collision');
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
      const sharedSnapshot = await fromDocument(normalized, data.mapSnapshot as Record<string, unknown>);
      return sharedSnapshot ? { uid: data.uid, snapshot: sharedSnapshot } : null;
    }
    // Angular's legacy share-code payload carries a 64-response assessment
    // snapshot. Keep it typed and bounded for the canonical synastry engine.
    const assessment = data.assessment as Record<string, unknown> | undefined;
    if (assessment && Array.isArray(assessment.responses)
      && assessment.responses.length === 64
      && assessment.responses.every((value) => Number.isInteger(value) && value >= 1 && value <= 5)) {
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
