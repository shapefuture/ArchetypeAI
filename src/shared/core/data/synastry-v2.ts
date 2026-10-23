/**
 * INNERVERSE — Synastry engine v2 (REVAMP_PLAN.md §2)
 *
 * Two full profiles in → six 0–100 composites + named dynamics out.
 * Fully deterministic. No compatibility percentage — ever (§2.3).
 */
import {
  PROTECTORS, EXILES, SHADOW_PARTS, RESOURCES, POLARIZATIONS, GUARDS,
  TRIGGER, INTERLOCKS, NEED, COMPLEXES, partClass,
  type ShadowPartId, type ProtectorId, type ExileId, type ResourceId,
  type Need, type ComplexId,
} from './parts';
import type { ScoredProfile } from './scoring-v2';

export interface SynastryProfile {
  T: Record<ShadowPartId, number>;
  resources: Record<ResourceId, number>;
  selfEnergy: number;
  attachment: { anxious: number; avoidant: number; secure: number; disorganized: boolean };
  complexes: Record<ComplexId, number>;
  hungers: Record<Need, number>;
}

const NEEDS: Need[] = ['safety', 'love', 'worth', 'autonomy', 'belonging', 'meaning', 'joy'];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
/** §2.1 expression weight: 0 at 50T, 1 at 80T. */
const act = (T: number) => Math.max(0, (T - 50) / 30);
/** §2.1 vulnerability weight: 0 at 45T, 1 at 75T. */
const vuln = (T: number) => Math.max(0, (T - 45) / 30);

export interface MakeProfileOverrides {
  T?: Record<ShadowPartId, number>;
  resources?: Record<ResourceId, number>;
  selfEnergy?: number;
  anxious?: number;
  avoidant?: number;
  secure?: number;
  complexes?: Record<ComplexId, number>;
  hungers?: Partial<Record<Need, number>>;
}

/** Test/fixture constructor with neutral defaults (everything 50, no hunger). */
export function makeProfile(o: MakeProfileOverrides = {}): SynastryProfile {
  const T = {} as Record<ShadowPartId, number>;
  for (const p of SHADOW_PARTS) T[p] = o.T?.[p] ?? 50;
  const resources = {} as Record<ResourceId, number>;
  for (const r of RESOURCES) resources[r] = o.resources?.[r] ?? 50;
  const complexes = {} as Record<ComplexId, number>;
  for (const id of Object.keys(COMPLEXES) as ComplexId[]) complexes[id] = o.complexes?.[id] ?? 50;
  const hungers = {} as Record<Need, number>;
  for (const n of NEEDS) hungers[n] = o.hungers?.[n] ?? 0;
  const anxious = o.anxious ?? 50;
  const avoidant = o.avoidant ?? 50;
  const secure = o.secure ?? 20 + (o.selfEnergy ?? 50) * 0.6;
  return {
    T, resources, complexes, hungers,
    selfEnergy: o.selfEnergy ?? 50,
    attachment: { anxious, avoidant, secure, disorganized: anxious >= 60 && avoidant >= 60 },
  };
}

/** Adapt a scored assessment into the synastry input shape. */
export function toSynastryProfile(p: ScoredProfile): SynastryProfile {
  const T = {} as Record<ShadowPartId, number>;
  for (const id of SHADOW_PARTS) T[id] = p.parts[id].T;
  const resources = {} as Record<ResourceId, number>;
  for (const r of RESOURCES) resources[r] = p.resources[r].T;
  const complexes = {} as Record<ComplexId, number>;
  for (const id of Object.keys(COMPLEXES) as ComplexId[]) complexes[id] = p.complexes[id].activation;
  const hungers = { ...p.needHunger };
  return {
    T, resources, complexes, hungers,
    selfEnergy: p.selfEnergy,
    attachment: {
      anxious: p.attachment.anxious, avoidant: p.attachment.avoidant,
      secure: p.attachment.secure, disorganized: p.attachment.disorganized,
    },
  };
}

export type DanceStyle =
  | 'HEALING_CONTAINER' | 'PARALLEL_SOVEREIGNTY' | 'PURSUE_WITHDRAW_1'
  | 'PURSUE_WITHDRAW_2' | 'MUTUAL_ESCALATION' | 'DEEP_FREEZE' | 'VOLATILE_BOND';
type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export interface LoopResult {
  aProtector: ProtectorId;
  bExile: ExileId;
  bGuardian: ProtectorId;
  aExile: ExileId;
  aGuardian: ProtectorId;
  name: string;
}

export interface InterlockHit {
  pair: [ComplexId, ComplexId];
  name: string;
  strength: number;
}

export interface SynastryResult {
  FRICTION: number;
  RESONANCE: number;
  BALANCE: number;
  SAFETY: number;
  GROWTH: number;
  NOURISH: number;
  loop: LoopResult;
  interlocks: InterlockHit[];
  /** true when zero interlocks fire — framed as a good result (§2.4). */
  noLockedStoryline: boolean;
  dance: DanceStyle;
  nourishHighlights: { giver: ResourceId; need: Need; strength: number }[];
  debug: { triggerAtoB: number; triggerBtoA: number; feedAtoB: number; feedBtoA: number };
}

export function synastry(A: SynastryProfile, B: SynastryProfile): SynastryResult {
  // §2.1 cross-trigger
  const triggerAtoB = crossTrigger(A, B);
  const triggerBtoA = crossTrigger(B, A);
  const fired = interlockHits(A, B);
  const frictionBase = clamp01((triggerAtoB + triggerBtoA) / 4.0) * 100;
  const FRICTION = clamp(frictionBase + 6 * fired.length, 0, 100);

  // §2.3 composites
  const resonanceBase = 100 - mean(EXILES.map(e => Math.abs(A.T[e] - B.T[e]))) * 2.5;
  const RESONANCE = clamp(resonanceBase + 4 * fired.length, 0, 100);
  let matches = 0;
  for (const [x, y] of POLARIZATIONS) {
    if ((A.T[x] >= 60 && B.T[y] >= 60) || (B.T[x] >= 60 && A.T[y] >= 60)) matches++;
  }
  const BALANCE = clamp(40 + 10 * matches, 0, 100);
  const SAFETY = 0.7 * (A.selfEnergy + B.selfEnergy) / 2
    + 0.3 * (100 - (Math.max(A.attachment.anxious, B.attachment.anxious)
      + Math.max(A.attachment.avoidant, B.attachment.avoidant)) / 2);
  const GROWTH = clamp(0.5 * RESONANCE + 0.5 * (100 - Math.abs(FRICTION - 45) * 2.2), 0, 100);

  // §2.5 NOURISH
  const feedAtoB = feed(A, B);
  const feedBtoA = feed(B, A);
  const NOURISH = clamp01((feedAtoB + feedBtoA) / 2) * 100;

  return {
    FRICTION, RESONANCE, BALANCE, SAFETY, GROWTH, NOURISH,
    loop: findLoop(A, B),
    interlocks: fired.sort((a, b) => b.strength - a.strength).slice(0, 2),
    noLockedStoryline: fired.length === 0,
    dance: danceOf(A, B),
    nourishHighlights: nourishHighlights(A, B),
    debug: { triggerAtoB, triggerBtoA, feedAtoB, feedBtoA },
  };
}

function crossTrigger(from: SynastryProfile, to: SynastryProfile): number {
  let sum = 0;
  for (const p of PROTECTORS) {
    for (const e of EXILES) {
      sum += act(from.T[p]) * vuln(to.T[e]) * TRIGGER[p][EXILES.indexOf(e)];
    }
  }
  return sum;
}

/** §2.2 The Loop Finder: the dyad's signature 4-node cycle. */
function findLoop(A: SynastryProfile, B: SynastryProfile): LoopResult {
  const maxBy = <T>(xs: readonly T[], f: (x: T) => number): T => {
    let best = xs[0];
    for (const x of xs) if (f(x) > f(best)) best = x;
    return best;
  };
  const aProtector = maxBy(PROTECTORS, p => act(A.T[p]));
  const bExile = maxBy(EXILES, e => vuln(B.T[e]));
  const guardianOf = (P: SynastryProfile, e: ExileId): ProtectorId =>
    maxBy(PROTECTORS.filter(p => GUARDS[p][e] != null), p => P.T[p]);
  const bGuardian = guardianOf(B, bExile);
  const aExile = maxBy(EXILES, e => vuln(A.T[e]) * TRIGGER[bGuardian][EXILES.indexOf(e)]);
  const aGuardian = guardianOf(A, aExile);
  return { aProtector, bExile, bGuardian, aExile, aGuardian, name: loopName(aProtector, bGuardian, bExile) };
}

function loopName(a: ProtectorId, b: ProtectorId, bExile: ExileId): string {
  const pair = new Set([a, b]);
  if (a === 'pleaser' || b === 'pleaser') return 'The Vanishing Act';
  if ((a === 'analyst' || a === 'numb') && bExile === 'abandoned') return 'The Long Winter';
  if (pair.has('rebel') && pair.has('controller')) return 'The Standoff';
  const ca = partClass(a), cb = partClass(b);
  if (ca === 'manager' && cb === 'manager') return 'The Cold War';
  if (ca === 'firefighter' && cb === 'firefighter') return 'The Wildfire';
  return 'The Pursuit';
}

/** §2.4 — interlocks fire when both complexes are active (≥55) and the pair is hardcoded. */
function interlockHits(A: SynastryProfile, B: SynastryProfile): InterlockHit[] {
  const hits: InterlockHit[] = [];
  const activeA = (Object.keys(COMPLEXES) as ComplexId[]).filter(id => A.complexes[id] >= 55);
  const activeB = (Object.keys(COMPLEXES) as ComplexId[]).filter(id => B.complexes[id] >= 55);
  for (const cA of activeA) {
    for (const cB of activeB) {
      const entry = INTERLOCKS.find(
        ([x, y]) => (x === cA && y === cB) || (x === cB && y === cA),
      );
      if (entry) {
        hits.push({
          pair: [cA, cB],
          name: entry[2],
          strength: (A.complexes[cA] + B.complexes[cB]) / 2,
        });
      }
    }
  }
  return hits;
}

/** §2.6 attachment dance from derived indices. */
function danceOf(A: SynastryProfile, B: SynastryProfile): DanceStyle {
  const style = (P: SynastryProfile): AttachmentStyle => {
    if (P.attachment.disorganized) return 'disorganized';
    const { anxious, avoidant, secure } = P.attachment;
    if (anxious >= avoidant && anxious >= secure) return 'anxious';
    if (avoidant >= secure) return 'avoidant';
    return 'secure';
  };
  const sA = style(A), sB = style(B);
  if (sA === 'disorganized' || sB === 'disorganized') return 'VOLATILE_BOND';
  if (sA === 'secure' && sB === 'secure') return 'HEALING_CONTAINER';
  if (sA === 'secure' && sB === 'anxious') return 'HEALING_CONTAINER';
  if (sA === 'anxious' && sB === 'secure') return 'HEALING_CONTAINER';
  if (sA === 'secure' || sB === 'secure') return 'PARALLEL_SOVEREIGNTY'; // secure × avoidant
  if (sA === 'anxious' && sB === 'avoidant') return 'PURSUE_WITHDRAW_1';
  if (sA === 'avoidant' && sB === 'anxious') return 'PURSUE_WITHDRAW_2';
  if (sA === 'anxious' && sB === 'anxious') return 'MUTUAL_ESCALATION';
  return 'DEEP_FREEZE'; // avoidant × avoidant
}

/** §2.5 — resources of `giver` feeding the receiver's top-2 need hungers. */
function feed(giver: SynastryProfile, receiver: SynastryProfile): number {
  let total = 0;
  for (const h of top2Hungers(receiver)) {
    const weight = clamp01(h.hunger / 20);
    if (weight === 0) continue;
    let best = 0;
    for (const r of resourcesForNeed(h.need)) {
      best = Math.max(best, Math.max(0, (giver.resources[r] - 45) / 30));
    }
    total += best * weight;
  }
  return total;
}

function nourishHighlights(A: SynastryProfile, B: SynastryProfile):
  { giver: ResourceId; need: Need; strength: number }[] {
  const out: { giver: ResourceId; need: Need; strength: number }[] = [];
  for (const [giver, receiver] of [[A, B], [B, A]] as const) {
    for (const h of top2Hungers(receiver)) {
      const weight = clamp01(h.hunger / 20);
      for (const r of resourcesForNeed(h.need)) {
        const strength = Math.max(0, (giver.resources[r] - 45) / 30) * weight;
        if (strength > 0) out.push({ giver: r, need: h.need, strength });
      }
    }
  }
  return out.sort((a, b) => b.strength - a.strength).slice(0, 2);
}

const NEED_ORDER: Need[] = NEEDS;
function top2Hungers(P: SynastryProfile): { need: Need; hunger: number }[] {
  return NEED_ORDER
    .map(need => ({ need, hunger: P.hungers[need] }))
    .sort((a, b) => b.hunger - a.hunger)
    .slice(0, 2);
}

/** Resources serving a need; safety→caregiver and worth→sage when unmapped (§2.5). */
function resourcesForNeed(need: Need): ResourceId[] {
  const direct = RESOURCES.filter(r => NEED[r] === need);
  if (direct.length) return direct;
  if (need === 'safety') return ['caregiver'];
  if (need === 'worth') return ['sage'];
  return [];
}
