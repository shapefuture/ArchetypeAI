import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { Chemistry } from './cabinet.jsx';
import { SEED_PARTS } from '../pal/traits.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const part = (family: string, id: string, energy: number) => ({ ...SEED_PARTS.find((p) => p.family === family)!, id, energy });

/** Pick `first` (preselected), add `second`, press run, and read the tension shown in the result. */
function runPair(first: any, second: any): number {
  appMock.current = { t: (k: string) => k, lang: 'en', parts: [first, second], setSheet: () => {}, premium: true, openPaywall: () => {} };
  act(() => { root.render(React.createElement(Chemistry, { from: first.id })); });
  const cards = Array.from(host.querySelectorAll('button.part-card')) as HTMLButtonElement[];
  act(() => { cards[1].click(); });
  const run = host.querySelector('button.btn.primary') as HTMLButtonElement;
  act(() => { run.click(); });
  act(() => { vi.advanceTimersByTime(800); });
  const shown = Array.from(host.querySelectorAll('div')).find((d) => d.style.fontSize === '30px');
  return parseInt(shown!.textContent!, 10);
}

/** The same flow as runPair, reading what the result card shows: its figure, its bar, and its text. */
function runPairCard(first: any, second: any) {
  appMock.current = { t: (k: string) => k, lang: 'en', parts: [first, second], setSheet: () => {}, premium: true, openPaywall: () => {} };
  act(() => { root.render(React.createElement(Chemistry, { from: first.id })); });
  const cards = Array.from(host.querySelectorAll('button.part-card')) as HTMLButtonElement[];
  act(() => { cards[1].click(); });
  act(() => { (host.querySelector('button.btn.primary') as HTMLButtonElement).click(); });
  act(() => { vi.advanceTimersByTime(800); });
  const figure = Array.from(host.querySelectorAll('div')).find((d) => d.style.fontSize === '30px');
  return { figure: figure?.textContent, bar: host.querySelector('.bar'), text: host.textContent ?? '' };
}

describe('Chemistry with an unknown energy (G39)', () => {
  it('shows unknown, with no bar and the neutral advice, when either energy is unknown', () => {
    const unknownExile = { ...part('exile', 'e', 45), archetype: { levelKnown: false } };
    const card = runPairCard(part('manager', 'm', 60), unknownExile);
    expect(card.figure).toBe('unknown');
    expect(card.bar).toBeNull();
    expect(card.text).toContain('The tension needs a known energy for both parts.');
  });
});

describe('critic: Chemistry tension stays on 0..100 and does not wrap', () => {
  it('control: two mid-energy parts from different families give the plain formula', () => {
    expect(runPair(part('manager', 'm', 60), part('exile', 'e', 60))).toBe(Math.round(60 * 1.15) + 8);
  });

  it('two high-energy parts from different families read as high tension, not near zero', () => {
    const tension = runPair(part('manager', 'm', 90), part('exile', 'e', 90));
    expect(tension).toBeGreaterThanOrEqual(90);
  });
});
