import { describe, expect, it } from 'vitest';
import { ownershipSummary, soloView, withdraw, type SharedSupport } from './consent-withdrawal.ts';

const support: SharedSupport = { shared: true, ownerA: 'Ana', ownerB: 'Ben' };

describe('consent withdrawal', () => {
  it('ends shared access at once and states each party\'s ownership', () => {
    const after = withdraw(support);
    expect(after.shared).toBe(false);
    expect(ownershipSummary(after).a).toContain('shared support is off');
    expect(ownershipSummary(after).b).toContain('Ben owns their own entries');
  });

  it('keeps the solo progress unchanged after withdrawal', () => {
    const progress = { items: ['letter'], progress: 4 };
    expect(soloView(progress)).toBe(progress);
  });
});
