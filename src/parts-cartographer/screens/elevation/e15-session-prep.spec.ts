import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { SessionPrepPanel, SESSION_PREP_KEY } from './e15-session-prep.jsx';
import { store } from '../../core/local-store';
import { NOT_INCLUDED } from '../../elevation/e15-session-continuity';

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

/** The label each never-included category shows in each language, as the panel copy has it. */
const NEVER_INCLUDED_LABELS = {
  en: {
    'canonical-measurement': 'Your standard instrument results',
    'coach-context': 'Coach conversations',
    'general-journal': 'Your general journal',
    'parts-two-result': 'Your Parts map 2.0 result',
  },
  ru: {
    'canonical-measurement': 'Результаты стандартных инструментов',
    'coach-context': 'Разговоры с ИИ-коучем',
    'general-journal': 'Ваш общий дневник',
    'parts-two-result': 'Ваш результат «Карта частей 2.0»',
  },
} as const;

describe('E15 session preparation panel', () => {
  it('shows exactly the agenda the person wrote, and says what is never included', () => {
    render();
    expect(host?.textContent).toContain('Nothing would be shared yet');
    type(0, 'Feeling stuck at work');
    expect(host?.textContent).toContain('Feeling stuck at work');
    expect(host?.textContent).toContain('Never included');
    expect(host?.textContent).toContain('Your standard instrument results');
  });

  it.each(['en', 'ru'] as const)('shows the label of every never-included category in the %s panel', (lang) => {
    appMock.current = { lang };
    render();
    for (const key of NOT_INCLUDED) expect(host?.textContent).toContain(NEVER_INCLUDED_LABELS[lang][key]);
  });

  it('keeps the draft on this device and says so', () => {
    render();
    type(0, 'One thing to bring');
    expect((store.load(SESSION_PREP_KEY, null) as { items: string[] }).items[0]).toBe('One thing to bring');
    expect(host?.textContent).toContain('Saved on this device only');
  });
});
