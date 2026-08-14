/**
 * Pure helpers used by the Cloudflare Worker entrypoint (`worker.ts`).
 * Kept in a separate file so they can be unit-tested under vitest without
 * needing a Worker runtime (no `Request`, no `Response`, no `env` magic).
 */

export interface AIProviderEnv {
  GOOGLE_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  NVIDIA_API_KEY?: string;
  OLLAMA_API_KEY?: string;
}

/**
 * Returns the names of the AI provider API keys that are missing from the
 * Worker's environment. The `/api/ai` endpoint depends on ALL of them being
 * present — every provider is tried in turn, and if any single key is set
 * the user can usually still get a result. The most common production
 * failure is "I deployed without running `wrangler secret put`", which
 * makes every provider return 401. Surfacing the missing key names in the
 * 503 error turns a silent failure into a 30-second fix.
 */
export function getMissingApiKeys(env: AIProviderEnv): string[] {
  const required: Array<[string, string | undefined]> = [
    ['GOOGLE_API_KEY', env.GOOGLE_API_KEY],
    ['OPENROUTER_API_KEY', env.OPENROUTER_API_KEY],
    ['NVIDIA_API_KEY', env.NVIDIA_API_KEY],
    ['OLLAMA_API_KEY', env.OLLAMA_API_KEY],
  ];
  return required.filter(([, v]) => !v).map(([k]) => k);
}
