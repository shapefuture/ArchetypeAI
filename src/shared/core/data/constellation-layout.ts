/**
 * INNERVERSE — Constellation layout (REVAMP §1.1, §3.1).
 *
 * Pure, deterministic star map for a scored profile: fixed orbital positions
 * (resources outer gold ring, managers outer, firefighters mid, exiles inner,
 * Self at center with the 8-spoke radar), tier-sized stars, polarization
 * tension arcs, strong guardianship lines, resource leak arcs, and complex
 * subgraph glows. Coordinates are unit-space (0..1); the renderer scales.
 */
import {
  MANAGERS, FIREFIGHTERS, EXILES, RESOURCES, PROTECTORS,
  POLARIZATIONS, GUARDS, SELF_QUALITIES, SUBTYPES, COMPLEXES,
  type PartId, type ProtectorId, type ResourceId, type Tier, type ComplexId,
} from './parts';
import type { ScoredProfile } from './scoring-v2';

export type Ring = 'resource' | 'manager' | 'firefighter' | 'exile';

export interface Star {
  id: PartId;
  label: string;
  x: number; y: number;      // unit space, center = (0.5, 0.5)
  radius: number;             // unit fraction
  color: string;
  tier: Tier;
  ring: Ring;
}

export interface SelfHub {
  x: number; y: number;
  radius: number;             // luminosity from self_energy
  spokes: { quality: string; angle: number; length: number }[]; // §1.15 radar
}

export interface TensionArc { a: PartId; b: PartId; name: string; }
export interface GuardLine { from: ProtectorId; to: PartId; weight: number; }
export interface LeakArc { from: ResourceId; to: ProtectorId; }
export interface ComplexGlow { id: string; name: string; parts: PartId[] }

export interface NorthStar {
  x: number; y: number;
  /** true when a Future Self is defined; false = dim placeholder. */
  bright: boolean;
}

export interface ConstellationLayout {
  stars: Star[];
  self: SelfHub;
  tensionArcs: TensionArc[];
  guardLines: GuardLine[];
  leakArcs: LeakArc[];
  complexGlows: ComplexGlow[];
  /** §3D.2 Future Self anchor: a distant star the constellation faces. */
  northStar: NorthStar;
}

// §3 identity: managers cool blues/teals, firefighters ambers/reds,
// exiles soft violets, resources gold-tinted, Self white-gold.
const RING_COLOR: Record<Ring, string> = {
  resource: '#e8c987',
  manager: '#6fa8c9',
  firefighter: '#e08a5c',
  exile: '#b9a8e8',
};

const RING_RADIUS: Record<Ring, number> = {
  resource: 0.44, manager: 0.36, firefighter: 0.26, exile: 0.155,
};
// deterministic per-ring angular offsets so rings don't visually collide
const RING_OFFSET: Record<Ring, number> = {
  resource: -Math.PI / 2 + 0.22, manager: -Math.PI / 2, firefighter: -Math.PI / 2 + 0.35, exile: -Math.PI / 2 + 0.12,
};

const TIER_RADIUS: Record<Tier, number> = {
  dormant: 0.012, present: 0.018, prominent: 0.026, dominant: 0.036,
};

export function buildLayout(profile: ScoredProfile): ConstellationLayout {
  const stars: Star[] = [];

  const placeRing = (ids: PartId[], ring: Ring) => {
    ids.forEach((id, i) => {
      const angle = RING_OFFSET[ring] + (i / ids.length) * Math.PI * 2;
      const T = profile.parts[id as keyof typeof profile.parts]?.T
        ?? profile.resources[id as ResourceId]?.T ?? 50;
      const tier = profile.parts[id as keyof typeof profile.parts]?.tier
        ?? profile.resources[id as ResourceId]?.tier ?? 'present';
      stars.push({
        id,
        label: SUBTYPES[id as keyof typeof SUBTYPES]?.[0]?.name ?? id,
        x: 0.5 + Math.cos(angle) * RING_RADIUS[ring],
        y: 0.5 + Math.sin(angle) * RING_RADIUS[ring],
        radius: TIER_RADIUS[tier],
        color: RING_COLOR[ring],
        tier,
        ring,
      });
    });
  };

  placeRing(RESOURCES as PartId[], 'resource');
  placeRing(MANAGERS as PartId[], 'manager');
  placeRing(FIREFIGHTERS as PartId[], 'firefighter');
  placeRing(EXILES as PartId[], 'exile');

  // §1.15 Self radar at the chair (§3D.1): 8 spokes, luminosity per quality
  const spokes = SELF_QUALITIES.map((q, i) => {
    const angle = -Math.PI / 2 + (i / SELF_QUALITIES.length) * Math.PI * 2;
    return { quality: q, angle, length: 0.05 + (profile.selfRadar[q] - 20) / 60 * 0.075 };
  });

  const tensionArcs: TensionArc[] = profile.polarizations
    .map(p => ({ a: p.pair[0], b: p.pair[1], name: p.name }));

  // Strongest guardianship line per protector (weight ≥ 0.7) keeps the map calm
  const guardLines: GuardLine[] = PROTECTORS
    .map(p => {
      const guards = GUARDS[p];
      const best = (Object.entries(guards) as [PartId, number][])
        .sort((x, y) => y[1] - x[1])[0];
      return best && best[1] >= 0.7
        ? { from: p, to: best[0], weight: best[1] }
        : null;
    })
    .filter((g): g is GuardLine => g !== null);

  const leakArcs: LeakArc[] = profile.resourceLeaks.map(l => ({ from: l.resource, to: l.spillPart }));

  const complexGlows: ComplexGlow[] = profile.activeComplexes.map(c => ({
    id: c.id,
    name: COMPLEXES[c.id as ComplexId].name,
    parts: Object.keys(COMPLEXES[c.id as ComplexId].weights) as PartId[],
  }));

  let futureSelf: string[] | null = null;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('INNERVERSE_FUTURE_SELF_V1') : null;
    futureSelf = raw ? JSON.parse(raw) : null;
  } catch { futureSelf = null; }
  const bright = !!(futureSelf && futureSelf.some(a => a && a.trim().length > 0));

  return { stars, self: { x: 0.5, y: 0.5, radius: 0.06 + profile.selfEnergy / 100 * 0.06, spokes },
    tensionArcs, guardLines, leakArcs, complexGlows,
    northStar: { x: 0.86, y: 0.13, bright } };
}



export function starAt(layout: ConstellationLayout, id: PartId): Star {
  const s = layout.stars.find(x => x.id === id);
  if (!s) throw new Error(`no star for ${id}`);
  return s;
}
