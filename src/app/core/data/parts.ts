/**
 * INNERVERSE — Foundational Parts Taxonomy (REVAMP_PLAN.md §1)
 *
 * Single source of truth. All tables are HARDCODED per the spec — do not
 * substitute judgment. Provisional norms are replaced via remote config
 * after ~5k users (see §1.3). Same answers -> same result, deterministic.
 */

// --- Identity types (stable API strings — never rename) ---

export type ManagerId =
  | 'taskmaster' | 'inner_critic' | 'pleaser' | 'controller'
  | 'analyst' | 'hermit' | 'bypasser';
export type FirefighterId = 'numb' | 'rebel' | 'charmer';
export type ExileId = 'abandoned' | 'ashamed' | 'frightened' | 'unseen';
export type ProtectorId = ManagerId | FirefighterId;
export type ShadowPartId = ProtectorId | ExileId;
export type ResourceId = 'sage' | 'warrior' | 'caregiver' | 'explorer';
export type PartId = ShadowPartId | ResourceId;

export type PartClass = 'manager' | 'firefighter' | 'exile' | 'resource';
/** §1.10 check-in event types. */
export type EventType = 'relational' | 'achievement' | 'loss' | 'boundary' | 'change' | 'calm';
export type Need =
  | 'safety' | 'love' | 'worth' | 'autonomy' | 'belonging' | 'meaning' | 'joy';

export const MANAGERS: ManagerId[] =
  ['taskmaster', 'inner_critic', 'pleaser', 'controller', 'analyst', 'hermit', 'bypasser'];
export const FIREFIGHTERS: FirefighterId[] = ['numb', 'rebel', 'charmer'];
export const EXILES: ExileId[] = ['abandoned', 'ashamed', 'frightened', 'unseen'];
export const PROTECTORS: ProtectorId[] = [...MANAGERS, ...FIREFIGHTERS];
export const SHADOW_PARTS: ShadowPartId[] = [...PROTECTORS, ...EXILES];
export const RESOURCES: ResourceId[] = ['sage', 'warrior', 'caregiver', 'explorer'];

export function partClass(id: PartId): PartClass {
  if ((MANAGERS as string[]).includes(id)) return 'manager';
  if ((FIREFIGHTERS as string[]).includes(id)) return 'firefighter';
  if ((EXILES as string[]).includes(id)) return 'exile';
  return 'resource';
}

// --- §1.3 Provisional norm tables (T = 50 + 10*(raw - mean)/sd, clamp 20..80) ---

export const NORM_MEAN: Record<ShadowPartId, number> = {
  taskmaster: 26, inner_critic: 25, pleaser: 26, controller: 25, analyst: 25, hermit: 22, bypasser: 21,
  numb: 22, rebel: 20, charmer: 21,
  abandoned: 21, ashamed: 21, frightened: 20, unseen: 22,
};
export const NORM_SD: Record<ShadowPartId, number> = {
  taskmaster: 6, inner_critic: 6.5, pleaser: 6, controller: 6, analyst: 6, hermit: 6, bypasser: 5.5,
  numb: 6, rebel: 5.5, charmer: 5.5,
  abandoned: 6.5, ashamed: 6.5, frightened: 6, unseen: 6.5,
};
// Resources: 6 items, raw 6..30, provisional mean 20 sd 4.5
export const RESOURCE_NORM_MEAN = 20;
export const RESOURCE_NORM_SD = 4.5;

// --- §1.3 Activation tiers ---
export type Tier = 'dormant' | 'present' | 'prominent' | 'dominant';
export function tierOf(t: number): Tier {
  if (t < 45) return 'dormant';
  if (t < 60) return 'present';
  if (t < 70) return 'prominent';
  return 'dominant';
}

// --- §1.4 Polarizations (fire when both parts >= 60T) ---
export const POLARIZATIONS: [ProtectorId, ProtectorId, string][] = [
  ['taskmaster', 'numb', 'Grind–Collapse Cycle'],
  ['pleaser', 'rebel', 'Compliance–Explosion Cycle'],
  ['controller', 'rebel', 'Clampdown–Breakout Cycle'],
  ['analyst', 'charmer', 'Freeze–Perform Split'],
  ['inner_critic', 'charmer', 'Shame–Display Split'],
  ['controller', 'numb', 'White-Knuckle–Checkout Cycle'],
  ['hermit', 'charmer', 'Cave–Stage Split'],
  ['bypasser', 'rebel', 'Halo–Havoc Cycle'],
];

// --- §1.4 Protector -> exile guardianship weights ---
export const GUARDS: Record<ProtectorId, Partial<Record<ExileId, number>>> = {
  taskmaster:   { ashamed: .7, unseen: .3 },
  inner_critic: { ashamed: .8, abandoned: .2 },
  pleaser:      { abandoned: .7, unseen: .3 },
  controller:   { frightened: .8, abandoned: .2 },
  analyst:      { frightened: .5, ashamed: .5 },
  numb:         { frightened: .4, ashamed: .3, abandoned: .3 },
  rebel:        { unseen: .5, frightened: .5 },
  charmer:      { unseen: .7, abandoned: .3 },
  hermit:       { frightened: .4, ashamed: .3, unseen: .3 },
  bypasser:     { ashamed: .4, frightened: .3, abandoned: .3 },
};

// --- §2.1 Cross-trigger matrix. Cols in EXILES order: abandoned, ashamed, frightened, unseen ---
export const TRIGGER: Record<ProtectorId, [number, number, number, number]> = {
  taskmaster:   [.2, .7, .1, .5],
  inner_critic: [.1, .8, .2, .3],
  pleaser:      [.1, .2, .1, .6],
  controller:   [.3, .4, .6, .5],
  analyst:      [.6, .3, .1, .7],
  numb:         [.8, .2, .3, .8],
  rebel:        [.5, .3, .8, .2],
  charmer:      [.6, .4, .1, .3],
  hermit:       [.8, .2, .2, .7],
  bypasser:     [.3, .5, .2, .7],
};

// --- §1.8 Core needs ---
export const NEED: Record<PartId, Need> = {
  taskmaster: 'worth', inner_critic: 'safety', pleaser: 'belonging', controller: 'safety',
  analyst: 'safety', hermit: 'safety', bypasser: 'meaning',
  numb: 'safety', rebel: 'autonomy', charmer: 'worth',
  abandoned: 'love', ashamed: 'worth', frightened: 'safety', unseen: 'belonging',
  sage: 'meaning', warrior: 'autonomy', caregiver: 'love', explorer: 'joy',
};

// --- §1.7 Complexes (activation = weighted sum of T; <55 latent, 55-61 active, >=62 gripping) ---
export type ComplexId =
  | 'abandonment' | 'inferiority' | 'power' | 'performance' | 'engulfment'
  | 'invisibility' | 'vigilance' | 'unlovability' | 'betrayal';
export interface ComplexDef {
  name: string; belief: string; experiment: string;
  weights: Partial<Record<ShadowPartId, number>>;
}
export const COMPLEXES: Record<ComplexId, ComplexDef> = {
  abandonment: { name: 'The Abandonment Complex', belief: 'I am lovable only if I am convenient and need nothing.', experiment: 'Say no to one small request and stay present with the discomfort.', weights: { abandoned: .45, pleaser: .25, charmer: .15, numb: .15 } },
  inferiority: { name: 'The Inferiority Complex', belief: 'I am fundamentally defective; if they truly saw me, they would leave.', experiment: 'Notice one self-attack and rename it: "I notice a thought that I am not enough."', weights: { ashamed: .40, inner_critic: .30, taskmaster: .20, unseen: .10 } },
  power: { name: 'The Power Complex', belief: 'If I let go of control, everything collapses.', experiment: 'Leave one small decision to someone else and observe what actually happens.', weights: { controller: .40, frightened: .30, rebel: .20, taskmaster: .10 } },
  performance: { name: 'The Performance Complex', belief: 'I have no right to fail; my worth is my output.', experiment: 'Ship one thing at "good enough" and log what actually followed.', weights: { taskmaster: .35, charmer: .25, ashamed: .25, inner_critic: .15 } },
  engulfment: { name: 'The Engulfment Complex', belief: 'If I comply, I will disappear.', experiment: 'Find one "yes" this week that does not cost you yourself — and give it freely.', weights: { rebel: .35, analyst: .25, numb: .20, unseen: .20 } },
  invisibility: { name: 'The Invisibility Complex', belief: 'I do not belong to anyone; I watch life through glass.', experiment: 'State one preference out loud, unprompted, to someone safe.', weights: { unseen: .45, pleaser: .25, analyst: .15, charmer: .15 } },
  vigilance: { name: 'The Vigilance Complex', belief: 'Danger is always near; I must not relax.', experiment: 'Set a 5-minute timer in a safe place and let your shoulders drop until it rings.', weights: { frightened: .40, controller: .25, analyst: .25, numb: .10 } },
  unlovability: { name: 'The Unlovability Complex', belief: 'My needs are a burden; love must be earned through sacrifice.', experiment: 'Ask for one small thing for yourself and accept it without repaying.', weights: { abandoned: .30, ashamed: .30, charmer: .20, pleaser: .20 } },
  betrayal: { name: 'The Betrayal Complex', belief: 'People cannot be trusted; letting anyone in means getting hurt.', experiment: 'Share one true, small thing with a safe person — and let it land.', weights: { analyst: .30, hermit: .30, frightened: .25, abandoned: .15 } },
};
export const INTERLOCKS: [ComplexId, ComplexId, string][] = [
  ['abandonment', 'engulfment', 'The Anchor and the Sail'],
  ['power', 'engulfment', 'The Grip and the Escape'],
  ['inferiority', 'performance', 'The Judge and the Contestant'],
  ['invisibility', 'performance', 'The Mirror Hunger'],
  ['unlovability', 'abandonment', 'The Proof Spiral'],
  ['vigilance', 'power', 'The Bunker Alliance'],
  ['inferiority', 'inferiority', 'The Shame Pact'],
  ['abandonment', 'abandonment', 'The Clutch'],
  ['vigilance', 'vigilance', 'The Watchtower Marriage'],
  ['betrayal', 'abandonment', 'The Test and the Reach'],
  ['betrayal', 'betrayal', 'The Parallel Fortresses'],
];

// --- §1.14 Resource balance bands (hypo <40, healthy 40-64, hyper >=65 -> spillPart) ---
export interface ResourceBand { hypoName: string; hyperName: string; spillPart: ProtectorId; }
export const RESOURCE_BANDS: Record<ResourceId, ResourceBand> = {
  sage:      { hypoName: 'The Fog of Confusion', hyperName: 'The Detached Guru', spillPart: 'analyst' },
  warrior:   { hypoName: 'The Pushover', hyperName: 'The Aggressor', spillPart: 'controller' },
  caregiver: { hypoName: 'The Cold Well', hyperName: 'The Martyr', spillPart: 'pleaser' },
  explorer:  { hypoName: 'The Stagnant', hyperName: 'The Escapist', spillPart: 'numb' },
};

// --- §1.15 Self radar: 8 C's, item i (0..7) maps to SELF_QUALITIES[i] ---
export const SELF_QUALITIES = [
  'calm', 'clarity', 'compassion', 'curiosity',
  'confidence', 'courage', 'creativity', 'connectedness',
] as const;
export type SelfQuality = typeof SELF_QUALITIES[number];

// --- §1.5 Two-tier taxonomy: 56 colored subtypes (+14 base fallbacks) ---
// Order per family: [base, colorer1..colorer4]. A colorer qualifies at T >= 45;
// subtype = highest-T colorer (ties -> earlier column); no colorer -> base.
// Subtype affects name + essay ONLY; all math uses family T-scores.

export interface SubtypeDef {
  name: string;
  slug: string;
  colorer: ShadowPartId | null; // null = base column
}
const sub = (name: string, slug: string, colorer: ShadowPartId | null = null): SubtypeDef =>
  ({ name, slug, colorer });

export const SUBTYPES: Record<ShadowPartId, SubtypeDef[]> = {
  taskmaster: [
    sub('The Striver', 'striver'),
    sub('The Perfectionist', 'perfectionist', 'inner_critic'),
    sub('The Machine', 'machine', 'controller'),
    sub('The Star Performer', 'star-performer', 'charmer'),
    sub('The Optimizer', 'optimizer', 'analyst'),
  ],
  inner_critic: [
    sub('The Critic', 'critic'),
    sub('The Slave Driver', 'slave-driver', 'taskmaster'),
    sub('The Prosecutor', 'prosecutor', 'ashamed'),
    sub('The Apologist', 'apologist', 'pleaser'),
    sub('The Auditor', 'auditor', 'analyst'),
  ],
  pleaser: [
    sub('The Helper', 'helper'),
    sub('The Clinger', 'clinger', 'abandoned'),
    sub('The Martyr', 'martyr', 'taskmaster'),
    sub('The Diplomat', 'diplomat', 'charmer'),
    sub('The Ghostwriter', 'ghostwriter', 'unseen'),
  ],
  controller: [
    sub('The Planner', 'planner'),
    sub('The Sentry', 'sentry', 'frightened'),
    sub('The Foreman', 'foreman', 'taskmaster'),
    sub('The Chessmaster', 'chessmaster', 'analyst'),
    sub('The Tyrant', 'tyrant', 'rebel'),
  ],
  analyst: [
    sub('The Observer', 'observer'),
    sub('The Wall', 'wall', 'numb'),
    sub('The Architect', 'architect', 'controller'),
    sub('The Skeptic', 'skeptic', 'inner_critic'),
    sub('The Watchtower', 'watchtower', 'frightened'),
  ],
  numb: [
    sub('The Fog', 'fog'),
    sub('The Deep Freeze', 'deep-freeze', 'analyst'),
    sub('The Escape Artist', 'escape-artist', 'charmer'),
    sub('The Hibernator', 'hibernator', 'abandoned'),
    sub('The Saboteur', 'saboteur', 'rebel'),
  ],
  rebel: [
    sub('The Rebel', 'rebel'),
    sub('The Cornered One', 'cornered-one', 'frightened'),
    sub('The Provocateur', 'provocateur', 'unseen'),
    sub('The Burnout', 'burnout', 'numb'),
    sub('The Outlaw', 'outlaw', 'charmer'),
  ],
  charmer: [
    sub('The Charmer', 'charmer'),
    sub('The Spotlight Chaser', 'spotlight-chaser', 'unseen'),
    sub('The Enchanter', 'enchanter', 'abandoned'),
    sub('The Impresario', 'impresario', 'taskmaster'),
    sub('The Flirt with Fire', 'flirt-with-fire', 'rebel'),
  ],
  hermit: [
    sub('The Hermit', 'hermit'),
    sub('The Bunker Keeper', 'bunker-keeper', 'frightened'),
    sub('The Lighthouse', 'lighthouse', 'analyst'),
    sub('The Veiled One', 'veiled-one', 'ashamed'),
    sub('The Deep Cave', 'deep-cave', 'numb'),
  ],
  bypasser: [
    sub('The Bypasser', 'bypasser'),
    sub('The Gilded Mask', 'gilded-mask', 'ashamed'),
    sub('The Blissful Helper', 'blissful-helper', 'pleaser'),
    sub('The Abstractor', 'abstractor', 'analyst'),
    sub('The Sky Gazer', 'sky-gazer', 'frightened'),
  ],
  abandoned: [
    sub('The Abandoned One', 'abandoned-one'),
    sub('The Orphan Who Serves', 'orphan-who-serves', 'pleaser'),
    sub('The Hungry Heart', 'hungry-heart', 'charmer'),
    sub('The Small Hours', 'small-hours', 'frightened'),
    sub('The Empty Room', 'empty-room', 'numb'),
  ],
  ashamed: [
    sub('The Ashamed One', 'ashamed-one'),
    sub('The Branded One', 'branded-one', 'inner_critic'),
    sub('The Impostor', 'impostor', 'taskmaster'),
    sub('The Hidden Face', 'hidden-face', 'unseen'),
    sub('The Masked One', 'masked-one', 'charmer'),
  ],
  frightened: [
    sub('The Frightened One', 'frightened-one'),
    sub('The Braced One', 'braced-one', 'controller'),
    sub('The Vigilant', 'vigilant', 'analyst'),
    sub('The Startled Child', 'startled-child', 'abandoned'),
    sub('The Frozen One', 'frozen-one', 'numb'),
  ],
  unseen: [
    sub('The Unseen One', 'unseen-one'),
    sub('The Echo', 'echo', 'charmer'),
    sub('The Good Child', 'good-child', 'pleaser'),
    sub('The Unheard Scream', 'unheard-scream', 'rebel'),
    sub('The Backroom Mind', 'backroom-mind', 'analyst'),
  ],
};
