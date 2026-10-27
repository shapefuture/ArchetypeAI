// Round 33 probe (critic). e18-device-envelope.ts says of renderCostFor: "render cost steps down and never rises above the
// declared base". The 'elevated' branch sets pixelRatio to Math.max(1, Math.min(base.pixelRatio, 1.5)). The outer max(1, ...)
// lifts any base below 1 up to 1, so a base of 0.75 is "elevated" to 1, a higher cost than the declared base. The 'critical'
// branch (Math.min(base.pixelRatio, 1)) does not have this problem. No production caller exists yet in this build.
import { describe, expect, it } from 'vitest';
import { renderCostFor } from './e18-device-envelope';

describe('round33: memory pressure never raises the render cost above the declared base', () => {
  it('control: an elevated-pressure base of 2 steps down to 1.5', () => {
    expect(renderCostFor({ pixelRatio: 2, textureScale: 1 }, 'elevated').cost.pixelRatio).toBe(1.5);
  });

  it('control: a critical-pressure base of 0.75 keeps 0.75 or less', () => {
    expect(renderCostFor({ pixelRatio: 0.75, textureScale: 1 }, 'critical').cost.pixelRatio).toBeLessThanOrEqual(0.75);
  });

  it('elevated pressure on a declared base of 0.75 does not raise pixelRatio above 0.75', () => {
    const { cost } = renderCostFor({ pixelRatio: 0.75, textureScale: 1 }, 'elevated');
    expect(cost.pixelRatio).toBeLessThanOrEqual(0.75);
  });
});
