import { Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '../environments/firebase-init';

/**
 * NOTE: Client-side allowlisting is a convenience feature, not a security boundary.
 * Real admin security must be enforced with Firebase custom claims + Firestore rules.
 */
const BOOTSTRAP_ADMIN_EMAILS = ['admin@example.com'];

export interface AdminAllowlistEntry {
  email: string;
  createdAt: string;
  createdByUid: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminAccessService {
  private readonly db = getFirestoreDb();

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  async isAdmin(email: string | null | undefined): Promise<boolean> {
    const norm = this.normalizeEmail(email || '');
    if (!norm) return false;
    if (BOOTSTRAP_ADMIN_EMAILS.includes(norm)) return true;

    const snap = await getDoc(doc(this.db, 'adminAllowlist', norm));
    return snap.exists();
  }

  async listAdmins(): Promise<AdminAllowlistEntry[]> {
    const snap = await getDocs(collection(this.db, 'adminAllowlist'));
    const entries = snap.docs.map(d => d.data() as AdminAllowlistEntry);
    return entries.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }

  async addAdmin(email: string, createdByUid: string | null): Promise<void> {
    const norm = this.normalizeEmail(email);
    if (!norm) throw new Error('Email required');
    await setDoc(doc(this.db, 'adminAllowlist', norm), {
      email: norm,
      createdAt: new Date().toISOString(),
      createdByUid: createdByUid || null,
    });
  }

  async removeAdmin(email: string): Promise<void> {
    const norm = this.normalizeEmail(email);
    if (!norm) return;
    await deleteDoc(doc(this.db, 'adminAllowlist', norm));
  }
}
