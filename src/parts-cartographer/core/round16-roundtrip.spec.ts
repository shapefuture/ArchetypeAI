import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { snapshot, fromDocument } from './cloud-storage';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';

beforeEach(() => localStorage.clear());

const descentInput = () => ({
  self: Array(8).fill(4),
  shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array(8).fill(4)])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, Array(6).fill(4)])),
  validity: { attention: 4, infrequency: [4, 4] },
});

/** Device A: a person who took the 147-item battery, with a journal, a check-in and a charter delivery. */
function seedDeviceA() {
  const score = scoreProfile(descentInput() as any);
  const { parts, profile } = adaptClinicalProfile(score, 'en');
  localStorage.setItem('ifs.lang', JSON.stringify('en'));
  localStorage.setItem('ifs.parts', JSON.stringify(parts));
  localStorage.setItem('ifs.profile', JSON.stringify(profile));
  localStorage.setItem('ifs.journal', JSON.stringify([{ id: 'j1', at: 1, kind: 'note', what: 'a thought', where: '', part: '', note: '' }]));
  localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify([{ date: '2026-10-20T10:00:00.000Z', arousal: 1, confirmedPart: 'numb', eventType: 'loss' }]));
  localStorage.setItem('INNERVERSE_CHARTER_V1', JSON.stringify([{ blame: 3, license: 4, at: '2026-10-20T10:00:00.000Z' }]));
  return { parts, profile };
}

describe('critic: 147-item export restores onto a fresh device with the same energy and archetype', () => {
  for (const mode of ['merge', 'replace'] as const) {
    it(`mode=${mode}`, async () => {
      const a = seedDeviceA();
      const text = JSON.stringify(exportBackup(localStorage));
      localStorage.clear();
      applyBackup(await prepareBackup(text, 'en', []), localStorage, mode);
      const restored = JSON.parse(localStorage.getItem('ifs.parts')!);
      expect(restored.map((p: any) => [p.id, p.energy])).toEqual(a.parts.map((p) => [p.id, p.energy]));
      expect(restored.map((p: any) => p.archetype?.coordinates)).toEqual(a.parts.map((p) => p.archetype?.coordinates));
      expect(JSON.parse(localStorage.getItem('ifs.journal')!)).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1')!)).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem('INNERVERSE_CHARTER_V1')!)).toHaveLength(1);
    });
  }
});

describe('critic: a merge keeps this device charter deliveries, as it keeps its check-ins', () => {
  it('device charter entries survive a merge with a file that carries a different charter', async () => {
    localStorage.setItem('INNERVERSE_CHARTER_V1', JSON.stringify([{ blame: 9, license: 1, at: '2026-10-21T10:00:00.000Z' }]));
    const file = JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', INNERVERSE_CHARTER_V1: [{ blame: 2, license: 2, at: '2026-10-01T10:00:00.000Z' }] } });
    applyBackup(await prepareBackup(file, 'en', []), localStorage, 'merge');
    const charter = JSON.parse(localStorage.getItem('INNERVERSE_CHARTER_V1')!);
    expect(charter).toHaveLength(2);
  });
});

describe('critic: a cloud snapshot restores the profile and parts the report draws', () => {
  it('a cloud copy leaves out somatic intensity (the consent text says therapists never see somatic zones)', () => {
    const { parts, profile } = seedDeviceA();
    const back = JSON.parse(JSON.stringify(snapshot(profile, parts, '2026-10-25T00:00:00.000Z')));
    expect(back.profile.parts[0].somatic).toBeUndefined();
  });

  it('a cloud copy of parts with archetype data comes back with the same archetype', async () => {
    const { parts, profile } = seedDeviceA();
    const snap = snapshot(profile, parts, '2026-10-25T00:00:00.000Z');
    const doc = await fromDocument('x', JSON.parse(JSON.stringify(snap)));
    expect(doc).not.toBeNull();
    expect(doc!.parts.map((p: any) => p.archetype?.coordinates)).toEqual(parts.map((p) => p.archetype?.coordinates));
  });
});
