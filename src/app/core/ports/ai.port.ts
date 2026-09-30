import { InjectionToken } from '@angular/core';
import type { Archetype, DimensionalExpressions } from '../../../services/universe-state.service';

/**
 * AI_PORT — the contract for everything the domain needs from language-model
 * intelligence (hexagonal Layer 1; zero-r-v3 ports/ boundary).
 *
 * Versioning (AAA-05, additive-only): AiPortV1 is FROZEN. New capabilities
 * are added as AiPortV2 extends AiPortV1; adapters migrate one at a time
 * while old adapters keep satisfying V1. `AI_PORT` binds to the current
 * alias. Never modify a released interface in place.
 *
 * Adapters (see core/adapters/):
 *   - GeminiAiAdapter      — Cloudflare-worker-proxied Gemini (primary)
 *   - LocalHeuristicAiAdapter — fully offline deterministic intelligence
 *   - ResilientAiAdapter   — decorator: primary → heuristic fallback with a
 *                            DegradationDescriptor (CROSS-01)
 * Selection is one line in environments (`aiProvider`), everything else is
 * wiring-agnostic.
 */

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

export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: any;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

/** ── V1 — original contract (FROZEN once released; never modified) ───── */
export interface AiPortV1 {
  /** Raw single-turn/text call. Throws typed errors; caller-cancel carries `cancelled`. */
  callAI(payload: AIRequest, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<string>;

  /** AI studio archetype from a free-text prompt. */
  createArchetype(prompt: string): Promise<Archetype>;

  /** Full assessment analysis. `method` selects deterministic vs AI-first. */
  analyzeAssessment(
    answers: number[],
    questions: { section: string, text: string }[],
    allArchetypes: Archetype[],
    method?: 'deterministic' | 'fallback' | 'legacy',
    dimensionalExpressions?: DimensionalExpressions,
    options?: { signal?: AbortSignal }
  ): Promise<AssessmentAnalysis>;

  /** Coach chat turn (two focused archetypes + full pantheon context). */
  generateCoachResponse(
    chatHistory: ChatMessage[],
    archetype1: Archetype | null,
    archetype2: Archetype | null,
    allArchetypes: Archetype[],
    mode?: 'general' | 'parts'
  ): Promise<CoachResponse>;

  /** Multi-part inner dialogue anchored on the current part. */
  generatePartsDialogue(
    chatHistory: ChatMessage[],
    currentPart: { name: string; partType?: string; wound?: string; coreBelief?: string; description?: string } | null,
    allParts: { name: string; partType?: string; description?: string; wound?: string }[]
  ): Promise<CoachResponse>;

  /** Couples narrative for a synastry report. */
  generateSynastryNarrative(reportData: string): Promise<string>;
}

/** Current alias — bump only via additive V2 (AAA-05). */
export type AiPort = AiPortV1;

import { resolveAiAdapter } from '../adapters/ai.providers';

export const AI_PORT = new InjectionToken<AiPort>('AI_PORT', {
  providedIn: 'root',
  factory: resolveAiAdapter,
});
