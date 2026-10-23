import { describe, expect, it } from 'vitest';
import { addHypothesis, allowedFormulation, answer, chooseNextAction, correct, formulation, leave, MAX_HYPOTHESES, MAX_QUESTIONS, nextQuestion, rejectHypothesis, startInquiry } from './situation-inquiry.ts';

const QUESTIONS = ['What happened just before?', 'What did you need?', 'What would help now?', 'Extra question'];

describe('bounded situation inquiry', () => {
  it('stops asking after the bound, and can be left with no penalty', () => {
    let inquiry = startInquiry('A tense call with a colleague')!;
    for (let i = 0; i < MAX_QUESTIONS; i += 1) {
      const q = nextQuestion(inquiry, QUESTIONS);
      expect(q).not.toBeNull();
      inquiry = answer(inquiry, `a${i}`, 'something');
    }
    expect(nextQuestion(inquiry, QUESTIONS)).toBeNull();
    expect(leave(inquiry)).toEqual({ penalty: 0, scoreDelta: 0 });
  });

  it('refuses an empty observation', () => {
    expect(startInquiry('   ')).toBeNull();
  });

  it('keeps hypotheses bounded and refuses an overclaim', () => {
    let inquiry = startInquiry('A tense call')!;
    for (let i = 0; i < MAX_HYPOTHESES; i += 1) {
      const result = addHypothesis(inquiry, `h${i}`, `Possibly I felt rushed ${i}`, null);
      expect(result.ok).toBe(true);
      if (result.ok) inquiry = result.inquiry;
    }
    expect(addHypothesis(inquiry, 'h9', 'Possibly I felt rushed again', null)).toEqual({ ok: false, reason: 'limit' });
    expect(allowedFormulation('This is caused by your personality')).toBe(false);
    expect(addHypothesis(startInquiry('x')!, 'h', 'You are an anxious person', null)).toEqual({ ok: false, reason: 'overclaim' });
  });

  it('does not repeat a rejected reading as a new discovery', () => {
    let inquiry = startInquiry('A tense call')!;
    const first = addHypothesis(inquiry, 'h1', 'Possibly I felt rushed', null);
    if (!first.ok) throw new Error('setup failed');
    inquiry = rejectHypothesis(first.inquiry, 'h1');
    expect(inquiry.hypotheses).toHaveLength(0);
    expect(addHypothesis(inquiry, 'h2', 'possibly i felt rushed', null)).toEqual({ ok: false, reason: 'rejected-again' });
  });

  it('shows the latest correction as the formulation, and the original stays on record', () => {
    const original = startInquiry('A tense call')!;
    expect(formulation(original)).toBe('A tense call');
    const corrected = correct(original, 'It was about money, not the call');
    expect(formulation(corrected)).toBe('It was about money, not the call');
    expect(corrected.observation).toBe('A tense call');
  });

  it('records a correction and keeps the chosen next action separate from the observation', () => {
    let inquiry = correct(startInquiry('A tense call')!, 'It was about money, not the call');
    expect(inquiry.corrections).toEqual(['It was about money, not the call']);
    const result = chooseNextAction(inquiry, 'Send one short follow-up message');
    expect(result.ok).toBe(true);
    if (result.ok) inquiry = result.inquiry;
    expect(inquiry.nextAction).toBe('Send one short follow-up message');
    expect(inquiry.observation).toBe('A tense call');
  });
});
