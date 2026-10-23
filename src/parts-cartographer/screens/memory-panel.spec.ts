import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import {
  MEMORY_KEY,
  MemoryPanel,
  defaultSaved,
  newUserMemory,
  readMemoryStore,
  recordCorrection,
  setMemorySaved,
} from './memory-panel.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const seed = {
  memories: [
    { id: 'm1', text: 'I felt rushed on the call', source: 'user-entry', derivedFrom: [], saved: true },
    { id: 'm2', text: 'Rushing is a pattern for me', source: 'model-inference', derivedFrom: ['m1'], saved: false },
    { id: 'm3', text: 'Assessment note', source: 'assessment', derivedFrom: [], saved: true },
  ],
  corrections: [
    { memoryId: 'm2', previous: 'Rushing', next: 'Rushing is a pattern for me', at: '2026-10-01T00:00:00.000Z' },
    { memoryId: 'm3', previous: 'Old note', next: 'Assessment note', at: '2026-10-02T00:00:00.000Z' },
  ],
};

function stored() {
  return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? 'null');
}

async function render(lang = 'en') {
  appMock.current = { lang };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root?.render(React.createElement(MemoryPanel)); });
}

function buttonIn(scope: Element | null | undefined, label: string) {
  return [...(scope?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((b) => b.textContent === label) ?? null;
}

function itemFor(text: string) {
  return [...(host?.querySelectorAll('li.mp-item') ?? [])].find((li) => li.querySelector('.mp-text')?.textContent === text) ?? null;
}

async function click(el: Element | null | undefined) {
  if (!el) throw new Error('missing element');
  await act(async () => { (el as HTMLElement).click(); });
}

function typeInto(el: HTMLTextAreaElement | HTMLInputElement | null, value: string) {
  if (!el) throw new Error('missing field');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

beforeEach(() => {
  localStorage.clear();
  appMock.current = null;
});

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
});

describe('memory store reading', () => {
  it('drops malformed entries and never invents a source', () => {
    const parsed = readMemoryStore({
      memories: [
        { id: 'ok', text: 'kept', source: 'user-entry', derivedFrom: [], saved: true },
        { id: 'bad-source', text: 'no source', source: 'rumour', derivedFrom: [], saved: true },
        { id: '', text: 'no id', source: 'user-entry', derivedFrom: [], saved: true },
        'not an object',
      ],
    });
    expect(parsed.memories.map((m) => m.id)).toEqual(['ok']);
  });

  it('keeps a model inference out of context until the person keeps it', () => {
    expect(defaultSaved('model-inference')).toBe(false);
    expect(defaultSaved('user-entry')).toBe(true);
    const parsed = readMemoryStore({ memories: [{ id: 'i', text: 'guess', source: 'model-inference', derivedFrom: [] }] });
    expect(parsed.memories[0].saved).toBe(false);
  });

  it('drops a correction whose memory no longer exists', () => {
    const parsed = readMemoryStore({ memories: [], corrections: [{ memoryId: 'gone', previous: 'a', next: 'b' }] });
    expect(parsed.corrections).toEqual([]);
  });
});

describe('memory actions', () => {
  it('refuses an empty memory', () => {
    expect(newUserMemory('   ', 'x')).toBeNull();
    expect(newUserMemory(' kept ', 'x')).toEqual({ id: 'x', text: 'kept', source: 'user-entry', derivedFrom: [], saved: true });
  });

  it('records a correction only when the wording changed', () => {
    expect(recordCorrection([], { memoryId: 'a', previous: 'same', next: 'same' }, 'now')).toEqual([]);
    expect(recordCorrection([], { memoryId: 'a', previous: 'old', next: 'new' }, 'now')).toEqual([
      { memoryId: 'a', previous: 'old', next: 'new', at: 'now' },
    ]);
  });

  it('changes the context flag only for the memory it names', () => {
    const changed = setMemorySaved(seed.memories, 'm2', true);
    expect(changed.find((m) => m.id === 'm2')?.saved).toBe(true);
    expect(changed.find((m) => m.id === 'm1')?.saved).toBe(true);
  });
});

describe('memory panel', () => {
  it('renders each memory with its source and whether it is used as context', async () => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(seed));
    await render('en');

    expect(host?.textContent).toContain('You wrote this');
    expect(host?.textContent).toContain('From an assessment');
    expect(host?.textContent).toContain('Inferred by AI');
    expect(itemFor('Rushing is a pattern for me')?.textContent).toContain('Not used as context');
    expect(host?.querySelector('[data-testid="memory-context-count"]')?.textContent).toBe('2 of 3 used as context.');
    expect(host?.textContent).toContain('Stored on this device only.');
  });

  it('adds a typed memory to the store as a user entry', async () => {
    await render('en');
    typeInto(host?.querySelector<HTMLTextAreaElement>('textarea[placeholder="Write it in your own words"]') ?? null, 'Tired after work');
    await click(buttonIn(host, 'Add memory'));

    const saved = stored();
    expect(saved.memories).toHaveLength(1);
    expect(saved.memories[0]).toMatchObject({ text: 'Tired after work', source: 'user-entry', saved: true });
  });

  it('refuses to add an empty memory and says so', async () => {
    await render('en');
    await click(buttonIn(host, 'Add memory'));
    expect(host?.querySelector('[role="status"]')?.textContent).toContain('Nothing was saved.');
    expect(localStorage.getItem(MEMORY_KEY)).toBeNull();
  });

  it('keeps the earlier wording visible after a correction', async () => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(seed));
    await render('en');

    await click(buttonIn(itemFor('I felt rushed on the call'), 'Correct'));
    typeInto(host?.querySelector<HTMLTextAreaElement>('textarea[aria-label="Correct"]') ?? null, 'I felt pressed on the call');
    await click(buttonIn(host, 'Save correction'));

    expect(itemFor('I felt pressed on the call')?.textContent).toContain('Earlier wording: I felt rushed on the call');
    expect(stored().corrections).toContainEqual(expect.objectContaining({ memoryId: 'm1', previous: 'I felt rushed on the call', next: 'I felt pressed on the call' }));
  });

  it('shows the derived memories that a delete will also remove, and removes them with it', async () => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(seed));
    await render('en');

    await click(buttonIn(itemFor('I felt rushed on the call'), 'Delete'));
    const dialog = host?.querySelector('[role="alertdialog"]');
    expect(dialog?.textContent).toContain('Rushing is a pattern for me');
    expect(localStorage.getItem(MEMORY_KEY)).toContain('I felt rushed on the call');

    await click(buttonIn(dialog, 'Delete'));
    const saved = stored();
    expect(saved.memories.map((m: { id: string }) => m.id)).toEqual(['m3']);
    expect(saved.corrections.map((c: { memoryId: string }) => c.memoryId)).toEqual(['m3']);
    expect(host?.querySelector('[role="status"]')?.textContent).toContain('Deleted 2 memories');
  });

  it('closes an open correction when the memory being corrected is removed with its parent', async () => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(seed));
    await render('en');

    await click(buttonIn(itemFor('Rushing is a pattern for me'), 'Correct'));
    expect(host?.querySelector('textarea[aria-label="Correct"]')).not.toBeNull();

    await click(buttonIn(itemFor('I felt rushed on the call'), 'Delete'));
    await click(buttonIn(host?.querySelector('[role="alertdialog"]'), 'Delete'));
    expect(host?.querySelector('textarea[aria-label="Correct"]')).toBeNull();
    expect(stored().memories.map((m: { id: string }) => m.id)).toEqual(['m3']);
  });

  it('cancelling a delete keeps everything', async () => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(seed));
    await render('en');

    await click(buttonIn(itemFor('I felt rushed on the call'), 'Delete'));
    await click(buttonIn(host?.querySelector('[role="alertdialog"]'), 'Cancel'));
    expect(stored().memories).toHaveLength(3);
  });

  it('lets the person decide whether a memory is used as context', async () => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(seed));
    await render('en');

    const toggle = itemFor('I felt rushed on the call')?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    await click(toggle);
    expect(stored().memories.find((m: { id: string }) => m.id === 'm1').saved).toBe(false);
    expect(host?.querySelector('[data-testid="memory-context-count"]')?.textContent).toBe('1 of 3 used as context.');
  });

  it('renders the empty state when the stored value is corrupt', async () => {
    localStorage.setItem(MEMORY_KEY, '{not json');
    await render('ru');
    expect(host?.textContent).toContain('Записей пока нет.');
  });

  it('uses Russian copy when the app language is ru', async () => {
    await render('ru');
    expect(host?.textContent).toContain('Что сохранено о вас');
    expect(host?.textContent).toContain('Хранится только на этом устройстве.');
  });
});
