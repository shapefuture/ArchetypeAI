import {
  computeBoundaryStyle,
  computeNarrativeCoherence,
  computePoleScores,
  computeRegulationCapacity,
  computeTriggerMap,
  computeIntegrationPathway,
  generateArchetypes,
} from './scoring';
import type { ScoredArchetype } from './scoring';
import { computeSynastry } from './synastry';

type SectionName =
  | 'agencyActive'
  | 'agencyReceptive'
  | 'tempHot'
  | 'tempCool'
  | 'focusOther'
  | 'focusSelf'
  | 'attAnxious'
  | 'attAvoidant'
  | 'health';

const SECTION_RANGES: Record<SectionName, [number, number]> = {
  agencyActive: [0, 6],
  agencyReceptive: [6, 12],
  tempHot: [12, 18],
  tempCool: [18, 24],
  focusOther: [24, 30],
  focusSelf: [30, 36],
  attAnxious: [36, 44],
  attAvoidant: [44, 52],
  health: [52, 64],
};

function buildResponses(healthValue: number, baseValue = 3): number[] {
  return [
    ...new Array(52).fill(baseValue),
    ...new Array(12).fill(healthValue),
  ];
}

function buildProfileResponses(
  overrides: Partial<Record<SectionName, number>>,
  baseValue = 3
): number[] {
  const responses = new Array(64).fill(baseValue);

  for (const [section, value] of Object.entries(overrides) as [SectionName, number][]) {
    const [start, end] = SECTION_RANGES[section];
    responses.fill(value, start, end);
  }

  return responses;
}

describe('computePoleScores', () => {
  it('normalizes healthy-pattern answers against the 1..5 baseline', () => {
    expect(computePoleScores(buildResponses(1)).healthScore).toBe(0);
    expect(computePoleScores(buildResponses(3)).healthScore).toBe(0.5);
    expect(computePoleScores(buildResponses(5)).healthScore).toBe(1);
  });

  it('computes dimension centers from opposing raw pole sums', () => {
    expect(computePoleScores(buildProfileResponses({
      agencyActive: 5,
      agencyReceptive: 1,
    })).center[0]).toBe(-1);

    expect(computePoleScores(buildProfileResponses({
      agencyActive: 1,
      agencyReceptive: 5,
    })).center[0]).toBe(1);

    expect(computePoleScores(buildProfileResponses({
      attAnxious: 5,
      attAvoidant: 1,
    })).center[3]).toBe(0.75);

    expect(computePoleScores(buildProfileResponses({
      attAnxious: 1,
      attAvoidant: 5,
    })).center[3]).toBe(-0.75);
  });

  it('normalizes Attachment dimension to have comparable range as other dimensions', () => {
    // With equal per-question responses, Attachment center is weighted by ATTACHMENT_WEIGHT
    // so it doesn't dominate the center vector in cluster assignment
    const maxAnxious = computePoleScores(buildProfileResponses({
      attAnxious: 5,
      attAvoidant: 1,
    })).center[3];

    const maxAgency = computePoleScores(buildProfileResponses({
      agencyActive: 1,
      agencyReceptive: 5,
    })).center[0];

    // Attachment max should be attenuated by the weight factor (0.75)
    expect(maxAnxious).toBe(0.75);
    expect(maxAgency).toBe(1);
  });

  it('ignores unanswered healthy-pattern items instead of biasing the score', () => {
    const responses = buildResponses(1);
    responses[52] = 0;
    responses[53] = 5;

    expect(computePoleScores(responses).healthScore).toBeCloseTo(4 / 44, 6);
  });

  it('clamps healthScore to [0, 1] even with edge-case sparse responses', () => {
    // Mix of zeros and ones in health section — could produce negative without guard
    const responses = buildProfileResponses({});
    responses.fill(1, 52, 60);
    responses.fill(0, 60, 64);

    const healthScore = computePoleScores(responses).healthScore;
    expect(healthScore).toBeGreaterThanOrEqual(0);
    expect(healthScore).toBeLessThanOrEqual(1);
  });
});

describe('health-driven downstream metrics', () => {
  it('does not treat disagreement with every pole as strong shadow evidence', () => {
    const responses = buildProfileResponses({
      agencyActive: 1,
      agencyReceptive: 1,
      tempHot: 1,
      tempCool: 1,
      focusOther: 1,
      focusSelf: 1,
      attAnxious: 1,
      attAvoidant: 1,
      health: 1,
    });

    const { archetypes } = generateArchetypes(responses);

    expect(archetypes).toHaveLength(1);
    expect(archetypes[0].cluster).toBe('gift_archetypes');
    expect(archetypes[0].coordinates).toEqual([0, 0, 0, 0]);
  });

  it('generates active-side archetypes only from actual active-side agreement', () => {
    const active = buildProfileResponses({
      agencyActive: 5,
      agencyReceptive: 1,
      health: 1,
    });
    const inactive = buildProfileResponses({
      agencyActive: 1,
      agencyReceptive: 1,
      health: 1,
    });

    expect(generateArchetypes(active).archetypes.some(a => a.coordinates[0] < -0.9)).toBe(true);
    expect(generateArchetypes(inactive).archetypes.some(a => Math.abs(a.coordinates[0]) > 0.9)).toBe(false);
  });

  it('does not fabricate a gift archetype from minimum healthy-pattern answers', () => {
    const responses = buildResponses(1);
    responses.fill(5, 0, 6);

    const { archetypes } = generateArchetypes(responses);

    expect(archetypes.some(a => a.cluster === 'gift_archetypes')).toBe(false);
  });

  it('keeps synastry safety at zero when both people score minimum health', () => {
    const responses = buildResponses(1);

    expect(computeSynastry(responses, responses).safetyIndex).toBe(0);
  });

  it('removes the baseline inflation from regulation and coherence indicators', () => {
    const responses = buildResponses(1);
    const poles = computePoleScores(responses);

    expect(computeRegulationCapacity(responses, poles).windowOfTolerance).toBeCloseTo(0.5, 6);
  });

  it('allows fragmented coherence level for highly disorganized profiles', () => {
    // Disorganized attachment with extreme zigzag responses in every section
    const responses = new Array(64).fill(3);
    // Zigzag: alternate between 1 and 5 across all sections
    for (let i = 0; i < 64; i++) {
      responses[i] = i % 2 === 0 ? 1 : 5;
    }

    const poles = computePoleScores(responses);
    const coherence = computeNarrativeCoherence(responses, poles);

    // Should be able to reach "fragmented" level (score < 0.3)
    expect(coherence.score).toBeLessThanOrEqual(0.3);
  });
});

describe('directional pole semantics', () => {
  it('marks anxious + avoidant profiles as disorganized', () => {
    const responses = buildProfileResponses({
      attAnxious: 5,
      attAvoidant: 5,
    });

    expect(computePoleScores(responses).disorganizedAttachment).toBe(true);
  });

  it('does not override all clusters to disorganized for disorganized users', () => {
    // Disorganized attachment (anxious + avoidant) but also strongly active + cool
    // should produce a control_shadows archetype, NOT all disorganized_attachment_shadows
    const responses = buildProfileResponses({
      attAnxious: 5,
      attAvoidant: 5,
      agencyActive: 5,
      agencyReceptive: 1,
      tempHot: 1,
      tempCool: 5,
    });

    const { archetypes } = generateArchetypes(responses);

    // Should have at least one archetype that is NOT disorganized_attachment_shadows
    const nonDisorgArchetypes = archetypes.filter(a => a.cluster !== 'disorganized_attachment_shadows');
    expect(nonDisorgArchetypes.length).toBeGreaterThan(0);

    // The active+cool archetype should be control_shadows based on its coords
    const controlArchetype = archetypes.find(a => a.cluster === 'control_shadows');
    expect(controlArchetype).toBeDefined();
  });

  it('sets disorganizedModifier on archetypes where both attachment poles are active', () => {
    const responses = buildProfileResponses({
      attAnxious: 5,
      attAvoidant: 5,
    });

    const { archetypes } = generateArchetypes(responses);

    // Archetypes whose attachment dimension has both poles active should have the modifier
    const withModifier = archetypes.filter(a => a.disorganizedModifier === true);
    expect(withModifier.length).toBeGreaterThan(0);
  });

  it('produces unique names for all archetypes (no collisions)', () => {
    // Multiple strong dimensions should produce multiple archetypes with different names
    const responses = buildProfileResponses({
      agencyActive: 5,
      agencyReceptive: 1,
      tempHot: 5,
      tempCool: 1,
      focusOther: 5,
      focusSelf: 1,
      attAnxious: 5,
      attAvoidant: 1,
      health: 5,
    });

    const { archetypes } = generateArchetypes(responses);
    const names = archetypes.map(a => a.name);
    const uniqueNames = new Set(names);

    // Every archetype should have a unique name
    expect(uniqueNames.size).toBe(names.length);
  });

  it('does not inflate size when profiles merge during deduplication', () => {
    // Create a profile where two archetypes in the same dimension get close enough to merge.
    // The merged archetype's size should be based on its primary strength, not the summed rawScore.
    const responses = buildProfileResponses({
      agencyActive: 5,
      agencyReceptive: 3,
      tempHot: 4,
      tempCool: 2,
      focusOther: 3,
      focusSelf: 3,
      attAnxious: 3,
      attAvoidant: 3,
      health: 3,
    });

    const { archetypes } = generateArchetypes(responses);

    // No archetype should have size > 1.0 (the meaningful range before merge-inflation)
    for (const a of archetypes) {
      expect(a.size).toBeLessThanOrEqual(1.0);
    }
  });

  it('detects shutdown when cool-detached and avoidant traits dominate', () => {
    const responses = buildProfileResponses({
      tempHot: 1,
      tempCool: 5,
      attAnxious: 1,
      attAvoidant: 5,
      health: 1,
    });
    const poles = computePoleScores(responses);

    expect(computeRegulationCapacity(responses, poles).dysregulationPattern).toBe('shutdown');
  });

  it('keeps self-focused initiators classified as rigid rather than porous', () => {
    const poles = computePoleScores(buildProfileResponses({
      agencyActive: 5,
      agencyReceptive: 1,
      focusOther: 1,
      focusSelf: 5,
    }));

    expect(computeBoundaryStyle(poles).style).toBe('rigid');
  });
});

describe('localized diagnostics', () => {
  it('returns Russian trigger situations and wounds without English fallback text', () => {
    const poles = computePoleScores(buildProfileResponses({ attAvoidant: 5, health: 1 }));
    const archetypes: ScoredArchetype[] = [{
      name: 'Тестовый наблюдатель',
      symbol: '◎',
      coordinates: [0, -1, 0, -1],
      cluster: 'avoidant_intellectual_shadows',
      prominence: 80,
      size: 0.8,
      description: '',
      wound: '',
      shadow: '',
      invitation: '',
      coreBelief: '',
      attracts: '',
      partType: 'manager',
      developmentalOrigin: 'early_attachment',
      disorganizedModifier: false,
    }];
    const triggers = computeTriggerMap(archetypes, poles, 'ru');
    const avoidantTrigger = triggers.find(t => t.underlyingWound.includes('annihilation'));

    expect(avoidantTrigger).toBeDefined();
    expect(avoidantTrigger?.triggerSituationsRu.join(' ')).toContain('логикой');
    expect(avoidantTrigger?.underlyingWoundRu).toContain('по-настоящему увиденным');
    expect(avoidantTrigger?.triggerSituationsRu.join(' ')).not.toContain('Intimate conversations');
  });
});

describe('computeIntegrationPathway', () => {
  it('returns an integration step for centered gift/self profiles', () => {
    const responses = buildResponses(5);
    const poles = computePoleScores(responses);
    const { archetypes } = generateArchetypes(responses, 'ru');
    const steps = computeIntegrationPathway(archetypes, poles, 'ru');

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stageNameRu).toBe('Воплощение');
    expect(steps[0].actionRu).toContain(archetypes[0].name);
  });

  it('computes per-archetype developmental origins that differ across archetypes', () => {
    // Strong avoidant + cold (pre-verbal pattern) AND strong self-focused + active (oedipal pattern)
    const responses = buildProfileResponses({
      attAnxious: 1,
      attAvoidant: 5,
      tempHot: 1,
      tempCool: 5,
      focusOther: 1,
      focusSelf: 5,
      agencyActive: 5,
      agencyReceptive: 1,
    });

    const { archetypes } = generateArchetypes(responses);
    const origins = archetypes.map(a => a.developmentalOrigin);

    // With per-archetype origins, different archetypes should get different origins
    const uniqueOrigins = new Set(origins);
    expect(uniqueOrigins.size).toBeGreaterThan(1);
  });

  it('detects gestalt patterns when multiple dimensions align coherently', () => {
    // "Stoic Fortress" = active + cool — a coherent cross-dimensional pattern
    const responses = buildProfileResponses({
      agencyActive: 5,
      agencyReceptive: 1,
      tempHot: 1,
      tempCool: 5,
      focusOther: 1,
      focusSelf: 3,
      attAnxious: 1,
      attAvoidant: 3,
      health: 1,
    });

    const { archetypes } = generateArchetypes(responses);

    // Should produce a unified control archetype rather than fragmented separate ones
    // The active+cool gestalt should be captured in a single archetype
    const controlArchetypes = archetypes.filter(a => a.cluster === 'control_shadows');
    expect(controlArchetypes.length).toBeGreaterThanOrEqual(1);

    // At least one archetype should have a gestalt marker
    const gestaltArchetypes = archetypes.filter(a => a.gestalt);
    expect(gestaltArchetypes.length).toBeGreaterThan(0);
  });
});

describe('synastry semantics', () => {
  it('detects pursue-withdraw regardless of partner ordering', () => {
    const anxious = buildProfileResponses({
      attAnxious: 5,
      attAvoidant: 1,
      health: 3,
    });
    const avoidant = buildProfileResponses({
      attAnxious: 1,
      attAvoidant: 5,
      health: 3,
    });

    expect(computeSynastry(anxious, avoidant).attachmentDance.pattern).toBe('pursue-withdraw');
    expect(computeSynastry(avoidant, anxious).attachmentDance.pattern).toBe('pursue-withdraw');
  });

  it('attributes initiation to the actually active partner', () => {
    const active = buildProfileResponses({
      agencyActive: 5,
      agencyReceptive: 1,
    });
    const receptive = buildProfileResponses({
      agencyActive: 1,
      agencyReceptive: 5,
    });

    const report = computeSynastry(active, receptive);

    expect(report.dyadicAnalysis.initiationPattern).toBe('person1');
    expect(report.polarMap.find(p => p.dimension === 'AGENCY')?.direction).toContain('Person 1 carries the active pole');
  });

  it('preserves anxious-avoidant trigger loops when the avoidant partner is person 1', () => {
    const avoidant = buildProfileResponses({
      attAnxious: 1,
      attAvoidant: 5,
    });
    const anxious = buildProfileResponses({
      attAnxious: 5,
      attAvoidant: 1,
    });

    const report = computeSynastry(avoidant, anxious);

    expect(report.dyadicAnalysis.unconsciousContract).toContain('I will pursue and you will withdraw');
    expect(report.crossPersonTriggers.some(t => t.interactionDesc.includes('Classic pursue-withdraw'))).toBe(true);
  });
});

describe('narrative coherence measures disagreement within a pole', () => {
  it('does not call a decisive, consistent answerer fragmented', () => {
    const r = [...Array(6).fill(5), ...Array(6).fill(1), ...Array(6).fill(5), ...Array(6).fill(1), ...Array(6).fill(5), ...Array(6).fill(1), ...Array(8).fill(1), ...Array(8).fill(5), ...Array(12).fill(5)];
    expect(computeNarrativeCoherence(r, computePoleScores(r)).level).toBe('high');
  });
  it('does not call uniform answers inconsistent', () => {
    const r = Array(64).fill(3);
    expect(computeNarrativeCoherence(r, computePoleScores(r)).description).not.toMatch(/inconsistent/);
  });
});
