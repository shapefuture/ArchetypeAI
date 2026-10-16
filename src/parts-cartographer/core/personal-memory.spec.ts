import { describe, expect, it } from 'vitest';
import { addMemory, contextMemories, correctMemory, deleteWithDerived, type Memory } from './personal-memory.ts';

const base: Memory[] = [
  { id: 'm1', text: 'I felt rushed on the call', source: 'user-entry', derivedFrom: [], saved: true },
  { id: 'm2', text: 'Rushing is a pattern for me', source: 'model-inference', derivedFrom: ['m1'], saved: true },
  { id: 'm3', text: 'A pattern from last month', source: 'model-inference', derivedFrom: ['m2'], saved: true },
  { id: 'm4', text: 'Unrelated note', source: 'user-entry', derivedFrom: [], saved: false },
];

describe('personal memory provenance', () => {
  it('refuses a memory with no source', () => {
    expect(addMemory(base, { id: 'x', text: 'no source', source: undefined as never, derivedFrom: [], saved: true })).toBeNull();
  });

  it('keeps the earlier wording when a memory is corrected', () => {
    const { memories, correction } = correctMemory(base, 'm1', 'I felt pressed on the call');
    expect(memories.find((m) => m.id === 'm1')?.text).toBe('I felt pressed on the call');
    expect(correction).toEqual({ memoryId: 'm1', previous: 'I felt rushed on the call', next: 'I felt pressed on the call' });
  });

  it('removes every memory derived from a deleted one', () => {
    const { memories, removed } = deleteWithDerived(base, 'm1');
    expect(removed.sort()).toEqual(['m1', 'm2', 'm3']);
    expect(memories.map((m) => m.id)).toEqual(['m4']);
  });

  it('offers only saved memories as context', () => {
    expect(contextMemories(base).map((m) => m.id)).not.toContain('m4');
  });
});
