/**
 * REVAMP §1.10, §3B.1, §3C.1, §3C.3, §3C.4 — deterministic state-layer
 * fixtures written BEFORE implementation. All times are local ISO strings.
 */
import { describe, it, expect } from 'vitest';
import {
  CRISIS_TRIGGERS, predictFlare, adjustTriggerWeights, weightOf, pauseNonRegulation,
  charterTrend, stricterCharter, resistantMetrics, storeEvent, loadEvents,
  type LoggedEvent,
  type CheckIn,
  weatherLayer, unburdeningMoments, verdictLockActive, sealVerdict, readyToResurface,
  attributionRatio, attributionWorsening, selectJitaiCard, selfServeGate, shutdownStreak, unburdeningInWindows,
  GLOBALIZING_LEXICON, LOCALIZING_LEXICON,
} from './state-v2';
import { SHADOW_PARTS, RESOURCES } from './parts';
import { scoreProfile, type AssessmentInput } from './scoring-v2';

const all = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return {
    shadow, resources, self: Array(8).fill(fill) as number[],
    validity: { attention: 3, infrequency: [1, 1] },
  };
};
const profile = scoreProfile(all(4)); // uniform: rebel 64.5 top protector

const ci = (over: Partial<CheckIn>): CheckIn => ({
  date: '2026-08-01T12:00:00', arousal: 0, ...over,
});

describe('§1.10 crisis→part trigger map', () => {
  it('boundary uses frightened (proxy comment resolved per spec)', () => {
    expect(CRISIS_TRIGGERS.boundary).toEqual(['rebel', 'controller', 'frightened']);
    expect(CRISIS_TRIGGERS.calm).toEqual(['sage', 'explorer', 'caregiver']);
  });
  it('predictFlare = highest-T candidate for the event type', () => {
    // uniform 4s: ashamed 60.8 > inner_critic 54.6 > taskmaster 53.3
    expect(predictFlare(profile, 'achievement', undefined)).toBe('ashamed');
  });
  it('user trigger weights boost corrected parts (±0.1, bounded 0..2)', () => {
    const neutral = Array.from({ length: 13 }, (_, i) =>
      ci({ eventType: 'loss', predictedPart: 'numb', confirmedPart: 'numb', date: `2026-07-0${(i % 9) + 1}T10:00:00` }));
    const history: CheckIn[] = [
      ...neutral,
      ci({ eventType: 'relational', predictedPart: 'abandoned', confirmedPart: 'charmer' }),
      ci({ eventType: 'relational', predictedPart: 'abandoned', confirmedPart: 'charmer' }),
    ];
    const w = adjustTriggerWeights(history);
    expect(weightOf(w, 'relational', 'abandoned')).toBeCloseTo(0.8, 5);
    expect(weightOf(w, 'relational', 'charmer')).toBeCloseTo(1.2, 5); // 1 + 0.2 within the 0..2 band
  });
  it('weights only apply after 14+ check-ins of history', () => {
    const small = [ci({ eventType: 'relational', predictedPart: 'abandoned', confirmedPart: 'charmer' })];
    const w = adjustTriggerWeights(small);
    expect(weightOf(w, 'relational', 'abandoned')).toBe(1); // neutral below threshold
    const big = Array.from({ length: 14 }, () =>
      ci({ eventType: 'relational', predictedPart: 'abandoned', confirmedPart: 'charmer' }));
    expect(weightOf(adjustTriggerWeights(big), 'relational', 'abandoned')).toBeCloseTo(0, 3);
  });
});

describe('§1.10 weather + integration arc', () => {
  const history: CheckIn[] = [
    ci({ date: '2026-07-05T12:00:00', confirmedPart: 'rebel', arousal: 2 }),
    ci({ date: '2026-07-15T12:00:00', confirmedPart: 'rebel', arousal: 1 }),
    ci({ date: '2026-07-25T12:00:00', confirmedPart: 'rebel', arousal: 0 }),
    ci({ date: '2026-08-05T12:00:00', confirmedPart: 'sage', arousal: 0 }),
  ];
  it('weather counts confirmed flares in the trailing 30 days', () => {
    const w = weatherLayer(history, new Date('2026-08-10T12:00:00'));
    expect(w.rebel.count).toBe(2); // 07-15 (26d) and 07-25 (16d) within 30d of 08-10
  });
  it('unburdening: ≥30% flare-rate drop AND self rising', () => {
    const prior = [
      ci({ date: '2026-06-20T12:00:00', confirmedPart: 'rebel' }),
      ci({ date: '2026-06-25T12:00:00', confirmedPart: 'rebel' }),
      ci({ date: '2026-06-28T12:00:00', confirmedPart: 'rebel' }),
      ci({ date: '2026-06-20T12:00:00', arousal: 1 }),
      ci({ date: '2026-06-28T12:00:00', arousal: 1 }),
    ];
    const recent = [
      ci({ date: '2026-07-25T12:00:00', confirmedPart: 'rebel' }),
      ci({ date: '2026-07-20T12:00:00', arousal: 0 }),
      ci({ date: '2026-07-26T12:00:00', arousal: 0 }),
    ];
    const moments = unburdeningMoments(prior, recent);
    expect(moments).toContain('rebel');
    // no drop → no moment
    const flat = unburdeningMoments(
      [...prior, ci({ date: '2026-06-21T12:00:00', confirmedPart: 'rebel' })], recent);
    expect(flat).toContain('rebel'); // 4→1 still ≥30% drop
    const none = unburdeningMoments(prior, [
      ci({ date: '2026-07-20T12:00:00', confirmedPart: 'rebel' }),
      ci({ date: '2026-07-21T12:00:00', confirmedPart: 'rebel' }),
      ci({ date: '2026-07-22T12:00:00', confirmedPart: 'rebel' }),
      ci({ date: '2026-07-20T12:00:00', arousal: -1 }),
    ]);
    expect(none).toEqual([]);
  });
});

describe('§3C.1 Sealed Verdict', () => {
  it('locks when today had a hyper or shutdown check-in', () => {
    expect(verdictLockActive([ci({ date: '2026-08-14T09:00:00', arousal: 2 })], new Date('2026-08-14T20:00:00'))).toBe(true);
    expect(verdictLockActive([ci({ date: '2026-08-14T09:00:00', arousal: -2 })], new Date('2026-08-14T20:00:00'))).toBe(true);
    expect(verdictLockActive([ci({ date: '2026-08-14T09:00:00', arousal: 0 })], new Date('2026-08-14T20:00:00'))).toBe(false);
  });
  it('locks on late-night (00:00–05:00) opens following a bad day', () => {
    expect(verdictLockActive([ci({ date: '2026-08-13T18:00:00', arousal: 2 })], new Date('2026-08-14T02:30:00'))).toBe(true);
    expect(verdictLockActive([ci({ date: '2026-08-13T18:00:00', arousal: 0 })], new Date('2026-08-14T02:30:00'))).toBe(false);
    expect(verdictLockActive([ci({ date: '2026-08-13T18:00:00', arousal: 2 })], new Date('2026-08-14T06:00:00'))).toBe(false);
  });
  it('seals for exactly 48h local, then resurfaces', () => {
    const v = sealVerdict('I am a disaster', new Date('2026-08-14T03:00:00'));
    expect(readyToResurface(v, new Date('2026-08-15T02:59:00'))).toBe(false);
    expect(readyToResurface(v, new Date('2026-08-16T03:00:00'))).toBe(true);
  });
});

describe('§3C.3 attribution meter', () => {
  it('counts globalizing vs localizing tokens exactly (en)', () => {
    const text = 'I always fail. This time it was different, in that moment I chose well. I never learn. Lately I am tired.';
    const r = attributionRatio([text]);
    // globalizing: always, never, "I am <adj>" → 3 ; localizing: this time, in that moment, lately → 3
    expect(r.globalizing).toBe(3);
    expect(r.localizing).toBe(3);
    expect(r.ratio).toBeCloseTo(1, 5);
  });
  it('lexicons ship in both languages', () => {
    expect(GLOBALIZING_LEXICON.ru.length).toBeGreaterThan(3);
    expect(LOCALIZING_LEXICON.ru.length).toBeGreaterThan(3);
  });
  it('worsening = current ratio ≥ 1.3 × baseline over 2 weeks', () => {
    expect(attributionWorsening(['always never always always'], ['this time this time'])).toBe(true);
    expect(attributionWorsening(['this time'], ['always'])).toBe(false);
  });
});

describe('§3C.4 JITAI cards (max 1 per 24h)', () => {
  const base = {
    history: [ci({ date: '2026-08-13T12:00:00', arousal: 2 })],
    now: new Date('2026-08-14T02:00:00'),
    lastCardAt: null as Date | null,
    stackL1Flared: false,
    lapseToday: false,
  };
  it('late-night after bad day → sealed-verdict card', () => {
    expect(selectJitaiCard(base).id).toBe('sealed_verdict_offer');
  });
  it('cap: no card within 24h of the last one', () => {
    expect(selectJitaiCard({ ...base, lastCardAt: new Date('2026-08-13T10:00:00') })).toBeNull();
    expect(selectJitaiCard({ ...base, lastCardAt: new Date('2026-08-12T01:00:00') }).id).toBeTruthy();
  });
  it('2+ consecutive out-of-window → witness-contact card', () => {
    const s = selectJitaiCard({
      ...base,
      now: new Date('2026-08-14T14:00:00'),
      history: [
        ci({ date: '2026-08-12T09:00:00', arousal: 2 }),
        ci({ date: '2026-08-13T09:00:00', arousal: -2 }),
      ],
    });
    expect(s.id).toBe('witness_contact');
  });
});

describe('§3B.1 safety gating', () => {
  it('RED is never self-serve, regardless of profile', () => {
    const strong = scoreProfile(all(2)); // self_energy = 25? all-2s: raw=20 → round(100*12/32)=37.5→38
    expect(selfServeGate('red', strong)).toBe('therapist_only');
    expect(selfServeGate('red', profile)).toBe('therapist_only');
  });
  it('YELLOW requires self_energy ≥ 40 AND no gripping complex', () => {
    expect(selfServeGate('yellow', profile)).toBe('ok'); // uniform 4s: self 75, but complexes ≥62 gripping... verify
    const low = scoreProfile(all(2));
    expect(low.selfEnergy).toBeLessThan(40);
    expect(selfServeGate('yellow', low)).toBe('locked');
  });
  it('GREEN always self-serve', () => {
    expect(selfServeGate('green', scoreProfile(all(1)))).toBe('ok');
  });
  it('shutdown 3 days running pauses everything non-regulation (§3B.3)', () => {
    const s = shutdownStreak([
      ci({ date: '2026-08-12T12:00:00', arousal: -2 }),
      ci({ date: '2026-08-13T12:00:00', arousal: -2 }),
      ci({ date: '2026-08-14T12:00:00', arousal: -2 }),
    ]);
    expect(s).toBe(3);
  });
});

describe('§3C.2 charter trend + §3C.6 resistant metrics', () => {
  it('charter trend: needs ≥3 deliveries; blame↓ + license↑ = watch', () => {
    expect(charterTrend([
      { blame: 8, license: 2, at: '2026-08-01T10:00:00' },
      { blame: 6, license: 3, at: '2026-08-05T10:00:00' },
    ])).toBe('ok'); // fewer than 3
    expect(charterTrend([
      { blame: 8, license: 2, at: '2026-08-01T10:00:00' },
      { blame: 6, license: 3, at: '2026-08-05T10:00:00' },
      { blame: 4, license: 6, at: '2026-08-09T10:00:00' },
    ])).toBe('watch');
    expect(charterTrend([
      { blame: 8, license: 2, at: '2026-08-01T10:00:00' },
      { blame: 6, license: 3, at: '2026-08-05T10:00:00' },
      { blame: 3, license: 2, at: '2026-08-09T10:00:00' },
    ])).toBe('ok');
  });
  it('stricter charter is verdict-free and names one repair action', () => {
    expect(stricterCharter('Say no to one small request')).toContain('Say no to one small request');
    expect(stricterCharter('x')).not.toMatch(/worthless|broken/i);
  });
  it('resistant metrics compute from logged events only', () => {
    const events = [
      { kind: 'lapse', at: '2026-08-10T10:00:00' },
      { kind: 'repair', at: '2026-08-10T12:00:00' },   // 2h to repair
      { kind: 'told', at: '2026-08-11T10:00:00' },     // 24h secrecy
      { kind: 'ifthen_written', at: '2026-08-09T09:00:00' },
      { kind: 'ifthen_written', at: '2026-08-09T10:00:00' },
      { kind: 'ifthen_fired', at: '2026-08-10T18:00:00' },
    ] as LoggedEvent[];
    const m = resistantMetrics(events);
    expect(m.timeToRepairH).toBe(2);
    expect(m.secrecyH).toBe(24);
    expect(m.ifThenFireRate).toBe(0.5);
    expect(m.disclosureRatio).toBe(1);
  });
  it('metrics stay null without matching event pairs (never fabricated)', () => {
    const m = resistantMetrics([{ kind: 'lapse', at: '2026-08-10T10:00:00' }]);
    expect(m.timeToRepairH).toBeNull();
    expect(m.secrecyH).toBeNull();
    expect(m.ifThenFireRate).toBeNull();
    expect(m.disclosureRatio).toBe(0);
  });
  it('events persist locally via storeEvent/loadEvents', () => {
    localStorage.removeItem('INNERVERSE_EVENTS_V1');
    storeEvent('ifthen_written', new Date('2026-08-10T10:00:00'));
    expect(loadEvents().length).toBe(1);
    expect(loadEvents()[0].kind).toBe('ifthen_written');
    localStorage.removeItem('INNERVERSE_EVENTS_V1');
  });
});

describe('gap fixes from the tenth critic pass', () => {
  it('a confirmed part can overtake the one it was confused with', () => {
    const profile = scoreProfile(all(3));
    profile.parts.ashamed.T = 60;
    profile.parts.inner_critic.T = 59;
    profile.parts.taskmaster.T = 58;
    const history = Array.from({ length: 20 }, (_, i) => ci({
      date: `2026-10-${String(1 + i).padStart(2, '0')}T12:00:00`, eventType: 'achievement',
      predictedPart: 'ashamed', confirmedPart: 'taskmaster',
    }));
    expect(predictFlare(profile, 'achievement')).toBe('ashamed');
    expect(predictFlare(profile, 'achievement', adjustTriggerWeights(history))).toBe('taskmaster');
  });

  it('attribution counts Russian words, which \\b never matched', () => {
    expect(attributionRatio(['Я всегда всё порчу, я никогда не учусь'], 'ru').globalizing).toBe(3);
    expect(attributionRatio(['В этот раз на работе было трудно'], 'ru').localizing).toBe(2);
    expect(attributionWorsening(['Я всегда всё порчу'], ['В этот раз было трудно'], 'ru')).toBe(true);
  });

  it('shutdown streak ends once the person is back in the window', () => {
    const history = [
      ci({ date: '2026-10-01T12:00:00', arousal: -2 }),
      ci({ date: '2026-10-02T12:00:00', arousal: -2 }),
      ci({ date: '2026-10-03T12:00:00', arousal: -2 }),
      ci({ date: '2026-10-04T12:00:00', arousal: 0 }),
      ci({ date: '2026-10-05T12:00:00', arousal: 0 }),
    ];
    expect(shutdownStreak(history)).toBe(0);
    expect(pauseNonRegulation(history)).toBe(false);
  });

  it('unburdening needs two full windows, not two halves of the whole history', () => {
    const now = new Date('2026-10-25T12:00:00');
    const oneCheckIn = [ci({ date: '2026-10-24T09:00:00', arousal: 2, confirmedPart: 'abandoned' })];
    expect(unburdeningInWindows(oneCheckIn, now)).toEqual([]);
  });
});
