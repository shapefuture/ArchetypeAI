import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t as translate } from '../i18n/strings.ts';
import { SEED_PARTS } from '../pal/traits.ts';
import { scoreSystem } from '../core/scoring-v2.ts';
import { markSample } from '../core/assessment-routes.ts';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { Intro, Onboarding } from './landing.jsx';
import { takeFocusRequest } from '../core/focus-request.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (key: string) => translate(key, 'en');
let root: Root | null = null;
let host: HTMLDivElement | null = null;

function sampleProfile() {
  const parts = [{ id: 'p1', name: 'One', family: 'manager' }, { id: 'p2', name: 'Two', family: 'exile' }] as any;
  const scored = scoreSystem({ somatic: { p1: { intensity: 4, felt: 'mid' }, p2: { intensity: 2, felt: 'low' } }, statements: [5, 5, 5], parts });
  return markSample({ ...scored, headlineConstellation: 'Zebra Lantern Fixture' });
}

function mountBase({ profile = null as any, premium = false } = {}) {
  appMock.current = {
    t, lang: 'en', dockTab: 'base', setDockTab: vi.fn(), go: vi.fn(), setOverlay: vi.fn(), setSheet: vi.fn(),
    profile, parts: SEED_PARTS, premium, theme: 'light', setTheme: vi.fn(), setLang: vi.fn(), user: null, toast: vi.fn(),
    openSky: vi.fn(), openPaywall: vi.fn(), uniRef: { current: null }, setParts: vi.fn(),
  };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(Intro)); });
  return host;
}

function findButton(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(text));
  expect(button, `expected a button containing “${text}”`).toBeTruthy();
  return button as HTMLButtonElement;
}

function press(container: ParentNode, text: string) {
  const button = findButton(container, text);
  act(() => { button.click(); });
  return button;
}

beforeEach(() => {
  localStorage.clear();
  appMock.current = null;
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('Base tab assessment entries', () => {
  it('offers the three routes side by side in order, with limited tools listed separately', () => {
    const container = mountBase();
    const text = container.textContent ?? '';
    const at = (fragment: string) => text.indexOf(fragment);
    expect(at('Think through one situation')).toBeGreaterThan(-1);
    expect(at('Think through one situation')).toBeLessThan(at('Take the 64-item reflection'));
    expect(at('Take the 64-item reflection')).toBeLessThan(at('Start the full 147-item map'));
    expect(at('Start the full 147-item map')).toBeLessThan(at('Other tools'));
    expect(at('Other tools')).toBeLessThan(at('Sample map'));
  });

  it('opens the situation inquiry as its own route in the check-in layer, focused on arrival', () => {
    mountBase();
    const inquiry = findButton(host!, 'Think through one situation');
    expect(inquiry.getAttribute('aria-disabled')).not.toBe('true');
    expect(inquiry.textContent).not.toContain('Not available in this version yet');
    press(host!, 'Think through one situation');
    expect(appMock.current!.setOverlay).toHaveBeenLastCalledWith('checkin');
    expect(appMock.current!.go).not.toHaveBeenCalled();
    expect(takeFocusRequest('situation-inquiry')).toBe(true);
  });

  it('opens the 64-item and 147-item routes as separate destinations that do not name each other', () => {
    mountBase();
    const reflection = findButton(host!, 'Take the 64-item reflection');
    const battery = findButton(host!, 'Start the full 147-item map');
    expect(reflection.textContent).not.toContain('147');
    expect(battery.textContent).not.toContain('64');
    press(host!, 'Take the 64-item reflection');
    expect(appMock.current!.go).toHaveBeenLastCalledWith('legacy-assessment');
    press(host!, 'Start the full 147-item map');
    expect(appMock.current!.go).toHaveBeenLastCalledWith('full-assessment');
  });

  it('opens the sample map and quick scan only from other tools', () => {
    mountBase();
    press(host!, 'Sample map');
    expect(appMock.current!.go).toHaveBeenLastCalledWith('assessment');
    press(host!, 'Quick scan');
    expect(appMock.current!.setOverlay).toHaveBeenLastCalledWith('quickscan');
  });

  it('keeps booking and coaching reachable on a fresh install with no assessment', () => {
    mountBase();
    expect(findButton(host!, 'Book a session')).toBeTruthy();
    press(host!, 'Book a session');
    expect(appMock.current!.setOverlay).toHaveBeenLastCalledWith('booking');
    press(host!, 'AI Coach');
    expect(appMock.current!.setOverlay).toHaveBeenLastCalledWith('paywall');
  });

  it('opens coaching directly for a premium account without any assessment', () => {
    mountBase({ premium: true });
    press(host!, 'AI Coach');
    expect(appMock.current!.setOverlay).toHaveBeenLastCalledWith('coach');
  });

  it('never presents a sample as the personal constellation', () => {
    const profile = sampleProfile();
    mountBase({ profile });
    const text = host!.textContent ?? '';
    expect(text).toContain('Sample · not your result');
    expect(text).toContain('Sample map, not yet your result');
    expect(text).not.toContain('Zebra Lantern Fixture');
  });

  it('labels the built-in example cast and shows none of its invented energy bars', () => {
    mountBase();
    const labels = Array.from(host!.querySelectorAll('.chip')).filter((chip) => chip.textContent === 'Example');
    expect(labels).toHaveLength(6);
  });
});

describe('onboarding exits', () => {
  it('Skip and the final step both land on the Base tab, not directly in the 147-item battery', () => {
    appMock.current = { t, lang: 'en', go: vi.fn(), setDockTab: vi.fn() };
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root?.render(React.createElement(Onboarding)); });
    press(host, 'Skip');
    expect(appMock.current.setDockTab).toHaveBeenLastCalledWith('base');
    expect(appMock.current.go).toHaveBeenLastCalledWith('intro');
    expect(appMock.current.go).not.toHaveBeenCalledWith('full-assessment');
    expect(localStorage.getItem('ifs.onboarded')).toBe('true');
  });

  it('the last onboarding step offers the route choice rather than starting the battery', () => {
    appMock.current = { t, lang: 'en', go: vi.fn(), setDockTab: vi.fn() };
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root?.render(React.createElement(Onboarding)); });
    press(host, 'Next');
    press(host, 'Next');
    press(host, 'Choose how to begin');
    expect(appMock.current.go).toHaveBeenLastCalledWith('intro');
    expect(appMock.current.go).not.toHaveBeenCalledWith('full-assessment');
  });
});
