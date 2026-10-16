// E11 Felt expression selection (ArchetypeAI-b1kx, step E11.04). Pure and deterministic.
// Chooses the character's expression from the app's actual requested, saved and selected states. Each choice names its
// basis: observation (an app state), hypothesis (a family role), user-authorship (a role the person wrote) or
// canonical-measurement (a scored 64/147 item, always neutral). Every pose has a static equivalent, so motion can stop
// without losing meaning. The recovery rules of ArchetypeAI-kxt3 (step E11.07) live here and are exercised by the spec:
// interrupted or reduced motion keeps the still pose, unwanted recurrence limits decorative gestures only, stale
// responses are ignored, stored data is normalised, and an authored role outranks a family hypothesis.
// No randomness, clock, DOM, storage or network. Felt roles are fixed authored ids, never generated identities.
// Not done here: drawing the character (pal/FeltCharacter, step 05), wiring to live app state, timers and storage
// (step 06), expression, prop and humour copy (E11.05), and evidence or acceptance (steps 10-12).

import type { Family } from '../pal/traits';
import { sceneClockStep, type MotionMode } from '../core/sensory-preferences';
import { ambienceSuspended, type AmbienceSignals } from '../services/ambience-gate';

export type Basis = 'observation' | 'hypothesis' | 'user-authorship' | 'canonical-measurement';

/** Fixed authored role ids. A family role is a tentative hypothesis; only the person can author a different role. */
export const FELT_ROLES = ['steward', 'guardian', 'tender', 'companion'] as const;
export type FeltRole = (typeof FELT_ROLES)[number];
export const FAMILY_ROLE: Readonly<Record<Family, FeltRole>> = {
  manager: 'steward',
  firefighter: 'guardian',
  exile: 'tender',
  resource: 'companion',
};

/** Held still poses. `rest` is the neutral default and has no gesture. */
export const EXPRESSIONS = ['rest', 'greet', 'attend', 'keep', 'wait', 'confirm', 'steady'] as const;
export type FeltExpression = (typeof EXPRESSIONS)[number];
export type FeltGestureId = 'wave' | 'tilt' | 'bounce' | 'sway' | 'nod' | 'settle';
export interface FeltGesture { id: FeltGestureId; expression: FeltExpression; staticEquivalent: FeltExpression; }

/** Each gesture is the motion of one pose; its still frame is the static equivalent. */
export const GESTURES: ReadonlyArray<FeltGesture> = [
  { id: 'wave', expression: 'greet', staticEquivalent: 'greet' },
  { id: 'tilt', expression: 'attend', staticEquivalent: 'attend' },
  { id: 'bounce', expression: 'keep', staticEquivalent: 'keep' },
  { id: 'sway', expression: 'wait', staticEquivalent: 'wait' },
  { id: 'nod', expression: 'confirm', staticEquivalent: 'confirm' },
  { id: 'settle', expression: 'steady', staticEquivalent: 'steady' },
];

/** Decorative gestures stop after this many plays in one ledger. Static poses are never capped. */
export const MAX_GESTURE_PLAYS = 3;

/** App state supplied by the caller. Transient events (saved, confirmed) are held by the caller for the event's moment. */
export interface FeltAppState {
  arrival: 'loading' | 'ready';
  /** Set by the caller once the arrival greeting has been shown, so it is not repeated. */
  arrivalGreeted: boolean;
  selectedPart: { id: string; family: Family } | null;
  authoredRole: { partId: string; role: FeltRole } | null;
  bookmark: 'none' | 'saving' | 'saved' | 'failed';
  request: 'none' | 'in-flight' | 'confirmed' | 'denied' | 'failed';
  /** A canonical 64/147 item is on screen. Feedback is neutral and no answer value is read. */
  scoredItemActive: boolean;
}

/** Presentation context. It can stop decoration but never changes what a pose means. */
export interface FeltMoment { motion: MotionMode; systemReducedMotion: boolean; ambience: AmbienceSignals; }

export type SelectionReason = 'scored-item' | 'request-denied' | 'request-failed' | 'request-pending' | 'request-confirmed'
  | 'bookmark-failed' | 'bookmark-pending' | 'bookmark-saved' | 'part-selected' | 'arrival' | 'quiet';

export interface FeltSelection {
  expression: FeltExpression;
  reason: SelectionReason;
  basis: Basis;
  /** The animated gesture to play, or null when the still pose is shown. */
  gesture: FeltGestureId | null;
  staticEquivalent: FeltExpression;
  role: { id: FeltRole; basis: 'hypothesis' | 'user-authorship' } | null;
}

interface Rule { when: (state: FeltAppState) => boolean; expression: FeltExpression; reason: SelectionReason; }

/** Ordered priority: the first matching rule wins. A scored item overrides every other state. */
const RULES: ReadonlyArray<Rule> = [
  { when: (s) => s.scoredItemActive, expression: 'rest', reason: 'scored-item' },
  { when: (s) => s.request === 'denied', expression: 'steady', reason: 'request-denied' },
  { when: (s) => s.request === 'failed', expression: 'steady', reason: 'request-failed' },
  { when: (s) => s.request === 'in-flight', expression: 'wait', reason: 'request-pending' },
  { when: (s) => s.request === 'confirmed', expression: 'confirm', reason: 'request-confirmed' },
  { when: (s) => s.bookmark === 'failed', expression: 'steady', reason: 'bookmark-failed' },
  { when: (s) => s.bookmark === 'saving', expression: 'wait', reason: 'bookmark-pending' },
  { when: (s) => s.bookmark === 'saved', expression: 'keep', reason: 'bookmark-saved' },
  { when: (s) => s.selectedPart !== null, expression: 'attend', reason: 'part-selected' },
  { when: (s) => s.arrival === 'ready' && !s.arrivalGreeted, expression: 'greet', reason: 'arrival' },
];
const QUIET: Rule = { when: () => true, expression: 'rest', reason: 'quiet' };

function roleFor(state: FeltAppState): FeltSelection['role'] {
  const part = state.selectedPart;
  if (!part) return null;
  const authored = state.authoredRole;
  if (authored && authored.partId === part.id) return { id: authored.role, basis: 'user-authorship' };
  const id = FAMILY_ROLE[part.family];
  return id ? { id, basis: 'hypothesis' } : null;
}

/** A gesture plays only while decoration may move: not still, not system reduced motion, and the ambience gate is open. */
export function gestureFor(expression: FeltExpression, moment: FeltMoment): FeltGestureId | null {
  const gesture = GESTURES.find((candidate) => candidate.expression === expression);
  if (!gesture) return null;
  if (sceneClockStep(moment.motion, moment.systemReducedMotion) === 0) return null;
  return ambienceSuspended(moment.ambience) ? null : gesture.id;
}

/** Deterministic selection from the app state. The same snapshot always yields the same selection. */
export function selectFeltExpression(state: FeltAppState, moment: FeltMoment): FeltSelection {
  const rule = RULES.find((candidate) => candidate.when(state)) ?? QUIET;
  return {
    expression: rule.expression,
    reason: rule.reason,
    basis: rule.reason === 'scored-item' ? 'canonical-measurement' : 'observation',
    gesture: gestureFor(rule.expression, moment),
    staticEquivalent: rule.expression,
    role: roleFor(state),
  };
}

/** Names of gestures whose static equivalent is not a known pose. An empty result means every gesture has one. */
export function gesturesMissingStaticEquivalent(catalogue: ReadonlyArray<FeltGesture> = GESTURES): FeltGestureId[] {
  const poses: ReadonlyArray<string> = EXPRESSIONS;
  return catalogue.filter((gesture) => !poses.includes(gesture.staticEquivalent)).map((gesture) => gesture.id);
}

/** Authority: only an explicit choice by the person sets an authored role. Unknown roles or empty ids are refused. */
export function normalizeAuthoredRole(raw: unknown): { partId: string; role: FeltRole } | null {
  if (!raw || typeof raw !== 'object') return null;
  const { partId, role } = raw as { partId?: unknown; role?: unknown };
  if (typeof partId !== 'string' || partId.length === 0) return null;
  return (FELT_ROLES as ReadonlyArray<unknown>).includes(role) ? { partId, role: role as FeltRole } : null;
}

export function authorRole(state: FeltAppState, partId: string, role: FeltRole | null): FeltAppState {
  if (role === null) return { ...state, authoredRole: null };
  const authored = normalizeAuthoredRole({ partId, role });
  return authored ? { ...state, authoredRole: authored } : state;
}

/** Concurrency: each request gets an id. Only the latest in-flight id may settle; cancelled or stale ids are ignored. */
export interface RequestTracker { latest: number; status: FeltAppState['request']; }
export const IDLE_REQUESTS: RequestTracker = { latest: 0, status: 'none' };

export function startRequest(tracker: RequestTracker): { id: number; tracker: RequestTracker } {
  const id = tracker.latest + 1;
  return { id, tracker: { latest: id, status: 'in-flight' } };
}

export function settleRequest(tracker: RequestTracker, id: number, outcome: 'confirmed' | 'denied' | 'failed'): RequestTracker {
  if (id !== tracker.latest || tracker.status !== 'in-flight') return tracker;
  return { latest: tracker.latest, status: outcome };
}

/** Interruption: a cancelled request returns to `none`, so no wait pose is left behind. Its id stays retired. */
export function cancelRequest(tracker: RequestTracker): RequestTracker {
  return tracker.status === 'in-flight' ? { latest: tracker.latest, status: 'none' } : tracker;
}

/** Unwanted recurrence: play counts and muted gestures. The caller decides the ledger's scope and persistence. */
export interface RecurrenceLedger { plays: Partial<Record<FeltGestureId, number>>; muted: FeltGestureId[]; }
const GESTURE_IDS: ReadonlyArray<FeltGestureId> = GESTURES.map((gesture) => gesture.id);

/** Removes only the decorative gesture when it is capped or muted. The information-bearing pose stays. */
export function limitGesture(selection: FeltSelection, ledger: RecurrenceLedger): FeltSelection {
  const id = selection.gesture;
  if (!id) return selection;
  const blocked = (ledger.plays[id] ?? 0) >= MAX_GESTURE_PLAYS || ledger.muted.includes(id);
  return blocked ? { ...selection, gesture: null } : selection;
}

export function recordGesture(ledger: RecurrenceLedger, selection: FeltSelection): RecurrenceLedger {
  const id = selection.gesture;
  if (!id) return ledger;
  return { ...ledger, plays: { ...ledger.plays, [id]: (ledger.plays[id] ?? 0) + 1 } };
}

export function muteGesture(ledger: RecurrenceLedger, id: FeltGestureId): RecurrenceLedger {
  return ledger.muted.includes(id) ? ledger : { ...ledger, muted: [...ledger.muted, id] };
}

/** Storage recovery: stored ledgers are untrusted. Unknown keys and bad counts are dropped; counts are capped. */
export function normalizeLedger(raw: unknown): RecurrenceLedger {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { plays: {}, muted: [] };
  const { plays: playsRaw, muted: mutedRaw } = raw as { plays?: unknown; muted?: unknown };
  const plays: Partial<Record<FeltGestureId, number>> = {};
  if (playsRaw && typeof playsRaw === 'object') {
    for (const id of GESTURE_IDS) {
      const count = (playsRaw as Record<string, unknown>)[id];
      if (typeof count === 'number' && Number.isInteger(count) && count > 0) plays[id] = Math.min(count, MAX_GESTURE_PLAYS);
    }
  }
  const muted = Array.isArray(mutedRaw) ? GESTURE_IDS.filter((id) => mutedRaw.includes(id)) : [];
  return { plays, muted };
}
