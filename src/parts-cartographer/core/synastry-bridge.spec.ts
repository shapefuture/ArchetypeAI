import { describe, expect, it } from 'vitest';
import { toAssessmentInput } from '../../app/core/data/assessment-adapter';
import { synastry as compareScoredProfiles, toSynastryProfile } from '../../app/core/data/synastry-v2';
import { scoreProfile } from '../../app/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { readSynastryClinicalProfile, synastryFromSnapshotProfiles } from './synastry-bridge';

function profileFor(answer: number) {
  const scored = scoreProfile(toAssessmentInput(Array(147).fill(answer)));
  return adaptClinicalProfile(scored, 'en').profile;
}

describe('canonical profile synastry bridge', () => {
  it('uses the Angular scored-profile engine and maps all six report dimensions', () => {
    const local = profileFor(2);
    const partner = profileFor(4);
    const expected = compareScoredProfiles(
      toSynastryProfile(local.clinical),
      toSynastryProfile(partner.clinical),
    );

    const report = synastryFromSnapshotProfiles(local, partner, 'LOCAL123', 'PARTNER8', 'en');

    expect(report?.engineVersion).toBe('scored-profile-v2');
    expect(report?.bond.id).toBe(expected.dance.toLowerCase());
    expect(report?.dims.map(({ value }) => value)).toEqual([
      expected.FRICTION, expected.RESONANCE, expected.BALANCE,
      expected.SAFETY, expected.GROWTH, expected.NOURISH,
    ].map(Math.round));
    expect(report?.dims.map(({ key }) => key)).toEqual([
      'friction', 'resonance', 'balance', 'safety', 'growth', 'nourish',
    ]);
    expect(report?.narrativeEn).toContain('not a compatibility score');
    expect(report?.narrativeEn).toContain('possible loop');
    expect(report?.narrativeRu).toBeTruthy();
  });

  it('localizes report labels and safety framing in Russian', () => {
    const report = synastryFromSnapshotProfiles(profileFor(3), profileFor(5), 'LOCAL123', 'PARTNER8', 'ru');

    expect(report?.bond.ru).toBeTruthy();
    expect(report?.dims[0].labelRu).toBe('Риск взаимных триггеров');
    expect(report?.narrativeRu).toContain('не оценка совместимости');
    expect(report?.narrativeRu).toContain('не прогноз');
  });

  it('accepts only complete, finite, bounded aggregate profiles and never requires raw answers', () => {
    const profile = profileFor(3);
    expect(readSynastryClinicalProfile(profile)).toEqual(profile.clinical);
    expect(JSON.stringify(profile.clinical)).not.toContain('responses');
    expect(JSON.stringify(profile.clinical)).not.toContain('answers');

    const missingPart = structuredClone(profile);
    delete (missingPart.clinical.parts as Record<string, unknown>).abandoned;
    expect(readSynastryClinicalProfile(missingPart)).toBeNull();

    const invalidScore = structuredClone(profile);
    (invalidScore.clinical.parts.abandoned as { T: unknown }).T = '72';
    expect(readSynastryClinicalProfile(invalidScore)).toBeNull();

    const outOfRange = structuredClone(profile);
    (outOfRange.clinical.resources.sage as { T: number }).T = 900;
    expect(readSynastryClinicalProfile(outOfRange)).toBeNull();
  });

  it('leaves noncanonical and legacy response-only snapshots to their existing fallback route', () => {
    expect(synastryFromSnapshotProfiles(
      profileFor(3),
      { schema: 'parts-cartographer.v1', assessment: { responses: Array(64).fill(3) } },
      'LOCAL123',
      'PARTNER8',
      'en',
    )).toBeNull();
    expect(synastryFromSnapshotProfiles(profileFor(3), null, 'LOCAL123', 'PARTNER8', 'en')).toBeNull();
  });
});
