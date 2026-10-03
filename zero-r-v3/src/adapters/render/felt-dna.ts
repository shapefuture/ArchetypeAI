/**
 * felt-dna.ts — turns a ZERO-R part into a Felt Atelier doll.
 *
 * The mapping is deterministic: the same part sews the same character on every
 * reload and every device, because the seed is a hash of the part id and every
 * other trait is derived from the part's own data (category, activation).
 *
 * This file draws nothing. It produces DNA; `felt.ts` runs the atelier engine to
 * turn that DNA into geometry.
 */
import type { Part, PartCategory } from "../../domain/content.js";
import { PARTS, PARTS_BY_CATEGORY } from "../../domain/content.js";
import { COLORS } from "../../design/tokens.js";
import { generate, hashStr, oklab, deltaE, FELT, TEMPLATE } from "felt-atelier/dna";
import type { FeltDna, Mood } from "felt-atelier/dna";

/** The atelier's own vocabulary — these are the engine's slots, not invented ones. */
export type Dna = FeltDna;

/** Managers scan and brace, firefighters flare, exiles curl inward. */
const MOODS: Record<PartCategory, Mood[]> = {
  manager: ["grumpy", "smirk", "side", "content"],
  firefighter: ["surprised", "wink", "happy", "smirk"],
  exile: ["sleepy", "grumpy", "content", "side"],
};
/** The engine reads these axes as body-language priors (agency -> angular/rounded, etc). */
const AXES: Record<PartCategory, { agency: number; temperature: number; focus: number; attachment: number }> = {
  manager: { agency: -0.45, temperature: -0.25, focus: 0.5, attachment: 0.15 },
  firefighter: { agency: 0.55, temperature: 0.5, focus: -0.3, attachment: -0.1 },
  exile: { agency: -0.55, temperature: -0.3, focus: -0.45, attachment: -0.4 },
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const hueAngle = (c: [number, number, number]) => Math.atan2(c[2]!, c[1]!) * 180 / Math.PI;
const chroma = (c: [number, number, number]) => Math.hypot(c[1]!, c[2]!);

/**
 * How a UI colour becomes a felt swatch. Hue dominates (a manager must read blue, not
 * merely cool), then lightness, then chroma — with a penalty on the deep end of the
 * shelf, because swamp-dark felt disappears against this app's night background.
 */
const WEIGHT = { hue: 1 / 80, lightness: 0.7, chroma: 1, dark: 2, floor: 0.62, window: 50 };

function rankFelts(hex: string, taken: ReadonlySet<string>): string[] {
  const t = oklab(hex);
  const ht = hueAngle(t), ct = chroma(t), lt = t[0]!;
  return Object.entries(FELT.wool)
    .filter(([name]) => !taken.has(name))
    .map(([name, feltHex]) => {
      const c = oklab(feltHex as string);
      const dh = Math.abs(((hueAngle(c) - ht + 540) % 360) - 180);
      const cost = WEIGHT.hue * dh
        + WEIGHT.lightness * Math.abs(c[0]! - lt)
        + WEIGHT.chroma * Math.abs(chroma(c) - ct)
        + WEIGHT.dark * Math.max(0, WEIGHT.floor - c[0]!);
      return { name, cost, dh };
    })
    .filter((c) => c.dh <= WEIGHT.window)
    .sort((a, b) => a.cost - b.cost)
    .map((c) => c.name);
}

/**
 * Three swatches per category, claimed greedily from one shelf: a swatch can belong to
 * only one category, so "managers are the cool ones / firefighters the warm ones /
 * exiles the purple ones" stays true even where the hues sit close together.
 */
export const PALETTE: Record<PartCategory, string[]> = (() => {
  const taken = new Set<string>();
  const out = {} as Record<PartCategory, string[]>;
  for (const category of ["manager", "firefighter", "exile"] as PartCategory[]) {
    const picks = rankFelts(COLORS[category], taken).slice(0, 3);
    for (const p of picks) taken.add(p);
    out[category] = picks;
  }
  return out;
})();

/** Self gets the swatch closest to the app's own Self gold. */
export const SELF_FELT = rankFelts(COLORS.self, new Set<string>())[0]!;

/**
 * The generator throws rather than emit an off-model doll, so locks are relaxed in
 * stages until the taste rules can be satisfied. Every stage is deterministic.
 */
function safeGenerate(seed: number, part: Part | null, existing: Dna[], slot = 0): Dna {
  const self = part === null;
  const mood: Mood | undefined = part ? MOODS[part.category]![(seed >>> 8) % MOODS[part.category]!.length] : undefined;
  const axes = part
    ? (() => {
        const base = AXES[part.category];
        const heat = (part.activation - 0.55) * 0.5; // louder parts read warmer and more agentic
        return {
          agency: clamp(base.agency + heat * 0.8, -1, 1),
          temperature: clamp(base.temperature + heat, -1, 1),
          focus: clamp(base.focus - heat * 0.4, -1, 1),
          attachment: clamp(base.attachment - heat * 0.3, -1, 1),
        };
      })()
    : { agency: 0.15, temperature: 0.25, focus: 0.1, attachment: 0.5 };
  const role = part?.category;
  const felt = part ? PALETTE[part.category]![slot % PALETTE[part.category]!.length]! : SELF_FELT;
  const target = part ? 0.9 + part.activation * 0.22 : 1.06; // activation reads as presence
  const stages: Array<Record<string, unknown>> = [{ felt, size: target }, { felt }, {}];
  for (let i = 0; i < stages.length; i++) {
    const locks = stages[i]!;
    try {
      const probe = generate({ seed, collection: "wool", profile: { role, mood, axes }, existing: i === 0 ? existing : [], locks, self });
      // Small bodies (drop, crescent) need the engine's own 1.14 boost to sit at the right scale.
      if (locks.size !== undefined && !self) {
        const boost = TEMPLATE[probe.body.t]?.small ? 1.14 : 1;
        return generate({ seed, collection: "wool", profile: { role, mood, axes }, existing, locks: { ...locks, size: +(target * boost).toFixed(3) }, self });
      }
      return probe;
    } catch { /* relax and try again */ }
  }
  return generate({ seed, collection: "wool", profile: { axes }, self });
}

let family: Map<string, Dna> | null = null;
let selfDna: Dna | null = null;

/**
 * The whole internal family, sewn in one pass so the engine's uniqueness rules can
 * keep every part distinguishable: no two parts share a body.
 */
export function dnaForPart(part: Part): Dna {
  if (!family) {
    const map = new Map<string, Dna>();
    const existing: Dna[] = [];
    for (const p of PARTS) {
      const slot = Math.max(0, PARTS_BY_CATEGORY[p.category].findIndex((q) => q.id === p.id));
      const dna = safeGenerate(hashStr(p.id) >>> 0, p, existing, slot);
      existing.push(dna);
      map.set(p.id, dna);
    }
    family = map;
  }
  return family.get(part.id) ?? safeGenerate(hashStr(part.id) >>> 0, part, [], 0);
}

/** Self is not a part: the engine sews it uncostumed — sun body, calm face, no patch. */
export function dnaForSelf(): Dna {
  if (!selfDna) selfDna = safeGenerate(hashStr("self") >>> 0, null, []);
  return selfDna;
}

/** Exposed for the integrity test: every doll must be far from its neighbours. */
export function feltDistance(a: Dna, b: Dna) {
  const swatch = (d: Dna) => (FELT as Record<string, Record<string, string>>)[d.collection]?.[d.felt] ?? "#999999";
  return deltaE(swatch(a), swatch(b));
}
