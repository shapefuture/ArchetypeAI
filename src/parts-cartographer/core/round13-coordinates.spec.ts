import { describe, expect, it } from 'vitest';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { snapshot, fromDocument } from './cloud-storage';
import { applyBackup, exportBackup, prepareBackup } from './backup';
import { coordinateStatusFor, coordinatesForPart } from '../screens/coordinates.jsx';
import { KEYS } from './local-store';

const input = () => ({
  shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, [4, 3, 2, 5, 4, 3, 2, 1]])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, [3, 4, 5, 3, 4, 5]])),
  self: [3, 4, 5, 3, 4, 5, 3, 4],
  validity: { attention: 3, infrequency: [1, 2] as [number, number] },
});

describe('critic r13: reference coordinates survive a cloud restore', () => {
  it('a 147-reference part keeps its coordinate status after a cloud save and restore', async () => {
    const adapted = adaptClinicalProfile(scoreProfile(input() as any), 'en');
    const original = adapted.parts[0];
    expect(coordinateStatusFor(original.archetype)).toBe('reference');

    const data = JSON.parse(JSON.stringify(snapshot(adapted.profile, adapted.parts, '2026-10-03T00:00:00Z')));
    const restored = (await fromDocument('saved', data))!;
    const back = restored.parts.find((p: any) => p.id === original.id) as any;
    console.log('ARCHETYPE_AFTER_CLOUD', JSON.stringify(back.archetype).slice(0, 300));
    console.log('COORDS_AFTER_CLOUD', JSON.stringify(coordinatesForPart(back)).slice(0, 300));
    expect(back.archetype.coordinateBasis).toBe('fixed-reference-147');
    expect(coordinateStatusFor(back.archetype)).toBe('reference');
  });

  it('control: the same part keeps its basis through a JSON backup export and restore', async () => {
    const adapted = adaptClinicalProfile(scoreProfile(input() as any), 'en');
    const prepared = await prepareBackup(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.parts': adapted.parts, 'ifs.lang': 'en' } }), 'en');
    applyBackup(prepared);
    const back = JSON.parse(localStorage.getItem(KEYS.parts)!)[0];
    expect(coordinateStatusFor(back.archetype)).toBe('reference');
  });
});
