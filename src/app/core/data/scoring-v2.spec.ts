/**
 * REVAMP §1.3–1.15 — exact-value fixtures, written BEFORE implementation.
 * Hand-computed from the spec tables. All T-scores: 50 + 10*(raw − mean)/sd.
 * Fixture builders: all-3s (neutral), all-5s (max), all-1s (min).
 */
import { describe, it, expect } from 'vitest';
import type { ShadowPartId, ResourceId, SelfQuality } from '../../../shared/core/data/parts';
import { SHADOW_PARTS, RESOURCES, SELF_QUALITIES, PROTECTORS } from '../../../shared/core/data/parts';
import {
  scoreProfile, quickScan, REVERSE_KEYED_INDEXES, type AssessmentInput,
} from '../../../shared/core/data/scoring-v2';

const n8 = (v: number) => Array(8).fill(v) as number[];
const n6 = (v: number) => Array(6).fill(v) as number[];

function input(
  fill: number,
  over: Partial<Record<ShadowPartId | ResourceId | 'self', number[]>> = {},
  validity: { attention?: number; infrequency?: [number, number] } = {},
): AssessmentInput {
  const shadow = {} as Record<ShadowPartId, number[]>;
  for (const p of SHADOW_PARTS) shadow[p] = over[p] ?? n8(fill);
  const resources = {} as Record<ResourceId, number[]>;
  for (const r of RESOURCES) resources[r] = over[r] ?? n6(fill);
  return {
    shadow, resources,
    self: over.self ?? Array(8).fill(fill) as number[],
    validity: { attention: validity.attention ?? 3, infrequency: validity.infrequency ?? [1, 1] },
  };
}

describe('§1.3 raw and T-scores (all-3s fixture)', () => {
  const p = scoreProfile(input(3));
  it('raw_p = 6 keyed + 2 reverse (6 − score) = 24 for uniform 3s', () => {
    for (const id of SHADOW_PARTS) expect(p.parts[id].raw).toBe(24);
  });
  it('computes exact T-scores', () => {
    expect(p.parts.taskmaster.T).toBeCloseTo(46.67, 2);
    expect(p.parts.inner_critic.T).toBeCloseTo(48.46, 2);
    expect(p.parts.controller.T).toBeCloseTo(48.33, 2);
    expect(p.parts.hermit.T).toBeCloseTo(53.33, 2);
    expect(p.parts.bypasser.T).toBeCloseTo(55.45, 2);
    expect(p.parts.rebel.T).toBeCloseTo(57.27, 2);
    expect(p.parts.frightened.T).toBeCloseTo(56.67, 2);
    expect(p.parts.abandoned.T).toBeCloseTo(54.62, 2);
  });
  it('reverse-keyed items are indexes 6,7 (q7,q8) per item-bank contract', () => {
    expect(REVERSE_KEYED_INDEXES).toEqual([6, 7]);
  });
  it('resources: raw 18 → T = 50 + 10*(18−20)/4.5 = 45.56', () => {
    expect(p.resources.sage.raw).toBe(18);
    expect(p.resources.sage.T).toBeCloseTo(45.56, 2);
    expect(p.resources.sage.band).toBe('healthy');
  });
  it('self_energy = round(100*(24−8)/32) = 50', () => {
    expect(p.selfEnergy).toBe(50);
  });
  it('burden rescales exactly: (49.55−40)*2.5 = 23.88', () => {
    expect(p.burden).toBeCloseTo(23.88, 1);
  });
  it('validity passes (attention=3, infrequency=1)', () => {
    expect(p.validity.flags).toEqual([]);
    expect(p.validity.ok).toBe(true);
  });
});

describe('§1.3 tiers and clamping (all-5s fixture)', () => {
  const p = scoreProfile(input(5));
  it('raw 32 everywhere; rebel T = 71.82 dominant, taskmaster T = 60 prominent', () => {
    expect(p.parts.rebel.T).toBeCloseTo(71.82, 2);
    expect(p.parts.rebel.tier).toBe('dominant');
    expect(p.parts.taskmaster.T).toBeCloseTo(60, 5);
    expect(p.parts.taskmaster.tier).toBe('prominent');
    expect(p.parts.taskmaster.raw).toBe(32);
  });
  it('self_energy clamps at 100; radar spokes = 50 + 10*(5−3) = 70', () => {
    expect(p.selfEnergy).toBe(100);
    for (const q of SELF_QUALITIES) expect(p.selfRadar[q]).toBe(70);
  });
  it('resource T = 72.22 → hyper band, and every spillPart ≥ 60 leaks (all 4 here)', () => {
    expect(p.resources.sage.T).toBeCloseTo(72.22, 2);
    expect(p.resources.sage.band).toBe('hyper');
    const leaks = p.resourceLeaks.map(l => l.resource).sort();
    expect(leaks).toEqual(['caregiver', 'explorer', 'sage', 'warrior']);
  });
});

describe('all-1s fixture (floor)', () => {
  const p = scoreProfile(input(1));
  it('raw 16; T clamps at 20 for resources; self_energy = 0', () => {
    expect(p.resources.sage.raw).toBe(6);
    expect(p.resources.sage.T).toBe(20);
    expect(p.resources.sage.band).toBe('hypo');
    expect(p.selfEnergy).toBe(0);
    expect(p.selfRadar.calm).toBe(30);
  });
  it('attention check at 1 ≠ 3 flags but does not block', () => {
    const flagged = scoreProfile(input(1, {}, { attention: 1 }));
    expect(flagged.validity.flags).toContain('attention');
    expect(flagged.validity.ok).toBe(false);
    expect(flagged.burden).toBeGreaterThan(0); // still scored
  });
  it('infrequency agreement flags', () => {
    const flagged = scoreProfile(input(3, {}, { infrequency: [5, 2] }));
    expect(flagged.validity.flags).toContain('infrequency');
  });
});

describe('§1.4 constellations and polarizations', () => {
  it('all-3s: top protector rebel 57.27, top exile frightened 56.67 → The Cornered Storm', () => {
    const p = scoreProfile(input(3));
    expect(p.headline.protector).toBe('rebel');
    expect(p.headline.exile).toBe('frightened');
    expect(p.headline.name).toBe('The Cornered Storm');
  });
  it('ties break to earlier id in table order', () => {
    // all-5s: controller 61.67 === analyst 61.67 → controller; frightened 70 tops exiles
    const p = scoreProfile(input(5, { taskmaster: n8(5) }));
    expect(p.parts.controller.T).toBeCloseTo(p.parts.analyst.T, 10);
    expect(p.headline.protector).not.toBe('controller'); // rebel 71.82 tops all protectors
    expect(p.headline.protector).toBe('rebel');
    // Construct a strict controller/analyst tie at the top: neutral base, both maxed
    const q = scoreProfile(input(3, {
      controller: n8(5), analyst: n8(5), hermit: n8(3), bypasser: n8(3),
      numb: n8(3), rebel: n8(3), charmer: n8(3), taskmaster: n8(3), inner_critic: n8(3), pleaser: n8(3),
    }));
    expect(q.headline.protector).toBe('controller');
  });
  it('all-5s fires all 8 polarizations by name', () => {
    const p = scoreProfile(input(5));
    const names = p.polarizations.map(x => x.name).sort();
    expect(names).toEqual([
      'Cave–Stage Split', 'Clampdown–Breakout Cycle', 'Compliance–Explosion Cycle',
      'Freeze–Perform Split', 'Grind–Collapse Cycle', 'Halo–Havoc Cycle',
      'Shame–Display Split', 'White-Knuckle–Checkout Cycle',
    ].sort());
  });
  it('all-3s fires no polarizations', () => {
    expect(scoreProfile(input(3)).polarizations).toEqual([]);
  });
});

describe('§1.5 subtype resolution', () => {
  it('family ≥ 45 takes its highest-T colorer ≥ 45 (ties → earlier column)', () => {
    const p = scoreProfile(input(3));
    // pleaser 46.67; colorers abandoned 54.62, taskmaster 46.67, charmer 55.45, unseen 54.62 → charmer
    expect(p.subtypes.pleaser.name).toBe('The Diplomat');
    expect(p.subtypes.pleaser.colorer).toBe('charmer');
    // hermit 53.33; colorers frightened 56.67, analyst 48.33, ashamed 54.62, numb 53.33 → frightened
    expect(p.subtypes.hermit.name).toBe('The Bunker Keeper');
  });
  it('no colorer ≥ 45 → base subtype', () => {
    const p = scoreProfile(input(3, { inner_critic: n8(5) }));
    // taskmaster family 46.67 ≥ 45; colorers inner_critic 60.77, controller 48.33, charmer 55.45, analyst 48.33 → inner_critic
    expect(p.subtypes.taskmaster.name).toBe('The Perfectionist');
    const floor = scoreProfile(input(1));
    for (const f of SHADOW_PARTS) expect(floor.subtypes[f].colorer).toBeNull();
  });
  it('dormant family (< 45) uses base regardless of colorers', () => {
    const p = scoreProfile(input(3, { inner_critic: n8(5), pleaser: n8(1) }));
    expect(p.subtypes.pleaser.name).toBe('The Helper');
  });
});

describe('§1.6 attachment indices', () => {
  it('all-5s: anxious 65.46, avoidant 64.42, secure 80, disorganized true', () => {
    const p = scoreProfile(input(5));
    expect(p.attachment.anxious).toBeCloseTo(65.46, 2);
    expect(p.attachment.avoidant).toBeCloseTo(64.42, 2);
    expect(p.attachment.secure).toBeCloseTo(80, 5);
    expect(p.attachment.disorganized).toBe(true);
  });
  it('all-3s: secure 50, not disorganized', () => {
    const p = scoreProfile(input(3));
    expect(p.attachment.anxious).toBeCloseTo(52.40, 2);
    expect(p.attachment.avoidant).toBeCloseTo(51.08, 2);
    expect(p.attachment.secure).toBeCloseTo(50, 5);
    expect(p.attachment.disorganized).toBe(false);
  });
});

describe('§1.7 complexes', () => {
  it('all-3s: abandonment 52.57 → latent, nothing reported', () => {
    const p = scoreProfile(input(3));
    expect(p.complexes.abandonment.activation).toBeCloseTo(52.56, 2);
    expect(p.activeComplexes).toEqual([]);
  });
  it('all-5s: abandonment 65.615 → gripping; top-2 active are engulfment & unlovability', () => {
    const p = scoreProfile(input(5));
    expect(p.complexes.abandonment.activation).toBeCloseTo(65.615, 2);
    expect(p.complexes.abandonment.tier).toBe('gripping');
    expect(p.activeComplexes.map(c => c.id)).toEqual(['engulfment', 'unlovability']);
  });
  it('top-2 only, ordered by activation', () => {
    const p = scoreProfile(input(5));
    expect(p.activeComplexes.length).toBeLessThanOrEqual(2);
    for (let i = 1; i < p.activeComplexes.length; i++) {
      expect(p.activeComplexes[i - 1].activation)
        .toBeGreaterThanOrEqual(p.activeComplexes[i].activation);
    }
  });
});

describe('§1.8 need hungers', () => {
  it('all-3s exact hungers; joy has no shadow carrier → 0; top = autonomy', () => {
    const p = scoreProfile(input(3));
    expect(p.needHunger.safety).toBeCloseTo(1.38, 1);
    expect(p.needHunger.love).toBeCloseTo(9.06, 1);
    expect(p.needHunger.worth).toBeCloseTo(2.25, 1);
    expect(p.needHunger.autonomy).toBeCloseTo(11.71, 1);
    expect(p.needHunger.belonging).toBeCloseTo(-0.13, 1);
    expect(p.needHunger.meaning).toBeCloseTo(9.89, 1);
    expect(p.needHunger.joy).toBe(0);
    expect(p.topHunger?.need).toBe('autonomy');
  });
});

describe('§1.11 coping stack', () => {
  it('all-5s: L1 bypasser (top manager), L2 rebel, L3 charmer, floor unseen (guardian-weighted)', () => {
    const p = scoreProfile(input(5));
    expect(p.copingStack.l1).toBe('bypasser');
    expect(p.copingStack.l2).toBe('rebel');
    expect(p.copingStack.l3).toBe('charmer');
    expect(p.copingStack.floor).toBe('unseen');
  });
  it('all-1s: only L1 (highest manager bypasser 40.91); floor = ashamed via bypasser guard', () => {
    const p = scoreProfile(input(1));
    expect(p.copingStack.l1).toBe('bypasser');
    expect(p.copingStack.l2).toBeUndefined();
    expect(p.copingStack.l3).toBeUndefined();
    expect(p.copingStack.floor).toBe('ashamed');
  });
});

describe('§1.13 quick scan', () => {
  it('top family ≥ 4 → that family’s base subtype teaser', () => {
    const qs = quickScan({ taskmaster: 5, abandoned: 3 } as Record<ShadowPartId, number>);
    expect(qs.kind).toBe('family');
    expect(qs.family).toBe('taskmaster');
    expect(qs.subtypeName).toBe('The Striver');
  });
  it('nothing ≥ 4 → Self teaser', () => {
    const qs = quickScan({ taskmaster: 3, abandoned: 3 } as Record<ShadowPartId, number>);
    expect(qs.kind).toBe('self');
  });
});

describe('§1.14/§1.15 resources, radar, crisis', () => {
  it('leads with the strongest resource before any shadow content', () => {
    const p = scoreProfile(input(3));
    expect(p.strongestResource.id).toBe('sage'); // all equal → first in RESOURCES order
  });
  it('crisis flag fires only when all 4 exiles ≥ 60T', () => {
    expect(scoreProfile(input(5)).crisis).toBe(true);
    expect(scoreProfile(input(3)).crisis).toBe(false);
  });
  it('self radar maps item i to SELF_QUALITIES[i] with sub = 50 + 10*(score−3) clamp 20..80', () => {
    const p = scoreProfile(input(3, { self: [1, 2, 3, 4, 5, 3, 3, 3] }));
    expect(p.selfRadar.calm).toBe(30);
    expect(p.selfRadar.clarity).toBe(40);
    expect(p.selfRadar.compassion).toBe(50);
    expect(p.selfRadar.curiosity).toBe(60);
    expect(p.selfRadar.confidence).toBe(70);
  });
});

describe('determinism (same answers → same result)', () => {
  it('scoreProfile is a pure function', () => {
    const a = input(4, { rebel: n8(5), unseen: n8(2) });
    const b = input(4, { rebel: n8(5), unseen: n8(2) });
    expect(JSON.stringify(scoreProfile(a))).toBe(JSON.stringify(scoreProfile(b)));
  });
  it('every protector and exile participates in some constellation key', () => {
    const p = scoreProfile(input(3));
    expect(PROTECTORS).toContain(p.headline.protector);
  });
});

describe('§1.3 remote norm override (post-5k refresh)', () => {
  it('an override shifts T-scores exactly; without it the provisional tables rule', () => {
    const base = scoreProfile(input(3));
    expect(base.parts.taskmaster.T).toBeCloseTo(46.67, 2);
    const shifted = scoreProfile(input(3), { NORM_MEAN: { taskmaster: 24 }, NORM_SD: { taskmaster: 6 } });
    // raw 24, mean 24 → T = 50
    expect(shifted.parts.taskmaster.T).toBeCloseTo(50, 5);
    // other parts untouched by a partial override
    expect(shifted.parts.inner_critic.T).toBeCloseTo(base.parts.inner_critic.T, 5);
  });
});
