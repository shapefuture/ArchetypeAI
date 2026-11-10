import { SEED_PARTS, type Part } from '../pal/traits';
import { validMapParts } from './backup';
import { withFamilyCluster } from './clinical-profile-adapter';
import { canonicalEnergyPart } from './universe-controls';
import { IV_PARTS } from '../../shared/features/landing/stickers';
import { legacy64ToMapPlacement, referenceMapPlacement } from '../../shared/core/data/map-axes';

/**
 * Stored coordinates written before the axis change use the old four-axis tuple (agency, temperature, focus,
 * attachment). Convert them once, here, so no reader sees the old meaning (plan §3.5).
 * - 64-item parts: the same projection the 64 adapter uses. Depth and blending are unmeasured.
 * - 147 reference parts: the reference position of the same id. Blending is unmeasured.
 * - Anything else with old coordinates: the coordinates are dropped, and the part falls back to its family position.
 */
export function migrateArchetypeAxes(part: Part): Part {
  const archetype = part.archetype;
  if (!archetype || archetype.axisVersion === 2) return part;
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
