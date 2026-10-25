import { describe, expect, it, vi } from 'vitest';

// Scratch (gauntlet 15): force exact pole centers so describeResonance can be probed at its boundaries.
const centers = vi.hoisted(() => ({ queue: [] as number[][] }));
vi.mock('./scoring', async (orig) => {
  const mod = await orig<any>();
  return {
    ...mod,
    computePoleScores: (responses: number[]) => {
      const real = mod.computePoleScores(responses);
      const center = centers.queue.shift();
      return center ? { ...real, center } : real;
    },
  };
});

import { computeSynastry } from './synastry';

const pair = (c1: number[], c2: number[], lang: 'en' | 'ru' = 'en') => {
  centers.queue = [c1, c2];
  return computeSynastry(Array(64).fill(3), Array(64).fill(3), lang).dimensionalResonance;
};
const dim = (rows: any[], key: string) => rows.find((r) => r.dimension === key)!;

describe('gauntlet15: describeResonance boundaries', () => {
  it('both at 0.25 and 0.75 (same side, complementary band) reads as same side', () => {
    const row = dim(pair([0.25, 0, 0, 0], [0.75, 0, 0, 0]), 'AGENCY');
    expect(row.descriptionEn).toMatch(/same side/);
  });

  it('one exactly at 0.2 (balanced) and the other at 0.9 is polarized and does not claim both are at a pole', () => {
    const row = dim(pair([0.2, 0, 0, 0], [0.9, 0, 0, 0]), 'AGENCY');
    // A balanced side is described as it is, without opposition wording.
    expect(row.descriptionEn).not.toMatch(/Strong polarity|fundamentally different|brings what the other lacks/);
  });

  it('opposite poles across zero (0.5 vs -0.5) is polarized with the right poles', () => {
    const row = dim(pair([0.5, 0, 0, 0], [-0.5, 0, 0, 0]), 'AGENCY');
    expect(row.descriptionEn).toMatch(/Person 1 is following while Person 2 is leading/);
  });

  it('exactly 0.2 on both sides of zero (-0.2 vs 0.2) is complementary and both balanced', () => {
    const row = dim(pair([-0.2, 0, 0, 0], [0.2, 0, 0, 0]), 'AGENCY');
    expect(row.descriptionEn).toMatch(/near the middle/);
  });

  it('ATTACHMENT wording agrees with its compound subject', () => {
    const near = dim(pair([0, 0, 0, 0.1], [0, 0, 0, 0.12]), 'ATTACHMENT');
    const far = dim(pair([0, 0, 0, 0.5], [0, 0, 0, -0.5]), 'ATTACHMENT');
    expect(near.descriptionEn).not.toMatch(/closeness and distance is/);
    expect(far.descriptionEn).not.toMatch(/closeness and distance (differs|is)/);
  });

  it('a same-side pair in Russian names the line and says вы оба', () => {
    const row = dim(pair([0.5, 0, 0, 0], [0.9, 0, 0, 0], 'ru'), 'AGENCY');
    expect(row.descriptionRu).toMatch(/вы оба на одной стороне/);
  });
});
