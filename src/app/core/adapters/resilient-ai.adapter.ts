import { Injectable, signal } from '@angular/core';
import type { Archetype, DimensionalExpressions } from '../../../services/universe-state.service';
import {
  AIRequest,
  AssessmentAnalysis,
  ChatMessage,
  CoachResponse,
  AiPort,
} from '../ports/ai.port';
import { DegradationDescriptor, OperationCancelledError } from './resilience';

/**
 * ResilientAiAdapter — decorator implementing AiPort over a primary adapter
 * with a fallback adapter (Layer 2, L5-fallback + CROSS-01).
 *
 * Contract:
 *   - caller cancellations propagate untouched (never swallowed into fallback)
 *   - any other primary failure hands the call to the fallback adapter
 *   - every served-by-fallback result is recorded in `degradation` (signal)
 *     so the UI can surface degraded mode — silent degradation is a failure
 */
@Injectable()
export class ResilientAiAdapter implements AiPort {
  readonly degradation = signal<DegradationDescriptor | null>(null);

  constructor(
    private readonly primary: AiPort,
    private readonly fallback: AiPort,
    private readonly onDegraded?: (d: DegradationDescriptor) => void,
  ) {}

  private async withFallback<T>(key: string, op: () => Promise<T>, fb: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (error) {
      if (error instanceof OperationCancelledError || (error as { cancelled?: boolean })?.cancelled) throw error;
      const descriptor: DegradationDescriptor = {
        source: 'fallback_adapter',
        reason: 'primary_ai_unavailable',
        dataAgeSeconds: -1,
        key,
        originalError: String(error),
      };
      this.degradation.set(descriptor);
      this.onDegraded?.(descriptor);
      return await fb();
    }
  }

  callAI(payload: AIRequest, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<string> {
    // No fallback for the raw transport: callers of callAI own their error UX,
    // and a heuristic adapter has no honest raw-text answer.
    return this.primary.callAI(payload, options);
  }

  createArchetype(prompt: string): Promise<Archetype> {
    return this.withFallback('ai:createArchetype',
      () => this.primary.createArchetype(prompt),
      () => this.fallback.createArchetype(prompt));
  }

  analyzeAssessment(
    answers: number[],
    questions: { section: string, text: string }[],
    allArchetypes: Archetype[],
    method: 'deterministic' | 'fallback' | 'legacy' = 'deterministic',
    dimensionalExpressions?: DimensionalExpressions,
    options?: { signal?: AbortSignal }
  ): Promise<AssessmentAnalysis> {
    return this.withFallback('ai:analyzeAssessment',
      () => this.primary.analyzeAssessment(answers, questions, allArchetypes, method, dimensionalExpressions, options),
      () => this.fallback.analyzeAssessment(answers, questions, allArchetypes, method, dimensionalExpressions, options));
  }

  generateCoachResponse(
    chatHistory: ChatMessage[],
    archetype1: Archetype | null,
    archetype2: Archetype | null,
    allArchetypes: Archetype[],
    mode: 'general' | 'parts' = 'general'
  ): Promise<CoachResponse> {
    return this.withFallback('ai:coach',
      () => this.primary.generateCoachResponse(chatHistory, archetype1, archetype2, allArchetypes, mode),
      () => this.fallback.generateCoachResponse(chatHistory, archetype1, archetype2, allArchetypes, mode));
  }

  generatePartsDialogue(
    chatHistory: ChatMessage[],
    currentPart: { name: string; partType?: string; wound?: string; coreBelief?: string; description?: string } | null,
    allParts: { name: string; partType?: string; description?: string; wound?: string }[]
  ): Promise<CoachResponse> {
    return this.withFallback('ai:partsDialogue',
      () => this.primary.generatePartsDialogue(chatHistory, currentPart, allParts),
      () => this.fallback.generatePartsDialogue(chatHistory, currentPart, allParts));
  }

  generateSynastryNarrative(reportData: string): Promise<string> {
    return this.withFallback('ai:synastry',
      () => this.primary.generateSynastryNarrative(reportData),
      () => this.fallback.generateSynastryNarrative(reportData));
  }
}
