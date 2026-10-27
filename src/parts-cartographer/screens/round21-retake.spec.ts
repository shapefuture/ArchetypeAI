import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESCENT_ITEM_IDS, writeDescentDraft } from '../core/assessment-draft';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { FullAssessment } from './full-assessment.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Round 21 probe: finishing a retake replaces every canonical part with a freshly scored copy
// (full-assessment.jsx finish: setParts([...adapted.parts, ...preservedParts])). The person's own
// edits to those parts (their typed name, traits, need, star) are dropped. The restore path
// (core/backup.ts applyBackup and the language-switch effect in app.jsx) keeps a name the person typed.

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

const EDITED_CRITIC = {
  id: 'inner_critic',
  name: 'My inner critic',
  nameEn: 'Inner critic',
  nameRu: 'Внутренний критик',
  family: 'manager',
  energy: 0.4,
  need: 'safety',
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

/** Finishes a seeded retake with "Skip for now" and returns the parts the screen saved. */
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

describe('round21: a retake keeps the person\'s edits to their parts', () => {
  it('finishing a retake keeps the name the person typed for a canonical part', async () => {
    const saved = await finishRetake([EDITED_CRITIC]);
    expect(saved.find((part) => part.id === 'inner_critic')?.name).toBe('My inner critic');
  });

  it('finishing a retake keeps the colour the person chose for a canonical part', async () => {
    const saved = await finishRetake([EDITED_CRITIC]);
    expect(saved.find((part) => part.id === 'inner_critic')?.traits?.color).toBe('#00ffab');
  });

  it('control: a custom part the assessment does not score is kept as the person made it', async () => {
    const custom = { ...EDITED_CRITIC, id: 'my-own-part', name: 'Mine' };
    const saved = await finishRetake([custom]);
    expect(saved.find((part) => part.id === 'my-own-part')).toMatchObject({ name: 'Mine' });
  });
});
