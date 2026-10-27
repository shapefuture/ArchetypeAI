// Round 22 probe (critic): a merge-mode restore of practice replaces a ladder entry wholesale when the file's rung is higher
// (backup.ts furthestLadders: `out[id] = rung(device) > rung(file) ? device[id] : file[id]`).
// The device's own if-then plan text, which the file does not carry, is dropped. The module's own merge rule for
// other lists is that a merge keeps this device's copies the file does not carry.
import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup } from './backup';

const PRACTICE_KEY = 'INNERVERSE_PRACTICE_V1';
const PLAN = 'When my chest tightens, I breathe out slowly';

beforeEach(() => localStorage.clear());

async function merge(file: unknown) {
  const text = JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { [PRACTICE_KEY]: file } });
  applyBackup(await prepareBackup(text, 'en'), localStorage, 'merge');
  return JSON.parse(localStorage.getItem(PRACTICE_KEY) ?? '{}') as { ladder: Record<string, Record<string, unknown>> };
}

describe('round22: a merge keeps practice text the file does not carry', () => {
  it('control: a file rung-4 entry that carries its own plan replaces the device entry', async () => {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ completed: [], ladder: { 'paced-breath': { principleNamed: true, ifThen: PLAN } }, lastSuggestedAt: null }));
    const restored = await merge({ completed: [], ladder: { 'paced-breath': { liveRep: true, ifThen: 'File plan text' } }, lastSuggestedAt: null });
    expect(restored.ladder['paced-breath']).toEqual({ liveRep: true, ifThen: 'File plan text' });
  });

  it('the device if-then plan survives a merge whose file entry is at a higher rung without a plan', async () => {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ completed: [], ladder: { 'paced-breath': { principleNamed: true, ifThen: PLAN } }, lastSuggestedAt: null }));
    const restored = await merge({ completed: [], ladder: { 'paced-breath': { liveRep: true } }, lastSuggestedAt: null });
    expect(restored.ladder['paced-breath']?.liveRep).toBe(true);
    expect(restored.ladder['paced-breath']?.ifThen).toBe(PLAN);
  });
});
