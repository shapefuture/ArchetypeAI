import { environment } from '../../../environments/environment';
import { type AiPort } from '../ports/ai.port';
import { GeminiAiAdapter } from './gemini-ai.adapter';
import { LocalHeuristicAiAdapter } from './local-heuristic-ai.adapter';
import { ResilientAiAdapter } from './resilient-ai.adapter';

/**
 * AI_PORT wiring — the "one config line swaps everything" seam (Layer 1).
 *
 *   aiProvider: 'gemini'    → Resilient(Gemini → LocalHeuristic)  [default]
 *   aiProvider: 'heuristic' → LocalHeuristic alone (fully offline)
 */
export function resolveAiAdapter(): AiPort {
  const heuristic = new LocalHeuristicAiAdapter();
  if (environment.aiProvider === 'heuristic') {
    return heuristic;
  }
  return new ResilientAiAdapter(new GeminiAiAdapter(), heuristic);
}
