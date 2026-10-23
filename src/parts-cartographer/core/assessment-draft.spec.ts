import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildItemSequence, type ItemRef } from '../../shared/i18n/items';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import {
  DESCENT_DRAFT_KEY, DESCENT_DRAFT_SCHEMA, DESCENT_ITEM_IDS, LEGACY_DESCENT_DRAFT_KEY,
  UNREADABLE_DESCENT_DRAFT_PREFIX, completeRatings, discardLegacyDescentDraft, draftFromLegacy,
  fromPositional, isDescentDraft, itemId, readDescentDraft, removeDescentDraft, resumePoint,
  toPositional, writeDescentDraft, type DescentDraft,
} from './assessment-draft';

const SEQ = buildItemSequence();

/** A deterministic, non-trivial rating per item, so any misalignment changes the score input. */
function ratingFor(ref: ItemRef, position: number): number {
  if (ref.kind === 'validity') return ref.which === 'attention' ? 3 : 2;
  return ((position * 7 + (ref.kind === 'shadow' ? ref.index : 3)) % 5) + 1;
}

function fullAnswersById(): Record<string, number> {
  const answers: Record<string, number> = {};
  SEQ.forEach((ref, position) => { answers[itemId(ref)] = ratingFor(ref, position); });
  return answers;
}

function draftWith(answers: Record<string, number>, itemIndex: number, stage: DescentDraft['cursor']['stage'] = 'item'): DescentDraft {
  return {
    schema: DESCENT_DRAFT_SCHEMA,
    answers,
    cursor: { itemId: DESCENT_ITEM_IDS[itemIndex], stage },
    savedAt: '2026-10-15T10:00:00.000Z',
  };
}

function storageError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('stable item IDs', () => {
  it('gives each of the 147 items a distinct ID that does not depend on delivery order', () => {
    expect(DESCENT_ITEM_IDS).toHaveLength(147);
    expect(new Set(DESCENT_ITEM_IDS).size).toBe(147);
    expect(itemId({ kind: 'shadow', part: 'abandoned', index: 0 })).toBe('shadow.abandoned.1');
    expect(itemId({ kind: 'resource', part: 'sage', index: 5 })).toBe('resource.sage.6');
    expect(itemId({ kind: 'self', index: 7 })).toBe('self.8');
    expect(itemId({ kind: 'validity', which: 'infrequency2' })).toBe('validity.infrequency2');
  });

  it('round-trips through the ID-keyed store without moving any rating onto another item', () => {
    const stored = fullAnswersById();
    const positional = completeRatings(stored);
    expect(positional).not.toBeNull();
    const input = toAssessmentInput(positional as number[]);
    SEQ.forEach((ref, position) => {
      const expected = ratingFor(ref, position);
      if (ref.kind === 'shadow') expect(input.shadow[ref.part][ref.index]).toBe(expected);
      if (ref.kind === 'resource') expect(input.resources[ref.part][ref.index]).toBe(expected);
      if (ref.kind === 'self') expect(input.self[ref.index]).toBe(expected);
    });
  });
});

describe('skip semantics', () => {
  it('has no skip value: a missing or zero item blocks completion and scoring', () => {
    const answers = fullAnswersById();
    delete answers[DESCENT_ITEM_IDS[10]];
    expect(completeRatings(answers)).toBeNull();
    expect(() => toAssessmentInput(toPositional(answers))).toThrow();
    expect(isDescentDraft(draftWith({ ...fullAnswersById(), [DESCENT_ITEM_IDS[3]]: 0 }, 3))).toBe(false);
  });

  it('rejects unknown IDs, out-of-range and non-integer ratings', () => {
    expect(isDescentDraft(draftWith({ 'shadow.unknown.1': 3 }, 0))).toBe(false);
    expect(isDescentDraft(draftWith({ [DESCENT_ITEM_IDS[0]]: 6 }, 0))).toBe(false);
    expect(isDescentDraft(draftWith({ [DESCENT_ITEM_IDS[0]]: 2.5 }, 0))).toBe(false);
    expect(isDescentDraft(draftWith({ [DESCENT_ITEM_IDS[0]]: 4 }, 0))).toBe(true);
  });
});

describe('verified saves', () => {
  it('reports saved only when the store returns the same draft', () => {
    const draft = draftWith({ [DESCENT_ITEM_IDS[0]]: 4 }, 1);
    expect(writeDescentDraft(draft)).toEqual({ ok: true, savedAt: draft.savedAt });
    const read = readDescentDraft();
    expect(read.status).toBe('draft');
    if (read.status === 'draft') expect(read.draft).toEqual(draft);
  });

  it('reports verify-failed when the write does not persist', () => {
    const stale = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    } as unknown as Storage;
    expect(writeDescentDraft(draftWith({ [DESCENT_ITEM_IDS[0]]: 4 }, 1), stale)).toEqual({ ok: false, reason: 'verify-failed' });
  });

  it('maps quota, blocked and other storage errors to distinct reasons', () => {
    const failing = (error: Error) => ({
      getItem: () => null,
      setItem: () => { throw error; },
      removeItem: () => undefined,
    } as unknown as Storage);
    const draft = draftWith({ [DESCENT_ITEM_IDS[0]]: 4 }, 1);
    expect(writeDescentDraft(draft, failing(storageError('QuotaExceededError')))).toEqual({ ok: false, reason: 'quota' });
    expect(writeDescentDraft(draft, failing(storageError('SecurityError')))).toEqual({ ok: false, reason: 'blocked' });
    expect(writeDescentDraft(draft, failing(storageError('InvalidStateError')))).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('reports an unavailable read instead of an empty draft', () => {
    const broken = {
      getItem: () => { throw storageError('SecurityError'); },
    } as unknown as Storage;
    expect(readDescentDraft(broken)).toEqual({ status: 'rejected', reason: 'unavailable' });
  });

  it('copies an unreadable draft aside before overwriting it', () => {
    localStorage.setItem(DESCENT_DRAFT_KEY, '{not json');
    expect(readDescentDraft()).toEqual({ status: 'rejected', reason: 'corrupt' });
    expect(writeDescentDraft(draftWith({ [DESCENT_ITEM_IDS[0]]: 2 }, 1))).toMatchObject({ ok: true });
    const copies = Object.keys(localStorage).filter((key) => key.startsWith(UNREADABLE_DESCENT_DRAFT_PREFIX));
    expect(copies).toHaveLength(1);
    expect(localStorage.getItem(copies[0])).toBe('{not json');
  });

  it('removes the current draft only with a verified removal', () => {
    writeDescentDraft(draftWith({ [DESCENT_ITEM_IDS[0]]: 4 }, 1));
    expect(removeDescentDraft()).toBe(true);
    expect(localStorage.getItem(DESCENT_DRAFT_KEY)).toBeNull();
  });
});

describe('historical V1 draft', () => {
  const legacy = (answers: number[]) => JSON.stringify({ answers, itemIndex: 0, stage: 'item', somatic: {} });

  it('is offered for explicit migration and is never read as current data', () => {
    const positional = Array(147).fill(0);
    positional[0] = 3;
    positional[1] = 5;
    localStorage.setItem(LEGACY_DESCENT_DRAFT_KEY, legacy(positional));
    const read = readDescentDraft();
    expect(read).toEqual({ status: 'legacy', answers: positional });
    expect(localStorage.getItem(DESCENT_DRAFT_KEY)).toBeNull();
  });

  it('maps positions onto the same items and keeps the scoring meaning', () => {
    const positional = SEQ.map((ref, position) => (position < 60 ? ratingFor(ref, position) : 0));
    const migrated = draftFromLegacy(positional, '2026-10-15T10:00:00.000Z');
    expect(migrated.cursor).toEqual({ itemId: DESCENT_ITEM_IDS[60], stage: 'item' });
    expect(toPositional(migrated.answers)).toEqual(positional);
    expect(Object.keys(migrated.answers)).toHaveLength(60);
  });

  it('is retired only on explicit discard, and an unsupported V1 is rejected without deletion', () => {
    localStorage.setItem(LEGACY_DESCENT_DRAFT_KEY, legacy([1, 2, 3]));
    expect(readDescentDraft()).toEqual({ status: 'rejected', reason: 'unsupported' });
    expect(localStorage.getItem(LEGACY_DESCENT_DRAFT_KEY)).not.toBeNull();
    expect(discardLegacyDescentDraft()).toBe(true);
    expect(localStorage.getItem(LEGACY_DESCENT_DRAFT_KEY)).toBeNull();
  });

  it('prefers the current draft when both exist, so a V1 leftover is not used silently', () => {
    localStorage.setItem(LEGACY_DESCENT_DRAFT_KEY, legacy(Array(147).fill(4)));
    writeDescentDraft(draftWith({ [DESCENT_ITEM_IDS[0]]: 1 }, 1));
    expect(readDescentDraft().status).toBe('draft');
  });
});

describe('resume point', () => {
  it('returns to the saved item rather than the first unanswered one', () => {
    const answers = fromPositional(SEQ.map((ref, position) => (position < 10 ? ratingFor(ref, position) : 0)));
    const point = resumePoint(draftWith(answers, 4));
    expect(point).toMatchObject({ stage: 'item', index: 4 });
  });

  it('resumes at a sitting break only when that boundary is answered', () => {
    const answers = fromPositional(SEQ.map((ref, position) => (position <= 48 ? ratingFor(ref, position) : 0)));
    expect(resumePoint(draftWith(answers, 48, 'break'))).toMatchObject({ stage: 'break', index: 48 });
    expect(resumePoint(draftWith({}, 48, 'break'))).toMatchObject({ stage: 'item', index: 48 });
  });

  it('goes to the North Star step only when all 147 items are rated', () => {
    expect(resumePoint(draftWith(fullAnswersById(), 146, 'future-self'))).toMatchObject({ stage: 'future-self', index: 146 });
    const partial = fullAnswersById();
    delete partial[DESCENT_ITEM_IDS[20]];
    expect(resumePoint(draftWith(partial, 146, 'future-self'))).toMatchObject({ stage: 'item', index: 146 });
  });
});
