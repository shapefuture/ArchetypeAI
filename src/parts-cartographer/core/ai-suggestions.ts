// Bounded AI suggestions and the content evidence register (ArchetypeAI-28h.7.3). Pure.
// A schema match never certifies quality. Only practice copy and prompts may be suggested. A suggestion can be
// accepted only for review, and only with evidence the app's review owns. No unrestricted protocol generation.

export type SuggestionType = 'practice-copy' | 'prompt' | 'protocol';
export interface Suggestion { id: string; type: SuggestionType; text: string; schemaValid: boolean; evidence: { id: string; reviewedBy: 'app-review' | 'borrowed' } | null; }
export type SuggestionDecision = 'refused' | 'needs-review' | 'accepted-for-review';

const ALLOWED: ReadonlyArray<SuggestionType> = ['practice-copy', 'prompt'];

export function decideSuggestion(s: Suggestion): SuggestionDecision {
  if (!ALLOWED.includes(s.type)) return 'refused';
  if (!s.schemaValid) return 'refused';
  if (!s.evidence || s.evidence.reviewedBy !== 'app-review') return 'needs-review';
  return 'accepted-for-review';
}
