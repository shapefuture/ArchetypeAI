import { describe, expect, it } from 'vitest';
import { availablePractices } from './contextual-checkin.ts';
import { CATALOG_EXERCISE_IDS, CATALOG_REVIEW, catalogLang, reviewedPractices } from './practice-catalog.ts';
import { EXERCISES, EXERCISE_TYPES } from '../../app/core/data/exercises';
import { EXERCISE_COPY } from '../../i18n/strings';

describe('reviewed practice catalog', () => {
  it('lists only self-serve (green) exercises, so no therapist or assessment gate applies', () => {
    for (const id of CATALOG_EXERCISE_IDS) {
      const exercise = EXERCISES.find((item) => item.id === id);
      expect(exercise, `${id} exists in the exercise library`).toBeTruthy();
      expect(EXERCISE_TYPES[exercise!.type].gate, `${id} is green`).toBe('green');
    }
  });

  it('records the review basis as an educated guess, with no reviewer name or review date', () => {
    expect(CATALOG_REVIEW).toEqual({ status: 'reviewed', basis: 'educated-guess', reviewer: null, reviewedOn: null });
    for (const practice of reviewedPractices('en')) {
      expect(practice.status).toBe('reviewed');
    }
  });

  it('gives every practice a title and at least three steps, the behavioral hook rule for exercises', () => {
    for (const practice of reviewedPractices('en')) {
      expect(practice.title.trim().length, practice.id).toBeGreaterThan(0);
      expect(practice.steps.length, practice.id).toBeGreaterThanOrEqual(3);
      expect(practice.steps.every((step) => step.trim().length > 0), practice.id).toBe(true);
    }
  });

  it('provides Russian copy whose step count matches English, so quiet and full paths line up in both languages', () => {
    const en = reviewedPractices('en');
    const ru = reviewedPractices('ru');
    expect(ru.map((p) => p.id)).toEqual(en.map((p) => p.id));
    ru.forEach((practice, index) => {
      expect(practice.title, practice.id).not.toBe(en[index].title);
      expect(practice.steps.length, practice.id).toBe(en[index].steps.length);
    });
  });

  it('falls back to English for an unknown language value', () => {
    expect(catalogLang('de')).toBe('en');
    expect(catalogLang(undefined)).toBe('en');
    expect(catalogLang('ru')).toBe('ru');
    expect(reviewedPractices('de')).toEqual(reviewedPractices('en'));
  });

  it('offers every catalog practice with no prerequisite and no assessment or synastry being completed', () => {
    const offered = availablePractices(reviewedPractices('en'), []).map((p) => p.id);
    expect(offered).toEqual([...CATALOG_EXERCISE_IDS]);
  });

  it('uses no efficacy, validation or diagnostic wording in English titles and steps', () => {
    const forbidden = /\b(validated|proven|evidence-based|clinically|diagnos\w*|cure[sd]?|heal\w*|guaranteed|treats?|therapeutic)\b/i;
    for (const practice of reviewedPractices('en')) {
      expect(forbidden.test(practice.title), practice.id).toBe(false);
      for (const step of practice.steps) expect(forbidden.test(step), `${practice.id}: ${step}`).toBe(false);
    }
  });

  it('has unique ids that exist in the copy source', () => {
    expect(new Set(CATALOG_EXERCISE_IDS).size).toBe(CATALOG_EXERCISE_IDS.length);
    for (const id of CATALOG_EXERCISE_IDS) expect(EXERCISE_COPY[id], id).toBeTruthy();
  });

  it('returns fresh step arrays, so a caller cannot change the shared copy', () => {
    const first = reviewedPractices('en');
    first[0].steps.push('changed');
    expect(reviewedPractices('en')[0].steps).not.toContain('changed');
  });
});
