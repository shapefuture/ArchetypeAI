// Cue, reveal and context-variation progression without help locks (ArchetypeAI-onr, E08.04). Pure.
// A chosen move can be recalled unaided, cued, revealed, or reported as not recalled, with no prerequisite and no
// penalty, until the recall closes. Help is never locked: cue and reveal stay open at every guidance level, and
// lighter guidance is only a suggestion. A variation of the move to a practical constraint is the person's own
// if-then card. A model cannot author one, record a recall, record a revisit or choose guidance.
// Reuses experiment-outcome (cards, outcomes), recall-review (scheduling, no score), practice-season (endpoints)
// and contextual-checkin (interrupt, resume, quiet mode). Recovery cases (ArchetypeAI-8q9, E08.07) are here too.
// Does not read or write instrument scores, Felt identity or the authored arrival.
// NOT DONE HERE: the practice and replay screens (steps 05-06), persistence (callers store the returned values),
// and evidence that a move transfers to other settings, which stays pending until the person reports it (steps 10-12).

import { addEndpoint, type Season } from '../core/practice-season';
import { createCard, recordOutcome, type ExperimentCard, type Outcome, type OutcomeEntry } from '../core/experiment-outcome';
import { activeProbes, nextInterval, scoreFor, type BoundaryProbe, type ReviewItem, type ReviewResult } from '../core/recall-review';
import { interrupt, resume, type CheckInState } from '../core/contextual-checkin';

export type Actor = 'person' | 'model';

// ---- Recall: try, cue, reveal, cannot-recall ----

export const RECALL_EVENTS = ['invite-declined', 'attempt-recalled', 'attempt-cannot', 'cue-requested', 'reveal-requested'] as const;
export type RecallEvent = (typeof RECALL_EVENTS)[number];
export type RecallResult = 'open' | 'declined' | 'recalled' | 'cue-helped' | 'could-not-recall' | 'revealed';
export interface RecallSession { moveId: string; checkIn: CheckInState; events: ReadonlyArray<RecallEvent>; }
export type RecallRefusal = 'model-actor' | 'closed' | 'declined-late';
export type RecallStep = { ok: true; session: RecallSession } | { ok: false; reason: RecallRefusal };

export function startRecall(moveId: string): RecallSession {
  return { moveId, checkIn: { practiceId: moveId, mode: 'full', stepIndex: 0, interrupted: false }, events: [] };
}

/** The result follows from the events. A cue before an unaided recall makes it cue-helped. A reveal closes the recall. */
export function resultOf(events: ReadonlyArray<RecallEvent>): RecallResult {
  let result: RecallResult = 'open';
  let cued = false;
  for (const event of events) {
    if (event === 'cue-requested') cued = true;
    if (event === 'invite-declined') result = 'declined';
    if (event === 'attempt-recalled') result = cued ? 'cue-helped' : 'recalled';
    if (event === 'attempt-cannot') result = 'could-not-recall';
    if (event === 'reveal-requested') result = 'revealed';
  }
  return result;
}

/** Events the person may record now. Cue and reveal are open from the start and after any miss. Only a closed recall locks. */
export function allowedEvents(session: RecallSession): ReadonlyArray<RecallEvent> {
  if (resultOf(session.events) === 'revealed') return [];
  return session.events.length === 0 ? RECALL_EVENTS : RECALL_EVENTS.filter((e) => e !== 'invite-declined');
}

/** Records one recall event. Declining is only the first step. Once revealed, the recall is closed; a new one can start at once. */
export function recordRecall(session: RecallSession, event: RecallEvent, actor: Actor): RecallStep {
  if (actor !== 'person') return { ok: false, reason: 'model-actor' };
  if (resultOf(session.events) === 'revealed') return { ok: false, reason: 'closed' };
  if (event === 'invite-declined' && session.events.length > 0) return { ok: false, reason: 'declined-late' };
  return { ok: true, session: { ...session, events: [...session.events, event] } };
}

/** Pausing keeps the place. Nothing is discarded and nothing is scored. */
export function pauseRecall(session: RecallSession): RecallSession {
  return { ...session, checkIn: interrupt(session.checkIn) };
}

/** Resuming returns to the same events, not to the start. */
export function resumeRecall(session: RecallSession): RecallSession {
  return { ...session, checkIn: resume(session.checkIn) };
}

/** Overload switches to quiet mode, which shows one step. The recorded events and all help stay as they were. */
export function reduceLoad(session: RecallSession): RecallSession {
  return { ...session, checkIn: { ...session.checkIn, mode: 'quiet' } };
}

// ---- Guidance: lighter by suggestion, help never removed ----

export const GUIDANCE_LEVELS = ['full-explanation', 'cue-first', 'recall-first'] as const;
export type GuidanceLevel = (typeof GUIDANCE_LEVELS)[number];
export const HELP_OPTIONS = ['cue', 'immediate-reveal', 'full-explanation'] as const;
export type HelpOption = (typeof HELP_OPTIONS)[number];
export interface Progression { guidance: GuidanceLevel; suggested: GuidanceLevel | null; }
export const START_PROGRESSION: Progression = { guidance: 'full-explanation', suggested: null };

/** The same help is open at every guidance level. The level changes the default view, never the access. */
export function helpOptionsFor(_level: GuidanceLevel): ReadonlyArray<HelpOption> {
  return HELP_OPTIONS;
}

/** After an unaided recall, one step lighter is suggested. Nothing changes until the person chooses. */
export function progressAfter(progression: Progression, last: RecallResult): Progression {
  const index = GUIDANCE_LEVELS.indexOf(progression.guidance);
  const lighter = last === 'recalled' && index < GUIDANCE_LEVELS.length - 1 ? GUIDANCE_LEVELS[index + 1] : null;
  return { ...progression, suggested: lighter };
}

/** The person may choose any level, lighter or fuller. Choosing clears the suggestion. The model cannot choose. */
export function chooseGuidance(level: GuidanceLevel, actor: Actor): { ok: true; progression: Progression } | { ok: false; reason: 'model-actor' } {
  return actor === 'person' ? { ok: true, progression: { guidance: level, suggested: null } } : { ok: false, reason: 'model-actor' };
}

// ---- Context variation: a practical constraint and the person's adapted move ----

export const ADJUSTMENTS = ['timing', 'sensory-load', 'clearer-request', 'practical-help', 'safer-setting'] as const;
export type Adjustment = (typeof ADJUSTMENTS)[number];
export type Helpfulness = 'helped' | 'did-not-help' | 'unsure';
export interface Revisit { entry: OutcomeEntry; helpful: Helpfulness | null; }
export interface Variation {
  id: string;
  moveId: string;
  /** Situation is the constraint the person chose to vary. Action is their adapted move. Both are their words. */
  card: ExperimentCard;
  adjustment: Adjustment | null;
  /** "When would this be unhelpful?" in the person's words, or null. */
  boundary: string | null;
  /** Earlier adapted actions, kept when the person revises the adaptation. */
  history: ReadonlyArray<string>;
  revisits: ReadonlyArray<Revisit>;
  revision: number;
}
export interface VariationInput { id: string; moveId: string; constraint: string; action: string; prediction?: string; adjustment?: Adjustment; boundary?: string; }
export type CreateRefusal = 'model-author' | 'empty-constraint' | 'empty-action';
export type ChangeRefusal = 'model-actor' | 'stale-revision' | 'empty-action';
export type VariationStep = { ok: true; variation: Variation } | { ok: false; reason: ChangeRefusal; variation: Variation };

/** Creates a variation from the person's own constraint and action. Reuses createCard, which refuses model authorship. */
export function createVariation(input: VariationInput, actor: Actor): { ok: true; variation: Variation } | { ok: false; reason: CreateRefusal } {
  if (actor !== 'person') return { ok: false, reason: 'model-author' };
  if (!input.constraint.trim()) return { ok: false, reason: 'empty-constraint' };
  const card = createCard({ id: input.id, situation: input.constraint, action: input.action, prediction: input.prediction });
  if (!card) return { ok: false, reason: 'empty-action' };
  const variation: Variation = {
    id: input.id, moveId: input.moveId, card, adjustment: input.adjustment ?? null,
    boundary: input.boundary?.trim() || null, history: [], revisits: [], revision: 1,
  };
  return { ok: true, variation };
}

const refuse = (variation: Variation, reason: ChangeRefusal): VariationStep => ({ ok: false, reason, variation });

export interface RevisitInput { outcome: Outcome; helpful: Helpfulness | null; note?: string; }

/**
 * Records a revisit. Helpfulness is kept only for tried or adapted, because those are the outcomes that were tried.
 * Do-not-record stores no words. A stale revision is refused, so a second tab cannot overwrite a newer revisit.
 */
export function recordRevisit(variation: Variation, input: RevisitInput, actor: Actor, expectedRevision: number): VariationStep {
  if (actor !== 'person') return refuse(variation, 'model-actor');
  if (expectedRevision !== variation.revision) return refuse(variation, 'stale-revision');
  const asked = input.outcome === 'tried' || input.outcome === 'adapted';
  const revisit: Revisit = { entry: recordOutcome(variation.card, input.outcome, input.note), helpful: asked ? input.helpful : null };
  return { ok: true, variation: { ...variation, revisits: [...variation.revisits, revisit], revision: variation.revision + 1 } };
}

/** Revises the adapted action after an unsuccessful transfer. The earlier wording stays in history. */
export function reviseAdaptation(variation: Variation, action: string, actor: Actor, expectedRevision: number): VariationStep {
  if (actor !== 'person') return refuse(variation, 'model-actor');
  if (expectedRevision !== variation.revision) return refuse(variation, 'stale-revision');
  const next = action.trim();
  if (!next) return refuse(variation, 'empty-action');
  return { ok: true, variation: { ...variation, card: { ...variation.card, action: next }, history: [...variation.history, variation.card.action], revision: variation.revision + 1 } };
}

/** Boundary and transfer probes appear only when the person has switched them on. */
export const PROBES: ReadonlyArray<BoundaryProbe> = [
  { id: 'unhelpful-when', text: 'When would this move be unhelpful?', userSelected: false },
  { id: 'where-else', text: 'Where else might this help?', userSelected: false },
];
export function probesShown(selectedIds: ReadonlyArray<string>): BoundaryProbe[] {
  return activeProbes(PROBES.map((probe) => ({ ...probe, userSelected: selectedIds.includes(probe.id) })));
}

// ---- Repair, scheduling, endpoints, record classes, pending evidence ----

export const REPAIR_OPTIONS = ['orientation', 'resource', 'smaller-action', 'postpone', 'human-support'] as const;
export type RepairOption = (typeof REPAIR_OPTIONS)[number];

/** Repair is offered in full after any result, and human support is always one of the options. */
export function repairOptions(): ReadonlyArray<RepairOption> {
  return REPAIR_OPTIONS;
}

/** Reuses recall-review: a recall grows the interval, a cue and every miss keep it, and nothing is scored. */
export function scheduleFor(result: RecallResult, item: ReviewItem): { intervalDays: number; score: null } {
  const mapped: ReviewResult = result === 'recalled' || result === 'cue-helped' ? result : result === 'declined' || result === 'open' ? 'skipped' : 'could-not-recall';
  return { intervalDays: nextInterval(item, mapped), score: scoreFor(mapped) };
}

/** Adds the adapted move to the person's season endpoints, and only when they ask for it. */
export function endpointFromAdaptation(season: Season, variation: Variation, personAsked: boolean): Season {
  return personAsked ? addEndpoint(season, variation.card.action) : season;
}

export type RecordClass = 'observation' | 'hypothesis' | 'user-authored' | 'none';
/** What each record is. Self-reports are observations, a prediction is the person's hypothesis, wording is theirs. */
export const RECORD_CLASSES: Readonly<Record<'recallResult' | 'helpfulness' | 'prediction' | 'adaptedAction' | 'revisitOutcome' | 'canonicalMeasurement', RecordClass>> = {
  recallResult: 'observation',
  helpfulness: 'observation',
  prediction: 'hypothesis',
  adaptedAction: 'user-authored',
  revisitOutcome: 'observation',
  canonicalMeasurement: 'none',
};

/** Evidence this module does not supply. Each stays pending until the person's own report or a separate study records it. */
export const PENDING_EVIDENCE = ['transfer-reported-in-other-settings', 'participant-evidence', 'independent-review'] as const;
