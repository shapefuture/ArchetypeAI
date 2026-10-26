// Round 23 probe (critic): the Cabinet part editor is where the person chooses a part's family (cabinet.jsx PartEditor).
// Its commit writes the draft back unchanged, so archetype.cluster keeps the cluster of the old family. The Universe cluster
// filter (innerverse.jsx) reads archetype.cluster, so the part stays listed under its old cluster until a retake.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { PartEditor } from './cabinet.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const MANAGER = {
  id: 'taskmaster',
  name: 'Taskmaster',
  nameEn: 'Taskmaster',
  nameRu: 'Таскмастер',
  family: 'manager',
  role: 'Keeps the day on schedule',
  blurb: '',
  energy: 50,
  burden: 'T 40',
  need: '',
  voice: '',
  star: false,
  since: 'from your map',
  traits: { shape: 'round', eyes: 'dot', mouth: 'smile', head: 'round', face: 'plain', color: '#00ffab', characterSeed: 7 },
  archetype: {
    schema: 'archetype-map.v1',
    sourceAssessment: 'descent147',
    coordinateBasis: 'fixed-reference-147',
    coordinates: [0, 0, 0, 0],
    cluster: 'managers',
    prominence: 40,
    size: 0.75,
    description: '',
    invitation: '',
    shadow: '',
  },
};

beforeEach(() => { localStorage.clear(); });

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
  vi.restoreAllMocks();
});

async function chooseFamilyAndSave(family: string) {
  const setParts = vi.fn();
  appMock.current = {
    t: (key: string) => key,
    lang: 'en',
    parts: [MANAGER],
    setParts,
    setSheet: vi.fn(),
    toast: vi.fn(),
  };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(PartEditor, { part: MANAGER })); });
  const select = host.querySelector('select.drop') as HTMLSelectElement | null;
  expect(select, 'family select').toBeTruthy();
  await act(async () => {
    select!.value = family;
    select!.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const save = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === 'save');
  expect(save, 'save button').toBeTruthy();
  await act(async () => { (save as HTMLButtonElement).click(); });
  expect(setParts).toHaveBeenCalled();
  const saved = setParts.mock.calls.at(-1)?.[0] as Array<Record<string, any>>;
  return saved.find((part) => part.id === 'taskmaster') as Record<string, any>;
}

function mountEditor(): HTMLDivElement {
  appMock.current = { t: (key: string) => key, lang: 'en', parts: [MANAGER], setParts: vi.fn(), setSheet: vi.fn(), toast: vi.fn() };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(PartEditor, { part: MANAGER })); });
  return host;
}

/** An accessible name from aria-label, aria-labelledby, or a <label> that is associated with the control. */
function hasAccessibleName(control: HTMLElement): boolean {
  if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return true;
  return ((control as HTMLInputElement | HTMLSelectElement).labels?.length ?? 0) > 0;
}

describe('round23: the Cabinet part editor labels its controls', () => {
  it('control: the editor renders a family select', () => {
    const container = mountEditor();
    expect(container.querySelector('select.drop')).toBeTruthy();
  });

  it('the family select has an accessible name (its label is associated with it)', () => {
    const container = mountEditor();
    const select = container.querySelector('select.drop') as HTMLSelectElement;
    expect(hasAccessibleName(select), 'accessible name of the family select').toBe(true);
  });

  it('the name input has an accessible name (its label is associated with it)', () => {
    const container = mountEditor();
    const input = Array.from(container.querySelectorAll('input')).find((item) => item.value === MANAGER.name) as HTMLInputElement;
    expect(input, 'name input').toBeTruthy();
    expect(hasAccessibleName(input), 'accessible name of the name input').toBe(true);
  });
});

describe('round23: a family chosen in the Cabinet editor moves the part to that family\'s cluster', () => {
  it('control: the chosen family is saved', async () => {
    const part = await chooseFamilyAndSave('exile');
    expect(part.family).toBe('exile');
  });

  it('control: an unchanged family keeps its cluster', async () => {
    const part = await chooseFamilyAndSave('manager');
    expect(part.archetype.cluster).toBe('managers');
  });

  it('the saved part\'s archetype cluster follows the family chosen in the editor', async () => {
    const part = await chooseFamilyAndSave('exile');
    expect(part.archetype.cluster, 'saved taskmaster archetype.cluster').toBe('exiles');
  });
});
