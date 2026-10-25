import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, exportBackup, isPortableKey, prepareBackup } from './backup';
import { KEYS, store } from './local-store';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';

const input = () => ({ shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, [4, 3, 2, 5, 4, 3, 2, 1]])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, [3, 4, 5, 3, 4, 5]])), self: [3, 4, 5, 3, 4, 5, 3, 4], validity: { attention: 3, infrequency: [1, 2] as [number, number] } });

const snap = (): Record<string, string> => {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i += 1) { const k = localStorage.key(i)!; out[k] = localStorage.getItem(k)!; }
  return out;
};
// Key-order-independent canonical form, so only real value changes count.
const canon = (v: unknown): string => JSON.stringify(v, (_k, val) => (val && typeof val === 'object' && !Array.isArray(val)
  ? Object.fromEntries(Object.keys(val).sort().map((k) => [k, val[k]])) : val));

describe('critic r14: full export round trip onto a fresh device', () => {
  beforeEach(() => localStorage.clear());

  it('every portable key the device carries survives export and import (merge and replace)', async () => {
    applyBackup(await prepareBackup(JSON.stringify(input()), 'en'));
    const parts = JSON.parse(localStorage.getItem(KEYS.parts)!) as any[];
    const edited = parts.map((p, i) => (i === 0 ? { ...p, name: 'Edited name', need: 'edited need', star: true } : p));
    store.save(KEYS.parts, [...edited, { ...parts[0], id: 'custom-a', name: 'Custom A' }]);
    localStorage.setItem('ifs.journal', JSON.stringify([{ id: 1, at: 1, kind: 'jTrigger', what: 'journal A', where: '', part: '', note: '' }]));
    store.save('INNERVERSE_CHECKINS_V1', [{ date: '2026-10-20T10:00:00.000Z', arousal: 1, confirmedPart: 'numb', eventType: 'loss' }]);
    store.save('INNERVERSE_SEALED_VERDICTS_V1', [{ text: 'sealed text', createdAt: '2026-10-01T00:00:00.000Z', resurfacesAt: '2026-10-20T00:00:00.000Z' }]);
    store.save('INNERVERSE_MEMORY_V1', [{ id: 'm1', text: 'Я люблю тишину', source: 'user-entry', derivedFrom: [], saved: true }]);
    store.save('INNERVERSE_GOAL_V1', { schema: 'goal.v1', id: 'g1', status: 'active', updatedAt: '2026-10-01T00:00:00.000Z', revision: 1, season: { goals: ['a'], endpoints: ['b'] }, statementHistory: [], hypotheses: [], rejected: [], tools: [{ id: 't1', title: 'x' }], outcomes: [{ cardId: 'c', recorded: true }] });
    store.save('INNERVERSE_CAPACITY_PREF_V1', 'low');
    store.save('INNERVERSE_FUTURE_SELF_V1', ['a', 'b', 'c']);
    store.save('INNERVERSE_PART_LOOKS_V1', { 'custom-a': { shape: 'heart' } });
    store.save('ifs.charter', { accepted: true, at: '2026-10-01' });
    localStorage.setItem('ifs.attested', '1');
    store.save('ifs.lang', 'en');
    const device = snap();
    const exported = JSON.stringify(exportBackup());
    const portableOnDevice = Object.keys(device).filter((k) => isPortableKey(k));
    const exportedData = (JSON.parse(exported) as any).data;
    const notInExport = portableOnDevice.filter((k) => !Object.prototype.hasOwnProperty.call(exportedData, k));
    const results: Record<string, unknown> = {};
    for (const mode of ['merge', 'replace'] as const) {
      localStorage.clear();
      applyBackup(await prepareBackup(exported, 'en'), localStorage, mode);
      const restored = snap();
      const diffs: string[] = [];
      for (const key of portableOnDevice) {
        if (restored[key] === undefined) { diffs.push(`MISSING ${key}`); continue; }
        if (canon(JSON.parse(restored[key])) !== canon(JSON.parse(device[key]))) {
          diffs.push(`CHANGED ${key}`);
          const a = JSON.parse(device[key]); const b = JSON.parse(restored[key]);
          if (Array.isArray(a) && Array.isArray(b)) {
            a.forEach((x: any) => { const y = b.find((z: any) => z.id === x.id); if (!y) diffs.push(` - missing item ${x.id}`); else for (const f of new Set([...Object.keys(x), ...Object.keys(y)])) if (canon(x[f]) !== canon(y[f])) diffs.push(` - ${x.id}.${f}: device=${canon(x[f]).slice(0, 400)} restored=${canon(y[f]).slice(0, 400)}`); });
          } else if (a && b && typeof a === 'object') {
            for (const f of new Set([...Object.keys(a), ...Object.keys(b)])) if (canon(a[f]) !== canon(b[f])) diffs.push(` - ${f}: device=${canon(a[f]).slice(0, 90)} restored=${canon(b[f]).slice(0, 90)}`);
          }
        }
      }
      results[mode] = { diffs, extraKeys: Object.keys(restored).filter((k) => !(k in device)) };
    }
    expect({ notInExport, results }).toEqual({ notInExport: [], results: { merge: { diffs: [], extraKeys: [] }, replace: { diffs: [], extraKeys: [] } } });
  });
});
