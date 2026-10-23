import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { SessionPrepPanel, SESSION_PREP_KEY } from './e15-session-prep.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(SessionPrepPanel)));
}

function type(index: number, value: string) {
  const input = host!.querySelectorAll('input')[index] as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
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

describe('E15 session preparation panel', () => {
  it('shows exactly the agenda the person wrote, and says what is never included', () => {
    render();
    expect(host?.textContent).toContain('Nothing would be shared yet');
    type(0, 'Feeling stuck at work');
    expect(host?.textContent).toContain('Feeling stuck at work');
    expect(host?.textContent).toContain('Never included');
    expect(host?.textContent).toContain('Your standard instrument results');
  });

  it('keeps the draft on this device and says so', () => {
    render();
    type(0, 'One thing to bring');
    expect((store.load(SESSION_PREP_KEY, null) as { items: string[] }).items[0]).toBe('One thing to bring');
    expect(host?.textContent).toContain('Saved on this device only');
  });
});
