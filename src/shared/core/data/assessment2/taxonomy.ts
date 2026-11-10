/**
 * Assessment 2.0 taxonomy (docs/plans/assessment-2/plan.md §3). Pure data and lookups, no copy.
 * Copy lives in ./content.ts. Existing 147-item part ids are kept unchanged; new members are additive.
 * Every value here is an educated guess from the plan, not a validated norm.
 */
import type { MapCoordinates } from '../map-axes';

export const ASSESSMENT2_VERSION = 1 as const;

// --- Needs and exiles (§3.1) ---

export const NEEDS = ['safety', 'connection', 'attunement', 'worth', 'agency', 'aliveness'] as const;
export type NeedId = (typeof NEEDS)[number];

export const EXILES = ['frightened', 'betrayed', 'abandoned', 'outsider', 'unseen', 'ashamed', 'powerless', 'stifled'] as const;
export type ExileId = (typeof EXILES)[number];

export const EXILE_NEED: Record<ExileId, NeedId> = {
  frightened: 'safety',
  betrayed: 'safety',
  abandoned: 'connection',
  outsider: 'connection',
  unseen: 'attunement',
  ashamed: 'worth',
  powerless: 'agency',
  stifled: 'aliveness',
};

/** Default placement of an exile, from the plan's depth rule (−0.7) and a guessed energy and direction. */
export const EXILE_DEFAULT: Record<ExileId, { energy: number; direction: number }> = {
  frightened: { energy: 0.3, direction: -0.4 },
  betrayed: { energy: 0.2, direction: -0.6 },
  abandoned: { energy: 0.1, direction: 0.8 },
  outsider: { energy: -0.2, direction: -0.5 },
  unseen: { energy: -0.4, direction: 0.2 },
  ashamed: { energy: -0.3, direction: -0.5 },
  powerless: { energy: -0.6, direction: 0.1 },
  stifled: { energy: -0.7, direction: -0.2 },
};
export const EXILE_DEPTH_DEFAULT = -0.7;

// --- Protector families and members (§3.2) ---

export const FAMILIES = ['overPerform', 'overControl', 'attack', 'appease', 'pursue', 'withdraw', 'numbSoothe', 'reframe'] as const;
export type FamilyId = (typeof FAMILIES)[number];

/** Plan §5.1: default energy and direction per family. Depth comes from timing. */
export const FAMILY_DEFAULT: Record<FamilyId, { energy: number; direction: number }> = {
  overPerform: { energy: 0.7, direction: 0.0 },
  overControl: { energy: 0.5, direction: -0.1 },
  attack: { energy: 0.8, direction: 0.3 },
  appease: { energy: 0.2, direction: 0.8 },
  pursue: { energy: 0.6, direction: 0.9 },
  withdraw: { energy: -0.4, direction: -0.8 },
  numbSoothe: { energy: -0.8, direction: -0.5 },
  reframe: { energy: -0.1, direction: -0.3 },
};

export const PROTECTOR_DEPTH_DEFAULT: Record<'preventive' | 'reactive', number> = { preventive: 0.6, reactive: 0.3 };

export type Timing = 'preventive' | 'reactive';
export type Target = 'self' | 'others' | 'situation';
export const TIMINGS: readonly Timing[] = ['preventive', 'reactive'];
export const TARGETS: readonly Target[] = ['self', 'others', 'situation'];

export const MEMBERS = [
  'taskmaster', 'perfectionist',
  'controller', 'worrier', 'scanner',
  'inner_critic', 'rebel', 'superior', 'blamer', 'underminer',
  'pleaser', 'caretaker', 'chameleon', 'martyr',
  'charmer', 'clinger', 'helpless',
  'hermit', 'analyst', 'avoider',
  'numb', 'soother', 'thrill_seeker',
  'bypasser', 'rationaliser', 'minimiser', 'funster', 'dreamer',
] as const;
export type MemberId = (typeof MEMBERS)[number];

export interface MemberDef {
  id: MemberId;
  family: FamilyId;
  /** Member ids from the 147-item battery keep their names. */
  legacy147: boolean;
  /** Default target; a per-instance answer is not asked in version 1 (plan §12 limitation). */
  defaultTarget: Target;
  /** Default timing used only for the provisional placement before the person answers. */
  defaultTiming: Timing;
}

const m = (id: MemberId, family: FamilyId, defaultTarget: Target, defaultTiming: Timing, legacy147 = false): MemberDef =>
  ({ id, family, defaultTarget, defaultTiming, legacy147 });

export const MEMBER_DEFS: Record<MemberId, MemberDef> = {
  taskmaster: m('taskmaster', 'overPerform', 'self', 'preventive', true),
  perfectionist: m('perfectionist', 'overPerform', 'self', 'preventive'),
  controller: m('controller', 'overControl', 'situation', 'preventive', true),
  worrier: m('worrier', 'overControl', 'situation', 'preventive'),
  scanner: m('scanner', 'overControl', 'others', 'preventive'),
  inner_critic: m('inner_critic', 'attack', 'self', 'reactive', true),
  rebel: m('rebel', 'attack', 'others', 'reactive', true),
  superior: m('superior', 'attack', 'others', 'reactive'),
  blamer: m('blamer', 'attack', 'others', 'reactive'),
  underminer: m('underminer', 'attack', 'others', 'reactive'),
  pleaser: m('pleaser', 'appease', 'others', 'preventive', true),
  caretaker: m('caretaker', 'appease', 'others', 'preventive'),
  chameleon: m('chameleon', 'appease', 'others', 'preventive'),
  martyr: m('martyr', 'appease', 'self', 'preventive'),
  charmer: m('charmer', 'pursue', 'others', 'reactive', true),
  clinger: m('clinger', 'pursue', 'others', 'reactive'),
  helpless: m('helpless', 'pursue', 'situation', 'reactive'),
  hermit: m('hermit', 'withdraw', 'self', 'preventive', true),
  analyst: m('analyst', 'withdraw', 'self', 'preventive', true),
  avoider: m('avoider', 'withdraw', 'situation', 'preventive'),
  numb: m('numb', 'numbSoothe', 'self', 'reactive', true),
  soother: m('soother', 'numbSoothe', 'self', 'reactive'),
  thrill_seeker: m('thrill_seeker', 'numbSoothe', 'situation', 'reactive'),
  bypasser: m('bypasser', 'reframe', 'situation', 'preventive', true),
  rationaliser: m('rationaliser', 'reframe', 'situation', 'preventive'),
  minimiser: m('minimiser', 'reframe', 'situation', 'preventive'),
  funster: m('funster', 'reframe', 'others', 'reactive'),
  dreamer: m('dreamer', 'reframe', 'situation', 'preventive'),
};

export const membersOf = (family: FamilyId): MemberId[] => MEMBERS.filter((id) => MEMBER_DEFS[id].family === family);

// --- Costumes (§3.2, faith and humour kept as costumes, never as families) ---

export const COSTUMES = ['faith', 'humour', 'reason', 'work', 'food', 'screens', 'body', 'money', 'sex', 'ancestry'] as const;
export type CostumeId = (typeof COSTUMES)[number];

// --- Capacities (the healthy twin of each family, §3.3) ---

export const CAPACITIES = ['maker', 'steward', 'warrior', 'caregiver', 'reacher', 'sage', 'player', 'meaningMaker'] as const;
export type CapacityId = (typeof CAPACITIES)[number];

/** Capacities sit at their family's position, except the player, whose twin is set explicitly (guess). */
export const CAPACITY_FAMILY: Record<CapacityId, FamilyId | null> = {
  maker: 'overPerform',
  steward: 'overControl',
  warrior: 'attack',
  caregiver: 'appease',
  reacher: 'pursue',
  sage: 'withdraw',
  player: null,
  meaningMaker: 'reframe',
};
export const CAPACITY_DEFAULT_OVERRIDE: Partial<Record<CapacityId, { energy: number; direction: number }>> = {
  player: { energy: 0.4, direction: 0.4 },
};
export const CAPACITY_DEPTH_DEFAULT = 0.4;

// --- Providers (§3.1 and §3.3). A provider role is the need's counterpart. ---

export const PROVIDER_ROLES = ['guardian', 'companion', 'mirror', 'blesser', 'mentor', 'playmate'] as const;
export type ProviderRole = (typeof PROVIDER_ROLES)[number];

export const NEED_PROVIDER: Record<NeedId, ProviderRole> = {
  safety: 'guardian',
  connection: 'companion',
  attunement: 'mirror',
  worth: 'blesser',
  agency: 'mentor',
  aliveness: 'playmate',
};

export const PROVIDER_FORMS = [
  'ownAdult', 'realPerson', 'idealParent', 'ancestor', 'animalHelper', 'place', 'faithFigure', 'fictional', 'futureSelf',
] as const;
export type ProviderForm = (typeof PROVIDER_FORMS)[number];

export const PROVIDER_ACCESS = ['easy', 'effort', 'none'] as const;
export type ProviderAccess = (typeof PROVIDER_ACCESS)[number];

export const GROUND_ITEMS = [
  'calmPlace', 'bodyAnchor', 'breath', 'containerForLater', 'nature', 'realPeople', 'ritualOrPrayer', 'ancestralRemembrance',
] as const;
export type GroundId = (typeof GROUND_ITEMS)[number];

export const BLENDING_OPTIONS = ['curious', 'warm', 'neutral', 'annoyed', 'afraid', 'itIsMe'] as const;
export type BlendingOption = (typeof BLENDING_OPTIONS)[number];
/** Plan §5 values; `neutral` is 0 and was added to the plan's five options. */
export const BLENDING_VALUE: Record<BlendingOption, number> = {
  curious: -0.6, warm: -0.6, neutral: 0, annoyed: 0.4, afraid: 0.4, itIsMe: 1,
};

export const LEVEL_SCALE = [1, 2, 3, 4, 5] as const;

// --- Defaults used before the person places a part (§5.1) ---

export const clampUnit = (value: number) => Math.max(-1, Math.min(1, value));

export function protectorDefault(member: MemberId, timing: Timing): MapCoordinates {
  const def = MEMBER_DEFS[member];
  const family = FAMILY_DEFAULT[def.family];
  return [clampUnit(family.energy), clampUnit(family.direction), PROTECTOR_DEPTH_DEFAULT[timing], 0];
}

export function exileDefault(exile: ExileId): MapCoordinates {
  const at = EXILE_DEFAULT[exile];
  return [at.energy, at.direction, EXILE_DEPTH_DEFAULT, 0];
}

export function capacityDefault(capacity: CapacityId): MapCoordinates {
  const family = CAPACITY_FAMILY[capacity];
  const at = CAPACITY_DEFAULT_OVERRIDE[capacity] ?? (family ? FAMILY_DEFAULT[family] : { energy: 0, direction: 0 });
  return [clampUnit(at.energy), clampUnit(at.direction), CAPACITY_DEPTH_DEFAULT, 0];
}

/** Part family classes used by the existing map: a preventive protector is a manager, a reactive one a firefighter. */
export function mapFamilyFor(kind: 'protector' | 'exile' | 'capacity', timing?: Timing): 'manager' | 'firefighter' | 'exile' | 'resource' {
  if (kind === 'exile') return 'exile';
  if (kind === 'capacity') return 'resource';
  return timing === 'reactive' ? 'firefighter' : 'manager';
}
