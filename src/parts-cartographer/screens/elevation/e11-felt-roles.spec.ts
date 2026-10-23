import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { FeltRolesPanel, FELT_ROLE_KEY } from './e11-felt-roles.jsx';
import { store, KEYS } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(FeltRolesPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
}

beforeEach(() => {
  appMock.current = { lang: 'en' };
  localStorage.clear();
  store.save(KEYS.parts, [{ id: 'p1', nameEn: 'The planner', name: 'The planner' }]);
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E11 Felt roles panel', () => {
  it('lets the person give a chosen part a role, stored as their own choice', () => {
    render();
    act(() => button('The planner').click());
    act(() => button('Guardian').click());
    expect(host?.textContent).toContain('Current role: Guardian');
    expect(store.load(FELT_ROLE_KEY, null)).toEqual({ partId: 'p1', role: 'guardian' });
  });

  it('clears the role without deleting the part', () => {
    store.save(FELT_ROLE_KEY, { partId: 'p1', role: 'tender' });
    render();
    act(() => button('The planner').click());
    act(() => button('No role').click());
    expect(host?.textContent).toContain('Current role: Not set');
    expect(store.load(FELT_ROLE_KEY, null)).toBeNull();
    expect(store.load(KEYS.parts, []) as unknown[]).toHaveLength(1);
  });
});
