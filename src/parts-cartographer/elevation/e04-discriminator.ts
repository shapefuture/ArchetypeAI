// Contextual discriminating questions and correction-first transitions (ArchetypeAI-1ei, E04.04; recovery
// ArchetypeAI-rg1, E04.07). Pure. Builds on core/situation-inquiry, which owns the bounds, hypotheses,
// rejection and corrections. This module chooses the next question and applies the five response types.
// Readings are app hypotheses. Observations, corrections, exceptions and optional words are the person's own.
// A response changes only the inquiry draft, plus the rejected-reading list for "neither". The write kinds
// exclude canonical scores and history archives, so no score, instrument or history write can come from here.
// NOT done here: question authoring and review (content step), UI and wiring (steps 05-06), linking the
// formulation to a chosen action or saved comparison (E04.06), and comprehension or usefulness evidence
// (steps 10-12). Optional words are English only; Russian equivalents need review before use.
import {
  addHypothesis, allowedFormulation, answer, correct, formulation, MAX_QUESTIONS, rejectHypothesis, startInquiry, type Inquiry,
} from '../core/situation-inquiry';

export interface DiscriminatingQuestion {
  id: string;
  text: string;
  /** Hypothesis ids this question separates. It is asked only while both are still live. */
  separates: readonly [string, string];
  /** Question ids that must already be answered before this one is offered. */
  after: readonly string[];
}

/** The five response types to a discriminating question. */
export type ChoiceAnswer = 'first' | 'second' | 'both' | 'depends' | 'neither';
/** Optional words that pick no reading. They still count toward the inquiry bound. */
export type WordAnswer = 'not-sure' | 'skip';
export type RecordedAnswer = ChoiceAnswer | WordAnswer | 'authored';
export interface ResponseRecord { questionId: string; answer: RecordedAnswer; }
export type WriteKind = 'inquiry-draft' | 'rejected-reading';
export type Refusal =
  | 'empty' | 'already-answered' | 'bound-reached' | 'not-live'
  | 'limit' | 'overclaim' | 'rejected-again' | 'unsafe-scope';

type Snapshot = Omit<DiscriminatorState, 'history'>;
export interface DiscriminatorState {
  inquiry: Inquiry;
  responses: ResponseRecord[];
  /** The reading the person picked as the working lead, or null. */
  chosen: string | null;
  /** User-authored exceptions, verbatim. */
  exceptions: string[];
  /** Earlier states, for one-step undo. Not restored after an interruption. */
  history: Snapshot[];
}

export type Outcome = { ok: true; state: DiscriminatorState; writes: WriteKind[] } | { ok: false; reason: Refusal };

export type Selection =
  | { status: 'asked'; question: DiscriminatingQuestion }
  | { status: 'bound-reached' }
  | { status: 'support'; reason: 'safety-terms' }
  | { status: 'sparse'; reason: 'no-readings' | 'one-reading' }
  | { status: 'missing-context'; waitingOn: string[] }
  | { status: 'none-applicable' };

export type FormulationBasis = 'observation-only' | 'readings-open' | 'both-open' | 'depends' | 'reading-chosen' | 'none-fit' | 'authored';
export interface Formulation {
  basis: FormulationBasis;
  /** The sentence shown first. */
  lead: string;
  /** Who wrote the lead: the person's observation, the person's own wording, or an app hypothesis. */
  leadSource: 'user-observation' | 'user-authored' | 'app-hypothesis';
  /** Live app readings, shown as hypotheses. */
  readings: string[];
  exceptions: string[];
  unknowns: string[];
  /** Lead plus exception notes. Each exception changes this text. */
  text: string;
  sparse: boolean;
  note: string | null;
}

/** Self-harm or suicide wording stops questioning and routes to assessment-free support. A keyword gate that needs safety review. */
const SAFETY_TERMS = /suicid|kill myself|end my life|self-harm|hurt myself/i;
/** Scope the inquiry must not enter: origin stories, diagnosis, prognosis, personality typing. */
const SCOPE_TERMS = /childhood|diagnos|trauma|prognos|personality type/i;
const WORDS: Record<string, ChoiceAnswer | WordAnswer> = { both: 'both', depends: 'depends', neither: 'neither', 'not sure': 'not-sure', skip: 'skip' };
const RECORDED = new Set<string>(['first', 'second', 'both', 'depends', 'neither', 'not-sure', 'skip', 'authored']);
const INQUIRY_LISTS = ['answers', 'hypotheses', 'unknowns', 'rejected', 'corrections'];

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const isLive = (state: DiscriminatorState, id: string) => state.inquiry.hypotheses.some((h) => h.id === id);

/** Exact optional words only, after trimming and lower-casing. "Depends." is the person's own wording. */
export function parseOptionalWord(text: string): ChoiceAnswer | WordAnswer | null {
  const key = text.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(WORDS, key) ? WORDS[key] : null;
}

export function startDiscriminator(observation: string): DiscriminatorState | null {
  const inquiry = startInquiry(observation);
  return inquiry ? { inquiry, responses: [], chosen: null, exceptions: [], history: [] } : null;
}

/** Records a reading through the core hypothesis rules and refuses scope-breaking wording. */
export function addReading(state: DiscriminatorState, id: string, text: string, linkedAnswerId: string | null): Outcome {
  if (SCOPE_TERMS.test(text)) return { ok: false, reason: 'unsafe-scope' };
  const result = addHypothesis(state.inquiry, id, text, linkedAnswerId);
  if (result.ok === false) return { ok: false, reason: result.reason };
  return commit(state, { inquiry: result.inquiry }, ['inquiry-draft']);
}

/** Contextual choice of the next question: it must separate two live readings, be unasked, and have its prerequisites answered. */
export function selectQuestion(state: DiscriminatorState, bank: readonly DiscriminatingQuestion[]): Selection {
  const userText = [state.inquiry.observation, ...state.inquiry.answers.map((a) => a.text), ...state.inquiry.corrections, ...state.exceptions].join('\n');
  if (SAFETY_TERMS.test(userText)) return { status: 'support', reason: 'safety-terms' };
  if (state.inquiry.questionsAsked >= MAX_QUESTIONS) return { status: 'bound-reached' };
  const live = state.inquiry.hypotheses.map((h) => h.id);
  if (live.length < 2) return { status: 'sparse', reason: live.length === 0 ? 'no-readings' : 'one-reading' };
  const answered = new Set(state.responses.map((r) => r.questionId));
  const candidates = bank.filter((q) => !answered.has(q.id) && q.separates.every((id) => live.includes(id)));
  if (candidates.length === 0) return { status: 'none-applicable' };
  const ready = candidates.find((q) => q.after.every((id) => answered.has(id)));
  if (ready) return { status: 'asked', question: ready };
  return { status: 'missing-context', waitingOn: [...new Set(candidates.flatMap((q) => q.after.filter((id) => !answered.has(id))))] };
}

function refuse(state: DiscriminatorState, question: DiscriminatingQuestion): Refusal | null {
  if (state.responses.some((r) => r.questionId === question.id)) return 'already-answered';
  if (state.inquiry.questionsAsked >= MAX_QUESTIONS) return 'bound-reached';
  return question.separates.every((id) => isLive(state, id)) ? null : 'not-live';
}

/** One of the five response types. Only "neither" writes a rejected reading. */
export function respond(state: DiscriminatorState, question: DiscriminatingQuestion, choice: ChoiceAnswer | WordAnswer): Outcome {
  const refusal = refuse(state, question);
  if (refusal) return { ok: false, reason: refusal };
  const [first, second] = question.separates;
  const inquiry = answer(state.inquiry, question.id, choice);
  const responses = [...state.responses, { questionId: question.id, answer: choice }];
  switch (choice) {
    case 'first': return commit(state, { inquiry, responses, chosen: first }, ['inquiry-draft']);
    case 'second': return commit(state, { inquiry, responses, chosen: second }, ['inquiry-draft']);
    case 'both': return commit(state, { inquiry, responses, chosen: null }, ['inquiry-draft']);
    case 'depends':
      return commit(state, { inquiry: { ...inquiry, unknowns: [...inquiry.unknowns, question.text] }, responses, chosen: null }, ['inquiry-draft']);
    case 'neither':
      return commit(state, { inquiry: rejectHypothesis(rejectHypothesis(inquiry, first), second), responses, chosen: null },
        ['inquiry-draft', 'rejected-reading']);
    default: return commit(state, { inquiry, responses }, ['inquiry-draft']);
  }
}

/** Exact optional words map to their response. Any other text is the person's own wording and becomes the correction at once. */
export function respondWithText(state: DiscriminatorState, question: DiscriminatingQuestion, text: string): Outcome {
  const word = parseOptionalWord(text);
  if (word) return respond(state, question, word);
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  const refusal = refuse(state, question);
  if (refusal) return { ok: false, reason: refusal };
  const inquiry = correct(answer(state.inquiry, question.id, trimmed), trimmed);
  return commit(state, { inquiry, responses: [...state.responses, { questionId: question.id, answer: 'authored' }] }, ['inquiry-draft']);
}

/** The person's own alternative wording. It becomes the visible formulation at once and answers no question. */
export function correctWording(state: DiscriminatorState, text: string): Outcome {
  const trimmed = text.trim();
  return trimmed ? commit(state, { inquiry: correct(state.inquiry, trimmed) }, ['inquiry-draft']) : { ok: false, reason: 'empty' };
}

/** A user-authored exception. It changes the visible formulation and leaves the readings alone. */
export function addException(state: DiscriminatorState, text: string): Outcome {
  const trimmed = text.trim();
  return trimmed ? commit(state, { exceptions: [...state.exceptions, trimmed] }, ['inquiry-draft']) : { ok: false, reason: 'empty' };
}

function commit(state: DiscriminatorState, patch: Partial<Snapshot>, writes: WriteKind[]): Outcome {
  const { history, ...current } = state;
  return { ok: true, state: { ...current, ...patch, history: [...history, current] }, writes };
}

/** Restores the state before the last transition. */
export function undo(state: DiscriminatorState): DiscriminatorState {
  const previous = state.history[state.history.length - 1];
  return previous ? { ...previous, history: state.history.slice(0, -1) } : state;
}

function leadOf(state: DiscriminatorState): Pick<Formulation, 'basis' | 'lead' | 'leadSource'> {
  const { inquiry } = state;
  const live = inquiry.hypotheses;
  const chosen = live.find((h) => h.id === state.chosen);
  const last = state.responses[state.responses.length - 1]?.answer;
  if (inquiry.corrections.length > 0) return { basis: 'authored', lead: formulation(inquiry), leadSource: 'user-authored' };
  if (live.length === 0 && inquiry.rejected.length > 0) return { basis: 'none-fit', lead: inquiry.observation, leadSource: 'user-observation' };
  if (chosen) return { basis: 'reading-chosen', lead: chosen.text, leadSource: 'app-hypothesis' };
  const open = live.length >= 2;
  const basis: FormulationBasis = open && last === 'depends' ? 'depends'
    : open && last === 'both' ? 'both-open'
      : live.length > 0 ? 'readings-open' : 'observation-only';
  return { basis, lead: inquiry.observation, leadSource: 'user-observation' };
}

/** The working formulation the person sees, with its provenance. Correction-first: a correction always leads. */
export function visibleFormulation(state: DiscriminatorState): Formulation {
  const { inquiry } = state;
  const view = leadOf(state);
  const sparse = inquiry.answers.length === 0 && inquiry.corrections.length === 0;
  return {
    ...view,
    readings: inquiry.hypotheses.map((h) => h.text),
    exceptions: [...state.exceptions],
    unknowns: [...inquiry.unknowns],
    text: [view.lead, ...state.exceptions.map((e) => `Exception noted: ${e}`)].join(' '),
    sparse,
    note: sparse ? 'One observation so far. It is a starting point, not a pattern.' : null,
  };
}

/** Validates a stored state after an interruption. Malformed input is refused (null), never repaired by guessing. */
export function restoreDiscriminator(raw: unknown): DiscriminatorState | null {
  if (!isRecord(raw) || !isRecord(raw.inquiry)) return null;
  const inquiry = raw.inquiry;
  const inquiryOk = typeof inquiry.observation === 'string' && typeof inquiry.questionsAsked === 'number'
    && INQUIRY_LISTS.every((key) => Array.isArray(inquiry[key]));
  const responsesOk = Array.isArray(raw.responses)
    && raw.responses.every((r) => isRecord(r) && typeof r.questionId === 'string' && RECORDED.has(String(r.answer)));
  const exceptionsOk = Array.isArray(raw.exceptions) && raw.exceptions.every((e) => typeof e === 'string');
  if (!inquiryOk || !responsesOk || !exceptionsOk) return null;
  return {
    inquiry: { ...inquiry } as unknown as Inquiry,
    responses: raw.responses as ResponseRecord[],
    chosen: typeof raw.chosen === 'string' ? raw.chosen : null,
    exceptions: [...(raw.exceptions as string[])],
    history: [],
  };
}

export interface BankRefusal { id: string; reason: 'empty-id' | 'duplicate-id' | 'same-reading' | 'empty-text' | 'unsafe-scope' | 'overclaim'; }

/** Splits an authored bank into usable questions and refusals. Scope-breaking or overclaiming wording is never offered. */
export function validateBank(bank: readonly DiscriminatingQuestion[]): { usable: DiscriminatingQuestion[]; refused: BankRefusal[] } {
  const seen = new Set<string>();
  const usable: DiscriminatingQuestion[] = [];
  const refused: BankRefusal[] = [];
  for (const question of bank) {
    const reason: BankRefusal['reason'] | null = !question.id.trim() ? 'empty-id'
      : seen.has(question.id) ? 'duplicate-id'
        : question.separates[0] === question.separates[1] ? 'same-reading'
          : !question.text.trim() ? 'empty-text'
            : SCOPE_TERMS.test(question.text) ? 'unsafe-scope'
              : !allowedFormulation(question.text) ? 'overclaim' : null;
    seen.add(question.id);
    if (reason) refused.push({ id: question.id, reason });
    else usable.push(question);
  }
  return { usable, refused };
}
