// E01 personal goal and endpoint transitions (ArchetypeAI-64p, step 04). Pure: no storage, DOM, network or clock.
// A goal is the person's own chosen outcome, the reviewed tools they linked, the endpoints they wrote, and any
// real-world outcome they chose to report. reduceGoal returns the next state or a named refusal; a refusal never
// changes the goal. There is no readiness score, streak, rank or points: a missing report stays "unknown".
// Provenance is labelled per field: user-authored (statement, endpoints, tools), hypothesis (app-proposed until the
// person adopts it), observation (the person's own report) and canonical-measurement (never stored here; refused).
// Reused: practice-season (goal and endpoint container), experiment-outcome (outcome entries and summary),
// quiet-mode (the explicit graduation gate), situation-inquiry (overclaim check and hypothesis limit),
// contextual-checkin (Practice shape). Authored arrival, Felt identity and the 64/147 instruments are not touched.
// NOT done: UI (step 05), shell or storage wiring (step 06), evidence and acceptance (steps 10-12).

import { addEndpoint, createSeason, setGoals, type Season } from '../core/practice-season';
import { recordOutcome, summarizeExperiments, type ExperimentCard, type Outcome, type OutcomeEntry } from '../core/experiment-outcome';
import { graduate } from '../core/quiet-mode';
import { allowedFormulation, MAX_HYPOTHESES } from '../core/situation-inquiry';
import type { Practice } from '../core/contextual-checkin';

export type Provenance = 'observation' | 'hypothesis' | 'user-authored' | 'canonical-measurement';
export type Actor = 'user' | 'app';
export type GoalStatus = 'active' | 'paused' | 'graduated';
export interface LinkedTool { id: string; title: string; }

export interface GoalState {
  schema: 'goal.v1';
  id: string;
  status: GoalStatus;
  /** Container reused from practice-season: goals[0] is the chosen outcome; endpoints are the person's own. */
  season: Season;
  statementHistory: string[];
  tools: LinkedTool[];
  /** App-proposed readings (hypothesis). They are not the person's words until adopted. */
  hypotheses: string[];
  rejected: string[];
  /** Append-only. One card per goal (`<id>:goal`) or per linked tool (`<id>:<toolId>`); the latest entry per card wins. */
  outcomes: OutcomeEntry[];
  revision: number;
  pausedAt: string | null;
  graduatedAt: string | null;
  updatedAt: string;
}

type Base = { actor: Actor; expectedRevision?: number };
export type GoalAction = Base & (
  | { type: 'choose'; id: string; statement: string }
  | { type: 'revise'; statement: string }
  | { type: 'link-tool'; tool: Practice }
  | { type: 'unlink-tool'; toolId: string }
  | { type: 'add-endpoint'; text: string }
  | { type: 'propose-hypothesis'; text: string }
  | { type: 'adopt-hypothesis'; text: string }
  | { type: 'reject-hypothesis'; text: string }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'graduate'; chosen: boolean }
  | { type: 'record-outcome'; toolId: string | null; outcome: Outcome; note?: string }
  | { type: 'attach-measurement'; instrument: '64' | '147' }
);

export type Refusal =
  | 'stale' | 'wrong-actor' | 'canonical-measurement-not-allowed' | 'no-goal' | 'goal-exists' | 'graduated'
  | 'empty' | 'not-reviewed' | 'not-found' | 'overclaim' | 'limit' | 'rejected-again' | 'not-chosen';
export type GoalResult = { ok: true; state: GoalState | null } | { ok: false; reason: Refusal; state: GoalState | null };

const ok = (state: GoalState | null): GoalResult => ({ ok: true, state });
const refuse = (reason: Refusal, state: GoalState | null): GoalResult => ({ ok: false, reason, state });
const bump = (s: GoalState, change: Partial<GoalState>, now: string): GoalState =>
  ({ ...s, ...change, revision: s.revision + 1, updatedAt: now });
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const cardIdFor = (goalId: string, toolId: string | null) => `${goalId}:${toolId ?? 'goal'}`;
export const goalStatement = (state: GoalState): string => state.season.goals[0] ?? '';

function fresh(id: string, statement: string, now: string): GoalState {
  return {
    schema: 'goal.v1', id, status: 'active', season: createSeason(id, [statement]), statementHistory: [], tools: [],
    hypotheses: [], rejected: [], outcomes: [], revision: 1, pausedAt: null, graduatedAt: null, updatedAt: now,
  };
}

/** Applies one transition. Refusals return the state unchanged, so a refused action never alters the goal. */
export function reduceGoal(state: GoalState | null, action: GoalAction, now: string): GoalResult {
  if (action.type === 'attach-measurement') return refuse('canonical-measurement-not-allowed', state);
  if (action.expectedRevision !== undefined && state !== null && action.expectedRevision !== state.revision) return refuse('stale', state);
  if (action.type !== 'propose-hypothesis' && action.actor !== 'user') return refuse('wrong-actor', state);
  if (action.type === 'choose') {
    if (state) return refuse('goal-exists', state);
    const statement = action.statement.trim();
    return action.id.trim() && statement ? ok(fresh(action.id, statement, now)) : refuse('empty', state);
  }
  if (!state) return refuse('no-goal', state);
  // A graduated goal is read-only except for later reports, which stay welcome after graduation.
  if (state.status === 'graduated' && action.type !== 'record-outcome' && action.type !== 'graduate') return refuse('graduated', state);
  switch (action.type) {
    case 'revise': {
      const statement = action.statement.trim();
      if (!statement) return refuse('empty', state);
      if (statement === goalStatement(state)) return ok(state);
      return ok(bump(state, {
        season: setGoals(state.season, [statement]),
        statementHistory: [...state.statementHistory, goalStatement(state)],
      }, now));
    }
    case 'link-tool': {
      if (!action.tool.id) return refuse('empty', state);
      if (action.tool.status !== 'reviewed') return refuse('not-reviewed', state);
      if (state.tools.some((t) => t.id === action.tool.id)) return ok(state);
      return ok(bump(state, { tools: [...state.tools, { id: action.tool.id, title: action.tool.title }] }, now));
    }
    case 'unlink-tool': {
      if (!state.tools.some((t) => t.id === action.toolId)) return refuse('not-found', state);
      return ok(bump(state, { tools: state.tools.filter((t) => t.id !== action.toolId) }, now));
    }
    case 'add-endpoint': {
      const text = action.text.trim();
      return text ? ok(bump(state, { season: addEndpoint(state.season, text) }, now)) : refuse('empty', state);
    }
    case 'propose-hypothesis': {
      const text = action.text.trim();
      if (!text) return refuse('empty', state);
      if (!allowedFormulation(text)) return refuse('overclaim', state);
      if (state.rejected.some((r) => same(r, text))) return refuse('rejected-again', state);
      if (state.hypotheses.some((h) => same(h, text))) return ok(state);
      if (state.hypotheses.length >= MAX_HYPOTHESES) return refuse('limit', state);
      return ok(bump(state, { hypotheses: [...state.hypotheses, text] }, now));
    }
    case 'adopt-hypothesis':
    case 'reject-hypothesis': {
      const hit = state.hypotheses.find((h) => same(h, action.text.trim()));
      if (!hit) return refuse('not-found', state);
      const hypotheses = state.hypotheses.filter((h) => h !== hit);
      if (action.type === 'reject-hypothesis') return ok(bump(state, { hypotheses, rejected: [...state.rejected, hit] }, now));
      // Adoption is the person's own choice: the text becomes an endpoint they own.
      return ok(bump(state, { hypotheses, season: addEndpoint(state.season, hit) }, now));
    }
    case 'pause':
      return state.status === 'paused' ? ok(state) : ok(bump(state, { status: 'paused', pausedAt: now }, now));
    case 'resume':
      return state.status === 'active' ? ok(state) : ok(bump(state, { status: 'active', pausedAt: null }, now));
    case 'graduate': {
      if (state.status === 'graduated') return ok(state);
      // quiet-mode's gate: only an explicit yes graduates. Its progress field is not read by the gate.
      const gate = graduate({ places: state.tools.map((t) => t.id), progress: 0 }, action.chosen === true);
      return gate.graduated
        ? ok(bump(state, { status: 'graduated', pausedAt: null, graduatedAt: now }, now))
        : refuse('not-chosen', state);
    }
    case 'record-outcome': {
      if (action.toolId !== null && !state.tools.some((t) => t.id === action.toolId)) return refuse('not-found', state);
      const tool = state.tools.find((t) => t.id === action.toolId);
      // The card id links the entry. The goal is its own card, so no situation text is invented for it.
      const card: ExperimentCard = {
        id: cardIdFor(state.id, action.toolId), situation: goalStatement(state), action: tool?.title ?? goalStatement(state), authoredBy: 'user',
      };
      return ok(bump(state, { outcomes: [...state.outcomes, recordOutcome(card, action.outcome, action.note)] }, now));
    }
    default:
      return refuse('canonical-measurement-not-allowed', state);
  }
}

export type OutcomeView =
  | { toolId: string | null; status: 'unknown' }
  | { toolId: string | null; status: 'not-recorded-by-choice' }
  | { toolId: string | null; status: 'reported'; outcome: Exclude<Outcome, 'do-not-record'>; note: string | null };

/** One view per card: the goal itself, then each linked tool. A card with no entry is unknown, never a failure. */
export function outcomeViews(state: GoalState): OutcomeView[] {
  const latest = new Map(state.outcomes.map((e) => [e.cardId, e] as const));
  return [null, ...state.tools.map((t) => t.id)].map((toolId): OutcomeView => {
    const entry = latest.get(cardIdFor(state.id, toolId));
    if (!entry) return { toolId, status: 'unknown' };
    return entry.recorded
      ? { toolId, status: 'reported', outcome: entry.outcome, note: entry.note }
      : { toolId, status: 'not-recorded-by-choice' };
  });
}

/** Counts of the latest entry per card. Never a score: scoreDelta is 0 and causalClaim is false by construction. */
export function outcomeSummary(state: GoalState) {
  return summarizeExperiments([...new Map(state.outcomes.map((e) => [e.cardId, e] as const)).values()]);
}

/** Reminders are gentle only while the goal is active. Paused, graduated and absent goals get none. */
export const reminderPolicy = (state: GoalState | null): 'gentle' | 'none' => (state?.status === 'active' ? 'gentle' : 'none');

export const EXPORT_LABELS: Record<'statement' | 'endpoints' | 'tools' | 'hypotheses' | 'outcomes' | 'measurement', Provenance> = {
  statement: 'user-authored', endpoints: 'user-authored', tools: 'user-authored',
  hypotheses: 'hypothesis', outcomes: 'observation', measurement: 'canonical-measurement',
};

export interface GoalExport {
  schema: 'goal-export.v1';
  exportedAt: string;
  status: GoalStatus;
  statement: string;
  earlier: string[];
  endpoints: string[];
  tools: LinkedTool[];
  hypotheses: string[];
  outcomes: OutcomeView[];
  summary: ReturnType<typeof outcomeSummary>;
  labels: typeof EXPORT_LABELS;
  measurementIncluded: false;
}

/** User-initiated export only. Missing outcomes stay unknown, and no canonical measurement is included. */
export function exportGoal(state: GoalState | null, requested: boolean, now: string):
  { ok: true; artifact: GoalExport } | { ok: false; reason: 'not-requested' | 'no-goal' } {
  if (!requested) return { ok: false, reason: 'not-requested' };
  if (!state) return { ok: false, reason: 'no-goal' };
  return {
    ok: true,
    artifact: {
      schema: 'goal-export.v1', exportedAt: now, status: state.status, statement: goalStatement(state),
      earlier: [...state.statementHistory], endpoints: [...state.season.endpoints], tools: [...state.tools],
      hypotheses: [...state.hypotheses], outcomes: outcomeViews(state), summary: outcomeSummary(state),
      labels: EXPORT_LABELS, measurementIncluded: false,
    },
  };
}

export type GoalRead =
  | { status: 'none' }
  | { status: 'goal'; state: GoalState }
  | { status: 'rejected'; reason: 'corrupt' | 'unsupported' };

const strs = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Validates a stored record. A malformed record is rejected, never silently replaced by an empty goal. */
export function readGoalRecord(raw: unknown): GoalRead {
  if (raw === null || raw === undefined) return { status: 'none' };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { status: 'rejected', reason: 'corrupt' };
  const r = raw as Record<string, any>;
  if (r.schema !== 'goal.v1') return { status: 'rejected', reason: 'unsupported' };
  const season = r.season ?? {};
  const valid = typeof r.id === 'string' && ['active', 'paused', 'graduated'].includes(r.status)
    && typeof r.updatedAt === 'string' && Number.isInteger(r.revision) && r.revision >= 1
    && strs(season.goals) && strs(season.endpoints) && strs(r.statementHistory) && strs(r.hypotheses) && strs(r.rejected)
    && Array.isArray(r.tools) && r.tools.every((t: any) => typeof t?.id === 'string' && typeof t?.title === 'string')
    && Array.isArray(r.outcomes) && r.outcomes.every((o: any) => typeof o?.cardId === 'string' && typeof o?.recorded === 'boolean');
  return valid ? { status: 'goal', state: r as GoalState } : { status: 'rejected', reason: 'corrupt' };
}
