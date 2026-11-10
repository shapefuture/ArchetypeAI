import type { Part } from '../pal/traits';
import { MAP_AXIS_KEYS, MAP_DEFAULT_PLOT, type MapAxisKey } from '../../shared/core/data/map-axes';

/** The user's visual lens over the map: one expression per map axis (plan §3.5). Not evidence, only a view. */
export interface UniverseDimensions {
  ENERGY: number;
  DIRECTION: number;
  DEPTH: number;
  BLENDING: number;
}

export type ArchetypeCoordinates = [number, number, number, number];
export type DimensionKey = keyof UniverseDimensions;
export const DIMENSION_KEYS: DimensionKey[] = [...MAP_AXIS_KEYS];
export type UniverseAxes = [DimensionKey, DimensionKey, DimensionKey];
export const DEFAULT_AXES: UniverseAxes = [...MAP_DEFAULT_PLOT];

/** Three distinct known dimensions, or the default projection. Repeated axes would collapse the 3D view. */
export function normalizeAxes(value: unknown): UniverseAxes {
  if (!Array.isArray(value) || value.length !== 3) return [...DEFAULT_AXES] as UniverseAxes;
  const valid = value.every((key) => DIMENSION_KEYS.includes(key as DimensionKey));
  return valid && new Set(value).size === 3 ? [...value] as UniverseAxes : [...DEFAULT_AXES] as UniverseAxes;
}

/** Choose an axis for one slot. If the axis is already used elsewhere, the two slots trade places. */
export function setAxisChoice(axes: UniverseAxes, index: number, key: DimensionKey): UniverseAxes {
  const next = [...axes] as UniverseAxes;
  const other = next.indexOf(key);
  if (other >= 0 && other !== index) next[other] = next[index];
  next[index] = key;
  return next;
}

export const ZERO_DIMENSIONS: UniverseDimensions = {
  ENERGY: 0,
  DIRECTION: 0,
  DEPTH: 0,
  BLENDING: 0,
};

/** Fallback placement for ordinary parts that predate coordinate data, in map-axis order. */
const FAMILY_DIMENSIONS: Record<Part['family'], [number, number, number, number]> = {
  manager: [0.4, 0.0, 0.6, 0],
  firefighter: [0.5, 0.2, 0.3, 0],
  exile: [-0.4, -0.2, -0.7, 0],
  resource: [0.4, 0.4, 0.4, 0],
};

export function sanitizeArchetypeCoordinates(value: unknown): ArchetypeCoordinates | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  if (value.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))) return null;
  const coordinates = value as number[];
  return coordinates.map((entry) => Math.max(-1, Math.min(1, entry))) as ArchetypeCoordinates;
}

function boundedCoordinates(coordinates: ArchetypeCoordinates): ArchetypeCoordinates {
  return sanitizeArchetypeCoordinates(coordinates) ?? [0, 0, 0, 0];
}

/** Project a 4D archetype point to the stable 3D scene axes. */
export function archetypeCoordinatePosition(
  coordinates: ArchetypeCoordinates,
  axes: UniverseAxes = DEFAULT_AXES,
  isolation: DimensionKey | null = null,
): [number, number, number] {
  const point = boundedCoordinates(coordinates);
  if (isolation === 'BLENDING') return [point[0] * 10, point[3] * 10, 0];
  return axes.map((key) => isolation && key !== isolation ? 0 : point[DIMENSION_KEYS.indexOf(key)] * 10) as [number, number, number];
}

/** Weighted Gaussian affinity between the lens and one archetype. Unmeasured axes carry a 0 placeholder and so add nothing. */
export function coordinateAffinity(coordinates: ArchetypeCoordinates, dimensions: UniverseDimensions, resource = false): number {
  const expressions = DIMENSION_KEYS.map((key) => Math.max(-1, Math.min(1, Number(dimensions[key]) || 0)));
  const magnitude = expressions.reduce((sum, value) => sum + Math.abs(value), 0);
  if (magnitude <= 0.01) return resource ? 0.5 : 0;
  const point = boundedCoordinates(coordinates);
  return expressions.reduce((sum, expression, index) =>
    sum + Math.abs(expression) * Math.exp(-Math.pow(expression - point[index], 2) * 2), 0) / magnitude;
}

/** Apply the user's visual lens to a coordinate-bearing archetype, rather than to its family average. */
export function archetypeLensOffset(
  coordinates: ArchetypeCoordinates,
  dimensions: UniverseDimensions,
): [number, number, number] {
  const [energy, direction, depth, blending] = boundedCoordinates(coordinates);
  return lensProjection(energy, direction, depth, blending, dimensions);
}

function lensProjection(energy: number, direction: number, depth: number, blending: number, dimensions: UniverseDimensions): [number, number, number] {
  const projected: [number, number, number] = [
    (dimensions.ENERGY * energy + dimensions.DEPTH * depth) * 3.2,
    (dimensions.DIRECTION * direction + dimensions.BLENDING * blending) * 3.2,
    (dimensions.BLENDING * blending - dimensions.ENERGY * energy) * 3.2,
  ];
  return projected.map((value) => value === 0 ? 0 : value) as [number, number, number];
}

/** Family-weighted fallback for ordinary React Parts that predate coordinate data. */
export function dimensionalLensOffset(
  family: Part['family'],
  dimensions: UniverseDimensions,
): [number, number, number] {
  const [energy, direction, depth, blending] = FAMILY_DIMENSIONS[family];
  return lensProjection(energy, direction, depth, blending, dimensions);
}

export type { MapAxisKey };
