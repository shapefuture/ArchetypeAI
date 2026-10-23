// Specs for e08-transfer.ts: cue, reveal and variation without help locks (ArchetypeAI-onr) and recovery (ArchetypeAI-8q9).
//
// Recovery matrix (ArchetypeAI-8q9, E08.07). Each row names the test that exercises it.
//   cannot-recall             | a complete answer; no penalty, no score, interval kept   | cannot-recall is complete; scheduling reuse
//   unsuitable context        | boundary kept in the person's words; move and help stay  | recovery: unsuccessful transfer
//   unsuccessful transfer     | did-not-help is recorded; revision keeps earlier wording  | recovery: unsuccessful transfer
//   overload                  | one quiet step; record kept; repair in full, human support | recovery: overload
//   interruption              | pause and resume keep the place; a closed recall unlocks  | recovery: interruption
//   concurrency and storage   | stale revisit refused; refused write keeps the variation  | recovery: concurrency and storage
//   authority                 | model cannot author, recall, revisit or choose guidance   | authority: model cannot act for the person
//   denied / empty            | declining is first-step only; no variation means no change | denied and empty cases

import { describe, expect, it } from 'vitest';
import { createSeason } from '../core/practice-season';
import {
  HELP_OPTIONS, GUIDANCE_LEVELS, PENDING_EVIDENCE, RECALL_EVENTS, RECORD_CLASSES, REPAIR_OPTIONS, START_PROGRESSION,
  allowedEvents, chooseGuidance, createVariation, endpointFromAdaptation, helpOptionsFor, pauseRecall, probesShown,
  progressAfter, recordRecall, recordRevisit, reduceLoad, repairOptions, resultOf, resumeRecall, reviseAdaptation,
  scheduleFor, startRecall, type RecallStep, type Variation, type VariationStep,
} from './e08-transfer';

const MOVE = 'mv1';
const constraint = 'I only have five minutes at the start of a call';

function must<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error(`refused: ${JSON.stringify(result)}`);
  return result as Extract<T, { ok: true }>;
}

function variationFixture(): Variation {
  return must(createVariation({ id: 'v1', moveId: MOVE, constraint, action: 'I will ask for one minute before agreeing', adjustment: 'timing', boundary: 'Not when a decision is due now' }, 'person')).variation;
}

describe('E08.04 cue, reveal and variation without help locks', () => {
  it('try recall: an unaided recall is recorded as recalled, with no cue or reveal', () => {
    const { session } = must(recordRecall(startRecall(MOVE), 'attempt-recalled', 'person'));
    expect(session.events).toEqual(['attempt-recalled']);
    expect(resultOf(session.events)).toBe('recalled');
  });

  it('cue: a cue after a miss is honoured, and the recall that follows counts as cue-helped', () => {
    let session = must(recordRecall(startRecall(MOVE), 'attempt-cannot', 'person')).session;
    session = must(recordRecall(session, 'cue-requested', 'person')).session;
    session = must(recordRecall(session, 'attempt-recalled', 'person')).session;
    expect(resultOf(session.events)).toBe('cue-helped');
  });

  it('immediate reveal: open before any attempt, and it closes the recall', () => {
    const fresh = startRecall(MOVE);
    expect(allowedEvents(fresh)).toEqual(RECALL_EVENTS);
    const { session } = must(recordRecall(fresh, 'reveal-requested', 'person'));
    expect(resultOf(session.events)).toBe('revealed');
    expect(allowedEvents(session)).toEqual([]);
  });

  it('cannot-recall is a complete answer: cue and reveal stay open afterwards, and nothing is locked at the start', () => {
    let session = must(recordRecall(startRecall(MOVE), 'attempt-cannot', 'person')).session;
    expect(resultOf(session.events)).toBe('could-not-recall');
    expect(allowedEvents(session)).toEqual(expect.arrayContaining(['cue-requested', 'reveal-requested']));
    session = must(recordRecall(session, 'reveal-requested', 'person')).session;
    expect(resultOf(session.events)).toBe('revealed');
  });

  it('denied: declining the invitation is a clean outcome, and it is allowed only as the first step', () => {
    const declined = must(recordRecall(startRecall(MOVE), 'invite-declined', 'person')).session;
    expect(resultOf(declined.events)).toBe('declined');
    const late = must(recordRecall(startRecall(MOVE), 'attempt-cannot', 'person')).session;
    expect(recordRecall(late, 'invite-declined', 'person')).toEqual({ ok: false, reason: 'declined-late' });
  });

  it('varies one practical constraint into an if-then card the person wrote, and refuses an empty constraint', () => {
    const variation = variationFixture();
    expect(variation.card).toMatchObject({ situation: constraint, action: 'I will ask for one minute before agreeing', authoredBy: 'user' });
    expect(variation).toMatchObject({ adjustment: 'timing', boundary: 'Not when a decision is due now', revision: 1 });
    expect(createVariation({ id: 'v2', moveId: MOVE, constraint: '   ', action: 'x' }, 'person')).toEqual({ ok: false, reason: 'empty-constraint' });
  });

  it('adapting the move elsewhere keeps every help option and the move itself, and adds a season endpoint only when asked', () => {
    const variation = variationFixture();
    expect(helpOptionsFor('recall-first')).toEqual(HELP_OPTIONS);
    const still = must(recordRecall(startRecall(variation.moveId), 'cue-requested', 'person')).session;
    expect(still.moveId).toBe(MOVE);
    expect(allowedEvents(still)).toEqual(expect.arrayContaining(['reveal-requested', 'attempt-recalled']));
    const season = createSeason('s1', ['ask for pauses before agreeing']);
    expect(endpointFromAdaptation(season, variation, false).endpoints).toEqual([]);
    expect(endpointFromAdaptation(season, variation, true).endpoints).toEqual([variation.card.action]);
  });

  it('authority: the model cannot author a variation, record a recall, record a revisit or choose guidance', () => {
    const variation = variationFixture();
    expect(createVariation({ id: 'v3', moveId: MOVE, constraint, action: 'Rest' }, 'model')).toEqual({ ok: false, reason: 'model-author' });
    expect(recordRecall(startRecall(MOVE), 'attempt-recalled', 'model')).toEqual({ ok: false, reason: 'model-actor' });
    expect(recordRevisit(variation, { outcome: 'tried', helpful: 'helped' }, 'model', variation.revision)).toMatchObject({ ok: false, reason: 'model-actor' });
    expect(chooseGuidance('recall-first', 'model')).toEqual({ ok: false, reason: 'model-actor' });
  });

  it('progression suggests one step lighter after an unaided recall, never removes help, and lets the person choose either way', () => {
    const suggested = progressAfter(START_PROGRESSION, 'recalled');
    expect(suggested).toEqual({ guidance: 'full-explanation', suggested: 'cue-first' });
    for (const level of GUIDANCE_LEVELS) expect(helpOptionsFor(level)).toEqual(HELP_OPTIONS);
    expect(progressAfter(START_PROGRESSION, 'could-not-recall').suggested).toBeNull();
    expect(progressAfter({ guidance: 'recall-first', suggested: null }, 'recalled').suggested).toBeNull();
    // The person declines the suggestion and chooses fuller guidance again.
    const fuller = must(chooseGuidance('full-explanation', 'person')).progression;
    expect(fuller).toEqual({ guidance: 'full-explanation', suggested: null });
  });

  it('scheduling reuses recall-review: cannot-recall and reveal keep the interval, and nothing is scored', () => {
    const item = { id: MOVE, intervalDays: 4 };
    for (const result of ['could-not-recall', 'revealed', 'declined', 'open', 'cue-helped'] as const) {
      expect(scheduleFor(result, item)).toEqual({ intervalDays: 4, score: null });
    }
    expect(scheduleFor('recalled', item)).toEqual({ intervalDays: 8, score: null });
  });

  it('records separate observation, hypothesis, user wording and canonical measurement', () => {
    expect(RECORD_CLASSES).toEqual({
      recallResult: 'observation', helpfulness: 'observation', prediction: 'hypothesis',
      adaptedAction: 'user-authored', revisitOutcome: 'observation', canonicalMeasurement: 'none',
    });
    expect(variationFixture().card.authoredBy).toBe('user');
    expect(PENDING_EVIDENCE).toEqual(expect.arrayContaining(['transfer-reported-in-other-settings', 'independent-review']));
  });
});

describe('E08.07 recovery', () => {
  it('recovery: unsuccessful transfer keeps the move, and a revision keeps the earlier wording and boundary', () => {
    const variation = variationFixture();
    const tried = must(recordRevisit(variation, { outcome: 'tried', helpful: 'did-not-help', note: 'the call started late' }, 'person', variation.revision)).variation;
    expect(tried.revisits[0]).toMatchObject({ helpful: 'did-not-help', entry: { recorded: true, outcome: 'tried', scoreDelta: 0, causalClaim: false } });
    expect(allowedEvents(startRecall(MOVE))).toEqual(RECALL_EVENTS);
    const revised = must(reviseAdaptation(tried, 'I will ask for one minute, or send a short note', 'person', tried.revision)).variation;
    expect(revised.card.action).toBe('I will ask for one minute, or send a short note');
    expect(revised.history).toEqual([variation.card.action]);
    expect(revised.boundary).toBe('Not when a decision is due now');
    // Unsuitable context: the boundary probe shows only when the person has switched it on.
    expect(probesShown([])).toEqual([]);
    expect(probesShown(['unhelpful-when']).map((p) => p.id)).toEqual(['unhelpful-when']);
  });

  it('recovery: overload reduces the load to one quiet step, keeps the record, and offers every repair option with human support', () => {
    const session = must(recordRecall(startRecall(MOVE), 'attempt-cannot', 'person')).session;
    const quiet = reduceLoad(session);
    expect(quiet.checkIn.mode).toBe('quiet');
    expect(quiet.events).toEqual(session.events);
    expect(resultOf(quiet.events)).toBe('could-not-recall');
    expect(allowedEvents(quiet)).toEqual(expect.arrayContaining(['cue-requested', 'reveal-requested']));
    expect(repairOptions()).toEqual(REPAIR_OPTIONS);
    expect(repairOptions()).toContain('human-support');
  });

  it('recovery: interruption keeps the place, and a closed recall never locks the move', () => {
    const session = must(recordRecall(startRecall(MOVE), 'attempt-cannot', 'person')).session;
    const paused = pauseRecall(session);
    expect(paused.checkIn.interrupted).toBe(true);
    const resumed = resumeRecall(paused);
    expect(resumed.checkIn.interrupted).toBe(false);
    expect(resumed.events).toEqual(session.events);
    expect(resultOf(resumed.events)).toBe('could-not-recall');
    const closed = must(recordRecall(resumed, 'reveal-requested', 'person')).session;
    const refused: RecallStep = recordRecall(closed, 'cue-requested', 'person');
    expect(refused).toEqual({ ok: false, reason: 'closed' });
    expect(allowedEvents(startRecall(MOVE)).length).toBeGreaterThan(0);
  });

  it('recovery: concurrency and storage refuse a stale revisit, keep the variation on a refused write, and store no words for do-not-record', () => {
    const variation = variationFixture();
    const first = must(recordRevisit(variation, { outcome: 'adapted', helpful: 'helped', note: 'worked at the desk' }, 'person', 1)).variation;
    expect(first.revision).toBe(2);
    // A second tab still holds revision 1 and tries to record against the stored record (revision 2).
    const stale: VariationStep = recordRevisit(first, { outcome: 'did-not-try', helpful: null }, 'person', 1);
    expect(stale).toEqual({ ok: false, reason: 'stale-revision', variation: first });
    expect(first.revisits).toHaveLength(1);
    // A refused or failed write leaves the earlier variation as it was.
    expect(variation.revisits).toHaveLength(0);
    expect(variation.revision).toBe(1);
    const quiet = must(recordRevisit(first, { outcome: 'do-not-record', helpful: 'helped', note: 'private words' }, 'person', 2)).variation;
    expect(quiet.revisits[1]).toEqual({
      entry: { recorded: false, cardId: 'v1', outcome: 'do-not-record', note: null, scoreDelta: 0, causalClaim: false },
      helpful: null,
    });
  });
});
