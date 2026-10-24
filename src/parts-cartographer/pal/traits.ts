// parts/pal traits — plush characters as IFS parts (style: cutebuttons)
import { hashStr } from '../core/ports';
import { SEED_PART_COPY } from '../../shared/i18n/strings';

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

/**
 * A character without a stored seed sews from its whole trait record, so any edit would re-sew its body.
 * Freezing the seed a record already renders with keeps its look identical while later edits change only the chosen trait.
 */
export function withCharacterSeed(traits: Traits): Traits {
  if (traits.characterSeed !== undefined) return traits;
  return { ...traits, characterSeed: hashStr(JSON.stringify(traits)) };
}

export function randomTraits(family?: Family): Traits {
  const famColor: Record<Family, string> = {
    manager: "#3B9BFF",
    firefighter: "#FF8A1F",
    exile: "#FF2D8A",
    resource: "#3EE0B0",
  };
  return {
    characterSeed: Math.floor(Math.random() * 0x100000000),
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
  /**
   * Where the four coordinates come from. 'response-derived-64' is placed from the 64-item answers;
   * 'fixed-reference-147' is the shared 147-item part template, not a per-person measurement.
   */
  coordinateBasis?: 'response-derived-64' | 'fixed-reference-147';
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
  { id: "seed-planner", ...SEED_PART_COPY["seed-planner"].en, family: "manager", traits: t({ shape: "triangle", color: "#3B9BFF", eyes: "ovals", mouth: "flat", head: "beret" }),
    energy: 74, star: true, },
  { id: "seed-critic", ...SEED_PART_COPY["seed-critic"].en, family: "manager", traits: t({ shape: "egg", color: "#6ED6FF", eyes: "wink", mouth: "flat", face: "glasses", head: "beret" }),
    energy: 81, star: true, },
  { id: "seed-pleaser", ...SEED_PART_COPY["seed-pleaser"].en, family: "manager", traits: t({ shape: "heart", color: "#8B6CFF", eyes: "tiny", mouth: "smile", cheeks: true }),
    energy: 66, star: false, },
  { id: "seed-guardian", ...SEED_PART_COPY["seed-guardian"].en, family: "manager", traits: t({ shape: "frog", color: "#3B9BFF", eyes: "ovals", mouth: "flat", head: "halo" }),
    energy: 58, star: false, },
  { id: "seed-scroller", ...SEED_PART_COPY["seed-scroller"].en, family: "firefighter", traits: t({ shape: "bean", color: "#FF8A1F", eyes: "googly", mouth: "o", face: "shades" }),
    energy: 88, star: true, },
  { id: "seed-sweet", ...SEED_PART_COPY["seed-sweet"].en, family: "firefighter", traits: t({ shape: "cloud", color: "#FFD000", eyes: "closed", mouth: "grin", cheeks: true }),
    energy: 62, star: false, },
  { id: "seed-rage", ...SEED_PART_COPY["seed-rage"].en, family: "firefighter", traits: t({ shape: "frog", color: "#FF3B4E", eyes: "tiny", mouth: "grin", head: "horns" }),
    energy: 44, star: false, },
  { id: "seed-binge", ...SEED_PART_COPY["seed-binge"].en, family: "firefighter", traits: t({ shape: "egg", color: "#FF8A1F", eyes: "closed", mouth: "o" }),
    energy: 39, star: false, },
  { id: "seed-little", ...SEED_PART_COPY["seed-little"].en, family: "exile", traits: t({ shape: "bean", color: "#FF2D8A", eyes: "tiny", mouth: "none", cheeks: true }),
    energy: 31, star: true, },
  { id: "seed-hidden", ...SEED_PART_COPY["seed-hidden"].en, family: "exile", traits: t({ shape: "cloud", color: "#8B6CFF", eyes: "closed", mouth: "none", head: "horns" }),
    energy: 27, star: false, },
  { id: "seed-grief", ...SEED_PART_COPY["seed-grief"].en, family: "exile", traits: t({ shape: "heart", color: "#6ED6FF", eyes: "closed", mouth: "flat", cheeks: true }),
    energy: 35, star: false, },
  { id: "seed-first", ...SEED_PART_COPY["seed-first"].en, family: "exile", traits: t({ shape: "triangle", color: "#FF2D8A", eyes: "tiny", mouth: "o" }),
    energy: 22, star: false, },
  { id: "seed-self", ...SEED_PART_COPY["seed-self"].en, family: "resource", traits: t({ shape: "egg", color: "#3EE0B0", eyes: "ovals", mouth: "smile", head: "halo" }),
    energy: 55, star: true, },
  { id: "seed-witness", ...SEED_PART_COPY["seed-witness"].en, family: "resource", traits: t({ shape: "cloud", color: "#F3EEE4", eyes: "closed", mouth: "smile", head: "halo", cheeks: true }),
    energy: 61, star: false, },
  { id: "seed-coach", ...SEED_PART_COPY["seed-coach"].en, family: "resource", traits: t({ shape: "frog", color: "#3EE0B0", eyes: "ovals", mouth: "grin", face: "glasses", bow: true }),
    energy: 57, star: false, },
];

export const FAMILY_LABELS: Record<Family, { en: string; ru: string; icon: string; color: string }> = {
  manager: { en: "Managers", ru: "Менеджеры", icon: "🧭", color: "#3B9BFF" },
  firefighter: { en: "Firefighters", ru: "Пожарные", icon: "🧯", color: "#FF8A1F" },
  exile: { en: "Exiles", ru: "Изгнанники", icon: "🕊️", color: "#FF2D8A" },
  resource: { en: "Resources", ru: "Ресурсы", icon: "🌱", color: "#3EE0B0" },
};
