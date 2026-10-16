import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { CORRECTIONS_KEY, CorrectionsPanel } from './e06-corrections.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(CorrectionsPanel)));
}

function type(value: string) {
  const textarea = host!.querySelector('textarea') as HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(textarea, value);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
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

describe('E06 corrections panel', () => {
  it('records a possible reading and lets the person reject it, with a receipt that says no scores changed', () => {
    render();
    act(() => button('Possible reading').click());
    type('I was tired');
    act(() => button('Add').click());
    expect(host?.textContent).toContain('I was tired');
    act(() => button('Reject this reading').click());
    expect(host?.textContent).toContain('Rejected');
    expect(host?.textContent).toContain('No scores were changed');
  });

  it('keeps the person\'s own note and deletes it only when asked', () => {
    render();
    type('My own wording');
    act(() => button('Add').click());
    expect(host?.textContent).toContain('My own wording');
    act(() => button('Delete').click());
    expect(host?.textContent).not.toContain('My own wording');
  });

  it('does not replace stored corrections it cannot read', () => {
    store.save(CORRECTIONS_KEY, { revision: 'bad' });
    render();
    expect(host?.textContent).toContain('could not be read');
    expect(store.load(CORRECTIONS_KEY, null)).toEqual({ revision: 'bad' });
  });
});
