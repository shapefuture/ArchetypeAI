import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import {
  CHECKIN_FLOW_KEY,
  ContextualCheckIn,
  SituationInquiry,
  flowBegin,
  flowFinish,
  flowNext,
  flowPause,
  flowResume,
  isAllowedText,
  loadFlow,
  normalizeFlow,
  saveFlow,
  submitCorrection,
  submitHypothesis,
  submitNextAction,
} from './checkin-toolkit.jsx';
import { reviewedPractices } from '../core/practice-catalog.ts';
import { MAX_HYPOTHESES, MAX_QUESTIONS, formulation, startInquiry } from '../core/situation-inquiry.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const practices = reviewedPractices('en');
const [first, second] = practices;

function render(component: React.FunctionComponent, lang = 'en') {
  appMock.current = { t: (key: string) => key, lang, toast: vi.fn(), setOverlay: vi.fn() };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(component)); });
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

function fieldByLabel(label: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  const labels = Array.from(host?.querySelectorAll('label') ?? []);
  const match = labels.find((item) => item.textContent?.trim() === label);
  expect(match, `label “${label}” should exist`).toBeTruthy();
  const field = document.getElementById(match!.htmlFor);
  expect(field, `field for “${label}”`).toBeTruthy();
  return field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
}

function typeInto(label: string, value: string) {
  const field = fieldByLabel(label);
  const proto = field instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });
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

describe('contextual check-in flow (pure)', () => {
  it('drops corrupt, unknown and out-of-range values so a bad store falls back to a clean start', () => {
    expect(normalizeFlow('{not json', practices)).toEqual({ current: null, completed: [] });
    expect(normalizeFlow(null, practices)).toEqual({ current: null, completed: [] });
    expect(normalizeFlow({ current: { practiceId: 'no-such', mode: 'full', stepIndex: 0 }, completed: ['no-such'] }, practices))
      .toEqual({ current: null, completed: [] });
    expect(normalizeFlow({ current: { practiceId: first.id, mode: 'loud', stepIndex: 0 } }, practices).current).toBeNull();
    expect(normalizeFlow({ current: { practiceId: first.id, mode: 'full', stepIndex: 999 } }, practices).current?.stepIndex)
      .toBe(first.steps.length - 1);
  });

  it('keeps the same step through a pause and a reload from storage, then resumes there', () => {
    let flow = flowBegin({ current: null, completed: [] }, first, 'full');
    flow = flowNext(flow, first);
    flow = flowPause(flow);
    expect(flow.current).toMatchObject({ stepIndex: 1, interrupted: true });

    saveFlow(flow);
    const reloaded = loadFlow(practices);
    expect(reloaded.current).toMatchObject({ practiceId: first.id, stepIndex: 1, interrupted: true });
    expect(flowResume(reloaded).current).toMatchObject({ stepIndex: 1, interrupted: false });
  });

  it('walks every step in full mode and never advances past the last one', () => {
    let flow = flowBegin({ current: null, completed: [] }, first, 'full');
    for (let i = 0; i < 10; i += 1) flow = flowNext(flow, first);
    expect(flow.current?.stepIndex).toBe(first.steps.length - 1);
  });

  it('shows one step in quiet mode, and finishing records only the practice id', () => {
    let flow = flowBegin({ current: null, completed: [] }, first, 'quiet');
    flow = flowNext(flow, first);
    expect(flow.current?.stepIndex).toBe(0);
    expect(flowFinish(flow)).toEqual({ current: null, completed: [first.id] });
  });

  it('stores only a version, the place and completed ids, with no score, streak or rank', () => {
    let flow = flowBegin({ current: null, completed: [] }, second, 'full');
    flow = flowFinish(flow);
    saveFlow(flow);
    const raw = localStorage.getItem(CHECKIN_FLOW_KEY) ?? '';
    expect(JSON.parse(raw)).toEqual({ version: 1, current: null, completed: [second.id] });
    expect(/score|streak|point|rank|level/i.test(raw)).toBe(false);
  });
});

describe('bounded situation inquiry wiring (pure)', () => {
  it('refuses overclaiming wording in readings, corrections and next steps, in English and Russian', () => {
    const inquiry = startInquiry('A tense call')!;
    expect(submitHypothesis(inquiry, 'h1', 'You are an anxious person', null)).toEqual({ ok: false, reason: 'overclaim' });
    expect(submitHypothesis(inquiry, 'h1', 'Ты всегда такой', null)).toEqual({ ok: false, reason: 'overclaim' });
    expect(submitCorrection(inquiry, 'This is caused by money')).toEqual({ ok: false, reason: 'overclaim' });
    expect(submitNextAction(inquiry, 'Это диагноз')).toEqual({ ok: false, reason: 'overclaim' });
    expect(isAllowedText('Возможно, я почувствовал спешку')).toBe(true);
  });

  it('refuses an empty correction without changing the inquiry', () => {
    const inquiry = startInquiry('A tense call')!;
    expect(submitCorrection(inquiry, '   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('caps readings at the module bound and shows the latest correction as the formulation', () => {
    let inquiry = startInquiry('A tense call')!;
    for (let i = 0; i < MAX_HYPOTHESES; i += 1) {
      const result = submitHypothesis(inquiry, `h${i}`, `Possibly I felt rushed ${i}`, null);
      if (!result.ok) throw new Error('setup failed');
      inquiry = result.inquiry;
    }
    expect(submitHypothesis(inquiry, 'h9', 'Possibly I felt rushed again', null)).toEqual({ ok: false, reason: 'limit' });

    inquiry = submitCorrection(inquiry, 'It was about money').inquiry;
    inquiry = submitCorrection(inquiry, 'It was about the deadline').inquiry;
    expect(formulation(inquiry)).toBe('It was about the deadline');
    expect(inquiry.corrections).toEqual(['It was about money', 'It was about the deadline']);
    expect(inquiry.observation).toBe('A tense call');
    expect(MAX_QUESTIONS).toBe(3);
  });
});

describe('contextual check-in screen', () => {
  it('offers only reviewed practices, with no assessment or synastry gate in the copy', () => {
    render(ContextualCheckIn);
    const text = host?.textContent ?? '';
    for (const practice of practices) expect(text).toContain(practice.title);
    expect(/assessment|synastry|147|64-item|profile/i.test(text)).toBe(false);
  });

  it('starts a practice, pauses, and resumes at the same step after a fresh mount', () => {
    render(ContextualCheckIn);
    clickButton(first.title);
    expect(host?.textContent).toContain(first.steps[0]);

    clickButton('Next step');
    expect(host?.textContent).toContain(first.steps[1]);

    clickButton('Pause and keep my place');
    expect(host?.textContent).toContain('Paused. Your place is kept.');
    expect(JSON.parse(localStorage.getItem(CHECKIN_FLOW_KEY) ?? '{}').current).toMatchObject({ stepIndex: 1, interrupted: true });

    act(() => { root?.unmount(); });
    root = null;
    host?.remove();
    render(ContextualCheckIn);
    expect(host?.textContent).toContain('Paused. Your place is kept.');
    clickButton('Resume');
    expect(host?.textContent).toContain(first.steps[1]);
  });

  it('uses the Russian plural for the step count and keeps the list usable in Russian', () => {
    render(ContextualCheckIn, 'ru');
    const ruFirst = reviewedPractices('ru')[0];
    const pickButton = Array.from(host?.querySelectorAll('button') ?? []).find((button) => button.textContent?.includes(ruFirst.title));
    expect(pickButton?.textContent).toContain(`${ruFirst.steps.length} шага`);
  });

  it('renders in quiet mode with one step and a finish button', () => {
    render(ContextualCheckIn);
    clickButton('Quiet');
    clickButton(first.title);
    expect(host?.textContent).toContain('One step. Finish when it feels done.');
    clickButton('Finish');
    expect(host?.textContent).toContain('Finished for now. Nothing is scored.');
    expect(JSON.parse(localStorage.getItem(CHECKIN_FLOW_KEY) ?? '{}').completed).toEqual([first.id]);
  });
});

describe('situation inquiry screen', () => {
  it('asks at most three questions and then says that is enough', () => {
    render(SituationInquiry);
    typeInto('What did you notice?', 'A tense call with a colleague');
    clickButton('Start');
    expect(host?.textContent).toContain('A tense call with a colleague');

    for (let i = 0; i < MAX_QUESTIONS; i += 1) {
      clickButton('Skip this question');
    }
    expect(host?.textContent).toContain('That is enough questions for now.');
    expect(Array.from(host?.querySelectorAll('button') ?? []).some((button) => button.textContent?.trim() === 'Skip this question')).toBe(false);
  });

  it('shows an overclaim refusal for a reading and keeps the reading out of the list', () => {
    render(SituationInquiry);
    typeInto('What did you notice?', 'A tense call');
    clickButton('Start');
    typeInto('A possible reading', 'You are an anxious person');
    clickButton('Add reading');
    expect(host?.querySelector('[role="alert"]')?.textContent).toContain('more tentative wording');
    expect(host?.textContent).not.toContain('You are an anxious person');
  });

  it('asks the same bounded questions in Russian', () => {
    render(SituationInquiry, 'ru');
    typeInto('Что вы заметили?', 'Напряжённый разговор');
    clickButton('Начать');
    expect(host?.textContent).toContain('Что было непосредственно перед этим?');
    clickButton('Пропустить вопрос');
    expect(host?.textContent).toContain('Что вам было нужно в тот момент?');
  });

  it('saves a correction and shows it as the current formulation', () => {
    render(SituationInquiry);
    typeInto('What did you notice?', 'A tense call');
    clickButton('Start');
    typeInto('Correct the formulation', 'It was about money');
    clickButton('Save correction');
    const heading = Array.from(host?.querySelectorAll('.kicker') ?? []).find((node) => node.textContent?.trim() === 'Current formulation');
    const card = heading?.closest('.tk-item');
    expect(card?.querySelector('.tk-step')?.textContent).toBe('It was about money');
    expect(JSON.parse(localStorage.getItem('INNERVERSE_TOOLKIT_V1') ?? '{}').inquiry.observation).toBe('A tense call');
  });
});
