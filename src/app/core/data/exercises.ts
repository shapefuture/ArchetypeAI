/**
 * INNERVERSE — Exercise library & practice path (REVAMP §3B, §3C.9, §3D.3-5,
 * §3E.8, §3F.5). 22 types, safety-gated, expanded by the copy team to 56
 * exercises per §3B.2. Fixed template: why → steps (OODA-shaped) → stop rule
 * on YELLOW/RED.
 *
 * All bilingual copy now lives in src/i18n/strings.ts (EXERCISE_COPY).
 * This module imports from strings and preserves the original export shapes.
 *
 * HARD RULES (tested): RED is therapist-assign only and NEVER appears in solo
 * suggestions; Chapter 5 is unreachable solo; solo surfaces max 1 suggestion
 * per day by selector priority.
 */
import { selfServeGate, type CheckIn } from './state-v2';
import type { ScoredProfile } from './scoring-v2';
import { EXERCISE_COPY, EXERCISE_TYPE_MAP } from '../../../i18n/strings';

export type ExerciseTypeId =
  | 'regulation' | 'unblending' | 'part_dialogue' | 'polarization' | 'firefighter'
  | 'defusion' | 'experiment' | 'somatic' | 'self_energy' | 'resource'
  | 'relational' | 'exile_witness' | 'attribution' | 'horizon'
  | 'prediction_error' | 'polarity' | 'safe_place' | 'harmless_recording'
  | 'metaprocessing' | 'soft_gaze' | 'self_quality' | 'shadow_projection';

export type Gate = 'green' | 'yellow' | 'red';

export interface ExerciseTypeDef {
  id: ExerciseTypeId;
  gate: Gate;
  /** §3D.3 practice-path chapter 1..5. */
  chapter: 1 | 2 | 3 | 4 | 5;
}

export const EXERCISE_TYPES: Record<ExerciseTypeId, ExerciseTypeDef> = {
  regulation: { id: 'regulation', gate: 'green', chapter: 1 },
  self_energy: { id: 'self_energy', gate: 'green', chapter: 1 },
  resource: { id: 'resource', gate: 'green', chapter: 1 },
  safe_place: { id: 'safe_place', gate: 'green', chapter: 1 },
  soft_gaze: { id: 'soft_gaze', gate: 'green', chapter: 1 },
  self_quality: { id: 'self_quality', gate: 'green', chapter: 1 },
  unblending: { id: 'unblending', gate: 'green', chapter: 2 },
  attribution: { id: 'attribution', gate: 'green', chapter: 2 },
  harmless_recording: { id: 'harmless_recording', gate: 'green', chapter: 2 },
  part_dialogue: { id: 'part_dialogue', gate: 'yellow', chapter: 2 },
  metaprocessing: { id: 'metaprocessing', gate: 'green', chapter: 3 },
  polarization: { id: 'polarization', gate: 'yellow', chapter: 3 },
  firefighter: { id: 'firefighter', gate: 'yellow', chapter: 3 },
  defusion: { id: 'defusion', gate: 'yellow', chapter: 3 },
  experiment: { id: 'experiment', gate: 'yellow', chapter: 3 },
  somatic: { id: 'somatic', gate: 'yellow', chapter: 3 },
  polarity: { id: 'polarity', gate: 'yellow', chapter: 3 },
  horizon: { id: 'horizon', gate: 'green', chapter: 3 },
  relational: { id: 'relational', gate: 'yellow', chapter: 4 },
  prediction_error: { id: 'prediction_error', gate: 'yellow', chapter: 4 },
  shadow_projection: { id: 'shadow_projection', gate: 'yellow', chapter: 4 },
  exile_witness: { id: 'exile_witness', gate: 'red', chapter: 5 },
};

export interface Exercise {
  id: string;
  type: ExerciseTypeId;
  title: { en: string; ru: string };
  why: { en: string; ru: string };
  steps: { en: string[]; ru: string[] };
  stopRule?: { en: string; ru: string }; // mandatory on YELLOW/RED
}

// Build EXERCISES from the centralized copy in strings.ts
export const EXERCISES: Exercise[] = Object.entries(EXERCISE_COPY).map(([id, text]) => ({
  id,
  type: (EXERCISE_TYPE_MAP as Record<string, ExerciseTypeId>)[id] as ExerciseTypeId,
  title: { en: text.en.title, ru: text.ru.title },
  why: { en: text.en.desc, ru: text.ru.desc },
  steps: { en: text.en.steps, ru: text.ru.steps },
  stopRule: text.en.stopRule
    ? { en: text.en.stopRule, ru: text.ru.stopRule! }
    : undefined,
}));

// --- §3B.3 solo suggestion engine ---

/** Selector priority order (§3B.3). */
export const SELECTOR_PRIORITY: ExerciseTypeId[] = [
  'regulation', 'unblending', 'self_energy', 'resource', 'firefighter',
  'defusion', 'experiment', 'somatic', 'polarity', 'part_dialogue',
];

export interface SuggestInput {
  profile: ScoredProfile;
  checkIns: CheckIn[];
  now: Date;
  lastSuggestedAt?: Date | null;
}

export interface Suggestion { exercise: Exercise; type: ExerciseTypeDef; reasonKey: string; }

/** Auto-target selectors: which construct makes each type "for you" (§3B.2). */
export function selectorMatches(type: ExerciseTypeId, profile: ScoredProfile, checkIns: CheckIn[], now: Date = new Date()): boolean {
  const last7 = checkIns.filter(c =>
    (now.getTime() - new Date(c.date).getTime()) / 86400000 <= 7);
  const outOfWindow = last7.filter(c => Math.abs(c.arousal) >= 1);
  const dominant = Object.values(profile.parts).some(p => p.tier === 'dominant');
  const ffHot = ['numb', 'rebel', 'charmer'].some(p => profile.parts[p].T >= 60);
  const weakestResource = (Object.values(profile.resources)).sort((a, b) => a.T - b.T)[0];
  switch (type) {
    case 'regulation': return outOfWindow.length >= 3;
    case 'unblending': return dominant;
    case 'self_energy': return profile.selfEnergy < 50;
    case 'resource': return weakestResource.T < 45;
    case 'firefighter': return ffHot;
    case 'defusion':
    case 'experiment': return profile.activeComplexes.length > 0;
    case 'somatic': return true; // any recorded somatic zone qualifies; keep available
    case 'polarity': return profile.resourceLeaks.length > 0;
    case 'part_dialogue': return true; // top of coping stack always relevant
    default: return false;
  }
}

export function suggestExercise(input: SuggestInput): Suggestion | null {
  const { profile, lastSuggestedAt } = input;
  if (lastSuggestedAt && input.now.getTime() - lastSuggestedAt.getTime() < 24 * 60 * 60 * 1000) {
    return null; // max 1 suggestion per 24h
  }
  for (const type of SELECTOR_PRIORITY) {
    const def = EXERCISE_TYPES[type];
    if (def.gate === 'red') continue; // never auto-suggested, ever
    if (def.gate === 'yellow' && selfServeGate('yellow', profile) !== 'ok') continue;
    if (!selectorMatches(type, profile, input.checkIns, input.now)) continue;
    const exercise = EXERCISES.find(e => e.type === type);
    if (exercise) return { exercise, type: def, reasonKey: type };
  }
  return null;
}

// --- §3D.3 Practice path chapters ---

export interface ChapterState {
  descentComplete: boolean;
  daysOfCheckIns: number;
  partDialogueCompleted: boolean;
  synastryRun: boolean;
  therapistLinked: boolean;
}

export const CHAPTERS = [
  { n: 1, key: 'grounding' }, { n: 2, key: 'meeting' }, { n: 3, key: 'tending' },
  { n: 4, key: 'relating' }, { n: 5, key: 'integrating' },
] as const;

export function chapterUnlocked(chapter: 1 | 2 | 3 | 4 | 5, s: ChapterState): boolean {
  switch (chapter) {
    case 1: return s.descentComplete;
    case 2: return s.descentComplete && s.daysOfCheckIns >= 7;
    case 3: return s.partDialogueCompleted;
    case 4: return s.synastryRun || s.therapistLinked;
    case 5: return s.therapistLinked; // Ch.5 solo is UNREACHABLE by design
  }
}

/** What the user sees they may practice right now (solo). */
export function unlockedTypes(s: ChapterState): ExerciseTypeId[] {
  return (Object.values(EXERCISE_TYPES) as ExerciseTypeDef[])
    .filter(d => d.chapter <= 4 || s.therapistLinked)
    .filter(d => chapterUnlocked(d.chapter, s))
    .map(d => d.id);
}

/** §3C.8 hard rule: no card is pure narrative — every exercise ends in a step. */
export function hasBehavioralHook(e: Exercise): boolean {
  return e.steps.en.length >= 3;
}

// --- §3E.2 depth gate: never deeper into a wound than the resource online ---

/**
 * Max wound-depth beat (1..3) an exercise may reach: capped by the weaker of
 * Self energy and the strongest resource. Resource < need depth → the app
 * inserts a resource beat or closes with grounding instead.
 */
export function depthCap(profile: ScoredProfile): 1 | 2 | 3 {
  const strongestResource = Math.max(...Object.values(profile.resources).map(r => r.T));
  const weakest = Math.min(profile.selfEnergy, strongestResource);
  if (weakest < 40) return 1;
  if (weakest < 60) return 2;
  return 3;
}

/** A need-beat never exceeds the cap: the exercise stops at the allowed depth. */
export function allowedDepth(requested: 1 | 2 | 3, profile: ScoredProfile): 1 | 2 | 3 {
  return Math.min(requested, depthCap(profile)) as 1 | 2 | 3;
}

export interface ContainerState {
  safePlaceBuilt: boolean;
  /** ≥1 resource mobilized at T ≥ 50 (§3E.3). */
  resourcesMobilized: boolean;
}

/**
 * §3E.3 HARD PREREQUISITE: no exile contact (RED) without the container —
 * Safe Place built AND ≥1 resource ≥ 50T mobilized.
 */
export function containerReady(profile: ScoredProfile, s: ContainerState): boolean {
  const mobilized = Object.values(profile.resources).some(r => r.T >= 50);
  return s.safePlaceBuilt && (s.resourcesMobilized || mobilized);
}

/** RED exercises require the container AND a therapist assignment (§3B.1). */
export function redAllowed(
  profile: ScoredProfile, s: ContainerState, therapistAssigned: boolean,
): boolean {
  return therapistAssigned && containerReady(profile, s);
}

// --- §3C.5 Proceduralization Ladder ---
// 1 name the principle · 2 write the if-then plan · 3 mental rehearsal ·
// 4 live rep logged · 5 verified under load.
// HARD RULE: only rung 5 marks a skill "integrated" — insight from
// reading/reflection alone NEVER integrates (rungs 1–3 max without a live rep).

export interface LadderState {
  principleNamed?: boolean;
  ifThen?: string;
  rehearsed?: boolean;
  liveRep?: boolean;       // rung 4 — therapist-toggled in linked mode
  verifiedUnderLoad?: boolean; // rung 5 — therapist only
}

export function ladderRung(s: LadderState): 0 | 1 | 2 | 3 | 4 | 5 {
  if (s.verifiedUnderLoad) return 5;
  if (s.liveRep) return 4;
  if (s.rehearsed) return 3;
  if (s.ifThen && s.ifThen.trim().length > 5) return 2;
  if (s.principleNamed) return 1;
  return 0;
}

export function integrated(s: LadderState): boolean {
  return ladderRung(s) === 5;
}
