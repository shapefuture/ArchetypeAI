import { describe, expect, it } from 'vitest';
import { validateReplay, MAX_BEATS, type ReplayScene } from './replay-authoring.ts';

const scene: ReplayScene = { id: 's1', title: 'Morning kitchen', optIn: true, castNames: ['Sam'], beats: ['Coffee', 'A short hello'] };

describe('bounded Replay authoring', () => {
  it('accepts a bounded, opted-in scene with the person\'s own names', () => {
    expect(validateReplay(scene)).toEqual({ ok: true });
  });

  it('requires opt-in', () => {
    expect(validateReplay({ ...scene, optIn: false })).toEqual({ ok: false, reason: 'not-opted-in' });
  });

  it('requires a non-empty cast of names the person supplied', () => {
    expect(validateReplay({ ...scene, castNames: [] })).toEqual({ ok: false, reason: 'no-cast' });
    expect(validateReplay({ ...scene, castNames: ['  '] })).toEqual({ ok: false, reason: 'no-cast' });
  });

  it('bounds the number of beats', () => {
    expect(validateReplay({ ...scene, beats: Array.from({ length: MAX_BEATS + 1 }, (_, i) => `beat ${i}`) }))
      .toEqual({ ok: false, reason: 'too-many-beats' });
    expect(validateReplay({ ...scene, beats: [] })).toEqual({ ok: false, reason: 'no-beats' });
  });

  it('refuses reconstruction or prediction claims in any text', () => {
    expect(validateReplay({ ...scene, beats: ['This is exactly what happened'] })).toEqual({ ok: false, reason: 'claims-reconstruction' });
    expect(validateReplay({ ...scene, title: 'The conflict will happen again' })).toEqual({ ok: false, reason: 'claims-reconstruction' });
  });
});
