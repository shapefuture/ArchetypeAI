export type MotionMode = 'still' | 'gentle' | 'lively';
export type SensoryPreset = MotionMode | 'custom';
export type SensoryPreferences = {
  preset: SensoryPreset;
  motion: MotionMode;
  sound: boolean;
  texture: boolean;
  density: 'open' | 'compact';
};

export const SENSORY_PREFERENCES_KEY = 'ifs.sensory.v1';
export const DEFAULT_SENSORY_PREFERENCES: SensoryPreferences = {
  preset: 'gentle', motion: 'gentle', sound: false, texture: true, density: 'open',
};

const PRESETS: Record<MotionMode, SensoryPreferences> = {
  still: { preset: 'still', motion: 'still', sound: false, texture: false, density: 'open' },
  gentle: { preset: 'gentle', motion: 'gentle', sound: false, texture: true, density: 'open' },
  lively: { preset: 'lively', motion: 'lively', sound: false, texture: true, density: 'compact' },
};

export function selectSensoryPreset(preset: MotionMode): SensoryPreferences {
  return { ...PRESETS[preset] };
}

export function updateSensoryPreference<K extends keyof Pick<SensoryPreferences, 'motion' | 'sound' | 'texture' | 'density'>>(
  current: SensoryPreferences,
  key: K,
  value: SensoryPreferences[K],
): SensoryPreferences {
  return { ...current, [key]: value, preset: 'custom' };
}

export function normalizeSensoryPreferences(value: unknown): SensoryPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_SENSORY_PREFERENCES };
  const candidate = value as Partial<SensoryPreferences>;
  return {
    preset: candidate.preset === 'still' || candidate.preset === 'gentle' || candidate.preset === 'lively' || candidate.preset === 'custom'
      ? candidate.preset : DEFAULT_SENSORY_PREFERENCES.preset,
    motion: candidate.motion === 'still' || candidate.motion === 'gentle' || candidate.motion === 'lively'
      ? candidate.motion : DEFAULT_SENSORY_PREFERENCES.motion,
    sound: typeof candidate.sound === 'boolean' ? candidate.sound : DEFAULT_SENSORY_PREFERENCES.sound,
    texture: typeof candidate.texture === 'boolean' ? candidate.texture : DEFAULT_SENSORY_PREFERENCES.texture,
    density: candidate.density === 'open' || candidate.density === 'compact' ? candidate.density : DEFAULT_SENSORY_PREFERENCES.density,
  };
}

function localStoragePort(): Pick<Storage, 'getItem' | 'setItem'> | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export function loadSensoryPreferences(storage = localStoragePort()): SensoryPreferences {
  try {
    const raw = storage?.getItem(SENSORY_PREFERENCES_KEY);
    return raw ? normalizeSensoryPreferences(JSON.parse(raw)) : { ...DEFAULT_SENSORY_PREFERENCES };
  } catch { return { ...DEFAULT_SENSORY_PREFERENCES }; }
}

export function saveSensoryPreferences(preferences: SensoryPreferences, storage = localStoragePort()): void {
  try { storage?.setItem(SENSORY_PREFERENCES_KEY, JSON.stringify(normalizeSensoryPreferences(preferences))); } catch { /* unavailable or full storage */ }
}
