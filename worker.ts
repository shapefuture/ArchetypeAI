/// <reference types="@cloudflare/workers-types" />
import { getMissingApiKeys } from './worker-helpers';


const AI_CORS = {
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};
function corsHeaders(request: Request): Record<string, string> {
  return { ...AI_CORS, 'Access-Control-Allow-Origin': request.headers.get('Origin') ?? '*' };
}

/**
 * Stripe secrets are OPTIONAL for the worker as a whole (the AI router does
 * not need them) — only /api/stripe-* routes check this list and return 503
 * with the missing names. Set with:
 *   wrangler secret put STRIPE_SECRET_KEY
 *   wrangler secret put STRIPE_PRICE_ID
 */
function getMissingStripeKeys(env: Env): string[] {
  const required: Array<[string, string | undefined]> = [
    ['STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY],
    ['STRIPE_PRICE_ID', env.STRIPE_PRICE_ID],
  ];
  return required.filter(([, v]) => !v).map(([k]) => k);
}

const OPENROUTER_TIMEOUT_MS = 100_000; // 100s: Massive max duration to allow huge model output generation on free tier

// Static-asset response headers (COOP / CORP) are configured in the
// `_headers` file at the project root, copied to `dist/_headers` by
// the `postbuild` script. The Cloudflare Workers Static Assets
// feature parses that file and applies the headers to every static
// asset response. This is the only supported way to add response
// headers to static assets — the worker's `fetch` handler is not
// called for asset URLs when the edge serves them directly.

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // AI Provider Router with Parallel Racer
    if (url.pathname.startsWith('/api/ai')) {
      // The app is served from Firebase Hosting; this worker is called
      // cross-origin. Same GET-less preflight + permissive JSON CORS.
      const cors = corsHeaders(request);
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
      }
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: cors });
      }
      const jsonHeaders = { 'Content-Type': 'application/json', ...cors };

      // Fail fast with a clear, actionable error when secrets are missing.
      // Without this, every provider returns 401 and the user sees a generic
      // 502 "All providers failed" — which is what hit production on
      // 2026-06-06 because `wrangler secret put` was never run after the
      // empty placeholder vars in wrangler.toml. Returning 503 (not 502)
      // signals "transient / fixable" instead of "bad gateway".
      const missingKeys = getMissingApiKeys(env);
      if (missingKeys.length > 0) {
        return new Response(JSON.stringify({
          error:
            `Missing required Cloudflare Worker secrets: ${missingKeys.join(', ')}. ` +
            `Set them with: wrangler secret put <KEY_NAME>`,
          missingKeys,
        }), { status: 503, headers: jsonHeaders });
      }

      const body = await request.json() as AIRequest;

      try {
        // Strategy: Try Ollama first (preferred), fall back to racer if it fails/times out
        console.log(`[AI] Prompt: "${body.prompt.substring(0, 80)}..."`);

        // Phase 1: Try Ollama models sequentially with short timeout
        for (const model of ['gemma4:31b-cloud']) {
          try {
            console.log(`[AI] Trying Ollama/${model}...`);
            const ollamaResult = await this.fetchOllama(body, env, model);
            const data = await ollamaResult.json() as { text: string };
            if (data.text && data.text.length >= 5) {
              if (body.responseSchema) {
                try { JSON.parse(data.text); } catch { throw new Error('Malformed JSON from Ollama'); }
              }
              console.log(`[AI] Ollama/${model} SUCCESS, text length: ${data.text.length}`);
              return new Response(JSON.stringify({
                text: data.text,
                provider: `Ollama/${model}`,
                duration: 0
              }), { headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } });
            }
          } catch (ollamaErr) {
            console.warn(`[AI] Ollama/${model} failed: ${ollamaErr instanceof Error ? ollamaErr.message : ollamaErr}`);
          }
        }

        // Phase 2: Fallback to parallel racer
        console.log(`[AI] All Ollama models failed, starting racer...`);
        const result = await this.raceAI(body, env);
        
        console.log(`[Racer] WINNER: ${result.provider} in ${result.duration}ms`);
        
        return new Response(JSON.stringify({ 
          text: result.text,
          provider: result.provider,
          duration: result.duration
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
        });
      } catch (raceError) {
        console.error('[Racer] All providers failed:', raceError);
        return new Response(JSON.stringify({
          error: `All providers failed to respond. Details: ${raceError}`
        }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } });
      }
    }

    // Stripe subscription checkout (Innerverse PWA). Like /api/ai, called
    // cross-origin from Firebase Hosting — same permissive JSON CORS.
    // Stripe keys are OPTIONAL for the worker as a whole (only these
    // routes need them); missing keys → 503 with an actionable message.
    if (url.pathname === '/api/stripe-checkout') {
      return this.handleStripeCheckout(request, env);
    }
    if (url.pathname === '/api/stripe-verify') {
      return this.handleStripeVerify(request, env);
    }

    // Legacy Gemini endpoint
    if (url.pathname.startsWith('/api/gemini')) {
      return this.fetchGeminiRaw(request, env);
    }

    // All other requests go to Assets. The Cloudflare Static Assets
    // feature serves these directly from the edge cache; COOP and CORP
    // headers are applied via the `_headers` file (see the top of this
    // file for details).
    return env.ASSETS.fetch(request);
  },

  /**
   * POST /api/stripe-checkout — create a Stripe Checkout Session
   * (subscription mode) and return {url} for the client to redirect to.
   *
   * Body: { origin: string, email?: string, locale?: 'ru' | 'en' }
   * Secrets required: STRIPE_SECRET_KEY, STRIPE_PRICE_ID
   * (set with `wrangler secret put STRIPE_SECRET_KEY` / `... STRIPE_PRICE_ID`).
   */
  async handleStripeCheckout(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }
    const jsonHeaders = { 'Content-Type': 'application/json', ...cors };

    // Same fail-fast pattern as /api/ai for missing secrets.
    const missingKeys = getMissingStripeKeys(env);
    if (missingKeys.length > 0) {
      return new Response(JSON.stringify({
        error:
          `Missing required Cloudflare Worker secrets: ${missingKeys.join(', ')}. ` +
          `Set them with: wrangler secret put <KEY_NAME>`,
        missingKeys,
      }), { status: 503, headers: jsonHeaders });
    }

    let body: { origin?: string; email?: string; locale?: string };
    try {
      body = await request.json() as typeof body;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: jsonHeaders });
    }
    const origin = body.origin || request.headers.get('Origin');
    if (!origin) {
      return new Response(JSON.stringify({
        error: 'Missing "origin" in request body (used for success_url/cancel_url).',
      }), { status: 400, headers: jsonHeaders });
    }
    const locale = body.locale === 'ru' ? 'ru' : 'en';

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', env.STRIPE_PRICE_ID!);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', `${origin}/?stripe=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${origin}/?stripe=cancel`);
    params.set('allow_promotion_codes', 'true');
    params.set('locale', locale);
    if (body.email) {
      params.set('customer_email', body.email);
    }

    try {
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        },
        body: params.toString(),
      });
      const session = await stripeRes.json() as any;
      if (!stripeRes.ok || !session.url) {
        return new Response(JSON.stringify({
          error: `Stripe checkout session creation failed: ${session?.error?.message ?? stripeRes.status}`,
        }), { status: 502, headers: jsonHeaders });
      }
      return new Response(JSON.stringify({ url: session.url }), { headers: jsonHeaders });
    } catch (err) {
      return new Response(JSON.stringify({
        error: `Stripe checkout request failed: ${err instanceof Error ? err.message : err}`,
      }), { status: 502, headers: jsonHeaders });
    }
  },

  /**
   * GET /api/stripe-verify?session_id=... — retrieve a Checkout Session and
   * return {status, customer, subscription} so the client can mark the
   * subscription active after a successful redirect.
   */
  async handleStripeVerify(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }
    const jsonHeaders = { 'Content-Type': 'application/json', ...cors };

    const missingKeys = getMissingStripeKeys(env);
    if (missingKeys.length > 0) {
      return new Response(JSON.stringify({
        error:
          `Missing required Cloudflare Worker secrets: ${missingKeys.join(', ')}. ` +
          `Set them with: wrangler secret put <KEY_NAME>`,
        missingKeys,
      }), { status: 503, headers: jsonHeaders });
    }

    const sessionId = new URL(request.url).searchParams.get('session_id');
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing session_id query parameter' }), { status: 400, headers: jsonHeaders });
    }

    try {
      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` },
      });
      const session = await stripeRes.json() as any;
      if (!stripeRes.ok) {
        return new Response(JSON.stringify({
          error: `Stripe session retrieval failed: ${session?.error?.message ?? stripeRes.status}`,
        }), { status: 502, headers: jsonHeaders });
      }
      return new Response(JSON.stringify({
        status: session.status, // 'complete' | 'open' | 'expired'
        customer: session.customer ?? null,
        subscription: session.subscription ?? null,
      }), { headers: jsonHeaders });
    } catch (err) {
      return new Response(JSON.stringify({
        error: `Stripe verify request failed: ${err instanceof Error ? err.message : err}`,
      }), { status: 502, headers: jsonHeaders });
    }
  },

  async raceAI(payload: AIRequest, env: Env): Promise<{ text: string; provider: string; duration: number }> {
    const start = Date.now();

    const providers = [
      // Ollama is the default — first to try
      { name: 'Ollama/gemma4', fn: () => this.fetchOllama(payload, env, 'gemma4:31b-cloud') },
      // Fallback providers
      { name: 'OpenRouter/NemotronUltra', fn: () => this.fetchOpenRouter(payload, env, env.OPENROUTER_MODEL) },
      { name: 'OpenRouter/AutoFree', fn: () => this.fetchOpenRouter(payload, env, 'openrouter/auto:free') },
      { name: 'NVIDIA/NimNemotronUltra', fn: () => this.fetchNvidiaNIM(payload, env) },
      { name: 'Google/Gemini', fn: () => this.fetchGemini(payload, env) }
    ];

    const tasks = providers.map(async (p) => {
      const pStart = Date.now();
      try {
        console.log(`[Racer] ${p.name} started...`);
        const response = await p.fn();
        const data = await response.json() as { text: string; _raw?: any };

        // Robustness: catch only truly empty responses. The previous
        // `< 5` threshold rejected legitimate short answers (e.g. "OK",
        // "Yes", a 1-2 word archetype) that valid models return for
        // simple prompts — masking real successes as 502s. The model
        // output is validated downstream by JSON.parse when a
        // responseSchema is present.
        if (!data.text) {
          // Surface the raw provider response so 502s are diagnosable
          // (a 200 with `{ error: "..." }` and a 200 with `{ choices: [] }`
          // look identical from `text` alone).
          const rawExcerpt = data._raw
            ? JSON.stringify(data._raw).slice(0, 400)
            : 'no _raw field';
          throw new Error(`Empty response (raw: ${rawExcerpt})`);
        }

        // If it's a JSON request, verify it's parsable
        if (payload.responseSchema) {
           try {
             JSON.parse(data.text);
           } catch (e) {
             throw new Error(`Malformed JSON response (text: ${data.text.slice(0, 200)})`);
           }
        }

        const duration = Date.now() - pStart;
        console.log(`[Racer] ${p.name} finished successfully in ${duration}ms`);
        return { text: data.text, provider: p.name, duration };
      } catch (err) {
        const duration = Date.now() - pStart;
        console.warn(`[Racer] ${p.name} FAILED after ${duration}ms: ${err instanceof Error ? err.message : err}`);
        throw err;
      }
    });

    // Promise.any returns the first fulfilled promise
    try {
      const result = await Promise.any(tasks);
      console.log(`[Racer] All provider statuses logged above. Winner: ${result.provider}`);
      return result;
    } catch (e) {
      if (e instanceof AggregateError) {
        console.error(`[Racer] ALL ${e.errors.length} providers failed:`, e.errors.map((err: any, i: number) => `[${i}] ${err.message}`));
        throw new Error(e.errors.map(err => err.message).join(' | '));
      }
      throw e;
    }
  },

  async fetchOllama(payload: AIRequest, env: Env, model: string): Promise<Response> {
    // Ollama native API uses /api/chat
    const ollamaUrl = 'https://api.ollama.com/api/chat';

    let systemContent = payload.systemInstruction || '';
    if (payload.responseSchema) {
      const schemaStr = JSON.stringify(payload.responseSchema, null, 2);
      systemContent += `\n\nCRITICAL: You MUST respond with ONLY a valid JSON object, no prose, no markdown fences. Strictly follow this schema:\n${schemaStr}`;
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }

    if (payload.history) {
      messages.push(...payload.history
        .filter(m => m.role === 'user' || m.role === 'model')
        .map(m => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content
        })));
    }

    messages.push({ role: 'user', content: payload.prompt });

    // Ollama native format
    const bodyPayload = {
      model,
      messages,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 4096,
      },
      ...(payload.responseSchema ? { format: 'json' } : {})
    };

    console.log(`[Ollama/${model}] Sending to ${ollamaUrl}, msgs: ${messages.length}, sysLen: ${systemContent.length}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OLLAMA_API_KEY}`
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });

      console.log(`[Ollama/${model}] Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Ollama/${model}] Error: ${errText.substring(0, 500)}`);
        throw new Error(`Ollama/${model} API error: ${response.status} - ${errText}`);
      }

      const data = await response.json() as any;
      // Ollama native format: { message: { content: "..." } }
      let text = data.message?.content || data.choices?.[0]?.message?.content || '';

      console.log(`[Ollama/${model}] Text len: ${text.length}, first 200: ${text.substring(0, 200)}`);

      // Robust JSON extraction
      if (payload.responseSchema && text) {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s);
        if (jsonMatch) {
          text = jsonMatch[1].trim();
        }
      }

      return new Response(JSON.stringify({ text, provider: `Ollama/${model}`, _raw: data }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Ollama/${model} timed out after 60s (AbortError)`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async fetchOpenRouter(payload: AIRequest, env: Env, model: string): Promise<Response> {
    const openrouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // Build system instruction, injecting schema if present
    let systemContent = payload.systemInstruction || '';
    if (payload.responseSchema) {
      const schemaStr = JSON.stringify(payload.responseSchema, null, 2);
      systemContent += `\n\nCRITICAL: You MUST respond with ONLY a valid JSON object, no prose, no markdown fences. Strictly follow this schema:\n${schemaStr}`;
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }

    if (payload.history) {
      messages.push(...payload.history
        .filter(m => m.role === 'user' || m.role === 'model')
        .map(m => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content
        })));
    }

    messages.push({ role: 'user', content: payload.prompt });

    // AbortController for strict wall-clock timeout on connection AND body streaming
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    try {
      const response = await fetch(openrouterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://archetypeai-worker.wmobilas.workers.dev',
          'X-Title': 'ArchetypeAI'
        },
        body: JSON.stringify({
          model: model,
          messages,
          temperature: 0.1,
          ...(payload.responseSchema ? { response_format: { type: 'json_object' } } : {})
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${model} API error: ${response.status} - ${errText}`);
      }

      const data = await response.json() as any;
      let text = data.choices?.[0]?.message?.content || '';

      // Robust JSON extraction
      if (payload.responseSchema && text) {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s);
        if (jsonMatch) {
          text = jsonMatch[1].trim();
        }
      }

      return new Response(JSON.stringify({ text, _raw: data }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`${model} timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s (AbortError)`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async fetchGemini(payload: AIRequest, env: Env): Promise<Response> {
    const models = [
      'gemini-3.1-flash-lite'
    ];

    const errors: string[] = [];

    const attempts = models.map(async (model) => {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`;
      
      const contents = [];
      if (payload.history) {
        contents.push(...payload.history
          .filter(m => m.role === 'user' || m.role === 'model')
          .map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          })));
      }
      contents.push({
        role: 'user',
        parts: [
          ...(payload.systemInstruction ? [{ text: `SYSTEM INSTRUCTION: ${payload.systemInstruction}\n\n` }] : []),
          { text: payload.prompt }
        ]
      });

      const body = {
        contents,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          ...(payload.responseSchema ? {
            responseMimeType: 'application/json',
            responseSchema: payload.responseSchema
          } : {})
        }
      };

      const controller = new AbortController();
      // 30s per individual model request in the parallel pool
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`${model} failed (${response.status}): ${errText}`);
        }

        const data = await response.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!text || text.length < 10) {
          throw new Error(`${model} returned invalid or empty content`);
        }

        return new Response(JSON.stringify({ text, _raw: data }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e: any) {
        clearTimeout(timeoutId);
        throw e;
      }
    });

    // Race all Gemini models. First valid success wins.
    return await Promise.any(attempts);
  },

  async fetchGeminiRaw(request: Request, env: Env): Promise<Response> {
    // For direct proxying, we just use the flash-lite primary
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${env.GOOGLE_API_KEY}`;
    const body = await request.text();
    return fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  },

  async fetchNvidiaNIM(payload: AIRequest, env: Env): Promise<Response> {
    const nvidiaUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const models = ['nvidia/nemotron-3-ultra-550b-a55b'];
    let lastError = '';

    for (const model of models) {
      try {
        const controller = new AbortController();
        // 40s per NIM model for reasoned generation
        const timeoutId = setTimeout(() => controller.abort(), 40_000);

        const response = await fetch(nvidiaUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.NVIDIA_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              ...(payload.systemInstruction ? [{ role: 'system', content: payload.systemInstruction }] : []),
              ...(payload.history || []).map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
              { role: 'user', content: payload.prompt }
            ],
            temperature: 0.1,
            max_tokens: 4096,
            ...(payload.responseSchema ? { response_format: { type: 'json_object' } } : {})
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          lastError = await response.text();
          clearTimeout(timeoutId);
          continue;
        }

        const data = await response.json() as any;
        clearTimeout(timeoutId);
        const msg = data.choices?.[0]?.message;
        let text = msg?.content || msg?.reasoning || msg?.reasoning_content || '';

        // If content is empty but reasoning is present, treat reasoning as the content
        // (common in Step-3.5-Flash or GLM-thinking models)
        if (!msg?.content && (msg?.reasoning || msg?.reasoning_content)) {
          text = msg.reasoning || msg.reasoning_content;
        }

        // Robust JSON extraction for NIM
        if (payload.responseSchema && text) {
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s);
          if (jsonMatch) text = jsonMatch[1].trim();
        }

        return new Response(JSON.stringify({ text, provider: `Nvidia/${model}`, _raw: data }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        lastError = err.message;
      }
    }
    throw new Error(`NVIDIA NIM failed: ${lastError}`);
  }
};

interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: any;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

interface Env {
  GOOGLE_API_KEY: string;
  OPENROUTER_API_KEY: string;
  NVIDIA_API_KEY: string;
  OLLAMA_API_KEY: string;
  OPENROUTER_MODEL: string;
  AI_PROVIDER_DEFAULT: string;
  /** Stripe subscription checkout (optional — only /api/stripe-* needs them).
   *  Set with: wrangler secret put STRIPE_SECRET_KEY / STRIPE_PRICE_ID */
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_ID?: string;
  ASSETS: Fetcher;
}
