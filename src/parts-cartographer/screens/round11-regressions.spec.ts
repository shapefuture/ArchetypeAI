// Gauntlet round 11 scratch reproductions (critic). Each test is expected to FAIL on 18b92d9.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHADOW_PARTS, RESOURCES, EXILES } from '../../shared/core/data/parts';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { EXERCISES, EXERCISE_TYPES } from '../../shared/core/data/exercises';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';
import { STRINGS } from '../../shared/i18n/strings';
import { computeSynastry } from '../../shared/core/data/synastry';
import { makeProfile, synastry as synastryV2, toSynastryProfile } from '../../shared/core/data/synastry-v2';
import { snapshot, fromDocument } from '../core/cloud-storage';
import { prepareBackup } from '../core/backup';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/therapist-link.ts', () => ({
  myAssignments: () => ({ then: (f: (a: unknown[]) => unknown) => { f([]); return { catch: () => undefined }; } }),
}));
import { CheckIn } from './check-in.jsx';
import { Practice } from './practice.jsx';
import { ScoredProfileSynastryDetails } from './scored-profile-synastry-report.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const input = (answer = 4) => ({
  self: Array(8).fill(answer),
  shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array(8).fill(answer)])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, Array(6).fill(answer)])),
  validity: { attention: 4, infrequency: [4, 4] },
});
const canonical = () => adaptClinicalProfile(scoreProfile(input() as any), 'en').profile as any;
const ctx = (profile: any = canonical()) => ({
  t: (key: string) => ({ close: 'Close', done: 'Done', continue: 'Continue', therapist: 'Therapist' }[key] ?? key),
  lang: 'en', setOverlay: vi.fn(), toast: vi.fn(), profile,
  user: { linked: false, uid: null },
});
function mount(component: React.FunctionComponent) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(component)); });
  return host;
}
function unmount() {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
}
function press(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!button) throw new Error(`no button "${text}" in: ${container.textContent}`);
  act(() => { (button as HTMLButtonElement).click(); });
}
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.toISOString(); };
const ui = STRINGS.checkin.ui.en;

beforeEach(() => { localStorage.clear(); appMock.current = ctx(); });
afterEach(() => { unmount(); vi.restoreAllMocks(); localStorage.clear(); });

describe('R11-A softening card (check-in.jsx:95-99, 333)', () => {
  function seedUnburdening() {
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify([
      ...[35, 40, 45, 50].map((n) => ({ date: daysAgo(n), arousal: 2, confirmedPart: 'numb' })),
      ...[5, 10, 15, 20].map((n, i) => ({ date: daysAgo(n), arousal: 0, ...(i === 0 ? { confirmedPart: 'numb' } : {}) })),
    ]));
  }

  it('R11-A0 control: a fresh visit that reaches the done screen shows the card', () => {
    seedUnburdening();
    appMock.current = ctx(null);
    const container = mount(CheckIn);
    press(container, ui.arousal[2]);
    press(container, ui.skip);
    press(container, 'Log without a part');
    expect(container.textContent).toContain(ui.done);
    expect(container.textContent).toContain('is softening');
  });

  it('R11-A1: opening the check-in must not mark the card as shown', () => {
    seedUnburdening();
    mount(CheckIn);
    expect(localStorage.getItem('INNERVERSE_UNBURDENED_V1')).toBeNull();
  });

  it('R11-A2: a person who opens the check-in, leaves, and comes back still gets the card', () => {
    seedUnburdening();
    appMock.current = ctx(null);
    mount(CheckIn);
    unmount();
    const again = mount(CheckIn);
    press(again, ui.arousal[2]);
    press(again, ui.skip);
    press(again, 'Log without a part');
    expect(again.textContent).toContain(ui.done);
    expect(again.textContent).toContain('is softening');
  });
});

describe('R11-B lapse events (check-in.jsx:151-152)', () => {
  it('R11-B1: one lapse episode logs one lapse event, not one per later check-in', () => {
    const profile = canonical();
    appMock.current = ctx(profile);
    const numbName = profile.subtypesEn?.[SHADOW_PARTS.indexOf('numb')] ?? profile.clinical.subtypes.numb.name;
    mount(CheckIn);
    press(document.body.querySelector('.overlay') as HTMLElement, ui.arousal[3]); // Activated (+1)
    press(document.body.querySelector('.overlay') as HTMLElement, ui.skip);
    press(document.body.querySelector('.overlay') as HTMLElement, ui.correct);
    press(document.body.querySelector('.overlay') as HTMLElement, numbName);      // a firefighter part confirmed
    unmount();
    mount(CheckIn);
    press(document.body.querySelector('.overlay') as HTMLElement, ui.arousal[2]); // In my window (0)
    press(document.body.querySelector('.overlay') as HTMLElement, ui.skip);
    press(document.body.querySelector('.overlay') as HTMLElement, ui.no);        // a later, calmer check-in
    const events = JSON.parse(localStorage.getItem('INNERVERSE_EVENTS_V1') ?? '[]');
    expect(events.filter((e: { kind: string }) => e.kind === 'lapse')).toHaveLength(1);
  });
});

describe('R11-C ladder rung 4 shows «integrated» (practice.jsx:274-275, exercises.ts:250-251)', () => {
  it('R11-C0 control: rung 5 (verified under load) does show the integrated chip', () => {
    const exercise = EXERCISES.find((e) => EXERCISE_TYPES[e.type].gate === 'green' && EXERCISE_TYPES[e.type].chapter === 1)!;
    localStorage.setItem('INNERVERSE_PRACTICE_V1', JSON.stringify({ completed: [], ladder: { [exercise.id]: { verifiedUnderLoad: true } } }));
    const container = mount(Practice);
    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(exercise.title.en))!;
    act(() => { button.click(); });
    const chips = Array.from(container.querySelectorAll('p.chip')).map((c) => c.textContent?.trim());
    expect(chips).toContain(STRINGS.practice.en.integrated);
  });

  it('R11-C1: a live rep (rung 4) is not labelled integrated; only rung 5 is', () => {
    const exercise = EXERCISES.find((e) => EXERCISE_TYPES[e.type].gate === 'green' && EXERCISE_TYPES[e.type].chapter === 1)!;
    localStorage.setItem('INNERVERSE_PRACTICE_V1', JSON.stringify({ completed: [], ladder: { [exercise.id]: { liveRep: true } } }));
    const container = mount(Practice);
    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(exercise.title.en))!;
    act(() => { button.click(); });
    const chips = Array.from(container.querySelectorAll('p.chip')).map((c) => c.textContent?.trim());
    expect(chips).not.toContain(STRINGS.practice.en.integrated);
  });
});

describe('R11-D legacy 64 synastry percentages (synastry.ts:266-273)', () => {
  it('R11-D1: a dissonant pair never reports a gap above 100%', () => {
    const a = [1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, ...Array(52).fill(3)];
    const b = [5, 5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1, ...Array(52).fill(3)];
    const text = computeSynastry(a, b, 'ru').dimensionalResonance[0].descriptionRu;
    const percents = [...text.matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
    expect(Math.max(...percents)).toBeLessThanOrEqual(100);
  });
});

describe('R11-E scored-profile nourish pill (scored-profile-synastry-report.jsx:115)', () => {
  it('R11-E1: a resource at its maximum does not print a percentage above 100%', () => {
    const giver = makeProfile({ resources: { sage: 80, warrior: 50, caregiver: 50, explorer: 50 } });
    const receiver = makeProfile({ hungers: { meaning: 20 } });
    const report = synastryV2(giver, receiver);
    expect(report.nourishHighlights.every((h) => h.strength <= 1)).toBe(true);
  });

  it('R11-E2: the rendered nourish pill for that pair reads above 100%', () => {
    const giver = makeProfile({ resources: { sage: 80, warrior: 50, caregiver: 50, explorer: 50 } });
    const receiver = makeProfile({ hungers: { meaning: 20 } });
    const report = synastryV2(giver, receiver);
    const container = mount(() => React.createElement(ScoredProfileSynastryDetails, { report: report as any, lang: 'en' })) as HTMLElement;
    const pills = Array.from(container.querySelectorAll('.pill')).map((p) => p.textContent ?? '');
    expect(pills.length).toBeGreaterThan(0);
    expect(pills.every((text) => Number.parseInt(text, 10) <= 100)).toBe(true);
  });
});

describe('R11-F malformed stored check-in (state-v2.ts:67-82, check-in.jsx:128)', () => {
  it('R11-F1: one stored check-in with an unknown eventType does not crash event selection', () => {
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify(Array.from({ length: 14 }, (_, i) => ({
      date: daysAgo(i + 1), arousal: 0, eventType: i === 0 ? 'bogus' : 'relational', predictedPart: 'numb', confirmedPart: 'rebel',
    }))));
    const container = mount(CheckIn);
    press(container, ui.arousal[2]);
    press(container, ui.events[0]);
    expect(container.textContent).toContain(ui.yes);
  });
});

describe('R11-F2 backup accepts a check-in with an unknown eventType (backup.ts:95-98)', () => {
  it('R11-F2: a restored backup refuses or drops a check-in whose eventType the engine does not know', async () => {
    const rows = Array.from({ length: 14 }, (_, i) => ({ date: daysAgo(i + 1), arousal: 0, eventType: i === 0 ? 'bogus' : 'relational', predictedPart: 'numb', confirmedPart: 'rebel' }));
    const prepared = await prepareBackup(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { INNERVERSE_CHECKINS_V1: rows } }), 'en').catch((error) => error);
    const kept = (prepared as any)?.entries?.INNERVERSE_CHECKINS_V1;
    expect(kept?.some((row: { eventType?: string }) => row.eventType === 'bogus') ?? false).toBe(false);
  });
});

describe('R11-G cloud snapshot limit (cloud-storage.ts)', () => {
  it('R11-G1: a map over the 100-part limit is refused, not silently cut to 100', () => {
    const adapted = adaptClinicalProfile(scoreProfile(input() as any), 'en');
    const many = Array.from({ length: 120 }, (_, i) => ({ ...adapted.parts[i % adapted.parts.length], id: `custom-${i}` }));
    expect(() => snapshot(adapted.profile, many, '2026-10-25T00:00:00.000Z')).toThrow(RangeError);
  });
  it('R11-G2: a map at the limit is saved whole', () => {
    const adapted = adaptClinicalProfile(scoreProfile(input() as any), 'en');
    const hundred = Array.from({ length: 100 }, (_, i) => ({ ...adapted.parts[i % adapted.parts.length], id: `custom-${i}` }));
    expect(snapshot(adapted.profile, hundred, '2026-10-25T00:00:00.000Z').parts).toHaveLength(100);
  });
});

describe('R11-J malformed practice ladder (practice.jsx:19, 29, 236-237) control', () => {
  it('R11-J1 control: ladder entries that are numbers, null, strings or odd ifThen values render without crashing', () => {
    const exercises = EXERCISES.filter((e) => EXERCISE_TYPES[e.type].gate === 'green' && EXERCISE_TYPES[e.type].chapter === 1).slice(0, 4);
    const ladder = { [exercises[0].id]: 5, [exercises[1].id]: null, [exercises[2].id]: 'abc', [exercises[3].id]: { ifThen: 42, principleNamed: 'yes' } };
    localStorage.setItem('INNERVERSE_PRACTICE_V1', JSON.stringify({ completed: [], ladder }));
    for (const exercise of exercises) {
      const container = mount(Practice);
      const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(exercise.title.en))!;
      act(() => { button.click(); });
      expect(container.textContent).toContain(exercise.title.en);
      unmount();
    }
  });
});

describe('R11-I Russian grammar in the unconscious contract (synastry.ts:716)', () => {
  it('R11-I1: the anxious-avoidant contract is grammatical Russian («а ты будешь отстраняться»)', () => {
    const p1 = [...Array(36).fill(3), ...Array(8).fill(5), ...Array(20).fill(3), ...Array(12).fill(3)];
    const p2 = [...Array(44).fill(3), ...Array(8).fill(5), ...Array(12).fill(3)];
    const contract = computeSynastry(p1, p2, 'ru').dyadicAnalysis.unconsciousContractRu;
    expect(contract).toContain('а ты будешь отстраняться');
  });
});
