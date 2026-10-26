import { SEED_PARTS, type Part } from '../pal/traits';
import { validMapParts } from './backup';
import { withFamilyCluster } from './clinical-profile-adapter';
import { canonicalEnergyPart } from './universe-controls';

/* Stored parts may come from an older build, a restore or another tab: keep only parts every screen can draw, so one
   bad entry cannot break them all. A part whose cluster is another family's (stored before a family change kept it)
   is drawn in its own family's cluster. */
export function usableParts(saved: unknown): Part[] {
  if (!Array.isArray(saved)) return SEED_PARTS;
  const kept = saved
    .filter((part) => validMapParts([part]))
    .map((part) => withFamilyCluster(canonicalEnergyPart(part)));
  return kept.length || !saved.length ? kept : SEED_PARTS;
}
