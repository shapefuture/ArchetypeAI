import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type LegacyAiAnalysis } from '../core/legacy-ai-analysis';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
const aiMock = vi.hoisted(() => ({
  aiReport: vi.fn(() => new Promise<string>(() => undefined)),
  analyzeLegacy: vi.fn(),
  degradation: { degraded: false, reason: null as string | null },
  primary: 'cloud' as 'cloud' | 'heuristic',
}));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/ai.adapter.ts', () => ({
  AI: { aiReport: aiMock.aiReport },
  ResilientAiAdapter: aiMock,
  analyzeLegacyRelationalAssessment: aiMock.analyzeLegacy,
}));

import { Legacy64Assessment } from './legacy-assessment.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;
const responses = Array.from({ length: 64 }, (_, index) => (index % 5) + 1);

function mount(lang = 'en') {
  appMock.current = {
    t: (key: string) => ({ back: 'Back', next: 'Next', later: 'Later', consent: 'Consent', assessmentSaveFailed: 'Scoring failed' }[key] ?? key),
    lang, go: vi.fn(), toast: vi.fn(), setParts: vi.fn(), setUniverseMode: vi.fn(),
    parts: [
      { id: 'kept-studio', archetype: { schema: 'archetype-map.v1', sourceAssessment: 'studio' } },
      { id: 'old-legacy', archetype: { schema: 'archetype-map.v1', sourceAssessment: 'legacy64' } },
    ],
  };
  localStorage.setItem('ARCHETYPE_ASSESSMENT_RESPONSES', JSON.stringify(responses));
  localStorage.setItem('ARCHETYPE_ASSESSMENT_INDEX', '63');
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(Legacy64Assessment)); });
  return host;
}

function clickButton(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(text));
  expect(button, `expected a button containing “${text}”`).toBeTruthy();
  act(() => { (button as HTMLButtonElement).click(); });
  return button as HTMLButtonElement;
}

beforeEach(() => {
  localStorage.clear();
  aiMock.aiReport.mockClear();
  aiMock.analyzeLegacy.mockReset();
  aiMock.degradation = { degraded: false, reason: null };
  aiMock.primary = 'cloud';
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('React 64-item scoring-method parity', () => {
  it('keeps AI analysis opt-in and sends all answers only after an explicit selection', () => {
    aiMock.analyzeLegacy.mockImplementation(() => new Promise<LegacyAiAnalysis>(() => undefined));
    const container = mount();
    expect(container.textContent).toContain('Deterministic · local');
    expect(aiMock.analyzeLegacy).not.toHaveBeenCalled();

    clickButton(container, 'AI-generated pantheon');

    expect(aiMock.analyzeLegacy).toHaveBeenCalledTimes(1);
    expect(aiMock.analyzeLegacy.mock.calls[0][0].questions).toHaveLength(64);
    expect(aiMock.analyzeLegacy.mock.calls[0][0].questions[0].answer).toBe(responses[0]);
    expect(container.textContent).toContain('Generating an alternate pantheon');
    expect(localStorage.getItem('archetype_scoring_method')).not.toBe('fallback');
  });

  it('aborts a pending AI request and clears the prior report when the assessment is retaken', () => {
    let capturedSignal: AbortSignal | undefined;
    aiMock.analyzeLegacy.mockImplementation((_input: unknown, options: { signal: AbortSignal }) => {
      capturedSignal = options.signal;
      return new Promise<LegacyAiAnalysis>(() => undefined);
    });
    const container = mount();
    clickButton(container, 'AI-generated pantheon');
    clickButton(container, 'Retake');

    expect(capturedSignal?.aborted).toBe(true);
    expect(localStorage.getItem('archetype_scoring_method')).toBe('deterministic');
    expect(localStorage.getItem('ifs.legacy64.result')).toBeNull();
    expect(container.textContent).toContain('Legacy relational assessment');
  });

  it('does not reuse a prior language-specific AI result after changing languages', () => {
    localStorage.setItem('archetype_scoring_method', 'fallback');
    localStorage.setItem('ifs.legacy64.result', JSON.stringify({
      version: 'angular-assessment-64.v2', language: 'en', aiAnalysis: { analysis: 'old English result' },
    }));
    const container = mount('ru');

    expect(container.textContent).toContain('Точный расчёт · локально');
    expect(aiMock.analyzeLegacy).not.toHaveBeenCalled();
  });

  it('opens the coordinate universe with the selected pantheon and retains unrelated user parts', () => {
    const container = mount();
    const context = appMock.current as Record<string, any>;
    clickButton(container, 'View in universe');
    const nextParts = context.setParts.mock.calls[0][0];

    expect(nextParts.some((part: any) => part.id === 'kept-studio')).toBe(true);
    expect(nextParts.some((part: any) => part.id === 'old-legacy')).toBe(false);
    expect(nextParts.some((part: any) => part.archetype?.sourceAssessment === 'legacy64')).toBe(true);
    expect(context.setUniverseMode).toHaveBeenCalledWith('parts');
    expect(context.go).toHaveBeenCalledWith('universe');
  });

  it('allows the pending AI request to be cancelled without replacing the local result', async () => {
    let capturedSignal: AbortSignal | undefined;
    aiMock.analyzeLegacy.mockImplementation((_input: unknown, options: { signal: AbortSignal }) => {
      capturedSignal = options.signal;
      return new Promise<LegacyAiAnalysis>(() => undefined);
    });
    const container = mount();
    const modeButton = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes('AI-generated pantheon'));
    act(() => { (modeButton as HTMLButtonElement).click(); });
    expect(container.textContent).toContain('Generating an alternate pantheon');
    const modeCard = Array.from(container.querySelectorAll('.card')).find((card) => card.textContent?.includes('AI mode sends the complete 64 answers'));
    expect(modeCard).toBeTruthy();
    clickButton(modeCard as HTMLElement, 'Cancel');
    expect(capturedSignal?.aborted).toBe(true);
    expect(localStorage.getItem('archetype_scoring_method')).not.toBe('fallback');
    expect(container.textContent).toContain('AI request cancelled');
    expect(container.textContent).toContain('Deterministic · local');
  });
  it('aborts AI on an in-place language change and rebuilds the local report', () => {
    let signal: AbortSignal;
    aiMock.analyzeLegacy.mockImplementation((_input, options) => { signal = options.signal; return new Promise(() => undefined); });
    const container = mount();
    clickButton(container, 'AI-generated pantheon');
    appMock.current!.lang = 'ru';
    act(() => root?.render(React.createElement(Legacy64Assessment)));
    expect(signal!.aborted).toBe(true);
    expect(container.textContent).toContain('Точный расчёт');
    expect(JSON.parse(localStorage.getItem('ifs.legacy64.result')!).language).toBe('ru');
    expect(localStorage.getItem('archetype_scoring_method')).toBe('deterministic');
  });

  it('keeps deterministic data after a failed AI request and allows a successful retry', async () => {
    aiMock.analyzeLegacy.mockRejectedValueOnce(new Error('provider unavailable'));
    const container = mount();
    const before = JSON.parse(localStorage.getItem('ifs.legacy64.result')!);
    await act(async () => {
      const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes('AI-generated pantheon'));
      (button as HTMLButtonElement).click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('AI analysis could not be completed');
    expect(localStorage.getItem('archetype_scoring_method')).not.toBe('fallback');
    expect(JSON.parse(localStorage.getItem('ifs.legacy64.result')!).poleScores).toEqual(before.poleScores);
    const generated = { analysis: 'A careful alternate reflection.', poleScores: { agency: 0, emotional_temperature: 0, relational_focus: 0, attachment: 0 },
      pantheon: Array.from({ length: 4 }, (_, i) => ({ ...before.archetypes[0], name: `Retry pattern ${i + 1}` })) };
    aiMock.analyzeLegacy.mockResolvedValueOnce(generated);
    await act(async () => {
      const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes('AI-generated pantheon'));
      (button as HTMLButtonElement).click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(aiMock.analyzeLegacy).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Retry pattern 1');
    expect(localStorage.getItem('archetype_scoring_method')).toBe('fallback');
    expect(JSON.parse(localStorage.getItem('ifs.legacy64.result')!).poleScores).toEqual(before.poleScores);
    expect(JSON.parse(localStorage.getItem('ifs.legacy64.result')!).aiAnalysis.analysis).toBe(generated.analysis);
  });

});
