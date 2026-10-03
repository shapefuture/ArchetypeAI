import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { StoragePort, AssessmentData, SynastrySavedReportData } from '../ports/storage.port';
import { SynastryReport } from '../data/synastry';
import { getFirestoreDb } from '../../../environments/firebase-init';
import { withResilience } from './resilience';

function generateShareCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

@Injectable({ providedIn: 'root' })
export class FirebaseStorageAdapter implements StoragePort {

  private db: Firestore;

  constructor() {
    this.db = getFirestoreDb();
  }

  async saveAssessment(userId: string, data: AssessmentData): Promise<void> {
    await withResilience(() =>
      setDoc(doc(this.db, 'users', userId, 'assessment', 'current'), {
        ...data,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async loadAssessment(userId: string): Promise<AssessmentData | null> {
    return withResilience(async () => {
      const snap = await getDoc(doc(this.db, 'users', userId, 'assessment', 'current'));
      if (!snap.exists()) return null;
      return snap.data() as AssessmentData;
    });
  }

  async saveToHistory(userId: string, data: AssessmentData): Promise<string> {
    return withResilience(async () => {
      const ref = await addDoc(collection(this.db, 'users', userId, 'history'), {
        ...data,
        createdAt: new Date().toISOString(),
      });
      return ref.id;
    });
  }

  async loadHistory(userId: string): Promise<AssessmentData[]> {
    return withResilience(async () => {
      const [historySnap, currentSnap] = await Promise.all([
        getDocs(
          query(collection(this.db, 'users', userId, 'history'), orderBy('createdAt', 'desc'), limit(20)),
        ),
        getDoc(doc(this.db, 'users', userId, 'assessment', 'current')),
      ]);
      const history = historySnap.docs.map(d => d.data() as AssessmentData);
      const current = currentSnap.exists() ? (currentSnap.data() as AssessmentData) : null;

      return FirebaseStorageAdapter.mergeCurrentIntoHistory(history, current);
    });
  }

  /**
   * Merge the per-user "current" snapshot into the history list. Extracted as
   * a pure function so it can be unit-tested without Firestore.
   *
   * Backwards-compat fallback: if the per-user history collection is
   * COMPLETELY empty (e.g. user saved before saveToHistory was wired up, and
   * never re-saved), fall back to the latest 'current' doc so the cabinet
   * panel isn't blank.
   *
   * DO NOT prepend 'current' when the history collection already has
   * entries — that would create a phantom duplicate for every save, because
   * every save updates 'current' to a slightly newer timestamp than the
   * history entry it just wrote (the user would see pairs of entries
   * ~1 second apart, mirroring the saveAssessment → saveToHistory latency).
   * Once any history entry exists, the history collection is the source of
   * truth.
   */
  static mergeCurrentIntoHistory(
    history: AssessmentData[],
    current: AssessmentData | null,
  ): AssessmentData[] {
    if (current && history.length === 0) {
      return [current, ...history];
    }
    return history;
  }

  async createShareCode(userId: string): Promise<string> {
    const code = generateShareCode();
    const assessment = await this.loadAssessment(userId);
    if (!assessment) throw new Error('Save an assessment before generating a share code');
    await withResilience(() =>
      setDoc(doc(this.db, 'shareCodes', code), {
        uid: userId,
        createdAt: new Date().toISOString(),
        assessment,
      }),
    );
    return code;
  }

  async loadSharedWithUid(shareCode: string): Promise<{ uid: string; data: AssessmentData } | null> {
    return withResilience(async () => {
      const codeSnap = await getDoc(doc(this.db, 'shareCodes', shareCode.trim().toLowerCase()));
      if (!codeSnap.exists()) return null;
      const payload = codeSnap.data() as { uid?: string; assessment?: AssessmentData };
      if (!payload.uid) return null;
      if (payload.assessment && Array.isArray(payload.assessment.responses)) {
        return { uid: payload.uid, data: payload.assessment };
      }
      // Compatibility with pre-projection codes. Current rules may correctly
      // reject this legacy cross-user read, in which case the caller reports
      // the code as unavailable rather than exposing owner-only documents.
      const assessmentSnap = await getDoc(doc(this.db, 'users', payload.uid, 'assessment', 'current'));
      if (!assessmentSnap.exists()) return null;
      return { uid: payload.uid, data: assessmentSnap.data() as AssessmentData };
    });
  }

  async loadShared(shareCode: string): Promise<AssessmentData | null> {
    const result = await this.loadSharedWithUid(shareCode);
    return result ? result.data : null;
  }

  async saveSynastryConnection(userId: string, partnerUid: string, shareCodeUsed: string | null = null): Promise<string> {
    await withResilience(() =>
      setDoc(doc(this.db, 'users', userId, 'connections', partnerUid), {
        partnerUid,
        shareCodeUsed: shareCodeUsed || null,
        updatedAt: new Date().toISOString(),
      }, { merge: true }),
    );
    return partnerUid;
  }

  async saveSynastryReport(
    userId: string,
    connectionId: string,
    partnerUid: string,
    report: SynastryReport,
    narrative: string | null = null,
  ): Promise<void> {
    await withResilience(() =>
      setDoc(doc(this.db, 'users', userId, 'synastry', connectionId), {
        partnerUid,
        report,
        narrative: narrative || null,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async listSynastryReports(userId: string): Promise<SynastrySavedReportData[]> {
    return withResilience(async () => {
      const q = query(collection(this.db, 'users', userId, 'synastry'), orderBy('updatedAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as SynastrySavedReportData);
    });
  }
}
