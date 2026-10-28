// Round 32 probe (critic). telemetry.record(itemId, value) counts distributions per value, with the value stored as String(value).
// Reproduced on b5483c5: the assessment screens passed an object as the value (screens/assessment.jsx: telemetry.record('assessment_item',
// { partId, ...answers }); screens/assessment.jsx and screens/full-assessment.jsx: telemetry.record('result', {...})). Every such count
// landed under the single key "[object Object]", which the Statistics screen (screens/landing.jsx, telemetry.dump()) showed.
// Fixed: the store refuses object values, and the screens record bucket labels (the felt bucket per part; crisis and validity flags).
// Expected (probe assertions): a scalar is counted under its own key, and an object is not counted under any key.
import { beforeEach, describe, expect, it } from 'vitest';
import { telemetry } from './telemetry';

describe('round32: telemetry keys each record by its value', () => {
  beforeEach(() => { telemetry.clear(); });

  it('control: a scalar value is counted under its own key', () => {
    telemetry.record('state', 'home');
    expect(Object.keys(telemetry.dump().state ?? {})).toEqual(['home']);
  });

  it('an object value is not counted under "[object Object]" or any other key', () => {
    // Same shape the assessment screens passed before the fix (JS call sites, so no compile-time check there).
    telemetry.record('assessment_item', { partId: 'taskmaster', intensity: 4, felt: 'high' } as unknown as string);
    telemetry.record('assessment_item', { partId: 'pleaser', intensity: 2, felt: 'low' } as unknown as string);
    expect(telemetry.dump().assessment_item, 'an object is not a bucket label, so nothing is counted').toBeUndefined();
  });
});
