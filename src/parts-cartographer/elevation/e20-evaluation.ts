// E20 independent multidimensional evaluation: rubric verdicts, a reproducible scenario runner and immutable evidence
// references (ArchetypeAI-iuyo). Recovery cases for ArchetypeAI-m7r5 (stale scores, candidate-owned claims, missing
// evidence, interrupted loads, conflicting duplicates, authority, evaluation bias) are covered by tests. Pure: no
// storage, no clock, no network, and no averages. Each rubric dimension is judged on its own from exact-generation
// evidence, and a hard dimension is never compensated by the others. A candidate's own pass is a claim; only
// independently recorded evidence verifies it. Acceptance needs an independent accept review for the exact generation,
// and this module never creates one. Mock evidence never satisfies a requirement.
// NOT done here: freezing the evaluator (E20.03), critic worksheet and observation protocol (E20.05), UI (step 05),
// wiring to Beads or storage (step 06), and running any scenario or manual check (steps 10-12).

/** Not an approved version: E20.03 freezes the evaluator. */
export const EVALUATOR_VERSION = 'unfrozen-draft' as const;

export type DimensionId =
  | 'core-usefulness' | 'credibility' | 'intuitiveness' | 'distinct-personality' | 'delight' | 'sensory-agency'
  | 'accessibility' | 'reliability' | 'performance' | 'agency-trust' | 'learning-transfer';
export type EvidenceMethod = 'automated' | 'mock' | 'manual-at' | 'live-service' | 'participant' | 'witnessed' | 'user-report' | 'design-review' | 'device-measurement';
export type RequiredMethod = Exclude<EvidenceMethod, 'mock'>;

export interface DimensionRule { id: DimensionId; hard: boolean; requires: ReadonlyArray<RequiredMethod>; }
/** Plan 16.3 dimensions in plan order. Hard gates are an educated guess from the plan's "do not average away" rule. */
export const RUBRIC: ReadonlyArray<DimensionRule> = [
  { id: 'core-usefulness', hard: true, requires: ['live-service', 'witnessed'] },
  { id: 'credibility', hard: false, requires: ['participant'] },
  { id: 'intuitiveness', hard: false, requires: ['participant'] },
  { id: 'distinct-personality', hard: false, requires: ['design-review'] },
  { id: 'delight', hard: false, requires: ['participant'] },
  { id: 'sensory-agency', hard: false, requires: ['witnessed'] },
  { id: 'accessibility', hard: true, requires: ['manual-at'] },
  { id: 'reliability', hard: true, requires: ['automated'] },
  { id: 'performance', hard: false, requires: ['device-measurement'] },
  { id: 'agency-trust', hard: true, requires: ['automated', 'participant'] },
  { id: 'learning-transfer', hard: false, requires: ['user-report'] },
];

export type Result = 'pass' | 'fail' | 'blocked';
export interface EvidenceRef {
  id: string;
  scenarioId: string;
  dimension: DimensionId;
  method: EvidenceMethod;
  /** The exact candidate generation the run used. */
  generation: string;
  /** SHA-256 of the immutable evidence artifact: 64 lowercase hex characters. */
  sha256: string;
  result: Result;
  recordedBy: 'candidate' | 'independent';
}
export interface ScenarioSpec { id: string; dimension: DimensionId; method: EvidenceMethod; steps: ReadonlyArray<string>; }
export interface EvidenceLoad { complete: boolean; items: ReadonlyArray<EvidenceRef>; }
export interface ScoreClaim { dimension: DimensionId; generation: string; score: number | null; authoredBy: 'candidate' | 'independent'; }
export interface ReviewRecord { reviewer: string; role: 'candidate' | 'independent'; generation: string; decision: 'accept' | 'reject' | 'defer'; }
export interface EvaluationInput {
  generation: string;
  scenarios: ReadonlyArray<ScenarioSpec>;
  /** null: the evidence store could not be read. complete false: the load was interrupted. */
  evidence: EvidenceLoad | null;
  claims: ReadonlyArray<ScoreClaim>;
  reviews: ReadonlyArray<ReviewRecord>;
}

export type ScenarioStatus = 'run-pass' | 'run-fail' | 'blocked' | 'conflict' | 'not-run';
export interface ScenarioResult { key: string; status: ScenarioStatus; evidenceIds: string[]; }
export type Rejection =
  | 'transferred-score' | 'transferred-evidence' | 'transferred-acceptance' | 'candidate-authored-acceptance'
  | 'mock-as-evidence' | 'unverifiable-reference' | 'conflicting-duplicate';
export type Verdict = 'verified-pass' | 'claimed-pass' | 'fail' | 'pending';
export interface DimensionVerdict { dimension: DimensionId; hard: boolean; verdict: Verdict; reasons: string[]; evidenceIds: string[]; }
export interface Evaluation {
  generation: string;
  evaluatorVersion: typeof EVALUATOR_VERSION;
  overall: 'blocked' | 'incomplete' | 'awaiting-independent-acceptance' | 'accepted';
  dimensions: DimensionVerdict[];
  hardFailures: DimensionId[];
  /** Soft dimensions that are not verified-pass. They are shown, and they never block on their own. */
  openSoft: DimensionId[];
  rejected: Array<{ kind: Rejection; ref: string }>;
  scenarios: ScenarioResult[];
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const SHA256 = /^[0-9a-f]{64}$/;
const canon = (r: EvidenceRef) => JSON.stringify(r, Object.keys(r).sort());

interface Usable { refs: EvidenceRef[]; rejected: Array<{ kind: Rejection; ref: string }>; }
/** Keeps refs for this generation that name a declared scenario, dimension and method. Identical duplicates collapse; conflicting ones are dropped. */
function usable(items: ReadonlyArray<EvidenceRef>, scenarios: ReadonlyArray<ScenarioSpec>, generation: string): Usable {
  const declared = new Map(scenarios.map((s) => [s.id, s] as const));
  const rejected: Usable['rejected'] = [];
  const kept = new Map<string, { json: string; ref: EvidenceRef }>();
  const conflicted = new Set<string>();
  for (const r of items) {
    const s = declared.get(r.scenarioId);
    if (r.generation !== generation) rejected.push({ kind: 'transferred-evidence', ref: r.id });
    else if (r.method === 'mock') rejected.push({ kind: 'mock-as-evidence', ref: r.id });
    else if (!SHA256.test(r.sha256) || !s || s.dimension !== r.dimension || s.method !== r.method) rejected.push({ kind: 'unverifiable-reference', ref: r.id });
    else {
      const json = canon(r);
      const seen = kept.get(r.id);
      if (!seen) kept.set(r.id, { json, ref: r });
      else if (seen.json !== json) conflicted.add(r.id);
    }
  }
  for (const id of conflicted) {
    kept.delete(id);
    rejected.push({ kind: 'conflicting-duplicate', ref: id });
  }
  return { refs: [...kept.values()].map((v) => v.ref).sort((a, b) => byText(a.id, b.id)), rejected };
}

/** Runs each scenario in id order. Unreadable or interrupted loads leave every scenario not-run. */
export function runScenarios(scenarios: ReadonlyArray<ScenarioSpec>, load: EvidenceLoad | null, generation: string): ScenarioResult[] {
  const refs = load === null || !load.complete ? [] : usable(load.items, scenarios, generation).refs;
  return [...scenarios].sort((a, b) => byText(a.id, b.id)).map((s) => {
    const mine = refs.filter((r) => r.scenarioId === s.id);
    const results = new Set(mine.map((r) => r.result));
    const status: ScenarioStatus = mine.length === 0 ? 'not-run'
      : results.size > 1 ? 'conflict'
        : results.has('pass') ? 'run-pass'
          : results.has('fail') ? 'run-fail' : 'blocked';
    return { key: `${s.id}@${generation}`, status, evidenceIds: mine.map((r) => r.id) };
  });
}

/** One dimension from its own refs only. Any fail fails it; any blocked run or missing requirement leaves it pending. */
function judge(rule: DimensionRule, refs: ReadonlyArray<EvidenceRef>): DimensionVerdict {
  const mine = refs.filter((r) => r.dimension === rule.id);
  const reasons: string[] = [];
  for (const r of mine.filter((x) => x.result === 'fail')) reasons.push(`failed:${r.method}`);
  for (const r of mine.filter((x) => x.result === 'blocked')) reasons.push(`blocked:${r.method}`);
  for (const m of rule.requires) {
    if (!mine.some((r) => r.method === m && r.result === 'pass')) reasons.push(`missing:${m}`);
    else if (!mine.some((r) => r.method === m && r.result === 'pass' && r.recordedBy === 'independent')) reasons.push(`unverified:${m}`);
  }
  const allPassed = rule.requires.every((m) => mine.some((r) => r.method === m && r.result === 'pass'));
  const verified = rule.requires.every((m) => mine.some((r) => r.method === m && r.result === 'pass' && r.recordedBy === 'independent'));
  const failed = mine.some((r) => r.result === 'fail');
  const blocked = mine.some((r) => r.result === 'blocked');
  const verdict: Verdict = failed ? 'fail' : blocked || !allPassed ? 'pending' : verified ? 'verified-pass' : 'claimed-pass';
  return { dimension: rule.id, hard: rule.hard, verdict, reasons, evidenceIds: mine.map((r) => r.id).sort(byText) };
}

/** Judges every dimension, then gates overall on hard dimensions only. No score, average or weighting is computed. */
export function evaluate(input: EvaluationInput): Evaluation {
  const gen = input.generation;
  const load = input.evidence;
  const u: Usable = load && load.complete ? usable(load.items, input.scenarios, gen) : { refs: [], rejected: [] };
  const stop = load === null ? 'evidence-unreadable' : load.complete ? null : 'load-interrupted';
  const dimensions = RUBRIC.map((rule): DimensionVerdict => (stop
    ? { dimension: rule.id, hard: rule.hard, verdict: 'pending', reasons: [stop], evidenceIds: [] }
    : judge(rule, u.refs)));
  const rejected = [...u.rejected];
  for (const c of input.claims) {
    if (c.generation !== gen) rejected.push({ kind: 'transferred-score', ref: `${c.dimension}@${c.generation}` });
  }
  let accepted = false;
  let rejectedByIndependent = false;
  for (const r of input.reviews) {
    if (r.decision === 'accept' && r.role === 'candidate') rejected.push({ kind: 'candidate-authored-acceptance', ref: r.reviewer });
    else if (r.decision === 'accept' && r.generation !== gen) rejected.push({ kind: 'transferred-acceptance', ref: r.reviewer });
    else if (r.role === 'independent' && r.generation === gen) {
      if (r.decision === 'accept') accepted = true;
      if (r.decision === 'reject') rejectedByIndependent = true;
    }
  }
  const hardFailures = dimensions.filter((d) => d.hard && d.verdict === 'fail').map((d) => d.dimension);
  const hardOpen = dimensions.some((d) => d.hard && d.verdict !== 'verified-pass');
  const overall: Evaluation['overall'] = hardFailures.length > 0 || rejectedByIndependent ? 'blocked'
    : hardOpen ? 'incomplete'
      : accepted ? 'accepted' : 'awaiting-independent-acceptance';
  return {
    generation: gen,
    evaluatorVersion: EVALUATOR_VERSION,
    overall,
    dimensions,
    hardFailures,
    openSoft: dimensions.filter((d) => !d.hard && d.verdict !== 'verified-pass').map((d) => d.dimension),
    rejected: rejected.sort((a, b) => byText(`${a.kind}|${a.ref}`, `${b.kind}|${b.ref}`)),
    scenarios: runScenarios(input.scenarios, load, gen),
  };
}
