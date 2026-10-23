import {
  computeBoundaryStyle,
  computeDissociation,
  computeDefenseHierarchy,
  computeIntegrationPathway,
  computeNarrativeCoherence,
  computePoleScores,
  computeRegulationCapacity,
  computeTriggerMap,
  detectComplexes,
  generateArchetypes,
  negativePoleStrength,
  positivePoleStrength,
  type PoleScores,
  type ScoredArchetype,
} from '../../shared/core/data/scoring';
import { STRINGS, TRANSLATIONS } from '../../shared/i18n/strings';
import type { LegacyAiAnalysis } from '../core/legacy-ai-analysis';

export type LegacyAssessmentLanguage = 'en' | 'ru';

export interface LegacyAssessmentReport {
  version: 'angular-assessment-64.v2';
  language: LegacyAssessmentLanguage;
  createdAt: string;
  poleScores: PoleScores;
  archetypes: ScoredArchetype[];
  /** Response-derived placement list, kept when an AI pantheon replaces `archetypes` for narrative display. */
  deterministicArchetypes?: ScoredArchetype[];
  dynamics: ReturnType<typeof generateArchetypes>['dynamics'];
  complexes: ReturnType<typeof detectComplexes>;
  defenseHierarchy: ReturnType<typeof computeDefenseHierarchy>;
  triggerMap: ReturnType<typeof computeTriggerMap>;
  integrationPathway: ReturnType<typeof computeIntegrationPathway>;
  dissociation: ReturnType<typeof computeDissociation>;
  regulation: ReturnType<typeof computeRegulationCapacity>;
  boundary: ReturnType<typeof computeBoundaryStyle>;
  coherence: ReturnType<typeof computeNarrativeCoherence>;
  localNarrative: string;
  aiNarrative?: string;
  aiAnalysis?: LegacyAiAnalysis;
}

const LOCAL_COPY = {
  en: {
    title: '## A reflective reading of your relational profile',
    pattern: '### The pattern that stands out',
    dynamics: '### How the parts may work together',
    indicators: '### Computed indicators',
    next: '### A gentle next step',
    strongest: (name: string, prominence: number, description: string) =>
      `The strongest current theme is **${name}** (${prominence}% of the generated profile). ${description}`,
    dynamicsNone: 'No protector-to-wound relationship was prominent enough to map in this run.',
    complex: (name: string, severity: number) => `The computed indicators also highlight **${name}** (${severity}% severity).`,
    indicatorLine: (regulation: string, dissociation: string, boundary: string, coherence: string) =>
      `The response-based indicators are: regulation **${regulation}**, dissociation tendency **${dissociation}**, boundary style **${boundary}**, and narrative coherence **${coherence}**. These are descriptive signals, not diagnoses.`,
    nextFallback: 'Pause with the result that feels most useful; you do not need to act on every part of the map.',
  },
  ru: {
    title: '## Бережное прочтение вашего профиля отношений',
    pattern: '### Наиболее заметный паттерн',
    dynamics: '### Как части могут взаимодействовать',
    indicators: '### Вычисляемые показатели',
    next: '### Мягкий следующий шаг',
    strongest: (name: string, prominence: number, description: string) =>
      `Сейчас сильнее всего выделяется тема **${name}** (${prominence}% сформированного профиля). ${description}`,
    dynamicsNone: 'В этом результате не обнаружено достаточно выраженной связи между защитником и раной.',
    complex: (name: string, severity: number) => `Вычисляемые показатели также выделяют **${name}** (выраженность ${severity}%).`,
    indicatorLine: (regulation: string, dissociation: string, boundary: string, coherence: string) =>
      `Показатели по ответам: регуляция — **${regulation}**, склонность к диссоциации — **${dissociation}**, стиль границ — **${boundary}**, связность повествования — **${coherence}**. Это описательные ориентиры, а не диагнозы.`,
    nextFallback: 'Остановитесь на том выводе, который кажется полезным. Не нужно сразу предпринимать действия по каждому пункту карты.',
  },
} as const;

function localized<T>(language: LegacyAssessmentLanguage, english: T, russian: T): T {
  return language === 'ru' ? russian : english;
}

export function buildLegacyLocalNarrative(
  report: Pick<LegacyAssessmentReport, 'language' | 'archetypes' | 'dynamics' | 'complexes' | 'regulation' | 'dissociation' | 'boundary' | 'coherence' | 'integrationPathway'>,
): string {
  const language = report.language;
  const copy = LOCAL_COPY[language];
  const primary = report.archetypes[0];
  if (!primary) return copy.title;

  const dynamicDescriptions = report.dynamics.slice(0, 2).map((item) => `- ${item.description}`);
  const leadingComplex = report.complexes[0];
  const level = (english: string, russian: string) => localized(language, english, russian);
  const pathway = report.integrationPathway[0];
  const nextStep = pathway
    ? localized(language, pathway.action, pathway.actionRu)
    : copy.nextFallback;

  return [
    copy.title,
    '',
    copy.pattern,
    copy.strongest(primary.name, primary.prominence, primary.description),
    '',
    copy.dynamics,
    ...(dynamicDescriptions.length ? dynamicDescriptions : [copy.dynamicsNone]),
    ...(leadingComplex ? ['', copy.complex(language === 'ru' ? leadingComplex.nameRu : leadingComplex.name, Math.round(leadingComplex.severity * 100))] : []),
    '',
    copy.indicators,
    copy.indicatorLine(
      localized(language, report.regulation.dysregulationPattern, report.regulation.dysregulationPatternRu),
      localized(language, report.dissociation.level, report.dissociation.levelRu),
      localized(language, report.boundary.style, report.boundary.styleRu),
      localized(language, report.coherence.level, report.coherence.levelRu),
    ),
    '',
    copy.next,
    nextStep,
    '',
    language === 'ru'
      ? '_Инструмент для саморефлексии; не является медицинской или психиатрической диагностикой._'
      : '_A self-reflection aid; not a medical or psychiatric diagnosis._',
  ].join('\n');
}

export function buildLegacyReportData(
  responses: number[],
  language: LegacyAssessmentLanguage,
  createdAt = new Date().toISOString(),
): LegacyAssessmentReport {
  const poleScores = computePoleScores(responses);
  const { archetypes, dynamics } = generateArchetypes(responses, language);
  const partial = {
    version: 'angular-assessment-64.v2' as const,
    language,
    createdAt,
    poleScores,
    archetypes,
    dynamics,
    complexes: detectComplexes(archetypes, poleScores, language),
    defenseHierarchy: computeDefenseHierarchy(archetypes, poleScores, language),
    triggerMap: computeTriggerMap(archetypes, poleScores, language),
    integrationPathway: computeIntegrationPathway(archetypes, poleScores, language),
    dissociation: computeDissociation(responses, poleScores),
    regulation: computeRegulationCapacity(responses, poleScores),
    boundary: computeBoundaryStyle(poleScores),
    coherence: computeNarrativeCoherence(responses, poleScores),
  };
  return { ...partial, localNarrative: buildLegacyLocalNarrative(partial) };
}

/** Merge an explicitly requested AI pantheon while leaving numeric indicators response-scored locally. */
export function applyLegacyAiAnalysis(report: LegacyAssessmentReport, analysis: LegacyAiAnalysis): LegacyAssessmentReport {
  const archetypes: ScoredArchetype[] = analysis.pantheon.map((item) => ({
    name: item.name,
    symbol: item.symbol,
    coordinates: item.coordinates,
    cluster: item.cluster,
    prominence: item.prominence,
    size: item.size,
    description: item.description,
    wound: item.wound,
    shadow: item.shadow,
    invitation: item.invitation,
    coreBelief: item.coreBelief,
    attracts: item.attracts,
    partType: item.partType,
    developmentalOrigin: item.developmentalOrigin,
    disorganizedModifier: item.disorganizedModifier,
  }));
  const partial = {
    ...report,
    archetypes,
    deterministicArchetypes: report.deterministicArchetypes ?? report.archetypes,
    complexes: detectComplexes(archetypes, report.poleScores, report.language),
    defenseHierarchy: computeDefenseHierarchy(archetypes, report.poleScores, report.language),
    triggerMap: computeTriggerMap(archetypes, report.poleScores, report.language),
    integrationPathway: computeIntegrationPathway(archetypes, report.poleScores, report.language),
    aiAnalysis: analysis,
    aiNarrative: analysis.analysis,
  };
  return { ...partial, localNarrative: buildLegacyLocalNarrative(partial) };
}

function percent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`;
}

function signed(value: number): string {
  return `${Math.round(Math.abs(value) * 100)}% ${value >= 0 ? '→' : '←'}`;
}

function originLabel(origin: ScoredArchetype['developmentalOrigin'], language: LegacyAssessmentLanguage): string {
  if (language === 'ru') return STRINGS.resultsPanel.originsRu[origin] ?? origin;
  return ({
    pre_verbal: 'Pre-verbal', early_attachment: 'Early attachment', oedipal: 'Oedipal',
    latency: 'Latency', adolescent: 'Adolescent',
  } as Record<string, string>)[origin] ?? origin;
}

function partTypeLabel(type: ScoredArchetype['partType'], language: LegacyAssessmentLanguage): string {
  if (language === 'ru') return STRINGS.resultsPanel.partTypesRu[type] ?? type;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function buildLegacyClinicalMarkdown(
  report: LegacyAssessmentReport,
  language: LegacyAssessmentLanguage = report.language,
  generatedAt = new Date(report.createdAt),
): string {
  const labels = STRINGS.resultsPanel.exportLabels[language];
  const metrics = STRINGS.resultsPanel.metrics[language];
  const translations = TRANSLATIONS[language];
  const poles = report.poleScores;
  const primary = report.archetypes[0];
  const narrative = report.aiNarrative?.trim() || report.localNarrative;
  const clusterLabel = (cluster: string) => translations.universe.clusterNames[cluster] ?? cluster;
  const na = labels.na;
  const noResult = labels.noneDetected;
  const diagnostics = language === 'ru' ? 'Показатели' : 'Indicators';
  const poleRows: Array<[string, number]> = [
    [resultKey(language, 'agencyActive', 'agencyActive'), negativePoleStrength(poles.agencyActive)],
    [resultKey(language, 'agencyReceptive', 'agencyReceptive'), positivePoleStrength(poles.agencyReceptive)],
    [resultKey(language, 'tempHot', 'tempHot'), positivePoleStrength(poles.tempHot)],
    [resultKey(language, 'tempCool', 'tempCool'), negativePoleStrength(poles.tempCool)],
    [resultKey(language, 'focusOther', 'focusOther'), positivePoleStrength(poles.focusOther)],
    [resultKey(language, 'focusSelf', 'focusSelf'), negativePoleStrength(poles.focusSelf)],
    [resultKey(language, 'attAnxious', 'attAnxious'), positivePoleStrength(poles.attAnxious)],
    [resultKey(language, 'attAvoidant', 'attAvoidant'), negativePoleStrength(poles.attAvoidant)],
  ];
  const lines = [
    `# ${labels.title}`,
    '',
    `- ${labels.generated}: ${generatedAt.toISOString()}`,
    `- ${labels.language}: ${language}`,
    `- ${labels.primary}: ${primary?.name ?? na}`,
    '',
    `## ${labels.narrative}`,
    narrative,
    '',
    `## ${labels.signature}`,
    `${metrics.agency}: ${signed(poles.center[0])}`,
    `${metrics.temperature}: ${signed(poles.center[1])}`,
    `${metrics.focus}: ${signed(poles.center[2])}`,
    `${metrics.attachment}: ${signed(poles.center[3])}`,
    '',
    `## ${labels.poleScores}`,
    `${metrics.health}: ${percent(poles.healthScore)}`,
    ...poleRows.map(([name, value]) => `${name}: ${percent(value)}`),
    `${metrics.agencyCenter}: ${Math.round(poles.center[0] * 100)}%`,
    `${metrics.temperatureCenter}: ${Math.round(poles.center[1] * 100)}%`,
    `${metrics.focusCenter}: ${Math.round(poles.center[2] * 100)}%`,
    `${metrics.attachmentCenter}: ${Math.round(poles.center[3] * 100)}%`,
    ...(poles.disorganizedAttachment ? [`${resultKey(language, 'disorganizedFlag', 'disorganizedFlag')}: ${language === 'ru' ? 'Да' : 'Yes'}`] : []),
    '',
    `## ${labels.pantheon}`,
    ...report.archetypes.flatMap((archetype) => [
      `### ${archetype.symbol} ${archetype.name}`,
      `${metrics.cluster}: ${clusterLabel(archetype.cluster)}`,
      `${metrics.prominence}: ${archetype.prominence}%`,
      `${metrics.partType}: ${partTypeLabel(archetype.partType, language)}`,
      `${metrics.origin}: ${originLabel(archetype.developmentalOrigin, language)}`,
      `${metrics.wound}: ${archetype.wound || na}`,
      `${metrics.shadow}: ${archetype.shadow || na}`,
      `${metrics.invitation}: ${archetype.invitation || na}`,
      `${metrics.coreBelief}: ${archetype.coreBelief || na}`,
      `${metrics.attracts}: ${archetype.attracts || na}`,
      '',
    ]),
    `## ${language === 'ru' ? 'Динамика системы' : 'System Dynamics'}`,
    ...(report.dynamics.length
      ? report.dynamics.map((item) => `- ${item.description}`)
      : [`- ${noResult}`]),
    '',
    `## ${labels.complexes}`,
    ...(report.complexes.length
      ? report.complexes.map((complex) => `- **${language === 'ru' ? complex.nameRu : complex.name}**: ${language === 'ru' ? complex.coreWoundRu : complex.coreWound} (${Math.round(complex.severity * 100)}%)`)
      : [`- ${noResult}`]),
    '',
    `## ${labels.defense}`,
    ...(report.defenseHierarchy.layers.length
      ? report.defenseHierarchy.layers.map((layer) => `- ${metrics.layer} ${layer.level} · ${language === 'ru' ? layer.labelRu : layer.label}: ${layer.parts.join(', ')} — ${language === 'ru' ? layer.descriptionRu : layer.description}`)
      : [`- ${noResult}`]),
    ...(report.defenseHierarchy.escalationPaths.length
      ? ['', ...(language === 'ru' ? ['Эскалационные пути'] : ['Escalation paths']), ...report.defenseHierarchy.escalationPaths.map((path) => `- ${path.from} → ${path.to}: ${language === 'ru' ? path.triggerRu : path.trigger}`)]
      : []),
    '',
    `## ${labels.triggers}`,
    ...(report.triggerMap.length
      ? report.triggerMap.flatMap((trigger) => [
        `### ${trigger.partName} · ${partTypeLabel(trigger.partType, language)}`,
        ...(language === 'ru' ? trigger.triggerSituationsRu : trigger.triggerSituations).map((situation) => `- ${situation}`),
        `${language === 'ru' ? trigger.reactionPatternRu : trigger.reactionPattern}`,
        `${language === 'ru' ? trigger.underlyingWoundRu : trigger.underlyingWound}`,
        '',
      ])
      : [`- ${labels.noneMapped}`]),
    `## ${labels.pathway}`,
    ...(report.integrationPathway.length
      ? report.integrationPathway.map((step) => `- ${step.stage}. ${language === 'ru' ? step.stageNameRu : step.stageName}: ${language === 'ru' ? step.actionRu : step.action} (${step.targetParts.join(', ')})`)
      : [`- ${labels.noneMapped}`]),
    '',
    `## ${labels.diagnostics}`,
    `${metrics.dissociation}: ${language === 'ru' ? report.dissociation.levelRu : report.dissociation.level} (${percent(report.dissociation.score)}) — ${language === 'ru' ? report.dissociation.descriptionRu : report.dissociation.description}`,
    `${metrics.regulation}: ${language === 'ru' ? report.regulation.dysregulationPatternRu : report.regulation.dysregulationPattern} · ${language === 'ru' ? 'окно толерантности' : 'window of tolerance'} ${percent(report.regulation.windowOfTolerance)} — ${language === 'ru' ? report.regulation.descriptionRu : report.regulation.description}`,
    `${metrics.boundaries}: ${language === 'ru' ? report.boundary.styleRu : report.boundary.style} (${percent(report.boundary.score)}) — ${language === 'ru' ? report.boundary.descriptionRu : report.boundary.description}`,
    `${metrics.coherence}: ${language === 'ru' ? report.coherence.levelRu : report.coherence.level} (${percent(report.coherence.score)}) — ${language === 'ru' ? report.coherence.descriptionRu : report.coherence.description}`,
    '',
    `> ${labels.note}`,
  ];
  return lines.join('\n');
}

function resultKey(language: LegacyAssessmentLanguage, english: string, fallback: string): string {
  return TRANSLATIONS[language].assessment.results[english] ?? fallback;
}

export interface LegacyAssessmentBackupQuestion {
  section: string;
  text: string;
}

export function buildLegacyAssessmentBackup(
  responses: number[],
  report: LegacyAssessmentReport,
  questions: LegacyAssessmentBackupQuestion[],
  translateQuestion: (question: LegacyAssessmentBackupQuestion) => string,
  timestamp = new Date().toISOString(),
) {
  return {
    app: 'ArchetypeAI',
    type: 'ArchetypeAI_Assessment_Backup',
    version: 2,
    timestamp,
    dimensionalExpressions: {
      AGENCY: report.poleScores.center[0],
      TEMPERATURE: report.poleScores.center[1],
      FOCUS: report.poleScores.center[2],
      ATTACHMENT: report.poleScores.center[3],
    },
    assessmentResponses: responses,
    results: report,
    data: questions.map((question, index) => ({
      section: question.section,
      questionId: question.text,
      questionText: translateQuestion(question),
      response: responses[index],
    })),
  };
}
