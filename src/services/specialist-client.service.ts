import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../environments/firebase-init';
import { AssessmentData } from '../app/core/ports/storage.port';

/**
 * Firestore document shape for `adminClients/{adminUid}_{clientUid}`.
 *
 * The docId is the composite key. No separate index documents, no
 * subcollection fan-out, no composite indexes. Filtering is by docId prefix
 * in the helper, so the read is a single `getDocs(collection('adminClients'))`.
 */
export interface ClientLink {
  adminUid: string;
  clientUid: string;
  clientEmail: string | null;
  notes: string;
  addedAt: string;
  addedByUid: string;
}

/**
 * Build the deterministic docId for a specialist↔client link. Pure helper,
 * unit-tested independently from Firestore.
 */
export function buildDocId(adminUid: string, clientUid: string): string {
  return `${adminUid}_${clientUid}`;
}

/**
 * Parse a docId back into its parts. Returns null for any malformed input
 * (no separator, empty adminUid, or empty clientUid). The separator is the
 * FIRST underscore, so a clientUid containing underscores is preserved
 * intact.
 */
export function parseDocId(docId: string): { adminUid: string; clientUid: string } | null {
  const idx = docId.indexOf('_');
  if (idx <= 0) return null; // missing separator OR empty admin side
  const adminUid = docId.slice(0, idx);
  const clientUid = docId.slice(idx + 1);
  if (!adminUid || !clientUid) return null;
  return { adminUid, clientUid };
}

/**
 * Does this docId belong to the given admin? Checks both the prefix AND
 * the separator, so `admin1` does NOT match `admin12_client1` (which is
 * what a naive `startsWith` would do).
 */
export function clientMatchesAdmin(docId: string, adminUid: string): boolean {
  if (!adminUid) return false;
  return docId.startsWith(`${adminUid}_`);
}

/**
 * Specialist → Client linking service.
 *
 * Storage model: `adminClients/{adminUid}_{clientUid}` documents. The docId
 * is the join key (composite of admin + client UID with `_` separator), so
 * the specialist's "My clients" list is a single
 * `getDocs(collection('adminClients'))` filtered by prefix in JS.
 *
 * NOTE: Client-side allowlisting is a convenience feature, not a security
 * boundary. Real security must be enforced with Firebase custom claims +
 * Firestore rules.
 */
@Injectable({ providedIn: 'root' })
export class SpecialistClientService {
  private get db() {
    return getFirestoreDb();
  }

  private requireUid(name: string, value: string): void {
    if (!value || !value.trim()) {
      throw new Error(`${name} is required`);
    }
  }

  /**
   * Add a client (by UID) to the current admin's client list. Idempotent
   * for repeated adds — overwrites the existing doc.
   */
  async addClientByUid(
    adminUid: string,
    clientUid: string,
    clientEmail: string | null = null,
    addedByUid: string = adminUid,
  ): Promise<void> {
    this.requireUid('adminUid', adminUid);
    this.requireUid('clientUid', clientUid);

    const docId = buildDocId(adminUid, clientUid);
    const payload: ClientLink = {
      adminUid,
      clientUid,
      clientEmail: clientEmail || null,
      notes: '',
      addedAt: new Date().toISOString(),
      addedByUid,
    };
    await setDoc(doc(this.db, 'adminClients', docId), payload);
  }

  /**
   * List all clients linked to the given admin, newest-first.
   *
   * Uses `where('adminUid', '==', adminUid)` instead of a full collection
   * scan. The Firestore rules for `adminClients` depend on a regular
   * field (`resource.data.adminUid == request.auth.uid`) — a `where`
   * clause is required so the rules can be evaluated per-document and
   * the SDK doesn't have to do a full collection scan that the rules
   * engine can't authorize.
   */
  async listMyClients(adminUid: string): Promise<ClientLink[]> {
    this.requireUid('adminUid', adminUid);

    const q = query(collection(this.db, 'adminClients'), where('adminUid', '==', adminUid));
    const snap = await getDocs(q);
    const links: ClientLink[] = [];
    for (const d of snap.docs) {
      const data = d.data() as Partial<ClientLink>;
      // docId is `{adminUid}_{clientUid}`; parse it for the canonical
      // split. The `adminUid` field is the source of truth for the
      // filter, but the docId still carries both sides.
      const parsed = parseDocId(d.id);
      links.push({
        adminUid: data.adminUid ?? parsed?.adminUid ?? adminUid,
        clientUid: data.clientUid ?? parsed?.clientUid ?? '',
        clientEmail: data.clientEmail ?? null,
        notes: data.notes ?? '',
        addedAt: data.addedAt ?? '',
        addedByUid: data.addedByUid ?? adminUid,
      });
    }
    links.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
    return links;
  }

  /**
   * Remove a client from the admin's list. No-op (no error) if the link
   * doesn't exist — matches `deleteDoc` semantics.
   */
  async removeClient(adminUid: string, clientUid: string): Promise<void> {
    this.requireUid('adminUid', adminUid);
    this.requireUid('clientUid', clientUid);

    const docId = buildDocId(adminUid, clientUid);
    await deleteDoc(doc(this.db, 'adminClients', docId));
  }

  /**
   * Update the private notes the admin keeps on this client.
   * Uses `updateDoc` (not `setDoc` with merge) so we never accidentally
   * wipe the existing `addedAt` / `addedByUid` / `clientEmail` fields.
   */
  async updateNotes(adminUid: string, clientUid: string, notes: string): Promise<void> {
    this.requireUid('adminUid', adminUid);
    this.requireUid('clientUid', clientUid);

    const docId = buildDocId(adminUid, clientUid);
    await updateDoc(doc(this.db, 'adminClients', docId), { notes });
  }

  /**
   * Read the client's latest assessment (`users/{clientUid}/assessment/current`).
   * Returns null if the client has no assessment yet.
   */
  async getClientLatestResults(clientUid: string): Promise<AssessmentData | null> {
    this.requireUid('clientUid', clientUid);

    const snap = await getDoc(doc(this.db, 'users', clientUid, 'assessment', 'current'));
    if (!snap.exists()) return null;
    return snap.data() as AssessmentData;
  }

  /**
   * Read the client's FULL assessment history — both the `current`
   * snapshot AND every entry in the `history` subcollection. Returns
   * the merged list (newest first) so the specialist's "My clients"
   * dashboard can render one download button per version.
   *
   * Storage layout (mirrors the storage adapter's `loadHistory`):
   *   users/{clientUid}/assessment/current   — latest snapshot
   *   users/{clientUid}/history/{docId}     — older snapshots
   *
   * De-dup: when the history collection is non-empty, it's the source
   * of truth and `current` is NOT prepended (avoids the duplicate-entry
   * bug — see firebase-storage.adapter.spec.ts for the original
   * regression). When history is empty but `current` exists, `current`
   * is the fallback (legacy users with only a `current` doc).
   *
   * Limit: 20 versions. If a client has done 50+ retests, the oldest
   * are silently dropped. The cabinet shows a "Download report" button
   * for each, so 20 is more than enough for the specialist's view.
   */
  async getClientHistory(clientUid: string): Promise<AssessmentData[]> {
    this.requireUid('clientUid', clientUid);

    const [historySnap, currentSnap] = await Promise.all([
      getDocs(
        query(
          collection(this.db, 'users', clientUid, 'history'),
          orderBy('createdAt', 'desc'),
          limit(20),
        ),
      ),
      getDoc(doc(this.db, 'users', clientUid, 'assessment', 'current')),
    ]);

    const history = historySnap.docs.map(d => d.data() as AssessmentData);

    // De-dup: history is the source of truth. Only use `current` as a
    // fallback when the history collection is COMPLETELY empty (legacy
    // user who only has a `current` doc and no history collection).
    if (history.length > 0) {
      return history;
    }
    if (currentSnap.exists()) {
      return [currentSnap.data() as AssessmentData];
    }
    return [];
  }
}
