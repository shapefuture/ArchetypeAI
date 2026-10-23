import { Injectable, inject } from '@angular/core';
import type { Archetype, DimensionalExpressions } from '../../../services/universe-state.service';
import { TranslationService } from '../../../services/translation.service';
import { generateArchetypes } from '../../../shared/core/data/scoring';
import {
  AIRequest,
  AssessmentAnalysis,
  ChatMessage,
  CoachResponse,
  AiPort,
  GeneratedArchetype,
} from '../ports/ai.port';
import { AiOfflineError } from '../../../shared/core/adapters/resilience';
import { createStudioArchetype, type Lang } from '../ai/studio-creator';

/**
 * LocalHeuristicAiAdapter — the fully-offline AiPort implementation.
 *
 * Zero network, zero model: the scoring engine computes the pantheon and
 * pole scores algorithmically; narrative/dialogue surfaces return honest
 * degraded content (never fabricated "AI" prose). This adapter is
 *   (a) the `aiProvider: 'heuristic'` configuration choice, and
 *   (b) the fallback target of ResilientAiAdapter when the primary is down.
 * Contract-tested against the same suite as GeminiAiAdapter.
 */
@Injectable()
export class LocalHeuristicAiAdapter implements AiPort {
  private readonly translationService = inject(TranslationService);

  private get lang(): Lang { return this.translationService.getLanguage() === 'ru' ? 'ru' : 'en'; }

  /** No offline text model exists — fail honestly and fast (typed for the circuit). */
  async callAI(_payload: AIRequest, _options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<string> {
    throw new AiOfflineError('no local text model; raw callAI requires the primary adapter');
  }

  async createArchetype(prompt: string): Promise<Archetype> {
    return createStudioArchetype(prompt, this.lang);
  }

  async analyzeAssessment(
    answers: number[],
    _questions: { section: string, text: string }[],
    _allArchetypes: Archetype[],
    _method: 'deterministic' | 'fallback' | 'legacy' = 'deterministic',
    dimensionalExpressions?: DimensionalExpressions,
    _options?: { signal?: AbortSignal }
  ): Promise<AssessmentAnalysis> {
    const lang = this.lang;
    const { archetypes: scoredPantheon, dynamics } = generateArchetypes(answers, lang);
    const { computePoleScores } = await import('../../../shared/core/data/scoring');
    const poles = computePoleScores(answers);

    const pantheon: GeneratedArchetype[] = scoredPantheon.map((sa) => ({
      name: sa.name,
      symbol: sa.symbol,
      color: '#7A6F5E',
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

    const poleScores = {
      agency: clampSigned(poles.agencyReceptive),
      emotional_temperature: clampSigned(poles.tempHot),
      relational_focus: clampSigned(poles.focusOther),
      attachment: clampSigned(poles.attAnxious),
    };

    const dims = dimensionalExpressions
      ? (lang === 'ru'
        ? `ИНИЦИАТИВНОСТЬ ${dimensionalExpressions.AGENCY.toFixed(2)} · ЭМОЦИОНАЛЬНОСТЬ ${dimensionalExpressions.TEMPERATURE.toFixed(2)} · ФОКУС ВНИМАНИЯ ${dimensionalExpressions.FOCUS.toFixed(2)} · БЛИЗОСТЬ И ДИСТАНЦИЯ ${dimensionalExpressions.ATTACHMENT.toFixed(2)}`
        : `AGENCY ${dimensionalExpressions.AGENCY.toFixed(2)} · TEMPERATURE ${dimensionalExpressions.TEMPERATURE.toFixed(2)} · FOCUS ${dimensionalExpressions.FOCUS.toFixed(2)} · ATTACHMENT ${dimensionalExpressions.ATTACHMENT.toFixed(2)}`)
      : '—';

    const analysis = lang === 'ru'
      ? [
          '## Ваш портрет отношений (офлайн-режим)',
          '',
          'Сетевой ИИ-анализ недоступен, поэтому этот отчёт собран локальным алгоритмом: какие архетипы вошли в портрет и все показатели вычислены точно, текст — шаблонный.',
          '',
          '### Ваши архетипы',
          ...pantheon.map(a => `- **${a.name}** ${a.symbol} — ${a.prominence}%: ${a.description}`),
          '',
          '### Размерности',
          dims,
          '',
          dynamics.length ? `### Динамики\n${dynamics.map(d => `- ${d.description}`).join('\n')}` : '',
          '',
          '_Включите сеть и повторите анализ, чтобы получить полный ИИ-разбор._',
        ].filter(Boolean).join('\n')
      : [
          '## Your Relational Fingerprint (offline mode)',
          '',
          'The networked AI analysis is unavailable, so this report was assembled by the local algorithm: which archetypes entered your portrait and every number is exact; the text is templated.',
          '',
          '### Your archetypes',
          ...pantheon.map(a => `- **${a.name}** ${a.symbol} — ${a.prominence}%: ${a.description}`),
          '',
          '### Dimensions',
          dims,
          '',
          dynamics.length ? `### Dynamics\n${dynamics.map(d => `- ${d.description}`).join('\n')}` : '',
          '',
          '_Reconnect and re-run the analysis for the full AI narrative._',
        ].filter(Boolean).join('\n');

    return { analysis, pantheon, dynamics, poleScores, narrativeDegraded: true };
  }

  async generateCoachResponse(
    _chatHistory: ChatMessage[],
    _archetype1: Archetype | null,
    _archetype2: Archetype | null,
    _allArchetypes: Archetype[],
    _mode: 'general' | 'parts' = 'general'
  ): Promise<CoachResponse> {
    const ru = this.lang === 'ru';
    return {
      response: ru
        ? 'Офлайн-режим: коуч отвечает только при доступном ИИ-сервисе. Ваша сессия сохранена — повторите вопрос, когда сеть вернётся.'
        : 'Offline mode: the coach responds only while the AI service is reachable. Your session is preserved — ask again once you are back online.',
      suggestions: [],
    };
  }

  async generatePartsDialogue(
    _chatHistory: ChatMessage[],
    currentPart: { name: string } | null,
    _allParts: { name: string }[]
  ): Promise<CoachResponse> {
    const ru = this.lang === 'ru';
    const who = currentPart?.name ?? (ru ? 'часть' : 'this part');
    return {
      response: ru
        ? `Офлайн-режим: диалог с «${who}» требует ИИ-сервиса. Попробуйте позже — история диалога сохранена.`
        : `Offline mode: the dialogue with "${who}" requires the AI service. Try again later — the dialogue history is preserved.`,
      suggestions: [],
    };
  }

  async generateSynastryNarrative(_reportData: string): Promise<string> {
    // Matches the primary adapter's own error-path behavior: empty string.
    return '';
  }
}

function clampSigned(v: number, min = -1, max = 1, fallback = 0): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.max(min, Math.min(max, n));
}
