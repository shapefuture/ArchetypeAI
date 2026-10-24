// Stripe billing adapter backed by the existing Cloudflare Worker routes.
// The Worker owns product/price configuration; the client never collects
// card details and only caches a session after server verification.
import type { BILLING_PORT } from './ports';
import { store, KEYS } from './local-store';
import { workerApiUrl } from './api';
import { auth, getFirebaseIdToken, getFirebaseIdentity } from './auth.service';

const VERIFY_URL = workerApiUrl('stripe-verify');
type Receipt = { uid: string; sessionId: string; verifiedAt: number };
let receipt = store.load<Receipt | null>(KEYS.billing, null);
let cachedPremium = !!receipt?.uid && receipt.uid === auth.currentUser()?.uid && Date.now() - receipt.verifiedAt < 24 * 3_600_000;
let verificationVersion = 0;

function clearStripeQuery() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('stripe') && !url.searchParams.has('session_id')) return;
  url.searchParams.delete('stripe');
  url.searchParams.delete('session_id');
  // Keep the current history state: it marks the Back/Forward entry the person is on (see navigation-history.ts).
  window.history.replaceState(window.history.state, '', url.pathname + (url.search || '') + url.hash);
}

function setPremium(on: boolean) {
  cachedPremium = on;
  if (!on) { receipt = null; store.remove(KEYS.billing); }
  else if (receipt) store.save(KEYS.billing, receipt);
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
    const idToken = await getFirebaseIdToken();
    const response = await fetch(workerApiUrl('stripe-checkout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
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
  isPremium() { return cachedPremium && !!receipt && receipt.uid === auth.currentUser()?.uid && Date.now() - receipt.verifiedAt < 24 * 3_600_000; },
  async restore() {
    const version = ++verificationVersion;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('stripe');
    const sessionId = params.get('session_id');
    if (status === 'cancel') clearStripeQuery();
    const savedSession = receipt?.uid && receipt.uid === auth.currentUser()?.uid ? receipt.sessionId : null;
    const candidate = status === 'success' && sessionId ? sessionId : savedSession;
    if (!candidate) { setPremium(false); return false; }

    try {
      const identity = await getFirebaseIdentity();
      const response = await fetch(`${VERIFY_URL}?session_id=${encodeURIComponent(candidate)}`, {
        headers: { Authorization: `Bearer ${identity.token}` },
      });
      // The server knows this session and it is not ours or not paid: drop the receipt.
      // A server or network failure keeps the cached state, so offline use still works.
      if (response.status === 400 || response.status === 404) { setPremium(false); return false; }
      if (!response.ok) return this.isPremium();
      const result = await response.json() as { status?: string };
      if (version !== verificationVersion || auth.currentUser()?.uid !== identity.uid) return false;
      if (result.status === 'complete') {
        receipt = { uid: identity.uid, sessionId: candidate, verifiedAt: Date.now() };
        setPremium(true);
        return true;
      }
      setPremium(false);
      return false;
    } catch {
      return this.isPremium();
    } finally {
      clearStripeQuery();
    }
  },
};

export const setPremiumOn = setPremium;
