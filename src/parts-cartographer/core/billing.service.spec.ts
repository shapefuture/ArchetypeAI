import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const identity = vi.hoisted(() => ({ uid: 'owner', get: vi.fn() }));
vi.mock('./auth.service', () => ({
  auth: { currentUser: () => ({ uid: identity.uid }) },
  getFirebaseIdentity: identity.get,
  getFirebaseIdToken: vi.fn(async () => 'token'),
}));
vi.mock('./api', () => ({ workerApiUrl: (route: string) => `/api/${route}` }));

beforeEach(() => {
  vi.resetModules(); localStorage.clear();
  window.history.replaceState(null, '', '/');
  identity.uid = 'owner'; identity.get.mockReset().mockResolvedValue({ uid: 'owner', token: 'token' });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('account-scoped Stripe verification', () => {
  it('never grants premium from an unverified flag or another account receipt', async () => {
    localStorage.setItem('ifs.billing.verified.v2', JSON.stringify({ uid: 'other', sessionId: 'cs_old', verifiedAt: Date.now() }));
    localStorage.setItem('premium', 'true');
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { billing } = await import('./billing.service');
    expect(billing.isPremium()).toBe(false);
    expect(await billing.restore()).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('verifies callback ownership and removes only Stripe callback parameters', async () => {
    const navState = { ifsNav: 1, route: 'intro', overlay: null, sheet: null, from: null };
    window.history.replaceState(navState, '', '/?stripe=success&session_id=cs_test&keep=1#report');
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ status: 'complete' }) }));
    vi.stubGlobal('fetch', fetch);
    const { billing } = await import('./billing.service');
    expect(await billing.restore()).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/stripe-verify?session_id=cs_test', { headers: { Authorization: 'Bearer token' } });
    expect(billing.isPremium()).toBe(true);
    expect(window.location.search).toBe('?keep=1');
    expect(window.location.hash).toBe('#report');
    expect(window.history.state).toEqual(navState);
    identity.uid = 'other'; expect(billing.isPremium()).toBe(false);
  });
  it('ignores a verification that finishes after account switching', async () => {
    window.history.replaceState(null, '', '/?stripe=success&session_id=cs_test');
    let finish!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { finish = resolve; })));
    const { billing } = await import('./billing.service');
    const restoring = billing.restore();
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    identity.uid = 'other';
    window.history.replaceState(null, '', '/');
    expect(await billing.restore()).toBe(false);
    finish({ ok: true, json: async () => ({ status: 'complete' }) });
    expect(await restoring).toBe(false);
    expect(localStorage.getItem('ifs.billing.verified.v2')).toBeNull();
  });
  it('drops a saved receipt the server rejects or reports inactive, but keeps it through a network failure', async () => {
    const saved = JSON.stringify({ uid: 'owner', sessionId: 'cs_live_forged', verifiedAt: Date.now() });
    for (const [answer, premium] of [
      [{ ok: false, status: 404, json: async () => ({}) }, false],
      [{ ok: true, status: 200, json: async () => ({ status: 'inactive' }) }, false],
      [{ ok: false, status: 502, json: async () => ({}) }, true],
    ] as const) {
      vi.resetModules(); localStorage.clear();
      localStorage.setItem('ifs.billing.verified.v2', saved);
      vi.stubGlobal('fetch', vi.fn(async () => answer));
      const { billing } = await import('./billing.service');
      expect(await billing.restore()).toBe(premium);
      expect(billing.isPremium()).toBe(premium);
    }
  });
  it('keeps a paid session through a failed check on return, and verifies it on the next try', async () => {
    window.history.replaceState(null, '', '/?stripe=success&session_id=cs_test_PAID123');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429, json: async () => ({}) })));
    let module = await import('./billing.service');
    expect(await module.billing.restore()).toBe(false);
    expect(window.location.search).toBe('');
    expect(JSON.parse(localStorage.getItem('ifs.billing.pending')!).sessionId).toBe('cs_test_PAID123');

    vi.resetModules();
    const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ status: 'complete' }) }));
    vi.stubGlobal('fetch', fetch);
    module = await import('./billing.service');
    expect(await module.billing.restore()).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/stripe-verify?session_id=cs_test_PAID123', expect.anything());
    expect(localStorage.getItem('ifs.billing.pending')).toBeNull();
  });
  it('expires an offline receipt even if the tab stays open', async () => {
    vi.useFakeTimers();
    localStorage.setItem('ifs.billing.verified.v2', JSON.stringify({ uid: 'owner', sessionId: 'cs_old', verifiedAt: Date.now() }));
    const { billing } = await import('./billing.service');
    expect(billing.isPremium()).toBe(true);
    vi.advanceTimersByTime(24 * 3_600_000);
    expect(billing.isPremium()).toBe(false);
  });
});
