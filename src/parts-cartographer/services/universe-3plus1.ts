/**
 * The 3+1 view of a map part (docs/plans/assessment-2/plan.md §3.5; build-and-fix-plan.md B12). Pure: no three.js.
 *
 * Three plotted axes (energy, depth, direction) set a part's position. Blending is the "+1": it is drawn as a halo,
 * never as a position. An axis the person can still set and has not set fades the part. An axis that no answer could
 * set (the instrument never measures it) is labelled in the detail view, not faded, so the view does not dim every
 * 64 or 147 part for something the person cannot change.
 */
import { MAP_AXIS_KEYS, type MapAxisKey } from '../../shared/core/data/map-axes';
import type { ArchetypeCoordinates } from './universe-lens';

/** Halo colours. The warm end is the lens's blending colour; the cool end is "I can be with it". */
export const HALO_NEGATIVE = 0x5c9dff;
export const HALO_NEUTRAL = 0xe8e4da;
export const HALO_POSITIVE = 0xffd000;
/** A faded part keeps this share of its opacity (build-and-fix-plan G32). */
export const GHOST_FACTOR = 0.5;
export const SPATIAL_AXES: readonly MapAxisKey[] = ['ENERGY', 'DEPTH', 'DIRECTION'];
/** Coordinate bases whose unmeasured axes the person can still set. Any other unmeasured axis is structural. */
const OWN_PLACEMENT_BASES: ReadonlySet<string> = new Set(['self-placed-2', 'family-default-2']);

export interface HaloStyle {
  color: number;
  opacity: number;
}

export interface Presentation {
  /** Axes the person can still set and has not. A spatial one fades the part. */
  notSet: MapAxisKey[];
  /** Axes no answer could set. They are labelled, never faded. */
  notMeasured: MapAxisKey[];
  ghost: boolean;
  /** The +1 channel. Null when blending is unknown, so no halo is drawn. */
  halo: HaloStyle | null;
}

const clampUnit = (value: number): number => Math.max(-1, Math.min(1, value));

/**
 * Halo for a blending value in [−1, 1]. The hue shows the sign and the opacity shows the strength, so zero is a faint,
 * neutral ring and the extremes are clear.
 */
export function haloFor(value: number): HaloStyle {
  const v = clampUnit(value);
  const strength = Math.abs(v);
  const target = v < 0 ? HALO_NEGATIVE : HALO_POSITIVE;
  const channel = (shift: number): number => {
    const from = (HALO_NEUTRAL >> shift) & 0xff;
    const to = (target >> shift) & 0xff;
    return Math.round(from + (to - from) * strength);
  };
  return { color: (channel(16) << 16) | (channel(8) << 8) | channel(0), opacity: 0.12 + 0.68 * strength };
}

export function presentationFor(input: {
  coordinates: ArchetypeCoordinates | null;
  unmeasuredAxes?: readonly string[];
  coordinateBasis?: string;
}): Presentation {
  if (!input.coordinates) return { notSet: [], notMeasured: [], ghost: false, halo: null };
  const listed = input.unmeasuredAxes ?? [];
  const unmeasured = MAP_AXIS_KEYS.filter((key) => listed.includes(key));
  const ownable = input.coordinateBasis !== undefined && OWN_PLACEMENT_BASES.has(input.coordinateBasis);
  const notSet = ownable ? unmeasured : [];
  return {
    notSet,
    notMeasured: ownable ? [] : unmeasured,
    ghost: notSet.some((key) => SPATIAL_AXES.includes(key)),
    halo: unmeasured.includes('BLENDING') ? null : haloFor(input.coordinates[3]),
  };
}

/**
 * In the isolation view for one axis, a part with no value on that axis gets an "unknown" tag (B12, G31). Its position on
 * that axis is a placeholder, so the tag says it is not a value (G38). No isolation means no tag.
 */
export function isolationUnknown(unmeasuredAxes: readonly string[] | undefined, isolation: string | null): boolean {
  return isolation !== null && (unmeasuredAxes ?? []).includes(isolation);
}

export interface LayoutPoint {
  id: string;
  position: readonly [number, number, number];
}

/**
 * Display only: parts whose positions lie within `reach` of each other are set out in a short row across the screen,
 * centred on the cluster, in id order, `spacing` apart, so no part hides another. The row runs along the first plotted
 * axis at the cluster's own height and depth: height is never changed (it is the surface–deep reading), and a ring in
 * the horizontal plane left parts one behind another from the viewer's angle. Stored coordinates never change. A part
 * with no neighbour gets no offset, and the result does not depend on input order.
 */
export function overlapOffsets(points: readonly LayoutPoint[], reach = 2, spacing = 2): Map<string, [number, number, number]> {
  const offsets = new Map<string, [number, number, number]>();
  const ordered = [...points].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const taken = new Set<string>();
  for (const seed of ordered) {
    if (taken.has(seed.id)) continue;
    const cluster = ordered.filter((point) => !taken.has(point.id) && distance(point.position, seed.position) < reach);
    cluster.forEach((point) => taken.add(point.id));
    if (cluster.length < 2) continue;
    const centreX = cluster.reduce((sum, point) => sum + point.position[0], 0) / cluster.length;
    const centreZ = cluster.reduce((sum, point) => sum + point.position[2], 0) / cluster.length;
    cluster.forEach((point, index) => {
      const targetX = centreX + (index - (cluster.length - 1) / 2) * spacing;
      offsets.set(point.id, [targetX - point.position[0], 0, centreZ - point.position[2]]);
    });
  }
  return offsets;
}

function distance(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
