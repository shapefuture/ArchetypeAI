/**
 * Synastry Computation Engine
 *
 * Deterministic partner compatibility analysis based on
 * overlaying two 4D archetype profiles.
 */

import {
  PURSUE_WITHDRAW_1, PURSUE_WITHDRAW_2, MUTUAL_ESCALATION, DEEP_FREEZE,
  VOLATILE_BOND, HEALING_CONTAINER, PARALLEL_SOVEREIGNTY,
  PROJECTION_MATRIX, RELATIONAL_ARCHETYPES, SYNASTRY_DIM_LABELS,
} from '../../i18n/strings';
import { PoleScores, ScoredArchetype, PartType, DevelopmentalOrigin, PartsDynamic, Complex, computePoleScores, generateArchetypes, generatePartsDynamics, detectComplexes, computeTriggerMap, DissociationIndicator, RegulationCapacity, BoundaryAssessment, CoherenceIndicator, computeDissociation, computeRegulationCapacity, computeBoundaryStyle, computeNarrativeCoherence, positivePoleStrength, negativePoleStrength } from './scoring';

// --- Types ---

export interface PersonArchetypeSummary {
  center: number[];
  pantheon: string[];
  topArchetypes: {
    name: string;
    symbol: string;
    cluster: string;
    prominence: number;
    description: string;
    wound: string;
    shadow: string;
    invitation: string;
    partType: PartType;
    developmentalOrigin: DevelopmentalOrigin;
  }[];
}

export interface DimensionalResonance {
  dimension: string;
  delta: number;
  pattern: 'harmonic' | 'complementary' | 'polarized' | 'dissonant';
  descriptionEn: string;
  descriptionRu: string;
}

export interface AttachmentDance {
  pattern: 'pursue-withdraw' | 'mutual-escalation' | 'deep-freeze'
           | 'healing-container' | 'volatile-bond' | 'parallel-sovereignty';
  descriptionEn: string;
  descriptionRu: string;
  cycleEn: string;
  cycleRu: string;
  deactivationEn: string;
  deactivationRu: string;
}

export interface ShadowProjection {
  fromCluster: string;
  toCluster: string;
  mechanismEn: string;
  mechanismRu: string;
  healingEn: string;
  healingRu: string;
}

export interface RelationalArchetype {
  nameEn: string;
  nameRu: string;
  symbol: string;
  descriptionEn: string;
  descriptionRu: string;
  invitationEn: string;
  invitationRu: string;
  shadowEn: string;
  shadowRu: string;
}

export interface SynastryReport {
  person1Summary: PersonArchetypeSummary;
  person2Summary: PersonArchetypeSummary;
  person1Dynamics: PartsDynamic[];
  person2Dynamics: PartsDynamic[];
  dimensionalResonance: DimensionalResonance[];
  attachmentDance: AttachmentDance;
  shadowProjections: ShadowProjection[];
  relationalArchetype: RelationalArchetype;
  resonanceDepth: number;
  growthPotential: number;
  challengeLevel: number;
  safetyIndex: number;
  // Phase 2 additions
  polarMap: Polarity[];
  dyadicAnalysis: DyadicAnalysis;
  growthSequence: GrowthStep[];
  // Phase 3 additions
  person1Dissociation: DissociationIndicator;
  person2Dissociation: DissociationIndicator;
  person1Regulation: RegulationCapacity;
  person2Regulation: RegulationCapacity;
  person1Boundary: BoundaryAssessment;
  person2Boundary: BoundaryAssessment;
  person1Coherence: CoherenceIndicator;
  person2Coherence: CoherenceIndicator;
  boundaryInteraction: BoundaryInteraction;
  // Phase 2 cross-person additions
  person1Complexes: Complex[];
  person2Complexes: Complex[];
  sharedComplexes: string[];
  complementaryComplexes: string[];
  crossPersonTriggers: CrossPersonTrigger[];
  jointPathway: JointPathwayStep[];
}

export interface BoundaryInteraction {
  pattern: string;
  patternRu: string;
  risk: string;
  riskRu: string;
}

export interface CrossPersonTrigger {
  person1Trigger: string;
  person2Trigger: string;
  interactionDesc: string;
  interactionDescRu: string;
}

export interface JointPathwayStep {
  stage: number;
  label: string;
  labelRu: string;
  action: string;
  actionRu: string;
}

// --- Helpers ---

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function pct(v: number): string {
  return (clamp01(v) * 100).toFixed(0);
}

function avgDelta(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0) / a.length;
}

function avgTension(p1: PoleScores, p2: PoleScores): number {
  const tensions = [
    Math.abs(positivePoleStrength(p1.attAnxious) - positivePoleStrength(p2.attAnxious)),
    Math.abs(negativePoleStrength(p1.attAvoidant) - negativePoleStrength(p2.attAvoidant)),
    Math.abs(positivePoleStrength(p1.tempHot) - positivePoleStrength(p2.tempHot)),
  ];
  return tensions.reduce((s, v) => s + v, 0) / tensions.length;
}

// --- Main Computation ---

export function computeSynastry(
  responses1: number[],
  responses2: number[],
  lang: 'en' | 'ru' = 'en'
): SynastryReport {
  const poles1 = computePoleScores(responses1);
  const poles2 = computePoleScores(responses2);
  const { archetypes: p1 } = generateArchetypes(responses1, lang);
  const { archetypes: p2 } = generateArchetypes(responses2, lang);

  const toPersonSummary = (poles: PoleScores, archetypes: ScoredArchetype[]): PersonArchetypeSummary => ({
    center: [...poles.center],
    pantheon: archetypes.map(a => a.name),
    topArchetypes: archetypes.slice(0, 5).map(a => ({
      name: a.name,
      symbol: a.symbol,
      cluster: a.cluster,
      prominence: a.prominence,
      description: a.description,
      wound: a.wound,
      shadow: a.shadow,
      invitation: a.invitation,
      partType: a.partType,
      developmentalOrigin: a.developmentalOrigin,
    })),
  });

  const dynamics1 = generatePartsDynamics(p1, lang);
  const dynamics2 = generatePartsDynamics(p2, lang);

  const resonance = computeDimensionalResonance(poles1, poles2);
  const dance = computeAttachmentDance(poles1, poles2);
  const projections = computeShadowProjections(p1, p2);
  const safetyIdx = clamp01((poles1.healthScore + poles2.healthScore) / 2);
  const growthPot = clamp01(avgTension(poles1, poles2));

  const summary1 = toPersonSummary(poles1, p1);
  const summary2 = toPersonSummary(poles2, p2);

  return {
    person1Summary: summary1,
    person2Summary: summary2,
    person1Dynamics: dynamics1,
    person2Dynamics: dynamics2,
    dimensionalResonance: resonance,
    attachmentDance: dance,
    shadowProjections: projections,
    relationalArchetype: computeRelationalArchetype(poles1, poles2),
    resonanceDepth: clamp01(1 - avgDelta(poles1.center, poles2.center) / 2),
    growthPotential: growthPot,
    challengeLevel: clamp01(avgDelta(poles1.center, poles2.center)),
    safetyIndex: safetyIdx,
    // Phase 2 additions
    polarMap: computePolarMap(poles1, poles2, lang),
    dyadicAnalysis: computeDyadicAnalysis(poles1, poles2, summary1, summary2, lang),
    growthSequence: computeGrowthSequence(resonance, dance, projections, safetyIdx, growthPot, lang),
    // Phase 3 additions
    person1Dissociation: computeDissociation(responses1, poles1),
    person2Dissociation: computeDissociation(responses2, poles2),
    person1Regulation: computeRegulationCapacity(responses1, poles1),
    person2Regulation: computeRegulationCapacity(responses2, poles2),
    person1Boundary: computeBoundaryStyle(poles1),
    person2Boundary: computeBoundaryStyle(poles2),
    person1Coherence: computeNarrativeCoherence(responses1, poles1),
    person2Coherence: computeNarrativeCoherence(responses2, poles2),
    boundaryInteraction: computeBoundaryInteraction(computeBoundaryStyle(poles1), computeBoundaryStyle(poles2)),
    // Phase 2 cross-person additions
    person1Complexes: detectComplexes(p1, poles1, lang),
    person2Complexes: detectComplexes(p2, poles2, lang),
    sharedComplexes: computeSharedComplexes(p1, p2, poles1, poles2, lang),
    complementaryComplexes: computeComplementaryComplexes(p1, p2, poles1, poles2, lang),
    crossPersonTriggers: computeCrossPersonTriggers(p1, p2, poles1, poles2, lang),
    jointPathway: computeJointPathway(p1, p2, poles1, poles2, lang),
  };
}

// --- Dimensional Resonance ---

const DIM_LABELS = SYNASTRY_DIM_LABELS;

function describeResonance(
  pattern: 'harmonic' | 'complementary' | 'polarized' | 'dissonant',
  dim: string,
  v1: number,
  v2: number,
): { en: string; ru: string } {
  const labels = DIM_LABELS[dim];
  const absDelta = Math.abs(v1 - v2);
  const pct = Math.round(absDelta * 100);
  const who1 = v1 < -0.2 ? labels.poleNeg : v1 > 0.2 ? labels.polePos : { en: 'balanced', ru: 'сбалансированный' };
  const who2 = v2 < -0.2 ? labels.poleNeg : v2 > 0.2 ? labels.polePos : { en: 'balanced', ru: 'сбалансированный' };

  switch (pattern) {
    case 'harmonic': {
      const qual = absDelta < 0.15 ? { en: 'nearly identical', ru: 'вы почти совпадаете' } : { en: 'closely matched', ru: 'вы близки' };
      return {
        en: `Your ${labels.en} is ${qual.en} (${pct}% apart). Both of you are ${who1.en} in how you engage — a shared rhythm that creates instant understanding.`,
        ru: `По линии «${labels.ru}» разница ${pct}%: ${qual.ru}. Общий ритм в обоих создаёт мгновенное взаимопонимание.`,
      };
    }
    case 'complementary': {
      return {
        en: `Your ${labels.en} differs by ${pct}% — Person 1 leans ${who1.en}, Person 2 leans ${who2.en}. This creates a natural dynamic where each brings what the other lacks.`,
        ru: `По линии «${labels.ru}» различие ${pct}%: первый — ${who1.ru}, второй — ${who2.ru}. Это создаёт естественную динамику, где каждый привносит то, чего не хватает другому.`,
      };
    }
    case 'polarized': {
      return {
        en: `Strong polarity on ${labels.en} (${pct}% gap) — Person 1 is ${who1.en} while Person 2 is ${who2.en}. This tension is powerful but requires conscious navigation to avoid power struggles.`,
        ru: `Резкая полярность по линии «${labels.ru}» (разрыв ${pct}%): первый — ${who1.ru}, второй — ${who2.ru}. Это напряжённая динамика, которая требует осознанной навигации, чтобы не скатиться в борьбу.`,
      };
    }
    case 'dissonant': {
      return {
        en: `Extreme dissonance on ${labels.en} (${pct}% gap) — you inhabit fundamentally different positions. Person 1 is ${who1.en}, Person 2 is ${who2.en}. This is the hardest dimension to bridge, but also the one with the greatest transformational potential.`,
        ru: `Острый диссонанс по линии «${labels.ru}» (разрыв ${pct}%): вы находитесь в принципиально разных позициях. Первый — ${who1.ru}, второй — ${who2.ru}. Это самое сложное измерение для моста — и самое трансформирующее.`,
      };
    }
  }
}

function computeDimensionalResonance(p1: PoleScores, p2: PoleScores): DimensionalResonance[] {
  const dims = [
    { key: 'AGENCY', v1: p1.center[0], v2: p2.center[0] },
    { key: 'TEMPERATURE', v1: p1.center[1], v2: p2.center[1] },
    { key: 'FOCUS', v1: p1.center[2], v2: p2.center[2] },
    { key: 'ATTACHMENT', v1: p1.center[3], v2: p2.center[3] },
  ];

  return dims.map(d => {
    const delta = Math.abs(d.v1 - d.v2);
    const pattern: 'harmonic' | 'complementary' | 'polarized' | 'dissonant' =
      delta <= 0.3 ? 'harmonic' : delta <= 0.6 ? 'complementary' : delta <= 1.2 ? 'polarized' : 'dissonant';
    const desc = describeResonance(pattern, d.key, d.v1, d.v2);
    return {
      dimension: d.key,
      delta: d.v1 - d.v2,
      pattern,
      descriptionEn: desc.en,
      descriptionRu: desc.ru,
    };
  });
}

// --- Attachment Dance ---








function computeAttachmentDance(p1: PoleScores, p2: PoleScores): AttachmentDance {
  const anx1 = positivePoleStrength(p1.attAnxious), avo1 = negativePoleStrength(p1.attAvoidant);
  const anx2 = positivePoleStrength(p2.attAnxious), avo2 = negativePoleStrength(p2.attAvoidant);
  const health = (p1.healthScore + p2.healthScore) / 2;

  const disorg1 = p1.disorganizedAttachment;
  const disorg2 = p2.disorganizedAttachment;

  if (disorg1 || disorg2) return VOLATILE_BOND;
  if (health > 0.4 && anx1 < 0.2 && avo1 < 0.2 && anx2 < 0.2 && avo2 < 0.2) return PARALLEL_SOVEREIGNTY;
  if (health > 0.35 && ((anx1 < 0.15 && avo1 < 0.15) || (anx2 < 0.15 && avo2 < 0.15))) return HEALING_CONTAINER;
  if (anx1 > 0.2 && avo2 > 0.2) return PURSUE_WITHDRAW_1;
  if (anx2 > 0.2 && avo1 > 0.2) return PURSUE_WITHDRAW_2;
  if (anx1 > 0.2 && anx2 > 0.2) return MUTUAL_ESCALATION;
  if (avo1 > 0.2 && avo2 > 0.2) return DEEP_FREEZE;
  return HEALING_CONTAINER;
}

// --- Shadow Projections ---


function getTopClusters(archetypes: ScoredArchetype[], max = 2): string[] {
  if (archetypes.length === 0) return ['gift_archetypes'];
  const clusterScores: Record<string, number> = {};
  for (const a of archetypes) {
    clusterScores[a.cluster] = (clusterScores[a.cluster] || 0) + a.prominence;
  }
  return Object.entries(clusterScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, max)
    .map(([c]) => c);
}

function computeShadowProjections(p1: ScoredArchetype[], p2: ScoredArchetype[]): ShadowProjection[] {
  const clusters1 = getTopClusters(p1);
  const clusters2 = getTopClusters(p2);

  const results: ShadowProjection[] = [];
  const seen = new Set<string>();

  for (const c1 of clusters1) {
    for (const c2 of clusters2) {
      if (c1 === c2) continue;
      const key1 = `${c1}->${c2}`;
      if (!seen.has(key1)) {
        const proj = PROJECTION_MATRIX[c1]?.[c2];
        if (proj) {
          results.push({ fromCluster: c1, toCluster: c2, ...proj });
          seen.add(key1);
        }
      }
      const key2 = `${c2}->${c1}`;
      if (!seen.has(key2)) {
        const proj = PROJECTION_MATRIX[c2]?.[c1];
        if (proj) {
          results.push({ fromCluster: c2, toCluster: c1, ...proj });
          seen.add(key2);
        }
      }
    }
  }

  // Cap at 6 projections to keep it readable
  return results.slice(0, 6);
}

// --- Relational Archetype ---


function computeRelationalArchetype(p1: PoleScores, p2: PoleScores): RelationalArchetype {
  const mid = p1.center.map((v, i) => (v + p2.center[i]) / 2);
  const health = (p1.healthScore + p2.healthScore) / 2;
  const delta = avgDelta(p1.center, p2.center);
  const disorg = p1.disorganizedAttachment || p2.disorganizedAttachment;

  // Compute dimension-specific deltas for more nuanced selection
  const agencyDelta = Math.abs(p1.center[0] - p2.center[0]);
  const tempDelta = Math.abs(p1.center[1] - p2.center[1]);
  const focusDelta = Math.abs(p1.center[2] - p2.center[2]);
  const attDelta = Math.abs(p1.center[3] - p2.center[3]);
  const maxDeltaDim = Math.max(agencyDelta, tempDelta, focusDelta, attDelta);
  const hasMirror = agencyDelta > 0.5 && attDelta > 0.5; // Opposite on both agency & attachment

  // Tiered selection based on actual relational dynamics
  if (health > 0.35 && delta < 0.3 && !disorg) {
    return RELATIONAL_ARCHETYPES[1]; // Sanctuary
  }
  if (hasMirror && delta > 0.5) {
    return RELATIONAL_ARCHETYPES[3]; // Mirror Chamber
  }
  if (disorg && delta > 0.3) {
    return RELATIONAL_ARCHETYPES[5]; // Spiral Dance
  }
  if (delta > 0.8) {
    return RELATIONAL_ARCHETYPES[2]; // Crucible
  }
  if (health > 0.3 && delta < 0.5 && !disorg) {
    return RELATIONAL_ARCHETYPES[6]; // Quiet Revolution
  }
  if (delta > 0.4 && maxDeltaDim === focusDelta) {
    return RELATIONAL_ARCHETYPES[4]; // Bridge Builders
  }
  if (delta > 0.3 && maxDeltaDim === tempDelta) {
    return RELATIONAL_ARCHETYPES[0]; // Alchemical Marriage
  }
  if (disorg) {
    return RELATIONAL_ARCHETYPES[5]; // Spiral Dance
  }
  // One partner significantly stronger on agency → Eclipse
  const agencyPolarity = p1.center[0] * p2.center[0] < 0 && agencyDelta > 0.6;
  if (agencyPolarity) {
    return RELATIONAL_ARCHETYPES[7]; // Eclipse
  }
  // Deterministic fallback using weighted hash from actual values
  const h = Math.abs(Math.round(mid[0] * 173 + mid[1] * 277 + mid[2] * 397 + mid[3] * 491));
  return RELATIONAL_ARCHETYPES[h % RELATIONAL_ARCHETYPES.length];
}

// =============================================================================
// Phase 2: Synastry-Specific Computed Analyses
// =============================================================================

// --- 2.3 Polar Map (Relational Polarity Detection) ---

export interface Polarity {
  dimension: string;
  direction: string; // e.g. "Person 1 carries the active pole, Person 2 the receptive"
  directionRu: string;
  severity: number; // 0-1
  clinicalSignificance: string;
  clinicalSignificanceRu: string;
}

export function computePolarMap(
  p1: PoleScores,
  p2: PoleScores,
  lang: 'en' | 'ru' = 'en'
): Polarity[] {
  const polarities: Polarity[] = [];
  const p1Active = negativePoleStrength(p1.agencyActive);
  const p2Active = negativePoleStrength(p2.agencyActive);
  const p1Receptive = positivePoleStrength(p1.agencyReceptive);
  const p2Receptive = positivePoleStrength(p2.agencyReceptive);
  const p1Hot = positivePoleStrength(p1.tempHot);
  const p2Hot = positivePoleStrength(p2.tempHot);
  const p1Cool = negativePoleStrength(p1.tempCool);
  const p2Cool = negativePoleStrength(p2.tempCool);
  const p1Other = positivePoleStrength(p1.focusOther);
  const p2Other = positivePoleStrength(p2.focusOther);
  const p1Self = negativePoleStrength(p1.focusSelf);
  const p2Self = negativePoleStrength(p2.focusSelf);
  const p1Anx = positivePoleStrength(p1.attAnxious);
  const p2Anx = positivePoleStrength(p2.attAnxious);
  const p1Avo = negativePoleStrength(p1.attAvoidant);
  const p2Avo = negativePoleStrength(p2.attAvoidant);

  // Agency polarity
  const agencyDiff = Math.abs(p1.center[0] - p2.center[0]);
  if (agencyDiff > 0.25) {
    const p1Dominant = p1.center[0] < p2.center[0];
    const activeStrength = p1Dominant ? p1Active : p2Active;
    const receptiveStrength = p1Dominant ? p2Receptive : p1Receptive;
    const trailingActive = p1Dominant ? p2Active : p1Active;
    const classicSplit = activeStrength > 0.25 && receptiveStrength >= trailingActive;
    polarities.push({
      dimension: 'AGENCY',
      direction: classicSplit
        ? p1Dominant
          ? `Person 1 carries the active pole (+${pct(activeStrength)}%), Person 2 the receptive (+${pct(receptiveStrength)}%)`
          : `Person 2 carries the active pole (+${pct(activeStrength)}%), Person 1 the receptive (+${pct(receptiveStrength)}%)`
        : p1Dominant
          ? `Person 1 carries more initiating charge (+${pct(activeStrength)}%), while Person 2 initiates less (+${pct(trailingActive)}%)`
          : `Person 2 carries more initiating charge (+${pct(activeStrength)}%), while Person 1 initiates less (+${pct(trailingActive)}%)`,
      directionRu: classicSplit
        ? p1Dominant
          ? `Первый несёт активный полюс (+${pct(activeStrength)}%), Второй — восприимчивый (+${pct(receptiveStrength)}%)`
          : `Второй несёт активный полюс (+${pct(activeStrength)}%), Первый — восприимчивый (+${pct(receptiveStrength)}%)`
        : p1Dominant
          ? `Первый несёт больше инициирующего заряда (+${pct(activeStrength)}%), Второй инициирует меньше (+${pct(trailingActive)}%)`
          : `Второй несёт больше инициирующего заряда (+${pct(activeStrength)}%), Первый инициирует меньше (+${pct(trailingActive)}%)`,
      severity: clamp01(agencyDiff),
      clinicalSignificance: classicSplit
        ? p1Dominant
          ? 'Classic controller-compliant dynamic. Risk: Person 1 may dominate decisions while Person 2 loses agency.'
          : 'Classic controller-compliant dynamic. Risk: Person 2 may dominate decisions while Person 1 loses agency.'
        : 'Agency is asymmetrical. One partner is more likely to set pace, decisions, and conflict direction.',
      clinicalSignificanceRu: classicSplit
        ? p1Dominant
          ? 'Классическая динамика «контролирующий-подчинённый». Риск: Первый может доминировать в решениях, а Второй теряет агентность.'
          : 'Классическая динамика «контролирующий-подчинённый». Риск: Второй может доминировать в решениях, а Первый теряет агентность.'
        : 'Агентность распределена несимметрично. Один партнёр с большей вероятностью задаёт темп, решения и направление конфликта.',
    });
  }

  // Temperature polarity
  const tempDiff = Math.abs(p1.center[1] - p2.center[1]);
  if (tempDiff > 0.25) {
    const p1Hotter = p1.center[1] > p2.center[1];
    const hotStrength = p1Hotter ? p1Hot : p2Hot;
    const coolStrength = p1Hotter ? p2Cool : p1Cool;
    const trailingHot = p1Hotter ? p2Hot : p1Hot;
    const classicSplit = hotStrength > 0.25 && coolStrength >= trailingHot;
    polarities.push({
      dimension: 'TEMPERATURE',
      direction: classicSplit
        ? p1Hotter
          ? `Person 1 runs hot (+${pct(hotStrength)}%), Person 2 runs cool (+${pct(coolStrength)}%)`
          : `Person 2 runs hot (+${pct(hotStrength)}%), Person 1 runs cool (+${pct(coolStrength)}%)`
        : p1Hotter
          ? `Person 1 carries more emotional intensity (+${pct(hotStrength)}%), while Person 2 runs cooler (+${pct(coolStrength)}%)`
          : `Person 2 carries more emotional intensity (+${pct(hotStrength)}%), while Person 1 runs cooler (+${pct(coolStrength)}%)`,
      directionRu: classicSplit
        ? p1Hotter
          ? `Первый — горячий (+${pct(hotStrength)}%), Второй — холодный (+${pct(coolStrength)}%)`
          : `Второй — горячий (+${pct(hotStrength)}%), Первый — холодный (+${pct(coolStrength)}%)`
        : p1Hotter
          ? `Первый несёт больше эмоциональной интенсивности (+${pct(hotStrength)}%), Второй — холоднее (+${pct(coolStrength)}%)`
          : `Второй несёт больше эмоциональной интенсивности (+${pct(hotStrength)}%), Первый — холоднее (+${pct(coolStrength)}%)`,
      severity: clamp01(tempDiff),
      clinicalSignificance: 'Emotional temperature mismatch. The hot partner may experience the cool partner as dismissive; the cool partner may feel overwhelmed.',
      clinicalSignificanceRu: 'Несоответствие эмоциональной температуры. Горячий партнёр может воспринимать холодного как обесценивающего; холодный может чувствовать себя подавленным.',
    });
  }

  // Attachment polarity (most clinically significant)
  const attDiff = Math.abs(p1.center[3] - p2.center[3]);
  if (attDiff > 0.35) {
    const p1Anxious = p1.center[3] > p2.center[3];
    const anxiousStrength = p1Anxious ? p1Anx : p2Anx;
    const avoidantStrength = p1Anxious ? p2Avo : p1Avo;
    const otherAnxious = p1Anxious ? p2Anx : p1Anx;
    const classicTrap = anxiousStrength > 0.3 && avoidantStrength >= otherAnxious;
    polarities.push({
      dimension: 'ATTACHMENT',
      direction: classicTrap
        ? p1Anxious
          ? 'Person 1 carries the anxious pole, Person 2 the avoidant — classic anxious-avoidant trap'
          : 'Person 2 carries the anxious pole, Person 1 the avoidant — classic anxious-avoidant trap'
        : p1Anxious
          ? `Person 1 carries more anxious attachment charge (+${pct(anxiousStrength)}%), while Person 2 is less activated`
          : `Person 2 carries more anxious attachment charge (+${pct(anxiousStrength)}%), while Person 1 is less activated`,
      directionRu: classicTrap
        ? p1Anxious
          ? 'Первый несёт тревожный полюс, Второй — избегающий (классическая ловушка)'
          : 'Второй несёт тревожный полюс, Первый — избегающий (классическая ловушка)'
        : p1Anxious
          ? `Первый несёт больше тревожного заряда привязанности (+${pct(anxiousStrength)}%), Второй менее активирован`
          : `Второй несёт больше тревожного заряда привязанности (+${pct(anxiousStrength)}%), Первый менее активирован`,
      severity: clamp01(attDiff),
      clinicalSignificance: classicTrap
        ? 'The most clinically significant polarity: pursue-withdraw cycle. Anxious partner pursues, avoidant partner withdraws, each triggering the other.'
        : 'Attachment style mismatch may create friction in how closeness and distance are negotiated.',
      clinicalSignificanceRu: classicTrap
        ? 'Наиболее клинически значимая полярность: цикл «преследование-отстранение». Тревожный партнёр преследует, избегающий отстраняется, каждый провоцирует другого.'
        : 'Несоответствие стилей привязанности может создавать трения в том, как близость и дистанция согласовываются.',
    });
  }

  // Focus polarity
  const focusDiff = Math.abs(p1.center[2] - p2.center[2]);
  if (focusDiff > 0.25) {
    const p1OtherFocused = p1.center[2] > p2.center[2];
    const otherStrength = p1OtherFocused ? p1Other : p2Other;
    const selfStrength = p1OtherFocused ? p2Self : p1Self;
    const trailingOther = p1OtherFocused ? p2Other : p1Other;
    const classicSplit = otherStrength > 0.25 && selfStrength >= trailingOther;
    polarities.push({
      dimension: 'FOCUS',
      direction: classicSplit
        ? p1OtherFocused
          ? `Person 1 is other-focused (+${pct(otherStrength)}%), Person 2 is self-focused (+${pct(selfStrength)}%)`
          : `Person 2 is other-focused (+${pct(otherStrength)}%), Person 1 is self-focused (+${pct(selfStrength)}%)`
        : p1OtherFocused
          ? `Person 1 tracks the relationship more (+${pct(otherStrength)}%), while Person 2 tracks self-protection more (+${pct(selfStrength)}%)`
          : `Person 2 tracks the relationship more (+${pct(otherStrength)}%), while Person 1 tracks self-protection more (+${pct(selfStrength)}%)`,
      directionRu: classicSplit
        ? p1OtherFocused
          ? `Первый сфокусирован на другом (+${pct(otherStrength)}%), Второй — на себе (+${pct(selfStrength)}%)`
          : `Второй сфокусирован на другом (+${pct(otherStrength)}%), Первый — на себе (+${pct(selfStrength)}%)`
        : p1OtherFocused
          ? `Первый больше отслеживает отношения (+${pct(otherStrength)}%), Второй — самозащиту (+${pct(selfStrength)}%)`
          : `Второй больше отслеживает отношения (+${pct(otherStrength)}%), Первый — самозащиту (+${pct(selfStrength)}%)`,
      severity: clamp01(focusDiff),
      clinicalSignificance: 'Asymmetric attention distribution. The other-focused partner may neglect self-care; the self-focused partner may miss the other\'s needs.',
      clinicalSignificanceRu: 'Асимметричное распределение внимания. Партнёр, ориентированный на другого, может пренебрегать заботой о себе; партнёр, ориентированный на себя, может не замечать потребностей другого.',
    });
  }

  return polarities;
}

// --- 2.4 Dyadic Analysis (Unconscious Contract) ---

export interface DyadicAnalysis {
  emotionalLoadCarrier: 'person1' | 'person2' | 'balanced';
  emotionalLoadDesc: string;
  emotionalLoadDescRu: string;
  initiationPattern: 'person1' | 'person2' | 'mutual';
  initiationDesc: string;
  initiationDescRu: string;
  familyRecapitulation: string;
  familyRecapitulationRu: string;
  unconsciousContract: string;
  unconsciousContractRu: string;
}

export function computeDyadicAnalysis(
  p1: PoleScores,
  p2: PoleScores,
  summary1: PersonArchetypeSummary,
  summary2: PersonArchetypeSummary,
  lang: 'en' | 'ru' = 'en'
): DyadicAnalysis {
  // Emotional load: who carries more emotional intensity?
  const p1Hot = positivePoleStrength(p1.tempHot);
  const p2Hot = positivePoleStrength(p2.tempHot);
  const p1Other = positivePoleStrength(p1.focusOther);
  const p2Other = positivePoleStrength(p2.focusOther);
  const p1Init = negativePoleStrength(p1.agencyActive);
  const p2Init = negativePoleStrength(p2.agencyActive);
  const p1Load = p1Hot + p1Other;
  const p2Load = p2Hot + p2Other;
  const loadCarrier: 'person1' | 'person2' | 'balanced' =
    Math.abs(p1Load - p2Load) < 0.15 ? 'balanced' : p1Load > p2Load ? 'person1' : 'person2';

  // Initiation: who initiates more?
  const initiationPattern: 'person1' | 'person2' | 'mutual' =
    Math.abs(p1Init - p2Init) < 0.15 ? 'mutual' : p1Init > p2Init ? 'person1' : 'person2';

  // Family recapitulation: check if partner clusters match developmental origins
  const p1Clusters = summary1.topArchetypes.map(a => a.cluster);
  const p2Clusters = summary2.topArchetypes.map(a => a.cluster);
  const recapEn = buildRecapitulation(p1Clusters, p2Clusters, summary1, summary2);
  const recapRu = recapEn; // will use lang to differentiate if needed

  // Unconscious contract from polarity + dance combination
  const contract = buildContract(p1, p2, loadCarrier, initiationPattern);

  return {
    emotionalLoadCarrier: loadCarrier,
    emotionalLoadDesc: loadCarrier === 'balanced'
      ? 'Emotional labor is relatively evenly distributed between partners.'
      : loadCarrier === 'person1'
        ? `Person 1 carries more of the emotional load (temperature: +${pct(p1Hot)}%, other-focus: +${pct(p1Other)}%). They may be the "emotional container" for the relationship.`
        : `Person 2 carries more of the emotional load (temperature: +${pct(p2Hot)}%, other-focus: +${pct(p2Other)}%). They may be the "emotional container" for the relationship.`,
    emotionalLoadDescRu: loadCarrier === 'balanced'
      ? 'Эмоциональная нагрузка относительно равномерно распределена между партнёрами.'
      : loadCarrier === 'person1'
        ? `Первый несёт больше эмоциональной нагрузки (температура: +${pct(p1Hot)}%, фокус на другом: +${pct(p1Other)}%). Возможно, он является «эмоциональным контейнером» отношений.`
        : `Второй несёт больше эмоциональной нагрузки (температура: +${pct(p2Hot)}%, фокус на другом: +${pct(p2Other)}%). Возможно, он является «эмоциональным контейнером» отношений.`,
    initiationPattern,
    initiationDesc: initiationPattern === 'mutual'
      ? 'Both partners share initiation relatively equally.'
      : initiationPattern === 'person1'
        ? `Person 1 is the primary initiator (agency: +${pct(p1Init)}%). Person 2 usually responds to the other\u2019s lead.`
        : `Person 2 is the primary initiator (agency: +${pct(p2Init)}%). Person 1 usually responds to the other\u2019s lead.`,
    initiationDescRu: initiationPattern === 'mutual'
      ? 'Оба партнёра делят инициативу относительно поровну.'
      : initiationPattern === 'person1'
        ? `Первый — основной инициатор (агентность: +${pct(p1Init)}%). Второй чаще отвечает на инициативу.`
        : `Второй — основной инициатор (агентность: +${pct(p2Init)}%). Первый чаще отвечает на инициативу.`,
    familyRecapitulation: recapEn,
    familyRecapitulationRu: recapRu,
    unconsciousContract: contract.en,
    unconsciousContractRu: contract.ru,
  };
}

function buildRecapitulation(
  p1Clusters: string[],
  p2Clusters: string[],
  s1: PersonArchetypeSummary,
  s2: PersonArchetypeSummary
): string {
  // Check if one person's archetypes match patterns the other person experienced developmentally
  const p1HasControl = p1Clusters.includes('control_shadows');
  const p2HasAnxious = p2Clusters.includes('anxious_connection_shadows');
  const p1HasAvoidant = p1Clusters.includes('avoidant_intellectual_shadows');
  const p2HasStorm = p2Clusters.includes('emotional_storm_shadows');

  if (p1HasControl && p2HasAnxious) {
    return 'Person 2\'s anxious patterns may recapitulate early dynamics with a controlling caregiver, while Person 1 re-enacts a familiar role of authority. This mutual activation reinforces both patterns.';
  }
  if (p1HasAvoidant && p2HasStorm) {
    return 'Person 2\'s emotional intensity may trigger Person 1\'s avoidant withdrawal — a recapitulation of early dynamics where emotional expression was met with distance.';
  }
  if (p1HasControl && p2HasStorm) {
    return 'The control-storm dynamic suggests a recapitulation of a family system where one parent controlled through rigidity while the other expressed distress through volatility.';
  }
  return 'The relational patterns do not show a strong recapitulation of specific family-of-origin dynamics, though individual archetypal patterns may still resonate with early experiences.';
}

function buildContract(
  p1: PoleScores,
  p2: PoleScores,
  loadCarrier: string,
  initiator: string
): { en: string; ru: string } {
  const p1Anx = positivePoleStrength(p1.attAnxious);
  const p2Anx = positivePoleStrength(p2.attAnxious);
  const p1Avo = negativePoleStrength(p1.attAvoidant);
  const p2Avo = negativePoleStrength(p2.attAvoidant);

  if ((p1Anx > 0.3 && p2Avo > 0.3) || (p2Anx > 0.3 && p1Avo > 0.3)) {
    return {
      en: 'The unconscious contract: "I will pursue and you will withdraw, confirming both our fears — yours that intimacy is dangerous, mine that I am unlovable." This is the most common and most painful relational contract.',
      ru: 'Бессознательный контракт: «Я буду преследовать, а ты отстраняться, подтверждая оба наших страха — твой, что близость опасна, и мой, что я нелюбим(а)». Это самый частый и самый болезненный реляционный контракт.',
    };
  }
  if (p1Anx > 0.3 && p2Anx > 0.3) {
    return {
      en: 'The unconscious contract: "We will merge completely and never be alone." Mutual fusion promises safety but risks enmeshment and loss of individual identity.',
      ru: 'Бессознательный контракт: «Мы полностью сольёмся и никогда не будем одни». Взаимный синтез обещает безопасность, но рискует слиянием и потерей индивидуальной идентичности.',
    };
  }
  if (p1Avo > 0.3 && p2Avo > 0.3) {
    return {
      en: 'The unconscious contract: "We will respect each other\'s independence by never truly needing each other." Mutual autonomy promises freedom but risks emotional starvation.',
      ru: 'Бессознательный контракт: «Мы будем уважать независимость друг друга, никогда по-настоящему не нуждаясь друг в друге». Взаимная автономия обещает свободу, но рискует эмоциональным голодом.',
    };
  }
  if (loadCarrier === 'person1' || loadCarrier === 'person2') {
    const carrier = loadCarrier === 'person1' ? 'Person 1' : 'Person 2';
    return {
      en: `The unconscious contract: "${carrier} will carry the emotional weight so the other doesn't have to." This asymmetric arrangement protects one partner from vulnerability while burdening the other.`,
      ru: `Бессознательный контракт: «${carrier === 'Person 1' ? 'Первый' : 'Второй'} будет нести эмоциональный вес, чтобы другому не пришлось». Это асимметричное соглашение защищает одного партнёра от уязвимости, обременяя другого.`,
    };
  }
  return {
    en: 'The unconscious contract appears relatively balanced. Both partners contribute to the relational dynamic without extreme asymmetry.',
    ru: 'Бессознательный контракт выглядит относительно сбалансированным. Оба партнёра вносят вклад в реляционную динамику без крайней асимметрии.',
  };
}

// --- 2.7 Growth Sequence ---

export interface GrowthStep {
  phase: 'immediate' | 'short_term' | 'long_term';
  phaseLabel: string;
  phaseLabelRu: string;
  action: string;
  actionRu: string;
  precondition?: string;
  preconditionRu?: string;
}

export function computeGrowthSequence(
  resonance: DimensionalResonance[],
  dance: AttachmentDance,
  projections: ShadowProjection[],
  safetyIndex: number,
  growthPotential: number,
  lang: 'en' | 'ru' = 'en'
): GrowthStep[] {
  const steps: GrowthStep[] = [];

  // Find most polarized dimension for immediate edge
  const mostPolarized = resonance.reduce((worst, r) =>
    r.pattern === 'polarized' || r.pattern === 'dissonant' ? (worst ? (Math.abs(worst.delta) > Math.abs(r.delta) ? worst : r) : r) : worst
  , null as DimensionalResonance | null);

  if (mostPolarized) {
    steps.push({
      phase: 'immediate',
      phaseLabel: 'Immediate Edge',
      phaseLabelRu: 'Немедленное действие',
      action: `The ${mostPolarized.dimension} dimension is most polarized (delta: ${mostPolarized.delta.toFixed(2)}). Begin by acknowledging this tension without trying to fix it. Simply notice: "This is where we are different."`,
      actionRu: `Измерение ${mostPolarized.dimension} наиболее поляризовано (дельта: ${mostPolarized.delta.toFixed(2)}). Начните с признания этого напряжения без попытки его исправить. Просто заметьте: «Здесь мы различаемся».`,
    });
  }

  // Short-term from dance deactivation
  steps.push({
    phase: 'short_term',
    phaseLabel: 'Short-Term Practice',
    phaseLabelRu: 'Краткосрочная практика',
    action: dance.deactivationEn,
    actionRu: dance.deactivationRu,
  });

  // Short-term from projection healing
  if (projections.length > 0) {
    const topProjection = projections[0];
    steps.push({
      phase: 'short_term',
      phaseLabel: 'Shadow Integration',
      phaseLabelRu: 'Интеграция тени',
      action: `Notice when you project ${topProjection.healingEn} — the healing path begins with owning this quality in yourself before attributing it to your partner.`,
      actionRu: `Замечайте, когда вы проецируете: ${topProjection.healingRu} — путь исцеления начинается с принятия этого качества в себе, прежде чем приписывать его партнёру.`,
    });
  }

  // Long-term development
  steps.push({
    phase: 'long_term',
    phaseLabel: 'Long-Term Development',
    phaseLabelRu: 'Долгосрочное развитие',
    action: `The relational field has ${Math.round(growthPotential * 100)}% growth potential and ${Math.round(safetyIndex * 100)}% safety. ${safetyIndex > 0.5 ? 'The safety foundation supports deep exploratory work.' : 'Building safety first is essential before attempting deeper relational work.'}`,
    actionRu: `Реляционное поле имеет ${Math.round(growthPotential * 100)}% потенциал роста и ${Math.round(safetyIndex * 100)}% безопасности. ${safetyIndex > 0.5 ? 'Фундамент безопасности поддерживает глубокую исследовательскую работу.' : 'Построение безопасности прежде всего необходимо, прежде чем пытаться углубить реляционную работу.'}`,
    precondition: safetyIndex < 0.5 ? 'Safety precondition: Before deeper work, establish reliable repair rituals after conflict.' : undefined,
    preconditionRu: safetyIndex < 0.5 ? 'Предусловие безопасности: Прежде углублённой работы установите надёжные ритуалы восстановления после конфликтов.' : undefined,
  });

  return steps;
}

// --- Boundary Interaction ---

function computeBoundaryInteraction(
  b1: BoundaryAssessment,
  b2: BoundaryAssessment
): BoundaryInteraction {
  const combos: Record<string, { pattern: string; patternRu: string; risk: string; riskRu: string }> = {
    'rigid-rigid': {
      pattern: 'Double Fortress',
      patternRu: 'Двойная крепость',
      risk: 'Both partners maintain strong walls. The relationship may feel safe but emotionally starved — two fortresses side by side.',
      riskRu: 'Оба партнёра поддерживают сильные стены. Отношения могут ощущаться безопасными, но эмоционально голодными — две крепости рядом.',
    },
    'porous-porous': {
      pattern: 'Mutual Merging',
      patternRu: 'Взаимное слияние',
      risk: 'Both partners have permeable boundaries. Risk of enmeshment — losing individual identity in the pursuit of total connection.',
      riskRu: 'У обоих партнёров проницаемые границы. Риск слияния — потеря индивидуальной идентичности в стремлении к полной связи.',
    },
    'rigid-porous': {
      pattern: 'Wall-Sponge Dynamic',
      patternRu: 'Динамика «стена-губка»',
      risk: 'The rigid partner\'s walls trigger the porous partner\'s merging, and vice versa. Classic pattern where one partner pursues while the other retreats.',
      riskRu: 'Стены жёсткого партнёра провоцируют слияние проницаемого, и наоборот. Классический паттерн, где один преследует, а другой отстраняется.',
    },
    'rigid-flexible': {
      pattern: 'Stability-Adaptation',
      patternRu: 'Стабильность-адаптация',
      risk: 'The flexible partner adapts to the rigid partner\'s boundaries, which can work if the rigid partner occasionally opens. Risk of the flexible partner over-accommodating.',
      riskRu: 'Гибкий партнёр адаптируется к границам жёсткого, что может работать, если жёсткий иногда открывается. Риск чрезмерного уступания со стороны гибкого.',
    },
    'porous-flexible': {
      pattern: 'Absorption Risk',
      patternRu: 'Риск поглощения',
      risk: 'The porous partner may overwhelm the flexible partner\'s moderate boundaries. The flexible partner needs to hold firm occasionally.',
      riskRu: 'Проницаемый партнёр может перегрузить умеренные границы гибкого. Гибкому партнёру нужно иногда твёрдо держать позицию.',
    },
  };

  const key1 = b1.style === 'oscillating' ? 'rigid' : b1.style;
  const key2 = b2.style === 'oscillating' ? 'porous' : b2.style;
  const lookup = combos[`${key1}-${key2}`] || combos[`${key2}-${key1}`] || {
    pattern: 'Adaptive Dance',
    patternRu: 'Адаптивный танец',
    risk: 'Both partners have adaptable boundaries. The relationship has good capacity for negotiating closeness and distance.',
    riskRu: 'У обоих партнёров адаптивные границы. Отношения обладают хорошей способностью согласовывать близость и дистанцию.',
  };

  return lookup;
}

// --- Shared / Complementary Complexes ---

function computeSharedComplexes(
  a1: ScoredArchetype[],
  a2: ScoredArchetype[],
  p1: PoleScores,
  p2: PoleScores,
  lang: 'en' | 'ru'
): string[] {
  const c1 = detectComplexes(a1, p1, lang);
  const c2 = detectComplexes(a2, p2, lang);
  const names1 = new Set(c1.map(c => c.name));
  return c2.filter(c => names1.has(c.name)).map(c => lang === 'ru' ? c.nameRu : c.name);
}

function computeComplementaryComplexes(
  a1: ScoredArchetype[],
  a2: ScoredArchetype[],
  p1: PoleScores,
  p2: PoleScores,
  lang: 'en' | 'ru'
): string[] {
  const c1 = detectComplexes(a1, p1, lang);
  const c2 = detectComplexes(a2, p2, lang);
  const names1 = new Set(c1.map(c => c.name));
  // Complementary = different complexes that form a systemic pair
  const PAIRS: Record<string, string> = {
    'Abandonment Complex': 'Fortress Complex',
    'Fortress Complex': 'Abandonment Complex',
    'Disorganized Intensity Complex': 'Seductive Walls Complex',
    'Seductive Walls Complex': 'Disorganized Intensity Complex',
  };
  const result: string[] = [];
  for (const cx of c1) {
    const pair = PAIRS[cx.name];
    if (pair && c2.some(c => c.name === pair)) {
      const label1 = lang === 'ru' ? cx.nameRu : cx.name;
      const pairCx = c2.find(c => c.name === pair)!;
      const label2 = lang === 'ru' ? pairCx.nameRu : pairCx.name;
      result.push(`${label1} ↔ ${label2}`);
    }
  }
  return result;
}

// --- Cross-Person Trigger Interactions ---

function computeCrossPersonTriggers(
  a1: ScoredArchetype[],
  a2: ScoredArchetype[],
  p1: PoleScores,
  p2: PoleScores,
  lang: 'en' | 'ru'
): CrossPersonTrigger[] {
  const t1 = computeTriggerMap(a1, p1, lang);
  const t2 = computeTriggerMap(a2, p2, lang);
  const results: CrossPersonTrigger[] = [];

  // Find where Person 2's reaction pattern matches Person 1's trigger situation
  for (const trig1 of t1.slice(0, 4)) {
    for (const trig2 of t2.slice(0, 4)) {
      // Match if same part type and both are reactive
      if (trig1.partType === trig2.partType && trig1.partType !== 'self') {
        results.push({
          person1Trigger: trig1.partName,
          person2Trigger: trig2.partName,
          interactionDesc: `${trig1.partName}'s reaction ("${trig1.reactionPattern}") can activate ${trig2.partName}'s wound ("${trig2.underlyingWound}"). This creates a mutual activation loop.`,
          interactionDescRu: `Реакция ${trig1.partName} («${trig1.reactionPatternRu}») может активировать рану ${trig2.partName} («${trig2.underlyingWound}»). Это создаёт петлю взаимной активации.`,
        });
        break; // one match per person1 trigger
      }
    }
  }

  // Attachment-specific cross trigger
  const p1Anx = positivePoleStrength(p1.attAnxious);
  const p2Anx = positivePoleStrength(p2.attAnxious);
  const p1Avo = negativePoleStrength(p1.attAvoidant);
  const p2Avo = negativePoleStrength(p2.attAvoidant);

  if ((p1Anx > 0.3 && p2Avo > 0.3) || (p2Anx > 0.3 && p1Avo > 0.3)) {
    results.push({
      person1Trigger: p1Anx > p2Anx
        ? (lang === 'ru' ? 'Тревожная привязанность' : 'Anxious attachment')
        : (lang === 'ru' ? 'Избегающая привязанность' : 'Avoidant attachment'),
      person2Trigger: p1Anx > p2Anx
        ? (lang === 'ru' ? 'Избегающая привязанность' : 'Avoidant attachment')
        : (lang === 'ru' ? 'Тревожная привязанность' : 'Anxious attachment'),
      interactionDesc: 'The anxious partner\'s pursuit triggers the avoidant partner\'s withdrawal, which in turn amplifies the anxious partner\'s fear of abandonment. Classic pursue-withdraw trigger cycle.',
      interactionDescRu: 'Преследование тревожного партнёра провоцирует отстранение избегающего, что в свою очередь усиливает страх покинутости тревожного. Классический цикл «преследование-отстранение».',
    });
  }

  return results.slice(0, 4);
}

// --- Joint Integration Pathway ---

function computeJointPathway(
  a1: ScoredArchetype[],
  a2: ScoredArchetype[],
  _p1: PoleScores,
  _p2: PoleScores,
  _lang: 'en' | 'ru'
): JointPathwayStep[] {
  const steps: JointPathwayStep[] = [];

  // Stage 1: Safety first
  steps.push({
    stage: 1,
    label: 'Establish Safety',
    labelRu: 'Создать безопасность',
    action: 'Before any deep relational work, both partners must feel safe enough to be vulnerable. Create explicit agreements: "We can pause at any time. No topic is off-limits, but timing matters." Practice repair after every conflict.',
    actionRu: 'Прежде глубокой реляционной работы оба партнёра должны чувствовать себя достаточно безопасно для уязвимости. Создайте явные договорённости: «Мы можем остановиться в любой момент. Ни одна тема не запрещена, но важно время». Практикуйте восстановление после каждого конфликта.',
  });

  // Stage 2: Witness each other's parts
  const p1Managers = a1.filter(a => a.partType === 'manager').map(a => a.name);
  const p2Managers = a2.filter(a => a.partType === 'manager').map(a => a.name);
  steps.push({
    stage: 2,
    label: 'Witness Each Other\'s Protectors',
    labelRu: 'Увидеть защиты друг друга',
    action: `Each partner shares their protective parts. Person 1: "${p1Managers.length > 0 ? p1Managers[0] : 'my protector'}". Person 2: "${p2Managers.length > 0 ? p2Managers[0] : 'my protector'}". Each explains what it protects against. The other listens without fixing, only witnessing.`,
    actionRu: `Каждый партнёр рассказывает о своих защитных частях. Первый: «${p1Managers.length > 0 ? p1Managers[0] : 'мой защитник'}». Второй: «${p2Managers.length > 0 ? p2Managers[0] : 'мой защитник'}». Каждый объясняет, от чего она защищает. Другой слушает без исправления, только свидетельствуя.`,
  });

  // Stage 3: Name the pattern
  steps.push({
    stage: 3,
    label: 'Name the Pattern',
    labelRu: 'Назвать паттерн',
    action: 'Together, identify the relational pattern that repeats. "When I feel X, I do Y, which makes you feel Z, which makes you do W..." Map the cycle together without blame.',
    actionRu: 'Вместе определите повторяющийся реляционный паттерн. «Когда я чувствую X, я делаю Y, из-за чего ты чувствуешь Z, и делаешь W...» Наметить цикл вместе, без обвинений.',
  });

  // Stage 4: Practice the alternative
  steps.push({
    stage: 4,
    label: 'Practice the Alternative',
    labelRu: 'Практиковать альтернативу',
    action: 'When the old pattern activates, pause. Name it: "I notice we\'re in the pattern." Then choose a different response. This is not about perfection — it\'s about catching the pattern one cycle earlier each time.',
    actionRu: 'Когда старый паттерн активируется, остановитесь. Назовите его: «Я замечаю, что мы в паттерне». Затем выберите другой ответ. Дело не в совершенстве — а в том, чтобы каждый раз ловить паттерн на один цикл раньше.',
  });

  return steps;
}
