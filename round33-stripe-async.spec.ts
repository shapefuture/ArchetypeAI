// Round 33 probe (critic). billing.service.ts restore() keeps a Checkout return that has not been decided yet:
//   "An unfinished checkout may still complete; a cancelled or expired one will not." (open -> keep the pending session;
//   anything else -> reject, which clears the pending session).
// handleStripeVerify (worker.ts) maps a Checkout Session whose status is `complete` to `inactive` unless its subscription is
// `active` or `trialing` AND payment_status is paid/no_payment_required. A subscription in `incomplete` status is not
// terminal: Stripe keeps it open for up to 23 hours while the first payment succeeds (for example an action or an async bank
// payment). Such a session therefore may still become paid, but the Worker answers `inactive`, the client rejects it and drops
// the pending session, and no later restore() asks Stripe again. Expected: `open` (still may complete), not `inactive`.
// Controls: a paid active subscription is `complete`; a session Stripe expired is `expired`; an `incomplete_expired`
// subscription, which will never be paid, is `inactive`.
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
const SESSION = 'cs_test_r33async01';

function makeEnv() {
  const pass = { limit: async () => ({ success: true }) };
  return {
    FIREBASE_PROJECT_ID: 'demo-archetypeai',
    ALLOWED_APP_ORIGINS: 'https://app.example.com',
    AI_RATE_LIMITER: pass,
    AI_IP_RATE_LIMITER: pass,
    BILLING_RATE_LIMITER: pass,
    STRIPE_SECRET_KEY: 'sk_test_round33',
    STRIPE_PRICE_ID: 'price_round33',
  } as any;
}

function verifyRequest(): Request {
  return new Request(`https://worker.example/api/stripe-verify?session_id=${SESSION}`, {
    method: 'GET',
    headers: { Origin: 'https://app.example.com', Authorization: 'Bearer test-token', 'CF-Connecting-IP': '203.0.113.33' },
  });
}

function stripeReply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function verifyWith(session: Record<string, unknown>): Promise<string> {
  vi.stubGlobal('fetch', vi.fn(async () => stripeReply(200, session)));
  try {
    const response = await worker.handleStripeVerify(verifyRequest(), makeEnv());
    expect(response.status).toBe(200);
    return ((await response.json()) as { status: string }).status;
  } finally {
    vi.unstubAllGlobals();
  }
}

describe('round33: a Checkout Session whose subscription can still be paid is not reported as inactive', () => {
  beforeEach(() => {
    authMock.mockReset();
    rateLimitMock.mockReset();
    authMock.mockResolvedValue({ uid: 'uid_buyer_r33', email: 'buyer@example.com', emailVerified: true });
    rateLimitMock.mockResolvedValue('allowed');
  });

  it('control: a paid, active subscription is complete', async () => {
    expect(await verifyWith({
      status: 'complete', mode: 'subscription', client_reference_id: 'uid_buyer_r33', payment_status: 'paid',
      subscription: { status: 'active' },
    })).toBe('complete');
  });

  it('control: a session Stripe expired is expired', async () => {
    expect(await verifyWith({
      status: 'expired', mode: 'subscription', client_reference_id: 'uid_buyer_r33', payment_status: 'unpaid',
      subscription: null,
    })).toBe('expired');
  });

  it('control: an incomplete_expired subscription will never be paid, so inactive is right', async () => {
    expect(await verifyWith({
      status: 'complete', mode: 'subscription', client_reference_id: 'uid_buyer_r33', payment_status: 'unpaid',
      subscription: { status: 'incomplete_expired' },
    })).toBe('inactive');
  });

  it('a completed session whose first payment is still pending (subscription incomplete) must stay open, not inactive', async () => {
    const status = await verifyWith({
      status: 'complete', mode: 'subscription', client_reference_id: 'uid_buyer_r33', payment_status: 'unpaid',
      subscription: { status: 'incomplete' },
    });
    // billing.service.ts: 'open' keeps the pending session; 'inactive' makes the client drop it for good.
    expect(status).toBe('open');
  });
});
