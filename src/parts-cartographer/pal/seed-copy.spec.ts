import { describe, expect, it } from 'vitest';
import { SEED_PARTS } from './traits';
import { localizeParts, storedParts } from './seed-copy';

const planner = SEED_PARTS.find((part) => part.id === 'seed-planner')!;

describe('sample parts in the reader language', () => {
  it('shows every sample part fully in Russian', () => {
    const shown = localizeParts(SEED_PARTS, 'ru');
    for (const part of shown) {
      for (const field of ['name', 'role', 'blurb', 'burden', 'need', 'voice', 'since'] as const) {
        // «Self-энергия» is the one approved Latin term.
        expect(String(part[field]).replace('Self', ''), `${part.id}.${field}`).not.toMatch(/[A-Za-z]{3,}/);
      }
    }
    expect(shown.find((part) => part.id === 'seed-planner')!.name).toBe('Планировщик');
  });

  it('keeps English as is and leaves the user\'s own words alone', () => {
    expect(localizeParts(SEED_PARTS, 'en')).toBe(SEED_PARTS);
    const edited = { ...planner, name: 'My Planner' };
    const [shown] = localizeParts([edited], 'ru');
    expect(shown.name).toBe('My Planner');
    expect(shown.role).toBe('Держит расписание плотным, чтобы ничто не застало вас врасплох');
  });

  it('stores sample text in English, so a later switch to English still works', () => {
    const [shown] = localizeParts([planner], 'ru');
    const [stored] = storedParts([{ ...shown, star: false }]);
    expect(stored).toEqual({ ...planner, star: false });
  });

  it('applies to scored parts that reuse a sample name, not only seed ids', () => {
    const [shown] = localizeParts([{ id: 'scored-1', name: 'Captain Critic', role: 'Typed by the user' }], 'ru');
    expect(shown).toEqual({ id: 'scored-1', name: 'Капитан Критик', role: 'Typed by the user' });
  });
});
