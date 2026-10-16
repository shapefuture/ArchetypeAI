import { describe, expect, it } from 'vitest';
import { canRemind, chooseMove, skip, type Reminder } from './return-loop.ts';

const optedIn: Reminder = { optIn: true, channel: 'in-app', deviceConfirmed: false, quietHours: { startHour: 22, endHour: 7 }, skipped: 0 };

describe('return loop and reminders', () => {
  it('never reminds without an explicit opt-in', () => {
    expect(canRemind({ ...optedIn, optIn: false }, 12)).toBe(false);
  });

  it('never assumes a device channel that the person has not confirmed', () => {
    expect(canRemind({ ...optedIn, channel: 'device', deviceConfirmed: false }, 12)).toBe(false);
    expect(canRemind({ ...optedIn, channel: 'device', deviceConfirmed: true }, 12)).toBe(true);
  });

  it('respects quiet hours across midnight', () => {
    expect(canRemind(optedIn, 23)).toBe(false);
    expect(canRemind(optedIn, 3)).toBe(false);
    expect(canRemind(optedIn, 12)).toBe(true);
  });

  it('counts a skip without punishing or switching the reminder off', () => {
    const after = skip(optedIn);
    expect(after.skipped).toBe(1);
    expect(after.optIn).toBe(true);
    expect(canRemind(after, 12)).toBe(true);
  });

  it('refuses an empty move and keeps a chosen one', () => {
    expect(chooseMove('   ')).toBeNull();
    expect(chooseMove('  Call one friend  ')).toBe('Call one friend');
  });
});
