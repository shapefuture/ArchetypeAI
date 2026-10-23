import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const app = vi.hoisted(() => ({ current: {} as Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => app.current }));

import { GuardedClientData } from './therapist-guard.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SECRET_MAP = 'Constellation headline XYZ';
let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  app.current = { lang: 'en', user: { uid: 't1', linked: true } };
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function render(client: Record<string, unknown> | null, therapistUid = 't1') {
  act(() => {
    root.render(React.createElement(GuardedClientData, {
      therapistUid,
      client: client as any,
      children: React.createElement('p', null, SECRET_MAP),
    }));
  });
}

describe('GuardedClientData', () => {
  it('renders the client map only for a linked client whose map was shared', () => {
    render({ clientUid: 'c1', archived: false, summary: { headline: 'x' } });
    expect(host.textContent).toContain(SECRET_MAP);
    expect(host.querySelector('[data-guard-reason]')).toBeNull();
  });

  it('keeps the map out of the DOM and says why, for an archived client', () => {
    render({ clientUid: 'c1', archived: true, summary: { headline: 'x' } });
    expect(host.textContent).not.toContain(SECRET_MAP);
    expect(host.querySelector('[data-guard-reason]')?.getAttribute('data-guard-reason')).toBe('archived');
    expect(host.textContent).toContain('This client is archived');
  });

  it('does not show the map for a booking-only link, and says that booking does not share it', () => {
    render({ clientUid: 'c1', archived: false, summary: null });
    expect(host.textContent).not.toContain(SECRET_MAP);
    expect(host.textContent).toContain('A booking alone does not share it');
  });

  it('shows no map when the roster entry is missing', () => {
    render(null);
    expect(host.textContent).not.toContain(SECRET_MAP);
    expect(host.querySelector('[data-guard-reason]')?.getAttribute('data-guard-reason')).toBe('no-relationship');
  });

  it('refuses when the signed-in account is not the roster therapist', () => {
    render({ clientUid: 'c1', archived: false, summary: { headline: 'x' } }, 'someone-else');
    expect(host.textContent).not.toContain(SECRET_MAP);
    expect(host.querySelector('[data-guard-reason]')?.getAttribute('data-guard-reason')).toBe('wrong-account');
  });

  it('uses the Russian copy when the app language is ru', () => {
    app.current = { lang: 'ru', user: { uid: 't1', linked: true } };
    render({ clientUid: 'c1', archived: true, summary: { headline: 'x' } });
    expect(host.textContent).toContain('Карта не показана');
    expect(host.textContent).toContain('Клиент в архиве');
  });
});
