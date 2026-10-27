import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup, validMapParts } from './backup';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { charterTrend } from '../../shared/core/data/state-v2';
import { SEED_PARTS } from '../pal/traits';
import { STRINGS } from '../i18n/strings';

beforeEach(() => localStorage.clear());

const backupText = (data: Record<string, unknown>) => JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', ...data } });

describe('round 15: a merge keeps this device check-ins when the file carries a non-list value', () => {
  const device = [
    { date: '2026-10-20T10:00:00.000Z', arousal: 1, confirmedPart: 'numb', eventType: 'loss' },
    { date: '2026-10-21T10:00:00.000Z', arousal: 0 },
  ];
  for (const [label, value] of [['object', { x: 1 }], ['string', 'oops'], ['number', 7]] as const) {
    it(`a file with INNERVERSE_CHECKINS_V1 as ${label} is refused for that key, and the device check-ins stay`, async () => {
      localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify(device));
      const prepared = await prepareBackup(backupText({ INNERVERSE_CHECKINS_V1: value }), 'en');
      expect(prepared.skipped).toEqual(['INNERVERSE_CHECKINS_V1']);
      applyBackup(prepared, localStorage, 'merge');
      expect(JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1') ?? 'null')).toEqual(device);
    });
  }
});

describe('round 15: part fields the screens cannot draw are refused', () => {
  it('control: a canonical seed part passes', () => {
    expect(validMapParts([SEED_PARTS[0]])).toBe(true);
  });
  it('a part whose nameEn is an object is refused', () => {
    expect(validMapParts([{ ...SEED_PARTS[0], nameEn: { nested: true } }])).toBe(false);
  });
  it('a part whose archetype.cluster is a number is refused', () => {
    const part = { ...SEED_PARTS[0], archetype: { schema: 'archetype-map.v1', sourceAssessment: 'legacy64', coordinateBasis: 'response-derived-64', coordinates: [0.1, 0.2, 0.3, 0.4], cluster: 5 } };
    expect(validMapParts([part])).toBe(false);
  });
});

describe('round 15: journal entries and charter records the screens cannot read are refused', () => {
  it('a journal entry whose kind is an object is skipped as damaged', async () => {
    const prepared = await prepareBackup(backupText({ 'ifs.journal': [{ id: 'k1', at: 1, kind: { nested: true }, what: 'a thought', where: '', part: '', note: '' }] }), 'en');
    expect(prepared.skipped).toEqual(['ifs.journal']);
  });
  it('a charter with null entries is skipped, and the trend reads it without crashing', async () => {
    const prepared = await prepareBackup(backupText({ INNERVERSE_CHARTER_V1: [null, null, null] }), 'en');
    expect(prepared.skipped).toEqual(['INNERVERSE_CHARTER_V1']);
    expect(charterTrend([null, null, null] as any)).toBe('ok');
  });
});

describe('round 15: energy has one scale for stored parts', () => {
  const input = () => ({
    self: Array(8).fill(4),
    shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array(8).fill(4)])),
    resources: Object.fromEntries(RESOURCES.map((id) => [id, Array(6).fill(4)])),
    validity: { attention: 4, infrequency: [4, 4] },
  });
  it('stored parts carry whole-number energy on 0..100', () => {
    const { parts } = adaptClinicalProfile(scoreProfile(input() as any), 'en');
    for (const part of parts) {
      expect(Number.isInteger(part.energy)).toBe(true);
      expect(part.energy).toBeGreaterThanOrEqual(0);
      expect(part.energy).toBeLessThanOrEqual(100);
    }
  });
  it('the profile keeps 0..1 energy for the assessment screen', () => {
    const { profile } = adaptClinicalProfile(scoreProfile(input() as any), 'en');
    for (const part of profile.parts) {
      expect(part.energy).toBeGreaterThanOrEqual(0);
      expect(part.energy).toBeLessThanOrEqual(1);
    }
  });
});

describe('round 15: Russian count in the telemetry line', () => {
  it('reads as a label with the number, not a noun with a plural that disagrees with it', () => {
    expect(STRINGS.telemSubK.ru).toMatch(/^Записей: \{n\}/);
  });
});
