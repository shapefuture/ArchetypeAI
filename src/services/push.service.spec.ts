import { describe, it, expect } from 'vitest';
import { PushService } from './push.service';

describe('PushService (§3.8 daily reminder)', () => {
  it('reports unsupported where Notification/SW are absent (jsdom)', async () => {
    const s = new PushService();
    expect(await s.currentState()).toBe('unsupported');
    expect(await s.enable()).toBe('unsupported');
  });

  it('local nudge fires only with permission and a stale (≥20h) check-in', () => {
    const s = new PushService();
    // jsdom: no Notification → never nudges
    expect(s.maybeLocalNudge(null)).toBe(false);
    expect(s.maybeLocalNudge(new Date())).toBe(false);
  });
});
