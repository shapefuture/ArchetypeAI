/**
 * §1.9 four-layer part copy — adapter (moved to src/i18n/strings.ts).
 * Copy team replaces with per-subtype texts keyed
 * `parts.<family>.<subtype_slug>.{face,need,shadow,superpower}`;
 * resolution falls back to these family layers until then.
 * Never frame a part as an enemy — no bad parts.
 */
import type { ShadowPartId } from './parts';
import { PART_COPY as PART_COPY_TUPLES } from '../../../i18n/strings';

export type LayerKey = 'face' | 'need' | 'shadow' | 'superpower';
export const LAYERS: LayerKey[] = ['face', 'need', 'shadow', 'superpower'];

export interface PartCopy { face: string; need: string; shadow: string; superpower: string; }
export type PartCopyTable = Record<ShadowPartId, PartCopy>;

// Rebuild the original Record<'en' | 'ru', PartCopyTable> shape from tuples.
const enTable = {} as PartCopyTable;
const ruTable = {} as PartCopyTable;
for (const [partId, tuple] of Object.entries(PART_COPY_TUPLES)) {
  (enTable as Record<string, PartCopy>)[partId] = {
    face: tuple.face[0], need: tuple.need[0], shadow: tuple.shadow[0], superpower: tuple.superpower[0],
  };
  (ruTable as Record<string, PartCopy>)[partId] = {
    face: tuple.face[1], need: tuple.need[1], shadow: tuple.shadow[1], superpower: tuple.superpower[1],
  };
}

export const PART_COPY: Record<'en' | 'ru', PartCopyTable> = { en: enTable, ru: ruTable };
