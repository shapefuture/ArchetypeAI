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
  doc, getDoc, setDoc, collection, getDocs, query, where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../environments/firebase-init';
import type { ScoredProfile } from '../../app/core/data/scoring-v2';
import type { ContainerState } from '../../app/core/data/exercises';

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

/** Therapist side: claim a code → it appears in the dashboard list. */
export async function claimTherapistLink(
  therapistUid: string, code: string,
): Promise<TherapistClientSummary | null> {
  const db = getFirestoreDb();
  const linkCode = code.trim().toUpperCase();
  const snap = await getDoc(doc(db, 'therapistLinks', linkCode));
  if (!snap.exists()) return null;
  const summary = snap.data()['summary'] as TherapistClientSummary;
  const clientUid = snap.data()['clientUid'] as string;
  await setDoc(
    doc(db, 'therapistClients', `${therapistUid}_${clientUid}`),
    {
      therapistUid,
      clientUid,
      linkedAt: new Date().toISOString(),
      source: 'invite',
      linkCode,
      summary,
    },
  );
  return summary;
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
  const q = query(collection(db, 'therapistClients'), where('therapistUid', '==', therapistUid));
  const snap = await getDocs(q);
  const clients = snap.docs.map(d => {
    const data = d.data();
    return {
      clientUid: (data['clientUid'] as string) ?? '',
      clientEmail: (data['clientEmail'] as string) ?? null,
      linkedAt: (data['linkedAt'] as string) ?? '',
      archived: (data['archived'] as boolean) ?? false,
      summary: (data['summary'] as TherapistClientSummary | undefined) ?? null,
    };
  });
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

/** Therapist assigns an exercise. RED passes the gate ONLY here (§3B.1). */
export async function assignExercise(
  therapistUid: string, clientUid: string,
  assignment: Omit<TherapistAssignment, 'id' | 'assignedAt' | 'clientSummary'>,
  opts: { red?: { profile: ScoredProfile; container: ContainerState } } = {},
): Promise<boolean> {
  if (opts.red) {
    const { redAllowed } = await import('../../app/core/data/exercises');
    if (!redAllowed(opts.red.profile, opts.red.container, true)) {
      return false; // even therapists cannot skip the container (§3E.3)
    }
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
