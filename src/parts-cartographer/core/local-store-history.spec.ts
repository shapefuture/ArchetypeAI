import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from './local-store';
import { applyBackup, prepareBackup } from './backup';

beforeEach(() => localStorage.clear());

describe('local history', () => {
  it('builds on the history a restore wrote, not on an older in-memory copy', async () => {
    store.save('ifs.charter', { text: 'A-private-old' });
    const backup = { schema: 'parts-cartographer.backup.v2', data: { 'ifs.charter': { text: 'B' }, 'ifs.charter.hist': [JSON.stringify({ text: 'B' })] } };
    applyBackup(await prepareBackup(JSON.stringify(backup), 'en'), localStorage, 'replace');
    store.save('ifs.charter', { text: 'C' });
    expect(JSON.parse(localStorage.getItem('ifs.charter.hist')!)).toEqual([JSON.stringify({ text: 'B' }), JSON.stringify({ text: 'C' })]);
  });

  it('keeps the archive small, so a growing list cannot fill storage with copies of itself', () => {
    const rows: Array<{ date: string; arousal: number }> = [];
    for (let i = 0; i < 2000; i += 1) {
      rows.push({ date: new Date(2026, 0, 1, 0, i).toISOString(), arousal: i % 5 });
      store.save('INNERVERSE_CHECKINS_V1', rows);
    }
    const value = localStorage.getItem('INNERVERSE_CHECKINS_V1')!.length;
    const history = localStorage.getItem('INNERVERSE_CHECKINS_V1.hist')!.length;
    expect(JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1')!)).toHaveLength(2000);
    expect(history).toBeLessThan(Math.max(value * 2, 300 * 1024));
  });

  it('reports a save that did not fit instead of failing silently', () => {
    const seen = vi.fn();
    window.addEventListener('ifs:storage-full', seen);
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    store.save('ifs.journal', [{ what: 'x' }]);
    setItem.mockRestore();
    window.removeEventListener('ifs:storage-full', seen);
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
