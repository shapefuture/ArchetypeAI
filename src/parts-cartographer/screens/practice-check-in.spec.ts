import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESOURCES, SHADOW_PARTS } from '../../app/core/data/parts';
import { scoreProfile } from '../../app/core/data/scoring-v2';
import { EXERCISES, EXERCISE_TYPES } from '../../app/core/data/exercises';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';
import { STRINGS } from '../../i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const therapistMock = vi.hoisted(() => ({ assignments: [] as unknown[] }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/therapist-link.ts', () => ({
  myAssignments: () => ({
    then: (onFulfilled: (assignments: unknown[]) => unknown) => {
      onFulfilled(therapistMock.assignments);
      return { catch: () => undefined };
    },
  }),
}));
import { CheckIn } from './check-in.jsx';
import { Practice } from './practice.jsx';
import { downloadBackup } from './landing.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function completeInput(answer = 4) {
  return {
    self: Array(8).fill(answer),
    shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array(8).fill(answer)])),
    resources: Object.fromEntries(RESOURCES.map((id) => [id, Array(6).fill(answer)])),
    validity: { attention: 4, infrequency: [4, 4] },
  };
}

const canonicalProfile = (answer = 4) => adaptClinicalProfile(scoreProfile(completeInput(answer)), 'en').profile;

function appContext(profile = canonicalProfile(), linked = false) {
  return {
    t: (key: string) => ({ close: 'Close', done: 'Done', continue: 'Continue', therapist: 'Therapist' }[key] ?? key),
    lang: 'en',
    setOverlay: vi.fn(),
    toast: vi.fn(),
    profile,
    user: { linked, uid: linked ? 'client-uid' : null },
  };
}

function mount(component: React.FunctionComponent) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(component)); });
  return host;
}

function clickButton(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => {
    const label = candidate.textContent?.trim() ?? '';
    return label === text || label.includes(text);
  });
  expect(button, `button “${text}” should exist`).toBeTruthy();
  act(() => { (button as HTMLButtonElement).click(); });
}

beforeEach(() => {
  localStorage.clear();
  therapistMock.assignments = [];
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('React Practice and CheckIn parity', () => {
  it('uses seven distinct check-in days, part-dialogue completion, therapist assignments, and the safe-place gate', async () => {
    const checkIns = Array.from({ length: 7 }, (_, index) => ({
      date: new Date(2025, 0, index + 1, 12).toISOString(), arousal: 0,
    }));
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify(checkIns));
    localStorage.setItem('INNERVERSE_PRACTICE_V1', JSON.stringify({ completed: ['six-f-steps'], ladder: {} }));
    const redExercise = EXERCISES.find((exercise) => EXERCISE_TYPES[exercise.type].gate === 'red')!;
    const safePlace = EXERCISES.find((exercise) => exercise.id === 'build-safe-place')!;
    therapistMock.assignments = [{ id: 'assignment-1', exerciseId: redExercise.id, frequency: 'once', note: 'Practice together' }];
    appMock.current = appContext(canonicalProfile(5), true);
    const container = mount(Practice);

    expect(EXERCISES).toHaveLength(56);
    expect(new Set(EXERCISES.map((exercise) => exercise.type)).size).toBe(22);
    const chapterOneExercise = EXERCISES.find((exercise) => EXERCISE_TYPES[exercise.type].chapter === 1)!;
    expect(container.textContent).toContain(chapterOneExercise.title.en);
    expect(container.textContent).toContain(STRINGS.practice.en.chapterNames[1]);
    expect(container.textContent).toContain(STRINGS.practice.en.chapterNames[2]);
    expect(container.textContent).toContain(STRINGS.practice.en.chapterNames[3]);
    expect(container.textContent).toContain(STRINGS.practice.en.chapterNames[4]);

    const findRedButton = () => Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes(redExercise.title.en));
    expect((findRedButton() as HTMLButtonElement).disabled).toBe(true);
    clickButton(container, safePlace.title.en);
    clickButton(container, STRINGS.practice.en.done);
    expect(JSON.parse(localStorage.getItem('INNERVERSE_PRACTICE_V1') ?? '{}').completed).toContain('build-safe-place');
    expect((findRedButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it('does not unlock chapter two from seven check-ins on a single day', async () => {
    const sameDay = Array.from({ length: 7 }, () => ({ date: new Date(2025, 0, 1, 12).toISOString(), arousal: 0 }));
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify(sameDay));
    const container = mount(Practice);
    const chapterTwoExercise = EXERCISES.find((exercise) => EXERCISE_TYPES[exercise.type].chapter === 2)!;
    expect(container.textContent).toContain(STRINGS.practice.en.ch2Hint);
    expect(container.textContent).not.toContain(chapterTwoExercise.title.en);
  });

  it('records a canonical five-point check-in, prediction, and JITAI timestamp', async () => {
    const container = mount(CheckIn);
    clickButton(container, 'Hyper');
    clickButton(container, 'Relational');
    clickButton(container, STRINGS.checkin.ui.en.yes);

    const rows = JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1') ?? '[]');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ arousal: 2, eventType: 'relational' });
    expect(typeof rows[0].predictedPart).toBe('string');
    expect(rows[0].confirmedPart).toBe(rows[0].predictedPart);
    expect(localStorage.getItem('INNERVERSE_JITAI_V1')).toBeTruthy();
    expect(container.textContent).toContain(STRINGS.checkin.ui.en.done);
    expect(container.textContent).toContain(STRINGS.checkin.jitaiCards.en.body_anchor.title);
  });

  it('still records a check-in without a canonical scored profile', async () => {
    appMock.current = appContext(null);
    const container = mount(CheckIn);
    clickButton(container, 'In my window');
    clickButton(container, STRINGS.checkin.ui.en.skip);
    clickButton(container, STRINGS.checkin.ui.en.no);

    const rows = JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1') ?? '[]');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ arousal: 0, confirmedPart: null });
    expect(rows[0].predictedPart).toBeUndefined();
  });

  it('includes canonical check-in and practice contracts in explicit backups without exporting unrelated secrets', async () => {
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify([{ date: '2026-10-03T12:00:00.000Z', arousal: 0 }]));
    localStorage.setItem('INNERVERSE_PRACTICE_V1', JSON.stringify({ completed: ['build-safe-place'] }));
    localStorage.setItem('unrelated.authToken', 'must-not-export');
    const url = URL as typeof URL & { createObjectURL?: (blob: Blob) => string };
    const originalCreateObjectURL = url.createObjectURL;
    const createObjectURL = vi.fn(() => 'blob:backup-test');
    Object.defineProperty(url, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    try {
      downloadBackup();
      const blob = createObjectURL.mock.calls[0]?.[0];
      expect(blob).toBeTruthy();
      const json = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob as Blob);
      });
      const exported = JSON.parse(json);
      expect(exported.schema).toBe('parts-cartographer.backup.v2');
      const backup = exported.data;
      expect(backup.INNERVERSE_CHECKINS_V1).toHaveLength(1);
      expect(backup.INNERVERSE_PRACTICE_V1.completed).toContain('build-safe-place');
      expect(backup['unrelated.authToken']).toBeUndefined();
    } finally {
      click.mockRestore();
      if (originalCreateObjectURL) Object.defineProperty(url, 'createObjectURL', { configurable: true, writable: true, value: originalCreateObjectURL });
      else Reflect.deleteProperty(url, 'createObjectURL');
    }
  });
});
