import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup } from './backup';

beforeEach(() => localStorage.clear());

describe('critic r14: journal entries with object-valued text fields', () => {
  it('a backup journal entry whose note is an object is accepted, not skipped', async () => {
    const text = JSON.stringify({
      schema: 'parts-cartographer.backup.v2',
      data: { 'ifs.lang': 'en', 'ifs.journal': [{ id: 'a1', at: 1, kind: 'jThought', what: 'a thought', where: '', part: '', note: { nested: true } }] },
    });
    const prepared = await prepareBackup(text, 'en');
    expect(prepared.skipped).toEqual(['ifs.journal']);
  });

  it('a backup journal entry whose where is an array of objects is skipped as damaged', async () => {
    const text = JSON.stringify({
      schema: 'parts-cartographer.backup.v2',
      data: { 'ifs.lang': 'en', 'ifs.journal': [{ id: 'a2', at: 1, kind: 'jThought', what: 'x', where: [{ a: 1 }] }] },
    });
    const prepared = await prepareBackup(text, 'en');
    expect(prepared.skipped).toEqual(['ifs.journal']);
  });

  it('control: a plain-text journal entry is accepted', async () => {
    const text = JSON.stringify({
      schema: 'parts-cartographer.backup.v2',
      data: { 'ifs.lang': 'en', 'ifs.journal': [{ id: 'a3', at: 1, kind: 'jThought', what: 'x', where: 'chest', part: 'Taskmaster', note: 'n' }] },
    });
    const prepared = await prepareBackup(text, 'en');
    applyBackup(prepared);
    expect(JSON.parse(localStorage.getItem('ifs.journal')!)[0].note).toBe('n');
    expect(prepared.skipped).toEqual([]);
  });
});
