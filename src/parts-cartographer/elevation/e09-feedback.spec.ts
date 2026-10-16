import { describe, expect, it } from 'vitest';
import { createCard, recordOutcome } from '../core/experiment-outcome';
import {
  ACTION_KINDS, CATALOG, actionFromOutcome, dismiss, isTruthfulCopy, markShown, normalizeLedger, pendingItems,
  recordSelection, revoke, selectFeedback, type ActionKind, type Actor, type ConfirmedAction, type FeedbackItem,
  type Ledger, type Preference, type Selection,
} from './e09-feedback';

const full: Preference = { mode: 'full' };
const quiet: Preference = { mode: 'quiet' };
const off: Preference = { mode: 'off' };

const act = (kind: ActionKind, overrides: Partial<ConfirmedAction> = {}): ConfirmedAction =>
  ({ eventId: `ev-${kind}`, kind, subjectId: 'card-1', confirmed: true, origin: 'person', ...overrides });

function shown(selection: Selection): FeedbackItem {
  if (selection.status !== 'show') throw new Error(`expected a shown item, got ${selection.reason}`);
  return selection.item;
}

describe('E09 feedback selection (normal and empty)', () => {
  it('offers one optional, zero-score acknowledgement for each confirmed person action kind', () => {
    for (const kind of ACTION_KINDS) {
      expect(shown(selectFeedback(act(kind), [], full))).toMatchObject({ kind, eventId: `ev-${kind}`, optional: true, scoreDelta: 0 });
    }
  });

  it('keeps observation, hypothesis, authorship and canonical measurement as separate fields', () => {
    const revised = shown(selectFeedback(act('plan-revised'), [], full));
    expect(revised.basis.observation).toBe('You revised this plan.');
    expect(revised.basis.hypothesis).toContain('may');
    expect(revised.basis.authorship).toEqual({ feedbackText: 'app-authored', referencedAction: 'user-authored' });
    expect(revised.basis.canonicalMeasurement).toBe('untouched');
    expect(shown(selectFeedback(act('rest-chosen'), [], full)).basis.hypothesis).toBeNull();
  });
});

describe('E09 authority and failure (denied and failed)', () => {
  it('refuses unconfirmed, app, model, therapist-authored, malformed and unknown-kind actions', () => {
    expect(selectFeedback(act('rest-chosen', { confirmed: false }), [], full)).toEqual({ status: 'refused', reason: 'not-confirmed' });
    for (const origin of ['app', 'model', 'therapist'] as const) {
      expect(selectFeedback(act('help-requested', { origin }), [], full)).toEqual({ status: 'refused', reason: 'not-person-origin' });
    }
    expect(selectFeedback(act('rest-chosen', { eventId: '   ' }), [], full)).toEqual({ status: 'refused', reason: 'invalid-event' });
    expect(selectFeedback(act('rest-chosen', { subjectId: '' }), [], full)).toEqual({ status: 'refused', reason: 'invalid-event' });
    expect(selectFeedback({ ...act('rest-chosen'), kind: 'streak-earned' as ActionKind }, [], full)).toEqual({ status: 'refused', reason: 'unknown-kind' });
  });

  it('refuses a missing or untruthful copy line instead of replacing it with generic text', () => {
    expect(selectFeedback(act('rest-chosen'), [], full, {})).toEqual({ status: 'refused', reason: 'missing-copy' });
    const scored = { ...CATALOG, 'rest-chosen': { observation: 'Resting raised your score.', hypothesis: null } };
    expect(selectFeedback(act('rest-chosen'), [], full, scored)).toEqual({ status: 'refused', reason: 'untruthful-copy' });
  });
});

describe('E09 copy truthfulness', () => {
  it('passes every catalog line, and refuses scores, streaks, counts, causes and unhedged hypotheses', () => {
    for (const line of Object.values(CATALOG)) expect(isTruthfulCopy(line!)).toBe(true);
    expect(isTruthfulCopy({ observation: 'Your streak grew by 2 points.', hypothesis: null })).toBe(false);
    expect(isTruthfulCopy({ observation: 'You revised this plan.', hypothesis: 'The plan will definitely work.' })).toBe(false);
    expect(isTruthfulCopy({ observation: 'Resting caused the change.', hypothesis: null })).toBe(false);
  });

  it('quiet mode keeps the observation and drops the hypothesis; off mode refuses and keeps pending entries', () => {
    expect(shown(selectFeedback(act('plan-revised'), [], quiet)).basis).toMatchObject({ observation: 'You revised this plan.', hypothesis: null });
    expect(selectFeedback(act('help-requested'), [], off)).toEqual({ status: 'refused', reason: 'feedback-off' });
    const ledger = recordSelection([], shown(selectFeedback(act('help-requested'), [], full)));
    expect(pendingItems(ledger, off)).toEqual([]);
    expect(ledger).toHaveLength(1);
  });
});

describe('E09 fixtures and deduplication', () => {
  it('choose rest, then replay the same event: one pending acknowledgement and an unchanged ledger', () => {
    const rest = act('rest-chosen', { eventId: 'ev-rest-1' });
    const first = shown(selectFeedback(rest, [], full));
    const ledger = recordSelection([], first);
    expect(shown(selectFeedback(rest, ledger, full))).toEqual(first);
    expect(recordSelection(ledger, first)).toBe(ledger);
  });

  it('duplicate events: a shown or dismissed acknowledgement is never offered again', () => {
    const help = act('help-requested', { eventId: 'ev-help-1' });
    const ledger = markShown(recordSelection([], shown(selectFeedback(help, [], full))), help.eventId);
    expect(selectFeedback(help, ledger, full)).toEqual({ status: 'refused', reason: 'duplicate' });
    const dismissed = dismiss(ledger, help.eventId);
    expect(selectFeedback(help, dismissed, full)).toEqual({ status: 'refused', reason: 'duplicate' });
  });

  it('decline recording: an unsaved decline says nothing was saved, and a recorded outcome is not acknowledged here', () => {
    const card = createCard({ id: 'card-1', situation: 'When a meeting runs late', action: 'I will send one short message' })!;
    const action = actionFromOutcome(recordOutcome(card, 'do-not-record'), 'ev-decline-1', card.id, true)!;
    const item = shown(selectFeedback(action, [], full));
    expect(item.basis.observation).toContain('not to record');
    expect(item.basis.observation).toContain('Nothing was saved');
    expect(actionFromOutcome(recordOutcome(card, 'tried', 'a note'), 'ev-x', card.id, true)).toBeNull();
    expect(actionFromOutcome(recordOutcome(card, 'do-not-record'), 'ev-y', card.id, false)).toMatchObject({ confirmed: false });
  });
});

describe('E09 recovery: duplicate events, revoked outcomes, hidden rewards and interrupted feedback', () => {
  const revise = act('plan-revised', { eventId: 'ev-revise-1' });

  it('recovery: revoked outcomes stay revoked when revoked before any feedback was selected', () => {
    const ledger = revoke([], 'ev-revise-1', 'person');
    expect(selectFeedback(revise, ledger, full)).toEqual({ status: 'refused', reason: 'revoked' });
    expect(pendingItems(ledger, full)).toEqual([]);
  });

  it('recovery: revoked outcomes hide shown or pending feedback and are never offered again', () => {
    const pending = recordSelection([], shown(selectFeedback(revise, [], full)));
    expect(pendingItems(revoke(pending, 'ev-revise-1', 'person'), full)).toEqual([]);
    const shownLedger = markShown(pending, 'ev-revise-1');
    const hidden = revoke(shownLedger, 'ev-revise-1', 'person');
    expect(hidden).toEqual([{ eventId: 'ev-revise-1', kind: 'plan-revised', status: 'revoked' }]);
    expect(selectFeedback(revise, hidden, full)).toEqual({ status: 'refused', reason: 'revoked' });
  });

  it('recovery: only the person can revoke an outcome; app, model and therapist revocations change nothing', () => {
    const ledger = recordSelection([], shown(selectFeedback(revise, [], full)));
    for (const actor of ['app', 'model', 'therapist'] as Actor[]) {
      expect(revoke(ledger, 'ev-revise-1', actor)).toBe(ledger);
    }
  });

  it('recovery: interrupted feedback survives a storage round trip and resumes once, then stays shown', () => {
    const action = act('exception-noticed', { eventId: 'ev-exc-1' });
    const ledger = recordSelection([], shown(selectFeedback(action, [], full)));
    const reloaded = normalizeLedger(JSON.parse(JSON.stringify(ledger)));
    expect(pendingItems(reloaded, full).map((i) => i.eventId)).toEqual(['ev-exc-1']);
    expect(shown(selectFeedback(action, reloaded, full)).eventId).toBe('ev-exc-1');
    const after = markShown(reloaded, 'ev-exc-1');
    expect(pendingItems(after, full)).toEqual([]);
    expect(selectFeedback(action, after, full)).toEqual({ status: 'refused', reason: 'duplicate' });
  });

  it('recovery: corrupt or partial stored ledgers keep only valid entries and invent none', () => {
    expect(normalizeLedger(undefined)).toEqual([]);
    expect(normalizeLedger('garbage')).toEqual([]);
    expect(normalizeLedger([null, 42, { eventId: '', kind: 'rest-chosen', status: 'shown' }, { eventId: 'a', kind: 'made-up', status: 'shown' }, { eventId: 'b', kind: 'rest-chosen', status: 'bogus' }])).toEqual([]);
    const duplicated = [
      { eventId: 'a', kind: 'rest-chosen', status: 'shown' },
      { eventId: 'a', kind: 'rest-chosen', status: 'pending' },
      { eventId: 'a', kind: 'rest-chosen', status: 'revoked' },
    ];
    expect(normalizeLedger(duplicated)).toEqual([{ eventId: 'a', kind: 'rest-chosen', status: 'revoked' }]);
  });

  it('recovery: hidden rewards never appear as a count, rank or unseen tally', () => {
    const ledger: Ledger = ACTION_KINDS.reduce<Ledger>((acc, kind) => recordSelection(acc, shown(selectFeedback(act(kind), acc, full))), []);
    const items = pendingItems(ledger, full);
    expect(items).toHaveLength(ACTION_KINDS.length);
    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(['basis', 'eventId', 'feedbackId', 'kind', 'optional', 'scoreDelta']);
      expect(Object.keys(item.basis).sort()).toEqual(['authorship', 'canonicalMeasurement', 'hypothesis', 'observation']);
      expect(item.scoreDelta).toBe(0);
    }
  });
});
