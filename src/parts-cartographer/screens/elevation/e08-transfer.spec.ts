import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { TransferPanel, TRANSFER_KEY } from './e08-transfer.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(TransferPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
}

function type(label: string, value: string) {
  const input = Array.from(host!.querySelectorAll('input')).find((el) => el.closest('label')?.textContent?.startsWith(label)) as HTMLInputElement;
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

describe('E08 transfer panel', () => {
  it('records an unaided recall, and nothing locks afterwards', () => {
    render();
    type('The step', 'Pause before answering');
    act(() => button('Start a recall').click());
    act(() => button('I remembered it').click());
    expect(host?.textContent).toContain('Recalled');
    expect(button('Give me a cue').disabled).toBe(false);
    expect((store.load(TRANSFER_KEY, null) as { session: { events: string[] } }).session.events).toEqual(['attempt-recalled']);
  });

  it('keeps an adaptation written in the person\'s own words, tied to the step', () => {
    render();
    type('The step', 'Pause before answering');
    act(() => button('Start a recall').click());
    type('The real situation', 'Team call on Monday');
    type('What you will do', 'Take one breath before speaking');
    act(() => button('Save this adaptation').click());
    expect(host?.textContent).toContain('Team call on Monday: Take one breath before speaking');
  });

  it('does not replace stored practice it cannot read', () => {
    store.save(TRANSFER_KEY, { variations: 'broken' });
    render();
    expect(host?.textContent).toContain('could not be read');
    expect(store.load(TRANSFER_KEY, null)).toEqual({ variations: 'broken' });
  });
});
