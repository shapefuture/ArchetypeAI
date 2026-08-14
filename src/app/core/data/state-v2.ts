/**
 * INNERVERSE — State layer v2 (REVAMP_PLAN.md §1.10, §1.12, §3B.1, §3C)
 *
 * Trait is the map; state is the weather. Everything here is derived from
 * logged check-ins — pure functions of (history, now). No LLM, no randomness.
 * All timestamps are LOCAL time (sealed verdicts and late-night locks are
 * about the user's midnight, not UTC).
 */
import {
  SHADOW_PARTS, type PartId, type ShadowPartId, type EventType,
} from './parts';
import type { ScoredProfile } from './scoring-v2';

// --- §1.10 check-in model ---

export type Arousal = -2 | -1 | 0 | 1 | 2; // -2 shutdown … 0 window … +2 hyper

export interface CheckIn {
  /** ISO timestamp of the check-in, local clock. */
  date: string;
  arousal: Arousal;
  eventType?: EventType;
  /** The part the engine predicted would flare. */
  predictedPart?: PartId;
  /** What the user confirmed/corrected to; null = "noticed and chose". */
  confirmedPart?: PartId | null;
}

/** §1.10 HARDCODED crisis→part trigger map (boundary proxy resolved to frightened). */
export const CRISIS_TRIGGERS: Record<EventType, PartId[]> = {
  relational: ['abandoned', 'pleaser', 'charmer', 'hermit'],
  achievement: ['taskmaster', 'inner_critic', 'ashamed'],
  loss: ['abandoned', 'numb', 'frightened', 'bypasser'],
  boundary: ['rebel', 'controller', 'frightened'],
  change: ['controller', 'frightened', 'explorer'],
  calm: ['sage', 'explorer', 'caregiver'],
};

export type TriggerWeights = Record<EventType, Partial<Record<PartId, number>>>;

/** Neutral-default weight lookup (sparse storage, weight 1 when unset). */
export const weightOf = (w: TriggerWeights, event: EventType, part: PartId): number =>
  w[event][part] ?? 1;

/** §1.10 prediction: highest weighted-T part among the event's candidates. */
export function predictFlare(
  profile: ScoredProfile,
  eventType: EventType,
  weights?: TriggerWeights,
): PartId {
  const t = (p: PartId): number =>
    (profile.parts[p as ShadowPartId]?.T ?? profile.resources[p as 'sage']?.T ?? 0)
    * (weights?.[eventType]?.[p] ?? 1);
  const candidates = CRISIS_TRIGGERS[eventType];
  let best = candidates[0];
  for (const c of candidates) if (t(c) > t(best)) best = c;
  return best;
}

/**
 * §1.10 adaptive weights — the ONLY adaptive element in the app. Corrections
 * shift the predicted part −0.1 and the confirmed part +0.1 (band 0..1), but
 * only once 14+ check-ins exist; before that every weight is the neutral 1.
 */
export function adjustTriggerWeights(history: CheckIn[]): TriggerWeights {
  const w: TriggerWeights = {
    relational: {}, achievement: {}, loss: {}, boundary: {}, change: {}, calm: {},
  };
  if (history.length < 14) return w;
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  for (const ci of history) {
    if (!ci.eventType || !ci.confirmedPart) continue;
    if (ci.predictedPart && ci.predictedPart !== ci.confirmedPart) {
      const bucket = w[ci.eventType];
      bucket[ci.predictedPart] = clamp01((bucket[ci.predictedPart] ?? 1) - 0.1);
      bucket[ci.confirmedPart] = clamp01((bucket[ci.confirmedPart] ?? 1) + 0.1);
    }
  }
  return w;
}

// --- §1.10 weather layer + integration arc ---

const DAY_MS = 24 * 60 * 60 * 1000;
/** Local calendar key (never UTC — the spec's midnight logic is the user's midnight). */
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayOf = (iso: string) => localDay(new Date(iso));
/** Whole-day difference between two instants, anchored to local midnights. */
const daysBetween = (a: Date, b: Date) =>
  Math.round((Date.parse(localDay(b) + 'T00:00:00') - Date.parse(localDay(a) + 'T00:00:00')) / DAY_MS);

export interface PartWeather { count: number; meanArousal: number | null; }

/** Trailing-30-day confirmed-flare counts per part (the "weather"). */
export function weatherLayer(history: CheckIn[], now: Date): Record<string, PartWeather> {
  const out: Record<string, PartWeather> = {};
  for (const ci of history) {
    if (!ci.confirmedPart) continue;
    if (daysBetween(new Date(ci.date), now) > 30) continue;
    const w = (out[ci.confirmedPart] ??= { count: 0, meanArousal: null });
    const n = w.count + 1;
    w.meanArousal = w.meanArousal === null
      ? ci.arousal
      : (w.meanArousal * w.count + ci.arousal) / n;
    w.count = n;
  }
  return out;
}

/**
 * §1.10 integration arc: a part earns an unburdening moment when its
 * confirmed-flare rate drops ≥30% between consecutive 30-day windows while
 * mean check-in self-report arousal trend rises (lower |arousal| = more
 * regulated; we compare mean absolute distance from the window).
 */
export function unburdeningMoments(priorWindow: CheckIn[], recentWindow: CheckIn[]): PartId[] {
  const rate = (h: CheckIn[], part: PartId) =>
    h.filter(c => c.confirmedPart === part).length / Math.max(1, h.length / 7); // flares per week
  const regulation = (h: CheckIn[]) =>
    h.length === 0 ? 0 : 1 - h.reduce((s, c) => s + Math.abs(c.arousal), 0) / (h.length * 2);
  return [...new Set(
    [...priorWindow, ...recentWindow]
      .filter(c => c.confirmedPart)
      .map(c => c.confirmedPart as PartId),
  )].filter(part => {
    const drop = rate(recentWindow, part) <= 0.7 * rate(priorWindow, part);
    const selfRising = regulation(recentWindow) > regulation(priorWindow);
    return drop && selfRising;
  }) as PartId[];
}

// --- §3C.1 Sealed Verdict ---

const isBad = (a: Arousal) => Math.abs(a) === 2;
const sameLocalDay = (iso: string, d: Date) => dayOf(iso) === localDay(d);

/**
 * Verdict lock: a hyper/shutdown check-in today, OR an app open between
 * 00:00–05:00 local following a day that had one. State-compromised minds
 * don't get to write permanent conclusions.
 */
export function verdictLockActive(history: CheckIn[], now: Date): boolean {
  const today = history.filter(c => sameLocalDay(c.date, now));
  if (today.some(c => isBad(c.arousal))) return true;
  const hour = now.getHours();
  if (hour >= 0 && hour < 5) {
    const yesterday = history.filter(c => daysBetween(new Date(c.date), now) === 1);
    if (yesterday.some(c => isBad(c.arousal))) return true;
  }
  return false;
}

export type VerdictReRating = 'still true' | 'partly' | 'state artifact';
export interface SealedVerdict {
  text: string;
  createdAt: string;
  resurfacesAt: string; // exactly +48h
  reRating?: VerdictReRating;
}

export function sealVerdict(text: string, now: Date): SealedVerdict {
  return {
    text, createdAt: now.toISOString(),
    resurfacesAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
  };
}

export function readyToResurface(v: SealedVerdict, now: Date): boolean {
  return now.getTime() >= new Date(v.resurfacesAt).getTime();
}

// --- §3C.3 attribution meter (lexicon-based, on-device) ---

export const GLOBALIZING_LEXICON = {
  en: ['always', 'never', 'everything', 'my whole life', 'i am '],
  ru: ['всегда', 'никогда', 'всё', 'всю жизнь', 'я — ', 'я такой', 'я такая'],
} as const;
export const LOCALIZING_LEXICON = {
  en: ['this time', 'in that moment', 'lately', "when i'm", 'at work'],
  ru: ['в этот раз', 'в тот момент', 'в последнее время', 'когда я', 'на работе'],
} as const;

const countTokens = (texts: string[], lexicon: readonly string[], lang: 'en' | 'ru'): number => {
  let n = 0;
  for (const raw of texts) {
    const text = raw.toLowerCase();
    for (const token of lexicon) {
      // "i am <adj>" style prefixes match as prefixes; plain words need word boundaries
      if (token.endsWith(' ')) n += text.split(token).length - 1;
      else n += (text.match(new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) ?? []).length;
    }
  }
  return n;
};

export interface AttributionRatio {
  globalizing: number; localizing: number; ratio: number;
}

export function attributionRatio(
  texts: string[], lang: 'en' | 'ru' = 'en', nowWindowDays = 30,
): AttributionRatio {
  void nowWindowDays; // caller slices the 30-day window; meter itself is pure
  const g = countTokens(texts, GLOBALIZING_LEXICON[lang], lang);
  const l = countTokens(texts, LOCALIZING_LEXICON[lang], lang);
  return { globalizing: g, localizing: l, ratio: l === 0 ? (g === 0 ? 0 : Infinity) : g / l };
}

/** ≥30% ratio worsening vs the two-week-old baseline (§3C.3). */
export function attributionWorsening(current: string[], baseline: string[], lang: 'en' | 'ru' = 'en'): boolean {
  const cur = attributionRatio(current, lang).ratio;
  const base = attributionRatio(baseline, lang).ratio;
  if (base === 0) return cur > 0;
  if (cur === Infinity) return true;
  return cur >= 1.3 * base;
}

// --- §3C.4 JITAI cards (max 1 per 24h, all opt-in) ---

export type JitaiCardId =
  | 'body_anchor' | 'dual_bound_charter' | 'witness_contact'
  | 'if_then_plan' | 'sealed_verdict_offer';

export interface JitaiInput {
  history: CheckIn[];
  now: Date;
  lastCardAt: Date | null;
  stackL1Flared: boolean;
  lapseToday: boolean;
}

export interface JitaiCard { id: JitaiCardId; }

/**
 * Trigger→card map with priority: body-anchor > charter > witness > if-then >
 * sealed verdict. Hard cap: one card per 24h.
 */
export function selectJitaiCard(input: JitaiInput): JitaiCard | null {
  if (input.lastCardAt && input.now.getTime() - input.lastCardAt.getTime() < 24 * 60 * 60 * 1000) {
    return null;
  }
  const today = input.history.filter(c => sameLocalDay(c.date, input.now));
  const hour = input.now.getHours();
  if (today.some(c => isBad(c.arousal))) return { id: 'body_anchor' };
  if (input.lapseToday) return { id: 'dual_bound_charter' };
  const streak = consecutiveOutOfWindowEnding(input.history, input.now);
  if (streak >= 2) return { id: 'witness_contact' };
  if (input.stackL1Flared) return { id: 'if_then_plan' };
  if (hour >= 0 && hour < 5) {
    const yesterday = input.history.filter(c => daysBetween(new Date(c.date), input.now) === 1);
    if (yesterday.some(c => isBad(c.arousal))) return { id: 'sealed_verdict_offer' };
  }
  return null;
}

function consecutiveOutOfWindowEnding(history: CheckIn[], now: Date): number {
  const byDay = new Map<string, boolean>();
  for (const c of history) {
    const bad = Math.abs(c.arousal) >= 1;
    byDay.set(dayOf(c.date), byDay.get(dayOf(c.date)) || bad);
  }
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = localDay(new Date(now.getTime() - i * DAY_MS));
    const state = byDay.get(d);
    if (state === true) streak++;
    else if (state === false) break;
    // days with no check-in don't break or extend the streak
  }
  return streak;
}

// --- §3B.1/§3B.3 safety gating ---

export type GateTier = 'green' | 'yellow' | 'red';
export type GateResult = 'ok' | 'locked' | 'therapist_only';

/**
 * Self-serve gating: GREEN always; YELLOW needs self_energy ≥ 40 AND no
 * gripping complex; RED is therapist-only and can NEVER be reached solo.
 */
export function selfServeGate(tier: GateTier, profile: ScoredProfile): GateResult {
  if (tier === 'red') return 'therapist_only';
  if (tier === 'green') return 'ok';
  const gripping = Object.values(profile.complexes).some(c => c.tier === 'gripping');
  return profile.selfEnergy >= 40 && !gripping ? 'ok' : 'locked';
}

/** Consecutive shutdown days ending at the most recent check-in (§3B.3 pause rule). */
export function shutdownStreak(history: CheckIn[]): number {
  const days = [...history].sort((a, b) => a.date < b.date ? 1 : -1)
    .filter(c => c.arousal === -2);
  if (days.length === 0) return 0;
  const seen = new Set(history.filter(c => c.arousal === -2).map(c => dayOf(c.date)));
  let streak = 0;
  let cursor = new Date(days[0].date);
  for (let i = 0; i < 60; i++) {
    if (seen.has(localDay(cursor))) { streak++; cursor = new Date(cursor.getTime() - DAY_MS); }
    else break;
  }
  return streak;
}

/** True when the pause rule fires: shutdown 3 days running (§3B.3). */
export function pauseNonRegulation(history: CheckIn[]): boolean {
  return shutdownStreak(history) >= 3;
}

export const ALL_PART_IDS: PartId[] = [...SHADOW_PARTS, 'sage', 'warrior', 'caregiver', 'explorer'];
