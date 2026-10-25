import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup } from './backup';
import { KEYS, store } from './local-store';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { SEED_PARTS } from '../pal/traits';

const input = () => ({ shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, [4, 3, 2, 5, 4, 3, 2, 1]])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, [3, 4, 5, 3, 4, 5]])), self: [3, 4, 5, 3, 4, 5, 3, 4], validity: { attention: 3, infrequency: [1, 2] as [number, number] } });

beforeEach(() => localStorage.clear());

describe('critic r14: example cast (seed- parts) after a merge restore', () => {
  it('a canonical backup merged onto a device holding an edited example part keeps no example part', async () => {
    const edited = { ...SEED_PARTS[0], star: true };
    store.save(KEYS.parts, [edited]);
    const canonical = await prepareBackup(JSON.stringify(input()), 'en');
    applyBackup(canonical, localStorage, 'merge');
    const ids = (JSON.parse(localStorage.getItem(KEYS.parts)!) as any[]).map((p) => p.id);
    expect(ids.filter((id) => id.startsWith('seed-'))).toEqual([]);
  });

  it('the same canonical backup in replace mode keeps no example part (control)', async () => {
    store.save(KEYS.parts, [{ ...SEED_PARTS[0], star: true }]);
    applyBackup(await prepareBackup(JSON.stringify(input()), 'en'), localStorage, 'replace');
    const ids = (JSON.parse(localStorage.getItem(KEYS.parts)!) as any[]).map((p) => p.id);
    expect(ids.filter((id) => id.startsWith('seed-'))).toEqual([]);
  });
});
