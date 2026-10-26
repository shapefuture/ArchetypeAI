// Round 22 probe (critic): a retake keeps the person's own edits to a canonical part.
// The round-21 fix (withPersonEdits, full-assessment.jsx finish) keeps the typed name, traits and star.
// The Cabinet part sheet also saves the person's typed `role` (cabinet.jsx: save -> { ...p, role: v }),
// and the Cabinet sheet saves a chosen `family`. Neither survives the retake.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESCENT_ITEM_IDS, writeDescentDraft } from '../core/assessment-draft';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { FullAssessment } from './full-assessment.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function seedFinishedDraft() {
  const answers = Object.fromEntries(DESCENT_ITEM_IDS.map((id, i) => [id, (i % 5) + 1]));
  writeDescentDraft({
    schema: 'descent-draft.v2',
    answers,
    cursor: { itemId: DESCENT_ITEM_IDS[DESCENT_ITEM_IDS.length - 1], stage: 'future-self' },
    savedAt: '2026-10-15T10:00:00.000Z',
  });
}

const TYPED_CRITIC = {
  id: 'inner_critic',
  name: 'My inner critic',
  nameEn: 'Inner critic',
  nameRu: 'Внутренний критик',
  family: 'manager',
  role: 'The voice that says I must never rest',
  energy: 40,
  star: true,
  traits: { shape: 'round', eyes: 'dot', mouth: 'smile', head: 'round', face: 'plain', color: '#00ffab', characterSeed: 7 },
};

function mount(parts: unknown[]) {
  appMock.current = {
    t: (key: string) => key,
    lang: 'en',
    go: vi.fn(),
    parts,
    setProfile: vi.fn(),
    setParts: vi.fn(),
    toast: vi.fn(),
  };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(FullAssessment)); });
  return host;
}

beforeEach(() => { localStorage.clear(); });

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
  vi.restoreAllMocks();
});

async function finishRetake(parts: unknown[]): Promise<Array<Record<string, any>>> {
  seedFinishedDraft();
  const container = mount(parts);
  const skip = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Skip for now'));
  expect(skip).toBeTruthy();
  await act(async () => { (skip as HTMLButtonElement).click(); });
  const setParts = appMock.current?.setParts as ReturnType<typeof vi.fn>;
  expect(setParts).toHaveBeenCalled();
  return setParts.mock.calls.at(-1)?.[0] as Array<Record<string, any>>;
}

describe('round22: a retake keeps the person\'s typed role and chosen family', () => {
  it('control: the typed name is kept (round-21 behaviour)', async () => {
    const saved = await finishRetake([TYPED_CRITIC]);
    expect(saved.find((part) => part.id === 'inner_critic')?.name).toBe('My inner critic');
  });

  it('a retake keeps the role text the person typed for a canonical part', async () => {
    const saved = await finishRetake([TYPED_CRITIC]);
    expect(saved.find((part) => part.id === 'inner_critic')?.role).toBe('The voice that says I must never rest');
  });

  it('a retake keeps the family the person chose for a canonical part', async () => {
    const saved = await finishRetake([{ ...TYPED_CRITIC, family: 'exile' }]);
    expect(saved.find((part) => part.id === 'inner_critic')?.family).toBe('exile');
  });
});
