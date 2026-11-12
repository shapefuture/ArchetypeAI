import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES } from '../../shared/core/data/assessment2/scoring';
import { ROUTE_KEYS } from '../core/assessment-routes';

// The draft, Back and refused-save paths of the Parts 2.0 screen. Coverage showed the screen-level wiring for these was
// not run by any unit test: resume from a draft, the pre-depth-rule draft migration, Back, and a save that does not
// read back. The app context is stubbed, as in parts-two-last-result.spec.ts.

const app = vi.hoisted(() => ({ lang: 'en', go: vi.fn(), setParts: vi.fn(), setUniverseMode: vi.fn() }));
vi.mock('../app.jsx', () => ({ useApp: () => ({ parts: [], ...app }) }));
import { PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DRAFT = ROUTE_KEYS.parts2.draft;
const RESULT = ROUTE_KEYS.parts2.result;
const PLACED = { inner_critic: { energy: 0.4, direction: -0.2, depth: null } };

// Every scene skipped: the flow then owes the screens after the scenes, up to the result.
const ALL_SCENES_SKIPPED = SCENES.map((scene) => ({ scene, most: null, least: null }));
const draftInput = (placed: unknown = {}, scenes: unknown[] = []) => ({
  steadiness: 4, lighter: false, scenes, picks: {}, timing: {}, costume: {}, confirm: {}, fears: {},
  exileLevel: {}, exileNeed: {}, blending: {}, providers: {}, capacityEasiest: null, capacityHardest: null,
  ground: [], placed, centre: { awareness: null, will: null, qualities: [] },
});
const writeDraft = (draft: unknown) => localStorage.setItem(DRAFT, JSON.stringify(draft));
const readDraft = () => JSON.parse(localStorage.getItem(DRAFT) ?? 'null');

describe('Parts 2.0 draft, Back and refused save', () => {
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
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const render = () => act(() => { root.render(React.createElement(PartsTwo)); });
  const button = (label: string) => {
    const found = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === label);
    if (!found) throw new Error(`no button "${label}" in: ${host.textContent}`);
    return found;
  };
  const click = (label: string) => act(() => { button(label).click(); });
  const hasButton = (label: string) => Array.from(host.querySelectorAll('button')).some((b) => b.textContent === label);

  it('offers resume for a stored draft, and resuming returns to the stored screen', () => {
    writeDraft({ version: 2, input: draftInput(), index: 2 });
    render();
    expect(hasButton(UI_COPY.resume.en)).toBe(true);
    click(UI_COPY.resume.en);
    expect(readDraft().index).toBe(2);
    expect(hasButton(UI_COPY.back.en)).toBe(true);
  });

  it('keeps the placements of a current draft, and drops those of a draft written before the depth rule', () => {
    writeDraft({ version: 2, input: draftInput(PLACED), index: 0 });
    render();
    click(UI_COPY.resume.en);
    expect(readDraft().input.placed).toEqual(PLACED);
    act(() => root.unmount());

    root = createRoot(host);
    writeDraft({ version: 1, input: draftInput(PLACED), index: 0 });
    render();
    click(UI_COPY.resume.en);
    expect(readDraft().input.placed).toEqual({});
    expect(readDraft().version).toBe(2);
  });

  it('start again clears the draft and opens the first screen, with no Back', () => {
    writeDraft({ version: 2, input: draftInput(), index: 3 });
    render();
    click(UI_COPY.restart.en);
    expect(readDraft().index).toBe(0);
    expect(hasButton(UI_COPY.back.en)).toBe(false);
  });

  it('Back moves one screen back and keeps the answers given', () => {
    writeDraft({ version: 2, input: draftInput(), index: 2 });
    render();
    click(UI_COPY.resume.en);
    click(UI_COPY.back.en);
    expect(readDraft().index).toBe(1);
    expect(readDraft().input.steadiness).toBe(4);
  });

  it('a draft with scenes still unanswered resumes no further than the scenes', () => {
    writeDraft({ version: 2, input: draftInput(), index: 999 });
    render();
    click(UI_COPY.resume.en);
    expect(readDraft().index).toBe(SCENES.length);
    expect(hasButton(UI_COPY.save.en)).toBe(false);
  });

  it('a draft index past the last screen opens the result, not a blank screen', () => {
    writeDraft({ version: 2, input: draftInput({}, ALL_SCENES_SKIPPED), index: 999 });
    render();
    click(UI_COPY.resume.en);
    expect(hasButton(UI_COPY.save.en)).toBe(true);
  });

  it('a save that the browser refuses says so, keeps the draft, and does not leave the screen', () => {
    writeDraft({ version: 2, input: draftInput({}, ALL_SCENES_SKIPPED), index: 999 });
    render();
    click(UI_COPY.resume.en);
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === RESULT) throw new DOMException('full', 'QuotaExceededError');
      return setItem.call(this, key, value);
    });
    click(UI_COPY.save.en);
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(UI_COPY.saveFailed.en);
    expect(readDraft()).not.toBeNull();
    expect(localStorage.getItem(RESULT)).toBeNull();
    expect(app.go).not.toHaveBeenCalled();
    expect(app.setParts).not.toHaveBeenCalled();
  });
});
