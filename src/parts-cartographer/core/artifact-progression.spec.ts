import { describe, expect, it } from 'vitest';
import { chooseReward, isEssentialLocked, progressFor, revise, type Artifact } from './artifact-progression.ts';

const made: Artifact[] = [
  { id: 'a1', kind: 'letter', createdAt: '2026-10-01T09:00:00Z', revisedCount: 0 },
  { id: 'a2', kind: 'plan', createdAt: '2026-10-03T09:00:00Z', revisedCount: 1 },
];

describe('artifact-based progression', () => {
  it('counts artifacts and revisions, and has no streak, energy or loot field', () => {
    const progress = progressFor(made);
    expect(progress).toEqual({ artifactCount: 2, revisionCount: 1, lastCreatedAt: '2026-10-03T09:00:00Z' });
    expect(Object.keys(progress).some((k) => /streak|energy|loot|lock/i.test(k))).toBe(false);
  });

  it('never reduces progress when an artifact is revised', () => {
    const before = progressFor(made);
    const after = progressFor(revise(made, 'a1'));
    expect(after.artifactCount).toBe(before.artifactCount);
    expect(after.revisionCount).toBe(before.revisionCount + 1);
  });

  it('offers only rewards the person chose from their own list', () => {
    const options = [{ id: 'walk', label: 'A walk', chosenBy: 'user' as const }, { id: 'x', label: 'Assigned', chosenBy: 'system' as never }];
    expect(chooseReward(options, 'walk')?.label).toBe('A walk');
    expect(chooseReward(options, 'x')).toBeNull();
  });

  it('never locks an essential behind progress', () => {
    expect(isEssentialLocked('help', progressFor([]))).toBe(false);
  });
});
