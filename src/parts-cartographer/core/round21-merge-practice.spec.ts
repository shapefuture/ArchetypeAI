import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup } from './backup';

// Round 21 probe: a merge-mode restore must not erase practice completed on this device.
// INNERVERSE_PRACTICE_V1 is one object ({ completed, ladder, lastSuggestedAt }); it is not in MERGED_LISTS
// or MERGED_OBJECTS, so applyBackup writes the file's copy over the device's copy wholesale.

const PRACTICE_KEY = 'INNERVERSE_PRACTICE_V1';

beforeEach(() => localStorage.clear());

describe('round21: merge restore keeps practice completed on this device', () => {
  it('a merge of a file with other completions keeps the device completions', async () => {
    // This device: the person completed breathing on it today.
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ completed: ['breathing-1'], ladder: {}, lastSuggestedAt: null }));
    // An older export from another moment: only six-F steps was completed then.
    const file = JSON.stringify({
      schema: 'parts-cartographer.backup.v2',
      data: { [PRACTICE_KEY]: { completed: ['six-f-steps'], ladder: {}, lastSuggestedAt: null } },
    });

    applyBackup(await prepareBackup(file, 'en'), localStorage, 'merge');

    const restored = JSON.parse(localStorage.getItem(PRACTICE_KEY) ?? '{}') as { completed: string[] };
    expect(restored.completed).toEqual(expect.arrayContaining(['breathing-1', 'six-f-steps']));
  });

  it('a merge keeps the furthest ladder rung of each practice on either side, and the later suggestion', async () => {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({
      completed: [], ladder: { 'paced-breath': { rehearsed: true }, 'soft-gaze': { principleNamed: true } }, lastSuggestedAt: '2026-10-20T10:00:00.000Z',
    }));
    const file = JSON.stringify({
      schema: 'parts-cartographer.backup.v2',
      data: { [PRACTICE_KEY]: { completed: [], ladder: { 'paced-breath': { principleNamed: true }, 'soft-gaze': { liveRep: true } }, lastSuggestedAt: '2026-10-10T10:00:00.000Z' } },
    });

    applyBackup(await prepareBackup(file, 'en'), localStorage, 'merge');

    const restored = JSON.parse(localStorage.getItem(PRACTICE_KEY) ?? '{}') as { ladder: unknown; lastSuggestedAt: string };
    expect(restored.ladder).toEqual({ 'paced-breath': { rehearsed: true }, 'soft-gaze': { liveRep: true } });
    expect(restored.lastSuggestedAt).toBe('2026-10-20T10:00:00.000Z');
  });

  it('control: a merge into an empty device restores the file completions', async () => {
    const file = JSON.stringify({
      schema: 'parts-cartographer.backup.v2',
      data: { [PRACTICE_KEY]: { completed: ['six-f-steps'], ladder: {}, lastSuggestedAt: null } },
    });

    applyBackup(await prepareBackup(file, 'en'), localStorage, 'merge');

    const restored = JSON.parse(localStorage.getItem(PRACTICE_KEY) ?? '{}') as { completed: string[] };
    expect(restored.completed).toEqual(['six-f-steps']);
  });
});
