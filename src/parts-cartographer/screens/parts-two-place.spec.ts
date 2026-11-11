import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';

vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: 'en' }) }));
import { PlaceScreen } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const scenes: SceneAnswer[] = SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
}));
const input = {
  completedStages: [], steadiness: 4, lighter: false, scenes, picks: { attack: 'rebel' }, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
} as unknown as Assessment2Input;

const T = (key: string) => (UI_COPY as unknown as Record<string, { en: string }>)[key].en;
const tx = (value: { en: string }) => value.en;
const frame = { T, tx, stageNames: UI_COPY.stageNames.en, screens: [{ kind: 'place' }], index: 0, onBack: () => {}, onNext: null, nextLabel: null, nextDisabled: false };

describe('placement screen wiring', () => {
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
  const render = (setPlaced: (key: string, values: unknown) => void) => {
    act(() => { root.render(React.createElement(PlaceScreen, { T, tx, frame, input, setPlaced, onNext: vi.fn() } as any)); });
  };

  it('starts with every axis shown as not answered', () => {
    render(vi.fn());
    expect(host.textContent).toContain('not set by you');
    expect(host.textContent).toContain('Depth not answered yet');
  });

  it('tells assistive technology that depth is not answered, and does not read the placeholder value', () => {
    render(vi.fn());
    const slider = host.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.getAttribute('aria-valuetext')).toBe('Depth not answered yet');
  });

  it('"Not sure" writes depth as unsure and nothing else', () => {
    const setPlaced = vi.fn();
    render(setPlaced);
    const button = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Not sure')!;
    act(() => { button.click(); });
    expect(setPlaced).toHaveBeenCalledTimes(1);
    expect(setPlaced.mock.calls[0]).toEqual(['member:rebel', { depth: null }]);
  });

  it('an arrow key on the pad writes only the axis it moves', () => {
    const setPlaced = vi.fn();
    render(setPlaced);
    const pad = host.querySelector('[role="application"]') as HTMLElement;
    act(() => { pad.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
    expect(setPlaced).toHaveBeenCalledTimes(1);
    expect(Object.keys(setPlaced.mock.calls[0][1])).toEqual(['energy']);
  });

  it('moving the depth slider writes depth only', () => {
    const setPlaced = vi.fn();
    render(setPlaced);
    const slider = host.querySelector('input[type="range"]') as HTMLInputElement;
    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setValue.call(slider, '0.5');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(setPlaced.mock.calls[0]).toEqual(['member:rebel', { depth: 0.5 }]);
  });
});
