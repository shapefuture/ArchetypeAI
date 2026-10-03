import type { Part } from '../pal/traits';

export interface UniverseDimensions {
  AGENCY: number;
  TEMPERATURE: number;
  FOCUS: number;
  ATTACHMENT: number;
}

export type ArchetypeCoordinates = [number, number, number, number];

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
export function archetypeCoordinatePosition(coordinates: ArchetypeCoordinates): [number, number, number] {
  const [agency, temperature, focus, attachment] = boundedCoordinates(coordinates);
  return [
    (agency + focus) * 14,
    (temperature + attachment) * 14,
    (agency - focus + temperature - attachment) * 8,
  ];
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
