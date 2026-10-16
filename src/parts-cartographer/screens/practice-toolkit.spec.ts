import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import {
  ESSENTIAL_IDS,
  PracticeToolkit,
  TOOLKIT_KEY,
  addArtifact,
  addDays,
  addRewardOption,
  addReviewItem,
  addSeasonEndpoint,
  answerReviewItem,
  confirmIntervalChange,
  loadToolkit,
  localIsoDay,
  normalizeToolkit,
  parseDays,
  pickReward,
  recordExperimentOutcome,
  reviseArtifactById,
  saveExperimentCard,
  saveSeason,
  saveToolkit,
  switchedOnChecks,
  toggleProbe,
} from './practice-toolkit.jsx';
import { progressFor, isEssentialLocked } from '../core/artifact-progression.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const NOON = new Date(2026, 9, 16, 12, 0, 0);
const PROBE_TEXT = { room: 'Was it a different room?', day: 'Was it a different day?', people: 'Was someone else there?', topic: 'Was it a different topic?' };

function emptyToolkit() {
  return normalizeToolkit(null);
}

function withCard() {
  const made = saveExperimentCard(emptyToolkit(), { situation: 'When a meeting runs late', action: 'I will send one short message', prediction: '' }, null);
  if (!made.card) throw new Error('setup failed');
  return { toolkit: made.toolkit, cardId: made.card.id };
}

function withReview() {
  const added = addReviewItem(emptyToolkit(), 'The three steps of the breath', 'Count 4 in, 6 out', NOON);
  if (!added.item) throw new Error('setup failed');
  return { toolkit: added.toolkit, itemId: added.item.id };
}

function render(lang = 'en') {
  appMock.current = { t: (key: string) => key, lang, toast: vi.fn(), setOverlay: vi.fn() };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(PracticeToolkit)); });
  return host;
}

function buttonWithText(text: string): HTMLButtonElement {
  const buttons = Array.from(host?.querySelectorAll('button') ?? []);
  const exact = buttons.find((button) => button.textContent?.trim() === text);
  const found = exact ?? buttons.find((button) => button.textContent?.includes(text));
  expect(found, `button “${text}” should exist`).toBeTruthy();
  return found as HTMLButtonElement;
}

function clickButton(text: string) {
  act(() => { buttonWithText(text).click(); });
}

function fieldByLabel(label: string): HTMLInputElement | HTMLTextAreaElement {
  const match = Array.from(host?.querySelectorAll('label') ?? []).find((item) => item.textContent?.trim() === label);
  expect(match, `label “${label}” should exist`).toBeTruthy();
  const field = document.getElementById(match!.htmlFor);
  expect(field, `field for “${label}”`).toBeTruthy();
  return field as HTMLInputElement | HTMLTextAreaElement;
}

function typeInto(label: string, value: string) {
  const field = fieldByLabel(label);
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function stored() {
  return JSON.parse(localStorage.getItem(TOOLKIT_KEY) ?? 'null');
}

beforeEach(() => {
  localStorage.clear();
  appMock.current = null;
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('stored toolkit values', () => {
  it('falls back to an empty toolkit for corrupt or unexpected stored values', () => {
    localStorage.setItem(TOOLKIT_KEY, '{not json');
    expect(loadToolkit()).toEqual(emptyToolkit());
    expect(normalizeToolkit('a string')).toEqual(emptyToolkit());
    expect(normalizeToolkit({ cards: [{ id: 'c', situation: 'a', action: 'b', authoredBy: 'model' }] }).cards).toEqual([]);
  });

  it('drops outcomes that were not recorded, and any probe or interval outside the bounds', () => {
    const cleaned = normalizeToolkit({
      outcomes: [{ recorded: false, cardId: 'c', outcome: 'do-not-record', note: null }],
      reviews: [{ id: 'r', prompt: 'p', cue: '', intervalDays: 9999, dueOn: '2026-10-16' }, { id: 'bad', prompt: 'p', dueOn: 'soon', intervalDays: 2 }],
      probes: { room: true, unknown: true, day: false },
    });
    expect(cleaned.outcomes).toEqual([]);
    expect(cleaned.reviews.map((item) => [item.id, item.intervalDays])).toEqual([['r', 365]]);
    expect(cleaned.probes).toEqual({ room: true });
  });

  it('writes a version tag and reads it back, so a save can be confirmed', () => {
    expect(saveToolkit(emptyToolkit())).toBe(true);
    expect(stored()).toMatchObject({ version: 1, cards: [], outcomes: [] });
  });
});

describe('experiments', () => {
  it('creates a card only from a situation and an action, and authors it as the person', () => {
    expect(saveExperimentCard(emptyToolkit(), { situation: '  ', action: 'Rest', prediction: '' }, null).card).toBeNull();
    const made = saveExperimentCard(emptyToolkit(), { situation: 'When tired', action: 'Rest ten minutes', prediction: 'It will help a little' }, null);
    expect(made.card).toMatchObject({ situation: 'When tired', action: 'Rest ten minutes', authoredBy: 'user' });
  });

  it('keeps the card id when it is edited, so recorded outcomes stay linked', () => {
    const { toolkit, cardId } = withCard();
    const edited = saveExperimentCard(toolkit, { situation: 'When the call runs late', action: 'Send one message', prediction: '' }, cardId);
    expect(edited.toolkit.cards).toHaveLength(1);
    expect(edited.toolkit.cards[0]).toMatchObject({ id: cardId, situation: 'When the call runs late' });
  });

  it('stores nothing for do-not-record, not even the note', () => {
    const { toolkit, cardId } = withCard();
    const result = recordExperimentOutcome(toolkit, cardId, 'do-not-record', 'private words');
    expect(result.recorded).toBe(false);
    expect(result.toolkit).toBe(toolkit);
    saveToolkit(result.toolkit);
    expect(localStorage.getItem(TOOLKIT_KEY)).not.toContain('private words');
    expect(stored().outcomes).toEqual([]);
  });

  it('records each other outcome with a note, zero score effect and no causal claim', () => {
    const { toolkit, cardId } = withCard();
    const result = recordExperimentOutcome(toolkit, cardId, 'did-not-try', 'busy day');
    expect(result.recorded).toBe(true);
    expect(result.toolkit.outcomes).toEqual([
      { recorded: true, cardId, outcome: 'did-not-try', note: 'busy day', scoreDelta: 0, causalClaim: false },
    ]);
  });
});

describe('review', () => {
  it('starts an item at one day, due on the day it was added', () => {
    const { toolkit } = withReview();
    expect(toolkit.reviews[0]).toMatchObject({ intervalDays: 1, dueOn: '2026-10-16', lastResult: null });
    expect(addReviewItem(emptyToolkit(), '   ', '', NOON).item).toBeNull();
  });

  it('grows the interval after a recall and keeps it for every other result, with no score field', () => {
    const { toolkit, itemId } = withReview();
    const recalled = answerReviewItem(toolkit, itemId, 'recalled', NOON);
    expect(recalled.item).toMatchObject({ intervalDays: 2, dueOn: addDays('2026-10-16', 2), lastResult: 'recalled', lastScored: false });
    for (const result of ['could-not-recall', 'cue-helped', 'skipped'] as const) {
      const kept = answerReviewItem(toolkit, itemId, result, NOON);
      expect(kept.item?.intervalDays).toBe(1);
      expect(Object.keys(kept.item ?? {}).some((key) => /score/i.test(key) && key !== 'lastScored')).toBe(false);
    }
  });

  it('changes an interval only when the change is confirmed', () => {
    const { toolkit, itemId } = withReview();
    const unconfirmed = confirmIntervalChange(toolkit, itemId, 10, false, NOON);
    expect(unconfirmed).toEqual({ toolkit, applied: false });
    const confirmed = confirmIntervalChange(toolkit, itemId, 10, true, NOON);
    expect(confirmed.applied).toBe(true);
    expect(confirmed.toolkit.reviews[0]).toMatchObject({ intervalDays: 10, dueOn: '2026-10-26' });
  });

  it('shows only the boundary checks the person switched on', () => {
    let toolkit = emptyToolkit();
    toolkit = toggleProbe(toolkit, 'room');
    toolkit = toggleProbe(toolkit, 'day');
    toolkit = toggleProbe(toolkit, 'day');
    toolkit = toggleProbe(toolkit, 'not-a-probe');
    expect(switchedOnChecks(toolkit, PROBE_TEXT).map((check) => check.id)).toEqual(['room']);
  });
});

describe('artifacts, rewards and essentials', () => {
  it('counts artifacts and revisions, never reduces them, and has no streak field', () => {
    let toolkit = addArtifact(emptyToolkit(), 'A letter to myself', 'letter', NOON).toolkit;
    const id = toolkit.artifacts[0].id;
    toolkit = reviseArtifactById(toolkit, id);
    const progress = progressFor(toolkit.artifacts);
    expect(progress).toMatchObject({ artifactCount: 1, revisionCount: 1 });
    expect(Object.keys(progress).some((key) => /streak|energy|loot|lock/i.test(key))).toBe(false);
  });

  it('chooses only one reward the person put on their own list', () => {
    let toolkit = addRewardOption(emptyToolkit(), 'A short walk').toolkit;
    const option = toolkit.rewardOptions[0];
    expect(pickReward(toolkit, 'missing')).toBe(toolkit);
    toolkit = pickReward(toolkit, option.id);
    expect(toolkit.rewardChoice).toBe(option.id);
    expect(toolkit.rewardOptions[0].chosenBy).toBe('user');
  });

  it('never locks an essential behind progress or a reward', () => {
    const progress = progressFor([]);
    expect(ESSENTIAL_IDS.every((id) => isEssentialLocked(id, progress) === false)).toBe(true);
  });
});

describe('season', () => {
  it('leaves the length unset unless the person sets one', () => {
    expect(saveSeason(emptyToolkit(), 'rest more', '').season?.lengthDays).toBeNull();
    expect(saveSeason(emptyToolkit(), 'rest more', '30').season?.lengthDays).toBe(30);
  });

  it('keeps goals editable and keeps endpoints the person already added', () => {
    let toolkit = saveSeason(emptyToolkit(), 'rest more', '');
    toolkit = addSeasonEndpoint(toolkit, ' a calmer Sunday ');
    toolkit = saveSeason(toolkit, 'sleep earlier\n   \nwalk more', '');
    expect(toolkit.season?.goals).toEqual(['sleep earlier', 'walk more']);
    expect(toolkit.season?.endpoints).toEqual(['a calmer Sunday']);
  });

  it('has no rank, score or spirit field', () => {
    const season = saveSeason(emptyToolkit(), 'rest more', '').season ?? {};
    expect(Object.keys(season).some((key) => /rank|score|spirit|level/i.test(key))).toBe(false);
  });
});

describe('helpers', () => {
  it('turns free text into whole days within bounds, and treats blank as no length', () => {
    expect(parseDays('')).toBeNull();
    expect(parseDays('0')).toBeNull();
    expect(parseDays('-3')).toBeNull();
    expect(parseDays('abc')).toBeNull();
    expect(parseDays('12.6')).toBe(13);
    expect(parseDays('400')).toBe(365);
  });

  it('adds days across a month boundary using calendar days', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(localIsoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('practice toolkit screen', () => {
  it('shows the four sections and no streak or ranking', () => {
    render();
    for (const label of ['Experiments', 'Review', 'Artifacts', 'Season']) expect(buttonWithText(label)).toBeTruthy();
    expect(/streak|rank|points|level/i.test(host?.textContent ?? '')).toBe(false);
  });

  it('creates an experiment card and records a tried outcome with a note', () => {
    render();
    typeInto('If this situation comes up…', 'When a meeting runs late');
    typeInto('…then I will…', 'Send one short message');
    clickButton('Save card');
    expect(host?.textContent).toContain('When a meeting runs late');

    clickButton('Record an outcome');
    clickButton('I did not try it');
    typeInto('A note (optional)', 'Busy day');
    clickButton('Save outcome');
    expect(host?.querySelector('[role="status"]')?.textContent).toBe('Outcome recorded.');
    expect(stored().outcomes).toMatchObject([{ outcome: 'did-not-try', note: 'Busy day', scoreDelta: 0, causalClaim: false }]);
  });

  it('stores nothing when the person chooses do-not-record', () => {
    const { toolkit } = withCard();
    saveToolkit(toolkit);
    render();
    clickButton('Record an outcome');
    clickButton('Do not record this');
    expect(host?.textContent).toContain('Nothing is stored for this choice, not even a note.');
    expect(host?.querySelector('textarea')).toBeNull();
    clickButton('Continue without recording');
    expect(host?.querySelector('[role="status"]')?.textContent).toBe('Nothing was recorded.');
    expect(stored().outcomes).toEqual([]);
  });

  it('moves the interval only after Preview and Confirm change', () => {
    const { toolkit } = withReview();
    saveToolkit(toolkit);
    render();
    clickButton('Review');
    clickButton('Review now');
    clickButton('Preview');
    expect(host?.querySelector('[role="alert"]')?.textContent).toContain('whole number');

    typeInto('Days until the next review', '10');
    clickButton('Preview');
    expect(stored().reviews[0].intervalDays).toBe(1);
    clickButton('Confirm change');
    expect(stored().reviews[0].intervalDays).toBe(10);
    expect(host?.querySelector('[role="status"]')?.textContent).toBe('Interval changed.');
  });

  it('records a recall and grows the interval', () => {
    const { toolkit } = withReview();
    saveToolkit(toolkit);
    render();
    clickButton('Review');
    clickButton('Review now');
    clickButton('Show the hint');
    expect(host?.textContent).toContain('Count 4 in, 6 out');
    clickButton('Recalled');
    expect(host?.querySelector('[role="status"]')?.textContent).toBe('Recorded. The next review is further out.');
    expect(stored().reviews[0].intervalDays).toBe(2);
  });

  it('adds an artifact, revises it, and shows counts without a streak', () => {
    render();
    clickButton('Artifacts');
    typeInto('Title', 'A letter to myself');
    clickButton('Letter');
    clickButton('Save artifact');
    clickButton('Revise');
    expect(stored().artifacts[0].revisedCount).toBe(1);
    expect(host?.textContent).toContain('Revised 1 time');
  });

  it('saves a season with no set length and no rank text', () => {
    render();
    clickButton('Season');
    typeInto('Goals (one per line)', 'rest more');
    clickButton('Save season');
    expect(stored().season).toMatchObject({ goals: ['rest more'], lengthDays: null });
    expect(host?.textContent).toContain('No set length. Pause or stop whenever you like.');
  });

  it('renders every section in Russian without a crash', () => {
    render('ru');
    expect(host?.textContent).toContain('Набор практик');
    clickButton('Опыты');
    expect(host?.textContent).toContain('Новая карточка');
    clickButton('Повторение');
    expect(host?.textContent).toContain('Пока нечего повторять.');
    clickButton('Артефакты');
    expect(host?.textContent).toContain('Награда мастерской');
    clickButton('Сезон');
    expect(host?.textContent).toContain('Цели (по одной в строке)');
  });
});
