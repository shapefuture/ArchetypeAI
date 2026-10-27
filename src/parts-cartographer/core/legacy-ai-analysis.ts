export const LEGACY_AI_CLUSTERS = [
  'gift_archetypes',
  'control_shadows',
  'emotional_storm_shadows',
  'avoidant_intellectual_shadows',
  'anxious_connection_shadows',
  'seductive_avoidance_shadows',
  'disorganized_attachment_shadows',
] as const;

const POLE_SCORE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    agency: { type: 'NUMBER', minimum: -1, maximum: 1 },
    emotional_temperature: { type: 'NUMBER', minimum: -1, maximum: 1 },
    relational_focus: { type: 'NUMBER', minimum: -1, maximum: 1 },
    attachment: { type: 'NUMBER', minimum: -1, maximum: 1 },
  },
  required: ['agency', 'emotional_temperature', 'relational_focus', 'attachment'],
};

const PANTHEON_ARCHETYPE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    symbol: { type: 'STRING' },
    description: { type: 'STRING' },
    wound: { type: 'STRING' },
    shadow: { type: 'STRING' },
    invitation: { type: 'STRING' },
    coreBelief: { type: 'STRING' },
    attracts: { type: 'STRING' },
    size: { type: 'NUMBER', minimum: 0.4, maximum: 1.1 },
    coordinates: { type: 'ARRAY', minItems: 4, maxItems: 4, items: { type: 'NUMBER', minimum: -1, maximum: 1 } },
    cluster: { type: 'STRING', enum: LEGACY_AI_CLUSTERS },
    prominence: { type: 'NUMBER', minimum: 0, maximum: 100 },
    partType: { type: 'STRING', enum: ['manager', 'firefighter', 'exile', 'self'] },
    developmentalOrigin: { type: 'STRING', enum: ['pre_verbal', 'early_attachment', 'oedipal', 'latency', 'adolescent'] },
    disorganizedModifier: { type: 'BOOLEAN' },
  },
  required: ['name', 'symbol', 'description', 'wound', 'shadow', 'invitation', 'coreBelief', 'attracts', 'size', 'coordinates', 'cluster', 'prominence'],
};

export const LEGACY_AI_ANALYSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    analysis: { type: 'STRING' },
    poleScores: POLE_SCORE_SCHEMA,
    pantheon: { type: 'ARRAY', minItems: 4, maxItems: 8, items: PANTHEON_ARCHETYPE_SCHEMA },
  },
  required: ['analysis', 'poleScores', 'pantheon'],
};

export type LegacyAiLanguage = 'en' | 'ru';
export interface LegacyAiQuestionAnswer {
  sectionTitle: string;
  question: string;
  answer: number;
}
export interface LegacyAiArchetype {
  name: string;
  symbol: string;
  description: string;
  wound: string;
  shadow: string;
  invitation: string;
  coreBelief: string;
  attracts: string;
  size: number;
  coordinates: [number, number, number, number];
  cluster: typeof LEGACY_AI_CLUSTERS[number];
  prominence: number;
  partType: 'manager' | 'firefighter' | 'exile' | 'self';
  developmentalOrigin: 'pre_verbal' | 'early_attachment' | 'oedipal' | 'latency' | 'adolescent';
  disorganizedModifier: boolean;
}
export interface LegacyAiAnalysis {
  analysis: string;
  poleScores: {
    agency: number;
    emotional_temperature: number;
    relational_focus: number;
    attachment: number;
  };
  pantheon: LegacyAiArchetype[];
}

export interface LegacyAiPromptInput {
  language: LegacyAiLanguage;
  questions: LegacyAiQuestionAnswer[];
  reportSections: Record<string, string>;
  existingArchetypes: string[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const text = (value: unknown, maxLength: number, fallback = '') =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback;
const finiteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export function buildLegacyAiSystemInstruction(input: LegacyAiPromptInput): string {
  const language = input.language === 'ru' ? 'Russian' : 'English';
  const youForm = input.language === 'ru' ? 'вы' : 'you';
  const answers = input.questions.map((item, index) =>
    `${index + 1}. [${item.sectionTitle}] ${item.question}\n   Answer: ${item.answer}`,
  ).join('\n');
  const existing = input.existingArchetypes.map((name) => `- ${name}`).join('\n') || '(none supplied)';
  const sections = Object.entries(input.reportSections).map(([key, value]) => `${key}: ${value}`).join('\n');

  return `You are writing an optional, user-requested self-reflection from a 64-item relational questionnaire. Write in ${language}, address the reader as "${youForm}", and treat the answers below as the only evidence. This is not clinical care, diagnosis, or treatment. Do not infer trauma, invent certainty, or give medical advice. Avoid labels that sound like fixed identities.\n\nFULL QUESTIONNAIRE (1–5 scale):\n${answers}\n\nEXISTING ARCHETYPE NAMES TO AVOID DUPLICATING:\n${existing}\n\nREPORT STRUCTURE AND SECTION GUIDANCE:\n${sections}\n\nOUTPUT REQUIREMENTS:\nReturn only JSON matching the supplied schema. The analysis should use eight numbered Markdown sections, following the localized section titles and guidance above. Keep wording compassionate, specific, non-diagnostic, and grounded in the answers. Generate 4–8 distinct archetypes across gift and shadow clusters. Each archetype needs concise plain-language descriptions for description, wound, shadow, invitation, coreBelief, and attracts. The four continuous poleScores are AI estimates in [-1, 1]. Coordinates must each be in [-1, 1], size in [0.4, 1.1], prominence values should sum to 100, and cluster must be one of the schema enum values. No personally identifying details. The app keeps its deterministic scores and safety indicators locally; this AI output only supplies the requested alternate archetype pantheon and narrative.`;
}

export function sanitizeLegacyAiAnalysis(value: unknown): LegacyAiAnalysis {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('AI analysis must be an object.');
  const input = value as Record<string, unknown>;
  const poleInput = input.poleScores;
  const pantheonInput = input.pantheon;
  if (!poleInput || typeof poleInput !== 'object' || Array.isArray(poleInput)) throw new Error('AI pole scores are missing.');
  if (!Array.isArray(pantheonInput) || pantheonInput.length < 4 || pantheonInput.length > 8) throw new Error('AI pantheon must contain four to eight archetypes.');
  const poleValues = poleInput as Record<string, unknown>;
  const score = (key: string) => {
    const number = finiteNumber(poleValues[key]);
    if (number === null) throw new Error(`AI pole score ${key} is invalid.`);
    return clamp(number, -1, 1);
  };

  const pantheon = pantheonInput.map((item, index): LegacyAiArchetype => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`AI archetype ${index + 1} is invalid.`);
    const archetype = item as Record<string, unknown>;
    const coordinatesInput = archetype.coordinates;
    if (!Array.isArray(coordinatesInput) || coordinatesInput.length !== 4) throw new Error(`AI archetype ${index + 1} must have four coordinates.`);
    const coordinates = coordinatesInput.map((coordinate) => {
      const number = finiteNumber(coordinate);
      if (number === null) throw new Error(`AI archetype ${index + 1} has an invalid coordinate.`);
      return clamp(number, -1, 1);
    }) as [number, number, number, number];
    const name = text(archetype.name, 100);
    const prominence = finiteNumber(archetype.prominence);
    const size = finiteNumber(archetype.size);
    if (!name || prominence === null || size === null) throw new Error(`AI archetype ${index + 1} is missing a name or numeric values.`);
    const cluster = LEGACY_AI_CLUSTERS.includes(archetype.cluster as typeof LEGACY_AI_CLUSTERS[number])
      ? archetype.cluster as typeof LEGACY_AI_CLUSTERS[number]
      : 'gift_archetypes';
    const partType = ['manager', 'firefighter', 'exile', 'self'].includes(String(archetype.partType))
      ? archetype.partType as LegacyAiArchetype['partType']
      : 'self';
    const origin = ['pre_verbal', 'early_attachment', 'oedipal', 'latency', 'adolescent'].includes(String(archetype.developmentalOrigin))
      ? archetype.developmentalOrigin as LegacyAiArchetype['developmentalOrigin']
      : 'adolescent';
    return {
      name,
      symbol: text(archetype.symbol, 12, '✨') || '✨',
      description: text(archetype.description, 700, text(archetype.invitation, 700)),
      wound: text(archetype.wound, 500),
      shadow: text(archetype.shadow, 500),
      invitation: text(archetype.invitation, 500),
      coreBelief: text(archetype.coreBelief, 500),
      attracts: text(archetype.attracts, 500),
      size: clamp(size, 0.4, 1.1),
      coordinates,
      cluster,
      prominence: clamp(prominence, 0, 100),
      partType,
      developmentalOrigin: origin,
      disorganizedModifier: archetype.disorganizedModifier === true,
    };
  });

  const rawTotal = pantheon.reduce((sum, archetype) => sum + archetype.prominence, 0);
  const equalShare = 100 / pantheon.length;
  let assigned = 0;
  pantheon.forEach((archetype, index) => {
    archetype.prominence = index === pantheon.length - 1
      ? Number((100 - assigned).toFixed(2))
      : Number(((rawTotal > 0 ? archetype.prominence / rawTotal * 100 : equalShare)).toFixed(2));
    assigned += archetype.prominence;
  });

  // Analysis is prose: markup in a restored file is removed, so no stored narrative can carry live HTML.
  const analysis = text(input.analysis, 24_000).replace(/<[^>]*>/g, '');
  if (analysis.length < 80) throw new Error('AI analysis is empty or too short.');
  return {
    analysis,
    poleScores: {
      agency: score('agency'),
      emotional_temperature: score('emotional_temperature'),
      relational_focus: score('relational_focus'),
      attachment: score('attachment'),
    },
    pantheon,
  };
}
