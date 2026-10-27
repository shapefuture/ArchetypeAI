// Round 24 probe (critic): validMapParts (backup.ts, also used by the cloud copy in cloud-storage.ts) checks an archetype's
// coordinates and cluster type, but not its size or prominence. The Universe scene scales each node by
// `(archetype.size ?? 0.8) / 0.8 * (0.6 + (archetype.prominence ?? 40) / 100)` (universe-scene.ts:222), so a backup part with a
// non-numeric size or prominence is accepted and yields a NaN node scale.
import { describe, expect, it } from 'vitest';
import { prepareBackup } from './backup';

const TRAITS = { shape: 'cloud', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', color: '#00ffab', characterSeed: 7 };

function customPart(archetype: Record<string, unknown>) {
  return {
    id: 'custom_part_1',
    name: 'Custom',
    nameEn: 'Custom',
    family: 'exile',
    traits: TRAITS,
    role: 'Role',
    blurb: '',
    energy: 40,
    burden: 'T 40',
    need: '',
    voice: '',
    star: false,
    since: 'today',
    archetype: {
      schema: 'archetype-map.v1',
      sourceAssessment: 'studio',
      coordinates: [0, 0, 0, 0],
      cluster: 'exiles',
      prominence: 55,
      size: 0.6,
      description: '',
      invitation: '',
      shadow: '',
      ...archetype,
    },
  };
}

/** The parts a backup restores from one custom part. A backup whose only data is refused restores nothing (it throws). */
async function restoredParts(part: unknown): Promise<any[]> {
  try {
    const backup = await prepareBackup(backupText(part), 'en');
    return (backup.entries['ifs.parts'] as any[] | undefined) ?? [];
  } catch {
    return [];
  }
}

function backupText(part: unknown): string {
  return JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.parts': [part] } });
}

/** 'refused' when the part is not restored, otherwise the JS type of the value the restore kept. */
function keptAs(parts: any[], field: 'size' | 'prominence'): string {
  const part = parts.find((item) => item.id === 'custom_part_1');
  return part === undefined ? 'refused' : typeof part.archetype?.[field];
}

describe('round24: a backup part\'s archetype size and prominence are numbers before the scene scales by them', () => {
  it('control: a part with numeric size and prominence is restored unchanged', async () => {
    const backup = await prepareBackup(backupText(customPart({})), 'en');
    const part = (backup.entries['ifs.parts'] as any[]).find((item) => item.id === 'custom_part_1');
    expect(part?.archetype?.size).toBe(0.6);
    expect(part?.archetype?.prominence).toBe(55);
  });

  it('a part whose archetype size is a word is refused, not kept with that word as its size', async () => {
    const parts = await restoredParts(customPart({ size: 'huge' }));
    expect(['refused', 'number'], 'type of the restored custom part archetype.size').toContain(keptAs(parts, 'size'));
  });

  it('a part whose archetype prominence is a word is refused, not kept with that word as its prominence', async () => {
    const parts = await restoredParts(customPart({ prominence: 'x' }));
    expect(['refused', 'number'], 'type of the restored custom part archetype.prominence').toContain(keptAs(parts, 'prominence'));
  });
});
