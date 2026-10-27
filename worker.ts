/// <reference types="@cloudflare/workers-types" />
import { getMissingApiKeys, hasAnyApiKey } from './worker-helpers';
import {
  authenticateFirebaseRequest,
  checkRateLimit,
  corsHeaders,
  getAllowedStripeReturnOrigin,
  type FirebaseIdentity,
  type RateLimiterBinding,
} from './worker-security';

const OPENROUTER_TIMEOUT_MS = 100_000;
const MAX_AI_BODY_BYTES = 256_000;
const MAX_BILLING_BODY_BYTES = 8_192;

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

async function parseJsonBody(
  request: Request,
  maximumBytes: number,
): Promise<{ value: unknown } | { error: string; status: number }> {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { error: 'Content-Type must be application/json', status: 415 };
  }

  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    return { error: 'Request body is too large', status: 413 };
  }

  let text: string;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    reader = request.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        totalBytes += value.byteLength;
        if (totalBytes > maximumBytes) {
          try { await reader.cancel(); } catch { /* body already closed */ }
          return { error: 'Request body is too large', status: 413 };
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    try { await reader?.cancel(); } catch { /* body already closed */ }
    return { error: 'Could not read request body', status: 400 };
  }
  try {
    return { value: JSON.parse(text) as unknown };
  } catch {
    return { error: 'Invalid JSON body', status: 400 };
  }
}

function validateAIRequest(value: unknown): AIRequest | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const allowedKeys = new Set(['prompt', 'systemInstruction', 'responseSchema', 'history']);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) return null;
  if (typeof body.prompt !== 'string' || body.prompt.trim().length === 0 || body.prompt.length > 80_000) return null;
  if (body.systemInstruction !== undefined
    && (typeof body.systemInstruction !== 'string' || body.systemInstruction.length > 80_000)) return null;

  let textSize = body.prompt.length + (typeof body.systemInstruction === 'string' ? body.systemInstruction.length : 0);
  if (body.history !== undefined) {
    if (!Array.isArray(body.history) || body.history.length > 40) return null;
    for (const item of body.history) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const message = item as Record<string, unknown>;
      if ((message.role !== 'user' && message.role !== 'model')
        || typeof message.content !== 'string'
        || message.content.length > 16_000
        || Object.keys(message).some((key) => key !== 'role' && key !== 'content')) return null;
      textSize += message.content.length;
    }
  }
  if (body.responseSchema !== undefined) {
    if (!body.responseSchema || typeof body.responseSchema !== 'object' || Array.isArray(body.responseSchema)) return null;
    try {
      textSize += JSON.stringify(body.responseSchema).length;
    } catch {
      return null;
    }
  }
  if (textSize > MAX_AI_BODY_BYTES) return null;
  return body as unknown as AIRequest;
}

/**
 * A route whose secrets are not set. The operator needs the secret names, so they
 * go to the Worker log; the caller learns only that the service is not configured.
 */
function notConfigured(missingKeys: string[], cors: Record<string, string>): Response {
  console.error(`[config] Missing Worker secrets: ${missingKeys.join(', ')}. Set them with: wrangler secret put <KEY_NAME>`);
  return jsonResponse({ error: 'This service is not configured yet.' }, 503, cors);
}

async function authorizeWorkerRequest(
  request: Request,
  env: Env,
  endpoint: string,
  userLimiter: RateLimiterBinding | undefined,
  ipLimiter: RateLimiterBinding | undefined,
  headers: Record<string, string>,
): Promise<{ identity: FirebaseIdentity } | { response: Response }> {
  if (!env.FIREBASE_PROJECT_ID) {
    return { response: jsonResponse({ error: 'Worker authentication is not configured' }, 503, headers) };
  }

  // Apply the IP bucket before JWT verification so unauthenticated traffic is
  // bounded too; then apply the per-user bucket after the token is verified.
  // A missing binding fails closed (503), as the user bucket does. Requests without a client IP share one bucket.
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const ipLimit = await checkRateLimit(ipLimiter, `${endpoint}:ip:${ip}`);
  if (ipLimit === 'unavailable') {
    return { response: jsonResponse({ error: 'Request protection is temporarily unavailable' }, 503, headers) };
  }
  if (ipLimit === 'limited') {
    return { response: jsonResponse({ error: 'Too many requests. Please try again shortly.' }, 429, { ...headers, 'Retry-After': '60' }) };
  }

  const identity = await authenticateFirebaseRequest(request, env.FIREBASE_PROJECT_ID);
  if (!identity) {
    return { response: jsonResponse({ error: 'A valid Firebase sign-in is required' }, 401, headers) };
  }

  const userLimit = await checkRateLimit(userLimiter, `${endpoint}:uid:${identity.uid}`);
  if (userLimit === 'unavailable') {
    return { response: jsonResponse({ error: 'Request protection is temporarily unavailable' }, 503, headers) };
  }
  if (userLimit === 'limited') {
    return { response: jsonResponse({ error: 'Too many requests. Please try again shortly.' }, 429, { ...headers, 'Retry-After': '60' }) };
  }

  return { identity };
}

function getMissingStripeKeys(env: Env): string[] {
  const required: Array<[string, string | undefined]> = [
    ['STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY],
    ['STRIPE_PRICE_ID', env.STRIPE_PRICE_ID],
  ];
  return required.filter(([, value]) => !value).map(([name]) => name);
}

// Static-asset response headers (COOP / CORP) are configured in the `_headers`
// file at the project root and applied by Cloudflare's Static Assets layer.

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/ai') return this.handleAI(request, env);
    if (url.pathname === '/api/stripe-checkout') return this.handleStripeCheckout(request, env);
    if (url.pathname === '/api/stripe-verify') return this.handleStripeVerify(request, env);

    // Retire the old raw Gemini proxy. All supported cloud AI requests now use
    // the authenticated, rate-limited /api/ai route.
    if (url.pathname === '/api/gemini' || url.pathname.startsWith('/api/gemini/')) {
      return new Response('Gone', { status: 410, headers: { 'Cache-Control': 'no-store' } });
    }

    // The API-only deploy (wrangler.api.toml) has no static assets binding.
    if (!env.ASSETS) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return env.ASSETS.fetch(request);
  },

  async handleAI(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env.ALLOWED_APP_ORIGINS);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

    const authorization = await authorizeWorkerRequest(
      request,
      env,
      'ai',
      env.AI_RATE_LIMITER,
      env.AI_IP_RATE_LIMITER,
      cors,
    );
    if ('response' in authorization) return authorization.response;

    const missingKeys = getMissingApiKeys(env);
    if (!hasAnyApiKey(env)) {
      return notConfigured(missingKeys, cors);
    }
    if (missingKeys.length > 0) console.warn(`AI providers without a key (their requests will fail over): ${missingKeys.join(', ')}`);

    const parsed = await parseJsonBody(request, MAX_AI_BODY_BYTES);
    if ('error' in parsed) return jsonResponse({ error: parsed.error }, parsed.status, cors);
    const body = validateAIRequest(parsed.value);
    if (!body) return jsonResponse({ error: 'Invalid AI request payload' }, 400, cors);

    try {
      const ollamaStartedAt = Date.now();
      try {
        const ollamaResult = await this.fetchOllama(body, env, 'gemma4:31b-cloud');
        const data = await ollamaResult.json() as { text?: string };
        if (typeof data.text === 'string' && data.text.length >= 5) {
          if (body.responseSchema) JSON.parse(data.text);
          return jsonResponse({
            text: data.text,
            provider: 'Ollama/gemma4:31b-cloud',
            duration: Date.now() - ollamaStartedAt,
          }, 200, cors);
        }
      } catch {
        // Provider failures are intentionally not logged: their error bodies
        // can contain fragments of the user's sensitive prompt.
      }

      // Ollama was just tried above, so the race uses the other providers.
      const result = await this.raceAI(body, env, ['Ollama/gemma4']);
      return jsonResponse({ text: result.text, provider: result.provider, duration: result.duration }, 200, cors);
    } catch {
      // Do not log prompts, model outputs, provider bodies, or exception text.
      console.error('[AI] All configured providers failed');
      return jsonResponse({ error: 'AI providers are currently unavailable. Please try again.' }, 502, cors);
    }
  },

  /** Create a Stripe Checkout Session with an allowlisted return origin. */
  async handleStripeCheckout(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env.ALLOWED_APP_ORIGINS);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

    const authorization = await authorizeWorkerRequest(
      request,
      env,
      'billing',
      env.BILLING_RATE_LIMITER,
      env.BILLING_RATE_LIMITER,
      cors,
    );
    if ('response' in authorization) return authorization.response;

    const missingKeys = getMissingStripeKeys(env);
    if (missingKeys.length > 0) {
      return notConfigured(missingKeys, cors);
    }

    const parsed = await parseJsonBody(request, MAX_BILLING_BODY_BYTES);
    if ('error' in parsed) return jsonResponse({ error: parsed.error }, parsed.status, cors);
    if (!parsed.value || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
      return jsonResponse({ error: 'Invalid checkout request' }, 400, cors);
    }
    const body = parsed.value as { origin?: unknown; locale?: unknown };
    if (body.origin !== undefined && typeof body.origin !== 'string') {
      return jsonResponse({ error: 'Invalid checkout return origin' }, 400, cors);
    }
    const origin = getAllowedStripeReturnOrigin(
      body.origin as string | undefined,
      request.headers.get('Origin'),
      env.ALLOWED_APP_ORIGINS,
    );
    if (!origin) return jsonResponse({ error: 'Checkout return origin is not allowed' }, 400, cors);

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', env.STRIPE_PRICE_ID!);
    params.set('line_items[0][quantity]', '1');
    params.set('client_reference_id', authorization.identity.uid);
    params.set('success_url', `${origin}/?stripe=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${origin}/?stripe=cancel`);
    params.set('allow_promotion_codes', 'true');
    params.set('locale', body.locale === 'ru' ? 'ru' : 'en');
    if (authorization.identity.emailVerified && authorization.identity.email) {
      params.set('customer_email', authorization.identity.email);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    try {
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        },
        body: params.toString(),
        signal: controller.signal,
      });
      const session = await stripeRes.json() as { url?: unknown };
      if (!stripeRes.ok || typeof session.url !== 'string' || !session.url.startsWith('https://checkout.stripe.com/')) {
        return jsonResponse({ error: 'Stripe checkout session could not be created' }, 502, cors);
      }
      return jsonResponse({ url: session.url }, 200, cors);
    } catch {
      return jsonResponse({ error: 'Stripe checkout service is temporarily unavailable' }, 502, cors);
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /** Verify only Checkout Sessions owned by the authenticated Firebase user. */
  async handleStripeVerify(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env.ALLOWED_APP_ORIGINS);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: cors });

    const authorization = await authorizeWorkerRequest(
      request,
      env,
      'billing',
      env.BILLING_RATE_LIMITER,
      env.BILLING_RATE_LIMITER,
      cors,
    );
    if ('response' in authorization) return authorization.response;

    const missingKeys = getMissingStripeKeys(env);
    if (missingKeys.length > 0) {
      return notConfigured(missingKeys, cors);
    }

    const sessionId = new URL(request.url).searchParams.get('session_id');
    if (!sessionId || sessionId.length > 200 || !/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
      return jsonResponse({ error: 'Invalid session_id query parameter' }, 400, cors);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    try {
      // The subscription is expanded: a Checkout Session stays `complete` forever,
      // so only the subscription's own status says whether it is still paid.
      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand%5B%5D=subscription`, {
        headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` },
        signal: controller.signal,
      });
      // Only Stripe saying the session does not exist is a 404. A rate limit or an outage is temporary: the client keeps
      // its pending session and asks again.
      if (!stripeRes.ok) {
        if (stripeRes.status === 404) return jsonResponse({ error: 'Checkout Session not found' }, 404, cors);
        return jsonResponse({ error: 'Stripe verification service is temporarily unavailable' }, 502, cors);
      }
      const session = await stripeRes.json() as {
        status?: string;
        mode?: string;
        client_reference_id?: string | null;
        customer_details?: { email?: string | null } | null;
        payment_status?: string;
        subscription?: unknown;
      };
      if (session.mode !== 'subscription') {
        return jsonResponse({ error: 'Checkout Session not found' }, 404, cors);
      }

      const legacyEmailMatch = !session.client_reference_id
        && authorization.identity.emailVerified
        && authorization.identity.email
        && session.customer_details?.email?.toLowerCase() === authorization.identity.email.toLowerCase();
      if (session.client_reference_id !== authorization.identity.uid && !legacyEmailMatch) {
        return jsonResponse({ error: 'Checkout Session not found' }, 404, cors);
      }

      const subscription = session.subscription as { status?: unknown } | string | null | undefined;
      const subscriptionStatus = typeof subscription === 'object' && subscription ? subscription.status : undefined;
      const hasPaidSubscription = (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
        && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
      // An `incomplete` subscription is waiting on its first payment (Stripe ends it after 23 hours). The session may still
      // become paid, so it stays open: the client keeps its pending session and asks again.
      const awaitingPayment = subscriptionStatus === 'incomplete';
      const status = session.status === 'complete'
        ? (hasPaidSubscription ? 'complete' : awaitingPayment ? 'open' : 'inactive')
        : session.status === 'expired' ? 'expired' : 'open';
      return jsonResponse({ status }, 200, cors);
    } catch {
      return jsonResponse({ error: 'Stripe verification service is temporarily unavailable' }, 502, cors);
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async raceAI(payload: AIRequest, env: Env, skip: ReadonlyArray<string> = []): Promise<{ text: string; provider: string; duration: number }> {
    const providers = [
      { name: 'Ollama/gemma4', fn: () => this.fetchOllama(payload, env, 'gemma4:31b-cloud') },
      { name: 'OpenRouter/NemotronUltra', fn: () => this.fetchOpenRouter(payload, env, env.OPENROUTER_MODEL) },
      { name: 'OpenRouter/AutoFree', fn: () => this.fetchOpenRouter(payload, env, 'openrouter/auto:free') },
      { name: 'NVIDIA/NimNemotronUltra', fn: () => this.fetchNvidiaNIM(payload, env) },
      { name: 'Google/Gemini', fn: () => this.fetchGemini(payload, env) },
    ].filter((provider) => !skip.includes(provider.name));

    const tasks = providers.map(async (provider) => {
      const startedAt = Date.now();
      try {
        const response = await provider.fn();
        const data = await response.json() as { text?: unknown };
        if (typeof data.text !== 'string' || !data.text) throw new Error('Empty provider response');
        if (payload.responseSchema) {
          try {
            JSON.parse(data.text);
          } catch {
            throw new Error('Malformed JSON response');
          }
        }
        return {
          text: data.text,
          provider: provider.name,
          duration: Date.now() - startedAt,
        };
      } catch {
        // Provider messages and response bodies may echo user input; never log them.
        throw new Error(`${provider.name} failed`);
      }
    });

    try {
      return await Promise.any(tasks);
    } catch {
      throw new Error('All AI providers failed');
    }
  },

  async fetchOllama(payload: AIRequest, env: Env, model: string): Promise<Response> {
    const ollamaUrl = 'https://api.ollama.com/api/chat';
    let systemContent = payload.systemInstruction || '';
    if (payload.responseSchema) {
      const schemaStr = JSON.stringify(payload.responseSchema, null, 2);
      systemContent += `\n\nCRITICAL: You MUST respond with ONLY a valid JSON object, no prose, no markdown fences. Strictly follow this schema:\n${schemaStr}`;
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (systemContent) messages.push({ role: 'system', content: systemContent });
    if (payload.history) {
      messages.push(...payload.history
        .filter((message) => message.role === 'user' || message.role === 'model')
        .map((message) => ({
          role: message.role === 'model' ? 'assistant' : message.role,
          content: message.content,
        })));
    }
    messages.push({ role: 'user', content: payload.prompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OLLAMA_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: { temperature: 0.1, num_predict: 4096 },
          ...(payload.responseSchema ? { format: 'json' } : {}),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Ollama provider returned ${response.status}`);

      const data = await response.json() as any;
      let text = data.message?.content || data.choices?.[0]?.message?.content || '';
      if (payload.responseSchema && text) {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s);
        if (jsonMatch) text = jsonMatch[1].trim();
      }
      return new Response(JSON.stringify({ text, provider: `Ollama/${model}` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new Error('Ollama provider timed out');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async fetchOpenRouter(payload: AIRequest, env: Env, model: string): Promise<Response> {
    const openrouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    let systemContent = payload.systemInstruction || '';
    if (payload.responseSchema) {
      const schemaStr = JSON.stringify(payload.responseSchema, null, 2);
      systemContent += `\n\nCRITICAL: You MUST respond with ONLY a valid JSON object, no prose, no markdown fences. Strictly follow this schema:\n${schemaStr}`;
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (systemContent) messages.push({ role: 'system', content: systemContent });
    if (payload.history) {
      messages.push(...payload.history
        .filter((message) => message.role === 'user' || message.role === 'model')
        .map((message) => ({
          role: message.role === 'model' ? 'assistant' : message.role,
          content: message.content,
        })));
    }
    messages.push({ role: 'user', content: payload.prompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
    try {
      const response = await fetch(openrouterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://archetypeai-worker.wmobilas.workers.dev',
          'X-Title': 'ArchetypeAI',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          ...(payload.responseSchema ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`OpenRouter provider returned ${response.status}`);

      const data = await response.json() as any;
      let text = data.choices?.[0]?.message?.content || '';
      if (payload.responseSchema && text) {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s);
        if (jsonMatch) text = jsonMatch[1].trim();
      }
      return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new Error('OpenRouter provider timed out');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async fetchGemini(payload: AIRequest, env: Env): Promise<Response> {
    const model = 'gemini-3.1-flash-lite';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (payload.history) {
      contents.push(...payload.history
        .filter((message) => message.role === 'user' || message.role === 'model')
        .map((message) => ({ role: message.role, parts: [{ text: message.content }] })));
    }
    contents.push({
      role: 'user',
      parts: [
        ...(payload.systemInstruction ? [{ text: `SYSTEM INSTRUCTION: ${payload.systemInstruction}\n\n` }] : []),
        { text: payload.prompt },
      ],
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GOOGLE_API_KEY,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            ...(payload.responseSchema ? {
              responseMimeType: 'application/json',
              responseSchema: payload.responseSchema,
            } : {}),
          },
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Gemini provider returned ${response.status}`);

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text || text.length < 10) throw new Error('Gemini provider returned an empty response');
      return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new Error('Gemini provider timed out');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async fetchNvidiaNIM(payload: AIRequest, env: Env): Promise<Response> {
    const nvidiaUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const model = 'nvidia/nemotron-3-ultra-550b-a55b';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40_000);
    try {
      const response = await fetch(nvidiaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(payload.systemInstruction ? [{ role: 'system', content: payload.systemInstruction }] : []),
            ...(payload.history || []).map((message) => ({
              role: message.role === 'model' ? 'assistant' : message.role,
              content: message.content,
            })),
            { role: 'user', content: payload.prompt },
          ],
          temperature: 0.1,
          max_tokens: 4096,
          ...(payload.responseSchema ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`NVIDIA provider returned ${response.status}`);

      const data = await response.json() as any;
      const message = data.choices?.[0]?.message;
      // Only the model's answer is ever returned. Its reasoning trace is not an
      // answer (and can echo the prompt), so an empty answer fails this provider
      // and the race moves on to the next one.
      let text: string = typeof message?.content === 'string' ? message.content : '';
      if (!text.trim()) throw new Error('NVIDIA provider returned no answer');
      if (payload.responseSchema && text) {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s);
        if (jsonMatch) text = jsonMatch[1].trim();
      }
      return new Response(JSON.stringify({ text, provider: `Nvidia/${model}` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new Error('NVIDIA provider timed out');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
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
  FIREBASE_PROJECT_ID: string;
  ALLOWED_APP_ORIGINS?: string;
  AI_RATE_LIMITER?: RateLimiterBinding;
  AI_IP_RATE_LIMITER?: RateLimiterBinding;
  BILLING_RATE_LIMITER?: RateLimiterBinding;
  /** Stripe subscription checkout (optional — only /api/stripe-* needs them). */
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_ID?: string;
  /** Bound only by the app deploy (wrangler.toml); absent on the API-only deploy. */
  ASSETS?: Fetcher;
}
