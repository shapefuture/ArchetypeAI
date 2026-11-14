import { describe, expect, it } from 'vitest';
import { DAILY_PROMPTS, dayNumber, localDay, promptById, promptForDay } from './daily-prompts';

describe('daily journal questions', () => {
  it('has unique ids, both languages and a journal type for every question', () => {
    expect(new Set(DAILY_PROMPTS.map((p) => p.id)).size).toBe(DAILY_PROMPTS.length);
    for (const p of DAILY_PROMPTS) {
      expect(['jTrigger', 'jSensation', 'jThought', 'jPattern']).toContain(p.kind);
      expect(p.en.trim().length).toBeGreaterThan(10);
      expect(p.ru.trim().length).toBeGreaterThan(10);
      // Russian copy addresses the person as «вы», never «ты».
      expect(/(^|[^а-яё])(ты|тебя|тебе|твой|твоя|твоё|твои)([^а-яё]|$)/i.test(p.ru)).toBe(false);
    }
  });

  it('includes the body question about a signal that was not listened to', () => {
    expect(promptById('body-ignored')?.kind).toBe('jSensation');
  });

  it('keeps one question all day, changes it the next day, and steps on with "another"', () => {
    expect(promptForDay('2026-11-14')).toBe(promptForDay('2026-11-14'));
    expect(promptForDay('2026-11-15')).not.toBe(promptForDay('2026-11-14'));
    expect(promptForDay('2026-11-14', 1)).toBe(promptForDay('2026-11-15'));
    expect(promptForDay('2026-11-14', DAILY_PROMPTS.length)).toBe(promptForDay('2026-11-14'));
  });

  it('reads an invalid day as day 0 and never throws', () => {
    expect(dayNumber('not a day')).toBe(0);
    expect(promptForDay('nope')).toBe(DAILY_PROMPTS[0]);
    expect(promptById(42)).toBeNull();
  });

  it('formats the local day', () => {
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
