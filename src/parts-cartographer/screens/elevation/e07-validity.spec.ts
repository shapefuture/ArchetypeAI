import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { ValidityPanel, VALIDITY_KEY } from './e07-validity.jsx';
import { MEMORY_KEY } from '../memory-panel.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(ValidityPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
}

beforeEach(() => {
  appMock.current = { lang: 'en' };
  localStorage.clear();
  store.save(MEMORY_KEY, [{ id: 'm1', text: 'Meetings feel unsafe', source: 'user-entry', derivedFrom: [], saved: true }]);
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E07 validity panel', () => {
  it('marks a saved note as still fitting and shows the label', () => {
    render();
    act(() => button('Still fits').click());
    expect(host?.textContent).toContain('Still fits');
    expect((store.load(VALIDITY_KEY, []) as unknown[]).length).toBeGreaterThan(0);
  });

  it('refuses the in-some-situations mark until the person says where or when', () => {
    render();
    const choice = button('Only in some situations');
    expect(choice.disabled).toBe(true);
  });
});
