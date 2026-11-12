/**
 * Map axes for parts (docs/plans/assessment-2/plan.md §3.5, owner decision: replace the old four everywhere).
 *
 * The four slots of a part's coordinate tuple keep their shape, and each slot now has one meaning:
 *   0 ENERGY     −1 shut down      ↔ +1 mobilised
 *   1 DIRECTION  −1 away from people ↔ +1 toward people
 *   2 DEPTH      −1 deep, hidden   ↔ +1 surface, visible
 *   3 BLENDING   −1 I can be with it ↔ +1 it runs me
 * ENERGY, DEPTH and DIRECTION are the three plotted axes; BLENDING is the "+1" value.
 *
 * A value the instrument did not measure is never shown as a measurement. It is listed in
 * `unmeasuredAxes` next to the tuple, and every reader must treat that axis as unknown.
 * Pure, framework-free.
 */

export const MAP_AXIS_KEYS = ['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING'] as const;
export type MapAxisKey = (typeof MAP_AXIS_KEYS)[number];

/** Tuple order matches MAP_AXIS_KEYS. Every value is in [−1, 1]. */
export type MapCoordinates = [number, number, number, number];

/** Default plot: x energy, y depth (vertical, managers on top, exiles below), z direction. */
export const MAP_DEFAULT_PLOT: [MapAxisKey, MapAxisKey, MapAxisKey] = ['ENERGY', 'DEPTH', 'DIRECTION'];

export const MAP_AXIS_LABELS: Record<MapAxisKey, { en: string; ru: string }> = {
  ENERGY: { en: 'Energy', ru: 'Энергия' },
  DIRECTION: { en: 'Direction', ru: 'Направление' },
  DEPTH: { en: 'Depth', ru: 'Глубина' },
  BLENDING: { en: 'Blending', ru: 'Слитность' },
};

export const clampAxis = (value: number): number => Math.max(-1, Math.min(1, value));

export const isMapCoordinates = (value: unknown): value is MapCoordinates =>
  Array.isArray(value) && value.length === 4 && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry) && Math.abs(entry) <= 1);

export interface MapPlacement {
  coordinates: MapCoordinates;
  /** Axes that the source did not measure. Their numeric slot is a placeholder, never a measurement. */
  unmeasuredAxes: MapAxisKey[];
}

/**
 * The 64-item relational centres are [agency, temperature, focus, attachment], each in [−1, 1].
 * Energy and direction are the closest matches. Depth and blending have no counterpart in that
 * instrument, so they are unmeasured. A missing or invalid input is fully unmeasured, never zero-filled.
 */
export function legacy64ToMapPlacement(centres: unknown): MapPlacement {
  if (!Array.isArray(centres) || centres.length !== 4 || centres.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry))) {
    return { coordinates: [0, 0, 0, 0], unmeasuredAxes: [...MAP_AXIS_KEYS] };
  }
  const [agency, temperature, focus, attachment] = centres as number[];
  return {
    coordinates: [clampAxis((-agency + temperature) / 2), clampAxis((focus + attachment) / 2), 0, 0],
    unmeasuredAxes: ['DEPTH', 'BLENDING'],
  };
}

/** A 147-item template part: energy, direction and depth come from the reference table; blending is never measured. */
export function referenceMapPlacement(energy: number, direction: number, depth: number): MapPlacement {
  return { coordinates: [clampAxis(energy), clampAxis(direction), clampAxis(depth), 0], unmeasuredAxes: ['BLENDING'] };
}

/**
 * A studio part's placement. The AI gives four numbers, or nothing. Nothing is a placeholder, so every axis is unknown
 * for it and its zeros are never read as values (build-and-fix G38).
 */
export function studioMapPlacement(value: unknown): MapPlacement {
  const given = Array.isArray(value) && value.length === 4 && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry));
  // An all-zero placement is the placeholder the studio writes for a missing one. coordinates.jsx and the migration read it the same way.
  if (!given || (value as number[]).every((entry) => entry === 0)) return { coordinates: [0, 0, 0, 0], unmeasuredAxes: [...MAP_AXIS_KEYS] };
  return { coordinates: (value as number[]).map(clampAxis) as MapCoordinates, unmeasuredAxes: [] };
}

/** Read the known axis values of a placement. An unmeasured axis is returned as null. */
export function knownAxisValues(placement: { coordinates: MapCoordinates; unmeasuredAxes?: readonly MapAxisKey[] }): Record<MapAxisKey, number | null> {
  const unmeasured = new Set(placement.unmeasuredAxes ?? []);
  return Object.fromEntries(MAP_AXIS_KEYS.map((key, index) => [key, unmeasured.has(key) ? null : placement.coordinates[index]])) as Record<MapAxisKey, number | null>;
}
