import { SEED_PARTS, type ArchetypeMapData, type Part } from '../pal/traits';
import { validMapParts } from './backup';
import { withFamilyCluster } from './clinical-profile-adapter';
import { canonicalEnergyPart } from './universe-controls';
import { IV_PARTS } from '../../shared/features/landing/stickers';
import { MAP_AXIS_KEYS, legacy64ToMapPlacement, referenceMapPlacement } from '../../shared/core/data/map-axes';

/**
 * A 2.0 record is current when it carries the axis version and the depth marker, and its unknown-axis list survived.
 * Anything else is read conservatively: depth is unknown, because an earlier build stored the default as the answer.
 */
function currentParts2Archetype(archetype: ArchetypeMapData): ArchetypeMapData {
  if (archetype.axisVersion === 2 && archetype.depthRecord === 2 && Array.isArray(archetype.unmeasuredAxes) && typeof archetype.levelKnown === 'boolean') return archetype;
  const listed: Array<'ENERGY' | 'DIRECTION' | 'DEPTH' | 'BLENDING'> = Array.isArray(archetype.unmeasuredAxes)
    ? archetype.unmeasuredAxes
    : ['ENERGY', 'DIRECTION', 'DEPTH', 'BLENDING'];
  const unmeasuredAxes: Array<'ENERGY' | 'DIRECTION' | 'DEPTH' | 'BLENDING'> = archetype.depthRecord === 2 || listed.includes('DEPTH') ? listed : [...listed, 'DEPTH' as const];
  // A record saved before levelKnown existed. Its energy is the layout default (45) exactly when its level was unanswered:
  // a level is a whole number or a third, and round(level * 20) is never 45 (G39).
  const levelKnown = typeof archetype.levelKnown === 'boolean' ? archetype.levelKnown : archetype.prominence !== 45;
  return { ...archetype, axisVersion: 2, depthRecord: 2, unmeasuredAxes, levelKnown };
}

/**
 * Stored coordinates written before the axis change use the old four-axis tuple (agency, temperature, focus,
 * attachment). Convert them once, here, so no reader sees the old meaning (plan §3.5).
 * - 64-item parts: the same projection the 64 adapter uses. Depth and blending are unmeasured.
 * - 147 reference parts: the reference position of the same id. Blending is unmeasured.
 * - Anything else with old coordinates: the coordinates are dropped, and the part falls back to its family position.
 */
export function migrateArchetypeAxes(part: Part): Part {
  const archetype = part.archetype;
  if (!archetype) return part;
  // 2.0 records are never re-projected. Every 2.0 writer sets axisVersion 2 (parts2-universe-adapter.ts), and the 2.0 flow
  // never stored the old tuple, so their coordinates are already on the map axes.
  if (archetype.sourceAssessment === 'parts-2') {
    const current = currentParts2Archetype(archetype);
    return current === archetype ? part : { ...part, archetype: current };
  }
  // A studio part saved without a usable description holds an all-zero placeholder. Every axis is unknown for it, so the
  // zeros are never read as values (build-and-fix G38). This also covers studio records written at axis version 2.
  if (archetype.sourceAssessment === 'studio' && Array.isArray(archetype.coordinates) && archetype.coordinates.every((value) => value === 0)) {
    return { ...part, archetype: { ...archetype, axisVersion: 2, coordinates: [0, 0, 0, 0], unmeasuredAxes: [...MAP_AXIS_KEYS] } };
  }
  if (archetype.axisVersion === 2) return part;
  if (archetype.coordinateBasis === 'fixed-reference-147' || archetype.coordinateBasis === 'family-default-2') {
    const reference = IV_PARTS.find((entry) => entry.id === part.id);
    if (!reference) return { ...part, archetype: undefined };
    const placement = referenceMapPlacement(reference.ax.en, reference.ax.di, reference.ax.de);
    return { ...part, archetype: { ...archetype, axisVersion: 2, coordinates: placement.coordinates, unmeasuredAxes: placement.unmeasuredAxes } };
  }
  if (archetype.sourceAssessment === 'legacy64' || archetype.sourceAssessment === 'studio' || archetype.sourceAssessment === 'descent147') {
    const placement = legacy64ToMapPlacement(archetype.coordinates);
    return { ...part, archetype: { ...archetype, axisVersion: 2, coordinates: placement.coordinates, unmeasuredAxes: placement.unmeasuredAxes } };
  }
  return { ...part, archetype: undefined };
}

/* Stored parts may come from an older build, a restore or another tab: keep only parts every screen can draw, so one
   bad entry cannot break them all. A part whose cluster is another family's (stored before a family change kept it)
   is drawn in its own family's cluster. */
export function usableParts(saved: unknown): Part[] {
  if (!Array.isArray(saved)) return SEED_PARTS;
  const kept = saved
    .filter((part) => validMapParts([part]))
    .map((part) => withFamilyCluster(canonicalEnergyPart(migrateArchetypeAxes(part))));
  return kept.length || !saved.length ? kept : SEED_PARTS;
}
