import { describe, expect, it } from 'vitest';
import {
  buildLegacyAiSystemInstruction,
  LEGACY_AI_ANALYSIS_SCHEMA,
  sanitizeLegacyAiAnalysis,
} from './legacy-ai-analysis';

const aiResult = (overrides: Record<string, unknown> = {}) => ({
  analysis: `${'## Relational reflection\nA careful, non-diagnostic reading grounded only in the submitted responses. '.repeat(3)}\n## Resources\nNotice what feels useful and leave the rest.`,
  poleScores: { agency: -1.4, emotional_temperature: 0.25, relational_focus: 0, attachment: 0.8 },
  pantheon: Array.from({ length: 4 }, (_, index) => ({
    name: `Pattern ${index + 1}`,
    symbol: '✨',
    description: 'A specific response-based pattern.',
    wound: 'A possible tender point.',
    shadow: 'A possible cost of the pattern.',
    invitation: 'A reflective possibility.',
    coreBelief: 'A possible belief.',
    attracts: 'A repeated kind of interaction.',
    size: 0.8,
    coordinates: [index, -0.25, 0.1, 0.5],
    cluster: 'control_shadows',
    prominence: index + 1,
  })),
  ...overrides,
});

describe('opt-in legacy AI assessment analysis', () => {
  it('builds a bilingual, answer-grounded prompt with explicit non-diagnostic safeguards', () => {
    const prompt = buildLegacyAiSystemInstruction({
      language: 'ru',
      questions: [{ sectionTitle: 'Инициативность', question: 'Я беру инициативу.', answer: 4 }],
      reportSections: { section1Title: 'Профиль по осям' },
      existingArchetypes: ['Планировщик'],
    });
    expect(prompt).toContain('Russian');
    expect(prompt).toContain('Я беру инициативу.');
    expect(prompt).toContain('Answer: 4');
    expect(prompt).toContain('Планировщик');
    expect(prompt).toContain('not clinical care');
    expect(LEGACY_AI_ANALYSIS_SCHEMA.properties.pantheon.maxItems).toBe(8);
  });

  it('clamps numeric output, restricts cluster names, and renormalizes prominence to 100', () => {
    const result = sanitizeLegacyAiAnalysis(aiResult());
    expect(result.poleScores.agency).toBe(-1);
    expect(result.pantheon[1].coordinates[0]).toBe(1);
    expect(result.pantheon.every((item) => item.cluster === 'control_shadows')).toBe(true);
    expect(result.pantheon.reduce((sum, item) => sum + item.prominence, 0)).toBeCloseTo(100, 8);
  });

  it('rejects incomplete, malformed, or oversized AI archetype payloads', () => {
    expect(() => sanitizeLegacyAiAnalysis({ ...aiResult(), pantheon: [] })).toThrow(/four to eight/);
    const malformed = aiResult();
    const pantheon = malformed.pantheon as Array<Record<string, unknown>>;
    pantheon[0].coordinates = [0, 0, Number.NaN, 0];
    expect(() => sanitizeLegacyAiAnalysis(malformed)).toThrow(/coordinate/);
  });
});
