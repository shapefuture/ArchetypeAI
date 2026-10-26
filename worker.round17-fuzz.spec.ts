import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./worker-security', async (importOriginal) => {
  const security = await importOriginal<typeof import('./worker-security')>();
  return { ...security, authenticateFirebaseRequest: vi.fn(), checkRateLimit: vi.fn() };
});

import worker from './worker';
import { authenticateFirebaseRequest, checkRateLimit } from './worker-security';

const authMock = vi.mocked(authenticateFirebaseRequest);
const rateLimitMock = vi.mocked(checkRateLimit);

const pass = { limit: async () => ({ success: true }) };
const env = {
  FIREBASE_PROJECT_ID: 'demo-archetypeai',
  ALLOWED_APP_ORIGINS: 'https://app.example.com',
  AI_RATE_LIMITER: pass, AI_IP_RATE_LIMITER: pass, BILLING_RATE_LIMITER: pass,
  GOOGLE_API_KEY: 'k', OPENROUTER_API_KEY: 'k', NVIDIA_API_KEY: 'k', OLLAMA_API_KEY: 'k', OPENROUTER_MODEL: 'm',
} as any;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const KEYS = ['prompt', 'systemInstruction', 'responseSchema', 'history', 'extra', '__proto__', 'role', 'content'];
const pick = <T,>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length)];
function randomValue(r: () => number, depth = 0): unknown {
  const kinds = ['string', 'number', 'null', 'bool', 'array', 'object', 'emptyString', 'bigString'];
  const k = pick(r, depth > 2 ? ['string', 'number', 'null'] : kinds);
  switch (k) {
    case 'string': return pick(r, ['hi', 'Привет', '', ' ', 'user', 'model', 'system']);
    case 'emptyString': return '';
    case 'bigString': return 'x'.repeat(Math.floor(r() * 90_000));
    case 'number': return Math.floor(r() * 10) - 3;
    case 'null': return null;
    case 'bool': return r() < 0.5;
    case 'array': return Array.from({ length: Math.floor(r() * 4) }, () => randomValue(r, depth + 1));
    default: return Object.fromEntries(Array.from({ length: Math.floor(r() * 4) }, () => [pick(r, KEYS), randomValue(r, depth + 1)]));
  }
}
function randomBody(r: () => number): unknown {
  if (r() < 0.1) return randomValue(r);
  const body: Record<string, unknown> = {};
  if (r() < 0.9) body.prompt = pick(r, ['Hello', ' ', '', 'Привет', 'x'.repeat(Math.floor(r() * 3000)), randomValue(r)]) as string;
  if (r() < 0.3) body.systemInstruction = pick(r, ['sys', '', null, 3, 'y'.repeat(5000)]);
  if (r() < 0.3) body.responseSchema = pick(r, [{ type: 'object' }, [], null, 'str', { a: { b: [1, 2] } }]);
  if (r() < 0.4) body.history = pick(r, [[{ role: 'user', content: 'a' }], [{ role: 'model', content: 'b' }], [{ role: 'system', content: 'c' }], [{ role: 'user', content: 1 }], 'nope', null, [{ role: 'user', content: 'a', extra: 1 }]]);
  if (r() < 0.05) body[pick(r, KEYS)] = randomValue(r);
  return body;
}

describe('critic17: fuzz the cloud AI body', () => {
  beforeEach(() => {
    authMock.mockReset();
    rateLimitMock.mockReset();
    authMock.mockResolvedValue({ uid: 'uid_fuzz', email: 'f@example.com', emailVerified: true });
    rateLimitMock.mockResolvedValue('allowed');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('upstream down', { status: 500 })));
  });

  it('every response is a deliberate status; unknown keys and non-object bodies are never accepted', async () => {
    const r = rng(20261026);
    const surprises: Array<{ status: number; body: string; input: string }> = [];
    const acceptedWithUnknownKey: string[] = [];
    for (let i = 0; i < 400; i += 1) {
      const body = randomBody(r);
      const raw = JSON.stringify(body) ?? 'null';
      const response = await worker.fetch(new Request('https://worker.example/api/ai', {
        method: 'POST',
        headers: { Origin: 'https://app.example.com', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9', Authorization: 'Bearer x' },
        body: raw,
      }), env, {} as any);
      const text = await response.text();
      if (![200, 400, 413, 415, 502].includes(response.status)) surprises.push({ status: response.status, body: text.slice(0, 200), input: raw.slice(0, 200) });
      const unknownKey = body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).some((k) => !['prompt', 'systemInstruction', 'responseSchema', 'history'].includes(k));
      if (unknownKey && response.status !== 400) acceptedWithUnknownKey.push(raw.slice(0, 160));
    }
    expect(surprises).toEqual([]);
    expect(acceptedWithUnknownKey).toEqual([]);
  });
});
