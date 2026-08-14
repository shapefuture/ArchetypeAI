/**
 * INNERVERSE — Scoring engine v2 (REVAMP_PLAN.md §1.3–1.15)
 *
 * Pure, deterministic, client-side. Same answers → same result. No LLM, no
 * random, no time-dependence. Every formula below is copied from the spec.
 */
import {
  MANAGERS, PROTECTORS, EXILES, SHADOW_PARTS, RESOURCES, FIREFIGHTERS,
  NORM_MEAN, NORM_SD, RESOURCE_NORM_MEAN, RESOURCE_NORM_SD,
  POLARIZATIONS, GUARDS, COMPLEXES, NEED, RESOURCE_BANDS, SUBTYPES,
  SELF_QUALITIES, tierOf,
  type ShadowPartId, type ProtectorId, type ExileId, type ResourceId, type PartId,
  type Need, type Tier, type SelfQuality, type ComplexId, type SubtypeDef,
} from './parts';
import { constellation, type ConstellationDef } from './constellations';

// --- §1.2 item-bank contract: items q7, q8 (indexes 6,7) of every shadow part are reverse-keyed ---
export const REVERSE_KEYED_INDEXES = [6, 7] as const;

export interface AssessmentInput {
  /** 8 raw Likert responses (1..5) per shadow part, keyed order. */
  shadow: Record<ShadowPartId, number[]>;
  /** 6 raw Likert responses (1..5) per resource. */
  resources: Record<ResourceId, number[]>;
  /** 8 raw Likert responses (1..5), item i → SELF_QUALITIES[i]. */
  self: number[];
  /** §1.2 validity items: attention must equal 3; infrequency flagged at ≥ 4. */
  validity: { attention: number; infrequency: [number, number] };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const tScore = (raw: number, m: number, sd: number) => clamp(50 + 10 * (raw - m) / sd, 20, 80);

export interface PartScore { id: ShadowPartId; raw: number; T: number; tier: Tier; }
export interface ResourceScore {
  id: ResourceId; raw: number; T: number; tier: Tier;
  band: 'hypo' | 'healthy' | 'hyper';
}
export interface ResourceLeak { resource: ResourceId; spillPart: ProtectorId; }
export interface Attachment {
  anxious: number; avoidant: number; secure: number; disorganized: boolean;
}
export type ComplexTier = 'latent' | 'active' | 'gripping';
export interface ComplexScore { id: ComplexId; activation: number; tier: ComplexTier; }
export interface CopingStack {
  l1: ProtectorId;
  l2?: ProtectorId;
  l3?: ProtectorId;
  floor: ExileId;
}
export interface NeedHunger { need: Need; hunger: number; }
export interface PolarizationHit {
  pair: [ProtectorId, ProtectorId]; name: string;
}

export interface ScoredProfile {
  parts: Record<ShadowPartId, PartScore>;
  resources: Record<ResourceId, ResourceScore>;
  resourceLeaks: ResourceLeak[];
  strongestResource: ResourceScore;
  selfEnergy: number;
  selfRadar: Record<SelfQuality, number>;
  burden: number;
  headline: ConstellationDef & { protector: ProtectorId; exile: ExileId };
  subtypes: Record<ShadowPartId, SubtypeDef>;
  polarizations: PolarizationHit[];
  attachment: Attachment;
  complexes: Record<ComplexId, ComplexScore>;
  activeComplexes: ComplexScore[];
  needHunger: Record<Need, number>;
  topHunger?: NeedHunger;
  copingStack: CopingStack;
  validity: { flags: string[]; ok: boolean };
  /** §3 ethics: crisis footer when all 4 exiles ≥ 60T. */
  crisis: boolean;
}

function rawShadow(items: number[]): number {
  let sum = 0;
  items.forEach((v, i) => {
    sum += REVERSE_KEYED_INDEXES.includes(i as 6 | 7) ? 6 - v : v;
  });
  return sum;
}

export function scoreProfile(input: AssessmentInput): ScoredProfile {
  // §1.3 part T-scores
  const parts = {} as Record<ShadowPartId, PartScore>;
  for (const id of SHADOW_PARTS) {
    const raw = rawShadow(input.shadow[id]);
    const T = tScore(raw, NORM_MEAN[id], NORM_SD[id]);
    parts[id] = { id, raw, T, tier: tierOf(T) };
  }

  // §1.3 resources + §1.14 bands
  const resources = {} as Record<ResourceId, ResourceScore>;
  for (const id of RESOURCES) {
    const raw = input.resources[id].reduce((s, v) => s + v, 0);
    const T = tScore(raw, RESOURCE_NORM_MEAN, RESOURCE_NORM_SD);
    const band: ResourceScore['band'] = T < 40 ? 'hypo' : T >= 65 ? 'hyper' : 'healthy';
    resources[id] = { id, raw, T, tier: tierOf(T), band };
  }
  const resourceLeaks: ResourceLeak[] = RESOURCES
    .filter(id => resources[id].band === 'hyper' && parts[RESOURCE_BANDS[id].spillPart].T >= 60)
    .map(id => ({ resource: id, spillPart: RESOURCE_BANDS[id].spillPart }));
  const strongestResource = RESOURCES
    .map(id => resources[id])
    .reduce((a, b) => (b.T > a.T ? b : a));

  // §1.3 Self-energy + §1.15 radar (item i → quality i, single-item indicative)
  const rawSelf = input.self.reduce((s, v) => s + v, 0);
  const selfEnergy = Math.round(100 * (rawSelf - 8) / 32);
  const selfRadar = {} as Record<SelfQuality, number>;
  SELF_QUALITIES.forEach((q, i) => {
    selfRadar[q] = clamp(50 + 10 * (input.self[i] - 3), 20, 80);
  });

  // §1.3 burden
  const burdenRaw = mean(EXILES.map(e => parts[e].T)) * 0.5
    + Math.max(...PROTECTORS.map(p => parts[p].T)) * 0.3
    + ((100 - selfEnergy) / 2) * 0.2;
  const burden = clamp((burdenRaw - 40) * 2.5, 0, 100);

  // §1.4 constellation headline: top protector × top exile, ties → earlier table id
  const topProtector = maxBy(PROTECTORS, p => parts[p].T);
  const topExile = maxBy(EXILES, e => parts[e].T);
  const head = constellation(topProtector, topExile);
  const headline = { ...head, protector: topProtector, exile: topExile };

  // §1.5 subtype resolution
  const subtypes = {} as Record<ShadowPartId, SubtypeDef>;
  for (const family of SHADOW_PARTS) {
    const list = SUBTYPES[family];
    subtypes[family] = parts[family].T >= 45
      ? resolveSubtype(list, parts)
      : list[0];
  }

  // §1.4 polarizations (both ≥ 60T)
  const polarizations: PolarizationHit[] = POLARIZATIONS
    .filter(([a, b]) => parts[a].T >= 60 && parts[b].T >= 60)
    .map(([a, b, name]) => ({ pair: [a, b], name }));

  // §1.6 attachment indices
  const anxious = 0.5 * parts.abandoned.T + 0.3 * parts.pleaser.T + 0.2 * parts.charmer.T;
  const avoidant = 0.3 * parts.analyst.T + 0.3 * parts.numb.T + 0.25 * parts.hermit.T
    + 0.15 * parts.controller.T;
  const secure = 20 + selfEnergy * 0.6;
  const attachment: Attachment = {
    anxious, avoidant, secure,
    disorganized: anxious >= 60 && avoidant >= 60,
  };

  // §1.7 complexes
  const complexes = {} as Record<ComplexId, ComplexScore>;
  for (const [id, def] of Object.entries(COMPLEXES) as [ComplexId, typeof COMPLEXES[ComplexId]][]) {
    const activation = Object.entries(def.weights)
      .reduce((s, [part, w]) => s + (w ?? 0) * (parts[part as ShadowPartId]?.T ?? 0), 0);
    complexes[id] = {
      id, activation,
      tier: activation < 55 ? 'latent' : activation < 62 ? 'active' : 'gripping',
    };
  }
  const activeComplexes = Object.values(complexes)
    .filter(c => c.activation >= 55)
    .sort((a, b) => b.activation - a.activation)
    .slice(0, 2);

  // §1.8 need hungers (needs with no shadow carrier, e.g. joy, are 0 by definition)
  const needHunger = {} as Record<Need, number>;
  for (const need of NEEDS) {
    const shadow = SHADOW_PARTS.filter(p => NEED[p] === need).map(p => parts[p].T);
    const res = RESOURCES.filter(r => NEED[r] === need).map(r => resources[r].T);
    needHunger[need] = shadow.length === 0 ? 0 : mean(shadow) - (res.length ? mean(res) : 50);
  }
  const topHunger = NEEDS
    .map(need => ({ need, hunger: needHunger[need] }))
    .sort((a, b) => b.hunger - a.hunger)[0];

  // §1.11 coping stack
  const copingStack = buildCopingStack(parts);

  // §1.2 validity — flag, never block
  const flags: string[] = [];
  if (input.validity.attention !== 3) flags.push('attention');
  if (input.validity.infrequency.some(v => v >= 4)) flags.push('infrequency');

  // §3 crisis footer: all 4 exiles ≥ 60T
  const crisis = EXILES.every(e => parts[e].T >= 60);

  return {
    parts, resources, resourceLeaks, strongestResource,
    selfEnergy, selfRadar, burden, headline, subtypes, polarizations,
    attachment, complexes, activeComplexes, needHunger, topHunger,
    copingStack, validity: { flags, ok: flags.length === 0 }, crisis,
  };
}

const NEEDS: Need[] = ['safety', 'love', 'worth', 'autonomy', 'belonging', 'meaning', 'joy'];

function maxBy<T>(xs: readonly T[], f: (x: T) => number): T {
  let best = xs[0];
  for (const x of xs) if (f(x) > f(best)) best = x;
  return best;
}

/** §1.5: highest-T colorer ≥ 45 among the 4 designated colorers; ties → earlier column; else base. */
function resolveSubtype(list: SubtypeDef[], parts: Record<ShadowPartId, PartScore>): SubtypeDef {
  let best: { def: SubtypeDef; T: number } | null = null;
  for (const s of list.slice(1)) {
    const T = parts[s.colorer as ShadowPartId].T;
    if (T >= 45 && (!best || T > best.T)) best = { def: s, T };
  }
  return best ? best.def : list[0];
}

/** §1.11: L1 top manager; L2 next protector ≥45; L3 top firefighter distinct ≥45; floor guardian-weighted. */
function buildCopingStack(parts: Record<ShadowPartId, PartScore>): CopingStack {
  const l1 = maxBy(MANAGERS, m => parts[m].T);
  const rest = PROTECTORS.filter(p => p as string !== l1 as string && parts[p].T >= 45)
    .sort((a, b) => parts[b].T - parts[a].T);
  const l2 = rest[0];
  const ff = FIREFIGHTERS
    .filter(f => f as string !== l1 as string && f !== l2 && parts[f].T >= 45)
    .sort((a, b) => parts[b].T - parts[a].T)[0];
  const stack = [l1, l2, ff].filter((x): x is ProtectorId => !!x);
  let floor = EXILES[0];
  let floorScore = -1;
  for (const e of EXILES) {
    const s = parts[e].T * stack.reduce((sum, p) => sum + (GUARDS[p][e] ?? 0), 0);
    if (s > floorScore) { floorScore = s; floor = e; }
  }
  return { l1, l2, l3: ff, floor };
}

// --- §1.13 Quick Scan — 14 items, one per shadow family, provisional only ---

export type QuickScanResult =
  | { kind: 'family'; family: ShadowPartId; subtypeName: string }
  | { kind: 'self' };

export function quickScan(items: Partial<Record<ShadowPartId, number>>): QuickScanResult {
  let best: { family: ShadowPartId; raw: number } | null = null;
  for (const family of SHADOW_PARTS) {
    const raw = items[family] ?? 0;
    if (!best || raw > best.raw) best = { family, raw };
  }
  if (best && best.raw >= 4) {
    return { kind: 'family', family: best.family, subtypeName: SUBTYPES[best.family][0].name };
  }
  return { kind: 'self' };
}
