import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DESCENT_DRAFT_KEY, DESCENT_ITEM_IDS, LEGACY_DESCENT_DRAFT_KEY, itemId, writeDescentDraft, type DescentDraft,
} from '../core/assessment-draft';
import { buildItemSequence } from '../../shared/i18n/items';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { FullAssessment } from './full-assessment.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;
const go = vi.fn();
const SEQ = buildItemSequence();

function mount() {
  appMock.current = {
    t: (key: string) => key,
    lang: 'en',
    go,
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
  return button as HTMLButtonElement;
}

function rate(container: ParentNode, rating: number) {
  const radio = container.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[rating - 1];
  act(() => { radio.click(); });
}

function storedDraft(): DescentDraft | null {
  const raw = localStorage.getItem(DESCENT_DRAFT_KEY);
  return raw ? JSON.parse(raw) as DescentDraft : null;
}

function seedDraft(answeredCount: number, cursorIndex: number) {
  const answers: Record<string, number> = {};
  for (let i = 0; i < answeredCount; i++) answers[DESCENT_ITEM_IDS[i]] = (i % 5) + 1;
  writeDescentDraft({
    schema: 'descent-draft.v2',
    answers,
    cursor: { itemId: DESCENT_ITEM_IDS[cursorIndex], stage: 'item' },
    savedAt: '2026-10-15T10:00:00.000Z',
  });
}

beforeEach(() => {
  localStorage.clear();
  go.mockClear();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('full assessment durable draft', () => {
  it('does not report a save that storage refused, and reports it once the retry is verified', () => {
    const container = mount();
    clickButton(container, 'begin Descent I');
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const error = new Error('full');
      error.name = 'QuotaExceededError';
      throw error;
    });

    rate(container, 1);

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('no room left');
    expect(container.textContent).not.toContain('Saved on this device.');
    expect(storedDraft()).toBeNull();

    setItem.mockRestore();
    clickButton(container, 'Try saving again');

    expect(container.textContent).toContain('Saved on this device.');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    const draft = storedDraft();
    expect(Object.keys(draft?.answers ?? {})).toEqual([itemId(SEQ[0])]);
    expect(draft?.cursor.itemId).toBe(DESCENT_ITEM_IDS[1]);
  });

  it('asks before leaving while the latest answer is unsaved, and stays when the person declines', () => {
    const container = mount();
    clickButton(container, 'begin Descent I');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    rate(container, 2);

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    act(() => { (container.querySelector('button[aria-label="Exit"]') as HTMLButtonElement).click(); });

    expect(confirm).toHaveBeenCalledOnce();
    expect(go).not.toHaveBeenCalled();
  });

  it('resumes at the saved item rather than at the first unanswered one', () => {
    seedDraft(10, 4);
    const container = mount();

    expect(container.textContent).toContain('5 / 49');
    expect(container.textContent).toContain('10 / 147');
  });

  it('offers a historical V1 draft only as an explicit choice, and migrates it only on Continue', () => {
    const positional = Array(147).fill(0);
    positional[0] = 3;
    positional[1] = 4;
    positional[2] = 5;
    localStorage.setItem(LEGACY_DESCENT_DRAFT_KEY, JSON.stringify({ answers: positional, itemIndex: 3, stage: 'item', somatic: {} }));

    const container = mount();

    expect(container.textContent).toContain('An earlier draft is on this device');
    expect(container.textContent).toContain('3 of 147 answers were saved');
    const begin = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('begin Descent I')) as HTMLButtonElement;
    expect(begin.disabled).toBe(true);
    expect(storedDraft()).toBeNull();

    clickButton(container, 'Continue this draft');

    const draft = storedDraft();
    expect(Object.keys(draft?.answers ?? {})).toHaveLength(3);
    expect(draft?.answers[DESCENT_ITEM_IDS[2]]).toBe(5);
    expect(localStorage.getItem(LEGACY_DESCENT_DRAFT_KEY)).toBeNull();
    expect(container.textContent).toContain('3 / 147');
  });

  it('deletes a historical V1 draft only after the person confirms, and then allows a new start', () => {
    localStorage.setItem(LEGACY_DESCENT_DRAFT_KEY, JSON.stringify({ answers: Array(147).fill(2), itemIndex: 0, stage: 'item', somatic: {} }));
    const container = mount();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    clickButton(container, 'Delete it and start over');
    expect(confirm).toHaveBeenCalledOnce();
    expect(localStorage.getItem(LEGACY_DESCENT_DRAFT_KEY)).not.toBeNull();

    confirm.mockReturnValue(true);
    clickButton(container, 'Delete it and start over');
    expect(localStorage.getItem(LEGACY_DESCENT_DRAFT_KEY)).toBeNull();
    const begin = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('begin Descent I')) as HTMLButtonElement;
    expect(begin.disabled).toBe(false);
  });
});
