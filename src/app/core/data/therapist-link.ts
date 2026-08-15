/**
 * INNERVERSE — Therapist Mode link layer (REVAMP §3B.4).
 *
 * Client connects to a therapist via a 6-char invite code; the therapist's
 * dashboard reads the client's measured constructs (T-scores, complexes,
 * coping stack, adherence) — never raw item answers, never somatic zones,
 * never reflections unless the client shares a reflection explicitly
 * (default OFF). RED exercises are assignable ONLY from the therapist side
 * (redAllowed), and require the Safe-Place container (§3E.3).
 *
 * The consent contract at link time is exactly this paragraph.
 */
import {
  doc, getDoc, setDoc, collection, getDocs, query, where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../../environments/firebase-init';
import type { ScoredProfile } from './scoring-v2';
import { redAllowed, type ContainerState } from './exercises';

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
    copingStack: profile.copingStack,
    adherence,
  };
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusables

/** Deterministic-from-random code; 6 chars, ~1e9 space. */
export function generateLinkCode(rand: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return code;
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

/** Therapist side: claim a code → it appears in the dashboard list. */
export async function claimTherapistLink(
  therapistUid: string, code: string,
): Promise<TherapistClientSummary | null> {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, 'therapistLinks', code.trim().toUpperCase()));
  if (!snap.exists()) return null;
  const summary = snap.data()['summary'] as TherapistClientSummary;
  await setDoc(
    doc(db, 'therapistClients', `${therapistUid}_${snap.data()['clientUid']}`),
    { therapistUid, clientUid: snap.data()['clientUid'], linkedAt: new Date().toISOString(), summary },
  );
  return summary;
}

/** Therapist dashboard: all linked clients. */
export async function linkedClients(therapistUid: string): Promise<TherapistClientSummary[]> {
  const db = getFirestoreDb();
  const q = query(collection(db, 'therapistClients'), where('therapistUid', '==', therapistUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data()['summary'] as TherapistClientSummary);
}

/** Therapist assigns an exercise. RED passes the gate ONLY here (§3B.1). */
export async function assignExercise(
  therapistUid: string, clientUid: string,
  assignment: Omit<TherapistAssignment, 'id' | 'assignedAt' | 'clientSummary'>,
  opts: { red?: { profile: ScoredProfile; container: ContainerState } } = {},
): Promise<boolean> {
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
  en: 'Your therapist sees: your constellation headline, part T-scores, active complexes, coping stack, and exercise adherence. They never see: your raw answers, your somatic zones, or your reflections — unless you share a reflection yourself, one at a time. You can unlink at any moment.',
  ru: 'Ваш терапевт видит: название созвездия, T-баллы частей, активные комплексы, стратегию совладания и выполнение практик. Он никогда не видит: ваши исходные ответы, соматические зоны и размышления — если вы сами не поделитесь конкретным размышлением. Отключить связь можно в любой момент.',
};
