// parts/pal traits — plush characters as IFS parts (style: cutebuttons)
export type BodyShape = "cloud" | "frog" | "triangle" | "heart" | "bean" | "egg" | "drop" | "crescent" | "square" | "flower" | "mochi" | "pentagon" | "pill";
export type EyeStyle = "ovals" | "googly" | "closed" | "wink" | "tiny";
export type MouthStyle = "none" | "smile" | "o" | "flat" | "grin";
export type Headgear = "none" | "beret" | "halo" | "horns" | "party";
export type Facewear = "none" | "glasses" | "shades";

export interface Traits {
  characterSeed?: number;
  shape: BodyShape;
  color: string;
  eyes: EyeStyle;
  mouth: MouthStyle;
  head: Headgear;
  face: Facewear;
  bow: boolean;
  cheeks: boolean;
}

export type Family = "manager" | "firefighter" | "exile" | "resource";

export const COLORS: { name: string; value: string }[] = [
  { name: "Azure", value: "#3B9BFF" },
  { name: "Lime", value: "#8BE03A" },
  { name: "Yolk", value: "#FFD000" },
  { name: "Magenta", value: "#FF2D8A" },
  { name: "Tomato", value: "#FF3B4E" },
  { name: "Tang", value: "#FF8A1F" },
  { name: "Mint", value: "#3EE0B0" },
  { name: "Grape", value: "#8B6CFF" },
  { name: "Sky", value: "#6ED6FF" },
  { name: "Cocoa", value: "#C47A3A" },
  { name: "Ink", value: "#2A2A32" },
  { name: "Chalk", value: "#F3EEE4" },
];

export const SHAPES: BodyShape[] = ["cloud", "frog", "triangle", "heart", "bean", "drop", "crescent", "square", "flower", "mochi", "pentagon", "pill", "egg"];
export const EYES: EyeStyle[] = ["ovals", "googly", "closed", "wink", "tiny"];
export const MOUTHS: MouthStyle[] = ["none", "smile", "o", "flat", "grin"];
export const HEADS: Headgear[] = ["none", "beret", "halo", "horns", "party"];
export const FACES: Facewear[] = ["none", "glasses", "shades"];

export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function randomTraits(family?: Family): Traits {
  const famColor: Record<Family, string> = {
    manager: "#3B9BFF",
    firefighter: "#FF8A1F",
    exile: "#FF2D8A",
    resource: "#3EE0B0",
  };
  return {
    shape: pick(SHAPES),
    color: family ? famColor[family] : pick(COLORS).value,
    eyes: pick(EYES),
    mouth: Math.random() < 0.5 ? "none" : pick(MOUTHS),
    head: Math.random() < 0.5 ? "none" : pick(HEADS),
    face: Math.random() < 0.6 ? "none" : pick(FACES),
    bow: Math.random() < 0.3,
    cheeks: Math.random() < 0.45,
  };
}

export interface ArchetypeMapData {
  schema: 'archetype-map.v1';
  sourceAssessment: 'legacy64' | 'descent147' | 'studio';
  coordinates: [number, number, number, number];
  cluster: string;
  prominence: number;
  size: number;
  partType?: 'manager' | 'firefighter' | 'exile' | 'self';
  developmentalOrigin?: 'pre_verbal' | 'early_attachment' | 'oedipal' | 'latency' | 'adolescent';
  description?: string;
  wound?: string;
  shadow?: string;
  invitation?: string;
  coreBelief?: string;
  attracts?: string;
}

export interface Part {
  id: string;
  name: string;
  family: Family;
  traits: Traits;
  role: string; // one-line job in the system
  blurb: string;
  energy: number; // 0..100 activation right now
  burden: string; // what it carries
  need: string; // what it needs from you / Self
  voice: string; // how it sounds inside
  star: boolean; // pinned in cabinet
  since: string;
  /** Optional coordinate-aware archetype data; ordinary user-created parts remain valid without it. */
  archetype?: ArchetypeMapData;
}

let _id = 0;
export const pid = () => `p${Date.now().toString(36)}${(_id++).toString(36)}`;

const t = (p: Partial<Traits>): Traits => ({
  shape: "bean", color: "#3B9BFF", eyes: "ovals", mouth: "smile",
  head: "none", face: "none", bow: false, cheeks: false, ...p,
});

export const SEED_PARTS: Part[] = [
  { id: "seed-planner", name: "The Planner", family: "manager", traits: t({ shape: "triangle", color: "#3B9BFF", eyes: "ovals", mouth: "flat", head: "beret" }),
    role: "Keeps the schedule tight so nothing surprises you", blurb: "Arrives at 6 AM with a list. Means well. Never rests.",
    energy: 74, burden: "\"If I stop, everything falls apart.\"", need: "Permission to delegate to the body",
    voice: "urgent, itemized", star: true, since: "age 7" },
  { id: "seed-critic", name: "Captain Critic", family: "manager", traits: t({ shape: "egg", color: "#6ED6FF", eyes: "wink", mouth: "flat", face: "glasses", head: "beret" }),
    role: "Pre-approves every move to prevent shame", blurb: "Polishes your performance until the edges bleed.",
    energy: 81, burden: "\"Good enough is dangerous.\"", need: "To be thanked, not fired",
    voice: "sharp, editorial", star: true, since: "age 9" },
  { id: "seed-pleaser", name: "Proxy", family: "manager", traits: t({ shape: "heart", color: "#8B6CFF", eyes: "tiny", mouth: "smile", cheeks: true }),
    role: "Reads the room and becomes what it wants", blurb: "Trades itself for safety, then wonders where it went.",
    energy: 66, burden: "\"My needs are a burden to others.\"", need: "A face of its own",
    voice: "soft, agreeable", star: false, since: "age 5" },
  { id: "seed-guardian", name: "Guardian", family: "manager", traits: t({ shape: "frog", color: "#3B9BFF", eyes: "ovals", mouth: "flat", head: "halo" }),
    role: "Keeps feelings below the waterline", blurb: "Mistakes stillness for peace. Very good at doors.",
    energy: 58, burden: "\"Vulnerability is an ambush.\"", need: "A window, not a wall",
    voice: "low, steady", star: false, since: "age 11" },
  { id: "seed-scroller", name: "Scroller", family: "firefighter", traits: t({ shape: "bean", color: "#FF8A1F", eyes: "googly", mouth: "o", face: "shades" }),
    role: "Numbs the room when heat rises", blurb: "Four hours gone. The feeling is still sitting there.",
    energy: 88, burden: "\"Just one more scroll.\"", need: "To be told the wave will pass",
    voice: "bright, evasive", star: true, since: "age 24" },
  { id: "seed-sweet", name: "Sweet Tooth", family: "firefighter", traits: t({ shape: "cloud", color: "#FFD000", eyes: "closed", mouth: "grin", cheeks: true }),
    role: "Brings sugar when the storm hits", blurb: "The kindest rescue in the cupboard. Also temporary.",
    energy: 62, burden: "\"Comfort must be chewable.\"", need: "Comfort that isn't consumable",
    voice: "warm, coaxing", star: false, since: "age 6" },
  { id: "seed-rage", name: "Rage Wave", family: "firefighter", traits: t({ shape: "frog", color: "#FF3B4E", eyes: "tiny", mouth: "grin", head: "horns" }),
    role: "Burns the threat down before it gets close", blurb: "Small, fast, and absolutely certain. Arrives before you do.",
    energy: 44, burden: "\"Hurt first, or be hurt.\"", need: "To stop being the family's anger",
    voice: "loud, instant", star: false, since: "age 8" },
  { id: "seed-binge", name: "Binge", family: "firefighter", traits: t({ shape: "egg", color: "#FF8A1F", eyes: "closed", mouth: "o" }),
    role: "Opens the hatch when feelings flood", blurb: "All-or-nothing by design. Believes in emergency exits.",
    energy: 39, burden: "\"Enough is a place I can't find.\"", need: "Fullness without shutdown",
    voice: "insistent, hazy", star: false, since: "age 19" },
  { id: "seed-little", name: "Little One", family: "exile", traits: t({ shape: "bean", color: "#FF2D8A", eyes: "tiny", mouth: "none", cheeks: true }),
    role: "Holds the first \"I'm too much\" lesson", blurb: "Small enough to fit under the stairs. Waiting, still.",
    energy: 31, burden: "\"Something is wrong with me.\"", need: "To be found and carried out",
    voice: "quiet, age 5", star: true, since: "age 5" },
  { id: "seed-hidden", name: "The Hidden Kid", family: "exile", traits: t({ shape: "cloud", color: "#8B6CFF", eyes: "closed", mouth: "none", head: "horns" }),
    role: "Disappears when attention gets heavy", blurb: "Has perfected the vanishing act. Calls it independence.",
    energy: 27, burden: "\"If you saw me, you'd leave.\"", need: "Witnessing without demand",
    voice: "distant, clever", star: false, since: "age 10" },
  { id: "seed-grief", name: "Grief", family: "exile", traits: t({ shape: "heart", color: "#6ED6FF", eyes: "closed", mouth: "flat", cheeks: true }),
    role: "Keeps the love that had nowhere to go", blurb: "Not a mood — a place. Quiet. Full of everyone who left.",
    energy: 35, burden: "\"If I cry, I'll never stop.\"", need: "A container with a bottom",
    voice: "low tide", star: false, since: "age 12" },
  { id: "seed-first", name: "First Hurt", family: "exile", traits: t({ shape: "triangle", color: "#FF2D8A", eyes: "tiny", mouth: "o" }),
    role: "Stores the original alarm", blurb: "Predates language. Speaks in the body, in weather.",
    energy: 22, burden: "\"The world is where pain happens.\"", need: "The past to be past",
    voice: "somatic, wordless", star: false, since: "age 3" },
  { id: "seed-self", name: "Self-Energy", family: "resource", traits: t({ shape: "egg", color: "#3EE0B0", eyes: "ovals", mouth: "smile", head: "halo" }),
    role: "The you that can hold all of them", blurb: "Calm, curious, undramatic. Shows up when nothing is forced.",
    energy: 55, burden: "—", need: "More room, fewer managers",
    voice: "warm certainty", star: true, since: "always" },
  { id: "seed-witness", name: "The Witness", family: "resource", traits: t({ shape: "cloud", color: "#F3EEE4", eyes: "closed", mouth: "smile", head: "halo", cheeks: true }),
    role: "Notices without grabbing", blurb: "Can watch a feeling for 90 seconds without narrating it.",
    energy: 61, burden: "—", need: "Daily practice",
    voice: "quiet, amused", star: false, since: "always" },
  { id: "seed-coach", name: "Inner Coach", family: "resource", traits: t({ shape: "frog", color: "#3EE0B0", eyes: "ovals", mouth: "grin", face: "glasses", bow: true }),
    role: "Asks the question behind the question", blurb: "Already knows the next right step. Speaks in questions.",
    energy: 57, burden: "—", need: "To be trusted out loud",
    voice: "curious, steady", star: false, since: "always" },
];

export const FAMILY_LABELS: Record<Family, { en: string; ru: string; icon: string; color: string }> = {
  manager: { en: "Managers", ru: "Менеджеры", icon: "🧭", color: "#3B9BFF" },
  firefighter: { en: "Firefighters", ru: "Пожарные", icon: "🧯", color: "#FF8A1F" },
  exile: { en: "Exiles", ru: "Изгнанники", icon: "🕊️", color: "#FF2D8A" },
  resource: { en: "Resources", ru: "Ресурсы", icon: "🌱", color: "#3EE0B0" },
};
