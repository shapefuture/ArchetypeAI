// E13.04 universal interaction grammar: save, undo, pause, inspect and return (ArchetypeAI-k936). Pure.
// Each core path declares which primitive it supports, its owner, and why a refused primitive is refused. A record
// keeps what is shown apart from what storage read back, so "saved" is claimed only after a read-back matches.
// Canonical gates keep the 147-item and 64-item results and map coordinates unchanged. Provenance separates
// observation, hypothesis, user authorship and canonical measurement.
// Reuses: navigation-history, assessment-draft (save-failure classes, complete-ratings gate, resume point),
// therapist-access (booking grant), personal-memory (source names).
// NOT done: rendering and focus calls (UI, step 05); storage writes and wiring (step 06); evidence and acceptance
// (steps 10-12). No clinical, efficacy or validation claim.

import { planNavigation, type NavEntry, type NavStep, type NavView } from '../core/navigation-history';
import { completeRatings, resumePoint, saveFailure, type DescentDraft, type SaveFailure } from '../core/assessment-draft';
import { decideAccess, type Relationship } from '../core/therapist-access';
import type { Source as MemorySource } from '../core/personal-memory';

export type CorePath = 'assessment' | 'map' | 'coach' | 'booking';
export type Primitive = 'save' | 'undo' | 'pause' | 'inspect' | 'return';
export type Provenance = 'observation' | 'hypothesis' | 'user-authorship' | 'canonical-measurement';
export type Support = { supported: true; owner: string } | { supported: false; reason: string };
export type Persisted = 'saved' | 'unsaved' | 'saving' | 'failed' | 'unconfirmed';

export interface PathContract {
  needsAssessment: boolean;
  primitives: Record<Primitive, Support>;
  provenance: Record<string, Provenance>;
}

const yes = (owner: string): Support => ({ supported: true, owner });
const no = (reason: string): Support => ({ supported: false, reason });

/** One entry per core path. Changing a path's behaviour means changing its entry here, not the screen. */
export const REGISTRY: Readonly<Record<CorePath, PathContract>> = {
  assessment: {
    needsAssessment: false,
    primitives: {
      save: yes('assessment-draft: INNERVERSE_DESCENT_V2, written and read back'),
      undo: yes('in session: last rating; persists only after a verified save'),
      pause: yes('draft kept; resumes at the stored cursor'),
      inspect: yes('answers by stable item id; completeness checked before any result'),
      return: yes('resumePoint of the stored draft'),
    },
    provenance: { answers: 'canonical-measurement', cursor: 'observation', savedAt: 'observation' },
  },
  map: {
    needsAssessment: true,
    primitives: {
      save: yes('ifs.parts, read back before it counts'),
      undo: yes('in session: restores the previous part list; canonical coordinates are never edited'),
      pause: no('map edits apply on confirm; there is no timed session to pause'),
      inspect: yes('coordinates as canonical measurement; names and traits as user authorship'),
      return: yes('same part reopened through route and sheet history'),
    },
    provenance: { coordinates: 'canonical-measurement', name: 'user-authorship', traits: 'user-authorship', interpretation: 'hypothesis' },
  },
  coach: {
    needsAssessment: false,
    primitives: {
      save: yes('explicit excerpt only, stored as a saved memory; the transient exchange is not saved'),
      undo: no('sent messages are not undone; a saved excerpt is removed through delete'),
      pause: yes('draft kept on pause or request failure; nothing persisted without an explicit save'),
      inspect: yes('saved memories with their source; unsaved chat is never offered as context'),
      return: yes('draft returns to the layer that opened it'),
    },
    provenance: { message: 'user-authorship', reply: 'hypothesis', excerpt: 'user-authorship', exchange: 'observation' },
  },
  booking: {
    needsAssessment: false,
    primitives: {
      save: yes('booking request confirmed by the server; needs the client booking grant'),
      undo: no('cancellation is an external effect that the server confirms; it is not an undo'),
      pause: no('no local session; a request stays pending on the server'),
      inspect: yes('server status and time zone, as recorded'),
      return: yes('appointment reopened from the cabinet after reload or sign-in'),
    },
    provenance: { status: 'observation', time: 'observation', consent: 'user-authorship' },
  },
};

export function predict(path: CorePath, primitive: Primitive): Support {
  return REGISTRY[path].primitives[primitive];
}

/** Whether the path's primitives stay available without a completed assessment. */
export function assessmentFree(path: CorePath): boolean {
  return !REGISTRY[path].needsAssessment;
}

export function provenanceOf(path: CorePath, field: string): Provenance | null {
  return REGISTRY[path].provenance[field] ?? null;
}

const MEMORY_PROVENANCE: Record<MemorySource, Provenance> = {
  'user-entry': 'user-authorship',
  assessment: 'canonical-measurement',
  'model-inference': 'hypothesis',
};

export function provenanceOfMemory(source: MemorySource): Provenance {
  return MEMORY_PROVENANCE[source];
}

// ---- Persisted record -------------------------------------------------------------------------------------------

export interface RecordState<T> {
  /** Last value read back from storage. This is what is persisted. */
  durable: T;
  /** Value on screen. It may be unsaved. */
  shown: T;
  undo: ReadonlyArray<T>;
  phase: 'idle' | 'saving' | 'failed' | 'unconfirmed';
  attempt: { requestId: string; value: T } | null;
  failure: SaveFailure | null;
  savedAt: string | null;
  paused: boolean;
}

/** The caller performs the write, then reports what happened. The read-back is the raw stored string. */
export type WriteOutcome = { ok: true; readBack: string | null } | { ok: false; error: unknown };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const MAX_UNDO = 20;

export function createRecord<T>(durable: T, savedAt: string | null = null): RecordState<T> {
  return { durable, shown: durable, undo: [], phase: 'idle', attempt: null, failure: null, savedAt, paused: false };
}

/** A new value on screen. An in-flight or unconfirmed write keeps its phase; the edit is shown as unsaved. */
export function edit<T>(s: RecordState<T>, next: T): RecordState<T> {
  if (same(next, s.shown)) return s;
  const keep = s.phase === 'saving' || s.phase === 'unconfirmed';
  return { ...s, shown: next, undo: [...s.undo, s.shown].slice(-MAX_UNDO), phase: keep ? s.phase : 'idle', failure: keep ? s.failure : null };
}

/** Restores the previous shown value. The result is unsaved until it is saved again. */
export function undo<T>(s: RecordState<T>): { state: RecordState<T>; reason: 'undone' | 'nothing-to-undo' | 'save-in-progress' | 'save-unconfirmed' } {
  if (s.phase === 'saving') return { state: s, reason: 'save-in-progress' };
  if (s.phase === 'unconfirmed') return { state: s, reason: 'save-unconfirmed' };
  if (s.undo.length === 0) return { state: s, reason: 'nothing-to-undo' };
  return { state: { ...s, shown: s.undo[s.undo.length - 1], undo: s.undo.slice(0, -1), phase: 'idle', failure: null }, reason: 'undone' };
}

/** Starts one write. A second submit while one is in flight is ignored, so a double tap never writes twice. */
export function beginSave<T>(s: RecordState<T>, requestId: string): { state: RecordState<T>; started: boolean; reason: 'started' | 'duplicate-ignored' | 'nothing-to-save' | 'reconcile-first' } {
  if (s.phase === 'saving') return { state: s, started: false, reason: 'duplicate-ignored' };
  if (s.phase === 'unconfirmed') return { state: s, started: false, reason: 'reconcile-first' };
  if (same(s.shown, s.durable)) return { state: s, started: false, reason: 'nothing-to-save' };
  return { state: { ...s, phase: 'saving', attempt: { requestId, value: s.shown }, failure: null }, started: true, reason: 'started' };
}

/** Settles one write. Only the matching request counts. A save counts only when the read-back equals what was written. */
export function settleSave<T>(s: RecordState<T>, requestId: string, outcome: WriteOutcome, at: string): RecordState<T> {
  if (s.phase !== 'saving' || !s.attempt || s.attempt.requestId !== requestId) return s;
  const { value } = s.attempt;
  if (outcome.ok === false) return { ...s, phase: 'failed', failure: saveFailure(outcome.error), attempt: null };
  if (outcome.readBack !== JSON.stringify(value)) return { ...s, phase: 'failed', failure: 'verify-failed', attempt: null };
  return { ...s, durable: value, phase: 'idle', failure: null, attempt: null, savedAt: at };
}

/** An interruption never discards edits. An in-flight write becomes unconfirmed until it is re-read. */
export function interrupt<T>(s: RecordState<T>): RecordState<T> {
  return s.phase === 'saving' ? { ...s, phase: 'unconfirmed' } : s;
}

/** On return, an unconfirmed write is settled from what storage now holds. Neither outcome is assumed. */
export function reconcile<T>(s: RecordState<T>, readBack: string | null, at: string): RecordState<T> {
  if (s.phase !== 'unconfirmed' || !s.attempt) return s;
  if (readBack === JSON.stringify(s.attempt.value)) return { ...s, durable: s.attempt.value, phase: 'idle', attempt: null, failure: null, savedAt: at };
  if (readBack === JSON.stringify(s.durable)) return { ...s, phase: 'idle', attempt: null };
  return { ...s, phase: 'failed', failure: 'verify-failed', attempt: null };
}

/** The label the screen may show. "saved" only when shown equals what storage holds. */
export function persistedLabel<T>(s: RecordState<T>): Persisted {
  if (s.phase === 'unconfirmed') return 'unconfirmed';
  if (s.phase === 'failed') return 'failed';
  if (s.phase === 'saving' && s.attempt && same(s.shown, s.attempt.value)) return 'saving';
  return same(s.shown, s.durable) ? 'saved' : 'unsaved';
}

/** Pausing never claims "saved". Leaving is safe only when nothing is unsaved or in doubt. */
export function pause<T>(s: RecordState<T>): { state: RecordState<T>; label: Persisted; safeToLeave: boolean } {
  const state = { ...s, paused: true };
  const label = persistedLabel(state);
  return { state, label, safeToLeave: label === 'saved' };
}

export function resume<T>(s: RecordState<T>): RecordState<T> {
  return { ...s, paused: false };
}

/** What a returning person sees: the value on screen with its honest label. */
export function resumeView<T>(s: RecordState<T>): { value: T; label: Persisted } {
  return { value: s.shown, label: persistedLabel(s) };
}

// ---- Canonical gates and per-path rules -------------------------------------------------------------------------

/** A canonical result is produced only from a complete set of ratings. */
export function canonicalResultAllowed(answers: Record<string, number>): boolean {
  return completeRatings(answers) !== null;
}

/** Where a returning person resumes the stored assessment draft. */
export function assessmentReturn(draft: DescentDraft): { stage: string; index: number } {
  const { stage, index } = resumePoint(draft);
  return { stage, index };
}

export interface PartLike {
  id: string;
  archetype?: { coordinates: number[] } | null;
  [extra: string]: unknown;
}

const coordinateKey = (part: PartLike) => JSON.stringify(part.archetype?.coordinates ?? null);

/** Every canonical placement in `before` must survive unchanged. Additions, names and trait edits are allowed. */
export function canonicalCoordinatesKept(before: ReadonlyArray<PartLike>, after: ReadonlyArray<PartLike>): boolean {
  const next = new Map(after.map((part) => [part.id, part] as const));
  return before.every((part) => {
    const kept = next.get(part.id);
    return kept !== undefined && coordinateKey(kept) === coordinateKey(part);
  });
}

/** A booking request needs a live link and the client's booking grant. The denial reasons come from the existing rules. */
export function bookingRequestAllowed(relationship: Relationship | null, clientUid: string): boolean {
  return decideAccess({ actorUid: clientUid, actorRole: 'client', action: 'book', relationship }).allowed;
}

// ---- Layers and focus -------------------------------------------------------------------------------------------

export type CloseCause = 'escape' | 'scrim' | 'close-button' | 'back' | 'route-change' | 'unmount';
export type FocusTarget = { kind: 'trigger'; id: string } | { kind: 'route-heading'; route: string };

/** Back already moved history, so it emits no steps. Other closes use the planner. Focus returns to a live trigger. */
export function closeLayer(input: { current: NavEntry | null; next: NavView; trigger: string | null; triggerPresent: boolean; cause: CloseCause }): { steps: NavStep[]; focus: FocusTarget } {
  const { current, next, trigger, triggerPresent, cause } = input;
  const steps = cause === 'back' || cause === 'unmount' ? [] : planNavigation(current, next);
  const focus: FocusTarget = trigger !== null && triggerPresent && cause !== 'route-change'
    ? { kind: 'trigger', id: trigger }
    : { kind: 'route-heading', route: next.route };
  return { steps, focus };
}

export function predictAll(): Array<{ path: CorePath; primitive: Primitive; support: Support }> {
  const paths = Object.keys(REGISTRY) as CorePath[];
  const primitives: Primitive[] = ['save', 'undo', 'pause', 'inspect', 'return'];
  return paths.flatMap((path) => primitives.map((primitive) => ({ path, primitive, support: predict(path, primitive) })));
}
