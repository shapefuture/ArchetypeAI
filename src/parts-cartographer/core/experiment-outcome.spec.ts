import { describe, expect, it } from 'vitest';
import { createCard, recordOutcome, summarizeExperiments, OUTCOMES, type OutcomeEntry } from './experiment-outcome.ts';

const card = createCard({ id: 'e1', situation: 'When a meeting runs late', action: 'I will send one short message', prediction: 'It will feel awkward but fine' })!;

describe('experiment cards', () => {
  it('lets only the person author a card, and needs an action', () => {
    expect(createCard({ id: 'e2', situation: 'When tired', action: 'Rest for ten minutes', authoredBy: 'model' })).toBeNull();
    expect(createCard({ id: 'e3', situation: '  ', action: 'Rest' })).toBeNull();
    expect(card.authoredBy).toBe('user');
    expect(card.prediction).toBe('It will feel awkward but fine');
  });

  it('keeps the prediction optional', () => {
    expect(createCard({ id: 'e4', situation: 'When tired', action: 'Rest' })?.prediction).toBeUndefined();
  });
});

describe('outcomes', () => {
  it('gives every outcome the same shape, zero score effect and no causal claim', () => {
    for (const outcome of OUTCOMES) {
      const entry = recordOutcome(card, outcome, 'a note');
      expect(entry.scoreDelta).toBe(0);
      expect(entry.causalClaim).toBe(false);
    }
  });

  it('stores a note for every outcome except do-not-record, which stores no words at all', () => {
    expect(recordOutcome(card, 'did-not-try', 'busy day')).toMatchObject({ recorded: true, note: 'busy day' });
    expect(recordOutcome(card, 'tried', '   ')).toMatchObject({ recorded: true, note: null });
    expect(recordOutcome(card, 'do-not-record', 'private words')).toEqual({
      recorded: false, cardId: 'e1', outcome: 'do-not-record', note: null, scoreDelta: 0, causalClaim: false,
    });
  });

  it('never reads an unrecorded outcome as a failure in the summary', () => {
    const entries: OutcomeEntry[] = [
      recordOutcome(card, 'tried'),
      recordOutcome(card, 'did-not-try'),
      recordOutcome(card, 'do-not-record'),
    ];
    const summary = summarizeExperiments(entries);
    expect(summary.recordedCount).toBe(2);
    expect(summary.counts).toEqual({ tried: 1, adapted: 0, 'did-not-try': 1 });
    expect(summary.scoreDelta).toBe(0);
  });

  it('never claims causality, even from a single tried result', () => {
    const summary = summarizeExperiments([recordOutcome(card, 'tried', 'it worked')]);
    expect(summary.causalClaim).toBe(false);
    expect(summary.recordedCount).toBe(1);
  });
});
