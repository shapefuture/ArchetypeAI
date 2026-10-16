// Authored asset and rig budget (ArchetypeAI-28h.7.2). Pure.
// Every asset needs static equivalent content, so the scene stays useful without the heavy version. All assets
// share one grammar, and the total scene cost stays within its budget.

export interface Asset { id: string; grammarId: string; costUnits: number; staticEquivalent: string | null; }
export type BudgetProblem = 'over-budget' | 'no-static-equivalent' | 'mixed-grammar' | 'invalid-cost';

export function validateSceneAssets(assets: ReadonlyArray<Asset>, budgetUnits: number): { ok: true; totalUnits: number } | { ok: false; reason: BudgetProblem; assetId?: string } {
  const grammars = new Set(assets.map((a) => a.grammarId));
  if (grammars.size > 1) return { ok: false, reason: 'mixed-grammar' };
  for (const asset of assets) {
    if (!Number.isFinite(asset.costUnits) || asset.costUnits < 0) return { ok: false, reason: 'invalid-cost', assetId: asset.id };
    if (!asset.staticEquivalent || !asset.staticEquivalent.trim()) return { ok: false, reason: 'no-static-equivalent', assetId: asset.id };
  }
  const totalUnits = assets.reduce((sum, a) => sum + a.costUnits, 0);
  if (totalUnits > budgetUnits) return { ok: false, reason: 'over-budget' };
  return { ok: true, totalUnits };
}
