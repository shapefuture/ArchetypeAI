import type { Part } from '../pal/traits';

export interface UniverseDimensions {
  AGENCY: number;
  TEMPERATURE: number;
  FOCUS: number;
  ATTACHMENT: number;
}

export type ArchetypeCoordinates = [number, number, number, number];
export type DimensionKey = keyof UniverseDimensions;
export const DIMENSION_KEYS: DimensionKey[] = ['AGENCY', 'TEMPERATURE', 'FOCUS', 'ATTACHMENT'];
export type UniverseAxes = [DimensionKey, DimensionKey, DimensionKey];
export const DEFAULT_AXES: UniverseAxes = ['AGENCY', 'TEMPERATURE', 'FOCUS'];

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
  AGENCY: 0,
  TEMPERATURE: 0,
  FOCUS: 0,
  ATTACHMENT: 0,
};

const FAMILY_DIMENSIONS: Record<Part['family'], [number, number, number, number]> = {
  manager: [-0.8, -0.25, 0.15, -0.2],
  firefighter: [0.3, 0.8, 0.1, 0.5],
  exile: [0, 0.65, 0.75, 0.85],
  resource: [0.35, 0.2, 0.35, 0.3],
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
  if (isolation === 'ATTACHMENT') return [point[0] * 10, point[3] * 10, 0];
  return axes.map((key) => isolation && key !== isolation ? 0 : point[DIMENSION_KEYS.indexOf(key)] * 10) as [number, number, number];
}

/** Same weighted Gaussian affinity as Angular's exploration and report layers. */
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
  const [agency, temperature, focus, attachment] = boundedCoordinates(coordinates);
  const projected: [number, number, number] = [
    (dimensions.AGENCY * agency + dimensions.FOCUS * focus) * 3.2,
    (dimensions.TEMPERATURE * temperature + dimensions.ATTACHMENT * attachment) * 3.2,
    (dimensions.ATTACHMENT * attachment - dimensions.AGENCY * agency) * 3.2,
  ];
  return projected.map((value) => value === 0 ? 0 : value) as [number, number, number];
}

/** Family-weighted fallback for ordinary React Parts that predate coordinate data. */
export function dimensionalLensOffset(
  family: Part['family'],
  dimensions: UniverseDimensions,
): [number, number, number] {
  const [agency, temperature, focus, attachment] = FAMILY_DIMENSIONS[family];
  const projected: [number, number, number] = [
    (dimensions.AGENCY * agency + dimensions.FOCUS * focus) * 3.2,
    (dimensions.TEMPERATURE * temperature + dimensions.ATTACHMENT * attachment) * 3.2,
    (dimensions.ATTACHMENT * attachment - dimensions.AGENCY * agency) * 3.2,
  ];
  return projected.map((value) => value === 0 ? 0 : value) as [number, number, number];
}
