import { describe, expect, it } from 'vitest';
import { ASSESSMENT_ROUTES, type AssessmentRoute, type RouteId } from '../core/assessment-routes';
import type { Practice } from '../core/contextual-checkin';
import { DESCENT_DRAFT_SCHEMA, DESCENT_ITEM_IDS, type DescentDraft } from '../core/assessment-draft';
import {
  NEEDS, SUPPORT, reduceEntry, resumeSaved, routeForNeed, startEntry,
  type Choice, type EntryContext, type EntryState, type Need, type SavedTool,
} from './e02-entry';

const NOW = '2026-10-10T09:00:00.000Z';
const PRACTICES: Practice[] = [
  { id: 'paced-breath', title: 'Paced breath', status: 'reviewed', requires: [], steps: ['Breathe in', 'Breathe out', 'Repeat'] },
  { id: 'noticing-reframe', title: 'Noticing', status: 'reviewed', requires: [], steps: ['Name the moment', 'Notice one thing'] },
  { id: 'gated', title: 'Gated', status: 'reviewed', requires: ['paced-breath'], steps: ['Only after breath'] },
  { id: 'draft-only', title: 'Draft', status: 'draft', requires: [], steps: ['Not reviewed'] },
];

const base = (over: Partial<EntryContext> = {}): EntryContext => ({
  practices: PRACTICES, routes: ASSESSMENT_ROUTES, profile: null, quiet: false, online: true, savedTool: null, ...over,
});
const without = (id: RouteId): AssessmentRoute[] => ASSESSMENT_ROUTES.map((r) => (r.id === id ? { ...r, available: false } : r));
const choiceOf = (need: Need, ctx = base()): Choice => {
  const r = routeForNeed(need, ctx);
  if (!r.ok) throw new Error(`no route for ${need}: ${r.notice}`);
  return r.choice;
};
const stepsOf = (c: Choice): ReadonlyArray<string> => (c.destination.kind === 'practice' ? c.destination.steps : []);

describe('E02 need-based entry and first useful result', () => {
  it('routes each of the three needs to one first step: a calm practice, a labelled fallback, and the quick scan', () => {
    for (const need of NEEDS) {
      const r = reduceEntry(startEntry(null), { type: 'choose-need', need }, base());
      expect(r.ok).toBe(true);
      expect(r.state.step.kind).toBe('route');
    }
    expect(choiceOf('calm-now').destination).toMatchObject({ kind: 'practice', practiceId: 'paced-breath' });
    expect(choiceOf('pattern').destination).toMatchObject({ kind: 'assessment', routeId: 'quick-scan-teaser', canonical: false });
    expect(choiceOf('calm-now').labels).toEqual({ need: 'user-authored', route: 'hypothesis', result: 'observation' });
  });

  it('routes the situation need to the situation inquiry while that route is available', () => {
    expect(choiceOf('situation').destination).toMatchObject({ kind: 'assessment', routeId: 'situation-inquiry', canonical: false, produces: 'none' });
  });

  it('recovers an unavailable view: the situation need falls back to a labelled calm start, or to the chooser with a notice', () => {
    const noInquiry = without('situation-inquiry');
    const fallback = choiceOf('situation', base({ routes: noInquiry }));
    expect(fallback.destination).toMatchObject({ kind: 'practice', practiceId: 'paced-breath' });
    expect(fallback.fallback).toBe('route-unavailable');
    expect(fallback.labels.route).toBe('hypothesis');
    const noRoute = reduceEntry(startEntry(null), { type: 'choose-need', need: 'situation' }, base({ practices: [], routes: noInquiry }));
    expect(noRoute.ok).toBe(true);
    expect(noRoute.state.step.kind).toBe('needs');
    expect(noRoute.state.notice).toBe('route-unavailable');
    const noCalm = reduceEntry(startEntry(null), { type: 'choose-need', need: 'calm-now' }, base({ practices: [] }));
    expect(noCalm.state.notice).toBe('no-reviewed-practice');
  });

  it('keeps the 64 and 147 routes as deeper options only, never as a default for any need', () => {
    expect(choiceOf('pattern').deeper).toEqual(['reflection-64', 'battery-147']);
    for (const need of NEEDS) {
      const d = choiceOf(need).destination;
      if (d.kind === 'assessment') expect(d.canonical).toBe(false);
    }
  });

  it('never assumes a profile: a teaser may replace nothing when a canonical map exists, and a missing map is not invented', () => {
    expect(choiceOf('pattern').saveRule).toBe('replace-current');
    const canonical = { testModel: 'angular-v2', clinical: {} };
    expect(choiceOf('pattern', base({ profile: canonical })).saveRule).toBe('archive-only');
    const battery = reduceEntry(startEntry(null), { type: 'open-deep-link', query: 'route=battery-147' }, base({ profile: canonical }));
    expect(battery.state.step).toMatchObject({ kind: 'route', choice: { saveRule: null, labels: { result: 'canonical-measurement' } } });
  });

  it('finishing the first step reaches a useful stop that names what is still unknown, and Back returns to the step', () => {
    const route = reduceEntry(startEntry(null), { type: 'choose-need', need: 'calm-now' }, base()).state;
    const done = reduceEntry(route, { type: 'finish-step' }, base());
    expect(done.ok).toBe(true);
    expect(done.state.step.kind).toBe('stop');
    if (done.state.step.kind === 'stop') {
      expect(done.state.step.reason).toBe('useful-now');
      expect(done.state.step.choice.stillUnknown).toContain('whether-it-helps-outside-the-app');
    }
    expect(reduceEntry(done.state, { type: 'back' }, base()).state.step.kind).toBe('route');
  });

  it('skipping the assessment keeps the chosen step, and assessment-free support is on in every state of a walk', () => {
    const start = startEntry(null);
    const route = reduceEntry(start, { type: 'choose-need', need: 'pattern' }, base()).state;
    const skipped = reduceEntry(route, { type: 'skip-assessment' }, base()).state;
    expect(skipped.step.kind).toBe('stop');
    if (skipped.step.kind === 'stop' && route.step.kind === 'route') {
      expect(skipped.step.reason).toBe('assessment-skipped');
      expect(skipped.step.choice).toEqual(route.step.choice);
    }
    expect(reduceEntry(start, { type: 'skip-assessment' }, base())).toMatchObject({ ok: false, reason: 'wrong-step' });
    const walk: EntryState[] = [start, route, skipped, reduceEntry(skipped, { type: 'back' }, base()).state];
    for (const state of walk) {
      expect(state.support).toEqual(SUPPORT);
      expect(state.support.requiresAssessment).toBe(false);
    }
  });

  it('resumes a saved practice at the same step after an interruption, and refuses resume when nothing is saved', () => {
    const checkIn = { practiceId: 'paced-breath', mode: 'full' as const, stepIndex: 2, interrupted: true };
    const saved: SavedTool = { kind: 'practice', checkIn };
    const r = reduceEntry(startEntry(null), { type: 'resume-saved' }, base({ savedTool: saved }));
    expect(r.state.step).toMatchObject({ kind: 'route', choice: { stepIndex: 2, destination: { kind: 'practice', practiceId: 'paced-breath' } } });
    // A quiet saved check-in keeps its place in the one-step view, clamped to the single step it shows.
    const quiet = resumeSaved({ kind: 'practice', checkIn: { ...checkIn, mode: 'quiet' as const } }, base());
    expect(quiet.ok).toBe(true);
    if (quiet.ok) {
      expect(quiet.choice.stepIndex).toBe(0);
      expect(stepsOf(quiet.choice)).toHaveLength(1);
    }
    expect(reduceEntry(startEntry(null), { type: 'resume-saved' }, base())).toMatchObject({ ok: false, reason: 'nothing-saved' });
  });

  it('resumes a saved 147 draft at its cursor, and refuses an unreadable draft without overwriting it', () => {
    const draft: DescentDraft = {
      schema: DESCENT_DRAFT_SCHEMA,
      answers: { [DESCENT_ITEM_IDS[0]]: 3, [DESCENT_ITEM_IDS[1]]: 4 },
      cursor: { itemId: DESCENT_ITEM_IDS[5], stage: 'item' },
      savedAt: NOW,
    };
    const resumed = reduceEntry(startEntry(null), { type: 'resume-saved' }, base({ savedTool: { kind: 'battery-147', draft } }));
    expect(resumed.state.step).toMatchObject({
      kind: 'route',
      choice: { stepIndex: 5, destination: { kind: 'assessment', routeId: 'battery-147', canonical: true }, labels: { result: 'canonical-measurement' } },
    });
    const bad = { schema: 'descent-draft.v1', answers: [1, 2] };
    const start = startEntry(null);
    const refused = reduceEntry(start, { type: 'resume-saved' }, base({ savedTool: { kind: 'battery-147', draft: bad } }));
    expect(refused).toMatchObject({ ok: false, reason: 'draft-unreadable' });
    expect(refused.state).toBe(start);
    expect(bad).toEqual({ schema: 'descent-draft.v1', answers: [1, 2] });
    const unavailable = reduceEntry(start, { type: 'resume-saved' }, base({ routes: without('battery-147'), savedTool: { kind: 'battery-147', draft } }));
    expect(unavailable).toMatchObject({ ok: false, reason: 'saved-unavailable' });
  });

  it('recovers a failed deep link to the chooser with a notice, and Back returns to where the person was', () => {
    const route = reduceEntry(startEntry(null), { type: 'choose-need', need: 'calm-now' }, base()).state;
    const broken = reduceEntry(route, { type: 'open-deep-link', query: 'route=not-a-route' }, base());
    expect(broken.ok).toBe(true);
    expect(broken.state.step.kind).toBe('needs');
    expect(broken.state.notice).toBe('deep-link-unknown');
    expect(reduceEntry(startEntry(null), { type: 'open-deep-link', query: 'route=situation-inquiry' }, base({ routes: without('situation-inquiry') })).state.notice).toBe('deep-link-unavailable');
    expect(reduceEntry(startEntry(null), { type: 'open-deep-link', query: 'route=situation-inquiry' }, base()).state.step)
      .toMatchObject({ kind: 'route', choice: { destination: { routeId: 'situation-inquiry' } } });
    expect(reduceEntry(startEntry(null), { type: 'open-deep-link', query: '' }, base()).state.notice).toBe('deep-link-missing');
    const back = reduceEntry(broken.state, { type: 'back' }, base());
    expect(back.state.step.kind).toBe('route');
    expect(back.state.notice).toBeNull();
  });

  it('a valid deep link opens its route directly, and a practice with unmet prerequisites or no review is refused', () => {
    const teaser = reduceEntry(startEntry(null), { type: 'open-deep-link', query: 'route=quick-scan-teaser' }, base());
    expect(teaser.state.step).toMatchObject({
      kind: 'route',
      choice: { need: null, labels: { need: null, route: 'user-authored', result: 'observation' }, destination: { routeId: 'quick-scan-teaser' } },
    });
    const practice = reduceEntry(startEntry(null), { type: 'open-deep-link', query: 'practice=paced-breath' }, base());
    expect(practice.state.step).toMatchObject({ kind: 'route', choice: { labels: { route: 'user-authored' }, destination: { practiceId: 'paced-breath' } } });
    for (const query of ['practice=gated', 'practice=draft-only']) {
      expect(reduceEntry(startEntry(null), { type: 'open-deep-link', query }, base()).state.notice).toBe('deep-link-unavailable');
    }
  });

  it('Back walks back one step at a time and refuses at the root without changing the entry', () => {
    const start = startEntry(null);
    const atRoot = reduceEntry(start, { type: 'back' }, base());
    expect(atRoot).toMatchObject({ ok: false, reason: 'at-root' });
    expect(atRoot.state).toBe(start);
    const route = reduceEntry(start, { type: 'choose-need', need: 'pattern' }, base()).state;
    const back = reduceEntry(route, { type: 'back' }, base());
    expect(back.state.step.kind).toBe('needs');
    expect(back.state.revision).toBe(route.revision + 1);
    expect(reduceEntry(back.state, { type: 'back' }, base())).toMatchObject({ ok: false, reason: 'at-root' });
  });

  it('quiet mode shows one next action; full mode shows every step of the first practice', () => {
    expect(stepsOf(choiceOf('calm-now', base({ quiet: true })))).toEqual(['Breathe in']);
    expect(stepsOf(choiceOf('calm-now', base()))).toHaveLength(3);
  });

  it('offline entry still offers every need from bundled practices, labelled as offline', () => {
    for (const need of NEEDS) {
      const off = choiceOf(need, base({ online: false }));
      const on = choiceOf(need, base());
      expect(off.offline).toBe(true);
      expect(on.offline).toBe(false);
      expect(off.destination).toEqual(on.destination);
    }
  });

  it('abandoned onboarding never gates entry and is only flagged as optional', () => {
    const abandoned = startEntry({ completed: false });
    expect(abandoned.onboardingPending).toBe(true);
    expect(abandoned.step.kind).toBe('needs');
    expect(reduceEntry(abandoned, { type: 'choose-need', need: 'calm-now' }, base()).ok).toBe(true);
    expect(startEntry(null).onboardingPending).toBe(false);
    expect(startEntry({ completed: true }).onboardingPending).toBe(false);
  });

  it('refuses an unknown need, a stale revision and a choice made from the wrong step, without changing the entry', () => {
    const start = startEntry(null);
    const bogus = reduceEntry(start, { type: 'choose-need', need: 'bogus' as Need }, base());
    expect(bogus).toMatchObject({ ok: false, reason: 'invalid-need' });
    expect(bogus.state).toBe(start);
    const stale = reduceEntry(start, { type: 'choose-need', need: 'calm-now', expectedRevision: 7 }, base());
    expect(stale).toMatchObject({ ok: false, reason: 'stale' });
    expect(stale.state).toBe(start);
    const route = reduceEntry(start, { type: 'choose-need', need: 'calm-now' }, base()).state;
    expect(reduceEntry(route, { type: 'choose-need', need: 'pattern' }, base())).toMatchObject({ ok: false, reason: 'wrong-step' });
  });
});
