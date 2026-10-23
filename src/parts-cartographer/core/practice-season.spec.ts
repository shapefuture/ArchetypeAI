import { describe, expect, it } from 'vitest';
import { addEndpoint, createSeason, setGoals } from './practice-season.ts';

describe('practice season', () => {
  it('does not mandate a length, and keeps a chosen one', () => {
    expect(createSeason('s1', ['rest more']).lengthDays).toBeNull();
    expect(createSeason('s2', ['rest more'], 30).lengthDays).toBe(30);
  });

  it('has no composite rank, spiritual rating or score field', () => {
    const season = createSeason('s1', ['rest more']);
    expect(Object.keys(season).some((k) => /rank|score|spirit|level/i.test(k))).toBe(false);
  });

  it('keeps goals and endpoints editable by the person', () => {
    const season = setGoals(createSeason('s1', ['rest more']), ['sleep earlier', '  ']);
    expect(season.goals).toEqual(['sleep earlier']);
    expect(addEndpoint(season, ' a calmer Sunday ').endpoints).toEqual(['a calmer Sunday']);
  });
});
