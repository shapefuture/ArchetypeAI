// Expansion gate for Replay against guided text (ArchetypeAI-28h.4.4). Pure.
// Playtime alone never justifies expansion. Expansion needs reported benefit, recorded demand, and a recorded
// complexity trade-off. Without them the decision is "pending", not "expand".

export interface ReplayEvidence {
  playtimeMinutes: number;
  userBenefitReports: number;
  demandRecords: number;
  complexityNotes: ReadonlyArray<string>;
}

export type ExpansionDecision = 'expand' | 'no-expansion' | 'pending';

export function decideExpansion(evidence: ReplayEvidence): ExpansionDecision {
  const hasBenefit = evidence.userBenefitReports > 0;
  const hasDemand = evidence.demandRecords > 0;
  const hasTradeoff = evidence.complexityNotes.some((n) => n.trim().length > 0);
  if (hasBenefit && hasDemand && hasTradeoff) return 'expand';
  if (evidence.userBenefitReports === 0 && evidence.demandRecords === 0) return 'pending';
  return 'no-expansion';
}
