import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup } from './backup';

beforeEach(() => localStorage.clear());

const file = (data: Record<string, unknown>) => JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', ...data } });

// Lists a person keeps across time: each device entry should survive a merge with a file that carries other entries.
const LISTS: Array<[string, unknown, unknown]> = [
  ['INNERVERSE_CHARTER_V1', [{ blame: 9, license: 1, at: '2026-10-21T10:00:00.000Z' }], [{ blame: 2, license: 2, at: '2026-10-01T10:00:00.000Z' }]],
  ['ifs.charter', [{ date: '2026-10-21', text: 'device charter' }], [{ date: '2026-10-01', text: 'file charter' }]],
  ['INNERVERSE_SEALED_VERDICTS_V1', [{ text: 'device verdict', createdAt: '2026-10-21T10:00:00.000Z', resurfacesAt: '2026-11-21T10:00:00.000Z' }], [{ text: 'file verdict', createdAt: '2026-10-01T10:00:00.000Z', resurfacesAt: '2026-11-01T10:00:00.000Z' }]],
  ['ifs.sealed', [{ until: 1793000000000, text: 'device note' }], [{ until: 1792000000000, text: 'file note' }]],
  ['INNERVERSE_EVENTS_V1', [{ at: '2026-10-21T10:00:00.000Z', type: 'lapse' }], [{ at: '2026-10-01T10:00:00.000Z', type: 'repair' }]],
];

describe('critic: a merge keeps this device list entries that the file does not carry', () => {
  for (const [key, device, incoming] of LISTS) {
    it(`${key} keeps both the device entry and the file entry`, async () => {
      localStorage.setItem(key, JSON.stringify(device));
      applyBackup(await prepareBackup(file({ [key]: incoming }), 'en', []), localStorage, 'merge');
      const merged = JSON.parse(localStorage.getItem(key)!);
      expect(merged).toHaveLength(2);
    });
  }
});
