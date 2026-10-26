import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESCENT_ITEM_IDS, writeDescentDraft } from '../core/assessment-draft';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { FullAssessment } from './full-assessment.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Round 20 probe: the North Star letters are the person's own writing, stored with a direct
// localStorage write (no archive copy). Skipping the North Star on a retake deletes them.
const FUTURE_SELF_KEY = 'INNERVERSE_FUTURE_SELF_V1';
const LETTERS = ['Steady mornings and honest friends', 'Calm work I am proud of', 'Rest on Sundays without guilt'];

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount() {
  appMock.current = {
    t: (key: string) => key,
    lang: 'en',
    go: vi.fn(),
    parts: [],
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

function clickButton(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(text));
  expect(button, `expected a button containing “${text}”`).toBeTruthy();
  act(() => { (button as HTMLButtonElement).click(); });
}

/** Every item answered and the cursor on the North Star step, as a person who finished the 147 items would leave it. */
function seedFinishedDraft() {
  const answers = Object.fromEntries(DESCENT_ITEM_IDS.map((id, i) => [id, (i % 5) + 1]));
  writeDescentDraft({
    schema: 'descent-draft.v2',
    answers,
    cursor: { itemId: DESCENT_ITEM_IDS[DESCENT_ITEM_IDS.length - 1], stage: 'future-self' },
    savedAt: '2026-10-15T10:00:00.000Z',
  });
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

describe('round20: North Star on a retake', () => {
  it('shows the saved letters on the North Star step', () => {
    seedFinishedDraft();
    localStorage.setItem(FUTURE_SELF_KEY, JSON.stringify(LETTERS));
    const container = mount();
    const values = Array.from(container.querySelectorAll('textarea')).map((area) => area.value);
    expect(values).toEqual(LETTERS);
  });

  it('keeps the saved letters when the person taps "Skip for now" (directly or in an archive copy)', () => {
    seedFinishedDraft();
    localStorage.setItem(FUTURE_SELF_KEY, JSON.stringify(LETTERS));
    const container = mount();
    clickButton(container, 'Skip for now');
    const current = localStorage.getItem(FUTURE_SELF_KEY) ?? '';
    const archived = JSON.parse(localStorage.getItem(`${FUTURE_SELF_KEY}.hist`) ?? '[]') as string[];
    const survives = current.includes('Steady mornings') || archived.some((copy) => copy.includes('Steady mornings'));
    expect(survives).toBe(true);
  });
});
