import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PART_VERSIONS_KEY,
  PartVersionHistory,
  makeVersion,
  nextVersionNumber,
  readVersionMap,
} from './part-history.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const first = { version: '1', locale: 'en', text: 'First wording', private: true, at: '2026-10-01T00:00:00.000Z' };
const second = { version: '2', locale: 'en', text: 'Second wording', private: true, at: '2026-10-02T00:00:00.000Z' };
const russian = { version: '1', locale: 'ru', text: 'Русский текст', private: true, at: '2026-10-02T00:00:00.000Z' };

function stored() {
  return JSON.parse(localStorage.getItem(PART_VERSIONS_KEY) ?? 'null');
}

async function render(props: Record<string, unknown>) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root?.render(React.createElement(PartVersionHistory, props as any)); });
}

function buttonIn(scope: Element | null | undefined, label: string) {
  return [...(scope?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((b) => b.textContent === label) ?? null;
}

function entryFor(text: string) {
  return [...(host?.querySelectorAll('li') ?? [])].find((li) => li.querySelector('p')?.textContent === text) ?? null;
}

async function click(el: Element | null | undefined) {
  if (!el) throw new Error('missing element');
  await act(async () => { (el as HTMLElement).click(); });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(PART_VERSIONS_KEY, JSON.stringify({ p1: [first, second, russian] }));
});

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
});

describe('version map reading', () => {
  it('drops malformed versions and reserved keys, and keeps a missing privacy flag private', () => {
    // JSON.parse creates an own "__proto__" key, as a corrupt stored value could.
    const map = readVersionMap(JSON.parse(`{
      "p1": [{ "version": "1", "locale": "en", "text": "ok" }, { "version": 1, "locale": "en", "text": "bad version" }, null],
      "__proto__": [{ "version": "1", "locale": "en", "text": "pollute" }],
      "p2": "not a list"
    }`));
    expect(Object.keys(map)).toEqual(['p1']);
    expect(map.p1).toEqual([{ version: '1', locale: 'en', text: 'ok', private: true }]);
  });

  it('numbers each new version one above the highest in its own locale', () => {
    const history = [first, second, russian];
    expect(nextVersionNumber(history, 'en')).toBe('3');
    expect(nextVersionNumber(history, 'ru')).toBe('2');
    expect(nextVersionNumber([], 'en')).toBe('1');
    expect(makeVersion(history, { locale: 'en', text: 'New', at: 'now' })).toEqual({ version: '3', locale: 'en', text: 'New', private: true, at: 'now' });
  });
});

describe('part version history', () => {
  it('appends a version when the current text is saved', async () => {
    await render({ partId: 'p1', text: 'Draft text', lang: 'en', onRestore: vi.fn() });
    await click(buttonIn(host, 'Save current text as a version'));

    const versions = stored().p1;
    expect(versions).toHaveLength(4);
    expect(versions[3]).toMatchObject({ version: '3', locale: 'en', text: 'Draft text', private: true });
    expect(host?.querySelector('[role="status"]')?.textContent).toBe('Saved as version 3.');
  });

  it('does not save an empty text, and says nothing changed when the text is already the latest version', async () => {
    await render({ partId: 'p1', text: '   ', lang: 'en', onRestore: vi.fn() });
    expect(buttonIn(host, 'Save current text as a version')?.disabled).toBe(true);
    expect(stored().p1).toHaveLength(3);

    await act(async () => { root?.unmount(); });
    host?.remove();
    await render({ partId: 'p1', text: 'Second wording', lang: 'en', onRestore: vi.fn() });
    await click(buttonIn(host, 'Save current text as a version'));
    expect(host?.querySelector('[role="status"]')?.textContent).toContain('already the latest saved version');
    expect(stored().p1).toHaveLength(3);
  });

  it('restores an old text as a new version and never rewrites or removes earlier ones', async () => {
    const onRestore = vi.fn();
    await render({ partId: 'p1', text: 'Second wording', lang: 'en', onRestore });
    const before = stored().p1.slice(0, 2);

    await click(buttonIn(entryFor('First wording'), 'Restore'));
    expect(onRestore).toHaveBeenCalledWith('First wording');
    const versions = stored().p1;
    expect(versions).toHaveLength(4);
    expect(versions.slice(0, 2)).toEqual(before);
    expect(versions[3]).toMatchObject({ version: '3', locale: 'en', text: 'First wording', private: true });
    expect(host?.querySelector('[role="status"]')?.textContent).toBe('Restored. The old text is now version 3.');
  });

  it('shows only versions in the current language and never substitutes another', async () => {
    await render({ partId: 'p1', text: 'Русский текст', lang: 'ru', onRestore: vi.fn() });
    expect(host?.textContent).toContain('Русский текст');
    expect(host?.textContent).not.toContain('First wording');
    expect(host?.textContent).not.toContain('Second wording');
  });

  it('says so when a language has no saved version yet', async () => {
    await render({ partId: 'p2', text: 'Something', lang: 'en', onRestore: vi.fn() });
    expect(host?.textContent).toContain('No saved versions in this language yet.');
    expect(host?.textContent).not.toContain('Русский текст');
  });

  it('keeps working when the stored value is corrupt', async () => {
    localStorage.setItem(PART_VERSIONS_KEY, '{broken');
    await render({ partId: 'p1', text: 'Fresh', lang: 'en', onRestore: vi.fn() });
    expect(host?.textContent).toContain('No saved versions in this language yet.');
    await click(buttonIn(host, 'Save current text as a version'));
    expect(stored().p1).toEqual([expect.objectContaining({ version: '1', locale: 'en', text: 'Fresh' })]);
  });

  it('renders Russian copy when the language is ru', async () => {
    await render({ partId: 'p1', text: 'Русский текст', lang: 'ru', onRestore: vi.fn() });
    expect(host?.textContent).toContain('Сохранённые версии');
    expect(host?.textContent).toContain('Версия 1');
  });
});
