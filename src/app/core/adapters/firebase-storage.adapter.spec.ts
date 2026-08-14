/**
 * Regression tests for the FirebaseStorageAdapter.mergeCurrentIntoHistory
 * pure helper.
 *
 * The bug it guards: the cabinet's "Assessment history" panel was showing
 * every assessment TWICE, with the two entries ~1 second apart. The cause
 * was that loadHistory read both the `users/{uid}/history` collection AND
 * the `users/{uid}/assessment/current` document, then prepended `current`
 * to the history list whenever `current` was newer than the most recent
 * history entry. But every save updates `current` ~1 second before the
 * matching history entry, so the panel always showed a phantom duplicate
 * of the latest save.
 *
 * Fix: only use `current` as a fallback when the history collection is
 * COMPLETELY empty (legacy users who saved before saveToHistory was wired
 * up). Once any history entry exists, the history collection is the
 * source of truth.
 */

import { FirebaseStorageAdapter } from './firebase-storage.adapter';
import { AssessmentData } from '../ports/storage.port';

function makeEntry(updatedAt: string, createdAt: string | null = null, label = ''): AssessmentData {
  return {
    responses: new Array(64).fill(3),
    dimensionalExpressions: { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 },
    results: { analysis: label, pantheon: [] },
    scoringMethod: 'deterministic',
    updatedAt,
    ...(createdAt !== null ? { createdAt } : {}),
  } as AssessmentData;
}

describe('FirebaseStorageAdapter.mergeCurrentIntoHistory (history de-dup regression)', () => {
  it('does NOT prepend `current` when history has at least one entry (the bug case)', () => {
    // The bug scenario:
    //   - User just completed an assessment
    //   - saveAssessment wrote `current` at T (e.g. 19:05:03.500)
    //   - saveToHistory wrote the matching history entry at T+1s (e.g. 19:05:04.500)
    //   - loadHistory read both, saw `current.updatedAt > newest history.updatedAt`,
    //     and prepended `current` → user saw two rows ~1 second apart
    const historyEntry = makeEntry('2026-06-06T19:05:04.500Z', '2026-06-06T19:05:04.500Z', 'real save');
    const current = makeEntry('2026-06-06T19:05:03.500Z', null, 'current snapshot');
    const history = [historyEntry];

    const merged = FirebaseStorageAdapter.mergeCurrentIntoHistory(history, current);

    expect(merged).toEqual([historyEntry]); // not [current, historyEntry]
    expect(merged.length).toBe(1);
  });

  it('does NOT prepend `current` even when many history entries already exist', () => {
    const history = [
      makeEntry('2026-06-06T19:05:04.500Z', '2026-06-06T19:05:04.500Z', 'newest'),
      makeEntry('2026-06-06T19:00:00.000Z', '2026-06-06T19:00:00.000Z', 'older'),
      makeEntry('2026-06-06T18:55:00.000Z', '2026-06-06T18:55:00.000Z', 'oldest'),
    ];
    const current = makeEntry('2026-06-06T19:05:05.000Z', null, 'current snapshot');

    const merged = FirebaseStorageAdapter.mergeCurrentIntoHistory(history, current);

    expect(merged).toEqual(history);
    expect(merged.length).toBe(3);
  });

  it('DOES prepend `current` as a fallback when the history collection is COMPLETELY empty (legacy user)', () => {
    // Legacy compatibility: a user who saved before saveToHistory was wired up
    // has only a `current` document and no history collection. The cabinet
    // should still show their latest assessment.
    const current = makeEntry('2026-06-01T12:00:00.000Z', null, 'legacy save');
    const history: AssessmentData[] = [];

    const merged = FirebaseStorageAdapter.mergeCurrentIntoHistory(history, current);

    expect(merged).toEqual([current]);
    expect(merged.length).toBe(1);
  });

  it('returns history unchanged when there is no `current` document', () => {
    const history = [makeEntry('2026-06-06T19:05:04.500Z', '2026-06-06T19:05:04.500Z', 'only save')];

    const merged = FirebaseStorageAdapter.mergeCurrentIntoHistory(history, null);

    expect(merged).toEqual(history);
  });

  it('returns [] when both history and current are empty/null (brand-new user)', () => {
    const merged = FirebaseStorageAdapter.mergeCurrentIntoHistory([], null);
    expect(merged).toEqual([]);
  });

  it('does NOT mutate the input history array (immutability)', () => {
    const historyEntry = makeEntry('2026-06-06T19:05:04.500Z', '2026-06-06T19:05:04.500Z', 'real save');
    const current = makeEntry('2026-06-06T19:05:03.500Z', null, 'current snapshot');
    const history = [historyEntry];
    const historySnapshot = [...history];

    FirebaseStorageAdapter.mergeCurrentIntoHistory(history, current);

    expect(history).toEqual(historySnapshot);
    expect(history.length).toBe(1);
  });

  it('does not duplicate when `current.updatedAt` is older than the newest history entry', () => {
    // Edge case: a stale `current` from before the latest history entry. The
    // history collection is the source of truth — don't prepend anything.
    const history = [
      makeEntry('2026-06-06T19:10:00.000Z', '2026-06-06T19:10:00.000Z', 'newer'),
      makeEntry('2026-06-06T19:00:00.000Z', '2026-06-06T19:00:00.000Z', 'older'),
    ];
    const current = makeEntry('2026-06-06T18:00:00.000Z', null, 'stale current');

    const merged = FirebaseStorageAdapter.mergeCurrentIntoHistory(history, current);

    expect(merged).toEqual(history);
  });
});
