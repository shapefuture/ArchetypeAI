import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { FeedbackPanel, FEEDBACK_PREF_KEY } from './e09-feedback.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(FeedbackPanel)));
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

describe('E09 feedback panel', () => {
  it('shows the catalogue line only after the person confirms an action, and never a score', () => {
    render();
    expect(host?.querySelector('[role="status"]')).toBeNull();
    act(() => button('I revised the plan').click());
    expect(host?.textContent).toContain('You revised this plan.');
    expect(host?.textContent).not.toMatch(/score|points|streak/i);
  });

  it('dismisses the line and keeps it out of the next screen', () => {
    render();
    act(() => button('I chose to rest').click());
    expect(host?.textContent).toContain('Resting is a complete choice');
    act(() => button('Dismiss').click());
    expect(host?.textContent).not.toContain('Resting is a complete choice');
  });

  it('shows no feedback and no action buttons when the person turns it off', () => {
    render();
    act(() => button('Off').click());
    expect(store.load(FEEDBACK_PREF_KEY, null)).toEqual({ mode: 'off' });
    expect(Array.from(host!.querySelectorAll('button')).some((b) => b.textContent === 'I revised the plan')).toBe(false);
  });
});
