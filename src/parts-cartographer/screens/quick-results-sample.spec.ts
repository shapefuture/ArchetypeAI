import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t as translate } from '../i18n/strings.ts';
import { scoreSystem } from '../core/scoring-v2.ts';
import { markSample } from '../core/assessment-routes.ts';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { QuickResults } from './assessment.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (key: string) => translate(key, 'en');
let root: Root | null = null;
let host: HTMLDivElement | null = null;

function eightPartSample(profile: Record<string, unknown> = {}) {
  const parts = Array.from({ length: 8 }, (_, index) => ({
    id: `generated-${index}`, name: `Generated ${index}`, family: ['manager', 'firefighter', 'exile', 'resource'][index % 4],
  })) as any;
  const somatic = Object.fromEntries(parts.map((part: any, index: number) => [part.id, { intensity: (index % 5) + 1, felt: 'mid' }]));
  const scored = scoreSystem({ somatic, statements: [5, 4, 6], parts });
  return { ...scored, headlineConstellation: 'Zebra Lantern Fixture', ...profile };
}

function mount(profile: Record<string, unknown>) {
  appMock.current = {
    t, lang: 'en', go: vi.fn(), setOverlay: vi.fn(), setSheet: vi.fn(), premium: false, openPaywall: vi.fn(),
    toast: vi.fn(), parts: [], profile,
  };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(QuickResults)); });
  return host;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('eight-part sample results', () => {
  it('labels a sample as a sample, hides the template essay, and offers no share action', () => {
    const container = mount(markSample(eightPartSample()));
    const text = container.textContent ?? '';
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Sample · not your result');
    expect(text).toContain('Illustrative label');
    expect(text).not.toContain('Your system protects before it permits');
    expect(text).not.toContain('Dominant family');
    const buttons = Array.from(container.querySelectorAll('button')).map((button) => button.textContent ?? '');
    expect(buttons.some((label) => label.includes('Share'))).toBe(false);
  });

  it('treats an unmarked eight-part profile (older history copy) as a sample too', () => {
    const container = mount(eightPartSample());
    expect(container.textContent).toContain('Sample · not your result');
    expect(container.textContent).not.toContain('Your system protects before it permits');
  });
});
