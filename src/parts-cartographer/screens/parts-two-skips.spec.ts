import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, type Assessment2Input } from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from '../core/assessment-routes';
import { buildScreens } from '../core/parts-two-flow';

// What each Skip button stores. The browser suite walks one skipped timing; the other skip handlers in the screen
// switch of parts-two.jsx had no test. Each case resumes a draft on the screen under test, presses Skip, and reads
// the draft the screen writes back. The app context is stubbed, as in parts-two-last-result.spec.ts.

const app = vi.hoisted(() => ({ lang: 'en', go: vi.fn(), setParts: vi.fn(), setUniverseMode: vi.fn() }));
vi.mock('../app.jsx', () => ({ useApp: () => ({ parts: [], ...app }) }));
import { PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DRAFT = ROUTE_KEYS.parts2.draft;

/**
 * Every scene skipped, so no family needs confirming by the scenes alone and every later screen is owed.
 * inner_critic is named, with a timing, and fears frightened, so the exile screens are owed too.
 */
const input = (): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false,
  scenes: SCENES.map((scene) => ({ scene, most: null, least: null })),
  picks: { attack: 'inner_critic' }, timing: { inner_critic: 'reactive' }, costume: {}, confirm: {},
  fears: { inner_critic: 'frightened' }, exileLevel: { frightened: 3 }, exileNeed: {}, blending: {},
  providers: { frightened: { access: 'some', form: null } } as Assessment2Input['providers'],
  capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
  centre: { awareness: 4, will: 3, qualities: [] },
} as Assessment2Input);

describe('Parts 2.0 Skip buttons', () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    localStorage.clear();
  });

  const readDraft = () => JSON.parse(localStorage.getItem(DRAFT) ?? 'null');
  const click = (label: string) => act(() => {
    const found = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === label);
    if (!found) throw new Error(`no button "${label}" in: ${host.textContent}`);
    found.click();
  });

  /** Resumes on the first screen of this kind, presses Skip, and returns the stored draft and the screen index. */
  const skipOn = (kind: string, start: Assessment2Input = input()) => {
    const index = buildScreens(start).findIndex((screen) => screen.kind === kind);
    expect(index, `no ${kind} screen is owed`).toBeGreaterThan(0);
    localStorage.setItem(DRAFT, JSON.stringify({ version: 2, input: start, index }));
    act(() => { root.render(React.createElement(PartsTwo)); });
    click(UI_COPY.resume.en);
    click(UI_COPY.skip.en);
    return { draft: readDraft(), index };
  };

  it('a skipped scene is stored as a skip, not as an answer, and moves on', () => {
    const start = { ...input(), scenes: [] };
    const { draft, index } = skipOn('scene', start);
    expect(draft.input.scenes).toEqual([{ scene: SCENES[0], most: null, least: null }]);
    expect(draft.index).toBe(index + 1);
  });

  it('a skipped timing is stored as unknown, and moves on', () => {
    const { draft, index } = skipOn('timing');
    expect(draft.input.timing).toEqual({ inner_critic: null });
    expect(draft.index).toBe(index + 1);
  });

  it('skipped confirm items are stored as three unknowns', () => {
    const { draft, index } = skipOn('confirm');
    expect(draft.input.confirm).toEqual({ inner_critic: [null, null, null] });
    expect(draft.index).toBe(index + 1);
  });

  it('a skipped wants screen stores no need, and moves on', () => {
    const { draft, index } = skipOn('wants');
    expect(draft.input.exileNeed).toEqual({});
    expect(draft.index).toBe(index + 1);
  });

  it('a skipped provider screen removes an earlier provider answer', () => {
    const { draft, index } = skipOn('provider');
    expect(draft.input.providers).toEqual({});
    expect(draft.index).toBe(index + 1);
  });

  it('a skipped centre is stored as unanswered, and drops earlier centre answers', () => {
    const { draft, index } = skipOn('centre');
    expect(draft.input.centre).toEqual({ awareness: null, will: null, qualities: [] });
    expect(draft.index).toBe(index + 1);
  });
});
