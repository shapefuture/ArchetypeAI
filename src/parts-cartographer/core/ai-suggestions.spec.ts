import { describe, expect, it } from 'vitest';
import { decideSuggestion, type Suggestion } from './ai-suggestions.ts';

const base: Suggestion = { id: 's1', type: 'prompt', text: 'What would help now?', schemaValid: true, evidence: null };

describe('bounded AI suggestions', () => {
  it('never lets a schema match certify quality', () => {
    expect(decideSuggestion(base)).toBe('needs-review');
  });

  it('refuses unrestricted protocol generation', () => {
    expect(decideSuggestion({ ...base, type: 'protocol', evidence: { id: 'e', reviewedBy: 'app-review' } })).toBe('refused');
  });

  it('refuses a suggestion that fails its schema', () => {
    expect(decideSuggestion({ ...base, schemaValid: false })).toBe('refused');
  });

  it('accepts for review only with app-owned evidence, and never borrowed certainty', () => {
    expect(decideSuggestion({ ...base, evidence: { id: 'e', reviewedBy: 'borrowed' } })).toBe('needs-review');
    expect(decideSuggestion({ ...base, evidence: { id: 'e', reviewedBy: 'app-review' } })).toBe('accepted-for-review');
  });
});
