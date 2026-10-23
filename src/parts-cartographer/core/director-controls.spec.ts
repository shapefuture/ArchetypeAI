import { describe, expect, it } from 'vitest';
import { applyControl, nextScreen, type DirectorState } from './director-controls.ts';

const scores = Object.freeze({ safety: 0.4, love: 0.7 });
const start: DirectorState<typeof scores> = { presentation: { camera: 'wide', pacing: 'normal', emphasis: null }, scores };

describe('Watch and Director controls', () => {
  it('changes only the imagined presentation, never the canonical scores', () => {
    const next = applyControl(start, { kind: 'camera', value: 'close' });
    expect(next.presentation.camera).toBe('close');
    expect(next.scores).toBe(scores);
  });

  it('applies pacing and emphasis without touching scores', () => {
    const next = applyControl(applyControl(start, { kind: 'pacing', value: 'slow' }), { kind: 'emphasis', value: 'safety' });
    expect(next.presentation).toEqual({ camera: 'wide', pacing: 'slow', emphasis: 'safety' });
    expect(next.scores).toBe(scores);
  });

  it('leads to the same screen for the same choice every time', () => {
    expect(nextScreen('watch', 'open-director')).toBe('director');
    expect(nextScreen('watch', 'open-director')).toBe('director');
    expect(nextScreen('director', 'back')).toBe('watch');
  });

  it('keeps the current screen for a choice that does not apply', () => {
    expect(nextScreen('universe', 'open-director')).toBe('universe');
  });
});
