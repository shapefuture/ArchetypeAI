import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KEYS } from '../core/local-store.ts';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { InnerNegotiation, NEGOTIATION_KEY, normalizeNegotiation, readNegotiationParts } from './negotiation.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OPEN = 'Still open. Each part can answer when it is ready.';
const PARTIAL = 'Some parts agreed. Others declined or are still open. This is a valid place to stop.';
const ALL_AGREED = 'All parts have agreed to this move for now.';

const PARTS = [
  { id: 'p-plan', name: 'The Planner', family: 'manager', nameEn: 'The Planner' },
  { id: 'p-alarm', name: 'The Alarm', family: 'firefighter', nameEn: 'The Alarm' },
];

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(overrides: Record<string, unknown> = {}) {
  appMock.current = { t: (key: string) => key, lang: 'en', toast: vi.fn(), ...overrides };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(InnerNegotiation)); });
  return host;
}

function click(element: HTMLElement | undefined | null) {
  act(() => { element?.click(); });
}

function buttonByText(text: string, scope: ParentNode | null = host) {
  return [...(scope?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((button) => button.textContent?.trim() === text);
}

function partChoice(name: string, label: string) {
  const group = host?.querySelector(`[role="group"][aria-label="${name}"]`);
  return buttonByText(label, group);
}

function typeInto(element: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  act(() => {
    setter?.call(element, value);
    element?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function storedRecord() {
  return JSON.parse(localStorage.getItem(NEGOTIATION_KEY) ?? 'null');
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(KEYS.parts, JSON.stringify(PARTS));
});

afterEach(() => {
  act(() => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
  vi.restoreAllMocks();
});

describe('inner negotiation', () => {
  it('starts open with the parts from the saved parts list', () => {
    mount();
    expect(host?.textContent).toContain('The Planner');
    expect(host?.textContent).toContain('The Alarm');
    expect(host?.textContent).toContain(OPEN);
    expect(host?.textContent).toContain('Agreed: 0 · Declined: 0 · Open: 2');
  });

  it('a partial outcome is a valid place to stop: one agreement and one decline never forces consensus', () => {
    mount();
    click(partChoice('The Planner', 'Agree'));
    expect(host?.textContent).toContain(OPEN);
    click(partChoice('The Alarm', 'Decline'));
    expect(host?.textContent).toContain(PARTIAL);
    expect(storedRecord().answers).toEqual({ 'p-plan': true, 'p-alarm': false });
  });

  it('reports all-agreed only when every part has agreed', () => {
    mount();
    click(partChoice('The Planner', 'Agree'));
    click(partChoice('The Alarm', 'Agree'));
    expect(host?.textContent).toContain(ALL_AGREED);
  });

  it('keeps a decline as given and changes it only when the person picks a different answer', () => {
    mount();
    click(partChoice('The Alarm', 'Decline'));
    click(partChoice('The Planner', 'Agree'));
    expect(partChoice('The Alarm', 'Decline')?.getAttribute('aria-pressed')).toBe('true');
    click(partChoice('The Alarm', 'Leave open'));
    expect(partChoice('The Alarm', 'Leave open')?.getAttribute('aria-pressed')).toBe('true');
    expect(storedRecord().answers).toEqual({ 'p-plan': true });
  });

  it('labels every hypothetical branch and refuses an empty one', () => {
    mount();
    click(buttonByText('Add hypothetical branch'));
    expect(host?.textContent).toContain('Write a sentence first.');
    expect(storedRecord()).toBeNull();

    typeInto(host?.querySelector('textarea') ?? null, 'What if the alarm stays quiet for one day?');
    click(buttonByText('Add hypothetical branch'));
    expect(host?.querySelector('.iv-hypo')?.textContent).toContain('Hypothetical');
    expect(host?.querySelector('.iv-hypo p')?.textContent).toBe('What if the alarm stays quiet for one day?');
    expect(storedRecord().branches).toEqual([{ label: 'hypothetical', text: 'What if the alarm stays quiet for one day?' }]);
  });

  it('edits the move through editMove: an empty edit keeps the previous move', () => {
    mount();
    click(buttonByText('Edit'));
    typeInto(host?.querySelector('textarea') ?? null, '   ');
    click(buttonByText('Save move'));
    expect(host?.textContent).toContain('A move needs some words, so the previous move was kept.');
    expect(storedRecord()?.move ?? '').toBe('');

    typeInto(host?.querySelector('textarea') ?? null, 'Walk for five minutes');
    click(buttonByText('Save move'));
    expect(host?.textContent).toContain('Walk for five minutes');
    expect(storedRecord().move).toBe('Walk for five minutes');
  });

  it('says there is nothing to talk with when no parts are saved', () => {
    localStorage.removeItem(KEYS.parts);
    mount();
    expect(host?.textContent).toContain('No parts to talk with yet.');
  });

  it('falls back to the parts the app shows when the saved list is corrupt, and to an empty record for corrupt answers', () => {
    localStorage.setItem(KEYS.parts, '[{');
    localStorage.setItem(NEGOTIATION_KEY, '{bad');
    mount({ parts: PARTS });
    expect(host?.textContent).toContain('The Alarm');
    expect(host?.textContent).toContain(OPEN);
  });

  it('keeps only valid answers and hypothetical branches when normalizing a stored record', () => {
    expect(normalizeNegotiation({
      move: 'Short walk',
      answers: { a: true, b: 'yes', c: false },
      branches: [{ label: 'hypothetical', text: ' ok ' }, { label: 'fact', text: 'not a branch' }, null],
    })).toEqual({ move: 'Short walk', answers: { a: true, c: false }, branches: [{ label: 'hypothetical', text: 'ok' }] });
    localStorage.removeItem(KEYS.parts);
    expect(readNegotiationParts([{ id: '', name: 'x' }, { id: 'k', name: 'Kept' }])).toEqual([{ id: 'k', name: 'Kept' }]);
  });

  it('renders Russian copy when the app is in Russian', () => {
    mount({ lang: 'ru' });
    expect(host?.querySelector('h2')?.textContent).toBe('Внутренние переговоры');
    expect(host?.textContent).toContain('Согласиться');
  });
});
