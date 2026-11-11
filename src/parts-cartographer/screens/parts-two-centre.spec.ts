import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CENTRE_QUALITY_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens, stageOf } from '../core/parts-two-flow';

vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: 'en' }) }));
import { PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T = (key: string) => (UI_COPY as unknown as Record<string, { en: string }>)[key].en;

// Every scene answered for attack, so attack is the pick and inner_critic's fear names powerless (as in the wants spec).
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

const screenIndex = (kind: string) => buildScreens(input).findIndex((screen) => screen.kind === kind);

/** The Centre's place in the flow. Fails here when the Centre is missing, rather than opening some other screen. */
const centreAt = () => {
  const at = screenIndex('centre');
  expect(at).toBeGreaterThan(-1);
  return at;
};

describe('the Centre in the screen order (plan §4, stage 5)', () => {
  it('comes after capacity and before ground2, and is stage 5', () => {
    const kinds = buildScreens(input).map((screen) => screen.kind);
    expect(kinds.slice(-5)).toEqual(['capacity', 'centre', 'ground2', 'place', 'result']);
    expect(stageOf({ kind: 'centre' })).toBe(5);
  });
});

describe('the Centre screen and the Self section, in the flow', () => {
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
  /** The choice labelled `label` inside the question `question`, so the two scales do not share a button. */
  const choiceUnder = (question: string, label: string) => {
    const legend = Array.from(host.querySelectorAll('legend')).find((node) => node.textContent === question);
    const choices = Array.from(legend?.parentElement?.querySelectorAll('button') ?? []);
    const found = choices.find((button) => button.textContent?.trim() === label);
    if (!found) throw new Error(`no choice "${label}" under "${question}"`);
    return found;
  };
  const nextButton = () => host.querySelector('.p2-nav .btn.primary') as HTMLButtonElement;
  const savedDraft = () => JSON.parse(localStorage.getItem(ROUTE_KEYS.parts2.draft) ?? 'null');
  /** The text under the Self heading of the result. */
  const selfSection = () => {
    const heading = Array.from(host.querySelectorAll('h3')).find((node) => node.textContent === T('centreTitle'));
    return heading?.nextElementSibling?.textContent ?? '';
  };

  /** Opens the flow on the screen at `index`, through the resume prompt that a stored draft shows. */
  const openAt = (index: number, draftInput: Assessment2Input = input) => {
    localStorage.setItem(ROUTE_KEYS.parts2.draft, JSON.stringify({ version: 2, input: draftInput, index }));
    act(() => { root.render(React.createElement(PartsTwo)); });
    act(() => { buttonLabelled(UI_COPY.resume.en).click(); });
  };

  it('stores the all-null Centre on a whole-screen skip, and moves on', () => {
    const at = centreAt();
    openAt(at);
    expect(host.querySelector('#p2-title')?.textContent).toBe(T('centreTitle'));
    act(() => { buttonLabelled(T('skip')).click(); });
    const draft = savedDraft();
    expect(draft.input.centre).toEqual({ awareness: null, will: null, qualities: [] });
    expect(draft.index).toBe(at + 1);
    expect(buildScreens(draft.input)[draft.index].kind).toBe('ground2');
  });

  it('stores the awareness, will and qualities the person chose, and moves on', () => {
    const at = centreAt();
    openAt(at);
    act(() => { choiceUnder(T('centreAwarenessQ'), '3. Somewhat').click(); });
    act(() => { choiceUnder(T('centreWillQ'), '5. Completely').click(); });
    act(() => { buttonLabelled(CENTRE_QUALITY_COPY.courage.en).click(); });
    act(() => { buttonLabelled(CENTRE_QUALITY_COPY.calm.en).click(); });
    expect(choiceUnder(T('centreAwarenessQ'), '3. Somewhat').getAttribute('aria-pressed')).toBe('true');
    act(() => { nextButton().click(); });
    const draft = savedDraft();
    // Qualities are stored in SELF_QUALITIES order, so the order of the taps does not change the result.
    expect(draft.input.centre).toEqual({ awareness: 3, will: 5, qualities: ['calm', 'courage'] });
    expect(draft.index).toBe(at + 1);
  });

  it('disables the other qualities once three are chosen, and frees them when one is removed', () => {
    openAt(centreAt());
    for (const quality of ['calm', 'clarity', 'compassion'] as const) act(() => { buttonLabelled(CENTRE_QUALITY_COPY[quality].en).click(); });
    expect(buttonLabelled(CENTRE_QUALITY_COPY.curiosity.en).disabled).toBe(true);
    expect(buttonLabelled(CENTRE_QUALITY_COPY.calm.en).disabled).toBe(false);
    act(() => { buttonLabelled(CENTRE_QUALITY_COPY.calm.en).click(); });
    expect(buttonLabelled(CENTRE_QUALITY_COPY.curiosity.en).disabled).toBe(false);
    act(() => { nextButton().click(); });
    expect(savedDraft().input.centre.qualities).toEqual(['clarity', 'compassion']);
  });

  it('keeps Next enabled with nothing answered, and stores the unanswered Centre', () => {
    const at = centreAt();
    openAt(at);
    expect(nextButton().disabled).toBe(false);
    act(() => { nextButton().click(); });
    expect(savedDraft().input.centre).toEqual({ awareness: null, will: null, qualities: [] });
    expect(savedDraft().index).toBe(at + 1);
  });

  it('stores null for a question skipped on its own, and keeps the other answers', () => {
    openAt(centreAt());
    act(() => { choiceUnder(T('centreAwarenessQ'), '4. Mostly').click(); });
    act(() => { choiceUnder(T('centreAwarenessQ'), T('centreSkipOne')).click(); });
    act(() => { choiceUnder(T('centreWillQ'), '2. A little').click(); });
    expect(choiceUnder(T('centreAwarenessQ'), T('centreSkipOne')).getAttribute('aria-pressed')).toBe('true');
    act(() => { nextButton().click(); });
    expect(savedDraft().input.centre).toEqual({ awareness: null, will: 2, qualities: [] });
  });

  it('says not answered for each unanswered value and for an empty quality list, in the Self section', () => {
    openAt(buildScreens(input).length - 1);
    const section = selfSection();
    expect(section).toContain(`${T('centreAwarenessLabel')}: ${T('centreNotAnswered')}`);
    expect(section).toContain(`${T('centreWillLabel')}: ${T('centreNotAnswered')}`);
    expect(section).toContain(`${T('centreQualitiesLabel')}: ${T('centreNotAnswered')}`);
  });

  it('shows the awareness, will and quality names in the Self section when they were answered', () => {
    const answered: Assessment2Input = { ...input, centre: { awareness: 3, will: 5, qualities: ['calm', 'courage'] } };
    openAt(buildScreens(answered).length - 1, answered);
    const section = selfSection();
    expect(section).toContain(`${T('centreAwarenessLabel')}: 3 / 5`);
    expect(section).toContain(`${T('centreWillLabel')}: 5 / 5`);
    expect(section).toContain(`${T('centreQualitiesLabel')}: ${CENTRE_QUALITY_COPY.calm.en}, ${CENTRE_QUALITY_COPY.courage.en}`);
  });
});
