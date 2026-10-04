import { beforeEach, describe, expect, it } from 'vitest';
import { computeSynastry } from '../../app/core/data/synastry';
import { readLocalLegacy64Responses, synastryFromLegacy64Responses, validateLegacy64Responses } from './synastry-legacy64-bridge';

const localResponses = Array.from({ length: 64 }, (_, index) => (index % 5) + 1);
const partnerResponses = Array.from({ length: 64 }, (_, index) => 5 - (index % 5));

describe('Angular 64-item synastry bridge', () => {
  beforeEach(() => localStorage.clear());

  it('uses Angular computeSynastry output and preserves the full report for display/export', () => {
    const expected = computeSynastry(localResponses, partnerResponses, 'en');
    const result = synastryFromLegacy64Responses(localResponses, partnerResponses, 'LOCAL123', 'PARTNER8', 'en');

    expect(result?.engineVersion).toBe('legacy64-v1');
    expect(result?.legacy64).toEqual(expected);
    expect(result?.bond.en).toBe(expected.relationalArchetype.nameEn);
    expect(result?.dims).toHaveLength(6);
    expect(result?.dims.slice(0, 4).map(({ key }) => key)).toEqual(['agency', 'temperature', 'focus', 'attachment']);
    expect(result?.narrativeEn).toContain('not a compatibility score');
    expect(result?.narrativeEn).toContain(expected.attachmentDance.descriptionEn);
    expect(JSON.stringify(result)).not.toContain('person1Responses');
    expect(JSON.stringify(result)).not.toContain('person2Responses');
  });

  it('localizes the resulting report and safety framing in Russian', () => {
    const result = synastryFromLegacy64Responses(localResponses, partnerResponses, 'LOCAL123', 'PARTNER8', 'ru');

    expect(result?.bond.ru).toBeTruthy();
    expect(result?.dims[0].labelRu).toBe('Резонанс агентности');
    expect(result?.narrativeRu).toContain('не оценка совместимости');
    expect(result?.narrativeRu).toContain(result?.legacy64?.attachmentDance.descriptionRu);
  });

  it('rejects incomplete, non-integer, and out-of-scale answer vectors', () => {
    expect(validateLegacy64Responses(localResponses)).toBe(true);
    expect(validateLegacy64Responses(localResponses.slice(0, 63))).toBe(false);
    expect(validateLegacy64Responses([...localResponses.slice(0, 63), 5.5])).toBe(false);
    expect(validateLegacy64Responses([...localResponses.slice(0, 63), 9])).toBe(false);
    expect(synastryFromLegacy64Responses(localResponses, [1, 2, 3], 'LOCAL123', 'PARTNER8', 'en')).toBeNull();
  });

  it('loads only a complete local 64-item vector and never propagates malformed storage', () => {
    localStorage.setItem('ARCHETYPE_ASSESSMENT_RESPONSES', JSON.stringify(localResponses));
    expect(readLocalLegacy64Responses()).toEqual(localResponses);
    localStorage.setItem('ARCHETYPE_ASSESSMENT_RESPONSES', JSON.stringify([...localResponses.slice(0, 63), 0]));
    expect(readLocalLegacy64Responses()).toBeNull();
  });
});
