import { describe, expect, it } from 'vitest';
import { editField, loopFinder, type SharedDoc } from './joint-support.ts';

const doc: SharedDoc = { fields: { plan: { value: 'Talk after dinner', author: 'a' } }, history: [] };

describe('jointly editable support', () => {
  it('lets the other person change a field only with the author\'s consent', () => {
    expect(editField(doc, 'b', 'plan', 'Talk before work', false)).toEqual({ doc, applied: false });
    const consented = editField(doc, 'b', 'plan', 'Talk before work', true);
    expect(consented.applied).toBe(true);
    expect(consented.doc.fields.plan.value).toBe('Talk before work');
  });

  it('records every change with who made it', () => {
    const { doc: next } = editField(doc, 'a', 'plan', 'Talk at lunch', false);
    expect(next.history).toEqual([{ field: 'plan', by: 'a', from: 'Talk after dinner', to: 'Talk at lunch' }]);
  });

  it('names recurring patterns with no compatibility verdict', () => {
    const patterns = loopFinder(['late reply', 'late reply', 'new idea']);
    expect(patterns).toEqual([{ description: 'late reply', occurrences: 2 }]);
    expect(Object.keys(patterns[0]).some((k) => /compat|score|verdict/i.test(k))).toBe(false);
  });
});
