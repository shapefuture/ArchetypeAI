import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_COPY, EXILE_COPY, GAP_COPY, NEED_COPY, NEED_PRACTICE, UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { EXERCISE_COPY } from '../../shared/i18n/strings';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';
import { CATALOG_REVIEW } from '../core/practice-catalog';

const mockState = vi.hoisted(() => ({ lang: 'en' as 'en' | 'ru' }));
vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: mockState.lang }) }));
import { PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The table need for powerless is agency. inner_critic's fear names powerless, so powerless is an exile on the result.
const exile = 'powerless' as const;
const scenes: SceneAnswer[] = SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
}));
const resultInput = (providers: Assessment2Input['providers'], exileNeed: Assessment2Input['exileNeed'] = {}): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes, picks: { attack: 'inner_critic' }, timing: { inner_critic: 'reactive' },
  costume: {}, confirm: {}, fears: { inner_critic: exile }, exileLevel: {}, exileNeed, blending: {}, providers,
  capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

// The catalog ships as draft with no reviewer. Tests set a review here and restore the shipped status in afterEach.
const originalStatus = CATALOG_REVIEW.status;
const setCatalogStatus = (status: string) => { (CATALOG_REVIEW as { status: string }).status = status; };

describe('provider none on the result', () => {
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
    setCatalogStatus(originalStatus);
    mockState.lang = 'en';
  });

  const buttonLabelled = (label: string) => {
    const found = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === label);
    if (!found) throw new Error(`no button labelled "${label}"`);
    return found;
  };

  /** Opens the flow on the result screen, through the resume prompt that a stored draft shows. */
  const openResult = (input: Assessment2Input) => {
    const index = buildScreens(input).findIndex((screen) => screen.kind === 'result');
    localStorage.setItem(ROUTE_KEYS.parts2.draft, JSON.stringify({ version: 2, input, index }));
    act(() => { root.render(React.createElement(PartsTwo)); });
    act(() => { buttonLabelled(UI_COPY.resume[mockState.lang]).click(); });
  };

  /** The card of the exile, found by the name in its first strong element. */
  const exileCard = () => Array.from(host.querySelectorAll<HTMLElement>('li.card'))
    .find((card) => card.querySelector('strong')?.textContent === EXILE_COPY[exile].name[mockState.lang]);

  it.each(['en', 'ru'] as const)('shows the gap with the need name and the after-review line, and no title, in %s while the catalog is draft', (language) => {
    mockState.lang = language;
    openResult(resultInput({ [exile]: { access: 'none' } }));
    const card = exileCard();
    expect(card).toBeDefined();
    expect(card?.textContent).toContain(GAP_COPY[language].replace('{need}', NEED_COPY.agency[language]));
    expect(card?.textContent).toContain(UI_COPY.practiceAfterReview[language]);
    expect(card?.textContent).not.toContain(EXERCISE_COPY[NEED_PRACTICE.agency][language].title);
    expect(card?.textContent).not.toContain(UI_COPY.practiceSuggested[language]);
  });

  it.each(['en', 'ru'] as const)('shows the practice title for the need in %s once the catalog is marked reviewed', (language) => {
    mockState.lang = language;
    setCatalogStatus('reviewed');
    openResult(resultInput({ [exile]: { access: 'none' } }));
    const card = exileCard();
    const title = EXERCISE_COPY[NEED_PRACTICE.agency][language].title;
    expect(card?.textContent).toContain(`${UI_COPY.practiceSuggested[language]}: ${title}`);
    expect(card?.textContent).toContain(GAP_COPY[language].replace('{need}', NEED_COPY.agency[language]));
    expect(card?.textContent).not.toContain(UI_COPY.practiceAfterReview[language]);
  });

  it('names the need the person chose, and shows that need\'s practice once reviewed', () => {
    setCatalogStatus('reviewed');
    openResult(resultInput({ [exile]: { access: 'none' } }, { [exile]: 'worth' }));
    const card = exileCard();
    expect(card?.textContent).toContain(`${UI_COPY.needLabel.en}: ${NEED_COPY.worth.en}`);
    expect(card?.textContent).toContain(GAP_COPY.en.replace('{need}', NEED_COPY.worth.en));
    expect(card?.textContent).toContain(EXERCISE_COPY[NEED_PRACTICE.worth].en.title);
    expect(card?.textContent).not.toContain(EXERCISE_COPY[NEED_PRACTICE.agency].en.title);
  });

  it.each(['easy', 'effort'] as const)('shows no gap for a provider that is %s', (access) => {
    openResult(resultInput({ [exile]: { access } }));
    const card = exileCard();
    expect(card).toBeDefined();
    expect(card?.textContent).toContain(`${UI_COPY.providerLabel.en}: ${ACCESS_COPY[access].en}`);
    expect(card?.textContent).not.toContain(GAP_COPY.en.replace('{need}', NEED_COPY.agency.en));
    expect(card?.textContent).not.toContain(UI_COPY.practiceAfterReview.en);
  });

  it('shows no gap when the provider question was skipped', () => {
    openResult(resultInput({}));
    const card = exileCard();
    expect(card).toBeDefined();
    expect(card?.textContent).not.toContain(GAP_COPY.en.replace('{need}', NEED_COPY.agency.en));
    expect(card?.textContent).not.toContain(UI_COPY.practiceAfterReview.en);
  });
});
