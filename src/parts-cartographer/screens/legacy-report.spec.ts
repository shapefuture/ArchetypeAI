import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRANSLATIONS } from '../../i18n/strings';
import { sanitizeLegacyAiAnalysis } from '../core/legacy-ai-analysis';
import { buildLegacyReportData } from './legacy-report-data';

const aiMocks = vi.hoisted(() => ({
  aiReport: vi.fn(() => new Promise<string>(() => undefined)),
  degradation: { degraded: false, reason: null as string | null },
  primary: 'cloud' as 'cloud' | 'heuristic',
}));
vi.mock('../core/ai.adapter', () => ({
  AI: { aiReport: aiMocks.aiReport },
  ResilientAiAdapter: aiMocks,
}));
import { LegacyClinicalReport } from './legacy-report.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount({ result: customResult, scoringMethod = 'deterministic' }: { result?: any; scoringMethod?: string } = {}) {
  const lang = 'en';
  const responses = Array.from({ length: 64 }, (_, index) => (index % 5) + 1);
  const report = customResult ?? buildLegacyReportData(responses, lang, '2026-10-03T08:30:00.000Z');
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(React.createElement(LegacyClinicalReport, {
      result: report,
      responses,
      resultCopy: TRANSLATIONS.en.assessment.results,
      lang,
      scoringMethod,
      onBack: vi.fn(),
      onRetake: vi.fn(),
      onNarrativeChange: vi.fn(),
    }));
  });
  return host;
}

beforeEach(() => {
  aiMocks.aiReport.mockClear();
  aiMocks.degradation = { degraded: false, reason: null };
  aiMocks.primary = 'cloud';
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe('Legacy clinical report screen', () => {
  it('renders every report section and offers explicit export and universe actions', () => {
    const container = mount();

    for (const id of [
      'legacy-narrative', 'legacy-profile', 'legacy-poles', 'legacy-pantheon', 'legacy-dynamics',
      'legacy-complexes', 'legacy-defense', 'legacy-triggers', 'legacy-pathway', 'legacy-diagnostics',
    ]) {
      expect(container.querySelector(`#${id}`), `${id} should render`).toBeTruthy();
    }
    expect(container.textContent?.toLowerCase()).toContain('not a medical or psychiatric diagnosis');
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Clinical report'))).toBe(true);
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Download backup'))).toBe(true);
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('View in universe'))).toBe(true);
    expect(aiMocks.aiReport).toHaveBeenCalledTimes(1);
  });

  it('renders a selected AI pantheon without starting a second report request', () => {
    const responses = Array.from({ length: 64 }, (_, index) => (index % 5) + 1);
    const base = buildLegacyReportData(responses, 'en', '2026-10-03T08:30:00.000Z');
    const aiAnalysis = sanitizeLegacyAiAnalysis({
      analysis: `${'## AI relational reflection\nThis optional reflection is grounded in responses and is not a diagnosis. '.repeat(3)}\n## Keep in mind\nTake only what feels useful.`,
      poleScores: { agency: 0.1, emotional_temperature: -0.2, relational_focus: 0.3, attachment: 0.4 },
      pantheon: Array.from({ length: 4 }, (_, index) => ({
        name: `AI pattern ${index + 1}`, symbol: '✨', description: 'AI-generated relational pattern.',
        wound: 'Possible tender point.', shadow: 'Possible protective cost.', invitation: 'A reflective possibility.',
        coreBelief: 'Possible belief.', attracts: 'Repeated interaction.', size: 0.8,
        coordinates: [0.1, 0.2, 0.3, 0.4], cluster: 'gift_archetypes', prominence: 25,
      })),
    });
    const container = mount({ result: { ...base, aiAnalysis }, scoringMethod: 'fallback' });

    expect(container.textContent).toContain('AI pattern 1');
    expect(container.textContent).toContain('AI relational reflection');
    expect(aiMocks.aiReport).not.toHaveBeenCalled();
  });
});
