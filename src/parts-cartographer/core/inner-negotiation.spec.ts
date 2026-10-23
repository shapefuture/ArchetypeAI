import { describe, expect, it } from 'vitest';
import { branch, decline, editMove, negotiate } from './inner-negotiation.ts';

describe('inner negotiation', () => {
  it('never forces consensus: a declining part leaves the outcome partial', () => {
    const parts = [{ id: 'p1', agreed: true }, { id: 'p2', agreed: null }];
    expect(negotiate(parts)).toBe('open');
    expect(negotiate(decline(parts, 'p2'))).toBe('partial');
  });

  it('reports all-agreed only when every part agreed', () => {
    expect(negotiate([{ id: 'p1', agreed: true }, { id: 'p2', agreed: true }])).toBe('all-agreed');
  });

  it('labels every hypothetical branch as hypothetical, and refuses an empty one', () => {
    expect(branch('What if I said no?')).toEqual({ label: 'hypothetical', text: 'What if I said no?' });
    expect(branch('   ')).toBeNull();
  });

  it('keeps a small move editable and refuses an empty edit', () => {
    expect(editMove('Walk for ten minutes', 'Walk for five minutes')).toBe('Walk for five minutes');
    expect(editMove('Walk for ten minutes', '  ')).toBe('Walk for ten minutes');
  });
});
