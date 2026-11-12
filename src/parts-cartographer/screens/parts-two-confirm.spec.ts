import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMBER_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';

vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: 'en' }) }));
import { ConfirmScreen, PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T = (key: string) => (UI_COPY as unknown as Record<string, { en: string }>)[key].en;
const tx = (value: { en: string }) => value.en;
const screen = { kind: 'confirm', member: 'taskmaster' };
const frame = { T, tx, stageNames: UI_COPY.stageNames.en, screens: [screen], index: 0, onBack: () => {}, onNext: null, nextLabel: null, nextDisabled: false };

/** For each of the three questions, the index of the pressed scale button, or -1 when none is pressed. */
const pressedRows = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('fieldset')).map((fieldset) =>
    Array.from(fieldset.querySelectorAll('button')).findIndex((button) => button.getAttribute('aria-pressed') === 'true'));

describe('confirm screen seeding', () => {
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
  const render = (input: unknown) => {
    act(() => { root.render(React.createElement(ConfirmScreen, { T, tx, frame, screen, input, setConfirm: vi.fn(), onSkip: vi.fn() } as any)); });
  };

  it('shows a stored answer as pressed when the screen opens', () => {
    render({ confirm: { taskmaster: [1, null, 5] } });
    expect(pressedRows(host)).toEqual([0, -1, 4]);
  });

  it.each([
    ['is missing', { confirm: {} }],
    ['is not a list of three', { confirm: { taskmaster: [1, 2] } }],
  ])('starts with nothing pressed when the stored answer %s', (_case, input) => {
    render(input);
    expect(pressedRows(host)).toEqual([-1, -1, -1]);
  });
});

describe('confirm screens of two members in one flow', () => {
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
  const buttonLabelled = (label: string) => {
    const found = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === label);
    if (!found) throw new Error(`no button labelled "${label}"`);
    return found;
  };
  const title = () => host.querySelector('#p2-title')?.textContent;
  const nextButton = () => host.querySelector('.p2-nav .btn.primary') as HTMLButtonElement;

  it("does not carry the first member's answers onto the second member's confirm screen", () => {
    // Taskmaster (overPerform) and worrier (overControl) are named. Each family is the least choice in one scene,
    // so neither is skipped, and both get a confirm screen, one right after the other.
    const scenes = [
      { scene: 'criticised', most: 'attack', least: 'overPerform' },
      { scene: 'leftOut', most: 'pursue', least: 'withdraw' },
      { scene: 'lineCrossed', most: 'attack', least: 'overControl' },
      { scene: 'fellThrough', most: 'numbSoothe', least: 'reframe' },
      { scene: 'planChanged', most: 'reframe', least: 'numbSoothe' },
      { scene: 'freeEvening', most: 'pursue', least: 'withdraw' },
    ];
    const input = {
      completedStages: [], steadiness: null, lighter: false, scenes, picks: { overPerform: 'taskmaster', overControl: 'worrier' },
      timing: {}, costume: {}, confirm: {}, fears: {}, exileLevel: {}, exileNeed: {}, blending: {}, providers: {},
      capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
    };
    const firstConfirm = buildScreens(input as any).findIndex((s) => s.kind === 'confirm' && s.member === 'taskmaster');
    expect(firstConfirm).toBeGreaterThan(-1);
    localStorage.setItem(ROUTE_KEYS.parts2.draft, JSON.stringify({ version: 2, input, index: firstConfirm }));

    act(() => { root.render(React.createElement(PartsTwo)); });
    // A saved draft opens the resume screen first. Resuming restores the input and the index.
    act(() => { buttonLabelled(UI_COPY.resume.en).click(); });
    expect(title()).toBe(MEMBER_COPY.taskmaster.name.en);

    // Answer every question for the first member, then submit it.
    act(() => { host.querySelectorAll('fieldset').forEach((fieldset) => (fieldset.querySelectorAll('button')[2] as HTMLButtonElement).click()); });
    expect(nextButton().disabled).toBe(false);
    act(() => { nextButton().click(); });

    expect(title()).toBe(MEMBER_COPY.worrier.name.en);
    expect(pressedRows(host)).toEqual([-1, -1, -1]);
    expect(nextButton().disabled).toBe(true);
  });
});
