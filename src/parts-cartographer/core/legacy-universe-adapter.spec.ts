import { describe, expect, it } from 'vitest';
import { sanitizeLegacyAiAnalysis } from './legacy-ai-analysis';
import { buildLegacyUniverseParts } from './legacy-universe-adapter';
import { applyLegacyAiAnalysis, buildLegacyReportData } from '../screens/legacy-report-data';

const answers = Array.from({ length: 64 }, (_, index) => (index % 5) + 1);

/** These answers yield one deterministic archetype; repeat it so placement covers several nodes. */
function withSixArchetypes(report: ReturnType<typeof buildLegacyReportData>) {
  return { ...report, archetypes: Array.from({ length: 6 }, (_, index) => report.archetypes[index % report.archetypes.length]) };
}

function aiPantheon() {
  return sanitizeLegacyAiAnalysis({
    analysis: `${'## Relational reflection\nThis response-grounded reading is reflective, not diagnostic. '.repeat(3)}\n## Keep in mind\nUse your own judgment.`,
    poleScores: { agency: 0.1, emotional_temperature: -0.2, relational_focus: 0.3, attachment: 0.4 },
    pantheon: Array.from({ length: 4 }, (_, index) => ({
      name: `AI pattern ${index + 1}`, symbol: '✨', description: `AI description ${index + 1}.`,
      wound: 'AI wound.', shadow: 'AI shadow.', invitation: 'AI invitation.', coreBelief: 'AI belief.',
      attracts: 'AI attraction.', size: 0.9, coordinates: [0.9, 0.8, 0.7, 0.6],
      cluster: 'gift_archetypes', prominence: 25, partType: 'manager',
    })),
  });
}

describe('legacy assessment → coordinate-aware universe adapter', () => {
  it('maps every deterministic archetype to a stable map Part with its four coordinates', () => {
    const report = buildLegacyReportData(answers, 'en', '2026-10-03T08:30:00.000Z');
    const first = buildLegacyUniverseParts(report);
    const second = buildLegacyUniverseParts(report);

    expect(first).toHaveLength(report.archetypes.length);
    expect(first.map(({ id }) => id)).toEqual(second.map(({ id }) => id));
    expect(first.every((part) => part.archetype?.sourceAssessment === 'legacy64')).toBe(true);
    expect(first[0].archetype?.coordinates).toEqual(report.archetypes[0].coordinates);
    expect(first[0].archetype?.cluster).toBe(report.archetypes[0].cluster);
    expect(first[0].energy).toBe(report.archetypes[0].prominence);
  });

  it('uses AI narrative content while preserving deterministic placement and completes missing pantheon entries locally', () => {
    const base = buildLegacyReportData(answers, 'en', '2026-10-03T08:30:00.000Z');
    const fullPantheon = {
      ...base,
      archetypes: Array.from({ length: 6 }, (_, index) => base.archetypes[index % base.archetypes.length]),
    };
    const report = { ...fullPantheon, aiAnalysis: aiPantheon() };
    const mapped = buildLegacyUniverseParts(report, true);

    expect(mapped).toHaveLength(fullPantheon.archetypes.length);
    expect(mapped[0].name).toBe('AI pattern 1');
    expect(mapped[0].role).toBe('AI description 1.');
    expect(mapped[0].archetype?.coordinates).toEqual(base.archetypes[0].coordinates);
    expect(mapped[0].archetype?.prominence).toBe(base.archetypes[0].prominence);
    expect(mapped[4].name).toBe(base.archetypes[4 % base.archetypes.length].name);
    expect(mapped[5].name).toBe(base.archetypes[5 % base.archetypes.length].name);
    expect(mapped.every((part) => Number.isFinite(part.archetype?.coordinates[3]))).toBe(true);
  });

  it('keeps 64-item placement after an AI pantheon is applied, stored and restored', () => {
    const base = withSixArchetypes(buildLegacyReportData(answers, 'en', '2026-10-03T08:30:00.000Z'));
    const applied = applyLegacyAiAnalysis(base, aiPantheon());
    const canonical = buildLegacyUniverseParts(base, true);
    const restored = buildLegacyUniverseParts(applied, true);

    expect(applied.archetypes[0].name).toBe('AI pattern 1');
    expect(restored.map(({ id }) => id)).toEqual(canonical.map(({ id }) => id));
    expect(restored.map((part) => part.archetype?.coordinates)).toEqual(canonical.map((part) => part.archetype?.coordinates));
    expect(restored.map((part) => part.archetype?.prominence)).toEqual(canonical.map((part) => part.archetype?.prominence));
    expect(restored[0].name).toBe('AI pattern 1');
    expect(restored.every((part) => part.archetype?.coordinateBasis === 'response-derived-64')).toBe(true);
  });

  it('builds the same universe from an applied AI report when AI narrative is switched off', () => {
    const base = withSixArchetypes(buildLegacyReportData(answers, 'en', '2026-10-03T08:30:00.000Z'));
    const applied = applyLegacyAiAnalysis(base, aiPantheon());
    expect(buildLegacyUniverseParts(applied)).toEqual(buildLegacyUniverseParts(base));
  });
});
