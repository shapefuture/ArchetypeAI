import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const authMock = vi.hoisted(() => ({ send: vi.fn(), refresh: vi.fn() }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/auth.service', () => ({ sendVerificationEmail: authMock.send, refreshEmailVerification: authMock.refresh }));

import { EmailVerifyNotice } from './email-verify-notice.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(user: Record<string, unknown> | null) {
  appMock.current = { lang: 'en', user, setUser: vi.fn() };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(EmailVerifyNotice)));
}
const button = (label: RegExp) => Array.from(host!.querySelectorAll('button')).find((b) => label.test(b.textContent ?? ''))!;

beforeEach(() => { authMock.send.mockReset(); authMock.refresh.mockReset(); });
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; });

describe('email verification notice', () => {
  it('stays hidden for verified, anonymous or signed-out users', () => {
    for (const user of [null, { linked: false, email: null }, { linked: true, email: 'a@example.com', emailVerified: true }]) {
      render(user);
      expect(host!.textContent).toBe('');
      act(() => root?.unmount()); host?.remove();
    }
    root = null; host = null;
  });

  it('explains why an unverified therapist is not found, and sends the email', async () => {
    render({ linked: true, email: 'dr@example.com', emailVerified: false });
    expect(host!.textContent).toContain('dr@example.com is not verified yet');
    await act(async () => { button(/Send verification email/).click(); });
    expect(authMock.send).toHaveBeenCalledOnce();
    expect(host!.textContent).toContain('Sent.');
  });

  it('updates the signed-in user after a successful check, and says when it is still unverified', async () => {
    render({ linked: true, email: 'dr@example.com', emailVerified: false });
    authMock.refresh.mockResolvedValueOnce({ linked: true, email: 'dr@example.com', emailVerified: false });
    await act(async () => { button(/check again/).click(); });
    expect(host!.textContent).toContain('Not verified yet');
    const verified = { linked: true, email: 'dr@example.com', emailVerified: true };
    authMock.refresh.mockResolvedValueOnce(verified);
    await act(async () => { button(/check again/).click(); });
    expect(appMock.current!.setUser).toHaveBeenLastCalledWith(verified);
  });

  it('reports a failure without throwing', async () => {
    render({ linked: true, email: 'dr@example.com', emailVerified: false });
    authMock.send.mockRejectedValueOnce(new Error('offline'));
    await act(async () => { button(/Send verification email/).click(); });
    expect(host!.textContent).toContain('That did not work');
  });
});
