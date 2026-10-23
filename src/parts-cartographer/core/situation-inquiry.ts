// Bounded, correction-first situation inquiry (ArchetypeAI-28h.2.31). Pure.
// The reflection separates observation, hypotheses, unknowns, correction and the chosen next action.
// One episode is never presented as identity, causation, diagnosis or a precise coordinate.

export const MAX_QUESTIONS = 3;
export const MAX_HYPOTHESES = 2;

export interface Hypothesis { id: string; text: string; linkedAnswerId: string | null; }
export interface Inquiry {
  observation: string;
  answers: Array<{ id: string; text: string }>;
  hypotheses: Hypothesis[];
  unknowns: string[];
  rejected: string[];
  corrections: string[];
  nextAction: string | null;
  questionsAsked: number;
}

/** Wording that makes a claim the reflection must not make. Checked on every user-visible formulation. */
const OVERCLAIM = /\b(you are|you're|diagnos\w*|because of|caused by|always|never|your (true )?identity|precise(ly)? (coordinate|score))\b/i;

export function allowedFormulation(text: string): boolean {
  return !OVERCLAIM.test(text);
}

export function startInquiry(observation: string): Inquiry | null {
  const trimmed = observation.trim();
  if (!trimmed) return null;
  return { observation: trimmed, answers: [], hypotheses: [], unknowns: [], rejected: [], corrections: [], nextAction: null, questionsAsked: 0 };
}

/** Returns the next question while the bound allows it. Null means the inquiry has reached its limit. */
export function nextQuestion(inquiry: Inquiry, questions: ReadonlyArray<string>): string | null {
  if (inquiry.questionsAsked >= MAX_QUESTIONS) return null;
  return questions[inquiry.questionsAsked] ?? null;
}

export function answer(inquiry: Inquiry, id: string, text: string): Inquiry {
  return { ...inquiry, answers: [...inquiry.answers, { id, text: text.trim() }], questionsAsked: inquiry.questionsAsked + 1 };
}

/** Adds a bounded hypothesis. It is refused when over the bound, overclaims, or repeats a rejected reading. */
export function addHypothesis(inquiry: Inquiry, id: string, text: string, linkedAnswerId: string | null): { ok: true; inquiry: Inquiry } | { ok: false; reason: 'limit' | 'overclaim' | 'rejected-again' } {
  if (inquiry.hypotheses.length >= MAX_HYPOTHESES) return { ok: false, reason: 'limit' };
  if (!allowedFormulation(text)) return { ok: false, reason: 'overclaim' };
  if (inquiry.rejected.some((r) => r.toLowerCase() === text.trim().toLowerCase())) return { ok: false, reason: 'rejected-again' };
  return { ok: true, inquiry: { ...inquiry, hypotheses: [...inquiry.hypotheses, { id, text: text.trim(), linkedAnswerId }] } };
}

/** A rejected reading leaves the visible hypotheses and is never shown again as a new discovery. */
export function rejectHypothesis(inquiry: Inquiry, id: string): Inquiry {
  const target = inquiry.hypotheses.find((h) => h.id === id);
  if (!target) return inquiry;
  return { ...inquiry, hypotheses: inquiry.hypotheses.filter((h) => h.id !== id), rejected: [...inquiry.rejected, target.text] };
}

/** A user correction is recorded; the newest correction then becomes the visible formulation. */
export function correct(inquiry: Inquiry, text: string): Inquiry {
  const trimmed = text.trim();
  if (!trimmed) return inquiry;
  return { ...inquiry, corrections: [...inquiry.corrections, trimmed] };
}

/** The formulation the person sees: the latest correction if there is one, otherwise the original observation. */
export function formulation(inquiry: Inquiry): string {
  return inquiry.corrections.length > 0 ? inquiry.corrections[inquiry.corrections.length - 1] : inquiry.observation;
}

export function chooseNextAction(inquiry: Inquiry, action: string): { ok: true; inquiry: Inquiry } | { ok: false; reason: 'overclaim' | 'empty' } {
  const trimmed = action.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (!allowedFormulation(trimmed)) return { ok: false, reason: 'overclaim' };
  return { ok: true, inquiry: { ...inquiry, nextAction: trimmed } };
}

/** Leaving has no penalty: no score, no streak and no record of abandonment. */
export function leave(_inquiry: Inquiry): { penalty: 0; scoreDelta: 0 } {
  return { penalty: 0, scoreDelta: 0 };
}
