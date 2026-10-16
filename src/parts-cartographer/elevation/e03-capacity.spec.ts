import { describe, expect, it } from 'vitest';
import { DESCENT_BREAK_INDEXES, DESCENT_ITEM_COUNT } from '../core/assessment-draft';
import { ASSESSMENT_ROUTES } from '../core/assessment-routes';
import { DEFAULT_SENSORY_PREFERENCES, sceneClockStep } from '../core/sensory-preferences';
import { formulation, MAX_QUESTIONS } from '../core/situation-inquiry';
import {
  CAPACITY_LEVELS,
  changePreference,
  type CapacityLevel,
  type CapacitySession,
  nextInquiryQuestion,
  normalizeCapacity,
  pendingSave,
  presentationPlan,
  recordInquiryAnswer,
  recordSaveResult,
  remainingQuestions,
  restoreCapacitySession,
  revertCapacity,
  type RouteMode,
  startCapacitySession,
  startPreferences,
  switchCapacity,
  switchLanguage,
  visibleTo,
} from './e03-capacity';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const OBSERVATION = 'A tense call with a colleague that I keep replaying';

function session(capacity: CapacityLevel = 'medium', accountId: string | null = 'acct-a'): CapacitySession {
  const started = startCapacitySession(OBSERVATION, { capacity, accountId });
  if (!started) throw new Error('setup failed');
  return started;
}

/** Records answers in order; every answer must be accepted at the current capacity. */
function answered(start: CapacitySession, pairs: Array<[string, string]>): CapacitySession {
  return pairs.reduce((current, [id, text]) => {
    const result = recordInquiryAnswer(current, id, text);
    if (!result.ok) throw new Error(`refused: ${result.reason}`);
    return result.session;
  }, start);
}

describe('E03.04 capacity-sensitive presentation', () => {
  it('maps capacity to inquiry steps and never exceeds the inquiry bound', () => {
    expect(CAPACITY_LEVELS.map((c) => presentationPlan('situation-inquiry', c).stepCount)).toEqual([1, 2, MAX_QUESTIONS]);
    expect(presentationPlan('situation-inquiry', 'high')).toMatchObject({ itemCount: null, canonical: false, pauses: [], chunks: [] });
  });

  it('keeps the canonical 64 and 147 item count and order at every capacity', () => {
    const routes: RouteMode[] = ['reflection-64', 'battery-147'];
    for (const route of routes) {
      const expected = route === 'reflection-64' ? 64 : DESCENT_ITEM_COUNT;
      expect(ASSESSMENT_ROUTES.find((r) => r.id === route)?.itemCount).toBe(expected);
      for (const capacity of CAPACITY_LEVELS) {
        const plan = presentationPlan(route, capacity);
        expect(plan.itemCount).toBe(expected);
        expect(plan.chunks.flat()).toEqual(range(expected));
      }
    }
  });

  it('keeps the 147 sitting boundaries at every capacity, and no step crosses a sitting', () => {
    const sittingOf = (index: number) => DESCENT_BREAK_INDEXES.filter((breakAt) => breakAt < index).length;
    for (const capacity of CAPACITY_LEVELS) {
      const plan = presentationPlan('battery-147', capacity);
      expect(plan.pauses).toEqual(expect.arrayContaining([...DESCENT_BREAK_INDEXES]));
      for (const chunk of plan.chunks) {
        expect(new Set(chunk.map(sittingOf)).size).toBe(1);
      }
    }
    expect(presentationPlan('reflection-64', 'high').pauses).toEqual([31]);
  });

  it('compares the three modes: canonical identity is fixed and only presentation changes', () => {
    const routes: RouteMode[] = ['situation-inquiry', 'reflection-64', 'battery-147'];
    for (const route of routes) {
      const plans = CAPACITY_LEVELS.map((c) => presentationPlan(route, c));
      expect(new Set(plans.map((p) => p.canonical)).size).toBe(1);
      expect(new Set(plans.map((p) => p.itemCount)).size).toBe(1);
      for (const plan of plans) {
        expect(plan.provenance).toEqual({
          capacity: 'user-choice',
          steps: 'presentation-only',
          measurement: route === 'situation-inquiry' ? 'none' : 'canonical',
          scores: 'unchanged',
        });
        expect(plan.supportAvailable).toBe(true);
      }
    }
  });

  it('gives the same inquiry outcome in every capacity mode for the same answers', () => {
    const outcomes = CAPACITY_LEVELS.map((capacity) => answered(session(capacity), [['q1', 'The deadline moved']]));
    expect(outcomes.map((s) => formulation(s.inquiry))).toEqual([OBSERVATION, OBSERVATION, OBSERVATION]);
    expect(outcomes.map((s) => s.inquiry.answers)).toEqual([outcomes[0].inquiry.answers, outcomes[0].inquiry.answers, outcomes[0].inquiry.answers]);
    expect(CAPACITY_LEVELS.map((c) => remainingQuestions(answered(session(c), [['q1', 'x']])))).toEqual([0, 1, 2]);
  });

  it('switches capacity mid-inquiry without losing any input', () => {
    let current = answered(session('medium'), [['q1', 'The deadline moved again']]);
    current = switchCapacity(current, 'high');
    current = answered(current, [['q2', 'I did not get to reply']]);
    current = switchCapacity(current, 'low');
    expect(current.inquiry.answers.map((a) => a.text)).toEqual(['The deadline moved again', 'I did not get to reply']);
    expect(current.inquiry.observation).toBe(OBSERVATION);
    expect(nextInquiryQuestion(current, ['q1', 'q2', 'q3'])).toBeNull();
  });

  it('reverts a capacity change exactly, so the presentation is reversible', () => {
    const before = answered(session('medium'), [['q1', 'The deadline moved']]);
    const changed = switchCapacity(switchCapacity(before, 'high'), 'low');
    expect(revertCapacity(revertCapacity(changed))).toEqual(before);
    expect(revertCapacity(before)).toBe(before);
  });

  it('keeps useful output when a lower step count is chosen after more answers', () => {
    const full = answered(session('high'), [['q1', 'a'], ['q2', 'b']]);
    const lowered = switchCapacity(full, 'low');
    expect(remainingQuestions(lowered)).toBe(0);
    expect(recordInquiryAnswer(lowered, 'q3', 'c')).toEqual({ ok: false, reason: 'step-limit' });
    expect(lowered.inquiry).toEqual(full.inquiry);
    expect(formulation(lowered.inquiry)).toBe(formulation(full.inquiry));
  });

  it('changes sound, motion and density independently of one another', () => {
    const withSound = changePreference(startPreferences(), 'sound', true);
    expect(withSound.value).toEqual({ ...DEFAULT_SENSORY_PREFERENCES, sound: true, preset: 'custom' });
    const compact = changePreference(withSound, 'density', 'compact');
    expect(compact.value).toEqual({ ...withSound.value, density: 'compact' });
    const still = changePreference(compact, 'motion', 'still');
    expect(still.value).toEqual({ ...compact.value, motion: 'still' });
    expect(still.value.sound).toBe(true);
  });

  it('stops the scene clock under system reduced motion, whatever motion is chosen', () => {
    const lively = changePreference(startPreferences(), 'motion', 'lively');
    expect(sceneClockStep(lively.value.motion, false)).toBeGreaterThan(0);
    expect(sceneClockStep(lively.value.motion, true)).toBe(0);
  });
});

describe('E03.07 recovery of mode changes, unsaved preferences and switches', () => {
  it('recovers a preference write failure: the change holds for the session and the save is still owed', () => {
    let prefs = changePreference(startPreferences(), 'motion', 'lively');
    const pending = pendingSave(prefs);
    expect(pending).toEqual({ version: 1, value: prefs.value });
    prefs = recordSaveResult(prefs, pending!.version, false);
    expect(prefs.saved).toBe(false);
    expect(prefs.value.motion).toBe('lively');
    expect(pendingSave(prefs)).not.toBeNull();
    prefs = recordSaveResult(prefs, 1, true);
    expect(pendingSave(prefs)).toBeNull();
  });

  it('ignores a late save acknowledgement for an older preference version', () => {
    let prefs = changePreference(startPreferences(), 'sound', true);
    const oldVersion = pendingSave(prefs)!.version;
    prefs = changePreference(prefs, 'texture', false);
    const late = recordSaveResult(prefs, oldVersion, true);
    expect(late.saved).toBe(false);
    expect(pendingSave(late)?.version).toBe(2);
    expect(recordSaveResult(late, 2, true).saved).toBe(true);
  });

  it('holds another account session instead of showing or exposing it', () => {
    const mine = session('medium', 'acct-a');
    expect(visibleTo(mine, 'acct-a')).toEqual({ status: 'shown', session: mine });
    expect(visibleTo(mine, 'acct-b')).toEqual({ status: 'held', reason: 'other-account' });
    expect(visibleTo(mine, null)).toEqual({ status: 'held', reason: 'other-account' });
    const local = startCapacitySession('A quiet moment on this device', {});
    expect(visibleTo(local!, 'acct-b').status).toBe('shown');
  });

  it('restores an interrupted session after a mode change, and falls back safely on bad stored values', () => {
    const interrupted = switchCapacity(answered(session('high'), [['q1', 'The deadline moved']]), 'low');
    const stored = JSON.parse(JSON.stringify(interrupted));
    expect(restoreCapacitySession(stored)).toEqual(interrupted);
    expect(restoreCapacitySession({ ...stored, capacity: 'extreme' })?.capacity).toBe('medium');
    expect(restoreCapacitySession({ ...stored, inquiry: { observation: 'only text' } })).toBeNull();
    expect(normalizeCapacity('low')).toBe('low');
  });

  it('keeps the inquiry verbatim across a language switch', () => {
    const current = answered(session('medium'), [['q1', 'The day was hard']]);
    const switched = switchLanguage(current, 'ru');
    expect(switched.lang).toBe('ru');
    expect(switched.inquiry).toEqual(current.inquiry);
    expect(switched.inquiry.answers[0].text).toBe('The day was hard');
  });
});
