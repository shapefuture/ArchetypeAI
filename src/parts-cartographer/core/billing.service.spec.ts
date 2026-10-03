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
    window.history.replaceState(null, '', '/?stripe=success&session_id=cs_test&keep=1#report');
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ status: 'complete' }) }));
    vi.stubGlobal('fetch', fetch);
    const { billing } = await import('./billing.service');
    expect(await billing.restore()).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/stripe-verify?session_id=cs_test', { headers: { Authorization: 'Bearer token' } });
    expect(billing.isPremium()).toBe(true);
    expect(window.location.search).toBe('?keep=1');
    expect(window.location.hash).toBe('#report');
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
  it('expires an offline receipt even if the tab stays open', async () => {
    vi.useFakeTimers();
    localStorage.setItem('ifs.billing.verified.v2', JSON.stringify({ uid: 'owner', sessionId: 'cs_old', verifiedAt: Date.now() }));
    const { billing } = await import('./billing.service');
    expect(billing.isPremium()).toBe(true);
    vi.advanceTimersByTime(24 * 3_600_000);
    expect(billing.isPremium()).toBe(false);
  });
});
