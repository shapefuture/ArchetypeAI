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
    const p = profile as { headline?: string; validity?: number } | null;
    return `AI report (local heuristic): headline "${p?.headline ?? 'unset'}". Validity ${(p?.validity ?? 0.7).toFixed(2)}. ` +
      `The system shows protective organization before relational openness — classic Manager-led sky with Firefighter backup. ` +
      `Recommended next: one witnessing exercise per day for 7 days, then re-scan polarizations.`;
  },
  async quickScan(code) {
    const seed = hashStr(code);
    const r = rngFrom(seed);
    const dims = ['energy sync', 'burden overlap', 'polarization risk', 'care flow', 'exile safety', 'repair speed'];
    return dims.map((d, i) => `${d}: ${Math.round(38 + r() * 58)}${i === 0 ? '%' : '%'}`).join(' · ') +
      `. Dominant bond: ${pickFrom(['mirror', 'anchor', 'catalyst', 'sanctuary', 'challenger', 'echo'], seed)}.`;
  },
  async suggestExercise(profile) {
    const seed = hashStr(JSON.stringify(profile ?? {}) || 'x');
    const ids = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10', 'e11', 'e12', 'e13', 'e14', 'e15', 'e16', 'e17', 'e18', 'e19', 'e20'];
    return pickFrom(ids, seed);
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
  const idToken = await getFirebaseIdToken();
  const response = await fetch(workerApiUrl('ai'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
    signal: options?.signal,
  });
  const data = await response.json().catch(() => ({})) as { text?: string; error?: string };
  if (!response.ok || !data.text?.trim()) {
    throw new Error(data.error || `AI service unavailable (${response.status})`);
  }
  return data.text.trim();
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
        prompt: `Create a fictional inner-part character from this short description: "${prompt.slice(0, 300)}". Return only a valid JSON object with keys title, family, role, shape, color, eyes, mouth, head, face, bow, cheeks. Allowed family: manager, firefighter, exile, resource. Allowed shape: cloud, frog, triangle, heart, bean, egg. Allowed eyes: ovals, googly, closed, wink, tiny. Allowed mouth: none, smile, o, flat, grin. Allowed head: none, beret, halo, horns, party. Allowed face: none, glasses, shades. Color must be a six-digit hex code. bow and cheeks must be booleans.`,
        systemInstruction: 'Return JSON only, with no markdown fences or explanation. Keep the title and role kind, imaginative, and non-clinical.',
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
