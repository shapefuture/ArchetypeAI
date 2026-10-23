/**
 * REVAMP §2 — synastry fixtures, written BEFORE implementation.
 * Six canonical dyads with hand-computed exact values.
 * Σ TRIGGER over all rows = 16.3 (row sums: 1.5,1.4,1.0,1.8,1.7,2.1,1.8,1.4,1.9,1.7).
 */
import { describe, it, expect } from 'vitest';
import {
  makeProfile, synastry, type SynastryProfile,
} from './synastry-v2';
import { SHADOW_PARTS, PROTECTORS, EXILES, RESOURCES, COMPLEXES, type ShadowPartId, type ComplexId } from './parts';

const T = (v: number) => {
  const t = {} as Record<ShadowPartId, number>;
  for (const p of SHADOW_PARTS) t[p] = v;
  return t;
};
const res = (v: number) => {
  const r = {} as Record<string, number>;
  for (const x of RESOURCES) r[x] = v;
  return r as Record<'sage' | 'warrior' | 'caregiver' | 'explorer', number>;
};
const cx = (v: number) => {
  const c = {} as Record<ComplexId, number>;
  for (const id of Object.keys(COMPLEXES) as ComplexId[]) c[id] = v;
  return c;
};

describe('dyad 1 — identical neutral profiles (all 50T)', () => {
  const A = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50 });
  const B = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50 });
  const s = synastry(A, B);
  it('act=0 everywhere → FRICTION 0; RESONANCE 100; BALANCE 40; SAFETY 50; GROWTH 50.5; NOURISH 0', () => {
    expect(s.FRICTION).toBeCloseTo(0, 5);
    expect(s.RESONANCE).toBeCloseTo(100, 5);
    expect(s.BALANCE).toBeCloseTo(40, 5);
    expect(s.SAFETY).toBeCloseTo(50, 5);
    expect(s.GROWTH).toBeCloseTo(50.5, 5);
    expect(s.NOURISH).toBeCloseTo(0, 5);
  });
  it('loop resolves by table order on ties: taskmaster × inner_critic → The Cold War', () => {
    expect(s.loop.aProtector).toBe('taskmaster');
    expect(s.loop.bGuardian).toBe('inner_critic');
    expect(s.loop.name).toBe('The Cold War');
  });
  it('no active complexes → no interlocks, framed as good', () => {
    expect(s.interlocks).toEqual([]);
    expect(s.noLockedStoryline).toBe(true);
  });
  it('three-way attachment tie → anxious → MUTUAL_ESCALATION', () => {
    expect(s.dance).toBe('MUTUAL_ESCALATION');
  });
});

describe('dyad 2 — A protectors 80T, B exiles 80T (max cross-trigger)', () => {
  const base = T(50);
  const A = makeProfile({ T: { ...base }, selfEnergy: 50, anxious: 50, avoidant: 50 });
  for (const p of PROTECTORS) A.T[p] = 80;
  for (const e of EXILES) A.T[e] = 45;
  const B = makeProfile({ T: { ...base }, selfEnergy: 50, anxious: 50, avoidant: 50 });
  for (const p of PROTECTORS) B.T[p] = 45;
  for (const e of EXILES) B.T[e] = 80;
  const s = synastry(A, B);
  it('trigger(A→B) = 1 * 7/6 * 16.3 = 19.017 → FRICTION clamps to 100', () => {
    expect(s.debug.triggerAtoB).toBeCloseTo((7 / 6) * 16.3, 3);
    expect(s.FRICTION).toBeCloseTo(100, 5);
  });
  it('RESONANCE = 100 − 35*2.5 = 12.5; GROWTH clamps to 0 (100 − |100−45|*2.2 < 0)', () => {
    expect(s.RESONANCE).toBeCloseTo(12.5, 5);
    expect(s.GROWTH).toBe(0);
  });
});

describe('dyad 3 — NOURISH (resources feed hungers)', () => {
  it('love hunger fed by caregiver 75T: feed=1 → NOURISH 50', () => {
    const B = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, hungers: { love: 20, belonging: 10 } });
    const A = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, resources: res(50) });
    A.resources.caregiver = 75;
    const s = synastry(A, B);
    expect(s.NOURISH).toBeCloseTo(50, 5);
  });
  it('safety→caregiver and worth→sage mapping applies', () => {
    const B = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, hungers: { safety: 20, worth: 10 } });
    const A = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, resources: res(45) });
    A.resources.caregiver = 75;
    A.resources.sage = 60;
    const s = synastry(A, B);
    // feed(A→B) = 1*1 + 0.5*0.5 = 1.25; feed(B→A) = 0 → NOURISH = 62.5
    expect(s.NOURISH).toBeCloseTo(62.5, 5);
  });
});

describe('dyad 4 — interlocks modulate composites', () => {
  it('anchor/sail fires at mean activation; +6 FRICTION, +4 RESONANCE per fired interlock', () => {
    const A = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, complexes: cx(50) });
    A.complexes.abandonment = 70;
    const B = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, complexes: cx(50) });
    B.complexes.engulfment = 60;
    const s = synastry(A, B);
    expect(s.interlocks.length).toBe(1);
    expect(s.interlocks[0].name).toBe('The Anchor and the Sail');
    expect(s.interlocks[0].strength).toBeCloseTo(65, 5);
    expect(s.FRICTION).toBeCloseTo(6, 5);
    expect(s.RESONANCE).toBeCloseTo(100, 5); // base 100 + 4, clamped to 100
  });
  it('same-complex lock requires the complex active in BOTH', () => {
    const A = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, complexes: cx(50) });
    A.complexes.inferiority = 70;
    const B = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50, complexes: cx(50) });
    B.complexes.inferiority = 40;
    expect(synastry(A, B).interlocks).toEqual([]);
  });
});

describe('dyad 5 — attachment dance', () => {
  const mk = (anxious: number, avoidant: number, secure = 50, selfEnergy = 50) =>
    makeProfile({ T: T(50), selfEnergy, anxious, avoidant, secure });
  it('exact mapping table', () => {
    expect(synastry(mk(50, 50, 70), mk(50, 50, 70)).dance).toBe('HEALING_CONTAINER'); // secure×secure
    expect(synastry(mk(50, 50, 70), mk(70, 40)).dance).toBe('HEALING_CONTAINER'); // secure×anxious
    expect(synastry(mk(40, 70), mk(50, 50, 70)).dance).toBe('PARALLEL_SOVEREIGNTY'); // avoidant×secure
    expect(synastry(mk(70, 40), mk(40, 70)).dance).toBe('PURSUE_WITHDRAW_1'); // A anxious
    expect(synastry(mk(40, 70), mk(70, 40)).dance).toBe('PURSUE_WITHDRAW_2'); // B anxious
    expect(synastry(mk(70, 40), mk(70, 40)).dance).toBe('MUTUAL_ESCALATION');
    expect(synastry(mk(40, 70), mk(40, 70)).dance).toBe('DEEP_FREEZE');
    expect(synastry(mk(65, 65), mk(40, 60)).dance).toBe('VOLATILE_BOND'); // A disorganized overrides
    expect(synastry(mk(40, 60), mk(65, 65)).dance).toBe('VOLATILE_BOND'); // B disorganized
  });
});

describe('dyad 6 — loop names (overrides + classes)', () => {
  const neutral = { selfEnergy: 50, anxious: 50, avoidant: 50 };
  it('pleaser-involved → The Vanishing Act', () => {
    const A = makeProfile({ ...neutral, T: T(45) });
    A.T.pleaser = 80;
    const B = makeProfile({ ...neutral, T: T(45) });
    B.T.abandoned = 80;
    const s = synastry(A, B);
    expect(s.loop.aProtector).toBe('pleaser');
    expect(s.loop.name).toBe('The Vanishing Act');
  });
  it('analyst × abandoned exile → The Long Winter', () => {
    const A = makeProfile({ ...neutral, T: T(45) });
    A.T.analyst = 80;
    const B = makeProfile({ ...neutral, T: T(45) });
    B.T.abandoned = 80;
    expect(synastry(A, B).loop.name).toBe('The Long Winter');
  });
  it('rebel × controller guardian → The Standoff', () => {
    const A = makeProfile({ ...neutral, T: T(45) });
    A.T.rebel = 80;
    const B = makeProfile({ ...neutral, T: T(45) });
    B.T.controller = 80; // guardian of frightened, the exile rebel pokes hardest
    B.T.frightened = 70;
    const s = synastry(A, B);
    expect(s.loop.bGuardian).toBe('controller');
    expect(s.loop.name).toBe('The Standoff');
  });
  it('firefighter × firefighter → The Wildfire; manager × firefighter → The Pursuit', () => {
    const A = makeProfile({ ...neutral, T: T(45) });
    A.T.rebel = 80; // ff; pokes B's frightened hardest (.8)
    const B = makeProfile({ ...neutral, T: T(45) });
    B.T.numb = 80;  // ff; guards frightened
    B.T.frightened = 70;
    const s1 = synastry(A, B);
    expect(s1.loop.aProtector).toBe('rebel');
    expect(s1.loop.bGuardian).toBe('numb');
    expect(s1.loop.name).toBe('The Wildfire');
    const A2 = makeProfile({ ...neutral, T: T(45) });
    A2.T.taskmaster = 80; // manager; pokes ashamed hardest (.7)
    const B2 = makeProfile({ ...neutral, T: T(45) });
    B2.T.numb = 80;       // ff; guards ashamed (.3)
    B2.T.ashamed = 70;
    const s2 = synastry(A2, B2);
    expect(s2.loop.name).toBe('The Pursuit');
  });
});

describe('§2.3 BALANCE complementarity', () => {
  it('+1 when A high on one side of a POLARIZATION pair and B high on the other', () => {
    const A = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50 });
    A.T.taskmaster = 70;
    const B = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50 });
    B.T.numb = 70;
    const s = synastry(A, B);
    expect(s.BALANCE).toBeCloseTo(50, 5); // 40 + 10*1
  });
});

describe('no compatibility % ever (§2.3)', () => {
  it('result exposes six axes + named dynamics, no single percent field', () => {
    const A = makeProfile({ T: T(50), selfEnergy: 50, anxious: 50, avoidant: 50 });
    const s = synastry(A, A as SynastryProfile);
    const keys = Object.keys(s);
    expect(keys).not.toContain('compatibility');
    expect(keys).not.toContain('score');
    expect(keys).toContain('FRICTION');
    expect(keys).toContain('loop');
  });
});
