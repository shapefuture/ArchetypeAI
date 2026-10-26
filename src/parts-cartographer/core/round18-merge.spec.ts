import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { validProfile } from './profile-contract';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { store, KEYS } from './local-store';
import { snapshot, fromDocument } from './cloud-storage';
import { storeEvent } from '../../shared/core/data/state-v2';

beforeEach(() => localStorage.clear());

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const rating = (r: () => number) => 1 + Math.floor(r() * 5);
const randomInput = (r: () => number) => ({
  self: Array.from({ length: 8 }, () => rating(r)),
  shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array.from({ length: 8 }, () => rating(r))])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, Array.from({ length: 6 }, () => rating(r))])),
  validity: { attention: rating(r), infrequency: [rating(r), rating(r)] },
});
const profileFor = (seed: number, lang: 'en' | 'ru' = 'en') => adaptClinicalProfile(scoreProfile(randomInput(rng(seed)) as any), lang);
const file = (data: Record<string, unknown>) => JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', ...data } });

describe('critic18-A: archive lists on merge', () => {
  it('A1: a merge keeps reports archived on this device (ifs.history.hist)', async () => {
    const mine = profileFor(11).profile;
    const theirs = profileFor(12).profile;
    store.archive(KEYS.history, mine);
    const before = store.history(KEYS.history).length;
    const incoming = file({ 'ifs.history.hist': [JSON.stringify(theirs)] });
    applyBackup(await prepareBackup(incoming, 'en', []), localStorage, 'merge');
    const after = store.history(KEYS.history) as any[];
    expect(before).toBe(1);
    expect(after.map((p) => p.createdAt).sort()).toEqual([mine.createdAt, theirs.createdAt].sort());
  });
});

describe('critic18-A: fresh-to-fresh full round trip', () => {
  const seedDevice = async () => {
    const { profile, parts } = profileFor(21);
    store.save(KEYS.profile, profile);
    store.archive(KEYS.history, profile);
    store.save(KEYS.parts, [...parts, { ...parts[0], id: 'custom-1', name: 'Mine', family: 'exile' }]);
    store.save('ifs.journal', [{ id: 'j1', what: 'Entry one', kind: 'note', at: 1793000000000 }]);
    store.save('ifs.sealed', [{ until: 1793000000000, text: 'Future note' }]);
    localStorage.setItem('INNERVERSE_SEALED_VERDICTS_V1', JSON.stringify([{ text: 'verdict', createdAt: '2026-10-21T10:00:00.000Z', resurfacesAt: '2026-10-23T10:00:00.000Z' }]));
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify([{ date: '2026-10-20T10:00:00.000Z', arousal: 1, confirmedPart: 'numb', eventType: 'loss' }]));
    localStorage.setItem('ifs.charter', JSON.stringify([{ date: '2026-10-20', text: 'charter line' }]));
    localStorage.setItem('INNERVERSE_CHARTER_V1', JSON.stringify([{ blame: 5, license: 5, at: '2026-10-20T10:00:00.000Z' }]));
    storeEvent('lapse' as any, new Date('2026-10-21T10:00:00.000Z'));
    localStorage.setItem('INNERVERSE_FUTURE_SELF_V1', JSON.stringify(['a', 'b', 'c']));
  };
  const snap = () => exportBackup(localStorage).data as Record<string, unknown>;

  it('A2: replace-mode restore into an empty device reproduces every portable key', async () => {
    await seedDevice();
    const first = snap();
    const text = JSON.stringify(exportBackup(localStorage));
    localStorage.clear();
    applyBackup(await prepareBackup(text, 'en'), localStorage, 'replace');
    const second = snap();
    const diffs = Object.keys(first).filter((k) => JSON.stringify(first[k]) !== JSON.stringify(second[k]));
    expect(diffs).toEqual([]);
  });

  it('A3: merge-mode restore into an empty device reproduces every portable key', async () => {
    await seedDevice();
    const first = snap();
    const text = JSON.stringify(exportBackup(localStorage));
    localStorage.clear();
    applyBackup(await prepareBackup(text, 'en'), localStorage, 'merge');
    const second = snap();
    const diffs = Object.keys(first).filter((k) => JSON.stringify(first[k]) !== JSON.stringify(second[k]));
    expect(diffs).toEqual([]);
  });
});

describe('critic18-A: cloud snapshot round trip', () => {
  it('A4: every profile from the 147-item scoring survives snapshot -> Firestore JSON -> fromDocument', async () => {
    const failures: string[] = [];
    for (let seed = 1; seed <= 120; seed += 1) {
      const { profile, parts } = profileFor(seed);
      const snap = snapshot(profile, parts, '2026-10-21T10:00:00.000Z');
      const wire = JSON.parse(JSON.stringify(snap));
      const restored = await fromDocument('x', wire);
      if (!restored) failures.push(`seed ${seed}: fromDocument null, validProfile(profile)=${validProfile(profile)}`);
    }
    expect(failures).toEqual([]);
  });
});
