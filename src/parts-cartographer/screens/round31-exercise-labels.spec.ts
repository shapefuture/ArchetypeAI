// Round 31 probe (critic), pure. The therapist's "assign practice" dropdown (innerverse.jsx, the exerciseIds map) lists the
// exercise IDs of the shared catalog. Each option's title must come from the same shared copy, in both languages.
// Reproduced on 9437189: the dropdown read EXERCISE_COPY from this app's i18n/strings.ts, keyed e1 to e20, which holds none of
// the shared IDs, so every option rendered as an uppercase ID followed by nothing.
// Fixed: the dropdown reads the shared copy's title (src/shared/i18n/strings.ts), and this probe now checks that table.
import { describe, expect, it } from 'vitest';
import { EXERCISE_COPY as SHARED_COPY } from '../../shared/i18n/strings';
import { EXERCISES, EXERCISE_TYPES } from '../../shared/core/data/exercises';

// innerverse.jsx: exerciseIds = EXERCISES.filter((item) => EXERCISE_TYPES[item.type].gate !== 'red').map((item) => item.id)
const assignable = EXERCISES.filter((item) => EXERCISE_TYPES[item.type].gate !== 'red').map((item) => item.id);

describe('round31: the assignment dropdown titles every practice it offers', () => {
  it('control: the shared catalog has a title for every assignable practice', () => {
    expect(assignable.length).toBeGreaterThan(0);
    expect(assignable.filter((id) => !(SHARED_COPY as Record<string, unknown>)[id])).toEqual([]);
  });

  it('every assignable practice has a title in both languages in the copy the dropdown reads', () => {
    const copy = SHARED_COPY as Record<string, { en?: { title?: string }; ru?: { title?: string } }>;
    const untitled = assignable.filter((id) => !copy[id]?.en?.title || !copy[id]?.ru?.title);
    expect(untitled).toEqual([]);
  });
});
