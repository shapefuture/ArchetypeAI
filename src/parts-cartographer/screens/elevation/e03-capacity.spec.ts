import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { CAPACITY_KEY, CapacityPanel } from './e03-capacity.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(CapacityPanel)));
}

function pressed(label: string): boolean {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  return found?.getAttribute('aria-pressed') === 'true';
}

beforeEach(() => {
  appMock.current = { lang: 'en' };
  localStorage.clear();
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E03 capacity panel', () => {
  it('starts at the default level and says canonical instruments are not shortened', () => {
    render();
    expect(pressed('Some')).toBe(true);
    expect(host?.textContent).toContain('Standard instruments always show their full length');
  });

  it('saves a chosen level and shows its question limit and chunk size', () => {
    render();
    act(() => Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === 'A little')!.click());
    expect(store.load(CAPACITY_KEY, null)).toBe('low');
    expect(host?.textContent).toContain('Up to 1 question at a time');
    expect(host?.textContent).toContain('About 8 items per screen');
  });

  it('reads an unknown stored level as the default instead of failing', () => {
    store.save(CAPACITY_KEY, 'extreme');
    render();
    expect(pressed('Some')).toBe(true);
  });
});
