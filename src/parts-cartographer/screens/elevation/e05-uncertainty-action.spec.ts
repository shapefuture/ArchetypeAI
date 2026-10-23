import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { UNCERTAINTY_KEY, UncertaintyPanel } from './e05-uncertainty-action.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(UncertaintyPanel)));
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

describe('E05 uncertainty panel', () => {
  it('says plainly that no action is offered while nothing has a reviewed record', () => {
    render();
    expect(host?.textContent).toContain('No action is offered yet');
    expect(host?.textContent).toContain('No explanation yet');
  });

  it('saves the person\'s own explanation and keeps it labelled as their wording', () => {
    render();
    const textarea = host!.querySelector('textarea') as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    act(() => {
      setter.call(textarea, 'Maybe I was tired');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === 'Add explanation')!.click());
    const saved = store.load(UNCERTAINTY_KEY, null) as { readings: Array<{ text: string; kind: string }> };
    expect(saved.readings[0]).toMatchObject({ text: 'Maybe I was tired', kind: 'user-authored' });
  });

  it('does not replace stored notes it cannot read', () => {
    store.save(UNCERTAINTY_KEY, { revision: 'broken' });
    render();
    expect(host?.textContent).toContain('could not be read');
    expect(store.load(UNCERTAINTY_KEY, null)).toEqual({ revision: 'broken' });
  });
});
