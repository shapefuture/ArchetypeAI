import { describe, expect, it } from 'vitest';
import type { Practice } from '../core/contextual-checkin';
import {
  exportGoal, goalStatement, outcomeSummary, outcomeViews, readGoalRecord, reduceGoal, reminderPolicy, type GoalState,
} from './e01-goal';

const NOW = '2026-10-10T09:00:00.000Z';
const LATER = '2026-10-12T18:00:00.000Z';
const LATEST = '2026-10-20T08:00:00.000Z';
const GOAL = 'Ask for a pause before agreeing to something new';
const HYPOTHESIS = 'A pause may make agreeing feel less rushed';

const BREATH: Practice = { id: 'paced-breath', title: 'Paced breath', status: 'reviewed', requires: [], steps: ['Breathe in', 'Breathe out'] };
const NOTICING: Practice = { id: 'noticing-reframe', title: 'Noticing', status: 'reviewed', requires: [], steps: ['Name the moment'] };
const DRAFT: Practice = { id: 'draft-x', title: 'Draft', status: 'draft', requires: [], steps: ['Not reviewed yet'] };

/** Chooses the goal, then links two reviewed tools. Revision is 3 afterwards. */
function withTools(): GoalState {
  const chosen = reduceGoal(null, { type: 'choose', actor: 'user', id: 'goal-1', statement: GOAL }, NOW).state!;
  const one = reduceGoal(chosen, { type: 'link-tool', actor: 'user', tool: BREATH }, NOW).state!;
  return reduceGoal(one, { type: 'link-tool', actor: 'user', tool: NOTICING }, NOW).state!;
}

/** Every key name in a value, recursively. Used to check that no readiness-style field exists. */
function keysOf(value: unknown, acc: string[] = []): string[] {
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      acc.push(key);
      keysOf(child, acc);
    }
  }
  return acc;
}

describe('E01 personal goal transitions', () => {
  it('chooses a concrete goal and keeps the wording the person typed', () => {
    const r = reduceGoal(null, { type: 'choose', actor: 'user', id: 'goal-1', statement: `  ${GOAL}  ` }, NOW);
    expect(r.ok).toBe(true);
    expect(goalStatement(r.state!)).toBe(GOAL);
    expect(r.state!.status).toBe('active');
    expect(r.state!.tools).toEqual([]);
    expect(reduceGoal(r.state, { type: 'choose', actor: 'user', id: 'goal-2', statement: 'Another' }, NOW))
      .toMatchObject({ ok: false, reason: 'goal-exists' });
  });

  it('revises the goal without losing linked tools or endpoints, and keeps the earlier wording', () => {
    let s = withTools();
    s = reduceGoal(s, { type: 'add-endpoint', actor: 'user', text: 'I can say "let me think" without apologising' }, NOW).state!;
    const r = reduceGoal(s, { type: 'revise', actor: 'user', statement: 'Ask for a pause before agreeing, even in a group' }, LATER);
    expect(r.ok).toBe(true);
    expect(r.state!.tools).toEqual(s.tools);
    expect(r.state!.season.endpoints).toEqual(s.season.endpoints);
    expect(r.state!.statementHistory).toEqual([GOAL]);
    expect(r.state!.revision).toBe(s.revision + 1);
    expect(reduceGoal(r.state, { type: 'revise', actor: 'user', statement: '   ' }, LATER)).toMatchObject({ ok: false, reason: 'empty' });
  });

  it('recovers a resumed journey after rest: pausing and resuming leave tools and outcomes as they were', () => {
    const s = reduceGoal(withTools(), { type: 'record-outcome', actor: 'user', toolId: 'paced-breath', outcome: 'tried', note: 'Asked once' }, LATER).state!;
    const paused = reduceGoal(s, { type: 'pause', actor: 'user' }, LATER).state!;
    expect(paused.status).toBe('paused');
    expect(paused.pausedAt).toBe(LATER);
    // Only status, pause time, revision and update time may change while resting.
    expect({ ...paused, status: s.status, pausedAt: s.pausedAt, revision: s.revision, updatedAt: s.updatedAt }).toEqual(s);
    expect(reminderPolicy(paused)).toBe('none');
    const resumed = reduceGoal(paused, { type: 'resume', actor: 'user' }, LATEST).state!;
    expect(resumed.status).toBe('active');
    expect(resumed.pausedAt).toBeNull();
    expect(resumed.tools).toEqual(s.tools);
    expect(resumed.outcomes).toEqual(s.outcomes);
    expect(reminderPolicy(resumed)).toBe('gentle');
    expect(reduceGoal(resumed, { type: 'pause', actor: 'user' }, LATEST).state).not.toBe(resumed);
  });

  it('graduates only on an explicit yes and keeps the tool shelf', () => {
    const s = withTools();
    const refused = reduceGoal(s, { type: 'graduate', actor: 'user', chosen: false }, LATER);
    expect(refused).toMatchObject({ ok: false, reason: 'not-chosen' });
    expect(refused.state).toBe(s);
    const graduated = reduceGoal(s, { type: 'graduate', actor: 'user', chosen: true }, LATER).state!;
    expect(graduated.status).toBe('graduated');
    expect(graduated.graduatedAt).toBe(LATER);
    expect(graduated.tools).toEqual(s.tools);
    expect(reduceGoal(graduated, { type: 'revise', actor: 'user', statement: 'Different' }, LATER)).toMatchObject({ ok: false, reason: 'graduated' });
    expect(reminderPolicy(graduated)).toBe('none');
  });

  it('exports a graduated goal and keeps a missing real-world outcome unknown', () => {
    const graduated = reduceGoal(withTools(), { type: 'graduate', actor: 'user', chosen: true }, LATER).state!;
    const out = exportGoal(graduated, true, LATER);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.artifact.status).toBe('graduated');
    expect(out.artifact.statement).toBe(GOAL);
    expect(out.artifact.tools.map((t) => t.id)).toEqual(['paced-breath', 'noticing-reframe']);
    expect(out.artifact.outcomes.every((o) => o.status === 'unknown')).toBe(true);
    expect(out.artifact.summary.recordedCount).toBe(0);
    expect(exportGoal(graduated, false, LATER)).toEqual({ ok: false, reason: 'not-requested' });
  });

  it('labels observation, hypothesis, user authorship and canonical measurement separately in the export', () => {
    let s = withTools();
    s = reduceGoal(s, { type: 'propose-hypothesis', actor: 'app', text: HYPOTHESIS }, LATER).state!;
    s = reduceGoal(s, { type: 'record-outcome', actor: 'user', toolId: 'paced-breath', outcome: 'tried', note: 'Asked on Tuesday' }, LATER).state!;
    const out = exportGoal(s, true, LATER);
    if (!out.ok) throw new Error('export should succeed');
    expect(out.artifact.labels).toEqual({
      statement: 'user-authored', endpoints: 'user-authored', tools: 'user-authored',
      hypotheses: 'hypothesis', outcomes: 'observation', measurement: 'canonical-measurement',
    });
    expect(out.artifact.hypotheses).toEqual([HYPOTHESIS]);
    expect(out.artifact.endpoints).toEqual([]);
    expect(out.artifact.measurementIncluded).toBe(false);
    expect(out.artifact.outcomes[1]).toMatchObject({ toolId: 'paced-breath', status: 'reported', outcome: 'tried' });
  });

  it('keeps app hypotheses labelled until the person adopts them, and refuses overclaims and rejected repeats', () => {
    const s = withTools();
    expect(reduceGoal(s, { type: 'propose-hypothesis', actor: 'app', text: 'This will always fix my pattern' }, LATER))
      .toMatchObject({ ok: false, reason: 'overclaim' });
    const proposed = reduceGoal(s, { type: 'propose-hypothesis', actor: 'app', text: HYPOTHESIS }, LATER).state!;
    expect(proposed.season.endpoints).toEqual([]);
    const adopted = reduceGoal(proposed, { type: 'adopt-hypothesis', actor: 'user', text: HYPOTHESIS }, LATER).state!;
    expect(adopted.hypotheses).toEqual([]);
    expect(adopted.season.endpoints).toEqual([HYPOTHESIS]);
    const rejected = reduceGoal(proposed, { type: 'reject-hypothesis', actor: 'user', text: HYPOTHESIS }, LATER).state!;
    expect(reduceGoal(rejected, { type: 'propose-hypothesis', actor: 'app', text: HYPOTHESIS }, LATER))
      .toMatchObject({ ok: false, reason: 'rejected-again' });
    const full = reduceGoal(reduceGoal(s, { type: 'propose-hypothesis', actor: 'app', text: 'One reading' }, LATER).state!,
      { type: 'propose-hypothesis', actor: 'app', text: 'Another reading' }, LATER).state!;
    expect(reduceGoal(full, { type: 'propose-hypothesis', actor: 'app', text: 'A third reading' }, LATER)).toMatchObject({ ok: false, reason: 'limit' });
  });

  it('has no universal readiness score, streak or rank in any state or export', () => {
    const s = reduceGoal(withTools(), { type: 'record-outcome', actor: 'user', toolId: null, outcome: 'adapted' }, LATER).state!;
    const out = exportGoal(s, true, LATER);
    if (!out.ok) throw new Error('export should succeed');
    const names = [...keysOf(s), ...keysOf(out.artifact)];
    // Whole key names only: "endpoints" must not match "points". scoreDelta is checked separately below.
    expect(names.filter((n) => /^(readiness\w*|streak\w*|rank\w*|points|level|percent\w*|mastery\w*|progress\w*|score)$/i.test(n))).toEqual([]);
    expect(Object.keys(out.artifact.summary).sort()).toEqual(['causalClaim', 'counts', 'recordedCount', 'scoreDelta']);
    expect(out.artifact.summary).toMatchObject({ scoreDelta: 0, causalClaim: false });
  });

  it('refuses any canonical measurement attached to a goal and leaves the goal untouched', () => {
    const s = withTools();
    const r = reduceGoal(s, { type: 'attach-measurement', actor: 'app', instrument: '147' }, LATER);
    expect(r).toMatchObject({ ok: false, reason: 'canonical-measurement-not-allowed' });
    expect(r.state).toBe(s);
    expect(reduceGoal(null, { type: 'attach-measurement', actor: 'user', instrument: '64' }, LATER).state).toBeNull();
  });

  it('refuses empty input, drafts, unknown tools and export before a goal exists', () => {
    expect(reduceGoal(null, { type: 'choose', actor: 'user', id: 'g', statement: '  ' }, NOW)).toMatchObject({ ok: false, reason: 'empty', state: null });
    expect(reduceGoal(null, { type: 'revise', actor: 'user', statement: 'x' }, NOW).reason).toBe('no-goal');
    expect(exportGoal(null, true, NOW)).toEqual({ ok: false, reason: 'no-goal' });
    const s = reduceGoal(null, { type: 'choose', actor: 'user', id: 'goal-1', statement: GOAL }, NOW).state!;
    expect(reduceGoal(s, { type: 'link-tool', actor: 'user', tool: DRAFT }, NOW)).toMatchObject({ ok: false, reason: 'not-reviewed' });
    const linked = reduceGoal(s, { type: 'link-tool', actor: 'user', tool: BREATH }, NOW).state!;
    expect(reduceGoal(linked, { type: 'link-tool', actor: 'user', tool: BREATH }, NOW).state).toBe(linked);
    expect(reduceGoal(linked, { type: 'unlink-tool', actor: 'user', toolId: 'missing' }, NOW).reason).toBe('not-found');
  });

  it('recovers a changed goal: a stale edit from an older view is refused and the newer goal is kept', () => {
    const base = withTools();
    const newer = reduceGoal(base, { type: 'revise', actor: 'user', statement: 'Newer wording from this device' }, LATER).state!;
    const staleEdit = reduceGoal(newer, { type: 'revise', actor: 'user', statement: 'Older wording', expectedRevision: base.revision }, LATER);
    expect(staleEdit).toMatchObject({ ok: false, reason: 'stale' });
    expect(staleEdit.state).toBe(newer);
    const current = reduceGoal(newer, { type: 'revise', actor: 'user', statement: 'Current wording', expectedRevision: newer.revision }, LATER);
    expect(current.ok).toBe(true);
  });

  it('recovers partial outcomes: unrecorded tools read as unknown, and recorded ones show their latest report', () => {
    const s = reduceGoal(withTools(), { type: 'record-outcome', actor: 'user', toolId: 'paced-breath', outcome: 'tried', note: 'Asked for a pause' }, LATER).state!;
    expect(outcomeViews(s)).toEqual([
      { toolId: null, status: 'unknown' },
      { toolId: 'paced-breath', status: 'reported', outcome: 'tried', note: 'Asked for a pause' },
      { toolId: 'noticing-reframe', status: 'unknown' },
    ]);
    expect(outcomeSummary(s).recordedCount).toBe(1);
  });

  it('recovers a corrected or later report: the earlier entry is kept, and a report after graduation is accepted', () => {
    let s = reduceGoal(withTools(), { type: 'record-outcome', actor: 'user', toolId: 'paced-breath', outcome: 'did-not-try' }, LATER).state!;
    s = reduceGoal(s, { type: 'record-outcome', actor: 'user', toolId: 'paced-breath', outcome: 'tried', note: 'Tried it after all' }, LATER).state!;
    expect(outcomeViews(s)[1]).toMatchObject({ status: 'reported', outcome: 'tried' });
    expect(s.outcomes).toHaveLength(2);
    const graduated = reduceGoal(s, { type: 'graduate', actor: 'user', chosen: true }, LATER).state!;
    const later = reduceGoal(graduated, { type: 'record-outcome', actor: 'user', toolId: null, outcome: 'adapted', note: 'Noticed it a week later' }, LATEST).state!;
    expect(later.status).toBe('graduated');
    expect(outcomeViews(later)[0]).toMatchObject({ status: 'reported', outcome: 'adapted' });
    const declined = reduceGoal(graduated, { type: 'record-outcome', actor: 'user', toolId: null, outcome: 'do-not-record' }, LATEST).state!;
    expect(outcomeViews(declined)[0]).toMatchObject({ status: 'not-recorded-by-choice' });
  });

  it('recovers authority: an app actor may only propose a hypothesis; choose, revise, pause, graduate and record are refused', () => {
    const s = withTools();
    expect(reduceGoal(null, { type: 'choose', actor: 'app', id: 'g', statement: GOAL }, NOW).reason).toBe('wrong-actor');
    expect(reduceGoal(s, { type: 'revise', actor: 'app', statement: 'Mine now' }, LATER).reason).toBe('wrong-actor');
    expect(reduceGoal(s, { type: 'pause', actor: 'app' }, LATER).reason).toBe('wrong-actor');
    expect(reduceGoal(s, { type: 'graduate', actor: 'app', chosen: true }, LATER).reason).toBe('wrong-actor');
    expect(reduceGoal(s, { type: 'record-outcome', actor: 'app', toolId: null, outcome: 'tried' }, LATER).reason).toBe('wrong-actor');
    expect(reduceGoal(s, { type: 'propose-hypothesis', actor: 'app', text: 'A pause may help' }, LATER).ok).toBe(true);
  });

  it('recovers storage: a stored goal that cannot be read is rejected, never replaced by an empty goal', () => {
    expect(readGoalRecord(null)).toEqual({ status: 'none' });
    const s = withTools();
    const stored = JSON.parse(JSON.stringify(s));
    expect(readGoalRecord(stored)).toEqual({ status: 'goal', state: s });
    expect(readGoalRecord({ ...stored, revision: 'three' })).toEqual({ status: 'rejected', reason: 'corrupt' });
    expect(readGoalRecord({ ...stored, tools: [{ id: 4 }] })).toEqual({ status: 'rejected', reason: 'corrupt' });
    expect(readGoalRecord({ schema: 'goal.v9' })).toEqual({ status: 'rejected', reason: 'unsupported' });
    expect(readGoalRecord('junk')).toEqual({ status: 'rejected', reason: 'corrupt' });
  });
});
