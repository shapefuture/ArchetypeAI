import { describe, expect, it } from 'vitest';
import { leave } from '../core/situation-inquiry';
import {
  addException,
  addReading,
  correctWording,
  type DiscriminatingQuestion,
  type DiscriminatorState,
  type Outcome,
  parseOptionalWord,
  respond,
  respondWithText,
  restoreDiscriminator,
  selectQuestion,
  startDiscriminator,
  undo,
  validateBank,
  visibleFormulation,
} from './e04-discriminator';

const must = (outcome: Outcome): DiscriminatorState => {
  if (!outcome.ok) throw new Error(`refused: ${outcome.reason}`);
  return outcome.state;
};

const RESTORE = 'Possibly time alone is restoring you';
const BARRIER = 'Possibly time alone feels like a barrier';

const BANK: DiscriminatingQuestion[] = [
  { id: 'q-alone', text: 'Does time alone feel restorative and chosen, or like a barrier you wish you could cross?', separates: ['r-restore', 'r-barrier'], after: [] },
  { id: 'q-exception', text: 'Was there a similar moment that went differently? What was different then?', separates: ['r-restore', 'r-barrier'], after: ['q-alone'] },
  { id: 'q-third', text: 'Did the same feeling show up when you were with other people?', separates: ['r-restore', 'r-barrier'], after: [] },
  { id: 'q-money', text: 'Did money or the schedule matter more than the call itself?', separates: ['r-money', 'r-call'], after: [] },
];

function twoReadings(observation = 'Time alone after a long week'): DiscriminatorState {
  const start = startDiscriminator(observation);
  if (!start) throw new Error('setup failed');
  return must(addReading(must(addReading(start, 'r-restore', RESTORE, null)), 'r-barrier', BARRIER, null));
}

describe('E04.04 contextual selection and correction-first transitions', () => {
  it('asks the question that separates the two live readings, in bank order', () => {
    expect(selectQuestion(twoReadings(), BANK)).toEqual({ status: 'asked', question: BANK[0] });
  });

  it('holds back a question until its prerequisite is answered, and names what it waits on', () => {
    expect(selectQuestion(twoReadings(), [BANK[1]])).toEqual({ status: 'missing-context', waitingOn: ['q-alone'] });
  });

  it('stops at the inquiry bound and refuses further answers', () => {
    let state = twoReadings();
    for (const question of [BANK[0], BANK[1], BANK[2]]) state = must(respond(state, question, 'both'));
    expect(selectQuestion(state, BANK)).toEqual({ status: 'bound-reached' });
    const extra: DiscriminatingQuestion = { id: 'q-extra', text: 'Was anything different this time?', separates: ['r-restore', 'r-barrier'], after: [] };
    expect(respond(state, extra, 'both')).toEqual({ ok: false, reason: 'bound-reached' });
  });

  it('treats one observation or one reading as sparse, and says so honestly', () => {
    const alone = startDiscriminator('A tense call');
    if (!alone) throw new Error('setup failed');
    expect(selectQuestion(alone, BANK)).toEqual({ status: 'sparse', reason: 'no-readings' });
    const one = must(addReading(alone, 'r-restore', 'Possibly I needed space', null));
    expect(selectQuestion(one, BANK)).toEqual({ status: 'sparse', reason: 'one-reading' });
    expect(visibleFormulation(alone)).toMatchObject({ sparse: true, basis: 'observation-only' });
    expect(visibleFormulation(alone).note).toContain('not a pattern');
  });

  it('exercises all five response types, each with its own formulation', () => {
    const base = twoReadings();
    const [question] = BANK;
    expect(visibleFormulation(must(respond(base, question, 'first')))).toMatchObject({ basis: 'reading-chosen', lead: RESTORE, leadSource: 'app-hypothesis' });
    expect(visibleFormulation(must(respond(base, question, 'second')))).toMatchObject({ basis: 'reading-chosen', lead: BARRIER });
    expect(visibleFormulation(must(respond(base, question, 'both')))).toMatchObject({ basis: 'both-open', lead: base.inquiry.observation, leadSource: 'user-observation' });
    const depends = visibleFormulation(must(respond(base, question, 'depends')));
    expect(depends).toMatchObject({ basis: 'depends', readings: [RESTORE, BARRIER] });
    expect(depends.unknowns).toEqual([question.text]);
    expect(visibleFormulation(must(respond(base, question, 'neither')))).toMatchObject({ basis: 'none-fit', readings: [] });
  });

  it('neither rejects both readings, and a rejected reading is never re-added as a discovery', () => {
    const outcome = respond(twoReadings(), BANK[0], 'neither');
    expect(outcome).toMatchObject({ ok: true, writes: ['inquiry-draft', 'rejected-reading'] });
    const none = must(outcome);
    expect(addReading(none, 'r-again', RESTORE, null)).toEqual({ ok: false, reason: 'rejected-again' });
    expect(selectQuestion(none, BANK)).toEqual({ status: 'sparse', reason: 'no-readings' });
  });

  it('depends keeps both readings live and sequences the next question from the answer', () => {
    const afterDepends = must(respond(twoReadings(), BANK[0], 'depends'));
    expect(afterDepends.inquiry.hypotheses).toHaveLength(2);
    expect(selectQuestion(afterDepends, BANK)).toEqual({ status: 'asked', question: BANK[1] });
  });

  it('accepts only exact optional words and treats any other text as the person own wording', () => {
    expect(parseOptionalWord('  Neither ')).toBe('neither');
    expect(parseOptionalWord('NOT SURE')).toBe('not-sure');
    expect(parseOptionalWord('Depends.')).toBeNull();
    expect(parseOptionalWord('depends on who is asking')).toBeNull();
    expect(parseOptionalWord('constructor')).toBeNull();
    const authored = must(respondWithText(twoReadings(), BANK[0], 'Depends on who is asking'));
    expect(visibleFormulation(authored)).toMatchObject({ basis: 'authored', lead: 'Depends on who is asking', leadSource: 'user-authored' });
    expect(authored.responses.at(-1)?.answer).toBe('authored');
    expect(must(respondWithText(twoReadings(), BANK[0], 'depends')).responses.at(-1)?.answer).toBe('depends');
  });

  it('not sure and skip count toward the bound, change no reading, and are not asked again', () => {
    const skipped = must(respond(twoReadings(), BANK[0], 'skip'));
    expect(skipped.inquiry.hypotheses).toHaveLength(2);
    expect(skipped.chosen).toBeNull();
    expect(skipped.inquiry.questionsAsked).toBe(1);
    expect(selectQuestion(skipped, BANK)).toEqual({ status: 'asked', question: BANK[1] });
    const unsure = must(respond(skipped, BANK[1], 'not-sure'));
    expect(unsure.inquiry.questionsAsked).toBe(2);
    expect(selectQuestion(unsure, BANK)).toEqual({ status: 'asked', question: BANK[2] });
  });

  it('a correction changes the lead at once and writes only the inquiry draft', () => {
    const base = twoReadings();
    const outcome = correctWording(base, '  It was about the schedule, not the time alone  ');
    expect(outcome).toMatchObject({ ok: true, writes: ['inquiry-draft'] });
    if (!outcome.ok) return;
    expect(visibleFormulation(outcome.state)).toMatchObject({
      basis: 'authored',
      lead: 'It was about the schedule, not the time alone',
      leadSource: 'user-authored',
    });
    expect(outcome.state.inquiry.hypotheses).toEqual(base.inquiry.hypotheses);
    expect(outcome.state.responses).toEqual(base.responses);
    expect(Object.keys(outcome.state).sort()).toEqual(['chosen', 'exceptions', 'history', 'inquiry', 'responses']);
  });

  it('an exception changes the visible formulation text and leaves the readings untouched', () => {
    const base = must(respond(twoReadings(), BANK[0], 'both'));
    const before = visibleFormulation(base);
    const noted = must(addException(base, '  Last time I stepped outside first  '));
    const after = visibleFormulation(noted);
    expect(after.exceptions).toEqual(['Last time I stepped outside first']);
    expect(after.text).toBe(`${before.lead} Exception noted: Last time I stepped outside first`);
    expect(after.text).not.toBe(before.text);
    expect(after.readings).toEqual(before.readings);
    expect(addException(base, '   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('unsafe scope: safety wording stops questioning, and out-of-scope wording is refused', () => {
    const risky = startDiscriminator('I keep thinking about self-harm at night');
    if (!risky) throw new Error('setup failed');
    expect(selectQuestion(must(addReading(risky, 'r-restore', 'Possibly I need rest', null)), BANK)).toEqual({ status: 'support', reason: 'safety-terms' });
    expect(addReading(twoReadings(), 'r-origin', 'Possibly this traces to childhood', null)).toEqual({ ok: false, reason: 'unsafe-scope' });
    const checked = validateBank([
      ...BANK,
      { id: 'q-origin', text: 'What happened in your childhood that taught this?', separates: ['r-restore', 'r-barrier'], after: [] },
      { id: 'q-alone', text: 'A different wording of the same question?', separates: ['r-restore', 'r-barrier'], after: [] },
    ]);
    expect(checked.usable).toHaveLength(BANK.length);
    expect(checked.refused).toEqual([
      { id: 'q-origin', reason: 'unsafe-scope' },
      { id: 'q-alone', reason: 'duplicate-id' },
    ]);
  });

  it('an interrupted session resumes to the same next question and formulation', () => {
    const state = must(respond(twoReadings(), BANK[0], 'both'));
    const restored = restoreDiscriminator(JSON.parse(JSON.stringify(state)));
    if (!restored) throw new Error('restore failed');
    expect(selectQuestion(restored, BANK)).toEqual(selectQuestion(state, BANK));
    expect(visibleFormulation(restored)).toEqual(visibleFormulation(state));
    expect(restoreDiscriminator({ inquiry: 'bad', responses: [] })).toBeNull();
    expect(restoreDiscriminator({ ...JSON.parse(JSON.stringify(state)), responses: [{ questionId: 'q', answer: 'maybe' }] })).toBeNull();
  });

  it('undo restores the state before a mistaken neither, with both readings live again', () => {
    const base = twoReadings();
    const mistaken = must(respond(base, BANK[0], 'neither'));
    const reverted = undo(mistaken);
    expect(reverted).toEqual(base);
    expect(selectQuestion(reverted, BANK)).toEqual({ status: 'asked', question: BANK[0] });
  });

  it('a quiet session stays unchanged: selection writes nothing, and leaving has no penalty', () => {
    const state = twoReadings();
    const snapshot = JSON.stringify(state);
    const first = selectQuestion(state, BANK);
    expect(selectQuestion(state, BANK)).toEqual(first);
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(leave(state.inquiry)).toEqual({ penalty: 0, scoreDelta: 0 });
  });
});
