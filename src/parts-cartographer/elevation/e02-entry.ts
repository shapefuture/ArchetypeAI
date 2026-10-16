// E02 need-based entry and first useful result (ArchetypeAI-3pj, step 04). Pure: no storage, DOM, network or clock.
// Three immediate needs each lead to one small, complete first result with a useful stopping point. Missing context
// gets an honest default that names what is missing: no invented profile, completion or score. The 64 and 147
// instruments are canonical, so they are offered only as deeper options and never as a default. Onboarding never
// gates entry, assessment-free support is always on, and sensory choices are neither read nor changed.
// Labels are kept apart: need (user-authored), route suggestion (hypothesis, or user-authored when deep-linked),
// result (observation, or canonical-measurement for the 64/147 routes).
// Reused: assessment-routes (route contract, availability, sample-save rule), contextual-checkin (reviewed practices,
// quiet single step, saved check-in resume), assessment-draft (draft validation and resume point).
// NOT done: copy and layout (step 05), shell, deep-link and storage wiring (step 06), evidence and acceptance (steps 10-12).

import { sampleSavePlan, type AssessmentRoute, type RouteId } from '../core/assessment-routes';
import { availablePractices, resume, stepsFor, type CheckInState, type Practice } from '../core/contextual-checkin';
import { isDescentDraft, resumePoint } from '../core/assessment-draft';

export const NEEDS = ['calm-now', 'situation', 'pattern'] as const;
export type Need = (typeof NEEDS)[number];
export type Provenance = 'observation' | 'hypothesis' | 'user-authored' | 'canonical-measurement';
export type StopReason = 'useful-now' | 'assessment-skipped';
export type EntryNotice = 'route-unavailable' | 'no-reviewed-practice' | 'deep-link-missing' | 'deep-link-unknown' | 'deep-link-unavailable';
export type Refusal = 'stale' | 'invalid-need' | 'wrong-step' | 'at-root' | 'nothing-saved' | 'saved-unavailable' | 'draft-unreadable';

/** Educated guess: the simplest self-serve exercise in the catalog. Replace with a reviewed choice. */
export const CALM_START_ID = 'paced-breath';
export const SUPPORT = { available: true, requiresAssessment: false } as const;

export type Destination =
  | { kind: 'practice'; practiceId: string; title: string; steps: ReadonlyArray<string> }
  | { kind: 'assessment'; routeId: RouteId; canonical: boolean; produces: AssessmentRoute['produces'] };

export interface Choice {
  need: Need | null;
  destination: Destination;
  stepIndex: number;
  /** Set when the need's own route is unavailable and a calm start is offered instead. */
  fallback: 'route-unavailable' | null;
  labels: { need: 'user-authored' | null; route: 'hypothesis' | 'user-authored'; result: 'observation' | 'canonical-measurement' };
  /** Teaser results: replace the current map, or archive only when a canonical map exists. Null for practices and canonical routes. */
  saveRule: 'replace-current' | 'archive-only' | null;
  stillUnknown: string[];
  /** Canonical routes, offered only after a stop and never auto-selected. */
  deeper: RouteId[];
  offline: boolean;
}

export type SavedTool =
  | { kind: 'practice'; checkIn: CheckInState }
  | { kind: 'battery-147'; draft: unknown }
  | { kind: 'reflection-64'; index: number };

export interface EntryContext {
  practices: ReadonlyArray<Practice>;
  routes: ReadonlyArray<AssessmentRoute>;
  /** The person's current canonical map, or null when none exists. It is never assumed. */
  profile: unknown;
  quiet: boolean;
  online: boolean;
  savedTool: SavedTool | null;
}

export type EntryStep = { kind: 'needs' } | { kind: 'route'; choice: Choice } | { kind: 'stop'; reason: StopReason; choice: Choice };

export interface EntryState {
  schema: 'entry.v1';
  revision: number;
  step: EntryStep;
  history: EntryStep[];
  notice: EntryNotice | null;
  /** Optional, never a gate: unfinished onboarding is only flagged. */
  onboardingPending: boolean;
  support: typeof SUPPORT;
}

type Base = { expectedRevision?: number };
export type EntryAction = Base & (
  | { type: 'choose-need'; need: string }
  | { type: 'open-deep-link'; query: string }
  | { type: 'resume-saved' }
  | { type: 'finish-step' }
  | { type: 'skip-assessment' }
  | { type: 'back' }
);

export type EntryResult = { ok: true; state: EntryState } | { ok: false; reason: Refusal; state: EntryState };
export type RouteOutcome = { ok: true; choice: Choice } | { ok: false; notice: EntryNotice };
export type ResumeOutcome = { ok: true; choice: Choice } | { ok: false; reason: 'saved-unavailable' | 'draft-unreadable' };

const ok = (state: EntryState): EntryResult => ({ ok: true, state });
const refuse = (reason: Refusal, state: EntryState): EntryResult => ({ ok: false, reason, state });
const move = (s: EntryState, step: EntryStep, notice: EntryNotice | null, history = s.history): EntryState =>
  ({ ...s, step, notice, history, revision: s.revision + 1 });
const advance = (s: EntryState, step: EntryStep, notice: EntryNotice | null = null): EntryState =>
  move(s, step, notice, [...s.history, s.step]);

const isNeed = (v: string): v is Need => (NEEDS as readonly string[]).includes(v);
const routeById = (id: string, ctx: EntryContext) => ctx.routes.find((r) => r.id === id) ?? null;

/** Completion is not known to the entry, so only prerequisite-free practices are offered. */
const readyPractices = (ctx: EntryContext): Practice[] => availablePractices(ctx.practices, []);

/** Canonical routes that are available. They are never the default, only a deeper option. */
const deeperFor = (ctx: EntryContext, except: RouteId | null): RouteId[] =>
  ctx.routes.filter((r) => r.canonical && r.available && r.id !== except).map((r) => r.id);

const UNKNOWN: Partial<Record<RouteId, string[]>> = {
  'quick-scan-teaser': ['how-this-applies-over-time'],
  'situation-inquiry': ['the-wider-picture'],
  'reflection-64': ['the-full-profile'],
  'battery-147': ['the-full-profile'],
};

function practiceChoice(
  p: Practice, ctx: EntryContext, need: Need | null, route: Choice['labels']['route'],
  fallback: Choice['fallback'], stepIndex = 0,
): Choice {
  const steps = stepsFor(p, ctx.quiet ? 'quiet' : 'full');
  return {
    need, destination: { kind: 'practice', practiceId: p.id, title: p.title, steps },
    stepIndex: Math.max(0, Math.min(stepIndex, steps.length - 1)), fallback,
    labels: { need: need ? 'user-authored' : null, route, result: 'observation' },
    saveRule: null, stillUnknown: ['whether-it-helps-outside-the-app'], deeper: deeperFor(ctx, null), offline: !ctx.online,
  };
}

function assessmentChoice(
  route: AssessmentRoute, ctx: EntryContext, need: Need | null, routeBy: Choice['labels']['route'], stepIndex = 0,
): Choice {
  return {
    need, destination: { kind: 'assessment', routeId: route.id, canonical: route.canonical, produces: route.produces },
    stepIndex, fallback: null,
    labels: { need: need ? 'user-authored' : null, route: routeBy, result: route.canonical ? 'canonical-measurement' : 'observation' },
    saveRule: route.canonical ? null : sampleSavePlan(ctx.profile),
    stillUnknown: UNKNOWN[route.id] ?? [], deeper: deeperFor(ctx, route.id), offline: !ctx.online,
  };
}

/** Maps one need to one first step. A missing route or practice gives a named notice, never a blank step. */
export function routeForNeed(need: Need, ctx: EntryContext): RouteOutcome {
  const target: RouteId | null = need === 'situation' ? 'situation-inquiry' : need === 'pattern' ? 'quick-scan-teaser' : null;
  const route = target ? routeById(target, ctx) : null;
  if (route?.available) return { ok: true, choice: assessmentChoice(route, ctx, need, 'hypothesis') };
  const ready = readyPractices(ctx);
  const calm = ready.find((p) => p.id === CALM_START_ID) ?? ready[0];
  if (calm) return { ok: true, choice: practiceChoice(calm, ctx, need, 'hypothesis', target ? 'route-unavailable' : null) };
  return { ok: false, notice: target ? 'route-unavailable' : 'no-reviewed-practice' };
}

/** Parses ?route=<id> or ?practice=<id>. Missing, unknown or unavailable links are named failures, never guesses. */
export function parseDeepLink(query: string, ctx: EntryContext): RouteOutcome {
  const params = new URLSearchParams(query);
  const routeId = params.get('route');
  const practiceId = params.get('practice');
  if (!routeId && !practiceId) return { ok: false, notice: 'deep-link-missing' };
  if (routeId) {
    const route = routeById(routeId, ctx);
    if (!route) return { ok: false, notice: 'deep-link-unknown' };
    return route.available
      ? { ok: true, choice: assessmentChoice(route, ctx, null, 'user-authored') }
      : { ok: false, notice: 'deep-link-unavailable' };
  }
  const p = ctx.practices.find((x) => x.id === practiceId);
  if (!p) return { ok: false, notice: 'deep-link-unknown' };
  return readyPractices(ctx).some((x) => x.id === p.id)
    ? { ok: true, choice: practiceChoice(p, ctx, null, 'user-authored', null) }
    : { ok: false, notice: 'deep-link-unavailable' };
}

/** Resumes a saved tool at its own step. An unreadable draft is refused and left untouched, never overwritten. */
export function resumeSaved(saved: SavedTool, ctx: EntryContext): ResumeOutcome {
  if (saved.kind === 'practice') {
    const p = readyPractices(ctx).find((x) => x.id === saved.checkIn.practiceId);
    if (!p) return { ok: false, reason: 'saved-unavailable' };
    const resumed = resume(saved.checkIn);
    return { ok: true, choice: practiceChoice(p, { ...ctx, quiet: resumed.mode === 'quiet' }, null, 'user-authored', null, resumed.stepIndex) };
  }
  const route = routeById(saved.kind === 'battery-147' ? 'battery-147' : 'reflection-64', ctx);
  if (!route?.available) return { ok: false, reason: 'saved-unavailable' };
  if (saved.kind === 'battery-147') {
    return isDescentDraft(saved.draft)
      ? { ok: true, choice: assessmentChoice(route, ctx, null, 'user-authored', resumePoint(saved.draft).index) }
      : { ok: false, reason: 'draft-unreadable' };
  }
  return Number.isInteger(saved.index) && saved.index >= 0
    ? { ok: true, choice: assessmentChoice(route, ctx, null, 'user-authored', saved.index) }
    : { ok: false, reason: 'draft-unreadable' };
}

/** Entry always starts at the three needs. Unfinished onboarding is flagged as optional, never a prerequisite. */
export function startEntry(onboarding: { completed: boolean } | null): EntryState {
  return {
    schema: 'entry.v1', revision: 1, step: { kind: 'needs' }, history: [], notice: null,
    onboardingPending: !!onboarding && !onboarding.completed, support: SUPPORT,
  };
}

/** Applies one action. Refusals return the entry unchanged; a recovered failure lands on a chooser with a notice. */
export function reduceEntry(state: EntryState, action: EntryAction, ctx: EntryContext): EntryResult {
  if (action.expectedRevision !== undefined && action.expectedRevision !== state.revision) return refuse('stale', state);
  switch (action.type) {
    case 'choose-need': {
      if (state.step.kind !== 'needs') return refuse('wrong-step', state);
      if (!isNeed(action.need)) return refuse('invalid-need', state);
      const r = routeForNeed(action.need, ctx);
      if (r.ok === false) return ok(move(state, state.step, r.notice));
      return ok(advance(state, { kind: 'route', choice: r.choice }));
    }
    case 'open-deep-link': {
      const r = parseDeepLink(action.query, ctx);
      if (r.ok === false) return ok(advance(state, { kind: 'needs' }, r.notice));
      return ok(advance(state, { kind: 'route', choice: r.choice }));
    }
    case 'resume-saved': {
      if (!ctx.savedTool) return refuse('nothing-saved', state);
      const r = resumeSaved(ctx.savedTool, ctx);
      if (r.ok === false) return refuse(r.reason, state);
      return ok(advance(state, { kind: 'route', choice: r.choice }));
    }
    case 'finish-step': {
      if (state.step.kind !== 'route') return refuse('wrong-step', state);
      return ok(advance(state, { kind: 'stop', reason: 'useful-now', choice: state.step.choice }));
    }
    case 'skip-assessment': {
      if (state.step.kind !== 'route') return refuse('wrong-step', state);
      return ok(advance(state, { kind: 'stop', reason: 'assessment-skipped', choice: state.step.choice }));
    }
    case 'back': {
      const last = state.history[state.history.length - 1];
      return last ? ok(move(state, last, null, state.history.slice(0, -1))) : refuse('at-root', state);
    }
  }
}
