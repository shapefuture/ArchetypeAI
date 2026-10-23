import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KEYS } from '../core/local-store.ts';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { CoordinatesPanel, coordinateStatusFor, coordinatesForPart } from './coordinates.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PARITY = 'The table, the numeric list and the text version show the same values and statuses.';

const PARTS = [
  {
    id: 'p-measured', name: 'The Planner', family: 'manager', nameEn: 'The Planner',
    archetype: { schema: 'archetype-map.v1', sourceAssessment: 'legacy64', coordinateBasis: 'response-derived-64', coordinates: [0.4, -0.2, 0.1, 0.9] },
  },
  {
    id: 'p-reference', name: 'The Guide', family: 'resource', nameEn: 'The Guide',
    archetype: { schema: 'archetype-map.v1', sourceAssessment: 'descent147', coordinateBasis: 'fixed-reference-147', coordinates: [0.1, 0.2, 0.3, 0.4] },
  },
  { id: 'p-bare', name: 'Plain part', family: 'exile', nameEn: 'Plain part' },
  {
    id: 'p-studio-zero', name: 'Studio part', family: 'firefighter', nameEn: 'Studio part',
    archetype: { schema: 'archetype-map.v1', sourceAssessment: 'studio', coordinates: [0, 0, 0, 0] },
  },
  {
    id: 'p-partial', name: 'Half part', family: 'exile', nameEn: 'Half part',
    archetype: { schema: 'archetype-map.v1', sourceAssessment: 'studio', coordinates: [0.5, 'x', 2, -0.5] },
  },
];

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(overrides: Record<string, unknown> = {}) {
  appMock.current = { t: (key: string) => key, lang: 'en', toast: vi.fn(), ...overrides };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(CoordinatesPanel)); });
  return host;
}

function choose(id: string) {
  const select = host?.querySelector<HTMLSelectElement>('select');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(select, id);
    select?.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function rowTexts() {
  return [...(host?.querySelectorAll('tbody tr') ?? [])].map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? ''));
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
});

describe('analytic coordinates panel', () => {
  it('shows the four coordinates of the first part with their statuses and agreeing projections', () => {
    mount();
    expect(rowTexts()).toEqual([
      ['Axis 1 · Agency', '0.40', 'measured'],
      ['Axis 2 · Temperature', '-0.20', 'measured'],
      ['Axis 3 · Focus', '0.10', 'measured'],
      ['Axis 4 · Attachment', '0.90', 'measured'],
    ]);
    expect(host?.querySelector('[role="status"]')?.textContent).toBe(PARITY);
  });

  it('labels a fixed reference template as reference, never as a measurement of the person', () => {
    mount();
    choose('p-reference');
    expect(rowTexts().map((row) => row[2])).toEqual(['reference', 'reference', 'reference', 'reference']);
  });

  it('shows an unknown coordinate as unknown and never fills it with zero', () => {
    mount();
    choose('p-bare');
    expect(host?.querySelectorAll('td.iv-unknown').length).toBe(4);
    expect(rowTexts().map((row) => row[1])).toEqual(['unknown', 'unknown', 'unknown', 'unknown']);
    expect(host?.textContent).not.toContain('0.00');
    expect(host?.textContent).toContain('This part has no archetype map');
  });

  it('keeps a placeholder of all zeros from a studio part unknown', () => {
    mount();
    choose('p-studio-zero');
    expect(rowTexts().map((row) => row[1])).toEqual(['unknown', 'unknown', 'unknown', 'unknown']);
  });

  it('keeps only the invalid entries unknown and leaves the valid ones in place', () => {
    mount();
    choose('p-partial');
    expect(rowTexts()).toEqual([
      ['Axis 1 · Agency', '0.50', 'derived'],
      ['Axis 2 · Temperature', 'unknown', 'unknown'],
      ['Axis 3 · Focus', 'unknown', 'unknown'],
      ['Axis 4 · Attachment', '-0.50', 'derived'],
    ]);
  });

  it('keeps the axes in their fixed order and ranks nothing', () => {
    mount();
    choose('p-partial');
    expect(rowTexts().map((row) => row[0].split(' · ')[0])).toEqual(['Axis 1', 'Axis 2', 'Axis 3', 'Axis 4']);
    expect(host?.textContent).toContain('Nothing is ranked or scored.');
  });

  it('says so plainly when there are no parts yet', () => {
    localStorage.removeItem(KEYS.parts);
    mount();
    expect(host?.textContent).toContain('No parts yet. Coordinates appear here once a part has an archetype map.');
    expect(host?.querySelector('table')).toBeNull();
  });

  it('renders Russian copy when the app is in Russian', () => {
    mount({ lang: 'ru' });
    expect(host?.querySelector('h2')?.textContent).toBe('Аналитические координаты');
    expect(host?.textContent).toContain('Ось 1 · Инициативность');
  });
});

describe('coordinate status rules', () => {
  it('maps the coordinate basis to a status and gives no status to an unknown basis', () => {
    expect(coordinateStatusFor({ coordinateBasis: 'response-derived-64' })).toBe('measured');
    expect(coordinateStatusFor({ coordinateBasis: 'fixed-reference-147' })).toBe('reference');
    expect(coordinateStatusFor({ sourceAssessment: 'studio' })).toBe('derived');
    expect(coordinateStatusFor({ sourceAssessment: 'legacy64' })).toBeNull();
    expect(coordinateStatusFor(undefined)).toBeNull();
  });

  it('returns four unknown coordinates for a part with no basis or only a placeholder', () => {
    expect(coordinatesForPart({ id: 'x' }).map((c) => c.status)).toEqual(['unknown', 'unknown', 'unknown', 'unknown']);
    expect(coordinatesForPart({ id: 'y', archetype: { sourceAssessment: 'studio', coordinates: [0, 0, 0, 0] } }).every((c) => c.value === null)).toBe(true);
  });
});
