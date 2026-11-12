import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXILE_COPY, NEED_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { EXILE_NEED, type ExileId } from '../../shared/core/data/assessment2/taxonomy';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';

vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: 'en' }) }));
import { PartsTwo, WantsScreen } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T = (key: string) => (UI_COPY as unknown as Record<string, { en: string }>)[key].en;
const tx = (value: { en: string }) => value.en;

// The table need for powerless is agency, which is not the first chip, so a preselection cannot pass by accident.
const exile: ExileId = 'powerless';
const screen = { kind: 'wants', exile };
const frame = { T, tx, stageNames: UI_COPY.stageNames.en, screens: [screen], index: 0, onBack: () => {}, onNext: null, nextLabel: null, nextDisabled: false };

/** Labels of the chips shown pressed, in screen order. */
const pressedLabels = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('button[aria-pressed="true"]')).map((button) => button.textContent?.trim());

const buttonLabelled = (host: HTMLElement, label: string) => {
  const found = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === label);
  if (!found) throw new Error(`no button labelled "${label}"`);
  return found;
};

describe('wants screen, rendered alone', () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });
  const render = (input: unknown, handlers: { setNeed?: unknown; onSkip?: unknown } = {}) => {
    act(() => {
      root.render(React.createElement(WantsScreen, { T, tx, frame, screen, input, setNeed: vi.fn(), onSkip: vi.fn(), ...handlers } as any));
    });
  };
  const nextButton = () => host.querySelector('.p2-nav .btn.primary') as HTMLButtonElement;

  it('presells the table need when nothing is stored', () => {
    render({ exileNeed: {} });
    expect(pressedLabels(host)).toEqual([NEED_COPY[EXILE_NEED[exile]].en]);
  });

  it('shows a stored need in place of the table need', () => {
    render({ exileNeed: { [exile]: 'safety' } });
    expect(pressedLabels(host)).toEqual([NEED_COPY.safety.en]);
  });

  it('passes the chosen need to the setter once on Next, and does not skip', () => {
    const setNeed = vi.fn();
    const onSkip = vi.fn();
    render({ exileNeed: {} }, { setNeed, onSkip });
    act(() => { buttonLabelled(host, NEED_COPY.worth.en).click(); });
    expect(pressedLabels(host)).toEqual([NEED_COPY.worth.en]);
    act(() => { nextButton().click(); });
    expect(setNeed).toHaveBeenCalledTimes(1);
    expect(setNeed).toHaveBeenCalledWith('worth');
    expect(onSkip).not.toHaveBeenCalled();
  });

  it('passes the presold table need on Next when the person changes nothing', () => {
    const setNeed = vi.fn();
    render({ exileNeed: {} }, { setNeed });
    act(() => { nextButton().click(); });
    expect(setNeed).toHaveBeenCalledWith(EXILE_NEED[exile]);
  });

  it('writes nothing on Skip, and only moves on', () => {
    const setNeed = vi.fn();
    const onSkip = vi.fn();
    render({ exileNeed: {} }, { setNeed, onSkip });
    act(() => { buttonLabelled(host, T('skip')).click(); });
    expect(setNeed).not.toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

describe('wants and exile screens in the flow', () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    localStorage.clear();
  });

  // Every scene answered for attack, so attack is the pick. inner_critic's fear names powerless.
  const scenes: SceneAnswer[] = SCENES.map((scene) => ({
    scene,
    most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
    least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
  }));
  const input: Assessment2Input = {
    completedStages: [], steadiness: 4, lighter: false, scenes, picks: { attack: 'inner_critic' }, timing: { inner_critic: 'reactive' },
    costume: {}, confirm: {}, fears: { inner_critic: exile }, exileLevel: {}, exileNeed: {}, blending: {}, providers: {},
    capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
  };
  const screenIndex = (kind: string) => buildScreens(input).findIndex((s) => s.kind === kind);

  /** Opens the flow on the screen at `index`, through the resume prompt that a stored draft shows. */
  const openAt = (index: number, draftInput: Assessment2Input = input) => {
    localStorage.setItem(ROUTE_KEYS.parts2.draft, JSON.stringify({ version: 2, input: draftInput, index }));
    act(() => { root.render(React.createElement(PartsTwo)); });
    act(() => { buttonLabelled(host, UI_COPY.resume.en).click(); });
  };
  const savedDraft = () => JSON.parse(localStorage.getItem(ROUTE_KEYS.parts2.draft) ?? 'null');
  const nextButton = () => host.querySelector('.p2-nav .btn.primary') as HTMLButtonElement;

  it('stores the need the person taps on the wants screen, then moves on to the provider', () => {
    const at = screenIndex('wants');
    openAt(at);
    expect(host.querySelector('#p2-title')?.textContent).toBe(EXILE_COPY[exile].name.en);
    act(() => { buttonLabelled(host, NEED_COPY.attunement.en).click(); });
    act(() => { nextButton().click(); });
    const draft = savedDraft();
    expect(draft.input.exileNeed).toEqual({ [exile]: 'attunement' });
    expect(draft.index).toBe(at + 1);
    expect(buildScreens(draft.input)[draft.index].kind).toBe('provider');
  });

  it("opens the next exile's wants screen on its own table need, not on the need just chosen", () => {
    // Two exiles: ashamed (table worth) comes first in the exile order, then powerless (table agency).
    const twoExiles: Assessment2Input = { ...input, picks: { attack: 'inner_critic', withdraw: 'hermit' }, fears: { inner_critic: 'ashamed', hermit: 'powerless' } };
    openAt(buildScreens(twoExiles).findIndex((s) => s.kind === 'wants'), twoExiles);
    expect(host.querySelector('#p2-title')?.textContent).toBe(EXILE_COPY.ashamed.name.en);
    act(() => { buttonLabelled(host, NEED_COPY.safety.en).click(); });
    act(() => { nextButton().click(); });
    expect(host.querySelector('#p2-title')?.textContent).toBe(EXILE_COPY.powerless.name.en);
    expect(pressedLabels(host)).toEqual([NEED_COPY[EXILE_NEED.powerless].en]);
  });

  it('stores no need when Skip is tapped on the wants screen, and moves on', () => {
    const at = screenIndex('wants');
    openAt(at);
    act(() => { buttonLabelled(host, T('skip')).click(); });
    const draft = savedDraft();
    expect(draft.input.exileNeed).toEqual({});
    expect(draft.index).toBe(at + 1);
  });

  it('shows no need chips on the exile screen, and stores only the level on Next', () => {
    const at = screenIndex('exile');
    openAt(at);
    expect(host.querySelectorAll('button[aria-pressed]')).toHaveLength(0);
    const texts = Array.from(host.querySelectorAll('button')).map((button) => button.textContent?.trim());
    for (const copy of Object.values(NEED_COPY)) expect(texts).not.toContain(copy.en);
    act(() => { host.querySelectorAll<HTMLButtonElement>('[role="radio"]')[2].click(); });
    act(() => { nextButton().click(); });
    const draft = savedDraft();
    expect(draft.input.exileLevel).toEqual({ [exile]: 3 });
    expect(draft.input.exileNeed).toEqual({});
    expect(draft.index).toBe(at + 1);
  });

  it('stores only the level, as null, when Skip is tapped on the exile screen', () => {
    const at = screenIndex('exile');
    openAt(at);
    act(() => { buttonLabelled(host, T('skip')).click(); });
    const draft = savedDraft();
    expect(draft.input.exileLevel).toEqual({ [exile]: null });
    expect(draft.input.exileNeed).toEqual({});
    expect(draft.index).toBe(at + 1);
  });
});
