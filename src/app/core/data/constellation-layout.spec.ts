import { describe, it, expect } from 'vitest';
import { buildLayout, starAt } from './constellation-layout';
import { SHADOW_PARTS, RESOURCES, SELF_QUALITIES, MANAGERS, FIREFIGHTERS, EXILES } from './parts';
import { scoreProfile, type AssessmentInput } from './scoring-v2';

const all = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return { shadow, resources, self: Array(8).fill(fill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

describe('constellation layout (§3.1, §1.15)', () => {
  it('places exactly 18 stars: 4 resources + 7 managers + 3 firefighters + 4 exiles', () => {
    const L = buildLayout(scoreProfile(all(4)));
    expect(L.stars.length).toBe(18);
    expect(L.stars.filter(s => s.ring === 'resource').length).toBe(4);
    expect(L.stars.filter(s => s.ring === 'manager').length).toBe(7);
    expect(L.stars.filter(s => s.ring === 'firefighter').length).toBe(3);
    expect(L.stars.filter(s => s.ring === 'exile').length).toBe(4);
  });

  it('is deterministic: same profile → byte-identical layout', () => {
    const p = scoreProfile(all(4));
    expect(JSON.stringify(buildLayout(p))).toBe(JSON.stringify(buildLayout(p)));
  });

  it('rings sort by radius: exile < firefighter < manager < resource', () => {
    const L = buildLayout(scoreProfile(all(4)));
    const ringR = (ring: string) => Math.hypot(
      L.stars.find(s => s.ring === ring)!.x - 0.5,
      L.stars.find(s => s.ring === ring)!.y - 0.5);
    expect(ringR('exile')).toBeLessThan(ringR('firefighter'));
    expect(ringR('firefighter')).toBeLessThan(ringR('manager'));
    expect(ringR('manager')).toBeLessThan(ringR('resource'));
  });

  it('every star sits inside the canvas and no two stars overlap centers', () => {
    const L = buildLayout(scoreProfile(all(4)));
    for (const s of L.stars) {
      expect(s.x).toBeGreaterThan(0); expect(s.x).toBeLessThan(1);
      expect(s.y).toBeGreaterThan(0); expect(s.y).toBeLessThan(1);
    }
    for (let i = 0; i < L.stars.length; i++) {
      for (let j = i + 1; j < L.stars.length; j++) {
        const d = Math.hypot(L.stars[i].x - L.stars[j].x, L.stars[i].y - L.stars[j].y);
        expect(d).toBeGreaterThan(0.03);
      }
    }
  });

  it('star radius grows with tier (all-5s dominant > all-1s dormant)', () => {
    const hot = buildLayout(scoreProfile(all(5)));
    const cold = buildLayout(scoreProfile(all(1)));
    expect(starAt(hot, 'rebel').radius).toBeGreaterThan(starAt(cold, 'rebel').radius);
    expect(starAt(hot, 'rebel').tier).toBe('dominant');
    expect(starAt(cold, 'rebel').tier).toBe('dormant');
  });

  it('Self hub: luminosity scales with self_energy; radar has 8 spokes ordered by quality', () => {
    const high = buildLayout(scoreProfile(all(5)));
    const low = buildLayout(scoreProfile(all(1)));
    expect(high.self.radius).toBeGreaterThan(low.self.radius);
    expect(high.self.spokes.length).toBe(8);
    expect(high.self.spokes.map(s => s.quality)).toEqual([...SELF_QUALITIES]);
  });

  it('all-5s fires all 8 tension arcs; all-3s fires none', () => {
    expect(buildLayout(scoreProfile(all(5))).tensionArcs.length).toBe(8);
    expect(buildLayout(scoreProfile(all(3))).tensionArcs.length).toBe(0);
  });

  it('guardianship lines: only weight ≥ 0.7 guards, one per protector', () => {
    const L = buildLayout(scoreProfile(all(4)));
    const froms = new Set(L.guardLines.map(g => g.from));
    expect(froms.size).toBe(L.guardLines.length);
    expect(L.guardLines.length).toBeLessThanOrEqual(MANAGERS.length + FIREFIGHTERS.length);
    for (const g of L.guardLines) expect(g.weight).toBeGreaterThanOrEqual(0.7);
  });

  it('leak arcs mirror the profile leaks (all-5s: all 4 resources)', () => {
    const L = buildLayout(scoreProfile(all(5)));
    expect(L.leakArcs.length).toBe(4);
    expect(buildLayout(scoreProfile(all(3))).leakArcs.length).toBe(0);
  });

  it('complex glows carry member part ids of the top-2 active complexes', () => {
    const L = buildLayout(scoreProfile(all(5)));
    expect(L.complexGlows.length).toBe(2);
    expect(L.complexGlows[0].parts.length).toBeGreaterThanOrEqual(4);
    expect(L.complexGlows[0].name).toContain('Complex');
  });

  it('starAt throws for unknown ids instead of inventing positions', () => {
    expect(() => starAt(buildLayout(scoreProfile(all(4))), 'nope' as never)).toThrow();
  });

  it('exile stars sit inside the firefighter ring (wounds are close to Self)', () => {
    const L = buildLayout(scoreProfile(all(4)));
    for (const e of EXILES) {
      const d = Math.hypot(starAt(L, e).x - 0.5, starAt(L, e).y - 0.5);
      expect(d).toBeLessThan(0.26);
    }
    void MANAGERS; void FIREFIGHTERS;
  });
});
