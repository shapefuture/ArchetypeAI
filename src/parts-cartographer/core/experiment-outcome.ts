// If-then experiment cards and their outcomes (ArchetypeAI-28h.3.2). Pure: no storage, no scoring service.
// Every outcome has equal standing. The person owns the action and the prediction. One result never
// asserts causality and never changes a score.

export const OUTCOMES = ['tried', 'adapted', 'did-not-try', 'do-not-record'] as const;
export type Outcome = (typeof OUTCOMES)[number];

export interface ExperimentCard {
  id: string;
  /** If this situation happens... */
  situation: string;
  /** ...then I will... (owned by the person). */
  action: string;
  /** I predict... (optional, owned by the person). */
  prediction?: string;
  /** Only the person may author a card. Model-authored cards are refused. */
  authoredBy: 'user' | 'model';
}

export type OutcomeEntry =
  | { recorded: true; cardId: string; outcome: Exclude<Outcome, 'do-not-record'>; note: string | null; scoreDelta: 0; causalClaim: false }
  | { recorded: false; cardId: string; outcome: 'do-not-record'; note: null; scoreDelta: 0; causalClaim: false };

export function createCard(input: Omit<ExperimentCard, 'authoredBy'> & { authoredBy?: string }): ExperimentCard | null {
  if (input.authoredBy !== undefined && input.authoredBy !== 'user') return null;
  if (!input.situation.trim() || !input.action.trim()) return null;
  return { id: input.id, situation: input.situation.trim(), action: input.action.trim(), prediction: input.prediction?.trim() || undefined, authoredBy: 'user' };
}

/** Records one outcome. Every outcome is stored the same way; only "do not record" stores no words at all. */
export function recordOutcome(card: ExperimentCard, outcome: Outcome, note?: string): OutcomeEntry {
  if (outcome === 'do-not-record') {
    return { recorded: false, cardId: card.id, outcome, note: null, scoreDelta: 0, causalClaim: false };
  }
  const trimmed = note?.trim();
  return { recorded: true, cardId: card.id, outcome, note: trimmed ? trimmed : null, scoreDelta: 0, causalClaim: false };
}

export interface ExperimentSummary {
  recordedCount: number;
  /** Counts of each recorded outcome. Absent outcomes are zero, never a penalty. */
  counts: Record<Exclude<Outcome, 'do-not-record'>, number>;
  scoreDelta: 0;
  /** Always false: a summary of experiments never claims that the action caused anything. */
  causalClaim: false;
}

export function summarizeExperiments(entries: ReadonlyArray<OutcomeEntry>): ExperimentSummary {
  const counts = { tried: 0, adapted: 0, 'did-not-try': 0 };
  let recordedCount = 0;
  for (const entry of entries) {
    if (!entry.recorded) continue;
    recordedCount += 1;
    counts[entry.outcome] += 1;
  }
  return { recordedCount, counts, scoreDelta: 0, causalClaim: false };
}
