import {
  COMPLEXES,
  RESOURCES,
  SHADOW_PARTS,
  partClass,
  type PartId,
  type ResourceId,
  type ShadowPartId,
} from '../../shared/core/data/parts';
import type { ScoredProfile as ClinicalScore } from '../../shared/core/data/scoring-v2';
import {
  constellationEssay,
  constellationName,
  polarizationName,
  resourceName,
  subtypeName,
  PART_NAME_RU,
} from '../../shared/core/data/constellation-copy';
import { PART_COPY as CLINICAL_PART_COPY, COMPLEX_COPY_RU, STRINGS as SHARED_STRINGS } from '../../shared/i18n/strings';
import { hashStr } from './ports';
import { FAMILY_LABELS, SEED_PARTS, type ArchetypeMapData, type Family, type Part } from '../pal/traits';
import { SCORING_NAME_POOLS, type Lang } from '../i18n/strings';
import { IV_PARTS } from '../../shared/features/landing/stickers';

const PART_NAME_EN: Record<string, string> = {
  taskmaster: 'Taskmaster',
  inner_critic: 'Inner Critic',
  pleaser: 'Pleaser',
  controller: 'Controller',
  analyst: 'Analyst',
  hermit: 'Hermit',
  bypasser: 'Bypasser',
  numb: 'Numb',
  rebel: 'Rebel',
  charmer: 'Charmer',
  abandoned: 'Abandoned',
  ashamed: 'Ashamed',
  frightened: 'Frightened',
  unseen: 'Unseen',
};

const FAMILY_SEEDS = (['manager', 'firefighter', 'exile', 'resource'] as Family[]).reduce((all, family) => {
  all[family] = SEED_PARTS.filter((part) => part.family === family);
  return all;
}, {} as Record<Family, Part[]>);

const RESOURCE_IDS = new Set<string>(RESOURCES);
const NEED_KEYS: Record<string, string> = {
  safety: 'needSafety',
  love: 'needLove',
  worth: 'needWorth',
  autonomy: 'needAutonomy',
  belonging: 'needBelonging',
  meaning: 'needMeaning',
  joy: 'needJoy',
};
const QUALITY_KEYS: Record<string, string> = {
  calm: 'calm',
  clarity: 'clarity',
  compassion: 'compassion',
  curiosity: 'curiosity',
  confidence: 'confidence',
  courage: 'courage',
  creativity: 'creativity',
  connectedness: 'connected',
};

export interface ClinicalPart extends Part {
  nameEn: string;
  nameRu: string;
  somatic: number;
  felt: 'low' | 'mid' | 'high';
  scoreT: number;
}

/** The role texts the adapter writes for a part, in both languages. Any other role was typed by the person. */
function canonicalRoles(id: string): string[] {
  return [...(CLINICAL_PART_COPY[id]?.face ?? []), ...Object.values(FAMILY_LABELS).flatMap((labels) => [labels.en, labels.ru])];
}

/**
 * A part the person already had, scored again (a retake) or restored from History. The scores and canonical copy come
 * from the new result; what the person did to the part stays: a typed name, role, family, look and star.
 */
export function withPersonEdits(scored: ClinicalPart, saved: Partial<ClinicalPart> | undefined): ClinicalPart {
  if (!saved) return scored;
  const typedName = saved.name && ![saved.nameEn, saved.nameRu, scored.nameEn, scored.nameRu].includes(saved.name) ? saved.name : undefined;
  const typedRole = saved.role && !canonicalRoles(scored.id).includes(saved.role) ? saved.role : undefined;
  const family = saved.family && Object.hasOwn(FAMILY_ARCHETYPE, saved.family) ? saved.family : scored.family;
  return {
    ...scored,
    name: typedName ?? scored.name,
    role: typedRole ?? scored.role,
    family,
    archetype: scored.archetype && archetypeOf(family, scored.archetype),
    traits: saved.traits ?? scored.traits,
    star: saved.star ?? scored.star,
  };
}

export type AdaptedClinicalProfile = {
  version: 'angular-v2';
  testModel: 'angular-v2';
  createdAt: number;
  parts: Array<{ id: string; name: string; nameEn: string; nameRu: string; family: Family; energy: number; somatic: number; felt: 'low' | 'mid' | 'high'; scoreT: number }>;
  resources: Array<{ id: string; name: string; nameEn: string; nameRu: string; energy: number; scoreT: number; band: string }>;
  resourceLeaks: Array<{ name: string; leak: string }>;
  strongestResource: { id: ResourceId; name: string; nameRu: string; energy: number; scoreT: number };
  selfEnergy: number;
  selfEnergyRadar: Record<string, number>;
  burden: number;
  headlineConstellation: string;
  headlineRu: string;
  constellationEssay: string;
  constellationEssayEn: string;
  constellationEssayRu: string;
  subtypes: string[];
  subtypesEn: string[];
  subtypesRu: string[];
  polarizations: Array<{ a: string; b: string; tension: number; name: string }>;
  attachment: string;
  attachmentScores: ClinicalScore['attachment'];
  complexes: string[];
  activeComplexes: Array<{ id: string; name: string; nameRu: string; activation: number; tier: string; belief: string; beliefEn: string; beliefRu: string; experiment: string; experimentEn: string; experimentRu: string }>;
  needHunger: Record<string, number>;
  copingStack: string[];
  validity: number;
  validityFlags: string[];
  crisisFlag: boolean;
  clinical: ClinicalScore;
};

function displayPartName(id: PartId | string, lang: Lang): string {
  if (RESOURCE_IDS.has(id)) {
    return lang === 'ru' ? resourceName(id, lang) : id.charAt(0).toUpperCase() + id.slice(1);
  }
  return lang === 'ru' ? PART_NAME_RU[id] ?? PART_NAME_EN[id] ?? id : PART_NAME_EN[id] ?? id;
}

/** The archetype cluster and node size each family draws with. The cluster filter and the node scale read them. */
const FAMILY_ARCHETYPE: Record<Family, { cluster: string; size: number }> = {
  manager: { cluster: 'managers', size: 0.75 },
  firefighter: { cluster: 'firefighters', size: 0.7 },
  exile: { cluster: 'exiles', size: 0.6 },
  resource: { cluster: 'resources', size: 0.8 },
};

/** An archetype with the cluster and size of its family, whichever family it was last drawn with. */
export function archetypeOf<T extends { cluster: string; size: number }>(family: Family, archetype: T): T {
  return { ...archetype, ...FAMILY_ARCHETYPE[family] };
}

/** The archetype a part gets when the person places it in a family: studio-made, centred, with that family's cluster and size. */
export function studioArchetypeFor(family: Family): ArchetypeMapData {
  const base: ArchetypeMapData = { schema: 'archetype-map.v1', sourceAssessment: 'studio', coordinates: [0, 0, 0, 0], prominence: 55, cluster: '', size: 0 };
  return archetypeOf(family, base);
}

/** A part whose archetype names another family's cluster (stored before a family change kept it) takes its family's cluster and size. */
export function withFamilyCluster<P extends { family: Family; archetype?: ArchetypeMapData }>(part: P): P {
  if (!part.archetype || part.archetype.cluster === FAMILY_ARCHETYPE[part.family]?.cluster) return part;
  return { ...part, archetype: archetypeOf(part.family, part.archetype) };
}

function familyFor(id: PartId): Family {
  return partClass(id) as Family;
}

function partTraits(id: string, family: Family): Part['traits'] {
  const choices = FAMILY_SEEDS[family];
  const seed = choices[hashStr(id) % choices.length] ?? SEED_PARTS[0];
  return { ...seed.traits, characterSeed: hashStr(id) };
}

function projectedPart(
  id: ShadowPartId | ResourceId,
  score: { T: number; tier: string; band?: string },
  lang: Lang,
): ClinicalPart {
  const family = familyFor(id);
  const nameEn = PART_NAME_EN[id] ?? (id.charAt(0).toUpperCase() + id.slice(1));
  const nameRu = displayPartName(id, 'ru');
  const localCopy = CLINICAL_PART_COPY[id];
  const copyIndex = lang === 'ru' ? 1 : 0;
  const intensity = Math.max(1, Math.min(5, Math.round((score.T - 20) / 15 + 1)));
  const felt = score.T < 45 ? 'low' : score.T >= 60 ? 'high' : 'mid';
  const tierUi = SHARED_STRINGS.innerverseReport.ui[lang === 'ru' ? 'ru' : 'en'];
  const band = score.band ? ` · ${tierUi.bandNames[score.band] ?? score.band}` : '';
  const reference = IV_PARTS.find((part) => part.id === id)!;

  return {
    id,
    name: lang === 'ru' ? nameRu : nameEn,
    nameEn,
    nameRu,
    family,
    traits: partTraits(id, family),
    role: localCopy?.face[copyIndex] ?? FAMILY_LABELS[family][lang],
    blurb: localCopy?.shadow[copyIndex] ?? localCopy?.face[copyIndex] ?? '',
    energy: Math.max(0, Math.min(1, (score.T - 20) / 60)),
    burden: `T ${Math.round(score.T)} · ${tierUi.tierNames[score.tier as keyof typeof tierUi.tierNames] ?? score.tier}${band}`,
    need: localCopy?.need[copyIndex] ?? '',
    voice: localCopy?.superpower[copyIndex] ?? '',
    star: false,
    since: lang === 'ru' ? 'по результатам карты' : 'from your map',
    somatic: intensity,
    felt,
    scoreT: score.T,
    archetype: {
      schema: 'archetype-map.v1',
      sourceAssessment: 'descent147',
      coordinateBasis: 'fixed-reference-147',
      coordinates: [reference.ax.ag, reference.ax.te, reference.ax.fo, reference.ax.at]
        .map((value) => (value - 50) / 50) as [number, number, number, number],
      cluster: FAMILY_ARCHETYPE[family].cluster,
      prominence: Math.max(0, Math.min(100, (score.T - 20) / 60 * 100)),
      size: FAMILY_ARCHETYPE[family].size,
      description: localCopy?.face[copyIndex] ?? '',
      invitation: localCopy?.need[copyIndex] ?? '',
      shadow: localCopy?.shadow[copyIndex] ?? '',
    },
  };
}

/**
 * Adapt the canonical 147-item Angular score to React's established map/results
 * contract. Raw responses are intentionally not included; they remain local
 * only while an assessment draft is in progress.
 */
export function adaptClinicalProfile(score: ClinicalScore, lang: Lang): { profile: AdaptedClinicalProfile; parts: ClinicalPart[] } {
  const shadowParts = SHADOW_PARTS.map((id) => projectedPart(id, score.parts[id], lang));
  const resourceParts = RESOURCES.map((id) => projectedPart(id, score.resources[id], lang));
  const parts = [...shadowParts, ...resourceParts];
  const strongest = score.strongestResource;
  const strongestResource = {
    id: strongest.id,
    name: displayPartName(strongest.id, 'en'),
    nameRu: displayPartName(strongest.id, 'ru'),
    energy: Math.max(0, Math.min(1, (strongest.T - 20) / 60)),
    scoreT: strongest.T,
  };
  const attachmentIndex = score.attachment.disorganized ? 3
    : score.attachment.anxious >= score.attachment.avoidant && score.attachment.anxious >= score.attachment.secure ? 1
    : score.attachment.avoidant >= score.attachment.secure ? 2 : 0;
  const attachmentNames = lang === 'ru' ? SCORING_NAME_POOLS.attachment.ru : SCORING_NAME_POOLS.attachment.en;
  const resolveSubtypes = (language: Lang) => SHADOW_PARTS.map((id) => {
    const subtype = score.subtypes[id];
    return subtypeName(id, subtype.slug, subtype.name, language);
  });
  const subtypesEn = resolveSubtypes('en');
  const subtypesRu = resolveSubtypes('ru');
  const subtypes = lang === 'ru' ? subtypesRu : subtypesEn;
  const polarizations = score.polarizations.map(({ pair, name }) => ({
    a: pair[0],
    b: pair[1],
    tension: Math.max(0, Math.min(1, ((score.parts[pair[0]].T + score.parts[pair[1]].T) / 2 - 20) / 60)),
    name: polarizationName(name, lang),
  }));
  const activeComplexes = score.activeComplexes.map((item) => {
    const definition = COMPLEXES[item.id];
    const russian = COMPLEX_COPY_RU[item.id];
    const beliefEn = definition?.belief ?? '';
    const beliefRu = russian?.belief ?? beliefEn;
    const experimentEn = definition?.experiment ?? '';
    const experimentRu = russian?.experiment ?? experimentEn;
    return {
      id: item.id,
      name: definition?.name ?? item.id,
      nameRu: russian?.name ?? definition?.name ?? item.id,
      activation: item.activation,
      tier: item.tier,
      belief: lang === 'ru' ? beliefRu : beliefEn,
      beliefEn,
      beliefRu,
      experiment: lang === 'ru' ? experimentRu : experimentEn,
      experimentEn,
      experimentRu,
    };
  });
  const needHunger = Object.fromEntries(Object.entries(score.needHunger).map(([need, hunger]) => [
    NEED_KEYS[need] ?? need,
    Math.max(0, Math.min(1, 0.5 + hunger / 100)),
  ]));
  const selfEnergyRadar = Object.fromEntries(Object.entries(score.selfRadar).map(([quality, value]) => [
    QUALITY_KEYS[quality] ?? quality,
    Math.max(0, Math.min(1, (value - 20) / 60)),
  ]));
  const essayEn = constellationEssay(score.headline, 'en');
  const essayRu = constellationEssay(score.headline, 'ru');
  const copingStack = [score.copingStack.l1, score.copingStack.l2, score.copingStack.l3]
    .flatMap((id) => id ? [displayPartName(id, lang)] : []);
  copingStack.push(`${lang === 'ru' ? 'Внизу' : 'At the floor'} · ${displayPartName(score.copingStack.floor, lang)}`);
  const profile: AdaptedClinicalProfile = {
    version: 'angular-v2',
    testModel: 'angular-v2',
    createdAt: Date.now(),
    parts: parts.map((part) => ({
      id: part.id,
      name: part.name,
      nameEn: part.nameEn,
      nameRu: part.nameRu,
      family: part.family,
      energy: part.energy,
      somatic: part.somatic,
      felt: part.felt,
      scoreT: part.scoreT,
    })),
    resources: RESOURCES.map((id) => ({
      id,
      name: displayPartName(id, lang),
      nameEn: displayPartName(id, 'en'),
      nameRu: displayPartName(id, 'ru'),
      energy: Math.max(0, Math.min(1, (score.resources[id].T - 20) / 60)),
      scoreT: score.resources[id].T,
      band: score.resources[id].band,
    })),
    resourceLeaks: score.resourceLeaks.map(({ resource, spillPart }) => ({
      name: displayPartName(resource, lang),
      leak: displayPartName(spillPart, lang),
    })),
    strongestResource,
    selfEnergy: score.selfEnergy,
    selfEnergyRadar,
    burden: score.burden / 100,
    headlineConstellation: score.headline.name,
    headlineRu: constellationName(score.headline, 'ru'),
    constellationEssay: lang === 'ru' ? essayRu : essayEn,
    constellationEssayEn: essayEn,
    constellationEssayRu: essayRu,
    subtypes,
    subtypesEn,
    subtypesRu,
    polarizations,
    attachment: attachmentNames[attachmentIndex],
    attachmentScores: score.attachment,
    complexes: activeComplexes.map((item) => item.id),
    activeComplexes,
    needHunger,
    copingStack,
    validity: (3 - Math.min(3, score.validity.flags.length)) / 3,
    validityFlags: score.validity.flags,
    crisisFlag: score.crisis,
    clinical: score,
  };

  // Stored parts use the canonical 0..100 energy every screen draws; the profile keeps 0..1 for the assessment.
  return { profile, parts: parts.map((part) => ({ ...part, energy: Math.round(part.energy * 100) })) };
}

export function clinicalPartName(id: string, lang: Lang): string {
  return displayPartName(id, lang);
}

export function clinicalPolarizationName(name: string, lang: Lang): string {
  return polarizationName(name, lang);
}

export function clinicalNeedName(key: string, lang: Lang): string {
  const reverse = Object.entries(NEED_KEYS).find(([, value]) => value === key)?.[0] ?? key;
  const names: Record<string, { en: string; ru: string }> = {
    safety: { en: 'Safety', ru: 'Безопасность' },
    love: { en: 'Love', ru: 'Любовь' },
    worth: { en: 'Worth', ru: 'Ценность' },
    autonomy: { en: 'Autonomy', ru: 'Автономия' },
    belonging: { en: 'Belonging', ru: 'Принадлежность' },
    meaning: { en: 'Meaning', ru: 'Смысл' },
    joy: { en: 'Joy', ru: 'Радость' },
  };
  return names[reverse]?.[lang] ?? key;
}
