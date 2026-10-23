import { describe, expect, it } from 'vitest';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter';

describe('clinical-profile-adapter', () => {
  it('projects the canonical 147-item score into the React map without retaining answers', () => {
    const answers = Array(147).fill(3);
    const score = scoreProfile(toAssessmentInput(answers));
    const { profile, parts } = adaptClinicalProfile(score, 'en');

    expect(profile.testModel).toBe('angular-v2');
    expect(parts).toHaveLength(18);
    expect(profile.parts).toHaveLength(18);
    expect(profile.headlineConstellation).toBe(score.headline.name);
    expect(profile.clinical.validity).toEqual({ flags: [], ok: true });
    expect(profile.subtypesEn).toHaveLength(14);
    expect(profile.subtypesRu).toHaveLength(14);
    expect(profile.copingStack.at(-1)).toContain('At the floor');
    expect(profile.parts.find((part) => part.id === 'taskmaster')?.scoreT).toBe(score.parts.taskmaster.T);
    expect(JSON.stringify(profile)).not.toContain('responses');
    expect(JSON.stringify(profile)).not.toContain('answers');
  });

  it('localizes the primary constellation, resources, and part cards in Russian', () => {
    const score = scoreProfile(toAssessmentInput(Array(147).fill(3)));
    const { profile, parts } = adaptClinicalProfile(score, 'ru');

    expect(profile.headlineRu).not.toBe(profile.headlineConstellation);
    expect(profile.strongestResource.nameRu).toMatch(/[А-Яа-яЁё]/);
    expect(parts.find((part) => part.id === 'inner_critic')?.name).toBe('Внутренний критик');
    expect(parts).toHaveLength(18);
  });
});
