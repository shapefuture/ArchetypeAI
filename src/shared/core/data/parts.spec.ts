import { describe, it, expect } from 'vitest';
import {
  MANAGERS, FIREFIGHTERS, EXILES, RESOURCES, SHADOW_PARTS, PROTECTORS,
  NORM_MEAN, NORM_SD, TRIGGER, GUARDS, COMPLEXES, NEED, tierOf, partClass,
  SUBTYPES, type ProtectorId, type ExileId,
} from './parts';
import { CONSTELLATIONS, constellation } from './constellations';

describe('parts taxonomy invariants', () => {
  it('has 14 shadow parts (7 managers + 3 firefighters + 4 exiles)', () => {
    expect(MANAGERS.length).toBe(7);
    expect(FIREFIGHTERS.length).toBe(3);
    expect(EXILES.length).toBe(4);
    expect(SHADOW_PARTS.length).toBe(14);
    expect(RESOURCES.length).toBe(4);
  });
  it('has a norm mean+sd for every shadow part', () => {
    for (const p of SHADOW_PARTS) {
      expect(NORM_MEAN[p]).toBeGreaterThan(0);
      expect(NORM_SD[p]).toBeGreaterThan(0);
    }
  });
  it('TRIGGER has 10 protector rows of 4 exile cols each', () => {
    const rows = Object.keys(TRIGGER);
    expect(rows.length).toBe(10);
    for (const r of rows) expect(TRIGGER[r as keyof typeof TRIGGER].length).toBe(4);
  });
  it('every protector guards at least one exile with weights summing ~1', () => {
    for (const [p, g] of Object.entries(GUARDS)) {
      const sum = Object.values(g).reduce((s, w) => s + (w ?? 0), 0);
      expect(sum).toBeCloseTo(1, 5);
    }
  });
  it('every complex weight vector sums to ~1', () => {
    for (const c of Object.values(COMPLEXES)) {
      const sum = Object.values(c.weights).reduce((s, w) => s + (w ?? 0), 0);
      expect(sum).toBeCloseTo(1, 5);
    }
  });
  it('assigns a need to all 18 parts and classes correctly', () => {
    expect(Object.keys(NEED).length).toBe(18);
    expect(partClass('taskmaster')).toBe('manager');
    expect(partClass('numb')).toBe('firefighter');
    expect(partClass('abandoned')).toBe('exile');
    expect(partClass('sage')).toBe('resource');
  });
  it('activation tiers partition the T range', () => {
    expect(tierOf(30)).toBe('dormant');
    expect(tierOf(50)).toBe('present');
    expect(tierOf(65)).toBe('prominent');
    expect(tierOf(75)).toBe('dominant');
  });
});

describe('SUBTYPES (REVAMP §1.5)', () => {
  it('every shadow family has base + 4 colorers, base first, slugs unique', () => {
    for (const family of SHADOW_PARTS) {
      const list = SUBTYPES[family];
      expect(list.length).toBe(5);
      expect(list[0].colorer).toBeNull();
      const colorers = list.slice(1).map(s => s.colorer);
      expect(new Set(colorers).size).toBe(4);
      for (const s of list) {
        expect(s.colorer === null || SHADOW_PARTS.includes(s.colorer)).toBe(true);
      }
      expect(new Set(list.map(s => s.slug)).size).toBe(5);
    }
  });
  it('56 colored subtypes total (14 families x 4)', () => {
    const colored = SHADOW_PARTS.reduce((n, f) => n + SUBTYPES[f].length - 1, 0);
    expect(colored).toBe(56);
  });
  it('spec-locked subtype names are verbatim', () => {
    expect(SUBTYPES.taskmaster[2].name).toBe('The Machine');
    expect(SUBTYPES.pleaser[1].name).toBe('The Clinger');
    expect(SUBTYPES.analyst[4].name).toBe('The Watchtower');
    expect(SUBTYPES.ashamed[1].name).toBe('The Branded One');
    expect(SUBTYPES.unseen[3].name).toBe('The Unheard Scream');
  });
});

describe('CONSTELLATIONS (REVAMP §1.4)', () => {
  it('has exactly 40 unique protector x exile combos covering the full grid', () => {
    expect(CONSTELLATIONS.length).toBe(40);
    const keys = new Set(CONSTELLATIONS.map(d => `${d.protector}x${d.exile}`));
    expect(keys.size).toBe(40);
    for (const p of PROTECTORS) for (const e of EXILES) {
      expect(keys.has(`${p}x${e}`)).toBe(true);
    }
  });
  it('locks the four spec-given names verbatim and flags them final', () => {
    const locked: [ProtectorId, ExileId, string][] = [
      ['taskmaster', 'ashamed', 'The Proving Ground'],
      ['pleaser', 'abandoned', 'The Tending Fire'],
      ['analyst', 'frightened', 'The Glass Observatory'],
      ['rebel', 'unseen', 'The Signal Flare'],
    ];
    for (const [p, e, name] of locked) {
      const d = constellation(p, e);
      expect(d.name).toBe(name);
      expect(d.final).toBe(true);
    }
  });
  it('lookup throws on an impossible combo rather than inventing a name', () => {
    expect(() => constellation('sage' as unknown as ProtectorId, 'ashamed')).toThrow();
  });
});
