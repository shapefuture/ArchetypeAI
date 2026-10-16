import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { Intro } from './landing.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REFUSED_NOTICE = 'This browser cannot save these settings. They apply for this session only.';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function context(overrides: Record<string, unknown> = {}) {
  return {
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
    theme: 'light',
    setTheme: vi.fn(),
    sensory: { preset: 'gentle', motion: 'gentle', sound: false, texture: true, density: 'open' },
    sensoryStored: true,
    applySensoryPreset: vi.fn(),
    updateSensory: vi.fn(),
    premium: false,
    setOverlay: vi.fn(),
    user: null,
    go: vi.fn(),
    toast: vi.fn(),
    telemetry: { count: () => 0 },
    dockTab: 'you',
    ...overrides,
  };
}

async function render(overrides: Record<string, unknown> = {}) {
  appMock.current = context(overrides);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root?.render(React.createElement(Intro)); });
  return appMock.current;
}

beforeEach(() => { appMock.current = null; });

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
});

describe('sensory settings screen', () => {
  it('reports a refused save in plain language and keeps the controls usable', async () => {
    const ctx = await render({ sensoryStored: false });

    expect(host?.textContent).toContain(REFUSED_NOTICE);
    expect(host?.querySelector('[role="status"]')?.textContent).toBe(REFUSED_NOTICE);
    const sound = host?.querySelector<HTMLInputElement>('.sensory-toggle input[type="checkbox"]');
    expect(sound?.checked).toBe(false);
    sound?.click();
    expect(ctx?.updateSensory).toHaveBeenCalledWith('sound', true);
  });

  it('stays quiet when the choice was stored', async () => {
    const ctx = await render({ sensoryStored: true });

    expect(host?.textContent).not.toContain(REFUSED_NOTICE);
    expect(host?.querySelector('[role="status"]')).toBeNull();
    const still = [...(host?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((button) => button.textContent === 'sensoryStill');
    still?.click();
    expect(ctx?.applySensoryPreset).toHaveBeenCalledWith('still');
  });
});
