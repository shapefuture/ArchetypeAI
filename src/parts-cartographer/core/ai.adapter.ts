// core/ai.adapter.ts — AI_PORT adapters:
// LocalHeuristicAiAdapter (offline, deterministic) · ResilientAiAdapter (primary → heuristic + degradation descriptor)
import type { AI_PORT, Degradation } from './ports';
import { hashStr, rngFrom } from './ports';
import { workerApiUrl } from './api';
import { getFirebaseIdToken } from './auth.service';
import {
  buildLegacyAiSystemInstruction,
  LEGACY_AI_ANALYSIS_SCHEMA,
  sanitizeLegacyAiAnalysis,
  type LegacyAiAnalysis,
  type LegacyAiPromptInput,
} from './legacy-ai-analysis';

const pickFrom = <T,>(arr: T[], seed: number): T => arr[seed % arr.length];

export const LocalHeuristicAiAdapter: AI_PORT = {
  async chat(messages, mode) {
    const last = messages[messages.length - 1]?.text ?? '';
    if (/[А-Яа-яЁё]/.test(last)) return mode === 'parts'
      ? 'Какая часть сейчас говорит? Заметьте, где она ощущается в теле. Спросите, что она пытается для вас защитить, и дайте ей немного пространства.'
      : 'Давайте замедлимся. Что вы сейчас замечаете и какой небольшой бережный шаг кажется возможным?';
    const seed = hashStr(last + mode);
    const r = rngFrom(seed);
    if (mode === 'parts') {
      const lines = [
        `Which part is speaking right now? Notice its position in the body — that is already contact.`,
        `That sounds like a Manager working overtime. Ask it: "what are you afraid would happen if you stepped aside for one breath?"`,
        `A firefighter is probably near. Thank it first — it chose the loudest tool it had. Then get curious about the wave underneath.`,
        `If an exiled part surfaced: you don't have to fix it today. Witnessing is the whole intervention. 90 seconds of your calm presence.`,
        `Two parts may be polarized. Name both out loud. The one with more Self-energy behind it gets to go first.`,
      ];
      return pickFrom(lines, seed);
    }
    const lines = [
      `Here's a grounded read: the intensity is information, not instruction. What would 10% less urgency feel like in the body?`,
      `Name the feeling, then the need beneath it. Most spirals are unmet needs wearing loud clothes.`,
      `Small move: one glass of water, one window, one honest sentence. Systems settle through small, repeatable kindnesses.`,
      `You're describing a loop. Loops end when the part inside them gets heard once — not fixed, heard.`,
      `Try this: hand on heart, "this is a hard moment." Then ask which part needs the next 5 minutes.`,
    ];
    return pickFrom(lines, seed + Math.floor(r() * 7));
  },
  async aiReport(profile) {
    const p = profile as { language?: string; nextStep?: string } | null;
    return p?.language === 'ru'
      ? 'ИИ сейчас недоступен. Ваши локальные показатели не изменены. Сделайте паузу и выберите один небольшой бережный шаг.'
      : 'AI is currently unavailable. Your local indicators are unchanged. Pause and choose one small, considerate next step.';
  },
  async quickScan(code) {
    const seed = hashStr(code);
    const r = rngFrom(seed);
    const dims = ['energy sync', 'burden overlap', 'polarization risk', 'care flow', 'exile safety', 'repair speed'];
    return dims.map((d, i) => `${d}: ${Math.round(38 + r() * 58)}${i === 0 ? '%' : '%'}`).join(' · ') +
      `. Dominant bond: ${pickFrom(['mirror', 'anchor', 'catalyst', 'sanctuary', 'challenger', 'echo'], seed)}.`;
  },
  async suggestExercise(profile) {
    const { EXERCISES, suggestExercise } = await import('../../shared/core/data/exercises');
    const clinical = (profile as any)?.clinical;
    if (clinical) {
      const suggestion = suggestExercise({ profile: clinical, checkIns: [], now: new Date() });
      if (suggestion) return suggestion.exercise.id;
    }
    return EXERCISES.find((exercise) => exercise.type === 'safe_place')?.id ?? EXERCISES[0].id;
  },
  async archetypeCreate(prompt) {
    const seed = hashStr(prompt);
    const r = rngFrom(seed);
    const shapes = ['cloud', 'frog', 'triangle', 'heart', 'bean', 'egg'];
    const eyes = ['ovals', 'googly', 'closed', 'wink', 'tiny'];
    const colors = ['#3B9BFF', '#FFD000', '#FF2D8A', '#3EE0B0', '#8B6CFF', '#FF8A1F'];
    return JSON.stringify({
      shape: pickFrom(shapes, seed), eyes: pickFrom(eyes, seed + 3),
      color: colors[Math.floor(r() * colors.length)],
      mouth: pickFrom(['none', 'smile', 'o', 'flat', 'grin'], seed + 7),
      head: pickFrom(['none', 'beret', 'halo', 'horns', 'party'], seed + 11),
      face: pickFrom(['none', 'glasses', 'shades'], seed + 13),
      bow: r() > 0.6, cheeks: r() > 0.5,
      title: `${prompt.slice(0, 22)}${prompt.length > 22 ? '…' : ''} archetype`,
    });
  },
  async predictPart(event, arousal) {
    const seed = hashStr(event + arousal);
    const fams = ['manager', 'firefighter', 'exile'];
    return pickFrom(fams, seed);
  },
};

async function callCloud(payload: {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: Record<string, unknown>;
  history?: { role: 'user' | 'model'; content: string }[];
}, options?: { signal?: AbortSignal }): Promise<string> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
  const controller = new AbortController();
  const abort = () => controller.abort(options?.signal?.reason);
  if (options?.signal?.aborted) abort();
  options?.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException('AI request timed out', 'TimeoutError')), 45_000);
  const aborted = new Promise<never>((_, reject) => {
    if (controller.signal.aborted) reject(controller.signal.reason);
    else controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
  });
  try {
    const idToken = await Promise.race([getFirebaseIdToken(), aborted]);
    const response = await Promise.race([fetch(workerApiUrl('ai'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(payload), signal: controller.signal,
    }), aborted]);
    const data = await Promise.race([response.json().catch(() => ({})), aborted]) as { text?: string; error?: string };
    if (!response.ok || typeof data.text !== 'string' || !data.text.trim() || data.text.length > 100_000) {
      throw new Error(data.error || `AI service unavailable (${response.status})`);
    }
    return data.text.trim();
  } finally {
    clearTimeout(timeout);
    options?.signal?.removeEventListener('abort', abort);
  }

}

const COACH_INSTRUCTIONS = {
  parts: 'You are a gentle, IFS-informed reflective companion, not a therapist or clinician. Help the user get curious about parts without diagnosing or directing them. Respond in the same language as the user, with warmth and brevity. If the user may be in immediate danger, encourage local emergency or crisis support.',
  general: 'You are a warm, grounded self-reflection companion, not a therapist or clinician. Respond in the same language as the user, with practical, nonjudgmental support. If the user may be in immediate danger, encourage local emergency or crisis support.',
};

export const ResilientAiAdapter: AI_PORT & { degradation: Degradation; primary: 'cloud' | 'heuristic' } = {
  degradation: { degraded: false, reason: null },
  primary: 'cloud',
  async chat(messages, mode) {
    try {
      const last = [...messages].reverse().find((message) => message.role === 'user')?.text ?? '';
      if (!last.trim()) return await LocalHeuristicAiAdapter.chat(messages, mode);
      const history = messages.slice(0, -1).map((message) => ({
        role: message.role === 'ai' ? 'model' as const : 'user' as const,
        content: message.text,
      }));
      const text = await callCloud({ prompt: last, systemInstruction: COACH_INSTRUCTIONS[mode], history });
      this.degradation = { degraded: false, reason: null };
      this.primary = 'cloud';
      return text;
    } catch (error) {
      this.degradation = { degraded: true, reason: error instanceof Error ? error.message : 'AI request failed' };
      this.primary = 'heuristic';
      return LocalHeuristicAiAdapter.chat(messages, mode);
    }
  },
  async aiReport(profile, options) {
    try {
      const text = await callCloud({
        prompt: `Write a concise, compassionate, non-clinical reflection on this self-reported profile. Avoid diagnosis and certainty. Mention one strength and one gentle next step. Profile data: ${JSON.stringify(profile ?? {})}`,
        systemInstruction: 'You are a reflective writing assistant. Never diagnose, label, or claim scientific certainty. Keep the response under 180 words.',
      }, options);
      this.degradation = { degraded: false, reason: null };
      this.primary = 'cloud';
      return text;
    } catch (error) {
      if (options?.signal?.aborted) throw error;
      this.degradation = { degraded: true, reason: error instanceof Error ? error.message : 'AI request failed' };
      this.primary = 'heuristic';
      return LocalHeuristicAiAdapter.aiReport(profile);
    }
  },
  quickScan(c) { return LocalHeuristicAiAdapter.quickScan(c); },
  suggestExercise(p) { return LocalHeuristicAiAdapter.suggestExercise(p); },
  async archetypeCreate(prompt) {
    try {
      const text = await callCloud({
        prompt: `Create a fictional inner-part character from this short description: "${prompt.slice(0, 300)}". Return only a valid JSON object with keys title, family, role, description, invitation, shadow, coordinates, shape, color, eyes, mouth, head, face, bow, cheeks. coordinates must contain four finite numbers from -1 to 1 for agency, emotional temperature, relational focus and attachment. Allowed family: manager, firefighter, exile, resource. Allowed shape: cloud, frog, triangle, heart, bean, egg. Allowed eyes: ovals, googly, closed, wink, tiny. Allowed mouth: none, smile, o, flat, grin. Allowed head: none, beret, halo, horns, party. Allowed face: none, glasses, shades. Color must be a six-digit hex code. bow and cheeks must be booleans.`,
        systemInstruction: 'Return JSON only, with no markdown fences or explanation. Keep the title and role kind, imaginative, and non-clinical. Respond in the language of the description.',
      });
      this.degradation = { degraded: false, reason: null };
      this.primary = 'cloud';
      return text;
    } catch (error) {
      this.degradation = { degraded: true, reason: error instanceof Error ? error.message : 'AI request failed' };
      this.primary = 'heuristic';
      return LocalHeuristicAiAdapter.archetypeCreate(prompt);
    }
  },
  predictPart(e, a) { return LocalHeuristicAiAdapter.predictPart(e, a); },
};

/** Additive V2 chat path: explicit selected-part context, language and lifecycle cancellation. */
export async function chatWithContext(messages: { role: 'user' | 'ai'; text: string }[], mode: 'parts' | 'general', context: {
  language: 'en' | 'ru'; part?: { name?: string; family?: string; role?: string; need?: string; voice?: string };
}, options?: { signal?: AbortSignal }): Promise<string> {
  const last = [...messages].reverse().find((message) => message.role === 'user')?.text ?? '';
  const selectedPart = context.part ? Object.fromEntries(['name', 'family', 'role', 'need', 'voice']
    .filter((key) => typeof (context.part as any)[key] === 'string')
    .map((key) => [key, (context.part as any)[key].slice(0, 400)])) : null;
  try {
    const text = await callCloud({ prompt: last.slice(0, 4000),
      systemInstruction: `${COACH_INSTRUCTIONS[mode]} Respond in ${context.language === 'ru' ? 'Russian' : 'English'}. ${selectedPart ? `The user selected this part for dialogue: ${JSON.stringify(selectedPart)}. Address its protective intent and ask for permission before exploring.` : ''}`,
      history: messages.slice(-21, -1).map((message) => ({ role: message.role === 'ai' ? 'model' : 'user', content: message.text.slice(0, 4000) })),
    }, options);
    ResilientAiAdapter.degradation = { degraded: false, reason: null };
    ResilientAiAdapter.primary = 'cloud';
    return text;
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    ResilientAiAdapter.degradation = { degraded: true, reason: 'AI unavailable' };
    ResilientAiAdapter.primary = 'heuristic';
    if (context.language === 'ru') return 'Заметьте эту часть с любопытством. Что она пытается защитить? Можно дать ей немного пространства и не торопиться.';
    return LocalHeuristicAiAdapter.chat(messages, mode);
  }
}

/** Studio V2 uses the same Worker and a complete coordinate-aware DTO; confirmation remains local. */
export async function createStudioArchetype(prompt: string, language: 'en' | 'ru', options?: { signal?: AbortSignal }): Promise<string> {
  try {
    const text = await callCloud({
      prompt: `Create a kind fictional inner-part character. Description: ${prompt.slice(0, 1500)}. Return JSON with title, family (manager, firefighter, exile, resource), role, description, invitation, shadow, coordinates (four numbers in [-1,1] for agency, emotional temperature, relational focus, attachment). Optional visual keys: shape (cloud, frog, triangle, heart, bean, egg), color (hex), eyes, mouth, head, face, bow, cheeks.`,
      systemInstruction: `Return a single JSON object, no markdown. Write prose in ${language === 'ru' ? 'Russian' : 'English'}. Use reflective, imaginative language; do not diagnose.`,
    }, options);
    const model = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (!model || typeof model.title !== 'string' || !['manager', 'firefighter', 'exile', 'resource'].includes(model.family)
      || !Array.isArray(model.coordinates) || model.coordinates.length !== 4 || !model.coordinates.every((v: unknown) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1)) throw new Error('Invalid studio response');
    ResilientAiAdapter.degradation = { degraded: false, reason: null };
    ResilientAiAdapter.primary = 'cloud';
    return JSON.stringify(model);
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    ResilientAiAdapter.degradation = { degraded: true, reason: 'AI unavailable' };
    ResilientAiAdapter.primary = 'heuristic';
    const local = JSON.parse(await LocalHeuristicAiAdapter.archetypeCreate(prompt));
    return JSON.stringify({ ...local, title: prompt.slice(0, 40), family: 'manager', role: prompt.slice(0, 200), coordinates: [0, 0, 0, 0] });
  }
}

const SYNASTRY_NARRATIVE_SCHEMA = {
  type: 'OBJECT',
  properties: { narrative: { type: 'STRING' } },
  required: ['narrative'],
};

/** Optional, cancellable AI reflection over an already-computed synastry summary; raw answers are not accepted here. */
export async function generateSynastryNarrative(
  summary: unknown,
  language: 'en' | 'ru',
  options?: { signal?: AbortSignal },
): Promise<string> {
  const reportSummary = JSON.stringify(summary ?? {}).slice(0, 18_000);
  try {
    const text = await callCloud({
      prompt: `Write a concise, compassionate reflection on the following computed relationship-pattern summary. Explain only possible dynamics, never make a compatibility verdict, diagnosis, treatment claim, blame assignment, or prediction. End with one gentle, practical invitation.\n\nSummary:\n${reportSummary}`,
      systemInstruction: `You are a non-clinical reflective writing assistant. Write in ${language === 'ru' ? 'Russian' : 'English'}. Use tentative language, avoid labels for people, and clarify that the model output is not a clinical finding or relationship-safety assessment. Return only JSON with a narrative string.`,
      responseSchema: SYNASTRY_NARRATIVE_SCHEMA,
    }, options);
    if (options?.signal?.aborted) throw new DOMException('Synastry reflection cancelled.', 'AbortError');
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned) as { narrative?: unknown };
    if (typeof parsed.narrative !== 'string' || parsed.narrative.trim().length < 40 || parsed.narrative.length > 12_000) {
      throw new Error('Synastry narrative was empty or outside the allowed size.');
    }
    ResilientAiAdapter.degradation = { degraded: false, reason: null };
    ResilientAiAdapter.primary = 'cloud';
    return parsed.narrative.trim();
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    ResilientAiAdapter.degradation = { degraded: true, reason: error instanceof Error ? error.message : 'Synastry narrative failed' };
    ResilientAiAdapter.primary = 'heuristic';
    throw error;
  }
}

/** AI-first 64-item analysis. This sends all answers only after the user explicitly selects the AI mode. */
export async function analyzeLegacyRelationalAssessment(
  input: LegacyAiPromptInput,
  options?: { signal?: AbortSignal },
): Promise<LegacyAiAnalysis> {
  try {
    const text = await callCloud({
      prompt: 'Analyze the submitted 64 relational-assessment responses. Return the localized narrative, estimated pole scores, and 4–8 archetypes as JSON matching the response schema.',
      systemInstruction: buildLegacyAiSystemInstruction(input),
      responseSchema: LEGACY_AI_ANALYSIS_SCHEMA,
    }, options);
    if (options?.signal?.aborted) throw new DOMException('Analysis cancelled.', 'AbortError');
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const result = sanitizeLegacyAiAnalysis(JSON.parse(cleaned));
    ResilientAiAdapter.degradation = { degraded: false, reason: null };
    ResilientAiAdapter.primary = 'cloud';
    return result;
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    ResilientAiAdapter.degradation = { degraded: true, reason: error instanceof Error ? error.message : 'AI analysis failed' };
    ResilientAiAdapter.primary = 'heuristic';
    throw error;
  }
}

export const AI: AI_PORT = ResilientAiAdapter;
