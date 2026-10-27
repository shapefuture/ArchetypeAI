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
 * Worker's environment. Every provider is tried in turn, so a missing key only
 * takes its own provider out: the `/api/ai` endpoint refuses requests only when
 * no key is set (see hasAnyApiKey). The most common production failure is "I
 * deployed without running `wrangler secret put`", which makes that provider
 * return 401; the missing names are logged so that becomes a 30-second fix.
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

/** True when at least one provider key is set, so at least one provider can answer. */
export function hasAnyApiKey(env: AIProviderEnv): boolean {
  return !!(env.GOOGLE_API_KEY || env.OPENROUTER_API_KEY || env.NVIDIA_API_KEY || env.OLLAMA_API_KEY);
}
