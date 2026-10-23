import { describe, expect, it } from 'vitest';
import { validateSceneAssets, type Asset } from './asset-budget.ts';

const rig: Asset = { id: 'r1', grammarId: 'g1', costUnits: 4, staticEquivalent: 'A drawn figure' };

describe('authored asset budget', () => {
  it('accepts assets within budget that share one grammar and have static equivalents', () => {
    expect(validateSceneAssets([rig, { ...rig, id: 'r2', costUnits: 3 }], 10)).toEqual({ ok: true, totalUnits: 7 });
  });

  it('refuses a scene over its budget', () => {
    expect(validateSceneAssets([rig, { ...rig, id: 'r2' }], 6)).toEqual({ ok: false, reason: 'over-budget' });
  });

  it('refuses an asset without a static equivalent', () => {
    expect(validateSceneAssets([{ ...rig, staticEquivalent: null }], 10)).toEqual({ ok: false, reason: 'no-static-equivalent', assetId: 'r1' });
  });

  it('refuses assets from more than one grammar', () => {
    expect(validateSceneAssets([rig, { ...rig, id: 'r2', grammarId: 'g2' }], 10)).toEqual({ ok: false, reason: 'mixed-grammar' });
  });
});
