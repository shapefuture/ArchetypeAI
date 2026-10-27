// Round 32 probe (critic). billing.service.ts restore() keeps a paid Checkout return "until the Worker answers definitely, so a
// network error, rate limit or 5xx on return does not lose the purchase". It deletes the pending session on any 400 or 404
// from /api/stripe-verify ("the server knows this session and it is not ours or not paid"). handleStripeVerify (worker.ts)
// answers every failed Stripe lookup with 404 "Checkout Session not found", including Stripe's own 429 and 5xx replies
// (`if (!stripeRes.ok || session.mode !== 'subscription') return ... 404`). So a Stripe rate limit or outage at the moment of
// return is reported as "no such session", the client drops the pending session, and the purchase is never unlocked.
// Expected: a Stripe 429 is a temporary failure, answered with the Worker's own temporary-failure status (502, as for a
// network error in the same handler).
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
const SESSION = 'cs_test_a1b2c3d4e5';

function makeEnv() {
  const pass = { limit: async () => ({ success: true }) };
  return {
    FIREBASE_PROJECT_ID: 'demo-archetypeai',
    ALLOWED_APP_ORIGINS: 'https://app.example.com',
    AI_RATE_LIMITER: pass,
    AI_IP_RATE_LIMITER: pass,
    BILLING_RATE_LIMITER: pass,
    STRIPE_SECRET_KEY: 'sk_test_round32',
    STRIPE_PRICE_ID: 'price_round32',
  } as any;
}

function verifyRequest(): Request {
  return new Request(`https://worker.example/api/stripe-verify?session_id=${SESSION}`, {
    method: 'GET',
    headers: { Origin: 'https://app.example.com', Authorization: 'Bearer test-token', 'CF-Connecting-IP': '203.0.113.9' },
  });
}

function stripeReply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('round32: a Stripe failure on verify is not reported as a missing session', () => {
  beforeEach(() => {
    authMock.mockReset();
    rateLimitMock.mockReset();
    authMock.mockResolvedValue({ uid: 'uid_buyer', email: 'buyer@example.com', emailVerified: true });
    rateLimitMock.mockResolvedValue('allowed');
  });

  it('control: Stripe says the session does not exist, so the Worker answers 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => stripeReply(404, { error: { type: 'invalid_request_error', code: 'resource_missing' } })));
    const response = await worker.handleStripeVerify(verifyRequest(), makeEnv());
    expect(response.status).toBe(404);
    vi.unstubAllGlobals();
  });

  it('control: a paid subscription session is reported complete', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => stripeReply(200, {
      status: 'complete', mode: 'subscription', client_reference_id: 'uid_buyer', payment_status: 'paid',
      subscription: { status: 'active' },
    })));
    const response = await worker.handleStripeVerify(verifyRequest(), makeEnv());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'complete' });
    vi.unstubAllGlobals();
  });

  it('Stripe rate-limits the lookup (429): the Worker reports a temporary failure, not a missing session', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => stripeReply(429, { error: { type: 'rate_limit_error', message: 'Too many requests' } })));
    const response = await worker.handleStripeVerify(verifyRequest(), makeEnv());
    vi.unstubAllGlobals();
    // 502 is the handler's own answer for a Stripe lookup that could not be completed (see the catch branch).
    expect(response.status).toBe(502);
  });
});
