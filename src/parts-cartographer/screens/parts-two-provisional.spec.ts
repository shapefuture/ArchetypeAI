import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FAMILY_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { FAMILIES, FAMILY_DEFAULT, type FamilyId } from '../../shared/core/data/assessment2/taxonomy';
import {
  SCENES, SCENE_FAMILIES, rankFamilies, scoreFamilies, type Assessment2Input, type FamilyScores, type SceneAnswer,
} from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';

vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: 'en' }) }));
import { PartsTwo } from './parts-two.jsx';
import { ProvisionalPad } from './parts-two-provisional.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type Lang = 'en' | 'ru';
const copy = (lang: Lang) => ({
  T: (key: string) => (UI_COPY as unknown as Record<string, Record<Lang, string>>)[key][lang],
  tx: (value: Record<Lang, string>) => value[lang],
});
const LABEL = UI_COPY.provisionalLabel.en;

const none = (): FamilyScores => Object.fromEntries(FAMILIES.map((family) => [family, null])) as FamilyScores;

// Every family answered. attack, appease and overPerform are the top three. reframe is fourth, but 0.2 behind the third,
// which is outside RANK_MARGIN, so rankFamilies lists three.
const ANSWERED: FamilyScores = {
  overPerform: 0.2, overControl: -0.1, attack: 0.9, appease: 0.5, pursue: -0.3, withdraw: -0.2, numbSoothe: -0.6, reframe: 0,
};
// reframe is fourth and only 0.1 behind the third, so rankFamilies lists it as a fourth family, which is not marked as top.
const FOUR_RANKED: FamilyScores = { ...none(), attack: 0.9, appease: 0.5, overPerform: 0.2, reframe: 0.1 };

/** The point drawn for one family, or null when the family has no point. */
const pointOf = (host: HTMLElement, family: FamilyId) => host.querySelector<SVGCircleElement>(`circle[data-family="${family}"]`);
const pointFamilies = (host: HTMLElement) => Array.from(host.querySelectorAll('circle')).map((circle) => circle.getAttribute('data-family') ?? '');
/** The families marked as top, sorted so the comparison does not depend on drawing order. */
const topFamilies = (host: HTMLElement) => Array.from(host.querySelectorAll('circle.p2-prov-top'))
  .map((circle) => circle.getAttribute('data-family') ?? '')
  .sort();
const padOf = (host: HTMLElement) => host.querySelector<SVGSVGElement>(`svg[aria-label="${LABEL}"]`);

describe('provisional pad, rendered alone', () => {
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
  const render = (scores: FamilyScores, lang: Lang = 'en') => {
    const { T: t, tx: x } = copy(lang);
    act(() => {
      root.render(React.createElement(ProvisionalPad, { T: t, tx: x, scores } as any));
    });
  };
  const coordinate = (family: FamilyId, axis: 'cx' | 'cy') => Number(pointOf(host, family)?.getAttribute(axis));

  it('draws eight points, one per family, when every family is answered', () => {
    render(ANSWERED);
    expect(host.querySelectorAll('circle')).toHaveLength(8);
    expect([...pointFamilies(host)].sort()).toEqual([...FAMILIES].sort());
  });

  it('names each point after its family', () => {
    render(ANSWERED);
    expect(pointOf(host, 'attack')?.querySelector('title')?.textContent).toBe(FAMILY_COPY.attack.en);
  });

  it('places each family by its default: direction runs across, energy runs up', () => {
    render(ANSWERED);
    for (const a of FAMILIES) {
      for (const b of FAMILIES) {
        if (a === b) continue;
        expect(Math.sign(coordinate(a, 'cx') - coordinate(b, 'cx'))).toBe(Math.sign(FAMILY_DEFAULT[a].direction - FAMILY_DEFAULT[b].direction));
        expect(Math.sign(coordinate(a, 'cy') - coordinate(b, 'cy'))).toBe(-Math.sign(FAMILY_DEFAULT[a].energy - FAMILY_DEFAULT[b].energy));
      }
    }
  });

  it('marks the top three of rankFamilies, and no other point', () => {
    render(ANSWERED);
    const ranked = rankFamilies(ANSWERED).map((entry) => entry.family);
    expect(ranked).toEqual(['attack', 'appease', 'overPerform']);
    expect(topFamilies(host)).toEqual([...ranked].sort());
    expect(Array.from(host.querySelectorAll('.p2-prov-rank')).map((node) => node.textContent).sort()).toEqual(['1', '2', '3']);
  });

  it('does not mark a fourth family that rankFamilies lists within the margin', () => {
    render(FOUR_RANKED);
    expect(rankFamilies(FOUR_RANKED)).toHaveLength(4);
    expect(pointFamilies(host)).toHaveLength(4);
    expect(topFamilies(host)).toEqual(['appease', 'attack', 'overPerform']);
    expect(pointOf(host, 'reframe')?.classList.contains('p2-prov-top')).toBe(false);
  });

  it('draws no point for a family whose score is null, so unknown is never drawn as zero', () => {
    render({ ...ANSWERED, pursue: null, withdraw: null });
    expect(host.querySelectorAll('circle')).toHaveLength(6);
    expect(pointOf(host, 'pursue')).toBeNull();
    expect(pointOf(host, 'withdraw')).toBeNull();
  });

  it('never marks a null family, and marks the next three instead', () => {
    render({ ...ANSWERED, attack: null });
    expect(pointOf(host, 'attack')).toBeNull();
    expect(topFamilies(host)).toEqual(['appease', 'overPerform', 'reframe']);
  });

  it('draws no points when nothing is answered, and still shows the label', () => {
    render(none());
    expect(host.querySelectorAll('circle')).toHaveLength(0);
    expect(host.querySelector('figcaption')?.textContent).toBe(LABEL);
  });

  it('shows the label as a visible caption and as the accessible name of the pad', () => {
    render(ANSWERED);
    expect(LABEL).toBe('Provisional: family positions, not your parts.');
    expect(host.querySelector('figcaption')?.textContent).toBe(LABEL);
    expect(padOf(host)).not.toBeNull();
  });

  it('shows the Russian label in Russian', () => {
    render(ANSWERED, 'ru');
    expect(host.querySelector('figcaption')?.textContent).toBe(UI_COPY.provisionalLabel.ru);
    expect(host.querySelector(`svg[aria-label="${UI_COPY.provisionalLabel.ru}"]`)).not.toBeNull();
  });
});

describe('provisional pad in the flow', () => {
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

  // Every scene answered. attack is chosen "most" in every scene it appears in, so it leads the ranking.
  const scenes: SceneAnswer[] = SCENES.map((scene) => ({
    scene,
    most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
    least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
  }));
  const input: Assessment2Input = {
    completedStages: [], steadiness: 4, lighter: false, scenes, picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
    exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
  };
  const screenIndexes = (kind: string) => buildScreens(input).flatMap((screen, index) => (screen.kind === kind ? [index] : []));
  const expectedTop = rankFamilies(scoreFamilies(scenes)).slice(0, 3).map((entry) => entry.family).sort();

  /** Opens the flow on the screen at `index`, through the resume prompt that a stored draft shows. */
  const openAt = (index: number) => {
    localStorage.setItem(ROUTE_KEYS.parts2.draft, JSON.stringify({ version: 2, input, index }));
    act(() => { root.render(React.createElement(PartsTwo)); });
    const resume = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === UI_COPY.resume.en);
    if (!resume) throw new Error('no resume button');
    act(() => { resume.click(); });
  };

  it('shows the pad above the family list on the first pick screen, with the same top three', () => {
    const [first] = screenIndexes('pick');
    openAt(first);
    expect(host.querySelector('#p2-title')?.textContent).toBe(FAMILY_COPY.attack.en);
    const pad = padOf(host);
    const list = host.querySelector('ul.p2-list');
    expect(pad).not.toBeNull();
    expect(list).not.toBeNull();
    expect(pad!.compareDocumentPosition(list!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(topFamilies(host)).toEqual(expectedTop);
  });

  it('does not show the pad on the later pick screens', () => {
    const picks = screenIndexes('pick');
    expect(picks.length).toBeGreaterThan(1);
    const second = buildScreens(input)[picks[1]] as { kind: 'pick'; family: FamilyId };
    openAt(picks[1]);
    expect(host.querySelector('#p2-title')?.textContent).toBe(FAMILY_COPY[second.family].en);
    expect(padOf(host)).toBeNull();
  });

  it('shows the pad above the ranking on the result, with the same top three', () => {
    openAt(screenIndexes('result')[0]);
    const pad = padOf(host);
    const heading = Array.from(host.querySelectorAll('h3')).find((node) => node.textContent === UI_COPY.resultTop.en);
    expect(pad).not.toBeNull();
    expect(heading).toBeDefined();
    expect(pad!.compareDocumentPosition(heading!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(topFamilies(host)).toEqual(expectedTop);
  });
});
