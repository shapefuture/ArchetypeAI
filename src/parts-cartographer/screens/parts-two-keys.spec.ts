import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXILE_COPY, SCENE_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';

vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: 'en' }) }));
import { PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flowInput = (over: Partial<Assessment2Input> = {}): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes: [], picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
  ...over,
});

/** Every scene answered: attack is the most, withdraw the least, where each scene shows them. */
const attackScenes: SceneAnswer[] = SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
}));

const buttonLabelled = (host: HTMLElement, label: string) => {
  const found = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === label);
  if (!found) throw new Error(`no button labelled "${label}"`);
  return found;
};

/** Labels of the buttons shown pressed (aria-pressed) or checked (aria-checked), in screen order. */
const selectedLabels = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('button[aria-pressed="true"], [role="radio"][aria-checked="true"]')).map((button) => button.textContent?.trim());

describe('screen identity keys in parts-two.jsx', () => {
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

  /** Opens the flow on the screen at `index`, through the resume prompt that a stored draft shows. */
  const openAt = (index: number, input: Assessment2Input) => {
    localStorage.setItem(ROUTE_KEYS.parts2.draft, JSON.stringify({ version: 2, input, index }));
    act(() => { root.render(React.createElement(PartsTwo)); });
    act(() => { buttonLabelled(host, UI_COPY.resume.en).click(); });
  };
  const title = () => host.querySelector('#p2-title')?.textContent;
  const nextButton = () => host.querySelector('.p2-nav .btn.primary');
  const cards = () => Array.from(host.querySelectorAll('button.p2-card')) as HTMLButtonElement[];

  it("starts the second scene with nothing picked, not with the first scene's picks", () => {
    const input = flowInput();
    const first = buildScreens(input).findIndex((s) => s.kind === 'scene');
    openAt(first, input);
    expect(title()).toBe(SCENE_COPY.criticised.title.en);
    // The first scene's least pick, attack, is also shown on the second scene.
    act(() => { cards()[0].click(); });
    act(() => { cards()[1].click(); });
    expect(title()).toBe(SCENE_COPY.leftOut.title.en);
    expect(host.querySelector('.p2-status')?.textContent).toBe(UI_COPY.most.en);
    expect(selectedLabels(host)).toEqual([]);
  });

  it("starts the second provider screen with no access picked, not with the first exile's answer", () => {
    const input = flowInput({
      scenes: attackScenes, picks: { attack: 'inner_critic', withdraw: 'hermit' }, timing: { inner_critic: 'reactive' },
      fears: { inner_critic: 'ashamed', hermit: 'powerless' },
    });
    const first = buildScreens(input).findIndex((s) => s.kind === 'provider');
    openAt(first, input);
    expect(title()).toBe(EXILE_COPY.ashamed.name.en);
    act(() => { host.querySelectorAll<HTMLButtonElement>('[role="radio"]')[0].click(); });
    act(() => { (nextButton() as HTMLButtonElement).click(); });
    expect(title()).toBe(EXILE_COPY.powerless.name.en);
    expect(selectedLabels(host)).toEqual([]);
    expect(nextButton()).toBeNull();
  });
});
