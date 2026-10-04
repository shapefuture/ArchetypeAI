import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LegacyAiPromptInput } from './legacy-ai-analysis';

const authMocks = vi.hoisted(() => ({
  getFirebaseIdToken: vi.fn(async () => 'firebase-id-token'),
}));
const apiMocks = vi.hoisted(() => ({
  workerApiUrl: vi.fn((route: string) => `/api/${route}`),
}));
vi.mock('./auth.service', () => ({ getFirebaseIdToken: authMocks.getFirebaseIdToken }));
vi.mock('./api', () => ({ workerApiUrl: apiMocks.workerApiUrl }));

import { analyzeLegacyRelationalAssessment, chatWithContext, createStudioArchetype, generateSynastryNarrative, ResilientAiAdapter } from './ai.adapter';

const analysisPayload = {
  analysis: `${'## Grounded reflection\nThis is a careful, response-based reflection and not a diagnosis. '.repeat(3)}\n## Keep in mind\nUse your own judgment.`,
  poleScores: { agency: 0.1, emotional_temperature: -0.2, relational_focus: 0.3, attachment: 0.4 },
  pantheon: Array.from({ length: 4 }, (_, index) => ({
    name: `Pattern ${index + 1}`, symbol: '✨', description: 'Response-grounded pattern.',
    wound: 'Possible tender point.', shadow: 'Possible protective cost.', invitation: 'A reflective possibility.',
    coreBelief: 'Possible belief.', attracts: 'Repeated interaction.', size: 0.8,
    coordinates: [0.1, 0.2, 0.3, 0.4], cluster: 'gift_archetypes', prominence: 25,
  })),
};

const promptInput: LegacyAiPromptInput = {
  language: 'en',
  questions: [{ sectionTitle: 'Agency', question: 'I can take initiative.', answer: 4 }],
  reportSections: { section1Title: 'Profile' },
  existingArchetypes: ['The Planner'],
};

let fetchSpy: ReturnType<typeof vi.fn>;
const originalFetch = globalThis.fetch;

function workerResponse(text: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ text, ...(status >= 200 && status < 300 ? {} : { error: 'AI service unavailable' }) }),
  };
}

beforeEach(() => {
  authMocks.getFirebaseIdToken.mockReset().mockResolvedValue('firebase-id-token');
  apiMocks.workerApiUrl.mockClear();
  fetchSpy = vi.fn();
  globalThis.fetch = fetchSpy as unknown as typeof fetch;
  ResilientAiAdapter.degradation = { degraded: false, reason: null };
  ResilientAiAdapter.primary = 'cloud';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
});

describe('coach and studio lifecycle', () => {
  it('sends bounded dialogue and only the explicitly selected part fields', async () => {
    fetchSpy.mockResolvedValue(workerResponse('A careful response.'));
    await chatWithContext(Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'ai' as const : 'user' as const, text: 'x'.repeat(5000) })), 'parts', {
      language: 'ru', part: { name: 'Selected guardian', need: 'A pause', privateJournal: 'secret', answers: [1, 2] } as any,
    });
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.history).toHaveLength(20);
    expect(body.prompt).toHaveLength(4000);
    expect(body.systemInstruction).toContain('Russian');
    expect(body.systemInstruction).toContain('Selected guardian');
    expect(JSON.stringify(body)).not.toMatch(/secret|privateJournal|answers/);
  });
  it('cancels even while waiting for Firebase identity without sending a request', async () => {
    authMocks.getFirebaseIdToken.mockImplementation(() => new Promise(() => undefined));
    const controller = new AbortController();
    const pending = chatWithContext([{ role: 'user', text: 'Pause' }], 'general', { language: 'en' }, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('validates studio coordinates and returns a clearly degraded local draft on malformed output', async () => {
    fetchSpy.mockResolvedValue(workerResponse(JSON.stringify({ title: 'Guardian', family: 'manager', coordinates: [0, 0, 0, 9] })));
    const draft = JSON.parse(await createStudioArchetype('Мой защитник', 'ru'));
    expect(draft.title).toBe('Мой защитник');
    expect(draft.coordinates).toEqual([0, 0, 0, 0]);
    expect(ResilientAiAdapter.degradation.degraded).toBe(true);
  });
  it('bounds a hung provider request instead of leaving the assessment busy forever', async () => {
    vi.useFakeTimers();
    fetchSpy.mockImplementation(() => new Promise(() => undefined));
    const pending = analyzeLegacyRelationalAssessment(promptInput);
    const failure = expect(pending).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(45_000);
    await failure;
    expect(fetchSpy.mock.calls[0][1].signal.aborted).toBe(true);
  });
});

describe('authenticated AI-first legacy analysis transport', () => {
  it('sends the structured request through the authenticated Worker endpoint and sanitizes the response', async () => {
    fetchSpy.mockResolvedValue(workerResponse(JSON.stringify(analysisPayload)));

    const result = await analyzeLegacyRelationalAssessment(promptInput);

    expect(apiMocks.workerApiUrl).toHaveBeenCalledWith('ai');
    expect(authMocks.getFirebaseIdToken).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/api/ai', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer firebase-id-token' }),
    }));
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.responseSchema.properties.pantheon.maxItems).toBe(8);
    expect(body.systemInstruction).toContain('I can take initiative.');
    expect(body.systemInstruction).toContain('Answer: 4');
    expect(result.pantheon).toHaveLength(4);
    expect(ResilientAiAdapter.primary).toBe('cloud');
    expect(ResilientAiAdapter.degradation.degraded).toBe(false);
  });

  it('rejects malformed model output and records degradation instead of inventing an AI result', async () => {
    fetchSpy.mockResolvedValue(workerResponse('not JSON'));

    await expect(analyzeLegacyRelationalAssessment(promptInput)).rejects.toThrow();
    expect(ResilientAiAdapter.primary).toBe('heuristic');
    expect(ResilientAiAdapter.degradation.degraded).toBe(true);
  });

  it('rejects provider/Worker errors while leaving fallback policy to the caller', async () => {
    fetchSpy.mockResolvedValue(workerResponse('', 503));

    await expect(analyzeLegacyRelationalAssessment(promptInput)).rejects.toThrow('AI service unavailable');
    expect(ResilientAiAdapter.degradation.degraded).toBe(true);
  });

  it('forwards the abort signal and propagates cancellation without returning a fallback', async () => {
    const controller = new AbortController();
    let rejectRequest!: (reason: unknown) => void;
    fetchSpy.mockImplementation(() => new Promise((_resolve, reject) => { rejectRequest = reject; }));
    const pending = analyzeLegacyRelationalAssessment(promptInput, { signal: controller.signal });
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][1].signal.aborted).toBe(false);
    controller.abort();
    rejectRequest(new DOMException('Aborted', 'AbortError'));

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(ResilientAiAdapter.degradation.degraded).toBe(false);
  });

  it('sends only a bounded computed synastry summary through the authenticated Worker', async () => {
    const narrative = 'This relationship pattern may invite a slower conversation about safety and repair. '.repeat(2);
    fetchSpy.mockResolvedValue(workerResponse(JSON.stringify({ narrative })));
    const summary = { scores: { resonance: 57, safety: 62 }, possibleLoop: ['controller', 'unseen'] };

    const result = await generateSynastryNarrative(summary, 'en');

    expect(result).toBe(narrative.trim());
    expect(fetchSpy).toHaveBeenCalledWith('/api/ai', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer firebase-id-token' }),
    }));
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.responseSchema.required).toEqual(['narrative']);
    expect(body.prompt).toContain(JSON.stringify(summary));
    expect(body.prompt).not.toContain('person1Responses');
    expect(body.systemInstruction).toContain('English');
  });

  it('rejects malformed synastry narrative output and leaves deterministic data to the caller', async () => {
    fetchSpy.mockResolvedValue(workerResponse('not JSON'));

    await expect(generateSynastryNarrative({ score: 50 }, 'ru')).rejects.toThrow();
    expect(ResilientAiAdapter.degradation.degraded).toBe(true);
    expect(ResilientAiAdapter.primary).toBe('heuristic');
  });

  it('propagates synastry narrative cancellation without a fallback result', async () => {
    const controller = new AbortController();
    let rejectRequest!: (reason: unknown) => void;
    fetchSpy.mockImplementation(() => new Promise((_resolve, reject) => { rejectRequest = reject; }));
    const pending = generateSynastryNarrative({ score: 50 }, 'en', { signal: controller.signal });
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    expect(fetchSpy.mock.calls[0][1].signal.aborted).toBe(false);
    controller.abort();
    rejectRequest(new DOMException('Aborted', 'AbortError'));
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(ResilientAiAdapter.degradation.degraded).toBe(false);
  });
});
