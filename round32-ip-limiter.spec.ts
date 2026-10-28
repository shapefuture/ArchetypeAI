// Round 32 probe (critic). wrangler.api.toml says: "Without these bindings every route fails closed (503)." authorizeWorkerRequest
// (worker.ts) applied the IP bucket only `if (ipLimiter && ip)`, so a deployment whose AI_IP_RATE_LIMITER binding is absent skipped
// the IP bucket and served the request. The per-identity bucket still applied, but every anonymous Firebase sign-in is a new
// identity, so with no IP bucket the per-identity limit alone does not bound unauthenticated AI traffic.
// Expected: the same fail-closed 503 as a missing per-identity binding. Actual on b5483c5: the request reached the AI providers.
// Fixed: the IP bucket always applies, and the real checkRateLimit() answers 'unavailable' (503) for a missing binding.
// This probe no longer mocks checkRateLimit: the first version returned 'allowed' for every binding, which hid the defect.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./worker-security', async (importOriginal) => {
  const security = await importOriginal<typeof import('./worker-security')>();
  return {
    ...security,
    authenticateFirebaseRequest: vi.fn(),
  };
});

import worker from './worker';
import { authenticateFirebaseRequest } from './worker-security';

const authMock = vi.mocked(authenticateFirebaseRequest);

const pass = { limit: async () => ({ success: true }) };
const broken = { limit: async () => { throw new Error('binding unavailable'); } };

function makeEnv(ipBinding: { limit: () => Promise<{ success: boolean }> } | undefined) {
  return {
    FIREBASE_PROJECT_ID: 'demo-archetypeai',
    ALLOWED_APP_ORIGINS: 'https://app.example.com',
    AI_RATE_LIMITER: pass,
    ...(ipBinding ? { AI_IP_RATE_LIMITER: ipBinding } : {}),
    BILLING_RATE_LIMITER: pass,
    GOOGLE_API_KEY: 'test-google-key',
    OPENROUTER_API_KEY: 'test-openrouter-key',
    NVIDIA_API_KEY: 'test-nvidia-key',
    OLLAMA_API_KEY: 'test-ollama-key',
  } as any;
}

function aiRequest(): Request {
  return new Request('https://worker.example/api/ai', {
    method: 'POST',
    headers: {
      Origin: 'https://app.example.com',
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
      'CF-Connecting-IP': '203.0.113.42',
    },
    body: JSON.stringify({ prompt: 'Hello from a probe' }),
  });
}

describe('round32: the AI route fails closed when its IP bucket binding is missing', () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ uid: 'uid_anon', email: null, emailVerified: false });
    // No provider is reachable in this probe: every upstream call fails, so only the gate decides the status.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 500 })));
  });

  it('control: with the IP binding present and failing, the route answers 503', async () => {
    const response = await worker.handleAI(aiRequest(), makeEnv(broken));
    vi.unstubAllGlobals();
    expect(response.status).toBe(503);
  });

  it('with the IP binding absent, the route fails closed with 503 instead of going on to the providers', async () => {
    const response = await worker.handleAI(aiRequest(), makeEnv(undefined));
    vi.unstubAllGlobals();
    expect(response.status).toBe(503);
  });
});
