// Round 33 probe (critic). worker-helpers.ts getMissingApiKeys says: "every provider is tried in turn, and if any single key is
// set the user can usually still get a result." handleAI (worker.ts) refuses the whole route with 503 "not configured" while
// any one of the four keys is missing, so a deployment with only GOOGLE_API_KEY set serves nothing, although raceAI would
// answer from the one configured provider. Controls: all four keys set and Gemini answers -> 200; no keys -> 503.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./worker-security', async (importOriginal) => {
  const security = await importOriginal<typeof import('./worker-security')>();
  return {
    ...security,
    authenticateFirebaseRequest: vi.fn(),
    checkRateLimit: vi.fn(),
  };
});

import worker from './worker';
import { authenticateFirebaseRequest, checkRateLimit } from './worker-security';

const authMock = vi.mocked(authenticateFirebaseRequest);
const rateLimitMock = vi.mocked(checkRateLimit);
const ANSWER = 'A complete and sufficiently long answer from the configured provider.';

function aiRequest(): Request {
  return new Request('https://worker.example/api/ai', {
    method: 'POST',
    headers: {
      Origin: 'https://app.example.com',
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.44',
    },
    body: JSON.stringify({ prompt: 'Say something useful about the parts map.' }),
  });
}

function envWith(keys: Record<string, string>) {
  const pass = { limit: async () => ({ success: true }) };
  return {
    FIREBASE_PROJECT_ID: 'demo-archetypeai',
    ALLOWED_APP_ORIGINS: 'https://app.example.com',
    AI_RATE_LIMITER: pass,
    AI_IP_RATE_LIMITER: pass,
    BILLING_RATE_LIMITER: pass,
    OPENROUTER_MODEL: 'openrouter/auto:free',
    ...keys,
  } as any;
}

/** Only Gemini answers; every other provider host fails like an unconfigured provider would. */
function geminiOnlyFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('generativelanguage.googleapis.com')) {
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: ANSWER }] } }] }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('unauthorized', { status: 401 });
  });
}

describe('round33: one configured AI provider can still serve /api/ai', () => {
  beforeEach(() => {
    authMock.mockReset();
    rateLimitMock.mockReset();
    authMock.mockResolvedValue({ uid: 'uid_ai_r33', email: 'ai@example.com', emailVerified: true });
    rateLimitMock.mockResolvedValue('allowed');
  });

  it('control: with all four provider keys set and Gemini answering, the route answers 200', async () => {
    vi.stubGlobal('fetch', geminiOnlyFetch());
    const response = await worker.handleAI(aiRequest(), envWith({
      GOOGLE_API_KEY: 'g-key', OPENROUTER_API_KEY: 'o-key', NVIDIA_API_KEY: 'n-key', OLLAMA_API_KEY: 'ol-key',
    }));
    vi.unstubAllGlobals();
    expect(response.status).toBe(200);
    expect(((await response.json()) as { text: string }).text).toBe(ANSWER);
  });

  it('control: with no provider key set, the route answers 503', async () => {
    vi.stubGlobal('fetch', geminiOnlyFetch());
    const response = await worker.handleAI(aiRequest(), envWith({}));
    vi.unstubAllGlobals();
    expect(response.status).toBe(503);
  });

  it('with only GOOGLE_API_KEY set, Gemini still answers and the route does not refuse with 503', async () => {
    vi.stubGlobal('fetch', geminiOnlyFetch());
    const response = await worker.handleAI(aiRequest(), envWith({ GOOGLE_API_KEY: 'g-key' }));
    vi.unstubAllGlobals();
    expect(response.status).not.toBe(503);
    expect(response.status).toBe(200);
  });
});
