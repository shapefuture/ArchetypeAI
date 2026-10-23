import { describe, expect, it } from 'vitest';
import {
  RUBRIC, evaluate, runScenarios,
  type DimensionId, type Evaluation, type EvaluationInput, type EvidenceLoad, type EvidenceRef, type ScenarioSpec,
} from './e20-evaluation';

const G1 = 'gen-candidate-1';
const G0 = 'gen-earlier-0';
const SHA = 'a'.repeat(64);
const SCENARIOS: ScenarioSpec[] = [
  ...RUBRIC.flatMap((rule) => rule.requires.map((m) => ({ id: `${rule.id}:${m}`, dimension: rule.id, method: m, steps: ['observe'] }))),
  { id: 'accessibility:automated', dimension: 'accessibility', method: 'automated', steps: ['automated scan'] },
];
const requiredScenarios = SCENARIOS.filter((s) => s.id !== 'accessibility:automated');

function ref(scenarioId: string, over: Partial<EvidenceRef> = {}): EvidenceRef {
  const s = SCENARIOS.find((x) => x.id === scenarioId)!;
  const recordedBy = over.recordedBy ?? 'independent';
  return { id: `${scenarioId}#${recordedBy}`, scenarioId, dimension: s.dimension, method: s.method, generation: G1, sha256: SHA, result: 'pass', recordedBy, ...over };
}
const allRequired = (over: Partial<EvidenceRef> = {}) => requiredScenarios.map((s) => ref(s.id, over));
const complete = (items: EvidenceRef[]): EvidenceLoad => ({ complete: true, items });
const base = (evidence: EvidenceLoad | null, extra: Partial<EvaluationInput> = {}): EvaluationInput => ({
  generation: G1, scenarios: SCENARIOS, evidence, claims: [], reviews: [], ...extra,
});
const verdictOf = (e: Evaluation, id: DimensionId) => e.dimensions.find((d) => d.dimension === id)!;
const independentAccept = (generation = G1) => ({ reviewer: 'independent-reviewer', role: 'independent' as const, generation, decision: 'accept' as const });

describe('E20 rubric and verdicts (step 04)', () => {
  it('defines the eleven plan dimensions in order, with four hard gates', () => {
    expect(RUBRIC.map((r) => r.id)).toEqual([
      'core-usefulness', 'credibility', 'intuitiveness', 'distinct-personality', 'delight', 'sensory-agency',
      'accessibility', 'reliability', 'performance', 'agency-trust', 'learning-transfer',
    ]);
    expect(RUBRIC.filter((r) => r.hard).map((r) => r.id)).toEqual(['core-usefulness', 'accessibility', 'reliability', 'agency-trust']);
    expect(RUBRIC.find((r) => r.id === 'learning-transfer')!.requires).toEqual(['user-report']);
  });

  it('treats a candidate-recorded pass as a claim until independent evidence verifies it', () => {
    const claimed = evaluate(base(complete(allRequired({ recordedBy: 'candidate' }))));
    expect(verdictOf(claimed, 'accessibility').verdict).toBe('claimed-pass');
    expect(claimed.overall).toBe('incomplete');
    const verified = evaluate(base(complete(allRequired())));
    expect(verdictOf(verified, 'accessibility').verdict).toBe('verified-pass');
    expect(verified.overall).toBe('awaiting-independent-acceptance');
  });

  it('recovers stale scores: earlier-generation evidence and claims are rejected, leaving every dimension pending', () => {
    const e = evaluate(base(complete(allRequired({ generation: G0 })), {
      claims: [{ dimension: 'delight', generation: G0, score: 10, authoredBy: 'independent' }],
    }));
    expect(e.dimensions.every((d) => d.verdict === 'pending')).toBe(true);
    expect(e.rejected.map((r) => r.kind)).toEqual(expect.arrayContaining(['transferred-evidence', 'transferred-score']));
    expect(e.overall).toBe('incomplete');
  });

  it('recovers candidate-owned claims: candidate scores and acceptance never change the verdict', () => {
    const items = complete(allRequired());
    const plain = evaluate(base(items));
    const owned = evaluate(base(items, {
      claims: [{ dimension: 'core-usefulness', generation: G1, score: 10, authoredBy: 'candidate' }],
      reviews: [{ reviewer: 'candidate-author', role: 'candidate', generation: G1, decision: 'accept' }],
    }));
    expect(owned.overall).toBe('awaiting-independent-acceptance');
    expect(owned.dimensions).toEqual(plain.dimensions);
    expect(owned.rejected).toContainEqual({ kind: 'candidate-authored-acceptance', ref: 'candidate-author' });
  });

  it('reports absent manual assistive-technology evidence as pending even when automated checks pass', () => {
    const items = [...requiredScenarios.filter((s) => s.id !== 'accessibility:manual-at').map((s) => ref(s.id)), ref('accessibility:automated')];
    const e = evaluate(base(complete(items)));
    expect(verdictOf(e, 'accessibility')).toMatchObject({ verdict: 'pending', reasons: ['missing:manual-at'] });
    expect(e.overall).toBe('incomplete');
  });

  it('mock evidence never satisfies live-service, manual-AT or participant requirements', () => {
    const mocked = new Set(['core-usefulness:live-service', 'accessibility:manual-at', 'delight:participant']);
    const items = allRequired().map((r) => (mocked.has(r.scenarioId) ? { ...r, method: 'mock' as const, id: `${r.id}-mock` } : r));
    const e = evaluate(base(complete(items)));
    expect(verdictOf(e, 'core-usefulness')).toMatchObject({ verdict: 'pending', reasons: ['missing:live-service'] });
    expect(verdictOf(e, 'accessibility').verdict).toBe('pending');
    expect(verdictOf(e, 'delight').verdict).toBe('pending');
    expect(e.rejected.filter((r) => r.kind === 'mock-as-evidence')).toHaveLength(3);
  });

  it('does not let ten passing dimensions hide a hard accessibility failure', () => {
    const items = allRequired().map((r) => (r.scenarioId === 'accessibility:manual-at' ? { ...r, result: 'fail' as const } : r));
    const e = evaluate(base(complete(items), { reviews: [independentAccept()] }));
    expect(e.overall).toBe('blocked');
    expect(e.hardFailures).toEqual(['accessibility']);
    expect(e.dimensions.filter((d) => d.dimension !== 'accessibility' && d.verdict === 'verified-pass')).toHaveLength(10);
  });

  it('accepts only an independent accept review for the exact generation, with every hard gate verified', () => {
    const full = complete(allRequired());
    expect(evaluate(base(full, { reviews: [independentAccept()] })).overall).toBe('accepted');
    const old = evaluate(base(full, { reviews: [independentAccept(G0)] }));
    expect(old.overall).toBe('awaiting-independent-acceptance');
    expect(old.rejected).toContainEqual({ kind: 'transferred-acceptance', ref: 'independent-reviewer' });
    expect(evaluate(base(complete([]), { reviews: [independentAccept()] })).overall).toBe('incomplete');
  });

  it('rejects evidence references that are not sha256 digests or name an undeclared scenario', () => {
    const items = allRequired().map((r) => (r.scenarioId === 'core-usefulness:live-service' ? { ...r, sha256: 'not-a-digest' } : r));
    const undeclared = { ...ref('reliability:automated'), id: 'undeclared-ref', scenarioId: 'undeclared' };
    const e = evaluate(base(complete([...items, undeclared])));
    expect(e.rejected.filter((r) => r.kind === 'unverifiable-reference').map((r) => r.ref).sort())
      .toEqual(['core-usefulness:live-service#independent', 'undeclared-ref']);
    expect(verdictOf(e, 'core-usefulness').reasons).toContain('missing:live-service');
  });

  it('runs scenarios reproducibly: reordered scenarios and evidence give identical results', () => {
    const forward = runScenarios(SCENARIOS, complete(allRequired()), G1);
    const reversed = runScenarios([...SCENARIOS].reverse(), complete([...allRequired()].reverse()), G1);
    expect(reversed).toEqual(forward);
    expect(forward.find((r) => r.key === `core-usefulness:live-service@${G1}`)?.status).toBe('run-pass');
  });
});

describe('E20 recovery (step 07)', () => {
  it('recovers missing evidence: an unreadable store leaves every dimension pending and the overall incomplete', () => {
    const e = evaluate(base(null));
    expect(e.dimensions.every((d) => d.verdict === 'pending' && d.reasons.includes('evidence-unreadable'))).toBe(true);
    expect(e.overall).toBe('incomplete');
    expect(e.scenarios.every((s) => s.status === 'not-run')).toBe(true);
  });

  it('recovers an interrupted load: a partial evidence set is never accepted, even with an independent accept', () => {
    const e = evaluate(base({ complete: false, items: allRequired() }, { reviews: [independentAccept()] }));
    expect(e.overall).toBe('incomplete');
    expect(e.dimensions.every((d) => d.reasons.includes('load-interrupted'))).toBe(true);
  });

  it('recovers conflicting duplicate evidence: conflicting ids are dropped, and identical duplicates collapse', () => {
    const others = requiredScenarios.filter((s) => s.id !== 'accessibility:manual-at').map((s) => ref(s.id));
    const at = ref('accessibility:manual-at');
    const items = [...others, ref('delight:participant'), at, { ...at, result: 'fail' as const }];
    const e = evaluate(base(complete(items)));
    expect(verdictOf(e, 'accessibility')).toMatchObject({ verdict: 'pending', reasons: ['missing:manual-at'] });
    expect(e.rejected.filter((r) => r.kind === 'conflicting-duplicate')).toEqual([{ kind: 'conflicting-duplicate', ref: 'accessibility:manual-at#independent' }]);
    expect(verdictOf(e, 'delight').verdict).toBe('verified-pass');
  });

  it('authority: an independent reject blocks acceptance, and a candidate reject changes nothing', () => {
    const full = complete(allRequired());
    expect(evaluate(base(full, { reviews: [{ reviewer: 'independent-reviewer', role: 'independent', generation: G1, decision: 'reject' }] })).overall).toBe('blocked');
    expect(evaluate(base(full, { reviews: [{ reviewer: 'candidate-author', role: 'candidate', generation: G1, decision: 'reject' }] })).overall)
      .toBe('awaiting-independent-acceptance');
  });

  it('evaluation bias: input order never changes the verdict or the rejection list', () => {
    const items: EvidenceRef[] = [
      ...allRequired(),
      { ...ref('delight:participant'), id: 'old-delight', generation: G0 },
      { ...ref('accessibility:manual-at'), id: 'mock-at', method: 'mock' },
    ];
    const claims = [
      { dimension: 'delight' as const, generation: G0, score: 9, authoredBy: 'candidate' as const },
      { dimension: 'core-usefulness' as const, generation: G1, score: 10, authoredBy: 'candidate' as const },
    ];
    const reviews = [{ reviewer: 'candidate-author', role: 'candidate' as const, generation: G1, decision: 'accept' as const }, independentAccept()];
    const forward = evaluate(base(complete(items), { claims, reviews }));
    const reversed = evaluate({
      ...base(complete([...items].reverse())), scenarios: [...SCENARIOS].reverse(), claims: [...claims].reverse(), reviews: [...reviews].reverse(),
    });
    expect(reversed).toEqual(forward);
    expect(forward.overall).toBe('accepted');
    expect(forward.rejected.map((r) => r.kind)).toEqual(expect.arrayContaining(['transferred-evidence', 'mock-as-evidence', 'candidate-authored-acceptance', 'transferred-score']));
  });
});
