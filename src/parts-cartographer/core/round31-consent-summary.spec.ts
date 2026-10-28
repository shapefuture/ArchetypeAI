// Round 31 probe (critic), pure. The share screen states what the code exposes (STRINGS.therapistShareConsent).
// Reproduced on 9437189: the summary built by toTherapistSummary (therapist-link.ts) also carried burden and selfEnergy, which
// the copy did not name and the dashboard shows as chips.
// Fixed: the copy now names burden and self-energy scores, and this probe checks that the copy names every summary field.
import { describe, expect, it } from 'vitest';
import { toTherapistSummary } from './therapist-link';
import type { ScoredProfile } from '../../shared/core/data/scoring-v2';
import { STRINGS } from '../i18n/strings';

const DISCLOSED = ['headline', 'parts', 'burden', 'selfEnergy', 'activeComplexes', 'copingStack', 'adherence'];

const profile = {
  headline: { name: 'Protector constellation' },
  burden: 61.4,
  selfEnergy: 47,
  parts: { manager: { T: 52.25, tier: 'moderate' } },
  activeComplexes: [{ id: 'abandonment', activation: 63.2, tier: 'high' }],
  copingStack: { l1: 'Caretaker', floor: 'Shamed' },
} as unknown as ScoredProfile;

describe('round31: the share summary holds only what the consent copy discloses', () => {
  it('control: the copy names every category the summary carries', () => {
    expect(STRINGS.therapistShareConsent.en).toContain('headline, part scores, burden and self-energy scores, active themes, coping pattern, and adherence summary');
  });

  it('every field of the summary is a category the copy discloses', () => {
    const summary = toTherapistSummary(profile, { done: 2, skipped: 0 });
    expect(Object.keys(summary).filter((key) => !DISCLOSED.includes(key))).toEqual([]);
  });
});
