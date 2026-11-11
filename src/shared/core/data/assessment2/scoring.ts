/**
 * Assessment 2.0 scoring (docs/plans/assessment-2/plan.md §4–§5). Pure and deterministic.
 * An axis the person did not answer keeps a reference number in its slot, is listed in unmeasuredAxes, and is never shown as measured. Results are rankings within one person, not norms.
 */
import { MAP_AXIS_KEYS, clampAxis, isMapCoordinates, type MapAxisKey, type MapCoordinates } from '../map-axes';
import { SELF_QUALITIES, type SelfQuality } from '../parts';
import {
  BLENDING_OPTIONS, BLENDING_VALUE, CAPACITIES, COSTUMES, EXILES, FAMILIES, GROUND_ITEMS, MEMBER_DEFS, MEMBERS, NEEDS,
  PROVIDER_ACCESS, PROVIDER_FORMS, TIMINGS, TARGETS, EXILE_NEED, capacityDefault, exileDefault, mapFamilyFor, protectorDefault,
  type CapacityId, type CostumeId, type ExileId, type FamilyId, type GroundId, type MemberId, type NeedId, type ProviderAccess, type ProviderForm,
  type Target, type Timing, type BlendingOption,
} from './taxonomy';

export const SCENES = ['criticised', 'leftOut', 'lineCrossed', 'fellThrough', 'planChanged', 'freeEvening'] as const;
export type SceneId = (typeof SCENES)[number];

/** Families shown in each scene, in fixed card order. Attack and Appease appear 3 times; the rest 4 times. */
export const SCENE_FAMILIES: Record<SceneId, readonly FamilyId[]> = {
  criticised: ['overPerform', 'attack', 'appease', 'withdraw', 'reframe'],
  leftOut: ['pursue', 'appease', 'withdraw', 'numbSoothe', 'attack'],
  lineCrossed: ['attack', 'appease', 'overControl', 'withdraw', 'reframe'],
  fellThrough: ['numbSoothe', 'reframe', 'pursue', 'overPerform', 'overControl'],
  planChanged: ['overControl', 'overPerform', 'pursue', 'numbSoothe', 'reframe'],
  freeEvening: ['overPerform', 'numbSoothe', 'overControl', 'pursue', 'withdraw'],
};

/** Opposing needs for the need-against-need conflict (plan §3.4, type 4). */
export const OPPOSING_NEEDS: ReadonlyArray<readonly [NeedId, NeedId]> = [['connection', 'agency'], ['safety', 'aliveness']];

export const RANK_MARGIN = 0.15;
export const SKIP_CONFIRM_SHARE = 0.75;

export interface SceneAnswer {
  scene: SceneId;
  /** The reaction card chosen as "most like me", or null when skipped. */
  most: FamilyId | null;
  /** The reaction card chosen as "least like me", or null when skipped. */
  least: FamilyId | null;
}

/** Stage 5, the Centre (plan §3.3): awareness and will are integers 1 to 5 or null, and qualities are at most three of SELF_QUALITIES. */
export interface Centre {
  awareness: number | null;
  will: number | null;
  qualities: SelfQuality[];
}

export interface Assessment2Input {
  completedStages: number[];
  steadiness: number | null;
  lighter: boolean;
  scenes: SceneAnswer[];
  /** Stage 2: one member per top family, or 'none'. */
  picks: Partial<Record<FamilyId, MemberId | 'none'>>;
  /** Stage 2: null means the person skipped the timing. A missing key means not asked yet. */
  timing: Partial<Record<MemberId, Timing | null>>;
  /** Stage 2, optional: the familiar costume a protector wears (plan §3.2). Faith and ancestry are among them. */
  costume: Partial<Record<MemberId, CostumeId | null>>;
  /** Stage 3: three 1–5 frequency answers per member. */
  confirm: Partial<Record<MemberId, Array<number | null>>>;
  /** Stage 4: the exile each protector would fear, or 'none'. */
  fears: Partial<Record<MemberId, ExileId | 'none'>>;
  exileLevel: Partial<Record<ExileId, number>>;
  exileNeed: Partial<Record<ExileId, NeedId>>;
  /** Stage 5: keys are `member:<id>` or `exile:<id>`. */
  blending: Partial<Record<string, BlendingOption>>;
  providers: Partial<Record<ExileId, { access: ProviderAccess; form?: ProviderForm }>>;
  capacityEasiest: CapacityId | null;
  capacityHardest: CapacityId | null;
  ground: GroundId[];
  /**
   * Stage 6: only the axes the person set. An absent axis is not answered; depth null means "not sure".
   * Blending is not placed.
   */
  placed: Partial<Record<string, { energy?: number; direction?: number; depth?: number | null }>>;
  /** Stage 5, the Centre (plan §3.3). An absent centre is all unanswered. It is not a map part and changes no part or conflict. */
  centre?: Centre;
}

export type FamilyScores = Record<FamilyId, number | null>;

export interface RankedFamily { family: FamilyId; score: number; rank: number }

/** Stage 1 score: (most − least) ÷ appearances, over answered scenes only. Null when a family was never answered. */
export function scoreFamilies(scenes: SceneAnswer[]): FamilyScores {
  const totals = Object.fromEntries(FAMILIES.map((f) => [f, { sum: 0, n: 0 }])) as Record<FamilyId, { sum: number; n: number }>;
  for (const answer of scenes) {
    const shown = SCENE_FAMILIES[answer.scene];
    if (!shown) continue;
    const answered = answer.most !== null || answer.least !== null;
    for (const family of shown) {
      if (!answered) continue;
      totals[family].n += 1;
      if (family === answer.most) totals[family].sum += 1;
      if (family === answer.least) totals[family].sum -= 1;
    }
  }
  return Object.fromEntries(FAMILIES.map((f) => [f, totals[f].n ? totals[f].sum / totals[f].n : null])) as FamilyScores;
}

/** The three highest families, plus a fourth within RANK_MARGIN of the third. Ties keep the fixed family order. */
export function rankFamilies(scores: FamilyScores): RankedFamily[] {
  const ordered = FAMILIES
    .map((family) => ({ family, score: scores[family] }))
    .filter((entry): entry is { family: FamilyId; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score || FAMILIES.indexOf(a.family) - FAMILIES.indexOf(b.family));
  const top = ordered.slice(0, 3);
  const fourth = ordered[3];
  if (fourth && top.length === 3 && top[2].score - fourth.score <= RANK_MARGIN) top.push(fourth);
  return top.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/**
 * Stage 3 skip rule (plan §5): a family chosen "most" in at least three quarters of its appearances and
 * never "least" needs no confirmation for its member. Its level is then unknown, and only the rank is shown.
 */
export function skipsConfirm(family: FamilyId, scenes: SceneAnswer[]): boolean {
  let appearances = 0;
  let most = 0;
  let least = 0;
  for (const answer of scenes) {
    if (!SCENE_FAMILIES[answer.scene].includes(family)) continue;
    if (answer.most === null && answer.least === null) continue;
    appearances += 1;
    if (answer.most === family) most += 1;
    if (answer.least === family) least += 1;
  }
  return appearances > 0 && least === 0 && most / appearances >= SKIP_CONFIRM_SHARE;
}

/** Stage 3 level: the mean of three 1–5 answers. Fewer answers means unknown. */
export function levelOf(items: Array<number | null> | undefined): number | null {
  const values = (items ?? []).filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5);
  // The level is the mean of all three confirm items, so a partial set is unknown (plan §5).
  if (values.length < 3) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100;
}

export const CONFIDENCES = ['high', 'medium', 'low'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

/** The lead of each family over the next-ranked family. The lowest-ranked family keeps its full score as its lead. */
export function leadsOf(scores: FamilyScores): Partial<Record<FamilyId, number>> {
  const ordered = FAMILIES
    .map((family) => ({ family, score: scores[family] }))
    .filter((entry): entry is { family: FamilyId; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score || FAMILIES.indexOf(a.family) - FAMILIES.indexOf(b.family));
  const leads: Partial<Record<FamilyId, number>> = {};
  ordered.forEach((entry, index) => { leads[entry.family] = entry.score - (ordered[index + 1]?.score ?? 0); });
  return leads;
}

/**
 * Confidence for one protector. The checks run in this order, and the first one that applies decides (plan §5, G3):
 * 1. The lead over the next family is narrower than RANK_MARGIN: low, on every path.
 * 2. The confirm items were skipped (scenes alone): medium.
 * 3. The confirm items were not answered: null.
 * 4. The confirm level is below 3: low.
 * 5. Otherwise high when the score is at least 0.25, and medium when it is below.
 */
export function confidenceOf(score: number, level: number | null, skipped: boolean, lead = Number.POSITIVE_INFINITY): Confidence | null {
  if (lead < RANK_MARGIN) return 'low';   // G3: a narrow margin is low on every path
  if (skipped) return 'medium';           // scenes alone, wide margin
  if (level === null) return null;        // confirm items not answered
  if (level < 3) return 'low';
  return score >= 0.25 ? 'high' : 'medium';
}

/** Whether the person answered depth: set it, said not sure, or left it unanswered. */
export type DepthState = 'set' | 'unsure' | 'unanswered';

/** Where an exile's need came from: a need the person stored on the wants screen, or the table default (plan §4 stage 5). */
export const NEED_SOURCES = ['user', 'table'] as const;
export type NeedSource = (typeof NEED_SOURCES)[number];

export interface MapPart {
  key: string;
  kind: 'protector' | 'exile' | 'capacity';
  member?: MemberId;
  exile?: ExileId;
  capacity?: CapacityId;
  family?: FamilyId;
  /** The timing the person chose for a protector, or null when skipped. Absent for other kinds. */
  timing?: Timing | null;
  /** False exactly when timing is null. Exiles and capacities have no timing, so it is true for them. */
  classKnown: boolean;
  target?: Target;
  rank: number | null;
  level: number | null;
  confidence: Confidence | null;
  /** Exile ids this protector guards (plan §6 guards). */
  guards: ExileId[];
  costume: CostumeId | null;
  need?: NeedId;
  /** Exile parts only. Absent on results saved before this field existed. */
  needSource?: NeedSource;
  provider?: { access: ProviderAccess; form: ProviderForm | null };
  placement: 'placed' | 'default';
  coordinates: MapCoordinates;
  unmeasuredAxes: MapAxisKey[];
  depthState: DepthState;
  blending: BlendingOption | null;
  mapFamily: 'manager' | 'firefighter' | 'exile' | 'resource';
}

export const CONFLICT_TYPES = ['strategy-against-strategy', 'protector-against-exile', 'critic-against-criticised', 'need-against-need'] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];
export interface Conflict { type: ConflictType; keys: string[] }

export interface Assessment2Result {
  instrument: 'parts-2';
  version: 1;
  completedStages: number[];
  steadiness: number | null;
  lighter: boolean;
  familyScores: FamilyScores;
  topFamilies: RankedFamily[];
  parts: MapPart[];
  ground: GroundId[];
  conflicts: Conflict[];
  /** True when the exile level of three or more named exiles is 5, or steadiness is 1. */
  supportPrompt: boolean;
  /** The sanitized Centre (plan §3.3). Absent on results saved before it existed. It is not a map part. */
  centre?: Centre;
}

const keyFor = (kind: 'member' | 'exile' | 'capacity', id: string) => `${kind}:${id}`;

/**
 * Coordinates for one part. An axis the person did not set is unknown: its slot holds the reference value so the
 * shape stays complete, and it is listed in unmeasuredAxes. Only axes the person set count as answers.
 */
function coordsFor(key: string, fallback: MapCoordinates, placed: Assessment2Input['placed'], blending: BlendingOption | null) {
  const place = placed[key] ?? {};
  const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
  const energySet = finite(place.energy);
  const directionSet = finite(place.direction);
  const depthSet = finite(place.depth);
  const base: MapCoordinates = [
    energySet ? clampAxis(place.energy as number) : fallback[0],
    directionSet ? clampAxis(place.direction as number) : fallback[1],
    depthSet ? clampAxis(place.depth as number) : fallback[2],
    0,
  ];
  const unmeasured: MapAxisKey[] = [];
  if (!energySet) unmeasured.push('ENERGY');
  if (!directionSet) unmeasured.push('DIRECTION');
  if (!depthSet) unmeasured.push('DEPTH');
  if (blending) base[3] = clampAxis(BLENDING_VALUE[blending]);
  else unmeasured.push('BLENDING');
  const depthState: DepthState = depthSet ? 'set' : place.depth === null ? 'unsure' : 'unanswered';
  const placement = energySet || directionSet || depthSet ? 'placed' : 'default';
  return { coordinates: base, unmeasuredAxes: unmeasured, depthState, placement: placement as 'placed' | 'default' };
}

/** Attack members whose default target is self. Conflict type 3 treats them as the critic. Derived from MEMBER_DEFS. */
export const SELF_ATTACK_MEMBERS: readonly MemberId[] = MEMBERS.filter((id) => MEMBER_DEFS[id].family === 'attack' && MEMBER_DEFS[id].defaultTarget === 'self');

/** Plan §3.4, derived from the finished parts. Types 1 and 2 are checked before 3 and 4. */
export function deriveConflicts(parts: MapPart[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const protectors = parts.filter((p) => p.kind === 'protector' && p.family);
  const exiles = parts.filter((p) => p.kind === 'exile' && p.exile);
  for (let i = 0; i < protectors.length; i++) {
    for (let j = i + 1; j < protectors.length; j++) {
      const a = protectors[i];
      const b = protectors[j];
      const shared = a.guards.some((e) => b.guards.includes(e));
      // Only an axis both parts have answered can separate them. A reference value is not an answer.
      const answered = (part: MapPart, axis: MapAxisKey) => !part.unmeasuredAxes.includes(axis);
      const apart = (answered(a, MAP_AXIS_KEYS[0]) && answered(b, MAP_AXIS_KEYS[0]) && Math.abs(a.coordinates[0] - b.coordinates[0]) >= 1)
        || (answered(a, MAP_AXIS_KEYS[1]) && answered(b, MAP_AXIS_KEYS[1]) && Math.abs(a.coordinates[1] - b.coordinates[1]) >= 1);
      if (shared && apart) conflicts.push({ type: 'strategy-against-strategy', keys: [a.key, b.key] });
    }
  }
  for (const protector of protectors) {
    if (!protector.blending || BLENDING_VALUE[protector.blending] < 0.4) continue;
    for (const exile of exiles) {
      if (protector.guards.includes(exile.exile!) && exile.level !== null && exile.level >= 4) {
        conflicts.push({ type: 'protector-against-exile', keys: [protector.key, exile.key] });
      }
    }
  }
  const critic = protectors.find((p) => p.member !== undefined && SELF_ATTACK_MEMBERS.includes(p.member) && p.target === 'self');
  const ashamed = exiles.find((e) => e.exile === 'ashamed');
  if (critic && ashamed) conflicts.push({ type: 'critic-against-criticised', keys: [critic.key, ashamed.key] });
  // Only exiles with a measured level can be ranked against each other; an unknown level is never zero.
  const top = exiles.filter((e) => e.level !== null).sort((a, b) => (b.level as number) - (a.level as number)).slice(0, 2);
  if (top.length === 2 && top[0].need && top[1].need && OPPOSING_NEEDS.some(([x, y]) =>
    (top[0].need === x && top[1].need === y) || (top[0].need === y && top[1].need === x))) {
    conflicts.push({ type: 'need-against-need', keys: top.map((p) => p.key) });
  }
  return conflicts;
}

/** Build the full result from the answers so far. Every field that was not answered stays null or empty. */
export function buildAssessment2Result(input: Assessment2Input): Assessment2Result {
  const familyScores = scoreFamilies(input.scenes);
  const topFamilies = rankFamilies(familyScores);
  const leads = leadsOf(familyScores);
  const parts: MapPart[] = [];

  for (const { family, rank, score } of topFamilies) {
    const pick = input.picks[family];
    if (!pick || pick === 'none') continue;
    const def = MEMBER_DEFS[pick];
    // A skipped or unasked timing stays null. It is never filled from the member's default (plan §3.1, D1).
    const timing: Timing | null = input.timing[pick] ?? null;
    const skipped = skipsConfirm(family, input.scenes);
    const level = skipped ? null : levelOf(input.confirm[pick]);
    // The lighter path has no stage 4, so a stored fear guards nothing there. The answer stays in the input (plan §3.3, G4).
    const fear = input.fears[pick];
    const guards = !input.lighter && fear && fear !== 'none' ? [fear] : [];
    const key = keyFor('member', pick);
    const blending = input.blending[key] ?? null;
    const placedCoords = coordsFor(key, protectorDefault(pick, timing), input.placed, blending);
    parts.push({
      key, kind: 'protector', member: pick, family, timing, classKnown: timing !== null, target: def.defaultTarget,
      rank, level, confidence: confidenceOf(score, level, skipped, leads[family] ?? 0), guards, costume: input.costume?.[pick] ?? null,
      placement: placedCoords.placement, coordinates: placedCoords.coordinates, unmeasuredAxes: placedCoords.unmeasuredAxes,
      depthState: placedCoords.depthState,
      blending, mapFamily: mapFamilyFor('protector', timing),
    } as MapPart);
  }

  if (!input.lighter) {
    const named = new Set<ExileId>();
    // Only members the person picked name an exile. A fear left on a member who was later changed is ignored.
    for (const member of MEMBERS) {
      if (input.picks[MEMBER_DEFS[member].family] !== member) continue;
      const fear = input.fears[member];
      if (fear && fear !== 'none') named.add(fear);
    }
    for (const exile of EXILES) {
      if (!named.has(exile)) continue;
      const key = keyFor('exile', exile);
      const blending = input.blending[key] ?? null;
      const coords = coordsFor(key, exileDefault(exile), input.placed, blending);
      const provider = input.providers[exile];
      const chosenNeed = input.exileNeed[exile];
      parts.push({
        key, kind: 'exile', exile, classKnown: true, rank: null, level: input.exileLevel[exile] ?? null, confidence: null,
        guards: [], costume: null, need: chosenNeed ?? EXILE_NEED[exile], needSource: chosenNeed ? 'user' : 'table',
        provider: provider ? { access: provider.access, form: provider.form ?? null } : undefined,
        placement: coords.placement, coordinates: coords.coordinates, unmeasuredAxes: coords.unmeasuredAxes, depthState: coords.depthState,
        blending, mapFamily: 'exile',
      } as MapPart);
    }
  }

  for (const capacity of [input.capacityEasiest, input.capacityHardest]) {
    if (!capacity || !CAPACITIES.includes(capacity) || parts.some((p) => p.capacity === capacity)) continue;
    const key = keyFor('capacity', capacity);
    const coords = coordsFor(key, capacityDefault(capacity), input.placed, null);
    parts.push({
      key, kind: 'capacity', capacity, classKnown: true, rank: null, level: null, confidence: null, guards: [], costume: null,
      placement: coords.placement, coordinates: coords.coordinates, unmeasuredAxes: coords.unmeasuredAxes, depthState: coords.depthState,
      blending: null, mapFamily: 'resource',
    } as MapPart);
  }

  // Exile levels for the support prompt: three or more named exiles at level 5.
  const fiveLevels = parts.filter((p) => p.kind === 'exile' && p.level === 5).length;
  const supportPrompt = fiveLevels >= 3 || input.steadiness === 1;

  return {
    instrument: 'parts-2',
    version: 1,
    completedStages: [...new Set(input.completedStages)].sort((a, b) => a - b),
    steadiness: input.steadiness,
    lighter: input.lighter,
    familyScores,
    topFamilies,
    parts,
    ground: [...new Set(input.ground)].filter((g) => GROUND_ITEMS.includes(g)),
    conflicts: deriveConflicts(parts),
    supportPrompt,
    centre: sanitizeCentre(input.centre),
  };
}

// --- Validation for stored results (plan §6). Rejects anything that could read as a measurement it is not. ---

const isRecord = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

/** Keeps only the axis values a person actually set. Anything else in a stored draft is dropped, never read as an answer. */
export function sanitizePlaced(value: unknown): Assessment2Input['placed'] {
  const out: Assessment2Input['placed'] = {};
  if (!value || typeof value !== 'object') return out;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const fields = raw as Record<string, unknown>;
    const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    const energy = number(fields.energy);
    const direction = number(fields.direction);
    const depth = fields.depth === null ? null : number(fields.depth);
    const kept: { energy?: number; direction?: number; depth?: number | null } = {};
    if (energy !== undefined) kept.energy = energy;
    if (direction !== undefined) kept.direction = direction;
    if (depth !== undefined) kept.depth = depth;
    if (Object.keys(kept).length > 0) out[key] = kept;
  }
  return out;
}

const isCentreRating = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;

/**
 * Keeps only valid Centre values (plan §3.3). Awareness and will are integers 1 to 5, and anything else becomes null.
 * Qualities keep the SELF_QUALITIES values in the order given, drop repeats, and keep at most three. An absent or
 * non-record centre is all unanswered.
 */
export function sanitizeCentre(centre: unknown): Centre {
  const source: Record<string, any> = isRecord(centre) ? centre : {};
  const qualities: SelfQuality[] = [];
  for (const quality of Array.isArray(source.qualities) ? source.qualities : []) {
    if (qualities.length === 3) break;
    if (oneOf(SELF_QUALITIES, quality) && !qualities.includes(quality)) qualities.push(quality);
  }
  return {
    awareness: isCentreRating(source.awareness) ? source.awareness : null,
    will: isCentreRating(source.will) ? source.will : null,
    qualities,
  };
}

/** A stored Centre: awareness and will are null or integers 1 to 5, and qualities has at most three different SELF_QUALITIES. */
function isCentre(value: unknown): value is Centre {
  if (!isRecord(value)) return false;
  const rating = (v: unknown) => v === null || isCentreRating(v);
  return rating(value.awareness) && rating(value.will)
    && Array.isArray(value.qualities) && value.qualities.length <= 3
    && value.qualities.every((quality: unknown) => oneOf(SELF_QUALITIES, quality))
    && new Set(value.qualities).size === value.qualities.length;
}

export function isAssessment2Result(value: unknown): value is Assessment2Result {
  if (!isRecord(value) || value.instrument !== 'parts-2' || value.version !== 1) return false;
  if (!Array.isArray(value.parts) || !Array.isArray(value.conflicts) || !Array.isArray(value.topFamilies) || !isRecord(value.familyScores)) return false;
  if (!FAMILIES.every((f) => value.familyScores[f] === null || (typeof value.familyScores[f] === 'number' && Math.abs(value.familyScores[f]) <= 1))) return false;
  // The result view looks up copy by these stored values, and a value outside its map throws. Each field the view reads is checked here.
  if (value.supportPrompt !== undefined && typeof value.supportPrompt !== 'boolean') return false;
  // The Centre is optional, so a result saved before it existed passes. When present it must be a valid Centre (plan §3.3).
  if (value.centre !== undefined && !isCentre(value.centre)) return false;
  if (!value.topFamilies.every((entry: unknown) => isRecord(entry)
    && oneOf(FAMILIES, entry.family)
    && typeof entry.score === 'number' && Math.abs(entry.score) <= 1
    && Number.isInteger(entry.rank))) return false;
  if (!value.conflicts.every((conflict: unknown) => isRecord(conflict)
    && oneOf(CONFLICT_TYPES, conflict.type)
    && Array.isArray(conflict.keys) && conflict.keys.every((key: unknown) => typeof key === 'string'))) return false;
  return value.parts.every((part: unknown) => isRecord(part)
    && typeof part.key === 'string'
    && (part.kind === 'protector' || part.kind === 'exile' || part.kind === 'capacity')
    && isMapCoordinates(part.coordinates)
    && Array.isArray(part.unmeasuredAxes) && part.unmeasuredAxes.every((k: unknown) => (MAP_AXIS_KEYS as readonly unknown[]).includes(k))
    && (part.depthState === 'set' || part.depthState === 'unsure' || part.depthState === 'unanswered')
    && ((part.depthState === 'set') === !part.unmeasuredAxes.includes('DEPTH'))
    && (part.level === null || (typeof part.level === 'number' && part.level >= 1 && part.level <= 5))
    && (part.rank === null || Number.isInteger(part.rank))
    && (part.confidence === null || oneOf(CONFIDENCES, part.confidence))
    && (part.placement === 'placed' || part.placement === 'default')
    && (part.kind !== 'protector' || (oneOf(MEMBERS, part.member) && oneOf(FAMILIES, part.family) && (part.timing === null || oneOf(TIMINGS, part.timing)) && oneOf(TARGETS, part.target)))
    && (part.kind !== 'exile' || oneOf(EXILES, part.exile) && oneOf(NEEDS, part.need))
    && (part.need === undefined || oneOf(NEEDS, part.need))
    && Array.isArray(part.guards) && part.guards.every((guard: unknown) => oneOf(EXILES, guard))
    && (part.needSource === undefined || (part.kind === 'exile' && oneOf(NEED_SOURCES, part.needSource)))
    && (part.kind !== 'capacity' || oneOf(CAPACITIES, part.capacity))
    && (part.provider === undefined || (isRecord(part.provider) && oneOf(PROVIDER_ACCESS, part.provider.access) && (part.provider.form === null || oneOf(PROVIDER_FORMS, part.provider.form))))
    && (part.blending === null || oneOf(BLENDING_OPTIONS, part.blending))
    && (part.costume === null || part.costume === undefined || oneOf(COSTUMES, part.costume)));
}

/** Confirms that a stored result lists only known ground items. Used by the storage reader. */
export const knownGround = (items: unknown): GroundId[] => (Array.isArray(items) ? items : []).filter((g): g is GroundId => oneOf(GROUND_ITEMS, g));
