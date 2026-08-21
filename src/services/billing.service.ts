import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../environments/environment';

/** localStorage key caching the verified-subscription flag. */
export const SUBSCRIPTION_STORAGE_KEY = 'INNERVERSE_SUB_V1';

/**
 * Payload for POST /api/stripe-checkout. Pure builder (unit-tested without
 * any browser navigation) — the service only adds fetch + redirect.
 */
export interface CheckoutRequestBody {
  origin: string;
  email?: string;
  locale: 'ru' | 'en';
}

/** Map the document language to a Stripe-supported checkout locale. */
export function detectStripeLocale(doc: Document = document): 'ru' | 'en' {
  return (doc.documentElement.lang || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

/** Build the checkout request payload. Pure, testable. */
export function buildCheckoutRequest(
  email: string | undefined,
  origin: string = window.location.origin,
  doc: Document = document,
): CheckoutRequestBody {
  const body: CheckoutRequestBody = {
    origin,
    locale: detectStripeLocale(doc),
  };
  if (email) {
    body.email = email;
  }
  return body;
}

/** Derive the verify endpoint from the checkout endpoint. */
export function deriveVerifyUrl(checkoutUrl: string): string {
  return checkoutUrl.replace('checkout', 'verify');
}

/**
 * Stripe subscription billing for the Innerverse PWA.
 *
 * - `startCheckout(email?)` creates a Checkout Session on the worker and
 *   redirects the browser to the hosted Stripe page.
 * - After the redirect back with `?stripe=success&session_id=...`, the
 *   service verifies the session with the worker and caches the flag in
 *   localStorage (`INNERVERSE_SUB_V1` = 'active').
 *
 * The localStorage flag is a UX cache, NOT a security boundary — the worker
 * re-verifies the session with Stripe on every /api/stripe-verify call.
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  readonly subscription = signal<'none' | 'active' | 'unknown'>('none');
  readonly active = computed(() => this.subscription() === 'active');

  constructor() {
    // Restore cached state, then verify if we were redirected back from
    // Stripe with a success flag + session id in the URL.
    if (this.readCachedActive()) {
      this.subscription.set('active');
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'success' && params.get('session_id')) {
      void this.verifySession(params.get('session_id')!);
    }
  }

  /**
   * Create a Checkout Session and navigate to Stripe. `email` is optional
   * (prefills the payment form); no auth imports — callers pass what they
   * have.
   */
  async startCheckout(email?: string): Promise<void> {
    const res = await fetch(environment.stripeApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCheckoutRequest(email)),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      throw new Error(data.error ?? `Stripe checkout failed (${res.status})`);
    }
    window.location.href = data.url;
  }

  /**
   * Verify a Checkout Session with the worker. On `complete`, mark the
   * subscription active and persist the flag. The `?stripe=...&session_id=`
   * query params are cleared from the address bar either way.
   */
  async verifySession(sessionId: string): Promise<void> {
    try {
      const res = await fetch(
        `${deriveVerifyUrl(environment.stripeApiUrl)}?session_id=${encodeURIComponent(sessionId)}`,
      );
      if (!res.ok) {
        this.subscription.set('unknown');
        return;
      }
      const data = await res.json() as {
        status?: 'complete' | 'open' | 'expired';
        customer?: string | null;
        subscription?: string | null;
      };
      if (data.status === 'complete') {
        this.subscription.set('active');
        try {
          localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, 'active');
        } catch {
          // Private mode / storage disabled — the signal alone is enough.
        }
      } else if (data.status === 'open' || data.status === 'expired') {
        this.subscription.set('none');
      } else {
        this.subscription.set('unknown');
      }
    } catch {
      this.subscription.set('unknown');
    } finally {
      this.clearStripeQueryParams();
    }
  }

  private readCachedActive(): boolean {
    try {
      return localStorage.getItem(SUBSCRIPTION_STORAGE_KEY) === 'active';
    } catch {
      return false;
    }
  }

  private clearStripeQueryParams(): void {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('stripe') && !url.searchParams.has('session_id')) {
      return;
    }
    url.searchParams.delete('stripe');
    url.searchParams.delete('session_id');
    window.history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
  }
}
