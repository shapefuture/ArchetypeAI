import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { RestControl } from './rest-control.jsx';
import { REPLAY_KEY, WORLD_KEY } from '../core/replay-scenes.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REST_DONE = 'Resting. Nothing changed.';
const GRADUATED = 'You have graduated from quiet mode. Your places remain.';
const NOT_STORED = 'This browser would not keep the change. It applies for this visit only.';
const ASK = 'Graduating is your choice. It ends quiet mode for now. Your places and count stay as they are.';

const SEED_WORLD = { places: ['everyday-kitchen', 'own-door'], progress: 2, graduated: false };

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(overrides: Record<string, unknown> = {}) {
  appMock.current = { t: (key: string) => key, lang: 'en', toast: vi.fn(), ...overrides };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(RestControl)); });
  return host;
}

function buttonByText(text: string) {
  return [...(host?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((button) => button.textContent?.trim() === text);
}

function click(element: HTMLElement | undefined | null) {
  act(() => { element?.click(); });
}

function storedWorld() {
  return JSON.parse(localStorage.getItem(WORLD_KEY) ?? 'null');
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(WORLD_KEY, JSON.stringify(SEED_WORLD));
  localStorage.setItem(REPLAY_KEY, JSON.stringify({ scene: { id: 'own-door', title: 'Door', optIn: true, castNames: ['Sam'], beats: ['Hello'] } }));
});

afterEach(() => {
  act(() => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
  vi.restoreAllMocks();
});

describe('quiet mode: rest', () => {
  it('lists finished places by name and counts them without any pressure', () => {
    mount();
    expect(host?.textContent).toContain('Scenes finished: 2');
    expect(host?.textContent).toContain('A shared morning');
    expect(host?.textContent).toContain('Door');
    expect(host?.textContent).not.toMatch(/streak|points|missed|rank/i);
  });

  it('resting returns the world exactly as it was, so no progress is ever lost', () => {
    mount();
    const before = JSON.stringify(storedWorld());
    click(buttonByText('Rest here'));
    expect(JSON.stringify(storedWorld())).toBe(before);
    expect(host?.querySelector('[role="status"]')?.textContent).toBe(REST_DONE);
  });

  it('starts from an empty world when nothing is stored yet', () => {
    localStorage.removeItem(WORLD_KEY);
    mount();
    expect(host?.textContent).toContain('Scenes finished: 0');
    expect(host?.textContent).toContain('No scenes finished yet. Nothing is required here.');
  });

  it('falls back to an empty world for a corrupt stored value', () => {
    localStorage.setItem(WORLD_KEY, '[[');
    mount();
    expect(host?.textContent).toContain('Scenes finished: 0');
  });

});

describe('quiet mode: graduation', () => {
  it('is never applied without the explicit yes', () => {
    mount();
    click(buttonByText('Graduate from quiet mode'));
    expect(host?.textContent).toContain(ASK);
    click(buttonByText('Not now'));
    expect(host?.textContent).not.toContain(ASK);
    expect(storedWorld().graduated).toBe(false);
  });

  it('graduates only after the person chooses yes, and keeps places and progress', () => {
    mount();
    click(buttonByText('Graduate from quiet mode'));
    click(buttonByText('Yes, graduate'));
    expect(host?.textContent).toContain(GRADUATED);
    expect(storedWorld()).toEqual({ places: ['everyday-kitchen', 'own-door'], progress: 2, graduated: true });
    expect(buttonByText('Graduate from quiet mode')).toBeUndefined();
  });

  it('says plainly and keeps the old state when the browser will not keep the graduation', () => {
    mount();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    click(buttonByText('Graduate from quiet mode'));
    click(buttonByText('Yes, graduate'));
    expect(host?.querySelector('[role="status"]')?.textContent).toBe(NOT_STORED);
    expect(storedWorld().graduated).toBe(false);
    expect(host?.textContent).not.toContain(GRADUATED);
  });

  it('keeps an earlier graduation when the person later declines to graduate again', () => {
    localStorage.setItem(WORLD_KEY, JSON.stringify({ ...SEED_WORLD, graduated: true }));
    mount();
    expect(host?.textContent).toContain(GRADUATED);
    click(buttonByText('Rest here'));
    expect(storedWorld().graduated).toBe(true);
  });
});

describe('quiet mode: language', () => {
  it('renders Russian copy when the app is in Russian', () => {
    mount({ lang: 'ru' });
    expect(host?.querySelector('h2')?.textContent).toBe('Тихий режим');
    expect(host?.textContent).toContain('Сцен завершено: 2');
  });
});
