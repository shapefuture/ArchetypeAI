import { Injectable, inject } from '@angular/core';
import type { Archetype, DimensionalExpressions } from './universe-state.service';
import { AI_PORT } from '../app/core/ports/ai.port';
import type { AIRequest, AssessmentAnalysis, ChatMessage, CoachResponse, AiPort } from '../app/core/ports/ai.port';

/**
 * GeminiService — compatibility facade over AI_PORT (hexagonal Layer 1).
 *
 * The implementation lives in core/adapters/ (GeminiAiAdapter, with
 * LocalHeuristicAiAdapter + ResilientAiAdapter behind the AI_PORT token).
 * This facade exists so existing consumers keep injecting `GeminiService`
 * while the wiring, resilience shell, and provider selection live at the
 * port boundary. Re-exports the contract types for the same reason.
 */
export type { AIRequest, AssessmentAnalysis, ChatMessage, CoachResponse, GeneratedArchetype } from '../app/core/ports/ai.port';

@Injectable({ providedIn: 'root' })
export class GeminiService implements AiPort {
  private readonly ai = inject(AI_PORT);

  callAI(payload: AIRequest, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<string> {
    return this.ai.callAI(payload, options);
  }

  createArchetype(prompt: string): Promise<Archetype> {
    return this.ai.createArchetype(prompt);
  }

  analyzeAssessment(
    answers: number[],
    questions: { section: string, text: string }[],
    allArchetypes: Archetype[],
    method: 'deterministic' | 'fallback' | 'legacy' = 'deterministic',
    dimensionalExpressions?: DimensionalExpressions,
    options?: { signal?: AbortSignal }
  ): Promise<AssessmentAnalysis> {
    return this.ai.analyzeAssessment(answers, questions, allArchetypes, method, dimensionalExpressions, options);
  }

  generateCoachResponse(
    chatHistory: ChatMessage[],
    archetype1: Archetype | null,
    archetype2: Archetype | null,
    allArchetypes: Archetype[],
    mode: 'general' | 'parts' = 'general'
  ): Promise<CoachResponse> {
    return this.ai.generateCoachResponse(chatHistory, archetype1, archetype2, allArchetypes, mode);
  }

  generatePartsDialogue(
    chatHistory: ChatMessage[],
    currentPart: { name: string; partType?: string; wound?: string; coreBelief?: string; description?: string } | null,
    allParts: { name: string; partType?: string; description?: string; wound?: string }[]
  ): Promise<CoachResponse> {
    return this.ai.generatePartsDialogue(chatHistory, currentPart, allParts);
  }

  generateSynastryNarrative(reportData: string): Promise<string> {
    return this.ai.generateSynastryNarrative(reportData);
  }
}
