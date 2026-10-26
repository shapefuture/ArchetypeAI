import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { validProfile, validClinicalScore } from './profile-contract';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { store } from './local-store';

beforeEach(() => localStorage.clear());

// Deterministic PRNG so a failing seed can be replayed.
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

describe('critic17: every profile the 147-item scoring can archive passes the backup validator', () => {
  it('validProfile holds for 300 random complete inputs', () => {
    const failures: Array<{ seed: number; reason: string }> = [];
    for (let seed = 1; seed <= 300; seed += 1) {
      const input = randomInput(rng(seed));
      const { profile } = adaptClinicalProfile(scoreProfile(input as any), 'en');
      if (!validProfile(profile)) failures.push({ seed, reason: `validProfile false; clinical valid=${validClinicalScore((profile as any).clinical)}` });
    }
    expect(failures).toEqual([]);
  });

  it('an archived 147-item result survives export and restore (ifs.history.hist is not skipped)', async () => {
    const input = randomInput(rng(7));
    const { profile } = adaptClinicalProfile(scoreProfile(input as any), 'en');
    store.save('ifs.profile', profile);
    store.archive('ifs.history', profile);
    const text = JSON.stringify(exportBackup(localStorage));
    localStorage.clear();
    const prepared = await prepareBackup(text, 'en', []);
    expect(prepared.skipped).toEqual([]);
    applyBackup(prepared, localStorage, 'replace');
    expect(store.history('ifs.history')).toHaveLength(1);
  });
});
