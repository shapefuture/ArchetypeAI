import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';
import { store } from '../core/local-store';
import { readLastResult, saveLastResult } from '../core/parts-two-store';

// The app context is stubbed. The spec records what the screen hands to the app, and never renders the app.
const app = vi.hoisted(() => ({ lang: 'en', go: vi.fn(), setParts: vi.fn(), setUniverseMode: vi.fn() }));
vi.mock('../app.jsx', () => ({ useApp: () => ({ parts: [], ...app }) }));
import { PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DRAFT_KEY = ROUTE_KEYS.parts2.draft;
const RESULT_KEY = ROUTE_KEYS.parts2.result;
const SAVED_AT = new Date('2026-11-11T12:00:00.000Z');

// Every scene answered for attack, so attack is the pick. inner_critic's fear names powerless.
const scenes: SceneAnswer[] = SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
}));
const input: Assessment2Input = {
  completedStages: [], steadiness: 4, lighter: false, scenes, picks: { attack: 'inner_critic' }, timing: { inner_critic: 'reactive' },
  costume: {}, confirm: {}, fears: { inner_critic: 'powerless' }, exileLevel: {}, exileNeed: {}, blending: {}, providers: {},
  capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
};
const result = () => buildAssessment2Result(input);

/** The result as an earlier build wrote it: its protector carries no classKnown field (plan D1, G27). */
const beforeTimingFix = () => {
  const copy = JSON.parse(JSON.stringify(result()));
  for (const part of copy.parts) if (part.kind === 'protector') delete part.classKnown;
  return copy;
};

const buttonLabelled = (host: HTMLElement, label: string) => {
  const found = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === label);
  if (!found) throw new Error(`no button labelled "${label}"`);
  return found;
};
const hasButton = (host: HTMLElement, label: string) =>
  Array.from(host.querySelectorAll('button')).some((button) => button.textContent?.trim() === label);

describe('parts-two save gate and last-result view (B9)', () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.clearAllMocks();
    app.lang = 'en';
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mount = () => { act(() => { root.render(React.createElement(PartsTwo)); }); };

  /** Opens the flow on the result screen, through the resume prompt that a stored draft shows. */
  const openResultScreen = () => {
    const index = buildScreens(input).findIndex((screen) => screen.kind === 'result');
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2, input, index }));
    mount();
    act(() => { buttonLabelled(host, UI_COPY.resume.en).click(); });
  };

  it('(a) a successful save clears the draft, keeps a readable copy, and opens the universe', () => {
    openResultScreen();
    act(() => { buttonLabelled(host, UI_COPY.save.en).click(); });
    expect(app.go).toHaveBeenCalledWith('universe');
    expect(app.setUniverseMode).toHaveBeenCalledWith('parts');
    expect(app.setParts).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')).toBeNull();
    expect(typeof readLastResult()?.savedAt).toBe('string');
  });

  it('(b) a refused save keeps the draft, shows the alert by the save button, and neither moves on nor touches the parts', () => {
    const realSave = store.save;
    vi.spyOn(store, 'save').mockImplementation((key: string, value: unknown) => (key === RESULT_KEY ? false : realSave(key, value)));
    openResultScreen();
    const draftBefore = localStorage.getItem(DRAFT_KEY);
    act(() => { buttonLabelled(host, UI_COPY.save.en).click(); });
    expect(app.go).not.toHaveBeenCalled();
    expect(app.setParts).not.toHaveBeenCalled();
    expect(app.setUniverseMode).not.toHaveBeenCalled();
    const alert = host.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe(UI_COPY.saveFailed.en);
    expect(alert?.nextElementSibling?.classList.contains('p2-nav')).toBe(true);
    expect(localStorage.getItem(DRAFT_KEY)).toBe(draftBefore);
    expect(host.querySelector('#p2-result-title')).not.toBeNull();
  });

  it('(c) a stored result with no draft opens read only, and Start again opens the first screen and keeps the result', () => {
    saveLastResult(result(), SAVED_AT);
    mount();
    expect(host.querySelector('#p2-last-title')?.textContent).toBe(UI_COPY.lastResultSaved.en.replace('{date}', 'November 11, 2026'));
    expect(hasButton(host, UI_COPY.save.en)).toBe(false);
    expect(hasButton(host, UI_COPY.restart.en)).toBe(true);
    expect(host.textContent).not.toContain(UI_COPY.beforeTimingFix.en);
    act(() => { buttonLabelled(host, UI_COPY.restart.en).click(); });
    expect(host.querySelector('#p2-title')?.textContent).toBe(UI_COPY.steadyQ.en);
    expect(readLastResult()?.savedAt).toBe(SAVED_AT.toISOString());
  });

  it('(d) a stored result saved before the timing fix shows the timing note on the last-result view', () => {
    saveLastResult(beforeTimingFix(), SAVED_AT);
    mount();
    expect(host.querySelector('#p2-last-title')).not.toBeNull();
    expect(host.textContent).toContain(UI_COPY.beforeTimingFix.en);
  });

  it('(e) a draft still takes the resume prompt before a stored result', () => {
    saveLastResult(result(), SAVED_AT);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2, input, index: 0 }));
    mount();
    expect(hasButton(host, UI_COPY.resume.en)).toBe(true);
    expect(host.querySelector('#p2-last-title')).toBeNull();
  });

  it('(f) an older bare result, with no save time, is titled "Your last result"', () => {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result()));
    mount();
    expect(host.querySelector('#p2-last-title')?.textContent).toBe(UI_COPY.lastResultTitle.en);
  });

  it('(g) the last-result title follows the current language and its date format', () => {
    app.lang = 'ru';
    saveLastResult(result(), SAVED_AT);
    mount();
    const title = host.querySelector('#p2-last-title')?.textContent ?? '';
    expect(title.startsWith('Ваш последний результат, сохранён ')).toBe(true);
    expect(title).toContain('ноября 2026');
  });
});
