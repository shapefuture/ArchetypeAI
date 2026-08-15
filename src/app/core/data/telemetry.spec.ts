import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordResponses, totalResponses, recordAndStore, loadTelemetry,
  exportTelemetry, partResponseTotals, type Distributions,
} from './telemetry';
import { SHADOW_PARTS, RESOURCES } from './parts';
import type { AssessmentInput } from './scoring-v2';

const input = (fill: number): AssessmentInput => {
  const shadow = {} as AssessmentInput['shadow'];
  for (const p of SHADOW_PARTS) shadow[p] = Array(8).fill(fill) as number[];
  const resources = {} as AssessmentInput['resources'];
  for (const r of RESOURCES) resources[r] = Array(6).fill(fill) as number[];
  return { shadow, resources, self: Array(8).fill(fill) as number[], validity: { attention: 3, infrequency: [1, 1] } };
};

describe('telemetry (§4 step 10)', () => {
  beforeEach(() => localStorage.clear());

  it('records every scored item as a per-item distribution', () => {
    const d = recordResponses(input(4));
    expect(d['items.taskmaster.q1']).toBeDefined();
    expect(d['items.taskmaster.q1'][4]).toBe(1);
    expect(d['resources.sage.q1'][4]).toBe(1);
    expect(d['self.calm.q1'][4]).toBe(1);
    expect(Object.keys(d).length).toBe(112 + 24 + 8 + 1); // + validity.attention
  });

  it('accumulates across retakes without PII (no dates, no text, no ids)', () => {
    let d: Distributions = {};
    d = recordResponses(input(3), d);
    d = recordResponses(input(4), d);
    expect(totalResponses(d)).toBe(2);
    expect(d['items.rebel.q1'][3]).toBe(1);
    expect(d['items.rebel.q1'][4]).toBe(1);
    const raw = JSON.stringify(d);
    expect(raw).not.toMatch(/date|userId|email|zone|reflection/i);
  });

  it('store/load round-trips; recordAndStore wires it together', () => {
    recordAndStore(input(5));
    const loaded = loadTelemetry();
    expect(totalResponses(loaded)).toBe(1);
    expect(partResponseTotals(loaded, 'taskmaster')).toBe(8);
  });

  it('export payload drops the unused zero index and carries a schema tag', () => {
    const d = recordResponses(input(2));
    const payload = JSON.parse(exportTelemetry(d));
    expect(payload.schema).toBe(1);
    expect(payload.kind).toBe('innerverse-item-distributions');
    expect(payload.items['items.taskmaster.q1']).toEqual([0, 1, 0, 0, 0]);
    expect(payload.items['items.taskmaster.q1'].length).toBe(5);
  });
});
