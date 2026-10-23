import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PORTABLE_KEYS } from './backup';
import {
  DEFAULT_SENSORY_PREFERENCES,
  loadSensoryPreferences,
  normalizeSensoryPreferences,
  saveSensoryPreferences,
  sceneClockStep,
  selectSensoryPreset,
  SENSORY_PREFERENCES_KEY,
  updateSensoryPreference,
} from './sensory-preferences';

type TestStorage = Pick<Storage, 'getItem' | 'setItem'>;

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
}

const refusingStorage: TestStorage = {
  getItem() { throw new DOMException('access denied', 'SecurityError'); },
  setItem() { throw new DOMException('quota exceeded', 'QuotaExceededError'); },
};

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

  it('falls back to defaults when storage is denied, full, or holds malformed JSON', () => {
    const denied = {
      getItem() { throw new DOMException('denied', 'SecurityError'); },
      setItem() { throw new DOMException('full', 'QuotaExceededError'); },
    };
    const malformed = memoryStorage();
    malformed.setItem(SENSORY_PREFERENCES_KEY, '{not json');

    expect(loadSensoryPreferences(denied)).toEqual(DEFAULT_SENSORY_PREFERENCES);
    expect(loadSensoryPreferences(malformed)).toEqual(DEFAULT_SENSORY_PREFERENCES);
    expect(() => saveSensoryPreferences(selectSensoryPreset('lively'), denied)).not.toThrow();
  });

  it('stops the ambient scene clock for Still and for system reduced motion', () => {
    expect(sceneClockStep('still', false)).toBe(0);
    expect(sceneClockStep('gentle', false)).toBe(0.002);
    expect(sceneClockStep('lively', false)).toBe(0.006);
    expect(sceneClockStep('gentle', true)).toBe(0);
    expect(sceneClockStep('lively', true)).toBe(0);
  });

  it('keeps the chosen style active for the session when storage refuses the save', () => {
    const lively = selectSensoryPreset('lively');

    expect(saveSensoryPreferences(lively, refusingStorage)).toBe(false);
    expect(saveSensoryPreferences(lively, null as unknown as TestStorage)).toBe(false);
    expect(loadSensoryPreferences(refusingStorage)).toEqual(DEFAULT_SENSORY_PREFERENCES);
    expect(loadSensoryPreferences(null as unknown as TestStorage)).toEqual(DEFAULT_SENSORY_PREFERENCES);
    expect(saveSensoryPreferences(lively, memoryStorage())).toBe(true);
  });

  it('falls back when browser storage access itself throws', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('blocked by browser settings', 'SecurityError'); },
    });
    try {
      expect(loadSensoryPreferences()).toEqual(DEFAULT_SENSORY_PREFERENCES);
      expect(saveSensoryPreferences(selectSensoryPreset('still'))).toBe(false);
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('keeps sound off in every starting style and when motion changes', () => {
    for (const preset of ['still', 'gentle', 'lively'] as const) {
      expect(selectSensoryPreset(preset).sound).toBe(false);
    }
    expect(updateSensoryPreference(selectSensoryPreset('lively'), 'motion', 'still').sound).toBe(false);
  });

  it('stores presentation choices under a device-local key that backups never carry', () => {
    const writes: string[] = [];
    const recording: TestStorage = { getItem: () => null, setItem: (key) => { writes.push(key); } };
    let current = DEFAULT_SENSORY_PREFERENCES;
    for (const preset of ['still', 'lively'] as const) {
      current = selectSensoryPreset(preset);
      saveSensoryPreferences(current, recording);
    }
    saveSensoryPreferences(updateSensoryPreference(current, 'sound', true), recording);

    expect(new Set(writes)).toEqual(new Set([SENSORY_PREFERENCES_KEY]));
    expect(PORTABLE_KEYS.has(SENSORY_PREFERENCES_KEY)).toBe(false);
  });

  it('presentation modes change motion, texture and spacing but never hide content', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf8');
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({ selector: match[1], body: match[2] }));
    const hides = /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0\b|(max-)?height\s*:\s*0\b/;
    const presentational = rules.filter((rule) => /data-(motion|density|ambience)/.test(rule.selector));
    const textured = rules.filter((rule) => /data-texture/.test(rule.selector));

    expect(presentational.length).toBeGreaterThan(0);
    expect(presentational.filter((rule) => hides.test(rule.body))).toEqual([]);
    // Felt texture is decorative: its only hiding rule targets the grain overlay.
    expect(textured.length).toBeGreaterThan(0);
    expect(textured.every((rule) => /\.grain::after/.test(rule.selector))).toBe(true);
  });
});
