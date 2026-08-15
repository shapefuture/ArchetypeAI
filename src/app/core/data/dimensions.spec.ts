import { describe, it, expect } from 'vitest';
import { partDimensions, weakestAxis, AXIS_TARGET } from './dimensions';
import type { DimensionTelemetry } from './dimensions';
import { SHADOW_PARTS, RESOURCES } from './parts';
import type { AssessmentInput } from './scoring-v2';
import { scoreProfile } from './scoring-v2';

const input = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return { shadow, resources, self: Array(8).fill(fill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

const ci = (over: Partial<{ date: string; arousal: number; confirmedPart: string; eventType: string }>) => ({
  date: '2026-08-10T12:00:00', arousal: 0, ...over,
}) as never;

describe('§1.16 part dimensions — deterministic derivations', () => {
  const empty: DimensionTelemetry = { checkIns: [], coherenceCompletions: 0 };

  it('no telemetry → every axis neutral 50, never a verdict', () => {
    const d = partDimensions(input(3), empty);
    for (const p of SHADOW_PARTS) {
      expect(d[p].body).toBe(50);
      expect(d[p].role).toBe(50);
      expect(d[p].story).toBe(50);
      expect(d[p].driver).toBe(50);
      expect(d[p].attunement).toBe(50);
    }
  });

  it('Body: healthy somatic item (q8=5) with in-window flares scores high', () => {
    const t: DimensionTelemetry = {
      ...empty,
      checkIns: [ci({ confirmedPart: 'rebel', arousal: 0 }), ci({ confirmedPart: 'rebel', arousal: 0 })],
    };
    const d = partDimensions(input(5), t);
    expect(d.rebel.body).toBe(100); // 0.5*100 (item) + 0.5*100 (arousal at window)
  });

  it('Body: shutdown flares drag the axis down even with a healthy item', () => {
    const t: DimensionTelemetry = {
      ...empty,
      checkIns: [ci({ confirmedPart: 'rebel', arousal: -2 })],
    };
    const d = partDimensions(input(5), t);
    expect(d.rebel.body).toBe(50); // 0.5*100 + 0.5*0
  });

  it('Role: fires everywhere (6 event types) = rigid 0; one context = flexible', () => {
    const t: DimensionTelemetry = {
      ...empty,
      eventsByPart: {
        pleaser: ['relational', 'achievement', 'loss', 'boundary', 'change', 'calm'],
      },
    };
    const d = partDimensions(input(3), t);
    expect(d.pleaser.role).toBe(0);
    const t2: DimensionTelemetry = { ...empty, eventsByPart: { pleaser: ['relational'] } };
    expect(partDimensions(input(3), t2).pleaser.role).toBe(83);
  });

  it('Story: coherence completions lift; retake churn + worsening burden lower', () => {
    const steady: DimensionTelemetry = {
      ...empty, coherenceCompletions: 4, retakeTChange: { taskmaster: 0 }, burdenTrend: -1,
    };
    const churned: DimensionTelemetry = {
      ...empty, coherenceCompletions: 0, retakeTChange: { taskmaster: 8 }, burdenTrend: 3,
    };
    const a = partDimensions(input(3), steady).taskmaster.story;
    const b = partDimensions(input(3), churned).taskmaster.story;
    expect(a).toBeGreaterThan(b);
    expect(a).toBe(100);
    expect(b).toBe(32); // 0.5*0 + 0.3*60 + 0.2*70
  });

  it('Driver: all flares confirmed “took the wheel” → 0; noticed-and-chose → 100', () => {
    const driven: DimensionTelemetry = {
      ...empty,
      checkIns: [ci({ confirmedPart: 'numb' }), ci({ confirmedPart: 'numb' })],
    };
    const choosing: DimensionTelemetry = { ...empty, noticedAndChose: { numb: 3 } };
    expect(partDimensions(input(3), driven).numb.driver).toBe(0);
    expect(partDimensions(input(3), choosing).numb.driver).toBe(100);
  });

  it('Attunement: 4+ relationship events and high self-at-flare → ~high; master axis', () => {
    const held: DimensionTelemetry = {
      ...empty, attunementEvents: { ashamed: 4 }, selfAtFlare: { ashamed: 80 },
    };
    const d = partDimensions(input(3), held);
    expect(d.ashamed.attunement).toBe(0.7 * 100 + 0.3 * 80); // 94
  });

  it('deterministic: same telemetry → identical output', () => {
    const t: DimensionTelemetry = {
      ...empty,
      checkIns: [ci({ confirmedPart: 'rebel', arousal: 1, eventType: 'boundary' })],
      coherenceCompletions: 1,
    };
    expect(JSON.stringify(partDimensions(input(4), t)))
      .toBe(JSON.stringify(partDimensions(input(4), t)));
  });

  it('weakestAxis + AXIS_TARGET cover the §1.16 targeting map', () => {
    expect(weakestAxis({ body: 80, role: 80, story: 40, driver: 80, attunement: 80 })).toBe('story');
    expect(AXIS_TARGET.attunement).toContain('soft_gaze');
    expect(AXIS_TARGET.body).toContain('regulation');
  });
});
