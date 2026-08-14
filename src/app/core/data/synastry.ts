/**
 * Synastry Computation Engine
 *
 * Deterministic partner compatibility analysis based on
 * overlaying two 4D archetype profiles.
 */

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

const DIM_LABELS: Record<string, { en: string; ru: string; poleNeg: { en: string; ru: string }; polePos: { en: string; ru: string } }> = {
  AGENCY: { en: 'agency', ru: 'агентность', poleNeg: { en: 'assertive', ru: 'активный' }, polePos: { en: 'receptive', ru: 'восприимчивый' } },
  TEMPERATURE: { en: 'emotional temperature', ru: 'эмоциональный накал', poleNeg: { en: 'cool', ru: 'хладнокровный' }, polePos: { en: 'passionate', ru: 'страстный' } },
  FOCUS: { en: 'relational focus', ru: 'реляционный фокус', poleNeg: { en: 'self-oriented', ru: 'замкнутый на себе' }, polePos: { en: 'other-oriented', ru: 'устремлённый к другому' } },
  ATTACHMENT: { en: 'attachment style', ru: 'стиль привязанности', poleNeg: { en: 'avoidant', ru: 'избегающий' }, polePos: { en: 'anxious', ru: 'тревожный' } },
};

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
      const qual = absDelta < 0.15 ? { en: 'nearly identical', ru: 'почти идентичны' } : { en: 'closely matched', ru: 'очень близки' };
      return {
        en: `Your ${labels.en} is ${qual.en} (${pct}% apart). Both of you are ${who1.en} in how you engage — a shared rhythm that creates instant understanding.`,
        ru: `Ваша ${labels.ru} ${qual.ru} (разница ${pct}%). Вы оба ${who1.ru} — этот общий ритм создаёт мгновенное взаимопонимание.`,
      };
    }
    case 'complementary': {
      return {
        en: `Your ${labels.en} differs by ${pct}% — Person 1 leans ${who1.en}, Person 2 leans ${who2.en}. This creates a natural dynamic where each brings what the other lacks.`,
        ru: `Ваша ${labels.ru} различается на ${pct}% — Первый скорее ${who1.ru}, Второй — ${who2.ru}. Это создаёт естественную динамику, где каждый привносит то, чего не хватает другому.`,
      };
    }
    case 'polarized': {
      return {
        en: `Strong polarity on ${labels.en} (${pct}% gap) — Person 1 is ${who1.en} while Person 2 is ${who2.en}. This tension is powerful but requires conscious navigation to avoid power struggles.`,
        ru: `Резкая полярность в ${labels.ru} (разрыв ${pct}%) — Первый ${who1.ru}, Второй ${who2.ru}. Это напряжённая динамика, которая требует осознанной навигации, чтобы не скатиться в борьбу.`,
      };
    }
    case 'dissonant': {
      return {
        en: `Extreme dissonance on ${labels.en} (${pct}% gap) — you inhabit fundamentally different positions. Person 1 is ${who1.en}, Person 2 is ${who2.en}. This is the hardest dimension to bridge, but also the one with the greatest transformational potential.`,
        ru: `Острый диссонанс в ${labels.ru} (разрыв ${pct}%) — вы находитесь в принципиально разных позициях. Первый ${who1.ru}, Второй ${who2.ru}. Это самое сложное измерение для моста — и самое трансформирующее.`,
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

const PURSUE_WITHDRAW_1: AttachmentDance = {
  pattern: 'pursue-withdraw',
  descriptionEn: 'The classic pursue-withdraw cycle: Person 1 seeks closeness while Person 2 creates distance. This is the most common dysfunctional pattern — and also the one with the greatest growth potential.',
  descriptionRu: 'Классический цикл «преследование–отстранение»: Первый тянется к близости, а Второй отдаляется. Это самая частая дисфункциональная модель — и одновременно та, в которой скрыт наибольший потенциал для роста.',
  cycleEn: 'Person 1 reaches out → Person 2 feels engulfed and withdraws → Person 1 feels abandoned and pursues harder → Person 2 feels more overwhelmed and withdraws further → repeat',
  cycleRu: 'Первый тянется → Второй чувствует, что его поглощают, и отстраняется → Первый чувствует себя покинутым и начинает преследовать сильнее → Второму становится ещё тяжелее, и он отдаляется ещё больше → цикл повторяется',
  deactivationEn: 'The key: Person 1 practices self-soothing instead of pursuing. Person 2 practices reaching out before retreating. Both learn that space and closeness can coexist.',
  deactivationRu: 'Ключ: Первому важно научиться самоуспокоению вместо преследования. Второму — делать шаг навстречу прежде, чем отступать. Обоим предстоит понять, что близость и пространство не исключают друг друга.',
};

const PURSUE_WITHDRAW_2: AttachmentDance = {
  pattern: 'pursue-withdraw',
  descriptionEn: 'The classic pursue-withdraw cycle reversed: Person 2 seeks closeness while Person 1 creates distance. Growth comes from recognizing this dance.',
  descriptionRu: 'Тот же цикл «преследование–отстранение», но в обратную сторону: Второй ищет близости, а Первый дистанцируется. Осознание этого паттерна — первый шаг к изменениям.',
  cycleEn: 'Person 2 reaches out → Person 1 feels engulfed and withdraws → Person 2 feels abandoned and pursues harder → Person 1 withdraws further → repeat',
  cycleRu: 'Второй тянется → Первый чувствует, что его поглощают, и отстраняется → Второй чувствует себя покинутым и преследует сильнее → Первый отдаляется ещё больше → цикл повторяется',
  deactivationEn: 'The key: Person 2 practices self-soothing. Person 1 practices reaching out before retreating. Both learn that space and closeness can coexist.',
  deactivationRu: 'Ключ: Второму важно научиться самоуспокоению. Первому — делать шаг навстречу прежде, чем отступать. Обоим предстоит понять, что близость и пространство не исключают друг друга.',
};

const MUTUAL_ESCALATION: AttachmentDance = {
  pattern: 'mutual-escalation',
  descriptionEn: 'Both partners have anxious attachment — creating a feedback loop of emotional intensity. Every feeling is amplified, every slight is a catastrophe.',
  descriptionRu: 'У обоих партнёров тревожный тип привязанности — возникает петля усиливающихся эмоций. Каждое чувство становится ярче, любой пустяк воспринимается как катастрофа.',
  cycleEn: 'Both feel insecure → both pursue reassurance → emotions escalate → overwhelm → cling tighter → exhaustion → brief withdrawal → panic → pursue again',
  cycleRu: 'Оба чувствуют неуверенность → оба ищут подтверждения любви → эмоции разгораются → перегруз → цепляются друг за друга → истощение → короткая пауза → паника → снова преследование',
  deactivationEn: 'Each partner must develop self-soothing capacity. The relationship needs external support (therapy, community) to break the escalation spiral.',
  deactivationRu: 'Каждому важно развить способность к саморегуляции. Отношениям необходима внешняя поддержка — терапия или сообщество, — чтобы разорвать спираль эскалации.',
};

const DEEP_FREEZE: AttachmentDance = {
  pattern: 'deep-freeze',
  descriptionEn: 'Both partners are avoidant — creating a relationship characterized by parallel lives, emotional distance, and unspoken loneliness.',
  descriptionRu: 'Оба партнёра с избегающим типом привязанности — отношения превращаются в параллельные жизни с эмоциональной дистанцией и тихим, невысказанным одиночеством.',
  cycleEn: 'Both withdraw → relationship becomes functional but lifeless → loneliness builds → one person reaches out awkwardly → vulnerability feels dangerous → withdraw again',
  cycleRu: 'Оба отдаляются → отношения становятся функциональными, но безжизненными → одиночество нарастает → один неуклюже тянется к другому → уязвимость кажется опасной → снова отстранение',
  deactivationEn: 'Someone has to go first — risk vulnerability in small, safe doses. Couples therapy is strongly recommended to create a structured container for emotional expression.',
  deactivationRu: 'Кому-то нужно сделать первый шаг — рискнуть открытостью маленькими, безопасными порциями. Семейная терапия настоятельно рекомендуется как безопасное пространство для выражения чувств.',
};

const VOLATILE_BOND: AttachmentDance = {
  pattern: 'volatile-bond',
  descriptionEn: 'At least one partner has disorganized attachment — creating unpredictable swings between intense closeness and sudden withdrawal. The relationship feels like an emotional rollercoaster.',
  descriptionRu: 'Как минимум у одного из партнёров дезорганизованный тип привязанности — отношения раскачиваются между обжигающей близостью и внезапным отстранением. Эмоциональные американские горки.',
  cycleEn: 'Intense connection → one partner gets triggered → sudden withdrawal or eruption → the other partner is confused and hurt → guilt and repair attempt → brief closeness → trigger again',
  cycleRu: 'Мощная связь → один из партнёров получает триггер → внезапное отстранение или взрыв → другой в растерянности и боли → чувство вины и попытка всё исправить → короткая близость → снова триггер',
  deactivationEn: 'Both partners need individual therapeutic support. The disorganized partner needs to develop earned security. Patience and professional guidance are essential.',
  deactivationRu: 'Обоим партнёрам нужна индивидуальная терапия. Партнёру с дезорганизованной привязанностью важно выработать «обретённую безопасность». Терпение и поддержка специалиста здесь необходимы.',
};

const HEALING_CONTAINER: AttachmentDance = {
  pattern: 'healing-container',
  descriptionEn: 'One or both partners have done significant relational work, creating a container where both can heal. This is the foundation for conscious relationship.',
  descriptionRu: 'Один или оба партнёра проделали серьёзную внутреннюю работу — они создали безопасное пространство, в котором оба могут исцеляться. Это фундамент осознанных отношений.',
  cycleEn: 'Secure base → triggers arise → they are met with compassion → both regulate → deeper understanding → repair strengthens trust → repeat with greater ease',
  cycleRu: 'Безопасная база → возникают триггеры → встречаются с состраданием → оба справляются с реакцией → более глубокое понимание → восстановление укрепляет доверие → в следующий раз — легче',
  deactivationEn: 'Continue deepening the practice. The work is never done — but it gets easier and more rewarding over time.',
  deactivationRu: 'Продолжайте углублять практику. Эта работа не заканчивается — но со временем она даётся легче и приносит больше.',
};

const PARALLEL_SOVEREIGNTY: AttachmentDance = {
  pattern: 'parallel-sovereignty',
  descriptionEn: 'Two secure individuals choosing each other from wholeness, not need. The rarest and most sustainable relational pattern.',
  descriptionRu: 'Два человека с надёжным типом привязанности выбирают друг друга из целостности, а не нехватки. Самый редкий и устойчивый формат отношений.',
  cycleEn: 'Both feel complete → they choose to connect → vulnerability is safe → differences are explored with curiosity → repair is quick and natural → mutual growth',
  cycleRu: 'Оба чувствуют себя цельными → выбирают быть вместе → уязвимость безопасна → различия исследуются с любопытством → восстановление происходит быстро и естественно → взаимный рост',
  deactivationEn: 'The invitation is to go even deeper — from security to alchemy, from individual wholeness to co-creation.',
  deactivationRu: 'Приглашение — идти ещё глубже: от безопасности — к алхимии, от индивидуальной целостности — к сотворчеству.',
};

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

const PROJECTION_MATRIX: Record<string, Record<string, { mechanismEn: string; mechanismRu: string; healingEn: string; healingRu: string }>> = {
  control_shadows: {
    emotional_storm_shadows: {
      mechanismEn: 'You project your disowned chaos onto their emotional intensity',
      mechanismRu: 'Вы проецируете на них собственную подавленную хаотичность — их эмоциональность кажется вам угрозой',
      healingEn: 'Reclaiming your own passion will stop seeing their emotion as a threat',
      healingRu: 'Вернув себе право на страсть, вы перестанете воспринимать чужие эмоции как опасность',
    },
    anxious_connection_shadows: {
      mechanismEn: 'You project your disowned vulnerability onto their need for connection',
      mechanismRu: 'Вы проецируете на них собственную запретную уязвимость — их потребность в близости вас раздражает',
      healingEn: 'Acknowledging your own need for love will help you see their reaching as courage, not weakness',
      healingRu: 'Признав свою собственную потребность в любви, вы увидите в их тяге к вам смелость, а не слабость',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their unpredictability threatens your need for order and control',
      mechanismRu: 'Их непредсказуемость угрожает вашей потребности всё контролировать',
      healingEn: 'Learning that chaos can be generative, not just destructive',
      healingRu: 'Открытие для себя, что хаос может быть творческой силой, а не только разрушительной',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their detachment mirrors your own emotional walls — you project rigidity onto their need for space',
      mechanismRu: 'Их отстранённость отражает ваши собственные эмоциональные стены — вы проецируете жёсткость на их потребность в пространстве',
      healingEn: 'Recognizing that not everyone who distances is controlling — some are simply protecting themselves differently',
      healingRu: 'Важно понять: не каждый, кто дистанцируется, контролирует — кто-то просто защищается иначе',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm threatens your need for predictability — you project manipulation onto their playfulness',
      mechanismRu: 'Их обаяние угрожает вашей потребности в предсказуемости — вы проецируете манипуляцию на их игривость',
      healingEn: 'Allowing some uncertainty into your controlled world can be liberating, not dangerous',
      healingRu: 'Допустить немного неопределённости в свой контролируемый мир может быть освобождающим, а не опасным',
    },
    gift_archetypes: {
      mechanismEn: 'Their emotional freedom threatens your identity built on vigilance — you may try to "fix" what isn\'t broken',
      mechanismRu: 'Их эмоциональная свобода угрожает вашей идентичности, построенной на бдительности — вы можете пытаться «починить» то, что не сломано',
      healingEn: 'Letting go of the protector role allows you to discover who you are without the armor',
      healingRu: 'Отпустить роль защитника позволяет вам обнаружить, кто вы без брони',
    },
    control_shadows: {
      mechanismEn: 'You see your own control reflected back — a battle for dominance where neither yields',
      mechanismRu: 'Вы видите собственный контроль отражённым — битва за доминирование, где никто не уступает',
      healingEn: 'Shared control is not weakness — it is the foundation of genuine partnership',
      healingRu: 'Разделённый контроль — не слабость, а фундамент подлинного партнёрства',
    },
  },
  emotional_storm_shadows: {
    control_shadows: {
      mechanismEn: 'You project your disowned discipline onto their rigid control',
      mechanismRu: 'Вы проецируете на них собственную отвергнутую дисциплину — их контроль кажется вам удушающим',
      healingEn: 'Developing your own internal structure will reduce the need to fight theirs',
      healingRu: 'Выстроив собственную внутреннюю структуру, вы перестанете нуждаться в борьбе с чужой',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their coldness triggers your deepest fear of being unseen',
      mechanismRu: 'Их холодность задевает ваш самый глубокий страх — страх остаться незамеченным',
      healingEn: 'Learning to self-validate reduces the dependence on their emotional response',
      healingRu: 'Научившись опираться на себя, вы перестанете зависеть от их эмоциональных реакций',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their neediness amplifies your own intensity — together you create emotional firestorms',
      mechanismRu: 'Их нужда усиливает вашу собственную интенсивность — вместе вы создаёте эмоциональные бури',
      healingEn: 'Both partners need to develop self-soothing rather than co-regulating through escalation',
      healingRu: 'Обоим важно развивать саморегуляцию, а не корегулироваться через эскалацию',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their elusiveness triggers your deepest abandonment wound — the harder they run, the harder you pursue',
      mechanismRu: 'Их неуловимость пробуждает вашу самую глубокую рану покинутости — чем дальше они бегут, тем сильнее вы преследуете',
      healingEn: 'The chase will never bring the safety you seek — only self-regulation can',
      healingRu: 'Погоня никогда не принесёт безопасности, которую вы ищете — только саморегуляция может',
    },
    gift_archetypes: {
      mechanismEn: 'Their calm feels like indifference — you project rejection onto their hard-won peace',
      mechanismRu: 'Их спокойствие ощущается как равнодушие — вы проецируете отвержение на их завоёванный покой',
      healingEn: 'Trusting that calm does not mean absence of feeling',
      healingRu: 'Доверять: спокойствие не означает отсутствие чувств',
    },
    emotional_storm_shadows: {
      mechanismEn: 'You amplify each other\'s emotions — every feeling becomes a shared hurricane',
      mechanismRu: 'Вы усиливаете эмоции друг друга — каждое чувство превращается в общий ураган',
      healingEn: 'Building individual emotional capacity so you can hold space for each other without drowning together',
      healingRu: 'Развитие индивидуальной эмоциональной ёмкости, чтобы держать пространство друг для друга, не тоня вместе',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their unpredictability feeds your intensity while your intensity triggers their flight response',
      mechanismRu: 'Их непредсказуемость питает вашу интенсивность, а ваша интенсивность запускает их реакцию бегства',
      healingEn: 'Creating predictable emotional rituals can ground both partners',
      healingRu: 'Создание предсказуемых эмоциональных ритуалов может заземлить обоих партнёров',
    },
  },
  avoidant_intellectual_shadows: {
    emotional_storm_shadows: {
      mechanismEn: 'Their intensity mirrors everything you have exiled from your emotional world',
      mechanismRu: 'Их яркость отражает всё, что вы когда-то изгнали из своей эмоциональной жизни',
      healingEn: 'Feeling your own feelings will stop making theirs feel so threatening',
      healingRu: 'Когда вы начнёте проживать собственные чувства, чужие перестанут казаться угрозой',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their neediness triggers your fear of engulfment — you see boundaries as necessary armor',
      mechanismRu: 'Их нужда в вас пробуждает ваш страх быть поглощённым — границы кажутся единственной бронёй',
      healingEn: 'Allowing yourself to need someone, even slightly, will dissolve the wall',
      healingRu: 'Позволив себе хоть немного нуждаться в другом, вы растворите стену',
    },
    control_shadows: {
      mechanismEn: 'Their rigidity makes your detachment feel justified — together you create an emotional desert',
      mechanismRu: 'Их жёсткость делает ваше отстранение оправданным — вместе вы создаёте эмоциональную пустыню',
      healingEn: 'Someone has to feel first — let it be you',
      healingRu: 'Кому-то нужно почувствовать первым — пусть это будете вы',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm masks the same avoidance you intellectualize — you compete in distance',
      mechanismRu: 'Их обаяние маскирует то же избегание, которое вы рационализируете — вы соревнуетесь в дистанции',
      healingEn: 'Drop the analysis and the mask — both prevent genuine connection',
      healingRu: 'Отбросьте анализ и маску — оба мешают подлинной связи',
    },
    gift_archetypes: {
      mechanismEn: 'Their emotional presence highlights what you have walled off — you may intellectualize their warmth as naivety',
      mechanismRu: 'Их эмоциональное присутствие подчёркивает то, что вы отгородили — вы можете интеллектуализировать их теплоту как наивность',
      healingEn: 'Feeling is not weakness — it is the missing half of your intelligence',
      healingRu: 'Чувствовать — не слабость, а недостающая половина вашего интеллекта',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Your mutual avoidance creates a relationship that exists only in the mind — bodies in the same room, hearts in different galaxies',
      mechanismRu: 'Ваше взаимное избегание создаёт отношения, существующие только в мыслях — тела в одной комнате, сердца в разных галактиках',
      healingEn: 'Risk saying one thing you actually feel — not think, feel',
      healingRu: 'Рискните сказать одну вещь, которую вы действительно чувствуете — не думаете, а чувствуете',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their push-pull dynamic overwhelms your carefully maintained distance — their chaos threatens your fortress of solitude',
      mechanismRu: 'Их динамика «тянусь-отстраняюсь» перегружает вашу тщательно выстроенную дистанцию — их хаос угрожает вашей крепости одиночества',
      healingEn: 'Staying present through their intensity without retreating builds tolerance for emotional complexity',
      healingRu: 'Присутствовать в их интенсивности, не отступая, — это строит толерантность к эмоциональной сложности',
    },
  },
  anxious_connection_shadows: {
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their withdrawal confirms your core belief that you are unlovable',
      mechanismRu: 'Их отстранение подтверждает ваше глубинное убеждение: «Меня невозможно любить»',
      healingEn: 'Building self-worth independent of their response breaks the projection',
      healingRu: 'Опора на собственную ценность — независимо от их реакций — разрушит эту проекцию',
    },
    control_shadows: {
      mechanismEn: 'Their control feels like the caregiving you never received — both familiar and painful',
      mechanismRu: 'Их контроль ощущается и как забота, которой вам всегда не хватало, и как боль — одновременно',
      healingEn: 'Recognizing that love and control are not the same thing',
      healingRu: 'Важно различать: любовь и контроль — не одно и то же',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their emotional intensity feeds your need for validation through chaos — you mistake drama for closeness',
      mechanismRu: 'Их эмоциональная интенсивность питает вашу потребность в подтверждении через хаос — вы путаете драму с близостью',
      healingEn: 'Closeness does not require crisis — learning to feel connected in stillness',
      healingRu: 'Близость не требует кризиса — учитесь чувствовать связь в тишине',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm and withdrawal activates your deepest abandonment wound — the most addictive and painful dance',
      mechanismRu: 'Их обаяние и отстранение активирует вашу самую глубокую рану покинутости — самый зависимый и болезненный танец',
      healingEn: 'The one who charms and leaves is not your healing — they are your pattern repeating',
      healingRu: 'Тот, кто очаровывает и уходит — не ваше исцеление, а повторение вашего паттерна',
    },
    gift_archetypes: {
      mechanismEn: 'Their secure presence feels suspicious — you project unreliability onto their consistency',
      mechanismRu: 'Их безопасное присутствие кажется подозрительным — вы проецируете ненадёжность на их постоянство',
      healingEn: 'Trusting that consistency is real, not a prelude to abandonment',
      healingRu: 'Доверять: постоянство бывает настоящим, это не прелюдия к покинутости',
    },
    anxious_connection_shadows: {
      mechanismEn: 'You mirror each other\'s neediness — a feedback loop of reassurance-seeking that never fully soothes',
      mechanismRu: 'Вы отражаете нужду друг друга — петля поиска подтверждений, которая никогда полностью не успокаивает',
      healingEn: 'Developing individual self-worth breaks the cycle of mutual reassurance dependency',
      healingRu: 'Развитие индивидуальной самоценности разрывает цикл взаимной зависимости от подтверждений',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their push-pull triggers both your hope and your terror — you try to "heal" them through love',
      mechanismRu: 'Их «тянусь-отстраняюсь» пробуждает и надежду, и ужас — вы пытаетесь «исцелить» их любовью',
      healingEn: 'You cannot love someone into security — that work is theirs alone',
      healingRu: 'Нельзя полюбить кого-то в безопасность — эта работа только их',
    },
  },
  seductive_avoidance_shadows: {
    anxious_connection_shadows: {
      mechanismEn: 'Their genuine need terrifies your commitment-phobic soul',
      mechanismRu: 'Их искренняя потребность в вас пугает — вы бежите от обязательств',
      healingEn: 'Distinguishing between being trapped and being chosen',
      healingRu: 'Научитесь различать: попасть в ловушку и быть выбранным — не одно и то же',
    },
    control_shadows: {
      mechanismEn: 'Their rigidity triggers your rebellion — you perform freedom while secretly wanting structure',
      mechanismRu: 'Их жёсткость провоцирует вас на бунт — вы играете в свободу, втайне желая опоры',
      healingEn: 'Admitting you want commitment will stop the seductive dance',
      healingRu: 'Честно признавшись себе в желании обязательств, вы перестанете вести соблазняющую игру',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their intensity both attracts and overwhelms you — you charm to create distance while craving the heat',
      mechanismRu: 'Их интенсивность и привлекает, и подавляет вас — вы обаянием создаёте дистанцию, жаждая тепла',
      healingEn: 'Staying present after the charm wears off is where real intimacy begins',
      healingRu: 'Остаться после того, как обаяние спадёт — здесь начинается настоящая близость',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'You compete in avoidance through different strategies — charm versus intellect — both running from vulnerability',
      mechanismRu: 'Вы соревнуетесь в избегании через разные стратегии — обаяние против интеллекта — оба бежите от уязвимости',
      healingEn: 'Both of you need to risk being truly seen, not just admired or understood',
      healingRu: 'Обоим нужно рискнуть быть по-настоящему увиденным, а не просто восхищённым или понятым',
    },
    gift_archetypes: {
      mechanismEn: 'Their authenticity threatens your carefully curated persona — you feel exposed without your mask',
      mechanismRu: 'Их подлинность угрожает вашей тщательно выстроенной маске — вы чувствуете себя обнажённым без неё',
      healingEn: 'The mask is exhausting — let it drop and discover you are enough without the performance',
      healingRu: 'Маска изматывает — позвольте ей упасть и обнаружьте: вы достаточно и без представления',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'A mutual fascination that becomes a hall of mirrors — both performing, neither arriving',
      mechanismRu: 'Взаимный магнетизм, превращающийся в зеркальный зал — оба играют, никто не прибывает',
      healingEn: 'Someone must go first — drop the act and reveal the real',
      healingRu: 'Кто-то должен быть первым — отбросьте игру и откройте настоящее',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their push-pull is catnip for your chase instinct — together you create an infinite loop of approach and retreat',
      mechanismRu: 'Их «тяну-отпускаю» — кошачья мята для вашего инстинкта погони — вместе вы создаёте бесконечный цикл сближения и отступления',
      healingEn: 'Breaking the loop requires choosing to stay when you want to run, and running when you want to chase',
      healingRu: 'Разорвать петлю — значит выбрать остаться, когда хочется бежать, и бежать, когда хочется преследовать',
    },
  },
  disorganized_attachment_shadows: {
    gift_archetypes: {
      mechanismEn: 'Their stability feels alien and suspicious — you project mistrust onto their kindness',
      mechanismRu: 'Их стабильность кажется вам чужеродной — вы не доверяете их доброте, словно это ловушка',
      healingEn: 'Allowing yourself to trust that safety is real and not a trap',
      healingRu: 'Попробуйте поверить: безопасность бывает настоящей, и не всё, что хорошо — западня',
    },
    control_shadows: {
      mechanismEn: 'Their control both terrifies and attracts you — recreating the original inconsistent caregiving',
      mechanismRu: 'Их контроль одновременно пугает и притягивает — воссоздаёт знакомую с детства непредсказуемую заботу',
      healingEn: 'Recognizing the pattern and choosing to stay present instead of reacting',
      healingRu: 'Узнавание этого паттерна — и выбор оставаться в настоящем, а не реагировать на автомате',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their emotional volatility activates both your longing and your terror — you cannot decide whether to move toward or away',
      mechanismRu: 'Их эмоциональная изменчивость активирует и вашу жажду, и ваш ужас — вы не можете решить, идти ли к или от',
      healingEn: 'Learning to hold both impulses simultaneously without acting on either',
      healingRu: 'Научиться удерживать оба импульса одновременно, не действуя ни по одному из них',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their distance triggers your fear of abandonment while their presence triggers your fear of engulfment — a double bind',
      mechanismRu: 'Их дистанция активирует ваш страх покинутости, а присутствие — страх поглощения: двойной капкан',
      healingEn: 'Finding the narrow path between too close and too far — your window of tolerance',
      healingRu: 'Найти узкий путь между «слишком близко» и «слишком далеко» — ваше окно толерантности',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their need for closeness triggers your approach-avoidance — you want to give but fear being consumed',
      mechanismRu: 'Их потребность в близости запускает ваш конфликт «идти к — бежать от» — вы хотите дать, но боитесь быть поглощённым',
      healingEn: 'Taking space is not abandonment — learning to communicate needs before fleeing',
      healingRu: 'Взять пространство — не покинуть. Учитесь сообщать о потребностях до бегства',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their seductive withdrawal is both irresistible and terrifying — the perfect trigger for your approach-avoidance pattern',
      mechanismRu: 'Их соблазнительное отстранение и непреодолимо, и пугающе — идеальный триггер для вашего паттерна «иду к — убегаю»',
      healingEn: 'Recognizing the pattern as repetition, not destiny',
      healingRu: 'Узнать в этом паттерне повторение, а не судьбу',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Together you create a storm of mutual approach-avoidance — both craving and fleeing simultaneously',
      mechanismRu: 'Вместе вы создаёте шторм взаимного «иду к — убегаю» — оба жаждут и бегут одновременно',
      healingEn: 'Both partners need individual therapeutic support before this dynamic can heal',
      healingRu: 'Обоим партнёрам нужна индивидуальная терапевтическая поддержка, прежде чем эта динамика сможет исцелиться',
    },
  },
  gift_archetypes: {
    disorganized_attachment_shadows: {
      mechanismEn: 'Their chaos challenges your hard-won balance — you may feel responsible for fixing them',
      mechanismRu: 'Их хаос угрожает вашему с трудом обретённому равновесию — возникает соблазн их «починить»',
      healingEn: 'Remembering that you cannot heal another — only hold space with compassion',
      healingRu: 'Помните: вы не можете исцелить другого — только бережно держать для него пространство',
    },
    control_shadows: {
      mechanismEn: 'Their rigidity tests your acceptance — you may project your own unresolved need for control onto them',
      mechanismRu: 'Их жёсткость проверяет ваше принятие — вы можете проецировать собственную неразрешённую потребность в контроле на них',
      healingEn: 'Accepting that others\' defenses are their path, not yours to dismantle',
      healingRu: 'Принять: защиты другого — его путь, не вам их разбирать',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their emotional volatility invites you to practice the compassion you\'ve learned — or reveals where your equanimity is still fragile',
      mechanismRu: 'Их эмоциональная нестабильность приглашает вас практиковать сострадание, которому вы научились — или обнаруживает, где ваше равновесие ещё хрупко',
      healingEn: 'Staying grounded in their storm is the advanced course in your continued growth',
      healingRu: 'Оставаться заземлённым в их буре — это продвинутый курс вашего продолжающегося роста',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their emotional absence tests your patience — you may try to "awaken" feelings they have carefully walled off',
      mechanismRu: 'Их эмоциональное отсутствие проверяет ваше терпение — вы можете пытаться «пробудить» чувства, которые они тщательно отгородили',
      healingEn: 'Your warmth can be an invitation, not a demand — let them come at their own pace',
      healingRu: 'Ваша теплота может быть приглашением, а не требованием — позвольте им идти в своём темпе',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their neediness tests the boundaries you\'ve worked so hard to establish — can you give without losing yourself?',
      mechanismRu: 'Их нужда проверяет границы, которые вы так упорно выстраивали — можете ли вы давать, не теряя себя?',
      healingEn: 'Your generosity is a gift, not an obligation — maintaining your own center allows true giving',
      healingRu: 'Ваша щедрость — дар, а не обязанность. Сохранение собственного центра позволяет истинную отдачу',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm tests whether you can see through performance to the pain beneath — your clarity is your gift here',
      mechanismRu: 'Их обаяние проверяет, можете ли вы видеть сквозь представление боль под ним — ваша ясность здесь ваш дар',
      healingEn: 'Seeing through the mask without judgment — your presence invites them to take it off',
      healingRu: 'Видеть сквозь маску без осуждения — ваше присутствие приглашает её снять',
    },
    gift_archetypes: {
      mechanismEn: 'Two whole people together — the projection here is minimal, but watch for co-dependence in healing',
      mechanismRu: 'Два целостных человека вместе — проекций минимум, но следите за созависимостью в исцелении',
      healingEn: 'Continue growing individually so the relationship remains a choice, not a merging',
      healingRu: 'Продолжайте расти индивидуально, чтобы отношения оставались выбором, а не слиянием',
    },
  },
};

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

const RELATIONAL_ARCHETYPES: RelationalArchetype[] = [
  {
    nameEn: 'The Alchemical Marriage', nameRu: 'Алхимический брак',
    symbol: '⚗️',
    descriptionEn: 'A relationship that transforms both partners through the heat of their differences. The friction itself is the catalyst for individuation.',
    descriptionRu: 'Отношения, которые преображают обоих партнёров через жар различий. Трение между вами — катализатор индивидуации.',
    invitationEn: 'To trust that the discomfort is the medicine',
    invitationRu: 'Довериться: дискомфорт — это и есть лекарство',
    shadowEn: 'Can become addicted to the transformation and avoid the peace that follows healing',
    shadowRu: 'Риск привыкнуть к процессу трансформации и избегать покоя, который приходит с исцелением',
  },
  {
    nameEn: 'The Sanctuary', nameRu: 'Святилище',
    symbol: '🏛️',
    descriptionEn: 'Two healed individuals creating a sacred container for mutual growth. Safety is the foundation from which everything else emerges.',
    descriptionRu: 'Два исцелённых человека создают священное пространство для взаимного роста. Безопасность — фундамент, на котором строится всё остальное.',
    invitationEn: 'To go even deeper together — from healing to co-creation',
    invitationRu: 'Идти глубже вместе — от исцеления к сотворчеству',
    shadowEn: 'Can become complacent, mistaking comfort for true intimacy',
    shadowRu: 'Риск впасть в самоуспокоенность, спутав комфорт с подлинной близостью',
  },
  {
    nameEn: 'The Crucible', nameRu: 'Горнило',
    symbol: '🔥',
    descriptionEn: 'An intense bond that brings each partner\'s deepest wounds to the surface. Not for the faint of heart, but profoundly transformative.',
    descriptionRu: 'Мощная связь, которая выносит на поверхность самые глубокие раны каждого. Не для слабых духом — но невероятно трансформирующая.',
    invitationEn: 'To remember that the pain is not punishment — it is the path',
    invitationRu: 'Помнить: боль — не наказание. Она — путь',
    shadowEn: 'Can become defined by suffering, confusing pain with depth',
    shadowRu: 'Риск отождествить себя со страданием, путая боль с глубиной',
  },
  {
    nameEn: 'The Mirror Chamber', nameRu: 'Зеркальный зал',
    symbol: '🪞',
    descriptionEn: 'Each partner perfectly mirrors the other\'s shadow — making this relationship the most powerful growth vehicle and the most uncomfortable.',
    descriptionRu: 'Каждый партнёр безупречно отражает тень другого — эти отношения одновременно самое мощное пространство для роста и самое дискомфортное.',
    invitationEn: 'To thank them for showing you what you cannot see in yourself',
    invitationRu: 'Поблагодарить за то, что показывают вам то, что вы сами в себе не замечаете',
    shadowEn: 'Endless mutual projection without taking responsibility',
    shadowRu: 'Риск бесконечной взаимной проекции без принятия ответственности',
  },
  {
    nameEn: 'The Bridge Builders', nameRu: 'Строители мостов',
    symbol: '🌉',
    descriptionEn: 'Partners from different emotional worlds who choose to build connection across the gap. Every bridge is a triumph of love over fear.',
    descriptionRu: 'Партнёры из разных эмоциональных миров, которые всё же строят связь через пропасть между ними. Каждый мост — это победа любви над страхом.',
    invitationEn: 'To celebrate the effort, not just the arrival',
    invitationRu: 'Праздновать само усилие, а не только результат',
    shadowEn: 'Can exhaust themselves building bridges without ever crossing them',
    shadowRu: 'Риск истощить себя строительством мостов, ни разу по ним не пройдя',
  },
  {
    nameEn: 'The Spiral Dance', nameRu: 'Спиральный танец',
    symbol: '🌀',
    descriptionEn: 'A relationship that revisits the same patterns at ever-deeper levels. Progress is not linear — it spirals, and each loop goes deeper.',
    descriptionRu: 'Отношения, в которых одни и те же паттерны повторяются на всё более глубоких уровнях. Прогресс нелинеен — он движется по спирали, с каждым витком уходя глубже.',
    invitationEn: 'To recognize that you are not going in circles — you are spiraling inward',
    invitationRu: 'Заметьте: вы не ходите по кругу — вы движетесь по спирали внутрь',
    shadowEn: 'Can lose hope thinking nothing ever changes',
    shadowRu: 'Риск потерять надежду, решив, что ничего не меняется',
  },
  {
    nameEn: 'The Quiet Revolution', nameRu: 'Тихая революция',
    symbol: '🕊️',
    descriptionEn: 'A gentle, steady partnership that transforms both people so gradually they barely notice until they look back. The most sustainable form of growth.',
    descriptionRu: 'Нежное, устойчивое партнёрство, которое преображает обоих настолько постепенно, что они замечают это, лишь оглянувшись назад. Самая устойчивая форма роста.',
    invitationEn: 'To trust the slow work — oceans are shaped by persistent waves, not tidal waves',
    invitationRu: 'Доверять медленной работе: океаны формируются не цунами, а настойчивыми волнами',
    shadowEn: 'Can mistake stability for stagnation',
    shadowRu: 'Риск принять стабильность за застой',
  },
  {
    nameEn: 'The Eclipse', nameRu: 'Затмение',
    symbol: '🌑',
    descriptionEn: 'One partner\'s light temporarily obscures the other\'s — a pattern of losing individuality in the relationship. The challenge is to shine together.',
    descriptionRu: 'Свет одного партнёра временно затмевает свет другого — так теряется индивидуальность. Вызов — научиться сиять вместе.',
    invitationEn: 'To let your light shine alongside theirs, not in their shadow',
    invitationRu: 'Позволить своему свету сиять рядом, а не в чужой тени',
    shadowEn: 'One partner disappears into the other',
    shadowRu: 'Риск, что один партнёр растворится в другом',
  },
];

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
        ? `Person 1 is the primary initiator (agency: +${pct(p1Init)}%). Person 2 tends to respond rather than initiate.`
        : `Person 2 is the primary initiator (agency: +${pct(p2Init)}%). Person 1 tends to respond rather than initiate.`,
    initiationDescRu: initiationPattern === 'mutual'
      ? 'Оба партнёра делят инициативу относительно поровну.'
      : initiationPattern === 'person1'
        ? `Первый — основной инициатор (агентность: +${pct(p1Init)}%). Второй склонен отвечать, а не инициировать.`
        : `Второй — основной инициатор (агентность: +${pct(p2Init)}%). Первый склонен отвечать, а не инициировать.`,
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
      ru: 'Бессознательный контракт: «Я буду преследовать, а ты отстраняться, подтверждая оба наших страха — твой, что близость опасна, и мой, что я нелюбим». Это самый частый и самый болезненный реляционный контракт.',
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
