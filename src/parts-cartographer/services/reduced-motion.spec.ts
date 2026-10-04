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
    const motion = bindReducedMotionDamping(controls, preference as MediaQueryList);

    expect(controls.enableDamping).toBe(false);
    preference.setReducedMotion(false);
    expect(controls.enableDamping).toBe(true);

    motion.dispose();
    preference.setReducedMotion(true);
    expect(controls.enableDamping).toBe(true);
  });

  it('applies the Still and Gentle controls while respecting the system preference', () => {
    const controls = { enableDamping: true, dampingFactor: 0.05 };
    const preference = new MockMotionPreference(false);
    const motion = bindReducedMotionDamping(controls, preference as MediaQueryList, 'gentle');

    expect(controls.enableDamping).toBe(true);
    expect(controls.dampingFactor).toBe(0.08);
    motion.setMode('still');
    expect(controls.enableDamping).toBe(false);

    motion.setMode('lively');
    expect(controls.enableDamping).toBe(true);
    preference.setReducedMotion(true);
    expect(controls.enableDamping).toBe(false);
    motion.dispose();
  });

  it('keeps inertia available when the platform cannot report a preference', () => {
    const controls = { enableDamping: false };

    bindReducedMotionDamping(controls);

    expect(controls.enableDamping).toBe(true);
  });
});
