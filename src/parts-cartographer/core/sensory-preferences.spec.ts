import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SENSORY_PREFERENCES,
  loadSensoryPreferences,
  normalizeSensoryPreferences,
  saveSensoryPreferences,
  selectSensoryPreset,
  SENSORY_PREFERENCES_KEY,
  updateSensoryPreference,
} from './sensory-preferences';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
}

describe('sensory preferences', () => {
  it('starts gentle with sound off and supports independent overrides', () => {
    expect(DEFAULT_SENSORY_PREFERENCES).toMatchObject({ motion: 'gentle', sound: false, density: 'open' });
    const lively = selectSensoryPreset('lively');
    const custom = updateSensoryPreference(lively, 'sound', true);

    expect(custom).toMatchObject({ preset: 'custom', motion: 'lively', sound: true, texture: true, density: 'compact' });
  });

  it('persists settings locally and safely falls back from malformed values', () => {
    const storage = memoryStorage();
    const compact = updateSensoryPreference(selectSensoryPreset('still'), 'density', 'compact');
    saveSensoryPreferences(compact, storage);

    expect(storage.getItem(SENSORY_PREFERENCES_KEY)).not.toBeNull();
    expect(loadSensoryPreferences(storage)).toEqual(compact);
    expect(normalizeSensoryPreferences({ motion: 'fast', sound: 'yes', density: 'tiny' })).toMatchObject({
      motion: 'gentle', sound: false, density: 'open',
    });
  });
});
