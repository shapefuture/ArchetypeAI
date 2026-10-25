import { describe, it, expect } from 'vitest';
import {
  EXERCISES, EXERCISE_TYPES, suggestExercise, chapterUnlocked, unlockedTypes,
  hasBehavioralHook, SELECTOR_PRIORITY, depthCap, allowedDepth, containerReady, redAllowed,
  ladderRung, integrated, selectorMatches,
  type ChapterState,
} from './exercises';
import { SHADOW_PARTS, RESOURCES } from './parts';
import { scoreProfile, type AssessmentInput } from './scoring-v2';
import { selfServeGate, type CheckIn } from './state-v2';

const all = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return { shadow, resources, self: Array(8).fill(fill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

const baseState: ChapterState = {
  descentComplete: true, daysOfCheckIns: 0, partDialogueCompleted: false,
  synastryRun: false, therapistLinked: false,
};

describe('exercise library (§3B.2, one per type seeded)', () => {
  it('ships all 22 types with en/ru parity and ≤7 steps each (OODA-shaped)', () => {
    expect(Object.keys(EXERCISE_TYPES).length).toBe(22);
    for (const e of EXERCISES) {
      expect(e.title.en.length).toBeGreaterThan(3);
      expect(e.title.ru.length).toBeGreaterThan(3);
      expect(e.steps.en.length).toBeGreaterThanOrEqual(3);
      expect(e.steps.en.length).toBe(e.steps.ru.length);
      expect(e.steps.en.length).toBeLessThanOrEqual(7);
      expect(hasBehavioralHook(e)).toBe(true); // §3C.8: no pure narrative
    }
  });
  it('every YELLOW/RED exercise carries a mandatory stop rule', () => {
    for (const e of EXERCISES) {
      const gate = EXERCISE_TYPES[e.type].gate;
      if (gate !== 'green') {
        expect(e.stopRule, `${e.id} (${gate}) needs a stop rule`).toBeDefined();
        expect(e.stopRule!.en.length).toBeGreaterThan(10);
        expect(e.stopRule!.ru.length).toBeGreaterThan(10);
      }
    }
  });
  it('RED exile_witness is homework-between-sessions only', () => {
    expect(EXERCISE_TYPES.exile_witness.gate).toBe('red');
    const letter = EXERCISES.find(e => e.type === 'exile_witness')!;
    expect(letter.stopRule!.en).toContain('therapist');
  });
});

describe('suggestion engine (§3B.3 solo rules)', () => {
  it('RED is never suggested, whatever the profile', () => {
    const s = suggestExercise({
      profile: scoreProfile(all(5)), checkIns: [], now: new Date('2026-08-15T12:00:00'),
    });
    expect(s?.type.gate).not.toBe('red');
  });
  it('max one suggestion per 24h', () => {
    const now = new Date('2026-08-15T12:00:00');
    expect(suggestExercise({
      profile: scoreProfile(all(4)), checkIns: [], now,
      lastSuggestedAt: new Date('2026-08-15T02:00:00'),
    })).toBeNull();
    expect(suggestExercise({
      profile: scoreProfile(all(4)), checkIns: [], now,
      lastSuggestedAt: new Date('2026-08-13T02:00:00'),
    })).not.toBeNull();
  });
  it('respects selector priority: regulation outranks everything when out-of-window 3 of last 7 days', () => {
    const mk = (daysAgo: number, arousal: number) => ({
      date: new Date(2026, 7, 15 - daysAgo, 10).toISOString(), arousal: arousal as -1,
      confirmedPart: 'rebel' as const, eventType: 'boundary' as const,
    });
    const history = [mk(1, 2), mk(2, -2), mk(3, 1), mk(4, 0)];
    const s = suggestExercise({ profile: scoreProfile(all(4)), checkIns: history, now: new Date(2026, 7, 15, 12) });
    expect(s?.type.id).toBe('regulation');
  });
  it('unblending fires when a part is dominant (all-5s)', () => {
    // no out-of-window history → regulation skipped; dominant present → unblending.
    // all-5s also has gripping complexes and high exiles, which pauses everything but
    // regulation (§3B.3). This case is about priority, so take the gripping tier away.
    const p = scoreProfile(all(5));
    for (const c of Object.values(p.complexes)) c.tier = 'active';
    const s = suggestExercise({ profile: p, checkIns: [], now: new Date(2026, 7, 15, 12) });
    expect(s?.type.id).toBe('unblending');
  });
  it('YELLOW suggestions lock out when self_energy < 40 (all-1s profile)', () => {
    const low = scoreProfile(all(1));
    expect(selfServeGate('yellow', low)).toBe('locked');
    const s = suggestExercise({ profile: low, checkIns: [], now: new Date(2026, 7, 15, 12) });
    expect(s).not.toBeNull();
    expect(s?.type.gate).toBe('green'); // only GREEN may surface
  });
  it('selector priority order is exactly §3B.3', () => {
    expect(SELECTOR_PRIORITY).toEqual([
      'regulation', 'unblending', 'self_energy', 'resource', 'firefighter',
      'defusion', 'experiment', 'somatic', 'polarization', 'part_dialogue',
    ]);
  });
});

describe('practice path chapters (§3D.3)', () => {
  it('Chapter 5 is unreachable solo, by design', () => {
    const solo: ChapterState = { ...baseState, daysOfCheckIns: 30, partDialogueCompleted: true, synastryRun: true };
    expect(chapterUnlocked(5, solo)).toBe(false);
    expect(chapterUnlocked(5, { ...solo, therapistLinked: true })).toBe(true);
    expect(unlockedTypes(solo)).not.toContain('exile_witness');
  });
  it('chapter gates follow the spec unlocks', () => {
    expect(chapterUnlocked(1, { ...baseState, descentComplete: false })).toBe(false);
    expect(chapterUnlocked(1, baseState)).toBe(true);
    expect(chapterUnlocked(2, { ...baseState, daysOfCheckIns: 6 })).toBe(false);
    expect(chapterUnlocked(2, { ...baseState, daysOfCheckIns: 7 })).toBe(true);
    expect(chapterUnlocked(3, { ...baseState, partDialogueCompleted: false })).toBe(false);
    expect(chapterUnlocked(3, { ...baseState, partDialogueCompleted: true })).toBe(true);
    expect(chapterUnlocked(4, { ...baseState, synastryRun: true })).toBe(true);
    expect(chapterUnlocked(4, { ...baseState, therapistLinked: true })).toBe(true);
  });
});

describe('§3E.2 depth gate + RED container (step 14)', () => {
  it('need-beat never exceeds the resource cap', () => {
    const low = scoreProfile(all(1));   // self 25, resources 20 → cap 1
    const mid = scoreProfile(all(3));   // self 50, resources 45.6 → cap 2
    const high = scoreProfile(all(5));  // self 100, resources 72 → cap 3
    expect(depthCap(low)).toBe(1);
    expect(depthCap(mid)).toBe(2);
    expect(depthCap(high)).toBe(3);
    expect(allowedDepth(3, low)).toBe(1);
    expect(allowedDepth(3, mid)).toBe(2);
    expect(allowedDepth(1, high)).toBe(1);
  });
  it('RED requires Safe Place built AND a mobilized resource AND a therapist', () => {
    const p = scoreProfile(all(4)); // resources ≥ 50 mobilized
    const noContainer = { safePlaceBuilt: false, resourcesMobilized: true };
    const noResource = { safePlaceBuilt: true, resourcesMobilized: false };
    const weakProfile = scoreProfile(all(1)); // no resource ≥ 50
    expect(containerReady(p, noContainer)).toBe(false);
    expect(containerReady(weakProfile, { safePlaceBuilt: true, resourcesMobilized: false })).toBe(false);
    expect(containerReady(p, { safePlaceBuilt: true, resourcesMobilized: true })).toBe(true);
    // even with the container, RED still needs the therapist
    expect(redAllowed(p, { safePlaceBuilt: true, resourcesMobilized: true }, false)).toBe(false);
    expect(redAllowed(p, { safePlaceBuilt: true, resourcesMobilized: true }, true)).toBe(true);
  });
});

describe('§3C.5 proceduralization ladder', () => {
  it('rungs advance 0→5 in order', () => {
    expect(ladderRung({})).toBe(0);
    expect(ladderRung({ principleNamed: true })).toBe(1);
    expect(ladderRung({ principleNamed: true, ifThen: 'When X, I will Y' })).toBe(2);
    expect(ladderRung({ principleNamed: true, ifThen: 'When X, I will Y', rehearsed: true })).toBe(3);
    expect(ladderRung({ principleNamed: true, ifThen: 'When X, I will Y', rehearsed: true, liveRep: true })).toBe(4);
    expect(ladderRung({ principleNamed: true, ifThen: 'When X, I will Y', rehearsed: true, liveRep: true, verifiedUnderLoad: true })).toBe(5);
  });
  it('HARD RULE: reading/reflection alone never integrates (rungs 1–3 cap)', () => {
    expect(integrated({ principleNamed: true, ifThen: 'When X, I will Y', rehearsed: true })).toBe(false);
    expect(integrated({ principleNamed: true, ifThen: 'When X, I will Y', rehearsed: true, liveRep: true })).toBe(false);
    expect(integrated({ principleNamed: true, ifThen: 'When X, I will Y', rehearsed: true, liveRep: true, verifiedUnderLoad: true })).toBe(true);
  });
  it('a blank if-then plan does not count as rung 2', () => {
    expect(ladderRung({ principleNamed: true, ifThen: '   ' })).toBe(1);
  });
});

describe('gap fixes from the tenth critic pass', () => {
  const now = new Date('2026-08-15T12:00:00');
  const shutdownDays = (n: number): CheckIn[] => Array.from({ length: n }, (_, i) => ({
    date: new Date(2026, 7, 15 - i, 10).toISOString(), arousal: -2 as const,
  }));

  it('pauses everything but regulation after three shutdown days (§3B.3)', () => {
    const s = suggestExercise({ profile: scoreProfile(all(5)), checkIns: shutdownDays(3), now });
    expect(s?.type.id ?? 'none').toMatch(/^(regulation|none)$/);
  });

  it('pauses after a gripping complex with two exiles at 60T or more', () => {
    const p = scoreProfile(all(3));
    p.parts.ashamed.T = 66; p.parts.abandoned.T = 64;
    const complex = Object.values(p.complexes)[0];
    complex.tier = 'gripping';
    p.activeComplexes = [complex];
    p.selfEnergy = 60;
    const s = suggestExercise({ profile: p, checkIns: [], now });
    expect(s?.type.id ?? 'none').toMatch(/^(regulation|none)$/);
  });

  it('somatic is only suggested when a somatic zone is recorded', () => {
    const p = scoreProfile(all(3));
    p.selfEnergy = 60;
    expect(selectorMatches('somatic', p, [], now, 0)).toBe(false);
    expect(selectorMatches('somatic', p, [], now, 1)).toBe(true);
  });

  it('polarization fires on a polarization, not on a resource leak', () => {
    const p = scoreProfile(all(3));
    p.polarizations = [{ pair: ['controller', 'numb'], name: 'White-Knuckle–Checkout Cycle' }] as any;
    p.resourceLeaks = [];
    expect(selectorMatches('polarization', p, [], now)).toBe(true);
    expect(selectorMatches('polarization', { ...p, polarizations: [] }, [], now)).toBe(false);
  });

  it('a non-string if-then plan from a backup does not crash the ladder', () => {
    expect(ladderRung({ ifThen: 42 as unknown as string })).toBe(0);
    expect(ladderRung({ ifThen: { text: 'x' } as unknown as string, principleNamed: true })).toBe(1);
  });
});
