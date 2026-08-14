import { describe, it, expect } from 'vitest';
import { toAssessmentInput, somaticFollowUpFires, validityAnswerIndexes, SOMATIC_ZONES } from './assessment-adapter';
import { buildItemSequence } from '../../../i18n/items';
import { scoreProfile } from './scoring-v2';
import { SHADOW_PARTS, RESOURCES } from './parts';

describe('assessment adapter', () => {
  const seq = buildItemSequence();
  it('round-trips: every sequence position lands in the right bank slot', () => {
    const answers = seq.map((ref, i) => {
      // unique-ish value: all valid 1..5, deterministic
      if (ref.kind === 'validity') return ref.which === 'attention' ? 3 : 1;
      return ((i % 5) + 1);
    });
    const input = toAssessmentInput(answers);
    for (const p of SHADOW_PARTS) {
      expect(input.shadow[p].length).toBe(8);
      expect(input.shadow[p].every(v => v >= 1 && v <= 5)).toBe(true);
    }
    for (const r of RESOURCES) expect(input.resources[r].length).toBe(6);
    expect(input.self.length).toBe(8);
    expect(input.validity.attention).toBe(3);
    expect(input.validity.infrequency).toEqual([1, 1]);
  });
  it('feeds scoring-v2 end to end', () => {
    const answers = seq.map(ref => ref.kind === 'validity' ? (ref.which === 'attention' ? 3 : 1) : 4);
    const profile = scoreProfile(toAssessmentInput(answers));
    expect(profile.headline.name.length).toBeGreaterThan(3);
    expect(profile.burden).toBeGreaterThanOrEqual(0);
  });
  it('rejects wrong-length or out-of-range answers', () => {
    expect(() => toAssessmentInput([3, 3])).toThrow();
    const bad = new Array(147).fill(9);
    expect(() => toAssessmentInput(bad)).toThrow();
  });
  it('validity positions are 39, 83, 119 zero-based', () => {
    expect(validityAnswerIndexes()).toEqual([39, 83, 119]);
  });
});

describe('§1.12 somatic follow-up', () => {
  const shadow = (index: number) => ({ kind: 'shadow', part: 'taskmaster', index }) as const;
  it('fires only for 4–5 on shadow items with index mod 5 == 0', () => {
    expect(somaticFollowUpFires(shadow(0), 4)).toBe(true);
    expect(somaticFollowUpFires(shadow(5), 5)).toBe(true);
    expect(somaticFollowUpFires(shadow(0), 3)).toBe(false);
    expect(somaticFollowUpFires(shadow(1), 5)).toBe(false);
    expect(somaticFollowUpFires({ kind: 'self', index: 0 }, 5)).toBe(false);
  });
  it('offers exactly 8 zones', () => {
    expect(SOMATIC_ZONES.length).toBe(8);
  });
});
