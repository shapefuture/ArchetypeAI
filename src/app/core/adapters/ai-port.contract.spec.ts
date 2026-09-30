import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';
import type { AiPort, Archetype } from '../ports/ai.port';
import { LocalHeuristicAiAdapter } from './local-heuristic-ai.adapter';
import { ResilientAiAdapter } from './resilient-ai.adapter';

/** Adapters use field-level inject() — construct them inside the test injector. */
function createInContext<T>(cls: new (...args: never[]) => T): T {
  return TestBed.runInInjectionContext(() => new cls());
}

/**
 * AI_PORT contract suite (Layer 1 exit criterion): every adapter claiming
 * AiPort must pass the SAME behavioral contract. Run against:
 *   - LocalHeuristicAiAdapter (pure offline)
 *   - ResilientAiAdapter(GeminiAiAdapter→heuristic) with fetch stubbed at the
 *     network boundary (environment gate X9: TS/Angular target — the Python
 *     greps from runtime-contracts.md do not apply; this suite is the
 *     degraded-mode equivalent for this stack).
 */

const QUESTIONS = [{ section: 's', text: 'q' }];
const ANSWERS_147 = new Array(147).fill(3);

function makeGeminiStub(responses: { callAI?: string; fail?: boolean }) {
  return new Proxy({} as AiPort, {
    get(_t, prop: string) {
      if (prop === 'callAI') {
        return async () => {
          if (responses.fail) throw new Error('fetch failed');
          return responses.callAI ?? '';
        };
      }
      // every domain method funnels through callAI in the real adapter;
      // for contract purposes a failing stub is enough
      return async () => { if (responses.fail) throw new Error('fetch failed'); throw new Error('unstubbed: ' + prop); };
    },
  });
}

function runContract(name: string, make: () => AiPort) {
  describe(`AI_PORT contract — ${name}`, () => {
    let adapter: AiPort;

    beforeEach(async () => {
      await TestBed.configureTestingModule({}).compileComponents();
      adapter = make();
    });

    it('createArchetype returns a valid Archetype with id, coordinates in [-1,1], and a cluster', async () => {
      const a: Archetype = await adapter.createArchetype('a part that controls everything out of fear');
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.coordinates).toHaveLength(4);
      for (const c of a.coordinates) { expect(c).toBeGreaterThanOrEqual(-1); expect(c).toBeLessThanOrEqual(1); }
      expect(a.cluster).toBeTruthy();
      expect(['gift_archetypes','control_shadows','emotional_storm_shadows','avoidant_intellectual_shadows','anxious_connection_shadows','seductive_avoidance_shadows','disorganized_attachment_shadows']).toContain(a.cluster);
    });

    it('analyzeAssessment returns pantheon + poleScores in range + narrative', async () => {
      const res = await adapter.analyzeAssessment(ANSWERS_147, QUESTIONS, []);
      expect(res.pantheon.length).toBeGreaterThan(0);
      expect(res.analysis.length).toBeGreaterThan(20);
      if (res.poleScores) {
        for (const v of Object.values(res.poleScores)) {
          expect(v).toBeGreaterThanOrEqual(-1); expect(v).toBeLessThanOrEqual(1);
        }
      }
    });

    it('generateCoachResponse returns a response string + suggestions array', async () => {
      const r = await adapter.generateCoachResponse([{ role: 'user', content: 'hello' }], null, null, []);
      expect(typeof r.response).toBe('string');
      expect(Array.isArray(r.suggestions)).toBe(true);
    });

    it('generatePartsDialogue returns a response string', async () => {
      const r = await adapter.generatePartsDialogue([], { name: 'Taskmaster' }, [{ name: 'Taskmaster' }]);
      expect(typeof r.response).toBe('string');
    });

    it('generateSynastryNarrative returns a string', async () => {
      const r = await adapter.generateSynastryNarrative('report');
      expect(typeof r).toBe('string');
    });
  });
}

runContract('LocalHeuristicAiAdapter (offline)', () => createInContext(LocalHeuristicAiAdapter));

runContract('ResilientAiAdapter (gemini stub → heuristic fallback)', () => {
  const primary = makeGeminiStub({ fail: true });
  return new ResilientAiAdapter(primary, createInContext(LocalHeuristicAiAdapter));
});

describe('ResilientAiAdapter — fallback + degradation semantics', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  it('serves the fallback when the primary fails and records a DegradationDescriptor', async () => {
    const primary = makeGeminiStub({ fail: true });
    const fallback = createInContext(LocalHeuristicAiAdapter);
    const resilient = new ResilientAiAdapter(primary, fallback);
    const a = await resilient.createArchetype('controller part');
    expect(a.id).toBeTruthy(); // heuristic result, not the primary's
    expect(resilient.degradation()).toBeTruthy();
    expect(resilient.degradation()!.key).toBe('ai:createArchetype');
    expect(resilient.degradation()!.originalError).toContain('fetch failed');
  });

  it('does NOT touch the fallback when the primary succeeds', async () => {
    const okPrimary: AiPort = {
      callAI: async () => 'ok',
      createArchetype: async () => ({ id: 'primary', name: 'P', coordinates: [0, 0, 0, 0], color: '#000', size: 0.5, symbol: '✦', invitation: '', coreBelief: '', attracts: '' }),
      analyzeAssessment: async () => ({ analysis: 'x', pantheon: [] }),
      generateCoachResponse: async () => ({ response: 'x', suggestions: [] }),
      generatePartsDialogue: async () => ({ response: 'x', suggestions: [] }),
      generateSynastryNarrative: async () => 'x',
    };
    const fallbackSpy = { createArchetype: vi.fn() };
    const resilient = new ResilientAiAdapter(okPrimary, fallbackSpy as unknown as AiPort);
    const a = await resilient.createArchetype('x');
    expect(a.id).toBe('primary');
    expect(fallbackSpy.createArchetype).not.toHaveBeenCalled();
    expect(resilient.degradation()).toBeNull();
  });

  it('propagates caller cancellation instead of swallowing it into the fallback', async () => {
    const cancelled = Object.assign(new Error('analysis cancelled'), { cancelled: true });
    const primary = { ...makeGeminiStub({}), createArchetype: async () => { throw cancelled; } };
    const fallback = { ...createInContext(LocalHeuristicAiAdapter), createArchetype: vi.fn() };
    const resilient = new ResilientAiAdapter(primary as AiPort, fallback as unknown as AiPort);
    await expect(resilient.createArchetype('x')).rejects.toThrow('analysis cancelled');
    expect(fallback.createArchetype).not.toHaveBeenCalled();
  });
});
