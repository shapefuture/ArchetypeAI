import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { DISCRIMINATOR_KEY, DiscriminatorPanel } from './e04-discriminator.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(DiscriminatorPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
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

describe('E04 discriminator panel', () => {
  it('starts from the person\'s own observation and asks for two readings before any question', () => {
    render();
    const textarea = host!.querySelector('textarea') as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    act(() => {
      setter.call(textarea, 'I went quiet in the meeting.');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => button('Start').click());
    expect(host?.textContent).toContain('Add two readings to start the questions');
    expect(store.load(DISCRIMINATOR_KEY, null)).toBeTruthy();
  });

  it('asks which reading fits, with the five answers, once two readings exist', () => {
    render();
    const textarea = host!.querySelector('textarea') as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    act(() => {
      setter.call(textarea, 'Quiet in the meeting');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => button('Start').click());
    type(0, 'I was tired');
    type(1, 'I had nothing to add');
    act(() => button('Add reading').click());
    expect(host?.textContent).toContain('Which reading fits this better?');
    for (const label of ['The first', 'The second', 'Both fit', 'It depends', 'Neither fits']) {
      expect(button(label)).toBeTruthy();
    }
    act(() => button('It depends').click());
    expect(store.load(DISCRIMINATOR_KEY, null)).toBeTruthy();
  });
});
