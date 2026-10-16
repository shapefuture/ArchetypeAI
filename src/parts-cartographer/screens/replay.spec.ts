import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { ReplayStudio } from './replay.jsx';
import { REPLAY_KEY, WORLD_KEY } from '../core/replay-scenes.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOT_OPTED_IN = 'Tick the opt-in box first. A Replay is built only when you choose it.';
const CLAIM = 'The text claims what really happened or what will happen. Rephrase it as your own imagined version.';
const SAVED_READY = 'Saved on this device. You can watch it now.';
const NOT_STORED = 'This browser would not keep the change. It applies for this visit only.';
const PENDING = 'Pending. No evidence from real sessions has been entered yet.';
const EXPAND = 'Evidence for expansion is recorded. Review it against real sessions before acting.';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function context(overrides: Record<string, unknown> = {}) {
  return { t: (key: string) => key, lang: 'en', toast: vi.fn(), setOverlay: vi.fn(), ...overrides };
}

function mount(overrides: Record<string, unknown> = {}) {
  appMock.current = context(overrides);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(ReplayStudio)); });
  return host;
}

function buttonByText(text: string) {
  return [...(host?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((button) => button.textContent?.trim() === text);
}

function fieldFor(prefix: string) {
  const label = [...(host?.querySelectorAll('label') ?? [])].find((item) => item.textContent?.startsWith(prefix));
  return label?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea') ?? null;
}

function typeInto(element: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  act(() => {
    setter?.call(element, value);
    element?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function click(element: HTMLElement | undefined | null) {
  act(() => { element?.click(); });
}

function savedReplay() {
  return JSON.parse(localStorage.getItem(REPLAY_KEY) ?? 'null');
}

/** Opt in, name two people, write one beat, and save. */
function saveValidReplay(beat = 'Coffee is poured') {
  click(host?.querySelector<HTMLInputElement>('label.iv-field-inline input'));
  typeInto(fieldFor('Title'), 'Morning kitchen');
  typeInto(fieldFor('Cast member 1'), 'Sam');
  typeInto(fieldFor('Cast member 2'), 'Alex');
  typeInto(fieldFor('Beat 1'), beat);
  click(buttonByText('Save this Replay'));
}

beforeEach(() => { localStorage.clear(); });

afterEach(() => {
  act(() => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
  vi.restoreAllMocks();
});

describe('Replay studio: opt-in, cast and beats', () => {
  it('keeps Watch locked and says why until the person opts in and saves a valid Replay', () => {
    mount();
    expect(host?.textContent).toContain(NOT_OPTED_IN);
    expect(buttonByText('Watch')?.disabled).toBe(true);

    saveValidReplay();
    expect(host?.querySelector('[role="status"]')?.textContent).toBe(SAVED_READY);
    expect(buttonByText('Watch')?.disabled).toBe(false);
    expect(savedReplay().scene).toMatchObject({ optIn: true, castNames: ['Sam', 'Alex'], beats: ['Coffee is poured'] });
  });

  it('refuses reconstruction claims in the person\'s own text and keeps Watch locked', () => {
    mount();
    click(host?.querySelector<HTMLInputElement>('label.iv-field-inline input'));
    typeInto(fieldFor('Cast member 1'), 'Sam');
    typeInto(fieldFor('Cast member 2'), 'Alex');
    typeInto(fieldFor('Beat 1'), 'This is exactly what happened');
    expect(host?.textContent).toContain(CLAIM);

    click(buttonByText('Save this Replay'));
    expect(host?.querySelector('[role="status"]')?.textContent).toContain(CLAIM);
    expect(buttonByText('Watch')?.disabled).toBe(true);
  });

  it('never stores a refused draft, so the last valid Replay stays as it was', () => {
    mount();
    saveValidReplay();
    typeInto(fieldFor('Beat 1'), 'This is exactly what happened');
    click(buttonByText('Save this Replay'));
    expect(host?.querySelector('[role="status"]')?.textContent).toContain('Not saved.');
    expect(savedReplay().scene.beats).toEqual(['Coffee is poured']);
  });

  it('removes the saved Replay when the person unticks opt-in and saves', () => {
    mount();
    saveValidReplay();
    click(host?.querySelector<HTMLInputElement>('label.iv-field-inline input'));
    click(buttonByText('Save this Replay'));
    expect(savedReplay().scene).toBeNull();
    expect(host?.querySelector('[role="status"]')?.textContent).toBe('You have not opted in, so no Replay is kept on this device.');
    expect(buttonByText('Watch')?.disabled).toBe(true);
  });

  it('caps beats at six and hides the add button at the cap', () => {
    mount();
    for (let i = 0; i < 5; i += 1) click(buttonByText('Add a beat'));
    expect(host?.querySelectorAll('input[placeholder="One short moment"]').length).toBe(6);
    expect(buttonByText('Add a beat')).toBeUndefined();
    expect(host?.textContent).toContain('0 of 6 beats written');
  });

  it('leaves the cast editable: a renamed member is saved under the new name', () => {
    mount();
    saveValidReplay();
    typeInto(fieldFor('Cast member 2'), 'Jordan');
    click(buttonByText('Save this Replay'));
    expect(savedReplay().scene.castNames).toEqual(['Sam', 'Jordan']);
  });
});

describe('everyday scene and completion', () => {
  it('shows the structure and drawing-budget checks as passing', () => {
    mount();
    expect(host?.textContent).toContain('Structure checked: every frame has a text version');
    expect(host?.textContent).toContain('Drawing budget: 10 of 12 units.');
  });

  it('walks the branches and records the scene only after an explicit click on its ending', () => {
    mount();
    click(buttonByText('Offer to make tea'));
    click(buttonByText('Sit down together'));
    expect(host?.textContent).toContain('An ending');
    expect(localStorage.getItem(WORLD_KEY)).toBeNull();

    click(buttonByText('Mark this scene finished'));
    expect(JSON.parse(localStorage.getItem(WORLD_KEY) ?? 'null')).toMatchObject({ places: ['everyday-kitchen'], progress: 1 });
    expect(host?.textContent).toContain('Finished. This is recorded on this device only.');
  });
});

describe('Watch and Director', () => {
  it('moves between screens with nextScreen and changes only presentation, never the saved scene', () => {
    mount();
    saveValidReplay();
    click(buttonByText('Watch'));
    expect(buttonByText('Director')).toBeDefined();

    click(buttonByText('Director'));
    const sceneBefore = JSON.stringify(savedReplay().scene);

    click(buttonByText('Close'));
    click(buttonByText('Slow'));
    click(buttonByText('Sam'));
    expect(savedReplay().presentation).toEqual({ camera: 'close', pacing: 'slow', emphasis: 'Sam' });
    expect(JSON.stringify(savedReplay().scene)).toBe(sceneBefore);
    expect(host?.querySelector('.replay-stage')?.className).toContain('camera-close');
    expect(host?.querySelector('.replay-stage')?.className).toContain('pace-slow');

    click(buttonByText('Watch'));
    expect(buttonByText('Director')).toBeDefined();
    click(buttonByText('Back'));
    expect(buttonByText('Watch')?.disabled).toBe(false);
  });

  it('keeps the Replay watchable and the scene unchanged after every control is used', () => {
    mount();
    saveValidReplay();
    click(buttonByText('Watch'));
    click(buttonByText('Director'));
    const before = JSON.stringify(savedReplay());
    click(buttonByText('Close'));
    click(buttonByText('Wide'));
    click(buttonByText('Normal'));
    click(buttonByText('None'));
    const after = savedReplay();
    expect(JSON.stringify({ ...after, presentation: undefined })).toBe(JSON.stringify({ ...JSON.parse(before), presentation: undefined }));
    expect(after.presentation).toEqual({ camera: 'wide', pacing: 'normal', emphasis: null });
  });
});

describe('expansion gate', () => {
  it('stays pending on playtime alone and expands only with recorded evidence', () => {
    mount();
    expect(host?.textContent).toContain('Needs real sessions');
    expect(host?.textContent).toContain(PENDING);

    typeInto(fieldFor('Minutes in real sessions'), '5000');
    click(buttonByText('Record evidence'));
    expect(host?.textContent).toContain(PENDING);

    typeInto(fieldFor('Reports of benefit'), '2');
    typeInto(fieldFor('Records of demand'), '1');
    typeInto(fieldFor('Note on the complexity'), 'Needs a longer setup');
    click(buttonByText('Record evidence'));
    expect(host?.textContent).toContain(EXPAND);
  });

  it('refuses a negative count instead of recording it', () => {
    mount();
    typeInto(fieldFor('Records of demand'), '-3');
    click(buttonByText('Record evidence'));
    expect(host?.textContent).toContain('Enter zero or a positive number.');
    expect(localStorage.getItem(REPLAY_KEY)).toBeNull();
  });
});

describe('storage and language', () => {
  it('falls back to an empty studio for corrupt stored values', () => {
    localStorage.setItem(REPLAY_KEY, '{not json');
    localStorage.setItem(WORLD_KEY, '[1,2');
    mount();
    expect(host?.textContent).toContain(NOT_OPTED_IN);
    expect(host?.textContent).toContain(PENDING);
    expect(buttonByText('Watch')?.disabled).toBe(true);
  });

  it('says plainly when the browser will not keep a change', () => {
    mount();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    saveValidReplay();
    expect(host?.querySelector('[role="status"]')?.textContent).toBe(NOT_STORED);
    expect(buttonByText('Watch')?.disabled).toBe(true);
  });

  it('renders Russian copy when the app is in Russian', () => {
    mount({ lang: 'ru' });
    expect(host?.querySelector('h2')?.textContent).toBe('Реплей');
    expect(host?.textContent).toContain('Сохранить этот Реплей');
  });
});
