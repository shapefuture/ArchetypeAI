import { MAP_AXIS_KEYS, MAP_DEFAULT_PLOT, type MapAxisKey } from '../../shared/core/data/map-axes';

/**
 * The user's visual lens over the map: one expression per map axis (plan §3.5). Not evidence, only a view.
 * The lens changes how strongly each part is highlighted. It never moves a part (build-and-fix-plan G30).
 */
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

export function sanitizeArchetypeCoordinates(value: unknown): ArchetypeCoordinates | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  if (value.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))) return null;
  const coordinates = value as number[];
  return coordinates.map((entry) => Math.max(-1, Math.min(1, entry))) as ArchetypeCoordinates;
}

function boundedCoordinates(coordinates: ArchetypeCoordinates): ArchetypeCoordinates {
  return sanitizeArchetypeCoordinates(coordinates) ?? [0, 0, 0, 0];
}

/** Project a 4D archetype point to the stable 3D scene axes. Blending is never a position unless it is chosen as an axis. */
export function archetypeCoordinatePosition(
  coordinates: ArchetypeCoordinates,
  axes: UniverseAxes = DEFAULT_AXES,
  isolation: DimensionKey | null = null,
): [number, number, number] {
  const point = boundedCoordinates(coordinates);
  if (isolation === 'BLENDING') return [point[0] * 10, point[3] * 10, 0];
  return axes.map((key) => isolation && key !== isolation ? 0 : point[DIMENSION_KEYS.indexOf(key)] * 10) as [number, number, number];
}

/**
 * Weighted Gaussian affinity between the lens and one archetype. An unmeasured axis holds a placeholder number, so it
 * is left out entirely: it neither raises nor lowers the affinity.
 */
export function coordinateAffinity(
  coordinates: ArchetypeCoordinates,
  dimensions: UniverseDimensions,
  resource = false,
  unmeasured: readonly string[] = [],
): number {
  const known = DIMENSION_KEYS.map((key) => !unmeasured.includes(key));
  const expressions = DIMENSION_KEYS.map((key, index) => (known[index] ? Math.max(-1, Math.min(1, Number(dimensions[key]) || 0)) : 0));
  const magnitude = expressions.reduce((sum, value) => sum + Math.abs(value), 0);
  if (magnitude <= 0.01) return resource ? 0.5 : 0;
  const point = boundedCoordinates(coordinates);
  return expressions.reduce((sum, expression, index) =>
    known[index] ? sum + Math.abs(expression) * Math.exp(-Math.pow(expression - point[index], 2) * 2) : sum, 0) / magnitude;
}

export type { MapAxisKey };
