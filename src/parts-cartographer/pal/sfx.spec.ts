import { afterEach, describe, expect, it, vi } from 'vitest';
import { setSfxEnabled, sfx } from './sfx';

afterEach(() => {
  setSfxEnabled(false);
  vi.unstubAllGlobals();
});

describe('sound preference', () => {
  it('keeps effects silent until explicitly enabled', () => {
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    const oscillator = {
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(() => gain), start: vi.fn(), stop: vi.fn(),
    };
    // sfx calls `new AudioContext()`, so the stub must be constructible; vitest 4 rejects arrow implementations.
    const audio = vi.fn(function AudioContextStub() {
      return {
        state: 'running', currentTime: 0, destination: {},
        createOscillator: () => oscillator, createGain: () => gain,
      };
    });
    vi.stubGlobal('AudioContext', audio);

    sfx.click();
    expect(audio).not.toHaveBeenCalled();

    setSfxEnabled(true);
    sfx.click();
    expect(audio).toHaveBeenCalledOnce();
    expect(oscillator.start).toHaveBeenCalledOnce();
  });
});
