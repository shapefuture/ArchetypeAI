import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { PresentationPanel, PRESENTATION_KEY } from './e12-presentation.jsx';
import { store, KEYS } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(PresentationPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
}

beforeEach(() => {
  appMock.current = { lang: 'en' };
  localStorage.clear();
  store.save(KEYS.parts, [{ id: 'p1', nameEn: 'The planner', name: 'The planner' }, { id: 'p2', nameEn: 'The protector', name: 'The protector' }]);
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E12 presentation panel', () => {
  it('shows the list on its own when WebGL is unavailable, as the presentation module decides', () => {
    render();
    expect(host?.querySelectorAll('ul li')).toHaveLength(2);
  });

  it('keeps the 3D view by default when WebGL is available, and shows the list when the person asks', () => {
    (window as unknown as Record<string, unknown>).WebGLRenderingContext = function WebGLRenderingContext() {};
    try {
      render();
      expect(host?.querySelector('ul')).toBeNull();
      act(() => button('Show as a list').click());
      expect(host?.querySelectorAll('ul li')).toHaveLength(2);
      expect(store.load(PRESENTATION_KEY, null)).toEqual({ list: true });
    } finally {
      delete (window as unknown as Record<string, unknown>).WebGLRenderingContext;
    }
  });

  it('marks the selected part in the list without changing the saved parts', () => {
    render();
    act(() => button('The protector').click());
    expect(host?.textContent).toContain('Selected');
    expect(store.load(KEYS.parts, []) as unknown[]).toHaveLength(2);
  });
});
