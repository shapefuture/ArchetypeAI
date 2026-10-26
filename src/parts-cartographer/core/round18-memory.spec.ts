// Critic 18 scratch: a merge restore must not drop this device's own memories (INNERVERSE_MEMORY_V1).
import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { newUserMemory } from '../screens/memory-panel.jsx';

beforeEach(() => localStorage.clear());

const file = (data: Record<string, unknown>) => JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', ...data } });

describe('critic18-D: merge keeps this device\'s own memories', () => {
  it('D1: a memory written on this device survives a merge with a file that has another memory', async () => {
    const mine = newUserMemory('I felt calm by the lake this morning', 'm-device');
    const theirs = newUserMemory('Their own note from the other device', 'm-file');
    localStorage.setItem('INNERVERSE_MEMORY_V1', JSON.stringify({ memories: [mine], corrections: [] }));
    const prepared = await prepareBackup(file({ INNERVERSE_MEMORY_V1: { memories: [theirs], corrections: [] } }), 'en', []);
    applyBackup(prepared, localStorage, 'merge');
    const after = JSON.parse(localStorage.getItem('INNERVERSE_MEMORY_V1')!);
    expect(after.memories.map((m: any) => m.id).sort()).toEqual(['m-device', 'm-file']);
  });

  it('D2: an older file (exported before the memory was written here) does not erase it', async () => {
    const mine = newUserMemory('Written after the export was made', 'm-late');
    localStorage.setItem('INNERVERSE_MEMORY_V1', JSON.stringify({ memories: [mine], corrections: [] }));
    const prepared = await prepareBackup(file({ INNERVERSE_MEMORY_V1: { memories: [], corrections: [] } }), 'en', []);
    applyBackup(prepared, localStorage, 'merge');
    const after = JSON.parse(localStorage.getItem('INNERVERSE_MEMORY_V1')!);
    expect(after.memories.map((m: any) => m.id)).toContain('m-late');
  });

  it('D3: control: the journal, a list the round-13 merge keeps, survives the same merge', async () => {
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 'j-device', at: 1793000000000, kind: 'note', what: 'mine' }]));
    const prepared = await prepareBackup(file({ 'ifs.journal': [{ id: 'j-file', at: 1792000000000, kind: 'note', what: 'theirs' }] }), 'en', []);
    applyBackup(prepared, localStorage, 'merge');
    const after = JSON.parse(localStorage.getItem('ifs.journal')!);
    expect(after.map((e: any) => e.id).sort()).toEqual(['j-device', 'j-file']);
  });

  it('D5: a merge keeps this device\'s edit history for a part the file does not carry (INNERVERSE_PART_VERSIONS_V1)', async () => {
    const mineHistory = [{ at: '2026-10-20T10:00:00.000Z', name: 'Taskmaster (mine)' }];
    const theirHistory = [{ at: '2026-10-19T10:00:00.000Z', name: 'Their part' }];
    localStorage.setItem('INNERVERSE_PART_VERSIONS_V1', JSON.stringify({ 'p-device': mineHistory }));
    const prepared = await prepareBackup(file({ 'INNERVERSE_PART_VERSIONS_V1': { 'p-file': theirHistory } }), 'en', []);
    applyBackup(prepared, localStorage, 'merge');
    const after = JSON.parse(localStorage.getItem('INNERVERSE_PART_VERSIONS_V1')!);
    expect(Object.keys(after).sort()).toEqual(['p-device', 'p-file']);
  });

  it('D4: round trip of a device memory through export and a merge into an empty device keeps it', async () => {
    const mine = newUserMemory('Kept through export', 'm-export');
    localStorage.setItem('INNERVERSE_MEMORY_V1', JSON.stringify({ memories: [mine], corrections: [] }));
    const text = JSON.stringify(exportBackup(localStorage));
    localStorage.clear();
    applyBackup(await prepareBackup(text, 'en', []), localStorage, 'merge');
    const after = JSON.parse(localStorage.getItem('INNERVERSE_MEMORY_V1')!);
    expect(after.memories.map((m: any) => m.id)).toEqual(['m-export']);
  });
});
