import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { KEYS, store } from './local-store';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';

const input = () => ({ shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, [4, 3, 2, 5, 4, 3, 2, 1]])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, [3, 4, 5, 3, 4, 5]])), self: [3, 4, 5, 3, 4, 5, 3, 4], validity: { attention: 3, infrequency: [1, 2] as [number, number] } });

beforeEach(() => localStorage.clear());

describe('critic r14: merge conflicts and ordering', () => {
  // Open policy (owner decision): when the file and this device both hold the same part, which edit wins.
  it.todo('a merge keeps this device edit to a part the file also carries (policy open)');

  it('restoring the same file twice in merge mode does not duplicate journal, check-ins or parts', async () => {
    applyBackup(await prepareBackup(JSON.stringify(input()), 'en'));
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 5, at: 5, kind: 'jTrigger', what: 'once', where: '', part: '', note: '' }]));
    store.save('INNERVERSE_CHECKINS_V1', [{ date: '2026-10-20T10:00:00.000Z', arousal: 1, confirmedPart: 'numb' }]);
    const file = JSON.stringify(exportBackup());
    applyBackup(await prepareBackup(file, 'en'), localStorage, 'merge');
    applyBackup(await prepareBackup(file, 'en', JSON.parse(localStorage.getItem(KEYS.parts)!)), localStorage, 'merge');
    expect(JSON.parse(localStorage.getItem('ifs.journal')!)).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1')!)).toHaveLength(1);
    const ids = JSON.parse(localStorage.getItem(KEYS.parts)!).map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('journal entries after a merge stay newest first (the journal lists the array in order)', async () => {
    // Device A: an older journal entry in the file.
    applyBackup(await prepareBackup(JSON.stringify(input()), 'en'));
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 100, at: 100, kind: 'jTrigger', what: 'A older', where: '', part: '', note: '' }]));
    const exportedA = JSON.stringify(exportBackup());
    // Device B: two newer entries, newest first as the journal saves them.
    localStorage.clear();
    localStorage.setItem('ifs.journal', JSON.stringify([
      { id: 300, at: 300, kind: 'jTrigger', what: 'B newest', where: '', part: '', note: '' },
      { id: 200, at: 200, kind: 'jTrigger', what: 'B middle', where: '', part: '', note: '' },
    ]));
    applyBackup(await prepareBackup(exportedA, 'en'), localStorage, 'merge');
    const journal = JSON.parse(localStorage.getItem('ifs.journal')!) as Array<{ at: number; what: string }>;
    const sorted = [...journal].sort((a, b) => b.at - a.at).map((e) => e.what);
    expect(journal.map((e) => e.what)).toEqual(sorted);
  });
});
