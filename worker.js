// Cloudflare Worker — Translation API + KV-backed credit enforcement.
//
// Required bindings (wrangler.toml):
//   KV: ADM_USERS  (stores per-device credit state under key `credit:<deviceId>`)
//   KV: ADM_HISTORY (unused here, kept for future use)
// Required secrets (set via `wrangler secret put <NAME>`):
//   OPENAI_API_KEY        — OpenAI API key
//   ADMIN_TOKEN           — bearer token for /api/credits/grant
//   STRIPE_SECRET_KEY       — Stripe secret key (sk_live_… or sk_test_…)
//   STRIPE_WEBHOOK_SECRET   — Stripe webhook signing secret (whsec_…)

// ---------- Translation ----------

class TranslationService {
  constructor() {
    this.openaiApiKey = null;
  }

  getChatGPTPrompt(text, toolType) {
    const prompts = {
      career: `Convert this Brazilian professional experience into clear, impactful English for European recruiters. Focus on results, metrics, and professional language. Return only the translated text:\n\n${text}`,
      cultural: `Convert this Brazilian professional behavior context for UK/European workplace understanding. Maintain professionalism while adapting cultural nuances. Return only the translated text:\n\n${text}`,
      identity_reframe: `Help reframe this professional identity challenge for international career transition. Provide constructive, empowering guidance in English. Return only the response:\n\n${text}`,
      say_it_better: `Rewrite this message in clear, professional English suitable for the workplace. Return only the improved text:\n\n${text}`,
      default: `Translate this Brazilian Portuguese text to professional English, maintaining context and nuance. Return only the translation:\n\n${text}`
    };
    return prompts[toolType] || prompts.default;
  }

  async translate(text, toolType = 'default') {
    const prompt = this.getChatGPTPrompt(text, toolType);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional translation specialist. Provide accurate, natural translations that maintain the original meaning and tone.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }

  costEstimate(text) {
    const chars = text.length;
    return { service: 'ChatGPT', estimatedCost: (chars / 1_000_000) * 0.50, characters: chars };
  }
}

// ---------- Credit ledger (KV-backed) ----------

const DEVICE_ID_RE = /^dev_[a-z0-9_]+$/i;
const kvKey = (deviceId) => `credit:${deviceId}`;

async function getCreditState(env, deviceId) {
  const raw = await env.ADM_USERS.get(kvKey(deviceId));
  if (!raw) return { balance: 0, freeUsed: false, redeemedTokens: [] };
  try { return JSON.parse(raw); }
  catch { return { balance: 0, freeUsed: false, redeemedTokens: [] }; }
}

async function setCreditState(env, deviceId, state) {
  await env.ADM_USERS.put(kvKey(deviceId), JSON.stringify(state));
}

async function spendCredit(env, deviceId) {
  const state = await getCreditState(env, deviceId);
  if (!state.freeUsed) {
    state.freeUsed = true;
    await setCreditState(env, deviceId, state);
    return { ok: true, source: 'free', remaining: state.balance };
  }
  if (state.balance > 0) {
    state.balance -= 1;
    await setCreditState(env, deviceId, state);
    return { ok: true, source: 'paid', remaining: state.balance };
  }
  return { ok: false, source: null, remaining: 0 };
}

async function refundCredit(env, deviceId, source) {
  const state = await getCreditState(env, deviceId);
  if (source === 'free') state.freeUsed = false;
  else if (source === 'paid') state.balance += 1;
  await setCreditState(env, deviceId, state);
}

// ---------- Analytics events (KV-backed, first-party) ----------

const EVENT_TYPES = new Set([
  'page_view', 'first_visit',
  'tool_started', 'translate_succeeded', 'translate_failed', 'no_credits',
  'waitlist_submitted', 'reviewer_applied', 'guide_requested',
  'paywall_opened', 'pack_clicked', 'credits_purchased',
]);

async function recordEvent(env, event) {
  if (!event || !EVENT_TYPES.has(event.type)) return false;
  const ts = Number.isFinite(event.ts) ? event.ts : Date.now();
  const id = ts.toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const key = `event:${id}`;
  const value = JSON.stringify({
    type: event.type,
    deviceId: typeof event.deviceId === 'string' && DEVICE_ID_RE.test(event.deviceId) ? event.deviceId : null,
    utm: event.utm && typeof event.utm === 'object' ? event.utm : {},
    props: event.props && typeof event.props === 'object' ? event.props : {},
    path: typeof event.path === 'string' ? event.path.slice(0, 200) : '',
    ts,
  });
  // 90-day retention — KV auto-expires entries, no cron needed.
  await env.ADM_USERS.put(key, value, { expirationTtl: 60 * 60 * 24 * 90 });
  return true;
}

async function grantCredits(env, deviceId, credits, idempotencyToken) {
  const state = await getCreditState(env, deviceId);
  if (idempotencyToken && state.redeemedTokens.includes(idempotencyToken)) {
    return { ok: false, error: 'already_redeemed', balance: state.balance };
  }
  state.balance += credits;
  if (idempotencyToken) {
    state.redeemedTokens.push(idempotencyToken);
    state.redeemedTokens = state.redeemedTokens.slice(-100);
  }
  await setCreditState(env, deviceId, state);
  return { ok: true, balance: state.balance };
}

// ---------- HTTP helpers ----------

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Id, Stripe-Signature',
  };
}

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

function requireDeviceId(request) {
  const deviceId = request.headers.get('X-Device-Id');
  if (!deviceId || !DEVICE_ID_RE.test(deviceId)) {
    return { error: json({ error: 'Missing or invalid X-Device-Id header' }, { status: 400 }) };
  }
  return { deviceId };
}

// ---------- Stripe signature verification ----------

// Verifies a Stripe webhook signature against the raw request body.
// Stripe-Signature header format: t=<timestamp>,v1=<signature>[,v1=<signature>...]
async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const idx = p.indexOf('=');
      return [p.slice(0, idx), p.slice(idx + 1)];
    }).filter(([k, v]) => k && v)
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const signed = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const macBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const macHex = Array.from(new Uint8Array(macBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Constant-time compare
  if (macHex.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < macHex.length; i++) diff |= macHex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// ---------- Handlers ----------

async function handleTranslate(request, env) {
  const dev = requireDeviceId(request);
  if (dev.error) return dev.error;

  const body = await request.json().catch(() => ({}));
  const { text, toolType = 'default' } = body;
  if (!text) return json({ error: 'Text is required' }, { status: 400 });

  const spend = await spendCredit(env, dev.deviceId);
  if (!spend.ok) {
    return json({ error: 'no_credits', remaining: 0 }, { status: 402 });
  }

  const svc = new TranslationService();
  svc.openaiApiKey = env.OPENAI_API_KEY;

  try {
    const translation = await svc.translate(text, toolType);
    const cost = svc.costEstimate(text);
    // Auto-log successful translations so we can see which tools drive usage.
    await recordEvent(env, {
      type: 'translate_succeeded',
      deviceId: dev.deviceId,
      props: { toolType, characters: cost.characters, source: spend.source },
      ts: Date.now(),
    });
    return json({
      translation,
      toolType,
      service: cost.service,
      estimatedCost: cost.estimatedCost,
      characters: cost.characters,
      credits: { source: spend.source, remaining: spend.remaining },
    });
  } catch (err) {
    await refundCredit(env, dev.deviceId, spend.source);
    await recordEvent(env, {
      type: 'translate_failed',
      deviceId: dev.deviceId,
      props: { toolType, error: String(err.message || err).slice(0, 120) },
      ts: Date.now(),
    });
    return json({ error: 'Translation failed', details: String(err.message || err) }, { status: 502 });
  }
}

async function handleCostEstimate(request) {
  const { text } = await request.json().catch(() => ({}));
  if (!text) return json({ error: 'Text is required' }, { status: 400 });
  const svc = new TranslationService();
  return json(svc.costEstimate(text));
}

async function handleGetCredits(url, env) {
  const deviceId = url.searchParams.get('deviceId');
  if (!deviceId || !DEVICE_ID_RE.test(deviceId)) {
    return json({ error: 'Missing or invalid deviceId' }, { status: 400 });
  }
  const state = await getCreditState(env, deviceId);
  return json({
    balance: state.balance,
    hasFreeRun: !state.freeUsed,
    runsAvailable: (state.freeUsed ? 0 : 1) + state.balance,
  });
}

async function handleAdminGrant(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const expected = `Bearer ${env.ADMIN_TOKEN || ''}`;
  if (!env.ADMIN_TOKEN || auth !== expected) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }
  const { deviceId, credits, token } = await request.json().catch(() => ({}));
  if (!deviceId || !DEVICE_ID_RE.test(deviceId)) {
    return json({ error: 'Invalid deviceId' }, { status: 400 });
  }
  const n = parseInt(credits, 10);
  if (!Number.isFinite(n) || n <= 0) return json({ error: 'Invalid credits' }, { status: 400 });
  const result = await grantCredits(env, deviceId, n, token);
  return json(result, { status: result.ok ? 200 : 409 });
}

async function handleEvent(request, env) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object') {
    return json({ error: 'invalid_payload' }, { status: 400 });
  }
  const ok = await recordEvent(env, payload);
  return ok ? json({ ok: true }, { status: 202 }) : json({ error: 'invalid_event' }, { status: 400 });
}

async function handleAdminEvents(request, env, url) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500);
  const list = await env.ADM_USERS.list({ prefix: 'event:', limit });
  const events = await Promise.all(
    list.keys.map(async (k) => {
      const raw = await env.ADM_USERS.get(k.name);
      if (!raw) return null;
      try { return { id: k.name, ...JSON.parse(raw) }; }
      catch { return null; }
    })
  );
  return json({ events: events.filter(Boolean), count: list.keys.length });
}

// Pack prices in smallest currency unit (cents / centavos). Must match credits.js.
const STRIPE_PACKS = {
  pack_1: { credits: 1, EUR: 300, BRL: 1500 },
  pack_5: { credits: 5, EUR: 800, BRL: 3900 },
  pack_15: { credits: 15, EUR: 2000, BRL: 9900 },
};

async function handleStripeCheckout(request, env) {
  const { packId, currency, deviceId } = await request.json().catch(() => ({}));
  if (!deviceId || !DEVICE_ID_RE.test(deviceId)) {
    return json({ error: 'invalid_device' }, { status: 400 });
  }
  const pack = STRIPE_PACKS[packId];
  if (!pack) return json({ error: 'invalid_pack' }, { status: 400 });
  const cur = String(currency || 'EUR').toUpperCase();
  if (cur !== 'EUR' && cur !== 'BRL') return json({ error: 'invalid_currency' }, { status: 400 });
  const amount = pack[cur];
  if (!amount) return json({ error: 'invalid_currency' }, { status: 400 });
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'stripe_not_configured' }, { status: 503 });

  const origin = request.headers.get('Origin')
    || (() => {
      try {
        const ref = request.headers.get('Referer');
        return ref ? new URL(ref).origin : null;
      } catch { return null; }
    })()
    || 'https://alemdomar.com';
  const successUrl = `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/?checkout=cancel`;

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('client_reference_id', deviceId);
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('metadata[credits]', String(pack.credits));
  params.set('metadata[pack_id]', packId);
  params.set('line_items[0][price_data][currency]', cur.toLowerCase());
  params.set('line_items[0][price_data][unit_amount]', String(amount));
  params.set(
    'line_items[0][price_data][product_data][name]',
    `${pack.credits} crédito${pack.credits > 1 ? 's' : ''} · Além do Mar`
  );
  params.set('line_items[0][quantity]', '1');

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return json({ error: 'stripe_error', details: data.error?.message || resp.statusText }, { status: 502 });
  }
  if (!data.url) return json({ error: 'stripe_error', details: 'missing_checkout_url' }, { status: 502 });
  return json({ url: data.url });
}

async function handleStripeWebhook(request, env) {
  const rawBody = await request.text();
  const sig = request.headers.get('Stripe-Signature');
  const ok = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return json({ error: 'invalid_signature' }, { status: 400 });

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return json({ error: 'invalid_payload' }, { status: 400 }); }

  if (event.type !== 'checkout.session.completed') {
    return json({ received: true, ignored: event.type });
  }

  const session = event.data?.object || {};
  const deviceId = session.client_reference_id;
  const credits = parseInt(session.metadata?.credits || '0', 10);
  if (!deviceId || !DEVICE_ID_RE.test(deviceId) || !Number.isFinite(credits) || credits <= 0) {
    return json({ error: 'missing_or_invalid_metadata' }, { status: 400 });
  }
  const result = await grantCredits(env, deviceId, credits, session.id);
  if (result.ok) {
    await recordEvent(env, {
      type: 'credits_purchased',
      deviceId,
      props: { credits, sessionId: session.id, packId: session.metadata?.pack_id || null },
      ts: Date.now(),
    });
  }
  return json({ received: true, ...result });
}

// ---------- Router ----------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      if (url.pathname === '/' && request.method === 'GET') {
        return json({
          service: 'Além do Mar Translation API',
          version: '2.0.0',
          endpoints: {
            translate: 'POST /api/translate (requires X-Device-Id header)',
            costEstimate: 'POST /api/translate/cost-estimate',
            credits: 'GET /api/credits?deviceId=…',
            grant: 'POST /api/credits/grant (Bearer ADMIN_TOKEN)',
            stripeCheckout: 'POST /api/stripe/checkout { packId, currency, deviceId }',
            stripeWebhook: 'POST /api/stripe/webhook (Stripe-Signature header)',
          },
          status: 'operational',
        });
      }

      if (url.pathname === '/api/translate' && request.method === 'POST') {
        return await handleTranslate(request, env);
      }
      if (url.pathname === '/api/translate/cost-estimate' && request.method === 'POST') {
        return await handleCostEstimate(request);
      }
      if (url.pathname === '/api/credits' && request.method === 'GET') {
        return await handleGetCredits(url, env);
      }
      if (url.pathname === '/api/credits/grant' && request.method === 'POST') {
        return await handleAdminGrant(request, env);
      }
      if (url.pathname === '/api/event' && request.method === 'POST') {
        return await handleEvent(request, env);
      }
      if (url.pathname === '/api/admin/events' && request.method === 'GET') {
        return await handleAdminEvents(request, env, url);
      }
      if (url.pathname === '/api/stripe/checkout' && request.method === 'POST') {
        return await handleStripeCheckout(request, env);
      }
      if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
        return await handleStripeWebhook(request, env);
      }

      return json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
      return json({ error: 'Internal server error', details: String(err.message || err) }, { status: 500 });
    }
  },
};
