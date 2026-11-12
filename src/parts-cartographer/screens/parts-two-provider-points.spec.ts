import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_COPY, EXILE_COPY, MEMBER_COPY, PROVIDER_NAME_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';

// A provider point (plan §5.1, build-and-fix B7) is derived from its exile, so the screens that list parts must not
// list it as a part of its own, and saving must still work with it.
const app = vi.hoisted(() => ({ lang: 'en' as 'en' | 'ru', go: vi.fn(), parts: [] as unknown[], setParts: vi.fn(), setUniverseMode: vi.fn() }));
vi.mock('../app.jsx', () => ({
  useApp: () => ({ lang: app.lang, go: app.go, parts: app.parts, setParts: app.setParts, setUniverseMode: app.setUniverseMode }),
}));
import { PartsTwo, PlaceScreen } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const scenes: SceneAnswer[] = SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
}));

/** A protector who fears the frightened exile, whose provider has the given access. */
const withProvider = (access: 'easy' | 'effort' | 'none'): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes, picks: { attack: 'inner_critic' }, timing: { inner_critic: 'reactive' },
  costume: {}, confirm: {}, fears: { inner_critic: 'frightened' }, exileLevel: {}, exileNeed: {}, blending: {},
  providers: { frightened: { access } }, capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

const T = (key: string) => (UI_COPY as unknown as Record<string, { en: string }>)[key].en;
const tx = (value: { en: string }) => value.en;
const frame = { T, tx, stageNames: UI_COPY.stageNames.en, screens: [{ kind: 'place' }], index: 0, onBack: () => {}, onNext: null, nextLabel: null, nextDisabled: false };

describe('a provider point on the result, the place screen and the save', () => {
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
    vi.clearAllMocks();
    app.lang = 'en';
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
    act(() => { buttonLabelled(UI_COPY.resume[app.lang]).click(); });
  };

  it('renders a result with a provider point, with no card of its own and its access on the exile line', () => {
    openResult(withProvider('easy'));
    const cardNames = Array.from(host.querySelectorAll('li.card > strong')).map((element) => element.textContent);
    expect(cardNames).toContain(EXILE_COPY.frightened.name.en);
    expect(cardNames).not.toContain(PROVIDER_NAME_COPY.guardian.en);
    expect(host.textContent).toContain(`${UI_COPY.providerLabel.en}: ${ACCESS_COPY.easy.en}`);
  });

  it('lists the protector and the exile to place, and no provider point', () => {
    act(() => { root.render(React.createElement(PlaceScreen, { T, tx, frame, input: withProvider('easy'), setPlaced: vi.fn(), onNext: vi.fn() } as any)); });
    const chips = Array.from(host.querySelectorAll<HTMLButtonElement>('.p2-chip')).map((chip) => chip.textContent);
    expect(chips).toEqual([MEMBER_COPY.inner_critic.name.en, EXILE_COPY.frightened.name.en]);
  });

  it('saves a result with a provider point: the universe gets its part, and the app opens the map', () => {
    openResult(withProvider('easy'));
    act(() => { buttonLabelled(UI_COPY.save[app.lang]).click(); });
    expect(app.setUniverseMode).toHaveBeenCalledWith('parts');
    expect(app.go).toHaveBeenCalledWith('universe');
    const [saved] = app.setParts.mock.calls[0] as [Array<{ id: string }>];
    expect(saved.map((part) => part.id)).toContain('parts2_provider_frightened');
  });
});
