// Round 24 probe (critic): cabinet.jsx addPart creates a part with NO archetype (only family, traits and copy). The Cabinet
// PartEditor's family select writes archetype only when one exists (`draft.archetype && archetypeOf(...)`), so a new part
// whose family is changed in the editor is saved with no archetype: the Universe cluster filter (innerverse.jsx) reads
// part.archetype?.cluster and never lists it under its family's cluster, and the node keeps the default size.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { PartEditor } from './cabinet.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

// The part exactly as cabinet.jsx addPart builds it (no archetype key).
const NEW_PART = {
  id: 'part_new_1',
  name: 'New part',
  family: 'manager',
  traits: { shape: 'round', eyes: 'dot', mouth: 'smile', head: 'round', face: 'plain', color: '#00ffab', characterSeed: 7 },
  role: 'Role',
  blurb: '',
  energy: 40,
  burden: '—',
  need: '—',
  voice: '—',
  star: false,
  since: 'today',
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

async function chooseFamilyAndSave(part: Record<string, any>, family: string) {
  const setParts = vi.fn();
  appMock.current = { t: (key: string) => key, lang: 'en', parts: [part], setParts, setSheet: vi.fn(), toast: vi.fn() };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(PartEditor, { part })); });
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
  return saved.find((item) => item.id === part.id) as Record<string, any>;
}

describe('round24: a new part whose family is chosen in the Cabinet editor joins that family\'s cluster', () => {
  it('control: the chosen family is saved on the new part', async () => {
    const part = await chooseFamilyAndSave(NEW_PART, 'exile');
    expect(part.family).toBe('exile');
  });

  it('control: a new part left as manager keeps no archetype, as addPart created it', async () => {
    const part = await chooseFamilyAndSave(NEW_PART, 'manager');
    expect(part.archetype).toBeUndefined();
  });

  it('a new part moved to exile gets the exile cluster the cluster filter reads', async () => {
    const part = await chooseFamilyAndSave(NEW_PART, 'exile');
    expect(part.archetype?.cluster, 'saved new part archetype.cluster').toBe('exiles');
  });

  it('a new part moved to exile gets the exile node size', async () => {
    const part = await chooseFamilyAndSave(NEW_PART, 'exile');
    expect(part.archetype?.size, 'saved new part archetype.size').toBe(0.6);
  });
});
