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
import { getFirestoreDb } from '../../environments/firebase-init';
import { withResilience } from '../../shared/core/adapters/resilience';
import type { AuthUser } from './ports';

const BOOTSTRAP_ADMIN_EMAIL = 'admin@example.com';

export interface AdminAllowlistEntry {
  email: string;
  createdAt: string;
  createdByUid: string | null;
}

export interface AdminClientLink {
  adminUid: string;
  clientUid: string;
  clientEmail: string | null;
  notes: string;
  addedAt: string;
  addedByUid: string;
}

export type AdminClientAssessment = Record<string, unknown>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** UI role hint only. Firestore rules remain the authority for admin access. */
export async function checkAdminAccess(user: AuthUser | null): Promise<boolean> {
  const email = normalizeEmail(user?.email ?? '');
  if (!user?.linked || !user.emailVerified || !email) return false;
  if (email === BOOTSTRAP_ADMIN_EMAIL) return true;
  const entry = await getDoc(doc(getFirestoreDb(), 'adminAllowlist', email));
  return entry.exists();
}

export async function listAdminAllowlist(): Promise<AdminAllowlistEntry[]> {
  const result = await getDocs(collection(getFirestoreDb(), 'adminAllowlist'));
  return result.docs.map((entry) => {
    const data = entry.data();
    return {
      email: typeof data.email === 'string' ? data.email : entry.id,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
      createdByUid: typeof data.createdByUid === 'string' ? data.createdByUid : null,
    };
  }).sort((a, b) => a.email.localeCompare(b.email));
}

export async function addAdminEmail(email: string, createdByUid: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) throw new Error('A valid admin email is required');
  if (!createdByUid.trim()) throw new Error('The current admin UID is required');
  await setDoc(doc(getFirestoreDb(), 'adminAllowlist', normalized), {
    email: normalized,
    createdAt: new Date().toISOString(),
    createdByUid,
  });
}

export async function removeAdminEmail(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized === BOOTSTRAP_ADMIN_EMAIL) return;
  await deleteDoc(doc(getFirestoreDb(), 'adminAllowlist', normalized));
}

export async function listAdminClients(adminUid: string): Promise<AdminClientLink[]> {
  if (!adminUid.trim()) throw new Error('The current admin UID is required');
  const result = await getDocs(query(
    collection(getFirestoreDb(), 'adminClients'),
    where('adminUid', '==', adminUid),
  ));
  const links = result.docs.flatMap((entry) => {
    const data = entry.data();
    if (typeof data.clientUid !== 'string' || !data.clientUid) return [];
    return [{
      adminUid: typeof data.adminUid === 'string' ? data.adminUid : adminUid,
      clientUid: data.clientUid,
      clientEmail: typeof data.clientEmail === 'string' ? data.clientEmail : null,
      notes: typeof data.notes === 'string' ? data.notes : '',
      addedAt: typeof data.addedAt === 'string' ? data.addedAt : '',
      addedByUid: typeof data.addedByUid === 'string' ? data.addedByUid : adminUid,
    }];
  });
  return links.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function addAdminClient(
  adminUid: string,
  clientUid: string,
  clientEmail: string | null,
): Promise<void> {
  if (!adminUid.trim() || !clientUid.trim()) throw new Error('Both admin and client UIDs are required');
  if (adminUid === clientUid) throw new Error('An admin cannot add their own account as a client');
  const now = new Date().toISOString();
  await setDoc(doc(getFirestoreDb(), 'adminClients', `${adminUid}_${clientUid}`), {
    adminUid,
    clientUid,
    clientEmail: clientEmail?.trim() || null,
    notes: '',
    addedAt: now,
    addedByUid: adminUid,
  });
}

export async function saveAdminClientNotes(adminUid: string, clientUid: string, notes: string): Promise<void> {
  if (!adminUid.trim() || !clientUid.trim()) throw new Error('Both admin and client UIDs are required');
  if (notes.length > 4000) throw new Error('Notes must be 4000 characters or fewer');
  await updateDoc(doc(getFirestoreDb(), 'adminClients', `${adminUid}_${clientUid}`), { notes });
}

export async function removeAdminClient(adminUid: string, clientUid: string): Promise<void> {
  if (!adminUid.trim() || !clientUid.trim()) throw new Error('Both admin and client UIDs are required');
  await deleteDoc(doc(getFirestoreDb(), 'adminClients', `${adminUid}_${clientUid}`));
}

export async function loadAdminClientAssessment(clientUid: string): Promise<AdminClientAssessment | null> {
  if (!clientUid.trim()) throw new Error('The client UID is required');
  const result = await getDoc(doc(getFirestoreDb(), 'users', clientUid, 'assessment', 'current'));
  return result.exists() ? result.data() : null;
}

export async function loadAdminClientHistory(clientUid: string): Promise<AdminClientAssessment[]> {
  if (!clientUid.trim()) throw new Error('The client UID is required');
  return withResilience(async () => {
    const [history, current] = await Promise.all([
      getDocs(query(
        collection(getFirestoreDb(), 'users', clientUid, 'history'),
        orderBy('createdAt', 'desc'),
        limit(20),
      )),
      getDoc(doc(getFirestoreDb(), 'users', clientUid, 'assessment', 'current')),
    ]);
    if (!history.empty) return history.docs.map((entry) => ({ ...entry.data(), id: entry.id }));
    return current.exists() ? [{ ...current.data(), id: current.id }] : [];
  });
}
