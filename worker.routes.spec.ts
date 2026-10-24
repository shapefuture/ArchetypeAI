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

function makeEnv() {
  const pass = { limit: async () => ({ success: true }) };
  return {
    FIREBASE_PROJECT_ID: 'demo-archetypeai',
    ALLOWED_APP_ORIGINS: 'https://app.example.com',
    AI_RATE_LIMITER: pass,
    AI_IP_RATE_LIMITER: pass,
    BILLING_RATE_LIMITER: pass,
    GOOGLE_API_KEY: 'test-google-key',
    OPENROUTER_API_KEY: 'test-openrouter-key',
    NVIDIA_API_KEY: 'test-nvidia-key',
    OLLAMA_API_KEY: 'test-ollama-key',
  } as any;
}

function makeRequest(headers: Record<string, string> = {}, body?: BodyInit): Request {
  return new Request('https://worker.example/api/ai', {
    method: 'POST',
    headers: {
      Origin: 'https://app.example.com',
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.42',
      ...headers,
    },
    ...(body === undefined ? {} : { body }),
  });
}

describe('Worker AI route security', () => {
  beforeEach(() => {
    authMock.mockReset();
    rateLimitMock.mockReset();
    authMock.mockResolvedValue(null);
    rateLimitMock.mockResolvedValue('allowed');
  });

  it('checks the IP bucket before Firebase authentication', async () => {
    const order: string[] = [];
    rateLimitMock.mockImplementation(async (_binding, key) => {
      order.push(`limit:${key}`);
      return 'allowed';
    });
    authMock.mockImplementation(async () => {
      order.push('auth');
      return null;
    });

    const response = await worker.handleAI(makeRequest(), makeEnv());

    expect(response.status).toBe(401);
    expect(order).toEqual(['limit:ai:ip:203.0.113.42', 'auth']);
    expect(rateLimitMock).toHaveBeenCalledTimes(1);
  });

  it('rejects IP-limited traffic without attempting Firebase authentication', async () => {
    rateLimitMock.mockResolvedValue('limited');

    const response = await worker.handleAI(makeRequest(), makeEnv());

    expect(response.status).toBe(429);
    expect(authMock).not.toHaveBeenCalled();
  });

  it('applies separate IP and UID rate-limit keys to billing routes', async () => {
    authMock.mockResolvedValue({ uid: 'firebase-user', email: null, emailVerified: false });

    const request = new Request('https://worker.example/api/stripe-verify?session_id=cs_test_123', {
      headers: {
        Origin: 'https://app.example.com',
        'CF-Connecting-IP': '203.0.113.42',
        Authorization: 'Bearer test-token',
      },
    });
    const response = await worker.handleStripeVerify(request, makeEnv());

    // No Stripe secrets are set in the test env, so authorization and both
    // rate-limit buckets run before the route returns its configuration error.
    expect(response.status).toBe(503);
    // The caller is not told which secrets are missing; the names go to the Worker log only.
    const body = await response.json() as Record<string, unknown>;
    expect(body).toEqual({ error: 'This service is not configured yet.' });
    expect(JSON.stringify(body)).not.toContain('STRIPE');
    expect(rateLimitMock.mock.calls.map(([, key]) => key)).toEqual([
      'billing:ip:203.0.113.42',
      'billing:uid:firebase-user',
    ]);
  });

  it('enforces the byte limit while streaming a body without Content-Length', async () => {
    authMock.mockResolvedValue({ uid: 'firebase-user', email: null, emailVerified: false });
    const oversized = new TextEncoder().encode(JSON.stringify({ prompt: 'x'.repeat(256_000) }));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(oversized);
        controller.close();
      },
    });
    const request = new Request('https://worker.example/api/ai', {
      method: 'POST',
      headers: {
        Origin: 'https://app.example.com',
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.42',
        Authorization: 'Bearer test-token',
      },
      body: stream,
      duplex: 'half',
    } as RequestInit);

    const response = await worker.handleAI(request, makeEnv());

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'Request body is too large' });
  });
});

describe('non-API paths', () => {
  it('answers 404 on the API-only deploy, which has no static assets binding', async () => {
    const response = await worker.fetch(new Request('https://worker.example/'), makeEnv(), {} as any);
    expect(response.status).toBe(404);
  });

  it('serves static assets when the app deploy binds them', async () => {
    const env = { ...makeEnv(), ASSETS: { fetch: async () => new Response('app', { status: 200 }) } };
    const response = await worker.fetch(new Request('https://worker.example/index.html'), env, {} as any);
    expect(await response.text()).toBe('app');
  });
});

describe('Stripe subscription verification', () => {
  const stripeEnv = () => ({ ...makeEnv(), STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_PRICE_ID: 'price_x' });
  const verify = () => worker.handleStripeVerify(new Request('https://worker.example/api/stripe-verify?session_id=cs_live_abc', {
    headers: { Origin: 'https://app.example.com', 'CF-Connecting-IP': '203.0.113.42', Authorization: 'Bearer t' },
  }), stripeEnv());
  const session = (subscription: unknown) => ({
    status: 'complete', mode: 'subscription', payment_status: 'paid', client_reference_id: 'firebase-user', subscription,
  });

  beforeEach(() => { authMock.mockResolvedValue({ uid: 'firebase-user', email: null, emailVerified: false }); });

  it('reports a cancelled subscription as inactive, though its Checkout Session stays complete', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(session({ id: 'sub_1', status: 'canceled' })), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await verify();
    expect(await response.json()).toEqual({ status: 'inactive' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('expand%5B%5D=subscription');
    vi.unstubAllGlobals();
  });

  it('reports an active or trialing subscription as complete', async () => {
    for (const status of ['active', 'trialing']) {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(session({ id: 'sub_1', status })), { status: 200 })));
      expect(await (await verify()).json()).toEqual({ status: 'complete' });
    }
    vi.unstubAllGlobals();
  });
});

describe('AI provider fallback', () => {
  it('does not call Ollama a second time after its first answer is unusable', async () => {
    authMock.mockResolvedValue({ uid: 'firebase-user', email: null, emailVerified: false });
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      urls.push(url);
      if (url.includes('ollama')) return new Response(JSON.stringify({ message: { content: '' } }), { status: 200 });
      return new Response('unavailable', { status: 503 });
    }));
    await worker.handleAI(makeRequest({}, JSON.stringify({ prompt: 'hello' })), makeEnv());
    expect(urls.filter((url) => url.includes('ollama')).length).toBe(1);
    vi.unstubAllGlobals();
  });
});
