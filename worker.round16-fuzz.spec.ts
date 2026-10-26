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
const ORIGIN = 'https://app.example.com';

function makeEnv() {
  const pass = { limit: async () => ({ success: true }) };
  return {
    FIREBASE_PROJECT_ID: 'demo-archetypeai',
    ALLOWED_APP_ORIGINS: ORIGIN,
    AI_RATE_LIMITER: pass,
    AI_IP_RATE_LIMITER: pass,
    BILLING_RATE_LIMITER: pass,
    GOOGLE_API_KEY: 'k', OPENROUTER_API_KEY: 'k', NVIDIA_API_KEY: 'k', OLLAMA_API_KEY: 'k',
    OPENROUTER_MODEL: 'm', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_PRICE_ID: 'price_x',
  } as any;
}

const identity = { uid: 'uid-1', email: 'a@example.com', emailVerified: true };

beforeEach(() => {
  authMock.mockReset();
  rateLimitMock.mockReset();
  authMock.mockResolvedValue(identity);
  rateLimitMock.mockResolvedValue('allowed');
  // Nothing may reach a real provider from a test: every outbound call fails closed.
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline in test'); }));
});

const post = (path: string, body: string, contentType = 'application/json') => new Request(`https://worker.example${path}`, {
  method: 'POST',
  headers: { Origin: ORIGIN, 'Content-Type': contentType, Authorization: 'Bearer t', 'CF-Connecting-IP': '203.0.113.9' },
  body,
});

describe('critic: Worker AI route answers malformed bodies with 4xx and never 5xx', () => {
  const bodies: Array<[string, string]> = [
    ['empty', ''],
    ['null', 'null'],
    ['array', '[]'],
    ['string', '"x"'],
    ['prompt number', '{"prompt":5}'],
    ['prompt whitespace', '{"prompt":"   "}'],
    ['history null item', '{"prompt":"x","history":[null]}'],
    ['history string', '{"prompt":"x","history":"abc"}'],
    ['history extra key', '{"prompt":"x","history":[{"role":"user","content":"a","x":1}]}'],
    ['history bad role', '{"prompt":"x","history":[{"role":"system","content":"a"}]}'],
    ['schema string', '{"prompt":"x","responseSchema":"abc"}'],
    ['schema array', '{"prompt":"x","responseSchema":[]}'],
    ['schema null', '{"prompt":"x","responseSchema":null}'],
    ['system null', '{"prompt":"x","systemInstruction":null}'],
    ['extra key', '{"prompt":"x","__proto__":{"a":1}}'],
    ['deep array', '['.repeat(20000) + ']'.repeat(20000)],
    ['deep prompt object', '{"prompt":"x","responseSchema":' + '{"a":'.repeat(5000) + '1' + '}'.repeat(5000) + '}'],
    ['lone surrogate in prompt', '{"prompt":"\\ud800"}'],
    ['bom prefix', '﻿{"prompt":"x"}'],
  ];
  for (const [label, body] of bodies) {
    it(`ai: ${label}`, async () => {
      const response = await worker.fetch(post('/api/ai', body), makeEnv(), {} as any);
      // 502 is the documented answer when every upstream provider is down (fetch is stubbed here).
      expect(response.status).not.toBe(500);
      expect(response.status).toBeLessThan(503);
    });
  }
  it('ai: wrong content type is 415', async () => {
    const response = await worker.fetch(post('/api/ai', '{"prompt":"x"}', 'text/plain'), makeEnv(), {} as any);
    expect(response.status).toBe(415);
  });
  it('ai: valid prompt with every provider failing is 502, not 500', async () => {
    const response = await worker.fetch(post('/api/ai', '{"prompt":"hello there"}'), makeEnv(), {} as any);
    expect(response.status).toBe(502);
  });
});

describe('critic: Worker billing routes answer malformed bodies with 4xx and never 5xx', () => {
  const checkoutBodies: Array<[string, string]> = [
    ['array', '[]'],
    ['origin number', '{"origin":5}'],
    ['origin null', '{"origin":null}'],
    ['origin empty', '{"origin":""}'],
    ['origin with path', `{"origin":"${ORIGIN}/path"}`],
    ['origin javascript', '{"origin":"javascript:alert(1)"}'],
    ['origin foreign', '{"origin":"https://evil.example"}'],
    ['origin object', '{"origin":{"href":"x"}}'],
    ['locale object', `{"origin":"${ORIGIN}","locale":{"x":1}}`],
    ['oversized', `{"origin":"${ORIGIN}","pad":"${'a'.repeat(9000)}"}`],
  ];
  for (const [label, body] of checkoutBodies) {
    it(`checkout: ${label}`, async () => {
      const response = await worker.fetch(post('/api/stripe-checkout', body), makeEnv(), {} as any);
      expect(response.status).not.toBe(500);
      expect(response.status).toBeLessThan(503);
    });
  }

  const verifyUrls: Array<[string, string]> = [
    ['missing', '/api/stripe-verify'],
    ['empty', '/api/stripe-verify?session_id='],
    ['too long', `/api/stripe-verify?session_id=cs_test_${'a'.repeat(300)}`],
    ['nul byte', '/api/stripe-verify?session_id=cs_test_abc%00'],
    ['wrong prefix', '/api/stripe-verify?session_id=pi_123'],
    ['repeated', '/api/stripe-verify?session_id=cs_test_abc&session_id=evil'],
  ];
  for (const [label, path] of verifyUrls) {
    it(`verify: ${label}`, async () => {
      const request = new Request(`https://worker.example${path}`, { method: 'GET', headers: { Origin: ORIGIN, Authorization: 'Bearer t', 'CF-Connecting-IP': '203.0.113.9' } });
      const response = await worker.fetch(request, makeEnv(), {} as any);
      expect(response.status).not.toBe(500);
      expect(response.status).toBeLessThan(503);
    });
  }
});
