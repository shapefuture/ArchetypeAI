import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEED_PARTS } from '../pal/traits';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/ai.adapter.ts', () => ({ AI: { archetypeCreate: vi.fn(async () => '{"title":"New guide","family":"resource"}') } }));
vi.mock('../core/therapist-link.ts', () => ({ claimTherapistLink: vi.fn(), linkedClients: vi.fn(), setClientArchived: vi.fn(), assignExercise: vi.fn() }));
vi.mock('../core/booking.ts', () => ({ ensureTherapistBusySlots: vi.fn(), getTherapistProfile: vi.fn(), therapistAppointments: vi.fn(), setAppointmentStatus: vi.fn() }));

import { Innerverse } from './innerverse.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function createContext() {
  const setParts = vi.fn();
  const setSheet = vi.fn();
  const downloadBackup = vi.fn();
  const setDimensions = vi.fn();
  return {
    t: (key: string) => ({
      summon: 'Search parts', uniAll: 'All parts', uniClusters: 'Clusters', uniStories: 'Stories',
      universe: 'Universe', filters: 'Filters', energy: 'Energy', cluster: 'Families', close: 'Close',
      compare: 'Compare', saveBackup: 'Save backup', archetype: 'Archetype Studio', synastry: 'Synastry',
      practice: 'Practice',
    }[key] ?? key),
    lang: 'en',
    parts: SEED_PARTS,
    profile: null,
    setParts,
    setSheet,
    setOverlay: vi.fn(),
    toast: vi.fn(),
    universeMode: 'parts',
    setUniverseMode: vi.fn(),
    go: vi.fn(),
    premium: true,
    openPaywall: vi.fn(),
    uniRef: { current: { setParts: vi.fn(), setDimensions } },
    uniReady: true,
    downloadBackup,
    spies: { setParts, setSheet, downloadBackup, setDimensions },
  };
}

function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(Innerverse)); });
  return host;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function click(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(text));
  expect(button, `expected a button containing “${text}”`).toBeTruthy();
  act(() => { (button as HTMLButtonElement).click(); });
}

beforeEach(() => {
  localStorage.clear();
  appMock.current = createContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('React Innerverse parity controls', () => {
  it('selects an existing search result instead of fabricating a random part', () => {
    const container = mount();
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    setInputValue(input as HTMLInputElement, 'The Planner');
    expect(container.textContent).toContain('The Planner');
    click(container, 'The Planner');
    expect(appMock.current?.spies.setSheet).toHaveBeenCalledWith({ type: 'part', id: 'seed-planner' });
    expect(appMock.current?.spies.setParts).not.toHaveBeenCalled();
  });

  it('opens the explicit creation flow for an unmatched search without adding a random part', () => {
    const container = mount();
    const search = container.querySelector('input');
    setInputValue(search as HTMLInputElement, 'A newly named inner guide');
    click(container, 'Create in Archetype Studio');
    const studioInput = Array.from(container.querySelectorAll('input')).find((input) => input.value === 'A newly named inner guide');
    expect(studioInput).toBeTruthy();
    expect(appMock.current?.spies.setParts).not.toHaveBeenCalled();
  });

  it('exports the full local backup from the universe action tray', () => {
    const container = mount();
    click(container, 'Save backup');
    expect(appMock.current?.spies.downloadBackup).toHaveBeenCalledTimes(1);
  });

  it('applies saved dimensional expressions to the live scene API', () => {
    localStorage.setItem('ifs.universe.dimensions.v1', JSON.stringify({ AGENCY: 0.6, TEMPERATURE: 0, FOCUS: -0.2, ATTACHMENT: 0 }));
    const container = mount();
    const setDimensions = appMock.current?.spies.setDimensions;
    expect(setDimensions).toHaveBeenCalledWith({ AGENCY: 0.6, TEMPERATURE: 0, FOCUS: -0.2, ATTACHMENT: 0 });
    expect(appMock.current?.uniRef.current.setParts).toHaveBeenCalledWith(SEED_PARTS);
    expect(container).toBeTruthy();
  });
});
