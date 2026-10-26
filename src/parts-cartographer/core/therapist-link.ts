/**
 * INNERVERSE — Therapist Mode link layer (REVAMP §3B.4).
 *
 * Client connects to a therapist via a 10-char invite code; the therapist's
 * dashboard reads the client's measured constructs (T-scores, complexes,
 * coping stack, adherence) — never raw item answers, never somatic zones,
 * never reflections unless the client shares a reflection explicitly
 * (default OFF). RED exercises are assignable ONLY from the therapist side
 * (redAllowed), and require the Safe-Place container (§3E.3).
 *
 * The consent contract at link time is exactly this paragraph.
 */
import {
  doc, getDoc, setDoc, collection, getDocs, query, where, writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../environments/firebase-init';
import type { ScoredProfile } from '../../shared/core/data/scoring-v2';
import type { ContainerState } from '../../shared/core/data/exercises';
import { validClinicalScore } from './profile-contract';

export type AssignmentFrequency = 'once' | 'daily' | 'weekly' | 'after-trigger';

export interface TherapistAssignment {
  id: string;
  exerciseId: string;
  frequency: AssignmentFrequency;
  note?: string;
  assignedAt: string;
  /** what the therapist sees of the client — nothing more, ever */
  clientSummary: TherapistClientSummary | null;
}

/** §3B.4: the dashboard-visible projection of a profile. */
export interface TherapistClientSummary {
  headline: string;
  burden: number;
  selfEnergy: number;
  parts: Record<string, { T: number; tier: string }>;
  activeComplexes: { id: string; activation: number; tier: string }[];
  copingStack: { l1: string; l2?: string; l3?: string; floor: string };
  adherence: { done: number; skipped: number };
}

export function toTherapistSummary(
  profile: ScoredProfile, adherence: { done: number; skipped: number },
): TherapistClientSummary {
  const parts: TherapistClientSummary['parts'] = {};
  for (const [id, p] of Object.entries(profile.parts)) {
    parts[id] = { T: Math.round(p.T * 10) / 10, tier: p.tier };
  }
  return {
    headline: profile.headline.name,
    burden: Math.round(profile.burden),
    selfEnergy: profile.selfEnergy,
    parts,
    activeComplexes: profile.activeComplexes.map(c => ({
      id: c.id, activation: Math.round(c.activation * 10) / 10, tier: c.tier,
    })),
    // An absent protector is left out, not sent as undefined: Firestore refuses undefined field values.
    copingStack: {
      l1: profile.copingStack.l1,
      ...(profile.copingStack.l2 ? { l2: profile.copingStack.l2 } : {}),
      ...(profile.copingStack.l3 ? { l3: profile.copingStack.l3 } : {}),
      floor: profile.copingStack.floor,
    },
    adherence,
  };
}

/**
 * The summary the Share screen sends, built from the client's complete scored result so the therapist sees the
 * same T-scores, tiers and coping stack the client sees. Null when no complete result is saved.
 */
export function therapistSummaryFor(
  profile: { clinical?: unknown } | null | undefined, adherence: { done: number; skipped: number },
): TherapistClientSummary | null {
  const clinical = profile?.clinical;
  if (!validClinicalScore(clinical)) return null;
  return toTherapistSummary(clinical, adherence);
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusables

/** 10-character code over the unambiguous alphabet (~1e15 possibilities). */
export function generateLinkCode(rand?: () => number): string {
  const length = 10;
  if (rand) {
    let code = '';
    for (let i = 0; i < length; i++) {
      const index = Math.min(CODE_ALPHABET.length - 1, Math.floor(rand() * CODE_ALPHABET.length));
      code += CODE_ALPHABET[index];
    }
    return code;
  }

  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, value => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('');
}

/**
 * Client side: create an invite code. The link doc records ONLY what the
 * consent screen promises: the summary projection above.
 */
export async function createTherapistLink(
  clientUid: string, summary: TherapistClientSummary,
): Promise<string> {
  const db = getFirestoreDb();
  let code = generateLinkCode();
  let exists = await getDoc(doc(db, 'therapistLinks', code));
  while (exists.exists()) {
    code = generateLinkCode();
    exists = await getDoc(doc(db, 'therapistLinks', code));
  }
  await setDoc(doc(db, 'therapistLinks', code), {
    clientUid,
    createdAt: new Date().toISOString(),
    summary,
  });
  return code;
}

/**
 * Therapist side: claim a code → it appears in the dashboard list. A code is
 * single-use: the claim records this therapist on it in the same batch, and
 * a code another therapist already claimed resolves to null.
 */
export async function claimTherapistLink(
  therapistUid: string, code: string,
): Promise<TherapistClientSummary | null> {
  const db = getFirestoreDb();
  const linkCode = code.trim().toUpperCase();
  const linkRef = doc(db, 'therapistLinks', linkCode);
  const snap = await getDoc(linkRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const claimedBy = data['claimedBy'] as string | undefined;
  if (claimedBy && claimedBy !== therapistUid) return null;
  const summary = data['summary'] as TherapistClientSummary;
  const clientUid = data['clientUid'] as string;
  const batch = writeBatch(db);
  if (!claimedBy) batch.update(linkRef, { claimedBy: therapistUid });
  batch.set(
    doc(db, 'therapistClients', `${therapistUid}_${clientUid}`),
    {
      therapistUid,
      clientUid,
      linkedAt: new Date().toISOString(),
      source: 'invite',
      linkCode,
      summary,
    },
    // Merge: a row the therapist already holds keeps its archive flag and any other field this write does not carry.
    { merge: true },
  );
  await batch.commit();
  return summary;
}

/**
 * Client side: end every therapist relationship, as the consent text
 * promises. Deletes every invite code the client issued (claimed or not),
 * every roster row and booking share, so no therapist keeps the summary or
 * can assign practices. Appointments themselves stay, for both parties'
 * records. Returns how many records were removed (0: nothing was shared).
 */
export async function revokeTherapistAccess(clientUid: string): Promise<number> {
  const db = getFirestoreDb();
  const byClient = (name: string) => getDocs(query(collection(db, name), where('clientUid', '==', clientUid)));
  const [rows, shares, codes, assignments] = await Promise.all([
    byClient('therapistClients'), byClient('clientShares'), byClient('therapistLinks'), byClient('assignments'),
  ]);
  if (rows.empty && shares.empty && codes.empty && assignments.empty) return 0;
  const batch = writeBatch(db);
  // Every code this client issued, claimed or not, so no one can link with it later.
  for (const code of codes.docs) batch.delete(code.ref);
  for (const row of rows.docs) batch.delete(row.ref);
  for (const share of shares.docs) batch.delete(share.ref);
  // Assigned practices go too, so the therapist keeps nothing about this client.
  for (const assignment of assignments.docs) batch.delete(assignment.ref);
  await batch.commit();
  return codes.size + rows.size + shares.size + assignments.size;
}

/**
 * A therapist↔client link as the dashboard consumes it. `summary` is null for
 * clients created through a booking (they shared access before any assessment
 * summary existed); `archived` defaults to false and is toggled from the
 * dashboard's «Архив» section.
 */
export interface LinkedClient {
  clientUid: string;
  clientEmail: string | null;
  linkedAt: string;
  archived: boolean;
  summary: TherapistClientSummary | null;
}

/** Therapist dashboard: all linked clients (newest first, archive flag kept). */
export async function linkedClients(therapistUid: string): Promise<LinkedClient[]> {
  const db = getFirestoreDb();
  // Booking rows are listed by their source, a constraint the rules can check for the whole list.
  const bookingSnap = await getDocs(query(collection(db, 'therapistClients'),
    where('therapistUid', '==', therapistUid), where('source', '==', 'booking')));
  // Invite rows are read through the live codes this therapist claimed: a row counts only while its code still exists.
  const codesSnap = await getDocs(query(collection(db, 'therapistLinks'), where('claimedBy', '==', therapistUid)));
  const inviteRows = await Promise.all(codesSnap.docs.map((code) => getDoc(
    doc(db, 'therapistClients', `${therapistUid}_${code.data()['clientUid']}`),
  ).then((row) => (row.exists() && row.data()['source'] === 'invite' && row.data()['linkCode'] === code.id ? row.data() : null))));
  const rows = [
    ...bookingSnap.docs.map((d) => d.data()),
    ...inviteRows.filter((data): data is NonNullable<typeof data> => data != null),
  ];
  const clients = rows.map((data) => ({
    clientUid: (data['clientUid'] as string) ?? '',
    clientEmail: (data['clientEmail'] as string) ?? null,
    linkedAt: (data['linkedAt'] as string) ?? '',
    archived: (data['archived'] as boolean) ?? false,
    summary: (data['summary'] as TherapistClientSummary | undefined) ?? null,
  }));
  clients.sort((a, b) => (b.linkedAt || '').localeCompare(a.linkedAt || ''));
  return clients;
}

/** Archive / restore a client from the therapist's dashboard. */
export async function setClientArchived(
  therapistUid: string, clientUid: string, archived: boolean,
): Promise<void> {
  const db = getFirestoreDb();
  await setDoc(
    doc(db, 'therapistClients', `${therapistUid}_${clientUid}`),
    { archived },
    { merge: true },
  );
}

/**
 * Therapist assigns an exercise. A RED one passes the gate ONLY with the client's container proof (§3B.1):
 * without it the assignment is refused, because the dashboard cannot see the container.
 */
export async function assignExercise(
  therapistUid: string, clientUid: string,
  assignment: Omit<TherapistAssignment, 'id' | 'assignedAt' | 'clientSummary'>,
  opts: { red?: { profile: ScoredProfile; container: ContainerState } } = {},
): Promise<boolean> {
  const { EXERCISES, EXERCISE_TYPES, redAllowed } = await import('../../shared/core/data/exercises');
  const exercise = EXERCISES.find((item) => item.id === assignment.exerciseId);
  if (exercise && EXERCISE_TYPES[exercise.type].gate === 'red' && !opts.red) return false;
  if (opts.red && !redAllowed(opts.red.profile, opts.red.container, true)) {
    return false; // even therapists cannot skip the container (§3E.3)
  }
  const db = getFirestoreDb();
  const id = `${clientUid}_${assignment.exerciseId}_${Date.now()}`;
  await setDoc(doc(db, 'assignments', id), {
    id, therapistUid, clientUid, ...assignment, assignedAt: new Date().toISOString(),
  });
  return true;
}

/** Client side: my assignments (therapist-assigned cards incl. RED). */
export async function myAssignments(clientUid: string): Promise<TherapistAssignment[]> {
  const db = getFirestoreDb();
  const q = query(collection(db, 'assignments'), where('clientUid', '==', clientUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as unknown as TherapistAssignment);
}

export const CONSENT_TEXT = {
  en: 'Your therapist sees: your constellation headline, part scores, active repeating scenarios, how you cope, and exercise adherence. They never see: your raw answers, your somatic zones, or your reflections — unless you share a reflection yourself, one at a time. You can unlink at any moment.',
  ru: 'Ваш терапевт видит: название созвездия, баллы частей, активные повторяющиеся сценарии, способы справляться и выполнение практик. Он никогда не видит: ваши исходные ответы, соматические зоны и размышления — если вы сами не поделитесь конкретным размышлением. Отключить связь можно в любой момент.',
} as const;
