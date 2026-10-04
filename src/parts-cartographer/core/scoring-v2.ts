// core/scoring-v2.ts — ScoredProfile (draft: core/data/scoring-v2.ts)
import type { Part } from '../pal/traits';
import { SCORING_NAME_POOLS } from '../i18n/strings';
import { rngFrom, hashStr, clamp01 } from './ports';

export interface ScoredProfile {
  version: 'v2';
  createdAt: number;
  parts: { id: string; name: string; family: Part['family']; energy: number; somatic: number; felt: 'low' | 'mid' | 'high' }[];
  resources: { id: string; name: string; energy: number }[];
  resourceLeaks: { name: string; leak: string }[];
  selfEnergyRadar: Record<string, number>; // 8 dims 0..1
  burden: number;                          // 0..1 global load
  headlineConstellation: string;
  headlineRu?: string;
  constellationEssay: string;
  subtypes: string[];
  polarizations: { a: string; b: string; tension: number }[];
  attachment: string;
  complexes: string[];
  needHunger: Record<string, number>;      // 5 needs 0..1
  copingStack: string[];
  validity: number;                        // 0..1
  crisisFlag: boolean;
}

export interface AssessmentInput {
  somatic: Record<string, { intensity: number; felt: 'low' | 'mid' | 'high' }>; // partId → answers
  statements: number[]; // 3 future-self statements, 1..7
  parts: Part[];
}

const RADAR = ['calm', 'curiosity', 'clarity', 'courage', 'compassion', 'connected', 'creativity', 'confidence'];
const NEEDS = ['hungerSafety', 'hungerRest', 'hungerPlay', 'hungerWitness', 'hungerAgency'];

export function scoreSystem(input: AssessmentInput): ScoredProfile {
  const { somatic, statements, parts } = input;
  const r = rngFrom(hashStr(JSON.stringify(statements) + parts.length));

  const scoredParts = parts
    .filter((p) => somatic[p.id])
    .map((p) => ({
      id: p.id, name: p.name, family: p.family,
      energy: clamp01((somatic[p.id].intensity - 1) / 4),
      somatic: somatic[p.id].intensity,
      felt: somatic[p.id].felt,
    }));

  const famEnergy = (fam: string) => {
    const list = scoredParts.filter((p) => p.family === fam);
    return list.length ? list.reduce((a, b) => a + b.energy, 0) / list.length : 0;
  };
  const managers = famEnergy('manager');
  const firefighters = famEnergy('firefighter');
  const exiles = famEnergy('exile');
  const resources = scoredParts.filter((p) => p.family === 'resource');
  const resourceAvg = resources.length ? resources.reduce((a, b) => a + b.energy, 0) / resources.length : 0.4;

  const stmtAvg = statements.reduce((a, b) => a + b, 0) / (statements.length * 7 || 1); // 0..1

  // Self-energy radar: seeded by statements + resources, damped by burden
  const burden = clamp01(managers * 0.3 + firefighters * 0.3 + exiles * 0.4);
  const radar: Record<string, number> = {};
  RADAR.forEach((dim, i) => {
    const base = 0.25 + stmtAvg * 0.45 + resourceAvg * 0.3;
    const wobble = (r() - 0.5) * 0.22 - burden * 0.12 + (i % 3 === 0 ? 0.05 : 0);
    radar[dim] = clamp01(base + wobble);
  });

  // constellation headline by dominant pattern
  const dom = Math.max(managers, firefighters, exiles);
  const domFamily = dom === managers ? 'manager' : dom === firefighters ? 'firefighter' : 'exile';
  const idx = Math.floor(r() * SCORING_NAME_POOLS.constellation.en.length);
  const headline = SCORING_NAME_POOLS.constellation.en[idx];
  const headlineRu = SCORING_NAME_POOLS.constellation.ru[idx];

  const polarizations: ScoredProfile['polarizations'] = [];
  if (firefighters > 0.5 && managers > 0.5) polarizations.push({ a: 'Manager', b: 'Firefighter', tension: clamp01((firefighters + managers) / 2) });
  if (exiles > 0.45 && managers > 0.55) polarizations.push({ a: 'Exile', b: 'Manager', tension: clamp01((exiles + managers) / 2) });
  if (!polarizations.length) polarizations.push({ a: 'Protest', b: 'Shutdown', tension: clamp01((exiles + firefighters) / 2) });

  const complexes = [
    ...(statements[0] >= 6 ? ['The Proving Ground'] : []),
    ...(exiles > 0.6 ? ['First-Wound Complex'] : []),
    ...(managers > 0.7 ? ['Control Complex'] : []),
    ...(stmtAvg < 0.45 ? ['Enoughness Complex'] : []),
  ].slice(0, 3);
  if (!complexes.length) complexes.push('Mild belonging complex');

  const attIdx = Math.min(3, Math.floor((1 - radar.calm) * 0.5 + burden * 0.6 + r() * 0.8));
  const subtypes = [
    SCORING_NAME_POOLS.subtype.en[Math.floor(r() * 6)],
    SCORING_NAME_POOLS.subtype.en[Math.floor(r() * 6)],
  ].filter((v, i, a) => a.indexOf(v) === i);

  const needHunger: Record<string, number> = {};
  NEEDS.forEach((n, i) => {
    needHunger[n] = clamp01(0.3 + burden * 0.4 + (r() - 0.4 + i * 0.05) * 0.5);
  });

  const copingStack = [
    ...(managers > 0.55 ? ['over-preparation', 'control'] : []),
    ...(firefighters > 0.55 ? ['numbing', 'urgency'] : []),
    ...(exiles > 0.55 ? ['withdrawal', 'people-pleasing'] : []),
    ...(resourceAvg > 0.6 ? ['grounding', 'witnessing'] : []),
  ].slice(0, 4);
  if (!copingStack.length) copingStack.push('perseverance');

  const resourceLeaks = resourceAvg < 0.5
    ? [{ name: 'Attention', leak: 'Doomscrolling after hard conversations' }, { name: 'Time', leak: 'Over-committing to avoid the inner queue' }]
    : [{ name: 'Sleep', leak: 'Late-night replays of the day' }];

  // validity: consistent intensity spread (all-4s on everything = suspect)
  const intensities = Object.values(somatic).map((x) => x.intensity);
  const spread = intensities.length ? Math.max(...intensities) - Math.min(...intensities) : 2;
  const validity = clamp01(0.5 + spread / 10 + stmtAvg * 0.3);

  const crisisFlag = exiles > 0.8 && radar.compassion < 0.35 && stmtAvg < 0.35;

  return {
    version: 'v2',
    createdAt: Date.now(),
    parts: scoredParts,
    resources: resources.map((x) => ({ id: x.id, name: x.name, energy: x.energy })),
    resourceLeaks,
    selfEnergyRadar: radar,
    burden,
    headlineConstellation: headline,
    constellationEssay: `Dominant family: ${domFamily}. ` + (
      (SCORING_NAME_POOLS.constellation.en.includes(headline) ? '' : '')
    ) + 'Your system protects before it permits — visit, don\'t fix.',
    subtypes,
    polarizations,
    attachment: SCORING_NAME_POOLS.attachment.en[attIdx],
    complexes,
    needHunger,
    copingStack,
    validity,
    crisisFlag,
    headlineRu,
  } as ScoredProfile;
}

export function profileToCode(profile: ScoredProfile): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const h = hashStr(JSON.stringify(profile.parts.map((p) => [p.id, p.somatic])) + profile.headlineConstellation);
  let out = '';
  let x = h;
  for (let i = 0; i < 8; i++) { out += abc[x % abc.length]; x = Math.floor(x / abc.length) + 7; }
  return out;
}
