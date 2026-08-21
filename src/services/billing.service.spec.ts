/**
 * BillingService spec. Navigation (`window.location.href = ...`) cannot be
 * exercised under jsdom, so the request shape is tested through the pure
 * `buildCheckoutRequest` helper (extracted for exactly this reason — same
 * pattern as specialist-client.service pure helpers), and `startCheckout`'s
 * fetch is verified with a stubbed global fetch plus a spied `navigate`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BillingService,
  buildCheckoutRequest,
  detectStripeLocale,
  deriveVerifyUrl,
  SUBSCRIPTION_STORAGE_KEY,
} from './billing.service';
import { environment } from '../environments/environment';

describe('buildCheckoutRequest (pure helper)', () => {
  it('includes origin, locale and email', () => {
    const body = buildCheckoutRequest('user@example.com', 'https://app.example.com');
    expect(body).toEqual({
      origin: 'https://app.example.com',
      email: 'user@example.com',
      locale: 'en',
    });
  });

  it('omits email when not provided', () => {
    const body = buildCheckoutRequest(undefined, 'https://app.example.com');
    expect(body).not.toHaveProperty('email');
    expect(body.origin).toBe('https://app.example.com');
  });

  it('maps ru document lang to ru locale, anything else to en', () => {
    expect(detectStripeLocale({ documentElement: { lang: 'ru' } } as unknown as Document)).toBe('ru');
    expect(detectStripeLocale({ documentElement: { lang: 'en' } } as unknown as Document)).toBe('en');
    expect(detectStripeLocale({ documentElement: { lang: '' } } as unknown as Document)).toBe('en');
  });

  it('buildCheckoutRequest respects the document locale', () => {
    const body = buildCheckoutRequest(undefined, 'https://x.dev', { documentElement: { lang: 'ru' } } as unknown as Document);
    expect(body.locale).toBe('ru');
  });
});

describe('deriveVerifyUrl', () => {
  it('replaces checkout with verify in the checkout endpoint', () => {
    expect(deriveVerifyUrl(environment.stripeApiUrl)).toBe(
      'https://archetypeai-worker.wmobilas.workers.dev/api/stripe-verify',
    );
  });
});

describe('BillingService — startCheckout', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    // Must run even when assertions fail, or a spied window.location leaks
    // into subsequent tests.
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('POSTs the checkout payload to stripeApiUrl and navigates to the returned url', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    // jsdom forbids real navigation; replace window.location with a plain
    // stub object so the href assignment can be observed instead of firing
    // a "Not implemented: navigation" error.
    const locationStub = {
      href: 'about:blank',
      origin: 'http://localhost/',
      search: '',
    } as unknown as Location;
    vi.spyOn(window, 'location', 'get').mockReturnValue(locationStub);

    const svc = new BillingService();
    await svc.startCheckout('someone@example.com');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(environment.stripeApiUrl);
    expect(init.method).toBe('POST');
    const payload = JSON.parse(init.body);
    expect(payload.email).toBe('someone@example.com');
    expect(payload.locale).toBe('en');
    expect(payload.origin).toBe('http://localhost/');
    // The navigation target is the url returned by the worker.
    expect(locationStub.href).toBe('https://checkout.stripe.com/c/pay/cs_test_1');
  });

  it('throws with the worker error message when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Missing required Cloudflare Worker secrets: STRIPE_SECRET_KEY' }),
    })));

    const svc = new BillingService();
    await expect(svc.startCheckout()).rejects.toThrow(/STRIPE_SECRET_KEY/);
  });

  it('throws a generic error when the body has no url and no error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    })));

    const svc = new BillingService();
    await expect(svc.startCheckout()).rejects.toThrow(/Stripe checkout failed/);
  });
});

describe('BillingService — verifySession', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('marks subscription active on status=complete, caches the flag, and clears query params', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: 'complete', customer: 'cus_1', subscription: 'sub_1' }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState(null, '', '/?stripe=success&session_id=cs_test_9');

    const svc = new BillingService();
    // The constructor already kicked off verification for cs_test_9.
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/stripe-verify?session_id=cs_test_9'),
    );
    expect(svc.subscription()).toBe('active');
    expect(svc.active()).toBe(true);
    expect(localStorage.getItem(SUBSCRIPTION_STORAGE_KEY)).toBe('active');
    expect(window.location.search).not.toContain('session_id');
  });

  it('keeps none on status=open/expired', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: 'expired' }),
    })));

    const svc = new BillingService();
    await svc.verifySession('cs_x');
    expect(svc.subscription()).toBe('none');
    expect(localStorage.getItem(SUBSCRIPTION_STORAGE_KEY)).toBeNull();
  });

  it('sets unknown when the verify call fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));

    const svc = new BillingService();
    await svc.verifySession('cs_x');
    expect(svc.subscription()).toBe('unknown');
  });

  it('restores active from localStorage on init (no verify call)', async () => {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, 'active');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const svc = new BillingService();
    expect(svc.subscription()).toBe('active');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
