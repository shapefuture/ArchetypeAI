import { Injectable, inject } from '@angular/core';
import { Archetype, DimensionalExpressions } from './webxr.service';
import { TranslationService } from './translation.service';
import { generateArchetypes, ScoredArchetype } from '../app/core/data/scoring';

export interface ChatMessage {
  role: 'user' | 'model' | 'error';
  content: string;
}

export interface CoachResponse {
  response: string;
  suggestions: string[];
}

export interface GeneratedArchetype extends Omit<Archetype, 'id' | 'color'> {
  color?: string;
  prominence: number;
  partType?: 'manager' | 'firefighter' | 'exile' | 'self';
  developmentalOrigin?: 'pre_verbal' | 'early_attachment' | 'oedipal' | 'latency' | 'adolescent';
  disorganizedModifier?: boolean;
}

export interface AssessmentAnalysis {
  analysis: string;
  pantheon: GeneratedArchetype[];
  dynamics?: { protector: string; protects: string; mechanism: 'manages' | 'firefights' | 'carries_wound'; description: string }[];
  /**
   * The user's calibrated pole scores on each of the four dimensions. The
   * origin differs by mode:
   *   - 'deterministic'  → algorithm-computed by `computePoleScores` (ground truth)
   *   - 'fallback'/legacy → AI-estimated from the 64 answers (calibrated self-report)
   * Either way, all four values are clamped to [-1, 1]. The result panel uses
   * this to render the dimensional profile; the deterministic source is
   * preferred where available, the AI estimate is used otherwise.
   */
  poleScores?: { agency: number; emotional_temperature: number; relational_focus: number; attachment: number };
  /**
   * True when the narrative analysis came from the local fallback (AI call failed,
   * was cancelled, or returned empty/garbage). The pantheon and dimensional data
   * are still algorithmically correct — only the Markdown narrative is degraded.
   * Surface this to the user so silent degradation is impossible.
   */
  narrativeDegraded?: boolean;
}

// Gemini REST API requires uppercase type strings in responseSchema (OpenAPI 3.0 format)
const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  OBJECT: 'OBJECT',
  ARRAY: 'ARRAY'
};

// 7 universe clusters — used as a strict enum in legacy mode so the AI can't
// invent off-target cluster names. The deterministic mode still has its own
// internal cluster vocabulary; these are the 7 it produces.
const VALID_CLUSTERS = [
  'gift_archetypes',
  'control_shadows',
  'emotional_storm_shadows',
  'avoidant_intellectual_shadows',
  'anxious_connection_shadows',
  'seductive_avoidance_shadows',
  'disorganized_attachment_shadows',
] as const;

const ARCHETYPE_SCHEMA_PROPERTIES = {
  name: { type: Type.STRING, description: 'A creative and descriptive name for the archetype, starting with "The". For example: "The Resilient Gardener".' },
  symbol: { type: Type.STRING, description: 'A single emoji that best represents the archetype.' },
  wound: { type: Type.STRING, description: 'A brief, insightful description of the core wound or challenge of this archetype.' },
  shadow: { type: Type.STRING, description: 'The primary shadow aspect or negative behavior pattern.' },
  invitation: { type: Type.STRING, description: 'The invitation for healing and growth for someone embodying this archetype.' },
  coreBelief: { type: Type.STRING, description: 'The deep, often unconscious, belief that drives the archetype\'s behavior.' },
  attracts: { type: Type.STRING, description: 'What types of people or situations this archetype tends to attract into their life.' },
  size: { type: Type.NUMBER, description: 'A number between 0.4 and 1.1 representing the conceptual size or "mass" of the archetype.', minimum: 0.4, maximum: 1.1 },
  coordinates: {
    type: Type.ARRAY,
    description: 'A 4-element array of numbers representing [AGENCY, TEMPERATURE, FOCUS, ATTACHMENT]. Each value MUST be between -1.0 and 1.0.',
    minItems: 4,
    maxItems: 4,
    items: { type: Type.NUMBER, minimum: -1.0, maximum: 1.0 },
  },
  cluster: { type: Type.STRING, description: 'The cluster this archetype belongs to. MUST be one of the 7 predefined universe clusters.', enum: VALID_CLUSTERS }
};

const ARCHETYPE_SCHEMA_REQUIRED = ['name', 'symbol', 'wound', 'shadow', 'invitation', 'coreBelief', 'attracts', 'size', 'coordinates', 'cluster'];

const ARCHETYPE_SCHEMA = {
  type: Type.OBJECT,
  properties: ARCHETYPE_SCHEMA_PROPERTIES,
  required: ARCHETYPE_SCHEMA_REQUIRED
};

const PANTHEON_ARCHETYPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ...ARCHETYPE_SCHEMA_PROPERTIES,
    prominence: { type: Type.NUMBER, description: 'A number between 0 and 100 representing how prominent this archetype is in the user\'s profile. The sum of prominences for all generated archetypes MUST equal 100.', minimum: 0, maximum: 100 }
  },
  required: [...ARCHETYPE_SCHEMA_REQUIRED, 'prominence']
};

const POLE_SCORES_SCHEMA = {
  type: Type.OBJECT,
  description: "The AI's calibrated estimate of the user's pole scores, derived from the 64 answers. Each value is in [-1, 1]. These are the AI's own estimation (not the deterministic algorithm's); they are used to ground archetype positioning and to drive the dimensional display when the user chose the AI-first (legacy) mode.",
  properties: {
    agency: { type: Type.NUMBER, description: 'AGENCY pole: -1.0 (Hyper-Active / initiating) to +1.0 (Hyper-Receptive / allowing)', minimum: -1, maximum: 1 },
    emotional_temperature: { type: Type.NUMBER, description: 'TEMPERATURE pole: -1.0 (Hyper-Cool / logical) to +1.0 (Hyper-Hot / passionate)', minimum: -1, maximum: 1 },
    relational_focus: { type: Type.NUMBER, description: 'FOCUS pole: -1.0 (Hyper-Self / autonomous) to +1.0 (Hyper-Other / caretaking)', minimum: -1, maximum: 1 },
    attachment: { type: Type.NUMBER, description: 'ATTACHMENT pole: -1.0 (Hyper-Avoidant / distant) to +1.0 (Hyper-Anxious / clinging)', minimum: -1, maximum: 1 }
  },
  required: ['agency', 'emotional_temperature', 'relational_focus', 'attachment']
};

const ASSESSMENT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "A comprehensive, structured 8-section report on the user's relational patterns. Sections: (1) Dimensional profile, (2) Core behavioural patterns / archetypes, (3) Emotional regulation + boundaries + narrative coherence, (4) Psychological defences, (5) Core complexes, (6) Inner conflicts, (7) Resources, (8) Caveats. Markdown formatting with numbered headings and sub-headings (1., 1.1, 2., 2.1, ...). No bold, no italics, no emoji. Address the reader as 'you' (or 'вы' in Russian). Concrete life examples for every abstract claim. No clinical jargon without immediate plain-language translation. No flattery, no reframing, no self-help language, no calls to action."
    },
    poleScores: POLE_SCORES_SCHEMA,
    pantheon: {
      type: Type.ARRAY,
      description: "A 'Personal Pantheon' of uniquely positioned archetypes (gift + shadow) that represent the user's profile. 4-8 archetypes. Cluster MUST be from the 7 predefined values. Coordinates MUST be in [-1, 1]. Prominences MUST sum to exactly 100 (post-processing will renormalize if needed).",
      minItems: 1,
      maxItems: 8,
      items: PANTHEON_ARCHETYPE_SCHEMA
    }
  },
  required: ['analysis', 'poleScores', 'pantheon']
};

const PANTHEON_COLORS = ['#D55E00', '#0072B2', '#009E73', '#E69F00', '#CC79A7', '#56B4E9', '#F0E442', '#8B5CF6'];

const ANALYSIS_ONLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "A comprehensive, insightful, and compassionate analysis of the user's relational patterns. Format as Markdown with headings like '## Your Relational Fingerprint', '### Core Dynamic', '### Your Gifts', '### Areas for Growth'. Use bullet points and bold text."
    }
  },
  required: ['analysis']
};

const COACH_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        response: {
            type: Type.STRING,
            description: "The main, detailed response to the user's query, formatted in Markdown."
        },
        suggestions: {
            type: Type.ARRAY,
            description: "An array of 2-3 short, insightful, and distinct follow-up questions the user could ask. These should be worded as if the user is asking them.",
            items: { type: Type.STRING }
        }
    },
    required: ['response', 'suggestions']
};

interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: any;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly translationService = inject(TranslationService);
  private readonly apiUrl = '/api/ai';

  constructor() {}

  async callAI(payload: AIRequest, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<string> {
    const TIMEOUT_MS = options?.timeoutMs ?? 180_000; // 180s client-side timeout to allow full failover window and massive generation on Worker
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // If the caller provided their own AbortSignal, chain it so caller-side cancel
    // also aborts the fetch.
    const onCallerAbort = () => controller.abort();
    if (options?.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', onCallerAbort);
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (options?.signal) options.signal.removeEventListener('abort', onCallerAbort);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as { text?: string; error?: string; provider?: string; duration?: number };
      if (data.error) {
        throw new Error(data.error);
      }

      return data.text || '';
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (options?.signal) options.signal.removeEventListener('abort', onCallerAbort);
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        // Distinguish caller cancel from timeout: prefer caller-cancel message.
        if (options?.signal?.aborted) {
          const e: any = new Error(this.translationService.t('analysisCancelled', 'universe', 'Analysis cancelled.'));
          e.cancelled = true;
          throw e;
        }
        throw new Error(this.translationService.t('analysisTimeout', 'universe', 'The AI analysis is taking too long. Please try again.'));
      }
      if (error instanceof TypeError || /Failed to parse URL|fetch failed|network/i.test(error?.message || '')) {
        throw new Error(this.translationService.t('aiUnavailable', 'universe', 'The AI service is not available right now.'));
      }
      console.error('GeminiService.callAI error:', error);
      throw error;
    }
  }

  async createArchetype(prompt: string): Promise<Archetype> {
    const systemInstruction = `You are an expert in Jungian psychology, relational dynamics, and archetypal systems. Your task is to create a new **wounded** archetype based on the user's prompt. You must map this archetype onto a 4-dimensional conceptual space and return a valid JSON object according to the provided schema.

**LANGUAGE:** You MUST respond in ${this.translationService.getLanguage() === 'ru' ? 'Russian' : 'English'}.

Here are the definitions of the four dimensions. Each ranges from -1.0 to 1.0:
1.  **AGENCY (-1.0 to 1.0):** -1.0 (Active/Assertive), 1.0 (Receptive/Allowing).
2.  **TEMPERATURE (-1.0 to 1.0):** -1.0 (Cool/Detached), 1.0 (Hot/Passionate).
3.  **FOCUS (-1.0 to 1.0):** -1.0 (Self-focused), 1.0 (Other-focused).
4.  **ATTACHMENT (-1.0 to 1.0):** -1.0 (Avoidant), 1.0 (Anxious).
5.  **SIZE (0.4 to 1.0):** The conceptual "mass" or impact of the archetype. Larger sizes are more dominant and encompassing patterns.

Analyze the user's prompt and thoughtfully assign the four coordinate values and a size based on these definitions. Then, fill out the other properties of the archetype. The output must be a single, valid JSON object.`;

    try {
      const text = await this.callAI({
        prompt: `Create an archetype based on this description: "${prompt}"`,
        systemInstruction,
        responseSchema: ARCHETYPE_SCHEMA
      });

      if (!text) {
        throw new Error(this.translationService.t('creatorEmptyResponse', 'universe', 'The AI creator returned an empty response.'));
      }

      let generated: Omit<Archetype, 'id' | 'color'>;
      try {
        generated = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON from AI:', text, parseError);
        throw new Error(this.translationService.t('creatorInvalidFormat', 'universe', 'The AI creator returned an invalid data format.'));
      }

      const newArchetype: Archetype = Object.assign({}, generated, {
        id: this.buildStudioArchetypeId(generated.name || prompt),
        color: `hsl(${Math.random() * 360}, 60%, 60%)`,
        size: Math.max(0.4, Math.min(1.1, generated.size || 0.8)),
        coordinates: generated.coordinates.map(c => Math.max(-1, Math.min(1, c))) as [number, number, number, number],
      });
      
      return newArchetype;
    } catch (error) {
      console.error('Error generating archetype from AI; using local deterministic studio creator:', error);
      return this.createLocalStudioArchetype(prompt);
    }
  }

  private createLocalStudioArchetype(prompt: string): Archetype {
    const lower = prompt.toLowerCase();
    const lang = this.translationService.getLanguage() === 'ru' ? 'ru' : 'en';
    const has = (...terms: string[]) => terms.some(t => lower.includes(t));
    const agency = has('control', 'контрол', 'force', 'push', 'давит') ? -0.75 : has('receive', 'allow', 'уступ', 'принима') ? 0.55 : 0;
    const temp = has('rage', 'anger', 'storm', 'гнев', 'ярост', 'бур') ? 0.8 : has('logic', 'cold', 'detach', 'логик', 'холод', 'исчез', 'отстран') ? -0.75 : 0;
    const focus = has('people', 'other', 'please', 'друг', 'угожд', 'спас') ? 0.65 : has('self', 'alone', 'себ', 'один') ? -0.45 : 0;
    const attachment = has('cling', 'abandon', 'anxious', 'брош', 'тревож', 'цепля') ? 0.8 : has('avoid', 'distance', 'disappear', 'избег', 'дистанц', 'исчез') ? -0.85 : 0;
    const coordinates: [number, number, number, number] = [agency, temp, focus, attachment];
    const cluster = this.inferStudioCluster(coordinates);
    const name = lang === 'ru' ? 'Студийная часть' : 'Studio Part';

    return {
      id: this.buildStudioArchetypeId(prompt),
      name,
      coordinates,
      color: this.colorForCluster(cluster),
      size: 0.72,
      symbol: '✦',
      cluster,
      description: lang === 'ru' ? `Локально созданная часть по описанию: ${prompt}` : `Locally generated part from: ${prompt}`,
      wound: lang === 'ru' ? 'Защитный паттерн, который просит быть увиденным без давления.' : 'A protective pattern asking to be seen without pressure.',
      shadow: lang === 'ru' ? 'Может усиливаться, когда система чувствует угрозу.' : 'May intensify when the system feels threatened.',
      invitation: lang === 'ru' ? 'Подойти к части с любопытством и дать ей безопасную роль.' : 'Approach the part with curiosity and give it a safer role.',
      coreBelief: lang === 'ru' ? 'Я защищаю систему от боли.' : 'I protect the system from pain.',
      attracts: lang === 'ru' ? 'Части с похожей раной и компенсирующие ресурсные части.' : 'Parts with a similar wound and compensating resource parts.',
    };
  }

  private inferStudioCluster([agency, temp, focus, attachment]: [number, number, number, number]): string {
    if (attachment < -0.45 && temp < -0.35) return 'avoidant_intellectual_shadows';
    if (attachment > 0.45 && focus > 0.2) return 'anxious_connection_shadows';
    if (Math.abs(attachment) > 0.55 && temp > 0.35) return 'disorganized_attachment_shadows';
    if (agency < -0.45 && temp < 0.2) return 'control_shadows';
    if (temp > 0.45) return 'emotional_storm_shadows';
    if (agency < -0.25 && attachment < -0.15) return 'seductive_avoidance_shadows';
    return 'gift_archetypes';
  }

  private colorForCluster(cluster: string): string {
    const colors: Record<string, string> = {
      gift_archetypes: '#4A90E2',
      control_shadows: '#6A040F',
      emotional_storm_shadows: '#E85D04',
      avoidant_intellectual_shadows: '#0077B6',
      anxious_connection_shadows: '#FFB703',
      seductive_avoidance_shadows: '#9D4EDD',
      disorganized_attachment_shadows: '#3A0CA3',
    };
    return colors[cluster] || '#4A90E2';
  }

  private buildStudioArchetypeId(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    const slug = seed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '').slice(0, 32);
    return `studio_${slug || Math.abs(hash).toString(36)}`;
  }

  /**
   * Routes analysis by the user's explicit `method` choice (the toggle in the
   * results-panel header). Both modes attempt the AI; the difference is the
   * scope of what the AI is asked to produce:
   *
   *   - `deterministic`  — local scoring algorithm computes the archetype
   *                        positions; AI is called to write the interpretation
   *                        prose based on those pre-computed positions.
   *   - `fallback`/legacy — AI is called to generate BOTH the positions and
   *                          the interpretation that follows from them.
   *
   * In either mode, if the AI call fails (network, timeout, empty/garbled
   * response), the local fallback narrative is used and
   * `narrativeDegraded: true` is set so the ResultsPanelComponent can surface
   * the degradation via the amber banner. The user's chosen mode is never
   * silently switched — the toggle is the explicit user choice, and the
   * auto-degradation is always visible, never hidden.
   */
  async analyzeAssessment(
    answers: number[],
    questions: { section: string, text: string }[],
    allArchetypes: Archetype[],
    method: 'deterministic' | 'fallback' | 'legacy' = 'deterministic',
    dimensionalExpressions?: DimensionalExpressions,
    options?: { signal?: AbortSignal }
  ): Promise<AssessmentAnalysis> {
    if (method === 'deterministic') {
      return this.analyzeAssessmentDeterministic(answers, questions, dimensionalExpressions, options);
    }

    // Antifragile: if legacy/fallback AI mode fails, return deterministic results instead of hard error.
    try {
      return await this.analyzeAssessmentLegacy(answers, questions, allArchetypes, options);
    } catch (error: any) {
      if (error?.cancelled) throw error; // propagate cancel, don't swallow with a fallback
      console.error('Legacy assessment analysis failed; falling back to deterministic mode:', error);
      return this.analyzeAssessmentDeterministic(answers, questions, dimensionalExpressions, options);
    }
  }

  /**
   * DETERMINISTIC: Generates archetype pantheon algorithmically from pole scores.
   * AI is used ONLY for the narrative analysis text.
   */
  private async analyzeAssessmentDeterministic(
    answers: number[],
    questions: { section: string, text: string }[],
    dimensionalExpressions?: DimensionalExpressions,
    options?: { signal?: AbortSignal }
  ): Promise<AssessmentAnalysis> {
    // Step 1: Generate deterministic pantheon from scoring engine
    const lang = this.translationService.getLanguage() === 'ru' ? 'ru' as const : 'en' as const;
    const { archetypes: scoredPantheon, dynamics } = generateArchetypes(answers, lang);
    const pantheon: GeneratedArchetype[] = scoredPantheon.map((sa, index) => ({
      name: sa.name,
      symbol: sa.symbol,
      color: PANTHEON_COLORS[index % PANTHEON_COLORS.length],
      coordinates: sa.coordinates,
      cluster: sa.cluster,
      prominence: sa.prominence,
      size: sa.size,
      description: sa.description,
      wound: sa.wound,
      shadow: sa.shadow,
      invitation: sa.invitation,
      coreBelief: sa.coreBelief,
      attracts: sa.attracts,
      partType: sa.partType,
      developmentalOrigin: sa.developmentalOrigin,
    }));

    // Step 2: Build context for AI narrative from deterministic results
    const pantheonContext = pantheon.map(a => lang === 'ru'
      ? `- **${a.name}** (${a.symbol}, ${a.cluster}, выраженность: ${a.prominence}%)\n  Рана: ${a.wound}\n  Тень: ${a.shadow}\n  Приглашение: ${a.invitation}`
      : `- **${a.name}** (${a.symbol}, ${a.cluster}, prominence: ${a.prominence}%)\n  Wound: ${a.wound}\n  Shadow: ${a.shadow}\n  Invitation: ${a.invitation}`
    ).join('\n');

    const dimsContext = dimensionalExpressions
      ? (lang === 'ru'
        ? `АГЕНТНОСТЬ: ${dimensionalExpressions.AGENCY.toFixed(2)}, ТЕМПЕРАМЕНТ: ${dimensionalExpressions.TEMPERATURE.toFixed(2)}, ФОКУС: ${dimensionalExpressions.FOCUS.toFixed(2)}, ПРИВЯЗАННОСТЬ: ${dimensionalExpressions.ATTACHMENT.toFixed(2)}`
        : `AGENCY: ${dimensionalExpressions.AGENCY.toFixed(2)}, TEMPERATURE: ${dimensionalExpressions.TEMPERATURE.toFixed(2)}, FOCUS: ${dimensionalExpressions.FOCUS.toFixed(2)}, ATTACHMENT: ${dimensionalExpressions.ATTACHMENT.toFixed(2)}`)
      : (lang === 'ru' ? 'Недоступно' : 'Not available');

    // Phase 4: Enrich with clinical-grade computed data
    const { computePoleScores: cp, detectComplexes: dc, computeDefenseHierarchy: ddh, computeTriggerMap: dtm, computeRegulationCapacity: drc, computeBoundaryStyle: dbs, computeNarrativeCoherence: dnc, computeDissociation: ddi } = await import('../app/core/data/scoring');
    const poles = cp(answers);

    // Map algorithm-computed pole scores (8 fields, 4 dimension pairs) to the
    // 4-field shape used by both the AI schema and the result panel display.
    // The sign convention matches the AI schema description: +1 = positive
    // (receptive/hot/other-focused/anxious), -1 = negative pole.
    const poleScores = {
      agency: this.clampSigned(poles.agencyReceptive, -1, 1, 0),
      emotional_temperature: this.clampSigned(poles.tempHot, -1, 1, 0),
      relational_focus: this.clampSigned(poles.focusOther, -1, 1, 0),
      attachment: this.clampSigned(poles.attAnxious, -1, 1, 0),
    };
    const complexes = dc(scoredPantheon, poles, lang);
    const defenseH = ddh(scoredPantheon, poles, lang);
    const triggers = dtm(scoredPantheon, poles, lang);
    const regulation = drc(answers, poles);
    const boundary = dbs(poles);
    const coherence = dnc(answers, poles);
    const dissociation = ddi(answers, poles);

    const clinicalContext = lang === 'ru' ? `
**КЛИНИЧЕСКИЕ ИНДИКАТОРЫ:**
- Склонность к диссоциации: ${dissociation.levelRu} (${(dissociation.score * 100).toFixed(0)}%)
- Эмоциональная регуляция: ${regulation.dysregulationPatternRu} (окно толерантности: ${(regulation.windowOfTolerance * 100).toFixed(0)}%)
- Стиль границ: ${boundary.styleRu} (${(boundary.score * 100).toFixed(0)}%)
- Нарративная связность: ${coherence.levelRu} (${(coherence.score * 100).toFixed(0)}%)

**АКТИВНЫЕ КОМПЛЕКСЫ:**
${complexes.length > 0 ? complexes.map(c => `- **${c.nameRu}** (тяжесть: ${(c.severity * 100).toFixed(0)}%): ${c.coreWoundRu}`).join('\n') : 'Значимые комплексы не обнаружены.'}

**ИЕРАРХИЯ ЗАЩИТ:**
${defenseH.layers.map(l => `- Уровень ${l.level} (${l.labelRu}): ${l.parts.join(', ')}`).join('\n')}
${defenseH.escalationPaths.length > 0 ? defenseH.escalationPaths.map(p => `- Эскалация: ${p.from} → ${p.to}`).join('\n') : ''}

**КАРТА ТРИГГЕРОВ:**
${triggers.length > 0 ? triggers.slice(0, 4).map(t => `- **${t.partName}** (${t.partType}): триггеры — ${t.triggerSituationsRu.join('; ')}`).join('\n') : 'Конкретные триггеры не сопоставлены.'}
` : `
**CLINICAL INDICATORS:**
- Dissociation tendency: ${dissociation.level} (${(dissociation.score * 100).toFixed(0)}%)
- Emotional regulation: ${regulation.dysregulationPattern} (window of tolerance: ${(regulation.windowOfTolerance * 100).toFixed(0)}%)
- Boundary style: ${boundary.style} (${(boundary.score * 100).toFixed(0)}%)
- Narrative coherence: ${coherence.level} (${(coherence.score * 100).toFixed(0)}%)

**ACTIVE COMPLEXES:**
${complexes.length > 0 ? complexes.map(c => `- **${c.name}** (severity: ${(c.severity * 100).toFixed(0)}%): ${c.coreWound}`).join('\n') : 'No significant complexes detected.'}

**DEFENSE HIERARCHY:**
${defenseH.layers.map(l => `- Layer ${l.level} (${l.label}): ${l.parts.join(', ')}`).join('\n')}
${defenseH.escalationPaths.length > 0 ? defenseH.escalationPaths.map(p => `- Escalation: ${p.from} → ${p.to}`).join('\n') : ''}

**TRIGGER MAP:**
${triggers.length > 0 ? triggers.slice(0, 4).map(t => `- **${t.partName}** (${t.partType}): triggered by ${t.triggerSituations.join('; ')}`).join('\n') : 'No specific triggers mapped.'}
`;

    const currentLang = lang === 'ru' ? 'Russian' : 'English';
    const headings = lang === 'ru'
      ? { title: '## Ваш Реляционный Отпечаток', core: '### Основная Динамика', gifts: '### Ваши Дары', growth: '### Области для Роста', clinical: '### Клиническая Перспектива' }
      : { title: '## Your Relational Fingerprint', core: '### The Core Dynamic', gifts: '### Your Gifts', growth: '### Areas for Growth', clinical: '### Clinical Perspective' };
    const dynamicsContext = dynamics.length > 0
      ? dynamics.map(d => `- ${d.description}`).join('\n')
      : (lang === 'ru' ? 'Защитные динамики не обнаружены.' : 'No protective dynamics detected.');
    const prompt = lang === 'ru'
      ? 'Напишите анализ реляционного отпечатка пользователя на основе заранее рассчитанных архетипов.'
      : 'Write the relational fingerprint analysis for this user based on their pre-calculated archetypes.';

    const systemInstruction = this.translationService.t('analystSystemInstruction', 'universe') + `

**LANGUAGE:** You MUST respond in ${currentLang}.

**YOUR TASK:**
The user's archetypes have been pre-calculated algorithmically. Your ONLY job is to write a compassionate, insightful Markdown analysis of their relational patterns based on these results. You are writing for a specialist audience (therapists, psychologists) but in accessible language.

**USER'S DIMENSIONAL POSITION:**
${dimsContext}

**USER'S MATCHED ARCHETYPES:**
${pantheonContext}

**INNER SYSTEM DYNAMICS:**
${dynamicsContext}

${clinicalContext}

**FORMAT:**
- Start with "${headings.title}"
- Use headings for sections: "${headings.core}", "${headings.gifts}", "${headings.growth}", "${headings.clinical}"
- The clinical section should integrate the complexes, defense hierarchy, triggers, regulation capacity, boundary style, and coherence into a holistic clinical perspective
- Use bullet points and bold text
- Be wise, compassionate, and empowering
- Do NOT just list the archetypes — weave them into a holistic narrative
- Reference specific clinical patterns by name when they appear (complexes, defense layers, dysregulation patterns)

Return a JSON object with a single key "analysis" containing the Markdown string.`;

    try {
      const text = await this.callAI({
        prompt,
        systemInstruction,
        responseSchema: ANALYSIS_ONLY_SCHEMA
      }, { signal: options?.signal });

      let analysis = '';
      if (text) {
        try {
          const parsed = JSON.parse(text);
          analysis = parsed.analysis || '';
        } catch {
          // AI might return raw markdown without JSON wrapper
          analysis = text;
        }
      }

      // Fallback analysis if AI fails
      if (!analysis) {
        analysis = this.buildDeterministicFallbackAnalysis(pantheon, lang, true);
        return { analysis, pantheon, dynamics, poleScores, narrativeDegraded: true };
      }

      return { analysis, pantheon, dynamics, poleScores, narrativeDegraded: false };
    } catch (error: any) {
      // Caller cancelled — propagate, do not fall back silently. The UI will
      // see the same cancelled state and the user can choose to retry.
      if (error?.cancelled) throw error;
      console.error('Error in deterministic analysis narrative:', error);
      // Return deterministic pantheon with fallback analysis even if AI fails
      const analysis = this.buildDeterministicFallbackAnalysis(pantheon, lang, false);
      return { analysis, pantheon, dynamics, poleScores, narrativeDegraded: true };
    }
  }

  private buildDeterministicFallbackAnalysis(
    pantheon: GeneratedArchetype[],
    lang: 'en' | 'ru',
    includeProminence: boolean
  ): string {
    const primary = pantheon[0];
    if (lang === 'ru') {
      const prominence = includeProminence ? ` с выраженностью ${primary?.prominence || 0}%` : '';
      return `## Ваш реляционный отпечаток\n\nВаш профиль опирается на **${primary?.name || 'основной паттерн'}**${prominence}.\n\n### Основная динамика\n\n${pantheon.map(a => `- **${a.name}** (${a.prominence}%): ${a.wound}`).join('\n')}`;
    }

    const prominence = includeProminence ? ` at ${primary?.prominence || 0}% prominence` : '';
    return `## Your Relational Fingerprint\n\nYour profile is anchored by **${primary?.name || 'a core pattern'}**${prominence}.\n\n### The Core Dynamic\n\n${pantheon.map(a => `- **${a.name}** (${a.prominence}%): ${a.wound}`).join('\n')}`;
  }

  /**
   * Clamp a number to [-1, 1] by default; or to a custom [min, max] range.
   * Replaces NaN/null/undefined with `fallback` (default 0).
   */
  private clampSigned(v: unknown, min = -1, max = 1, fallback = 0): number {
    const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
    return Math.max(min, Math.min(max, n));
  }

  /**
   * Snap an arbitrary cluster name to the closest valid 7-value cluster.
   * The AI is told to use the enum strictly, but some models return
   * "personal_pantheon", empty string, or other free-form values. This is
   * the safety net that keeps the rest of the system from breaking.
   */
  private snapCluster(raw: string | undefined | null): string {
    if (!raw) return 'gift_archetypes';
    const cleaned = String(raw).toLowerCase().trim();
    if ((VALID_CLUSTERS as readonly string[]).includes(cleaned)) return cleaned;
    // Common mis-spellings / alternates — map to the nearest valid cluster.
    const aliases: Record<string, string> = {
      'personal_pantheon': 'gift_archetypes',
      'gift': 'gift_archetypes',
      'gifts': 'gift_archetypes',
      'gift_archetype': 'gift_archetypes',
      'control_shadow': 'control_shadows',
      'control': 'control_shadows',
      'power': 'control_shadows',
      'storm': 'emotional_storm_shadows',
      'emotional_storm': 'emotional_storm_shadows',
      'fire_storm': 'emotional_storm_shadows',
      'avoidant': 'avoidant_intellectual_shadows',
      'avoidant_intellectual': 'avoidant_intellectual_shadows',
      'intellectual': 'avoidant_intellectual_shadows',
      'anxious': 'anxious_connection_shadows',
      'anxious_connection': 'anxious_connection_shadows',
      'connection': 'anxious_connection_shadows',
      'seductive': 'seductive_avoidance_shadows',
      'seductive_avoidance': 'seductive_avoidance_shadows',
      'disorganized': 'disorganized_attachment_shadows',
      'disorganized_attachment': 'disorganized_attachment_shadows',
    };
    return aliases[cleaned] ?? 'gift_archetypes';
  }

  /**
   * Renormalise archetypes' `prominence` values so they sum to exactly 100.
   * Preserves relative ratios. Used by the legacy (AI-first) path because
   * the AI is told to make the sum 100 but models occasionally drift.
   */
  private renormalizeProminences(archetypes: GeneratedArchetype[]): void {
    if (!archetypes.length) return;
    const total = archetypes.reduce((s, a) => s + (typeof a.prominence === 'number' ? a.prominence : 0), 0);
    if (total <= 0) {
      // Degenerate case: distribute evenly.
      const each = Math.round(100 / archetypes.length);
      archetypes.forEach((a, i) => {
        a.prominence = i === archetypes.length - 1 ? 100 - each * (archetypes.length - 1) : each;
      });
      return;
    }
    const scale = 100 / total;
    let running = 0;
    archetypes.forEach((a, i) => {
      const current = typeof a.prominence === 'number' ? a.prominence : 0;
      if (i === archetypes.length - 1) {
        // Make the last entry absorb the rounding error so the sum is exactly 100.
        a.prominence = Math.round(100 - running);
      } else {
        const scaled = Math.round(current * scale);
        a.prominence = scaled;
        running += scaled;
      }
    });
  }

  /**
   * LEGACY (AI-first / "Creative" mode): the AI is the single source of truth
   * for both positioning and prose. The system instruction is XML-structured
   * (SystemOverride → InputSpecification → ReportStructure → LanguageRules →
   * AbsoluteBlacklist → ValidationSuite → OutputFormat) so the model receives
   * the brief as a human-readable spec rather than a wall of prose.
   *
   * Two design choices, deliberate:
   *  1. The AI estimates the user's pole scores itself from the 64 answers
   *     rather than being handed algorithm-computed values. This keeps the
   *     legacy path self-contained and avoids confusing the model with two
   *     competing sources of truth.
   *  2. The response schema is strict: cluster is a 7-value enum, coordinates
   *     and prominence have hard min/max, and poleScores are required. The
   *     schema does the heavy lifting that the old free-form prompt left to
   *     the model's good behaviour.
   */
  private async analyzeAssessmentLegacy(
    answers: number[],
    questions: { section: string, text: string }[],
    allArchetypes: Archetype[],
    options?: { signal?: AbortSignal }
  ): Promise<AssessmentAnalysis> {
    const allArchetypesInfo = allArchetypes.map(a => `- ${a.name}`).join('\n');
    const questionsAndAnswers = questions.map((q, i) => {
      const sectionTitle = this.translationService.t('title', q.section);
      const questionText = this.translationService.t(q.text, q.section);
      return `${i + 1}. [Section: ${sectionTitle}] ${questionText}\n   Answer: ${answers[i]}`;
    }).join('\n');

    const isRu = this.translationService.getLanguage() === 'ru';

    // Localized 8-section titles + body instructions, sourced from
    // translations.ts (section 'aiReport'). The AI follows the example
    // structure, so these must be in the user's language — otherwise the
    // report comes back with hardcoded English headers (the bug the user
    // reported in session 2).
    const t = (key: string) => this.translationService.t(key, 'aiReport');
    const reportSections = {
      section1Title: t('section1Title'),
      section1Body: t('section1Body'),
      section2Title: t('section2Title'),
      section2Body: t('section2Body'),
      section3Title: t('section3Title'),
      section3_1Title: t('section3_1Title'),
      section3_2Title: t('section3_2Title'),
      section3_3Title: t('section3_3Title'),
      section4Title: t('section4Title'),
      section4Body: t('section4Body'),
      section5Title: t('section5Title'),
      section5Body: t('section5Body'),
      section6Title: t('section6Title'),
      section6Body: t('section6Body'),
      section7Title: t('section7Title'),
      section7Body: t('section7Body'),
      section8Title: t('section8Title'),
      section8Body: t('section8Body'),
    };
    const currentLang = isRu ? 'Russian' : 'English';
    const youForm = isRu ? 'вы' : 'you';

    const systemInstruction = `<?xml version="1.0" encoding="UTF-8"?>
<AnalystBrief version="2.0" language="${currentLang}">

  <!-- =================================================================== -->
  <!-- 0. SYSTEM OVERRIDE — voice and perspective                          -->
  <!-- =================================================================== -->
  <SystemOverride priority="absolute">
    You are a highly skilled psychological assessor. You speak like a perceptive, straight-talking human being — calm, respectful, direct, never clinical or cold. You address the reader as "${youForm}". You never use words like "subject", "patient", "case"${isRu ? ', "индивид", "субъект", "обследуемый"' : ''}. You avoid flattery, therapist clichés, and poetic vagueness. You cover everything: dimensional profile, all significant archetypal patterns, clinical indicators, defence mechanisms, core complexes, contradictions, and resources. You do this in a clean, organised format with numbered sections and sub-sections, but every sentence is written to be understood by a normal person.
  </SystemOverride>

  <!-- =================================================================== -->
  <!-- 1. INPUT DATA — what you receive and must use                        -->
  <!-- =================================================================== -->
  <InputSpecification>

    <UserAnswers>
      The user answered 64 questions on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree). Treat the answers as the sole evidence base.
      ---
      ${questionsAndAnswers}
      ---
    </UserAnswers>

    <PoleScoreEstimation critical="true">
      Before you position any archetype or write any prose, you MUST estimate the user's pole scores on each of the four dimensions. The values are continuous, in [-1.0, +1.0], and are derived from the answer pattern (not from any pre-computed algorithm). The four dimensions are:

      • AGENCY  — −1.0 = Hyper-Active (initiates, controls, drives); +1.0 = Hyper-Receptive (allows, follows, yields)
      • TEMPERATURE — −1.0 = Hyper-Cool (logical, contained, analytical); +1.0 = Hyper-Hot (passionate, reactive, vivid)
      • FOCUS  — −1.0 = Hyper-Self (autonomous, self-referenced); +1.0 = Hyper-Other (caretaking, attuned)
      • ATTACHMENT — −1.0 = Hyper-Avoidant (fears engulfment, needs space); +1.0 = Hyper-Anxious (fears abandonment, needs reassurance)

      Put your estimated scores in the top-level "poleScores" object. They will be used to position archetypes AND to render the dimensional display.
    </PoleScoreEstimation>

    <ArchetypeLibrary>
      A list of existing archetypes in the universe. Do not duplicate or near-duplicate any of them.
      ---
      ${allArchetypesInfo}
      ---
    </ArchetypeLibrary>

    <ClinicalIndicators critical="true">
      You will be asked to weave the following clinical indicators into the report (Section 3):
      • dissociation tendency (how much the person can disconnect from emotional experience)
      • emotional regulation (the width of the window of tolerance between "fine" and "drowning")
      • boundary integrity (capacity to maintain self-other distinction)
      • narrative coherence (how integrated the self-story is)
      • defence hierarchy (primary and secondary defence styles)
      • core complexes (specific relational templates that organise experience)
      Compute these implicitly from the pole pattern and the answer profile. Do not invent numerical scores; describe them in plain language with concrete examples.
    </ClinicalIndicators>
  </InputSpecification>

  <!-- =================================================================== -->
  <!-- 2. REPORT STRUCTURE — 8 numbered sections                           -->
  <!-- =================================================================== -->
  <ReportStructure>
    <Section id="1" title="${reportSections.section1Title}">
      ${reportSections.section1Body}
    </Section>
    <Section id="2" title="${reportSections.section2Title}">
      ${reportSections.section2Body}
    </Section>
    <Section id="3" title="${reportSections.section3Title}">
      <SubSection id="3.1" title="${reportSections.section3_1Title}"/>
      <SubSection id="3.2" title="${reportSections.section3_2Title}"/>
      <SubSection id="3.3" title="${reportSections.section3_3Title}"/>
    </Section>
    <Section id="4" title="${reportSections.section4Title}">
      ${reportSections.section4Body}
    </Section>
    <Section id="5" title="${reportSections.section5Title}">
      ${reportSections.section5Body}
    </Section>
    <Section id="6" title="${reportSections.section6Title}">
      ${reportSections.section6Body}
    </Section>
    <Section id="7" title="${reportSections.section7Title}">
      ${reportSections.section7Body}
    </Section>
    <Section id="8" title="${reportSections.section8Title}">
      ${reportSections.section8Body}
    </Section>
  </ReportStructure>

  <!-- =================================================================== -->
  <!-- 3. LANGUAGE RULES — voice, tone, no clinical distance                -->
  <!-- =================================================================== -->
  <LanguageRules>
    <Rule id="use_you">Always address the reader as "${youForm}". Never "subject", "patient", "case"${isRu ? ', "индивид", "субъект", "обследуемый"' : ''}. This is a conversation with a living person.</Rule>
    <Rule id="plain_language">Use everyday, precise words. "Pattern" is fine but balance it with "model", "tendency", "way of doing things". "Dissociation" is fine but translate: "switching off from feelings". "Regulation" → "ability to handle emotions". "Narrative coherence" → "how whole your self-story feels".</Rule>
    <Rule id="no_clinical_distance">The text should sound like an explanation, not a chart note from a clinician studying a specimen.</Rule>
    <Rule id="concrete_examples">Every abstract claim must be backed by a domestic example: "This looks like: when your partner is late from work, you start texting them every 15 minutes because silence is unbearable for you."</Rule>
    <Rule id="no_flattery">No praise, no "gift", no "rare quality", no "remarkable depth".</Rule>
    <Rule id="no_reframing">No "this is not X, it is Y". If something causes pain, say so.</Rule>
    <Rule id="no_self_help">No "allow yourself", "your journey", "first step".</Rule>
    <Rule id="no_personal_remarks">No "honestly, I'm the same way". You are a professional, not a buddy.</Rule>
    <Rule id="precision_without_jargon">Use psychological terms when they precisely describe a phenomenon, but translate them immediately. Example: "This is called reactive formation: your fear of being abandoned turns into attack — you start criticising your partner when you actually just need warmth."</Rule>
  </LanguageRules>

  <!-- =================================================================== -->
  <!-- 4. ABSOLUTE BLACKLIST — forbidden patterns                           -->
  <!-- =================================================================== -->
  <AbsoluteBlacklist>
    <Category name="reframing">"not X, but Y", "what you call X is actually Y"</Category>
    <Category name="capitalized_archetypes">No capitalised proper-noun names for inner parts. Only lowercase descriptive phrases.</Category>
    <Category name="pseudo_precision">No invented scores, percentages, phases, or steps.</Category>
    <Category name="flattery">No "you are exceptional", "rare gift", "remarkable depth".</Category>
    <Category name="we">No inclusive "we".</Category>
    <Category name="self_help">No "journey", "transformation", "healing", "allow yourself".</Category>
    <Category name="therapeutic_jargon">Exclude "contain", "space", "somatic" (except in direct medical context), "validate".</Category>
    <Category name="coaching_endings">No calls to action, no "try this in the coming days".</Category>
    <Category name="template_injection">No verbatim quotes from the engine's template pools.</Category>
    <Category name="teaching">No lectures "in psychology this is called…".</Category>
    <Category name="clinical_distance">Words like "subject", "patient", "case"${isRu ? ', "индивид", "субъект"' : ''} are completely forbidden.</Category>
  </AbsoluteBlacklist>

  <!-- =================================================================== -->
  <!-- 5. VALIDATION SUITE — checks to run before returning                -->
  <!-- =================================================================== -->
  <ValidationSuite>
    <Test id="you_check">All addresses to the reader are "${youForm}". No "subject" or "case" or "${isRu ? 'индивид' : 'individual'}".</Test>
    <Test id="section_completeness">All 8 sections present and substantive.</Test>
    <Test id="archetype_coverage">Every significant pattern (top archetypes) is described.</Test>
    <Test id="clinical_coverage">All indicators (dissociation, regulation, boundaries, coherence) are unfolded in Section 3.</Test>
    <Test id="defence_coverage">Primary and secondary defences named and illustrated in Section 4.</Test>
    <Test id="complex_coverage">Each complex explained and connected to patterns in Section 5.</Test>
    <Test id="conflict_coverage">At least two main contradictions unpacked in Section 6.</Test>
    <Test id="example_per_pattern">Every behavioural pattern has at least one domestic example.</Test>
    <Test id="no_jargon_without_translation">All specialised terms are immediately explained in plain language.</Test>
    <Test id="tone_warmth">The text does not sound like a cold medical chart. It feels like a direct, respectful address to a person.</Test>
    <Test id="blacklist_scan">No forbidden constructions or words.</Test>
    <Test id="barnum_check">Every general phrase is tied to specific values from the profile.</Test>
  </ValidationSuite>

  <!-- =================================================================== -->
  <!-- 6. POSITIONING RULES — how to place archetypes                       -->
  <!-- =================================================================== -->
  <PositioningRules>
    <Rule>Generate 4–8 archetypes (gift + shadow). Do not exceed 8.</Rule>
    <Rule>For each archetype, choose a 'cluster' from EXACTLY this 7-value enum: 'gift_archetypes', 'control_shadows', 'emotional_storm_shadows', 'avoidant_intellectual_shadows', 'anxious_connection_shadows', 'seductive_avoidance_shadows', 'disorganized_attachment_shadows'. Do NOT invent new cluster names.</Rule>
    <Rule>Each archetype's 'coordinates' is a 4-element array [AGENCY, TEMPERATURE, FOCUS, ATTACHMENT]. Each value MUST be in [-1.0, 1.0]. Use the user's estimated pole scores as the anchor — the primary archetype(s) should sit close to (agency, temp, focus, attachment).</Rule>
    <Rule>Sum of all 'prominence' values MUST equal exactly 100. Renormalise before returning if needed.</Rule>
    <Rule>Each archetype's 'size' is in [0.4, 1.1].</Rule>
    <Rule>Address the reader as "${youForm}" in 'name' translations${isRu ? ' (translate archetype names into Russian; do not leave them in English)' : ''}.</Rule>
  </PositioningRules>

  <!-- =================================================================== -->
  <!-- 7. OUTPUT FORMAT                                                    -->
  <!-- =================================================================== -->
  <OutputFormat>
    Return a single JSON object with three required top-level keys:
      • "analysis" — the full 8-section report in plain prose. USE markdown headings so the report renders with proper visual hierarchy: '## ${reportSections.section1Title}' for top-level sections, '### 3.1 ${reportSections.section3_1Title}' for sub-sections. NO bold, NO italics, NO emoji, NO inline formatting. Begin directly with section 1, end with section 8. No additional sign-offs.
      • "poleScores" — { agency, emotional_temperature, relational_focus, attachment }, each in [-1, 1]. Your calibrated estimate.
      • "pantheon" — array of 4–8 archetypes per the positioning rules above.
    Produce a valid JSON object that strictly adheres to the provided schema.
  </OutputFormat>

  <!-- =================================================================== -->
  <!-- 8. LANGUAGE — final reminder                                         -->
  <!-- =================================================================== -->
  <Language>
    Generate the ENTIRE response (analysis text + ALL JSON string values: 'name', 'description', 'wound', 'shadow', 'invitation', 'coreBelief', 'attracts') strictly in ${currentLang}. Do NOT leave the archetype 'name' in English. Translate proper nouns and titles into ${currentLang}.
  </Language>

</AnalystBrief>`;

    try {
      const text = await this.callAI({
        prompt: "Analyze the provided assessment data: estimate pole scores, position a pantheon, and write the structured 8-section report.",
        systemInstruction,
        responseSchema: ASSESSMENT_ANALYSIS_SCHEMA
      }, { signal: options?.signal });

      if (!text) {
        throw new Error(this.translationService.t('analystEmptyResponse', 'universe', 'The AI analyst returned an empty response.'));
      }

      const result = JSON.parse(text) as AssessmentAnalysis;
      if (!result.analysis || !Array.isArray(result.pantheon) || !result.poleScores) {
        throw new Error("Invalid structure in AI response: missing analysis, pantheon, or poleScores.");
      }

      // Sanitise poleScores — clamp to [-1, 1] and default missing values to 0.
      const ps = result.poleScores;
      ps.agency = this.clampSigned(ps.agency);
      ps.emotional_temperature = this.clampSigned(ps.emotional_temperature);
      ps.relational_focus = this.clampSigned(ps.relational_focus);
      ps.attachment = this.clampSigned(ps.attachment);

      // Sanitise pantheon.
      result.pantheon.forEach((archetype, i) => {
        if (!archetype.name || !archetype.coordinates || !Array.isArray(archetype.coordinates) || archetype.coordinates.length !== 4) {
          throw new Error(`Invalid archetype at index ${i}: missing name or coordinates`);
        }
        archetype.coordinates = archetype.coordinates.map((c: number) => this.clampSigned(c)) as [number, number, number, number];
        archetype.invitation = archetype.invitation || this.translationService.t('fallbackPath', 'universe', 'To discover your path');
        archetype.coreBelief = archetype.coreBelief || this.translationService.t('unknownValue', 'universe', 'Unknown');
        archetype.attracts = archetype.attracts || this.translationService.t('unknownValue', 'universe', 'Unknown');
        // Snap cluster to nearest valid value if AI returned an unknown one.
        archetype.cluster = this.snapCluster(archetype.cluster);
        archetype.size = this.clampSigned(archetype.size ?? 0.8, 0.4, 1.1);
        archetype.wound = archetype.wound || '';
        archetype.shadow = archetype.shadow || '';
        archetype.prominence = typeof archetype.prominence === 'number' ? this.clampSigned(archetype.prominence, 0, 100) : 50;
      });

      // Renormalise prominences so they sum to exactly 100.
      this.renormalizeProminences(result.pantheon);

      return result;
    } catch (error) {
      console.error('Error generating assessment analysis from AI:', error);
      throw error;
    }
  }

  async generateCoachResponse(
    chatHistory: ChatMessage[],
    archetype1: Archetype | null,
    archetype2: Archetype | null,
    allArchetypes: Archetype[],
    mode: 'general' | 'parts' = 'general',
  ): Promise<CoachResponse> {
    let context = "";
    let systemInstruction = "";

    if (archetype1) {
      context += `The user is currently exploring the following archetype:\n\n`;
      context += this.formatArchetypeDetails(archetype1);

      if (archetype2) {
        context += `\nThey are comparing it with this second archetype:\n\n`;
        context += this.formatArchetypeDetails(archetype2);
      }
      systemInstruction = this.translationService.t('coachSystemInstruction', 'universe') + `
**LANGUAGE:** You MUST respond in ${this.translationService.getLanguage() === 'ru' ? 'Russian' : 'English'}.

The user has been provided with the context of the archetype(s) they are currently viewing.

CRITICAL INSTRUCTIONS:
1. Your response MUST focus exclusively on the provided archetype(s) and the user's conversational history. DO NOT explain the 4D universe, its dimensions (Agency, Temperature, etc.), or the model itself. The user already understands this.
2. Provide concrete, actionable tips and reflections related to the archetype's patterns. Focus on the core challenges and provide practical advice for their "invitation for growth."
3. Dive right into the insight. Use Markdown for formatting (bolding, lists).
4. You MUST return a JSON object that includes both your main 'response' and an array of 2-3 short, distinct, and insightful 'suggestions' for follow-up questions.`;

    } else {
      const allArchetypesInfo = allArchetypes.map(a => `- ${a.name} (Cluster: ${a.cluster})`).join('\n');
      context = `The user is asking a general question about the Archetypal Relational Universe. Here is a list of all archetypal concepts available in the universe that you can reference to answer the user's question:\n---\n${allArchetypesInfo}\n---`;
      
      systemInstruction = this.translationService.t('coachSystemInstruction', 'universe') + `
**LANGUAGE:** You MUST respond in ${this.translationService.getLanguage() === 'ru' ? 'Russian' : 'English'}.

CRITICAL INSTRUCTIONS:
1. Your primary goal is to answer the user's question directly and concisely, using the provided data and chat history.
2. If the user asks about a specific archetype by name, find it in the provided archetype data and give a focused description.
3. Be direct. Get straight to the heart of their question. Do not give a long, introductory lecture about the entire universe model unless they ask for an overview.
4. Use Markdown for formatting.
5. You MUST return a JSON object that includes both your main 'response' and an array of 2-3 short, distinct, and insightful 'suggestions' for follow-up questions.`;
    }
    
    const fullSystemInstruction = `${systemInstruction}\n\n[CONTEXT FOR YOUR RESPONSE]:\n${context}`;

    // Parts Dialogue persona: prepend an IFS-aware overlay that turns the
    // coach into a parts-focused listener. Only the systemInstruction gets
    // extended — the user's chat history and the response schema are
    // untouched, so the conversation flow stays the same.
    const personaInstruction = mode === 'parts'
      ? `${this.translationService.t('partsModeSystemInstruction', 'universe')}\n\n`
      : '';

    // Filter to only valid API roles ('user'/'model') and exclude synthetic welcome message
    const validHistory = chatHistory
      .filter(m => m.role === 'user' || m.role === 'model')
      // The first message is the synthetic welcome; never send it as real model history
      .filter((_, idx) => !(idx === 0 && chatHistory[0]?.role === 'model'));
    const lastUserMessage = validHistory[validHistory.length - 1];
    const historyWithoutLast = validHistory.slice(0, -1);

    try {
      const text = await this.callAI({
        prompt: lastUserMessage?.content || '',
        systemInstruction: personaInstruction + fullSystemInstruction,
        responseSchema: COACH_RESPONSE_SCHEMA,
        history: historyWithoutLast.map(m => ({ role: m.role as 'user' | 'model', content: m.content }))
      });

      if (!text) {
        return {
          response: this.translationService.t('coachError', 'universe', 'Sorry, I encountered an issue. {error}')
            .replace('{error}', this.translationService.t('coachEmptyResponse', 'universe', 'Empty response from AI')),
          suggestions: []
        };
      }

      return JSON.parse(text) as CoachResponse;
    } catch (error) {
      console.error('Error generating content from AI:', error);
      return {
        response: this.translationService.t('coachError', 'universe', 'Sorry, I encountered an issue. {error}')
          .replace('{error}', error instanceof Error ? error.message : this.translationService.t('coachUnknownError', 'universe', 'Unknown error')),
        suggestions: []
      };
    }
  }

  private formatArchetypeDetails(archetype: Archetype): string {
    const getField = (field: keyof Archetype) => this.translationService.getArchetypeField(archetype.id, field, archetype[field] as string);
    let details = `**${this.translationService.t('name', 'universe.archetypeDetails')}:** ${getField('name')} (${archetype.symbol})\n`;
    if (archetype.wound) {
      details += `**${this.translationService.t('wound', 'universe.archetypeDetails')}:** ${getField('wound')}\n`;
      details += `**${this.translationService.t('shadow', 'universe.archetypeDetails')}:** ${getField('shadow')}\n`;
      details += `**${this.translationService.t('invitation', 'universe.archetypeDetails')}:** ${getField('invitation')}\n`;
    } else {
      details += `**${this.translationService.t('description', 'universe.archetypeDetails')}:** ${getField('description')}\n`;
      details += `**${this.translationService.t('quality', 'universe.archetypeDetails')}:** ${getField('quality')}\n`;
      details += `**${this.translationService.t('invitation', 'universe.archetypeDetails')}:** ${getField('invitation')}\n`;
    }
    details += `**${this.translationService.t('coreBelief', 'universe.archetypeDetails')}:** "${getField('coreBelief')}"\n`;
    details += `**${this.translationService.t('attracts', 'universe.archetypeDetails')}:** ${getField('attracts')}\n`;
    if (archetype.integratedForm) {
        details += `**${this.translationService.t('integratedForm', 'universe.archetypeDetails')}:** ${getField('integratedForm')}\n`;
    }
    return details;
  }

  async generatePartsDialogue(
    chatHistory: ChatMessage[],
    currentPart: { name: string; partType?: string; wound?: string; coreBelief?: string; description?: string } | null,
    allParts: { name: string; partType?: string; description?: string; wound?: string }[],
  ): Promise<CoachResponse> {
    const lang = this.translationService.getLanguage() === 'ru' ? 'Russian' : 'English';

    const systemInstruction = `You are an IFS (Internal Family Systems) informed therapist guiding a parts dialogue.

**LANGUAGE:** You MUST respond in ${lang}.

**CURRENT PART:** ${currentPart ? `${currentPart.name} (${currentPart.partType || 'unknown'}) — Wound: ${currentPart.wound || 'N/A'} — Core Belief: ${currentPart.coreBelief || 'N/A'}` : 'None selected'}

**ALL PARTS IN THE SYSTEM:**
${allParts.map(p => `- ${p.name} [${p.partType || 'unknown'}]: ${p.description || p.wound || 'No description'}`).join('\n')}

**IFS DIALOGUE RULES:**
1. If the user is speaking TO a part, help them address it directly with curiosity and compassion
2. If the user is speaking FROM a part, help them notice "I am noticing a part of me that..."
3. Guide toward Self-energy: the 8 C's (Curiosity, Compassion, Calm, Confidence, Courage, Clarity, Creativity, Connectedness)
4. Never pathologize any part — all parts have good intentions
5. Help identify what the part is protecting
6. Suggest "asking the part" questions: "What are you afraid would happen if you stopped?" "How long have you been doing this job?" "What do you need from me?"

Return JSON with 'response' and 'suggestions'.`;

    const validHistory = chatHistory
      .filter(m => m.role === 'user' || m.role === 'model')
      .filter((_, idx) => !(idx === 0 && chatHistory[0]?.role === 'model'));
    const lastUserMessage = validHistory[validHistory.length - 1];
    const historyWithoutLast = validHistory.slice(0, -1);

    try {
      const text = await this.callAI({
        prompt: lastUserMessage?.content || 'Help me understand my parts.',
        systemInstruction,
        responseSchema: COACH_RESPONSE_SCHEMA,
        history: historyWithoutLast.map(m => ({ role: m.role as 'user' | 'model', content: m.content })),
      });

      if (!text) {
        return {
          response: this.translationService.t('coachError', 'universe', 'Sorry, I encountered an issue. {error}')
            .replace('{error}', this.translationService.t('partsEmptyResponse', 'universe', 'The parts dialogue returned an empty response. Please try again.')),
          suggestions: []
        };
      }

      return JSON.parse(text) as CoachResponse;
    } catch (error) {
      console.error('Error in parts dialogue:', error);
      return {
        response: this.translationService.t('coachError', 'universe', 'Sorry, I encountered an issue. {error}')
          .replace('{error}', error instanceof Error ? error.message : this.translationService.t('partsUnknownError', 'universe', 'Unknown error')),
        suggestions: []
      };
    }
  }

  async generateSynastryNarrative(reportData: string): Promise<string> {
    const lang = this.translationService.getLanguage() === 'ru' ? 'Russian' : 'English';

    const systemInstruction = `You are a compassionate relational therapist and clinical specialist writing a synastry narrative for two partners.
**LANGUAGE:** You MUST respond in ${lang}.

Using the synastry data below, write a 3-4 paragraph narrative that:
1. Describes the overall quality of this relational dynamic in warm, human language
2. Identifies the key unconscious contracts, shared complexes, or complementary complexes at play
3. Highlights the cross-person trigger dynamics and how each partner's protective patterns interact
4. Addresses the boundary interaction pattern and its clinical implications
5. Ends with a specific, data-informed growth edge and an encouraging note about what's possible

Reference specific clinical patterns when they appear in the data: complexes by name, defense layers, dysregulation patterns, boundary styles.
Use Markdown for emphasis. Be specific to the data provided — not generic.`;

    try {
      const text = await this.callAI({
        prompt: `Here is the synastry data:\n\n${reportData}\n\nWrite the clinical-grade narrative.`,
        systemInstruction,
        responseSchema: { type: 'OBJECT', properties: { narrative: { type: 'STRING' } }, required: ['narrative'] },
      });

      if (!text) return '';
      const parsed = JSON.parse(text);
      return parsed.narrative || '';
    } catch (error) {
      console.error('Error generating synastry narrative:', error);
      return '';
    }
  }
}
