import { STRINGS } from '../../shared/i18n/strings';
import { PART_COPY, LAYERS } from '../../shared/core/data/part-copy';
import { RESOURCES, SELF_QUALITIES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { constellationEssay, constellationName, resourceName, subtypeName, polarizationName, COMPLEX_COPY_RU } from '../../shared/core/data/constellation-copy';
import { COMPLEXES } from '../../shared/core/data/parts';
import type { ScoredProfile } from '../../shared/core/data/scoring-v2';
import { STRINGS as APP_STRINGS, type Lang } from '../i18n/strings';

export function clinicalAttachmentStyle(profile: ScoredProfile) {
  const a = profile.attachment;
  return a.disorganized ? 'disorganized'
    : a.anxious >= a.avoidant && a.anxious >= a.secure ? 'anxious'
    : a.avoidant >= a.secure ? 'avoidant' : 'secure';
}

export function clinicalSubtype(profile: ScoredProfile, id: string, lang: Lang): string {
  const item = profile.subtypes[id as keyof typeof profile.subtypes];
  return item ? subtypeName(id, item.slug, item.name, lang) : resourceName(id, lang);
}

export function sortedClinicalParts(profile: ScoredProfile) {
  const order = { dominant: 0, prominent: 1, present: 2, dormant: 3 };
  return [...SHADOW_PARTS].sort((a, b) => order[profile.parts[a].tier] - order[profile.parts[b].tier]
    || profile.parts[b].T - profile.parts[a].T || SHADOW_PARTS.indexOf(a) - SHADOW_PARTS.indexOf(b));
}

/** The loudest unmet need, or null when nothing measured is unmet. Profiles saved before this check could name the unmeasured joy. */
export function shownNeed(profile: ScoredProfile) {
  const top = profile.topHunger;
  return top && top.need !== 'joy' && top.hunger > 0 ? top : null;
}

const VALIDITY_FLAG_KEYS: Record<string, 'validityAttentionFlag' | 'validityInfrequencyFlag'> = { attention: 'validityAttentionFlag', infrequency: 'validityInfrequencyFlag' };

/** Complete deterministic report. Private free text is excluded unless explicitly supplied by the owner. */
export function buildClinicalMarkdown(profile: ScoredProfile, lang: Lang, futureSelf: string[] = []): string {
  const ui = STRINGS.innerverseReport.ui[lang];
  const labels = STRINGS.innerverseReport.layerLabels[lang];
  const lines = [`# ${constellationName(profile.headline, lang)}`, '', constellationEssay(profile.headline, lang), '',
    `## ${ui.strongestResource}`, resourceName(profile.strongestResource.id, lang), '',
    `## ${ui.selfEnergy}`, `${profile.selfEnergy}/100`, `${ui.burden}: ${Math.round(profile.burden)}`, '',
    ...SELF_QUALITIES.map((quality) => `- ${lang === 'ru' ? STRINGS.innerverseReport.qualityLabelsRu[quality] : quality}: ${profile.selfRadar[quality]}`), '',
    `## ${ui.partsByTier}`];
  for (const id of sortedClinicalParts(profile)) {
    lines.push(`### ${clinicalSubtype(profile, id, lang)} · T ${Math.round(profile.parts[id].T)} · ${ui.tierNames[profile.parts[id].tier]}`);
    for (const layer of LAYERS) lines.push(`- ${labels[layer]}: ${PART_COPY[lang][id][layer]}`);
  }
  if (profile.polarizations.length) lines.push('', `## ${ui.polarizations}`, ...profile.polarizations.map((p) => `- ${polarizationName(p.name, lang)}: ${p.pair.map((id) => clinicalSubtype(profile, id, lang)).join(' ↔ ')}`));
  lines.push('', `## ${ui.complexes}`);
  if (!profile.activeComplexes.length) lines.push(ui.noComplexes);
  for (const complex of profile.activeComplexes) {
    const def = lang === 'ru' ? COMPLEX_COPY_RU[complex.id] : COMPLEXES[complex.id];
    lines.push(`### ${def.name} · ${ui.complexTierNames[complex.tier]} · ${Math.round(complex.activation)}`, `${ui.complexBelief}: ${def.belief}`, `${ui.complexExperiment}: ${def.experiment}`);
  }
  lines.push('', `## ${ui.copingStack}`, ...[profile.copingStack.l1, profile.copingStack.l2, profile.copingStack.l3, profile.copingStack.floor]
    .flatMap((id) => id ? [`- ${clinicalSubtype(profile, id, lang)}`] : []), '', `## ${ui.attachment}`, ui.attStyle[clinicalAttachmentStyle(profile)]);
  const need = shownNeed(profile);
  lines.push('', `## ${ui.needs}`, ...(need ? [lang === 'ru' ? STRINGS.innerverseReport.needLabelsRu[need.need] : need.need,
    STRINGS.innerverseReport.needPractice[lang][need.need]] : [ui.needsNone]));
  lines.push('', `## ${ui.resources}`, ...RESOURCES.map((id) => `- ${resourceName(id, lang)}: T ${Math.round(profile.resources[id].T)} · ${ui.band[profile.resources[id].band]}`));
  if (futureSelf.some((answer) => answer.trim())) lines.push('', `## ${lang === 'ru' ? 'Будущее «я»' : 'Future Self'}`, ...futureSelf);
  lines.push('', `## ${lang === 'ru' ? 'Достоверность' : 'Validity'}`, ...(profile.validity.ok ? ['✓'] : profile.validity.flags.map((flag) => VALIDITY_FLAG_KEYS[flag] ? APP_STRINGS[VALIDITY_FLAG_KEYS[flag]][lang] : flag)));
  if (profile.crisis) lines.push('', ui.crisis);
  lines.push('', ui.ethics);
  return lines.join('\n');
}

export { downloadText } from './file-download';
