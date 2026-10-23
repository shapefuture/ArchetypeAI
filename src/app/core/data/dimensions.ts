/**
 * INNERVERSE — The 4+1 Part Dimensions (REVAMP §1.16, step 16).
 *
 * A part's T-score says HOW LOUD; five sub-axes say how stuck, rigid,
 * blended, and attended it is. All derived deterministically from existing
 * telemetry (check-ins + exercise logs + retakes) — no new items. Every axis
 * is 0–100; with no telemetry the axis is neutral 50 (never a verdict, §3C.8).
 *
 * Attunement is the master axis: the relationship that lets the other four
 * heal (IPF key insight).
 */
import { SOMATIC_ZONES, type SomaticZone } from '../../../shared/core/data/assessment-adapter';
import type { CheckIn } from '../../../shared/core/data/state-v2';
import type { AssessmentInput } from '../../../shared/core/data/scoring-v2';
import { SHADOW_PARTS, RESOURCES, type ShadowPartId, type EventType } from '../../../shared/core/data/parts';

export interface DimensionTelemetry {
  /** Confirmed check-ins (the per-part flare log). */
  checkIns: CheckIn[];
  /** Distinct event types each part was confirmed on (Role axis input). */
  eventsByPart?: Partial<Record<ShadowPartId, EventType[]>>;
  /** Completed coherence beats (prediction_error + metaprocessing logs). */
  coherenceCompletions: number;
  /** |ΔT| across the last retake, per part (0 = stable). */
  retakeTChange?: Partial<Record<ShadowPartId, number>>;
  /** Burden trend: signed change over the window (positive = worsening). */
  burdenTrend?: number;
  /** “Noticed and chose” count per part (Driver axis). */
  noticedAndChose?: Partial<Record<ShadowPartId, number>>;
  /** Soft Gaze / part-dialogue / metaprocessing events directed at the part. */
  attunementEvents?: Partial<Record<ShadowPartId, number>>;
  /** Mean self_energy at this part’s flares (0–100). */
  selfAtFlare?: Partial<Record<ShadowPartId, number>>;
  /** Modal somatic zone per part (§1.12). */
  somaticZones?: Partial<Record<ShadowPartId, SomaticZone[]>>;
}

export interface PartDimensions {
  /** 1 · Body: overheating/collapse → smooth, regulated. */
  body: number;
  /** 2 · Role: rigid tyrant/outcast → flexible team-player. */
  role: number;
  /** 3 · Story: stuck tape → live stream. */
  story: number;
  /** 4 · Driver: autopilot → co-pilot. */
  driver: number;
  /** +1 · Attunement: exiled/ignored → held in compassion (master axis). */
  attunement: number;
}

const clamp100 = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
const NEUTRAL = 50;

/**
 * Body: somatic-marker item (q8, reverse-keyed — high answer = regulated)
 * blended with mean |arousal| at this part’s flares. §1.16 row 1.
 */
function bodyAxis(part: ShadowPartId, input: AssessmentInput, t: DimensionTelemetry): number {
  const item = input.shadow[part][7]; // q8: “my body lets go easily…”
  const itemBody = (item - 1) / 4 * 100;
  const flares = t.checkIns.filter(c => c.confirmedPart === part);
  if (flares.length === 0) return clamp100(0.5 * itemBody + 0.5 * NEUTRAL);
  const meanAbs = flares.reduce((s, c) => s + Math.abs(c.arousal), 0) / flares.length;
  const arousalBody = (2 - meanAbs) / 2 * 100;
  return clamp100(0.5 * itemBody + 0.5 * arousalBody);
}

/**
 * Role: “fires everywhere = rigid; context-specific = flexible” (§1.16 row 2,
 * literal). Flexibility falls as the spread of triggering event-types grows.
 */
function roleAxis(part: ShadowPartId, t: DimensionTelemetry): number {
  const types = new Set(
    (t.eventsByPart?.[part] ??
      t.checkIns.filter(c => c.confirmedPart === part && c.eventType).map(c => c.eventType!)),
  );
  if (types.size === 0) return NEUTRAL;
  return clamp100(100 * (1 - types.size / 6));
}

/** Story: coherence-beat completion + T-stability + burden trend (§1.16 row 3). */
function storyAxis(part: ShadowPartId, t: DimensionTelemetry): number {
  const coherence = clamp100(t.coherenceCompletions * 25);
  const dT = t.retakeTChange?.[part] ?? 0;
  const stability = 100 - Math.min(100, Math.abs(dT) * 5);
  const burdenRelief = 100 - Math.min(100, (t.burdenTrend ?? 0) * 10);
  return clamp100(0.5 * coherence + 0.3 * stability + 0.2 * burdenRelief);
}

/** Driver: confirmed “took the wheel” vs “noticed and chose” (§1.16 row 4). */
function driverAxis(part: ShadowPartId, t: DimensionTelemetry): number {
  const took = t.checkIns.filter(c => c.confirmedPart === part).length;
  const chose = t.noticedAndChose?.[part] ?? 0;
  if (took + chose === 0) return NEUTRAL;
  return clamp100(100 * chose / (took + chose));
}

/**
 * +1 · Attunement: Self-relationship events directed at the part plus
 * self_energy when it is active. Raising it is the healing move.
 */
function attunementAxis(part: ShadowPartId, t: DimensionTelemetry): number {
  const events = t.attunementEvents?.[part] ?? 0;
  const selfAtFlare = t.selfAtFlare?.[part];
  if (events === 0 && selfAtFlare === undefined) return NEUTRAL; // no relationship data yet
  const eventScore = Math.min(100, events * 25);
  const self = selfAtFlare ?? NEUTRAL;
  return clamp100(0.7 * eventScore + 0.3 * self);
}

export function partDimensions(
  input: AssessmentInput,
  t: DimensionTelemetry,
): Record<ShadowPartId, PartDimensions> {
  const out = {} as Record<ShadowPartId, PartDimensions>;
  for (const part of SHADOW_PARTS) {
    out[part] = {
      body: bodyAxis(part, input, t),
      role: roleAxis(part, t),
      story: storyAxis(part, t),
      driver: driverAxis(part, t),
      attunement: attunementAxis(part, t),
    };
  }
  return out;
}

/** Axis-based targeting (§1.16): lowest axis names the indicated exercise family. */
export type AxisName = keyof PartDimensions;

export function weakestAxis(d: PartDimensions): AxisName {
  return (['body', 'role', 'story', 'driver', 'attunement'] as AxisName[])
    .reduce((a, b) => (d[b] < d[a] ? b : a));
}

/** Axis → exercise family (§1.16 table). */
export const AXIS_TARGET: Record<AxisName, string[]> = {
  body: ['regulation', 'somatic'],
  role: ['polarization'],
  story: ['prediction_error'],
  driver: ['unblending'],
  attunement: ['soft_gaze', 'part_dialogue'],
};

void SOMATIC_ZONES; void RESOURCES;
