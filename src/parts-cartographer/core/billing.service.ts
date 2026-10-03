// Stripe billing adapter backed by the existing Cloudflare Worker routes.
// The Worker owns product/price configuration; the client never collects
// card details and only caches a session after server verification.
import type { BILLING_PORT } from './ports';
import { store, KEYS } from './local-store';
import { workerApiUrl } from './api';

const VERIFY_URL = workerApiUrl('stripe-verify');
let cachedPremium = store.load<string>(KEYS.billing, '') === 'premium';

function clearStripeQuery() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('stripe') && !url.searchParams.has('session_id')) return;
  url.searchParams.delete('stripe');
  url.searchParams.delete('session_id');
  window.history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
}

function setPremium(on: boolean) {
  cachedPremium = on;
  store.save(KEYS.billing, on ? 'premium' : '');
}

export const billing: BILLING_PORT & {
  locale(): 'USD' | 'RUB';
  checkout(planId: string, email?: string): Promise<{ ok: boolean; verified: boolean }>;
} = {
  locale() { return store.load<'en' | 'ru'>('ifs.lang', 'en') === 'ru' ? 'RUB' : 'USD'; },
  // The current Worker is configured with one Stripe Price ID, so the UI does
  // not advertise local-only monthly/yearly/lifetime prices as purchasable.
  plans() { return []; },
  async checkout(_planId, email) {
    const response = await fetch(workerApiUrl('stripe-checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: window.location.origin,
        ...(email ? { email } : {}),
        locale: store.load<'en' | 'ru'>('ifs.lang', 'en') === 'ru' ? 'ru' : 'en',
      }),
    });
    const data = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      throw new Error(data.error ?? `Stripe checkout failed (${response.status})`);
    }
    window.location.assign(data.url);
    return { ok: true, verified: false };
  },
  isPremium() { return cachedPremium; },
  async restore() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('stripe');
    const sessionId = params.get('session_id');
    if (status !== 'success' || !sessionId) {
      if (status === 'cancel') clearStripeQuery();
      return cachedPremium;
    }

    try {
      const response = await fetch(`${VERIFY_URL}?session_id=${encodeURIComponent(sessionId)}`);
      if (!response.ok) return cachedPremium;
      const result = await response.json() as { status?: string };
      if (result.status === 'complete') {
        setPremium(true);
        return true;
      }
      if (result.status === 'open' || result.status === 'expired') setPremium(false);
      return cachedPremium;
    } catch {
      return cachedPremium;
    } finally {
      clearStripeQuery();
    }
  },
};

export const setPremiumOn = setPremium;
