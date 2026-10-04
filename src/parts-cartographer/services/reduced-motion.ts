import type { MotionMode } from '../core/sensory-preferences';

type MotionPreference = Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'>;

export function bindReducedMotionDamping(
  controls: { enableDamping: boolean; dampingFactor?: number },
  preference?: MotionPreference,
  initialMode: MotionMode = 'lively',
): { setMode(mode: MotionMode): void; dispose(): void } {
  let mode = initialMode;
  const syncPreference = () => {
    controls.enableDamping = mode !== 'still' && !preference?.matches;
    if (mode !== 'still') controls.dampingFactor = mode === 'gentle' ? 0.08 : 0.05;
  };

  syncPreference();
  preference?.addEventListener('change', syncPreference);

  return {
    setMode(nextMode) { mode = nextMode; syncPreference(); },
    dispose() { preference?.removeEventListener('change', syncPreference); },
  };
}
