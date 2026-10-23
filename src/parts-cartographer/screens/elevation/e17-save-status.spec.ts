import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { SaveStatusPanel, NOTE_DRAFT_KEY } from './e17-save-status.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(SaveStatusPanel)));
}

function type(value: string) {
  const textarea = host!.querySelector('textarea') as HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(textarea, value);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
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

describe('E17 save status panel', () => {
  it('says "not saved yet" after an edit and "saved" only after the value reads back', () => {
    render();
    type('Something to keep');
    expect(host?.textContent).toContain('Not saved yet');
    act(() => (host!.querySelector('button') as HTMLButtonElement).click());
    expect(host?.textContent).toContain('Saved on this device');
    expect((store.load(NOTE_DRAFT_KEY, null) as { text: string }).text).toBe('Something to keep');
  });

  it('keeps the text and says it is not saved when the write cannot be confirmed', () => {
    render();
    type('Kept on screen');
    const original = store.save;
    store.save = () => {};
    try {
      act(() => (host!.querySelector('button') as HTMLButtonElement).click());
    } finally {
      store.save = original;
    }
    expect(host?.textContent).toContain('could not be confirmed');
    expect((host!.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Kept on screen');
  });
});
