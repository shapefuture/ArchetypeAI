// Critic 19: the therapist summary the Share screen sends. It must come from the client's complete
// scored result, the numbers the client sees. The adapted profile holds 0..1 energies and display
// labels, so reading it as scores sent wrong T-scores, a fixed "active" tier, and the floor as l2.
import { describe, expect, it, vi } from 'vitest';

const { setDoc } = vi.hoisted(() => ({ setDoc: vi.fn(async () => undefined) }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(), setDoc, collection: vi.fn(), getDoc: vi.fn(), getDocs: vi.fn(), query: vi.fn(), where: vi.fn(), writeBatch: vi.fn(),
}));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));

import { EXILES, SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { scoreProfile, type AssessmentInput } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from './clinical-profile-adapter';
import { therapistSummaryFor } from './therapist-link';

const filled = (shadowFill: number, selfFill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(shadowFill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(shadowFill) as number[];
  return { shadow, resources, self: Array(8).fill(selfFill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

const sentFor = (score: ReturnType<typeof scoreProfile>) => therapistSummaryFor(adaptClinicalProfile(score, 'en').profile, { done: 0, skipped: 0 });

describe('therapist summary sent by the Share screen (round 19)', () => {
  it('sends every part at the client\'s own T-score, to one decimal', () => {
    const score = scoreProfile(filled(4, 3));
    const summary = sentFor(score)!;
    const wrong = SHADOW_PARTS
      .filter((id) => summary.parts[id].T !== Math.round(score.parts[id].T * 10) / 10)
      .map((id) => `${id}: client T ${score.parts[id].T}, sent ${summary.parts[id].T}`);
    expect(wrong).toEqual([]);
  });

  it('sends the same self-energy the client sees (0 when every self item is 1)', () => {
    const score = scoreProfile(filled(3, 1));
    expect(score.selfEnergy).toBe(0);
    expect(sentFor(score)!.selfEnergy).toBe(0);
  });

  it('sends each active complex with its real tier and activation, not a fixed "active" at 1', () => {
    const score = scoreProfile(filled(5, 3));
    expect(score.activeComplexes.some((c) => c.tier !== 'active')).toBe(true);
    expect(sentFor(score)!.activeComplexes).toEqual(score.activeComplexes.map((c) => ({
      id: c.id, tier: c.tier, activation: Math.round(c.activation * 10) / 10,
    })));
  });

  it('sends the floor as an exile, not as l2, when the client has no second protector', () => {
    const shadow = {} as AssessmentInput['shadow'];
    for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(1) as number[];
    shadow.taskmaster = Array(8).fill(5) as number[];
    const resources = {} as AssessmentInput['resources'];
    for (const r of RESOURCES) resources[r] = Array(6).fill(3) as number[];
    const score = scoreProfile({ shadow, resources, self: Array(8).fill(3) as number[], validity: { attention: 3, infrequency: [1, 1] } });
    expect(score.copingStack.l2).toBeUndefined();
    const summary = sentFor(score)!;
    expect(summary.copingStack.l2).toBeUndefined();
    expect(EXILES).toContain(summary.copingStack.floor);
  });

  it('sends nothing when no complete scored result is saved', () => {
    expect(therapistSummaryFor(undefined, { done: 0, skipped: 0 })).toBeNull();
    expect(therapistSummaryFor({ clinical: { parts: {} } }, { done: 0, skipped: 0 })).toBeNull();
  });
});
