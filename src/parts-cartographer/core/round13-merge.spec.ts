import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { KEYS } from './local-store';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter';

const input = () => ({ shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, [4, 3, 2, 5, 4, 3, 2, 1]])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, [3, 4, 5, 3, 4, 5]])), self: [3, 4, 5, 3, 4, 5, 3, 4], validity: { attention: 3, infrequency: [1, 2] as [number, number] } });
beforeEach(() => localStorage.clear());

describe('critic r13: merge restore onto a device with its own data', () => {
  it('device A export restored in merge mode onto device B keeps B custom part and B journal', async () => {
    // Device A: canonical assessment, one custom part, an edit, one journal entry.
    const a = await prepareBackup(JSON.stringify(input()), 'en');
    applyBackup(a);
    const partsA = JSON.parse(localStorage.getItem(KEYS.parts)!) as any[];
    localStorage.setItem(KEYS.parts, JSON.stringify([...partsA, { ...partsA[0], id: 'custom-a', name: 'Custom A' }]));
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 1, at: 1, kind: 'jTrigger', what: 'A journal', where: '', part: '', note: '' }]));
    const exportedText = JSON.stringify(exportBackup());

    // Device B: its own canonical parts, its own custom part, its own journal entry.
    localStorage.clear();
    const b = await prepareBackup(JSON.stringify(input()), 'en');
    applyBackup(b);
    const partsB = JSON.parse(localStorage.getItem(KEYS.parts)!) as any[];
    const deviceBParts = [...partsB, { ...partsB[0], id: 'custom-b', name: 'Custom B' }];
    localStorage.setItem(KEYS.parts, JSON.stringify(deviceBParts));
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 2, at: 2, kind: 'jTrigger', what: 'B journal', where: '', part: '', note: '' }]));

    // The restore screen passes the device's current parts as existingParts.
    const prepared = await prepareBackup(exportedText, 'en', deviceBParts as any);
    applyBackup(prepared, localStorage, 'merge');

    const restoredParts = JSON.parse(localStorage.getItem(KEYS.parts)!) as any[];
    const restoredJournal = JSON.parse(localStorage.getItem('ifs.journal')!) as any[];
    // Expected for a merge: both custom parts survive and both journal entries survive.
    expect(restoredParts.map((p) => p.id)).toContain('custom-b');
    expect(restoredParts.map((p) => p.id)).toContain('custom-a');
    expect(restoredJournal.map((j) => j.what)).toEqual(expect.arrayContaining(['A journal', 'B journal']));
  });

  it('merge restore keeps the device journal entries it does not carry', async () => {
    const a = await prepareBackup(JSON.stringify(input()), 'en');
    applyBackup(a);
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 1, at: 1, kind: 'jTrigger', what: 'A journal', where: '', part: '', note: '' }]));
    const exportedText = JSON.stringify(exportBackup());
    localStorage.clear();
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 2, at: 2, kind: 'jTrigger', what: 'B journal', where: '', part: '', note: '' }]));
    applyBackup(await prepareBackup(exportedText, 'en'), localStorage, 'merge');
    const restoredJournal = JSON.parse(localStorage.getItem('ifs.journal')!) as any[];
    expect(restoredJournal.map((j) => j.what)).toEqual(expect.arrayContaining(['A journal', 'B journal']));
  });

  it('control: the same merge with the backup holding no parts keeps device custom parts', async () => {
    const b = await prepareBackup(JSON.stringify(input()), 'en');
    applyBackup(b);
    const partsB = JSON.parse(localStorage.getItem(KEYS.parts)!) as any[];
    const deviceBParts = [...partsB, { ...partsB[0], id: 'custom-b', name: 'Custom B' }];
    const prepared = await prepareBackup(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en' } }), 'en', deviceBParts as any);
    expect(prepared.entries[KEYS.parts]).toBeUndefined();
  });
});
