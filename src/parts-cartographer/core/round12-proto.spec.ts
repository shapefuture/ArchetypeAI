import { afterEach, describe, expect, it } from 'vitest';
import { applyBackup, prepareBackup } from './backup';
import { weatherLayer } from '../../shared/core/data/state-v2';

// Round 12 critic scratch: a restored check-in with confirmedPart "__proto__" reaches weatherLayer.

afterEach(() => {
  delete (Object.prototype as any).count;
  delete (Object.prototype as any).meanArousal;
  localStorage.clear();
});

describe('R12-6 a restored check-in cannot write to Object.prototype', () => {
  it('a backup check-in with confirmedPart "__proto__" leaves every plain object clean', async () => {
    const text = JSON.stringify({
      schema: 'parts-cartographer.backup.v2',
      data: { INNERVERSE_CHECKINS_V1: [{ date: new Date().toISOString(), arousal: 0, confirmedPart: '__proto__' }] },
    });
    const prepared = await prepareBackup(text, 'en');
    expect(prepared.skipped).toEqual([]);
    applyBackup(prepared);
    const rows = JSON.parse(localStorage.getItem('INNERVERSE_CHECKINS_V1')!);
    // The check-in screen calls weatherLayer(history, now) on every render.
    weatherLayer(rows, new Date());
    expect(({} as any).count).toBeUndefined();
    expect(({} as any).meanArousal).toBeUndefined();
  });
});
