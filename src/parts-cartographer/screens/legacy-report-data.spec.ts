import { describe, expect, it } from 'vitest';
import { ASSESSMENT_QUESTIONS } from '../../shared/core/data/assessment-questions';
import {
  applyLegacyAiAnalysis,
  buildLegacyAssessmentBackup,
  buildLegacyClinicalMarkdown,
  buildLegacyReportData,
} from './legacy-report-data';
import { sanitizeLegacyAiAnalysis } from '../core/legacy-ai-analysis';

const answers = Array.from({ length: 64 }, (_, index) => ((index * 3 + 2) % 5) + 1);

function localizeQuestion(question: { section: string; text: string }) {
  return `${question.section}:${question.text}`;
}

describe('React 64-item assessment report parity', () => {
  it('computes the full diagnostic/report model from a complete answer set', () => {
    const report = buildLegacyReportData(answers, 'en', '2026-10-03T08:30:00.000Z');

    expect(report.version).toBe('angular-assessment-64.v2');
    expect(report.poleScores.center).toHaveLength(4);
    expect(report.archetypes.length).toBeGreaterThan(0);
    expect(report.dynamics).toBeDefined();
    expect(report).toHaveProperty('complexes');
    expect(report).toHaveProperty('defenseHierarchy.layers');
    expect(report).toHaveProperty('defenseHierarchy.escalationPaths');
    expect(report).toHaveProperty('triggerMap');
    expect(report).toHaveProperty('integrationPathway');
    expect(report).toHaveProperty('dissociation');
    expect(report).toHaveProperty('regulation');
    expect(report).toHaveProperty('boundary');
    expect(report).toHaveProperty('coherence');
    expect(report.localNarrative).toContain('diagnosis');
  });

  it.each(['en', 'ru'] as const)('exports every computed section and diagnostic in %s', (language) => {
    const report = buildLegacyReportData(answers, language, '2026-10-03T08:30:00.000Z');
    const markdown = buildLegacyClinicalMarkdown(report, language, new Date('2026-10-03T08:30:00.000Z'));

    expect(markdown).toMatch(/^# /);
    expect(markdown).toContain(language === 'ru' ? 'Пантеон' : 'Pantheon');
    expect(markdown).toContain(language === 'ru' ? 'Иерархия защит' : 'Defense Hierarchy');
    expect(markdown).toContain(language === 'ru' ? 'Карта триггеров' : 'Trigger Map');
    expect(markdown).toContain(language === 'ru' ? 'Путь интеграции' : 'Integration Pathway');
    expect(markdown).toContain(language === 'ru' ? 'Диагностика' : 'Diagnostics');
    expect(markdown).toContain(language === 'ru' ? 'Не является медицинским' : 'Not a medical or psychiatric diagnosis');
    expect(markdown).not.toContain('undefined');
  });

  it('uses the AI pantheon while retaining response-computed scores and safety indicators', () => {
    const deterministic = buildLegacyReportData(answers, 'en', '2026-10-03T08:30:00.000Z');
    const analysis = sanitizeLegacyAiAnalysis({
      analysis: `${'## AI reflection\nGrounded in the submitted answers, this remains a hypothesis rather than a diagnosis. '.repeat(3)}\n## Keep in mind\nTake only what feels useful.`,
      poleScores: { agency: 0.1, emotional_temperature: 0.2, relational_focus: -0.2, attachment: 0.3 },
      pantheon: Array.from({ length: 4 }, (_, index) => ({
        name: `AI pattern ${index + 1}`, symbol: '✨', description: 'AI-generated description.', wound: 'Wound.',
        shadow: 'Shadow.', invitation: 'Invitation.', coreBelief: 'Belief.', attracts: 'Attracts.',
        size: 0.8, coordinates: [0, 0, 0, 0], cluster: 'gift_archetypes', prominence: 25,
      })),
    });
    const aiMode = applyLegacyAiAnalysis(deterministic, analysis);

    expect(aiMode.archetypes[0].name).toBe('AI pattern 1');
    expect(aiMode.poleScores).toEqual(deterministic.poleScores);
    expect(aiMode.dissociation).toEqual(deterministic.dissociation);
    expect(aiMode.aiNarrative).toBe(analysis.analysis);
    expect(aiMode.localNarrative).toContain('AI pattern 1');
  });

  it('creates a complete explicit-download backup with all 64 questions and dimensional centers', () => {
    const report = buildLegacyReportData(answers, 'en', '2026-10-03T08:30:00.000Z');
    const backup = buildLegacyAssessmentBackup(answers, report, ASSESSMENT_QUESTIONS, localizeQuestion, '2026-10-03T08:30:00.000Z');

    expect(backup.type).toBe('ArchetypeAI_Assessment_Backup');
    expect(backup.assessmentResponses).toEqual(answers);
    expect(backup.data).toHaveLength(64);
    expect(backup.data[0].response).toBe(answers[0]);
    expect(backup.data[0].questionText).toContain(ASSESSMENT_QUESTIONS[0].text);
    expect(backup.dimensionalExpressions.AGENCY).toBe(report.poleScores.center[0]);
    expect(backup.results).toBe(report);
  });
});
