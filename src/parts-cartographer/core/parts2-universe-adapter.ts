import { hashStr } from './ports';
import { deterministicTraits } from './legacy-universe-adapter';
import type { ArchetypeMapData, Family, Part } from '../pal/traits';
import type { Assessment2Result, MapPart } from '../../shared/core/data/assessment2/scoring';
import { CAPACITY_COPY, EXILE_COPY, FAMILY_COPY, MEMBER_COPY, NEED_COPY, PROVIDER_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { EXILE_NEED, type ExileId } from '../../shared/core/data/assessment2/taxonomy';

export const PARTS2_SOURCE = 'parts-2' as const;

const prominenceOf = (part: MapPart): number => {
  if (part.level === null) return 45;
  return Math.max(0, Math.min(100, Math.round(part.level * 20)));
};

const nameOf = (part: MapPart, lang: 'en' | 'ru'): string => {
  if (part.kind === 'protector') return MEMBER_COPY[part.member!].name[lang];
  if (part.kind === 'exile') return EXILE_COPY[part.exile!].name[lang];
  // A provider point is named for its role (plan §5.1, B7).
  if (part.kind === 'provider') return PROVIDER_COPY[part.role!][lang];
  return CAPACITY_COPY[part.capacity!].name[lang];
};

/**
 * Map Parts for a completed Assessment 2.0 result. Coordinates are in map-axis order, and every unmeasured axis is
 * listed, so the coordinates panel and the lens show it as unknown. Placed parts and reference parts are told apart by
 * coordinateBasis. IDs carry the part key, so a rerun replaces the earlier entries.
 */
export function buildParts2UniverseParts(result: Assessment2Result, lang: 'en' | 'ru'): Part[] {
  return result.parts.map((part) => {
    const id = `parts2_${part.key.replace(':', '_')}`;
    const family: Family = part.mapFamily;
    const archetype: ArchetypeMapData = {
      schema: 'archetype-map.v1',
      sourceAssessment: PARTS2_SOURCE,
      coordinateBasis: part.placement === 'placed' ? 'self-placed-2' : 'family-default-2',
      coordinates: part.coordinates,
      unmeasuredAxes: part.unmeasuredAxes,
      axisVersion: 2,
      depthRecord: 2,
      cluster: `parts_two_${part.kind}`,
      prominence: prominenceOf(part),
      size: 0.8,
      partType: part.kind === 'exile' ? 'exile' : part.kind === 'protector' && part.classKnown ? (part.timing === 'reactive' ? 'firefighter' : 'manager') : undefined,
      classKnown: part.classKnown,
    };
    const guarded = part.guards[0] as ExileId | undefined;
    const need = part.kind === 'exile' ? part.need : guarded ? EXILE_NEED[guarded] : undefined;
    // A provider point's copy is its name, so it has no blurb of its own.
    const blurb = part.kind === 'protector' ? MEMBER_COPY[part.member!].card[lang]
      : part.kind === 'exile' ? EXILE_COPY[part.exile!].belief[lang]
      : part.kind === 'provider' ? ''
      : CAPACITY_COPY[part.capacity!].line[lang];
    // A provider point's role is the Provider label (plan §5.1, B7). A capacity keeps the resource label.
    const role = part.family ? FAMILY_COPY[part.family][lang] : part.kind === 'exile' ? EXILE_COPY[part.exile!].feeling[lang]
      : part.kind === 'provider' ? UI_COPY.providerLabel[lang] : (lang === 'ru' ? 'Ресурс' : 'Resource');
    return {
      id,
      name: nameOf(part, lang),
      family,
      traits: { ...deterministicTraits(id, family), characterSeed: hashStr(id) },
      role,
      blurb,
      energy: prominenceOf(part),
      burden: part.kind === 'exile' ? EXILE_COPY[part.exile!].feeling[lang] : part.guards.map((e) => EXILE_COPY[e].name[lang]).join(', '),
      need: need ? NEED_COPY[need][lang] : '',
      voice: part.kind === 'exile' ? EXILE_COPY[part.exile!].belief[lang] : '',
      star: false,
      since: lang === 'ru' ? 'по карте 2.0' : 'from parts map 2.0',
      archetype,
    } satisfies Part;
  });
}

/** Parts from earlier Assessment 2.0 results, which a new result replaces. */
export const isParts2Part = (part: Part): boolean => part.archetype?.sourceAssessment === PARTS2_SOURCE;

