import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { RehearsalPanel, REHEARSAL_KEY } from './e10-rehearsal.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(RehearsalPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
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

describe('E10 rehearsal panel', () => {
  it('will not start a rehearsal until the person opts in', () => {
    render();
    act(() => button('Start rehearsal').click());
    expect(host?.textContent).toContain('Tick the box first');
    expect(store.load(REHEARSAL_KEY, null)).toBeNull();
  });

  it('labels every rehearsal hypothetical and lets the person choose a path', () => {
    render();
    act(() => (host!.querySelector('input[type="checkbox"]') as HTMLInputElement).click());
    act(() => button('Start rehearsal').click());
    expect(host?.textContent).toContain('Hypothetical');
    const choices = host!.querySelectorAll('[role="group"] button');
    expect(choices.length).toBeGreaterThan(0);
    act(() => (choices[0] as HTMLButtonElement).click());
    expect(host?.textContent).toContain('Hypothetical');
    expect((store.load(REHEARSAL_KEY, null) as { steps: unknown[] }).steps.length).toBe(1);
  });
});
