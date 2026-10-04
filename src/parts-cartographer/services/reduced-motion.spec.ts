import { describe, expect, it } from 'vitest';
import { bindReducedMotionDamping } from './reduced-motion';

class MockMotionPreference extends EventTarget {
  constructor(public matches: boolean) { super(); }

  setReducedMotion(matches: boolean) {
    this.matches = matches;
    this.dispatchEvent(new Event('change'));
  }
}

describe('bindReducedMotionDamping', () => {
  it('disables inertia for reduced motion and follows preference changes until disposed', () => {
    const controls = { enableDamping: true };
    const preference = new MockMotionPreference(true);
    const unbind = bindReducedMotionDamping(controls, preference as MediaQueryList);

    expect(controls.enableDamping).toBe(false);
    preference.setReducedMotion(false);
    expect(controls.enableDamping).toBe(true);

    unbind();
    preference.setReducedMotion(true);
    expect(controls.enableDamping).toBe(true);
  });

  it('keeps inertia available when the platform cannot report a preference', () => {
    const controls = { enableDamping: false };

    bindReducedMotionDamping(controls);

    expect(controls.enableDamping).toBe(true);
  });
});
