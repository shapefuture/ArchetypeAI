// Round 23 probe (critic): projectedPart derives archetype.size and archetype.cluster from the part's family. withPersonEdits
// (used by a retake and a History restore) keeps the person's family but leaves archetype.size at the canonical family's value,
// and universe-scene.ts scales each node by archetype.size.
import { describe, expect, it } from 'vitest';
import { toAssessmentInput } from '../../shared/core/data/assessment-adapter';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile, withPersonEdits, type ClinicalPart } from './clinical-profile-adapter.ts';

const answers = Array.from({ length: 147 }, (_, i) => (i % 5) + 1);
const adapted = adaptClinicalProfile(scoreProfile(toAssessmentInput(answers)), 'en');
const SIZE_OF_FAMILY: Record<string, number> = { manager: 0.75, firefighter: 0.7, exile: 0.6, resource: 0.8 };

describe('round23: a retaken part keeps the archetype size of the family the person kept', () => {
  it('control: an unchanged family keeps its canonical size', () => {
    const base = adapted.parts.find((part) => part.id === 'taskmaster') as ClinicalPart;
    expect(withPersonEdits(base, { ...base }).archetype.size).toBe(SIZE_OF_FAMILY.manager);
  });

  it('the size follows the family the person kept (exile)', () => {
    const base = adapted.parts.find((part) => part.id === 'taskmaster') as ClinicalPart;
    const kept = withPersonEdits(base, { ...base, family: 'exile' });
    expect(kept.family).toBe('exile');
    expect(kept.archetype.size, 'retaken taskmaster archetype.size').toBe(SIZE_OF_FAMILY.exile);
  });
});
