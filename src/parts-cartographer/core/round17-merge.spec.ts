import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup } from './backup';
import { storeEvent } from '../../shared/core/data/state-v2';

beforeEach(() => localStorage.clear());

const file = (data: Record<string, unknown>) => JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', ...data } });

describe('critic17: a record present on both sides is kept once, whatever the key order', () => {
  it('ifs.sealed: same note, keys in a different order -> one note', async () => {
    localStorage.setItem('ifs.sealed', JSON.stringify([{ text: 'same note', until: 1793000000000 }]));
    applyBackup(await prepareBackup(file({ 'ifs.sealed': [{ until: 1793000000000, text: 'same note' }] }), 'en', []), localStorage, 'merge');
    expect(JSON.parse(localStorage.getItem('ifs.sealed')!)).toHaveLength(1);
  });

  it('INNERVERSE_EVENTS_V1: the event logged on this device and the same event in the file -> one event', async () => {
    storeEvent('lapse' as any, new Date('2026-10-21T10:00:00.000Z'));
    const device = JSON.parse(localStorage.getItem('INNERVERSE_EVENTS_V1')!);
    const reordered = device.map((e: any) => ({ at: e.at, kind: e.kind }));
    applyBackup(await prepareBackup(file({ INNERVERSE_EVENTS_V1: reordered }), 'en', []), localStorage, 'merge');
    expect(JSON.parse(localStorage.getItem('INNERVERSE_EVENTS_V1')!)).toHaveLength(1);
  });

  it('control: identical key order -> one note (round-16 behaviour)', async () => {
    localStorage.setItem('ifs.sealed', JSON.stringify([{ text: 'same note', until: 1793000000000 }]));
    applyBackup(await prepareBackup(file({ 'ifs.sealed': [{ text: 'same note', until: 1793000000000 }] }), 'en', []), localStorage, 'merge');
    expect(JSON.parse(localStorage.getItem('ifs.sealed')!)).toHaveLength(1);
  });
});

describe('critic17: a merge does not revert what this device did to a record it already holds', () => {
  it('a verdict re-rated on this device keeps its re-rating when an older copy of it is merged in', async () => {
    const verdict = { text: 'held', createdAt: '2026-10-21T10:00:00.000Z', resurfacesAt: '2026-10-23T10:00:00.000Z' };
    localStorage.setItem('INNERVERSE_SEALED_VERDICTS_V1', JSON.stringify([{ ...verdict, reRating: 'still true' }]));
    applyBackup(await prepareBackup(file({ INNERVERSE_SEALED_VERDICTS_V1: [verdict] }), 'en', []), localStorage, 'merge');
    const merged = JSON.parse(localStorage.getItem('INNERVERSE_SEALED_VERDICTS_V1')!);
    expect(merged).toHaveLength(1);
    expect(merged[0].reRating).toBe('still true');
  });
});
