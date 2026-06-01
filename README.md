# Além do Mar

Translation + career-rewriting tool for Brazilian professionals targeting international careers.

## Architecture

```
Browser (Vercel static)  ───►  Cloudflare Worker  ───►  OpenAI ChatGPT
   React SPA (no build)        worker.js + KV          (translation)
   Babel in-browser            credit ledger
   localStorage cache          Stripe webhook
```

- **Frontend** is plain React loaded via `<script type="text/babel">` from `index.html`. No bundler, no build step. Static files are served by Vercel.
- **API** is a single Cloudflare Worker (`worker.js`) at `https://alemdomar-auth.luanagbc.workers.dev`. It enforces credits via KV before calling OpenAI, and accepts Stripe webhooks to grant credits.
- **Credits** are stored authoritatively in Cloudflare KV (`ADM_USERS`, keyed by `credit:<deviceId>`). The browser keeps a localStorage cache for snappy UI but the worker is the source of truth — `credits.js` syncs from the worker on load and after each spend.
- **Auth** is browser-local (`simple-auth.jsx`) with PBKDF2 password hashing. There's no server-side user model yet.

## Layout

| File / dir | What it is |
|---|---|
| `index.html` | Entry point. Loads React + Babel + every `.jsx` and `.js` below as `<script>`. |
| `worker.js` | Cloudflare Worker: translate API + credit ledger + Stripe webhook. |
| `wrangler.toml` | Cloudflare Worker deploy config. Secrets go via `wrangler secret put`, NOT here. |
| `vercel.json` | Vercel rewrites: API → `/api/*`, everything else → `index.html`. |
| `simple-auth.jsx` | The live auth modal. PBKDF2-hashed passwords in localStorage. |
| `credits.js` | localStorage cache + worker sync. `window.AdM_CREDITS`. |
| `tools.js`, `prompt.js`, `segments.js` | Tool configs + prompt templates. |
| `tool-runner.jsx` | Generic tool form + worker fetch. Adds `X-Device-Id` header. |
| `landing.jsx`, `form.jsx`, `result.jsx`, `paywall.jsx`, `translator.jsx`, `cultural.jsx`, `history.jsx`, `download-history.jsx`, `tweaks-panel.jsx`, `tool-picker.jsx`, `tool-results.jsx`, `tools-nav.jsx`, `atoms.jsx`, `design-canvas.jsx` | UI views and components. |
| `styles.css` | Global styles. |
| `assets/`, `uploads/` | Logo assets. Both PNGs are identical — pick one and remove the duplicate. |
| `api/` | **Dead.** Old Vercel serverless stubs left over from migration. The frontend hits the Cloudflare Worker directly. Safe to delete with `git rm -r api/ translation-service.js`. |

## Worker setup

The worker needs four secrets and two KV namespaces.

### Secrets (one-time)

```sh
wrangler secret put OPENAI_API_KEY         # OpenAI key (sk-…)
wrangler secret put ADMIN_TOKEN            # any long random string — for admin/grant endpoint
wrangler secret put STRIPE_SECRET_KEY      # sk_live_… or sk_test_… from Stripe dashboard
wrangler secret put STRIPE_WEBHOOK_SECRET  # whsec_…  from Stripe dashboard → Webhooks
```

### KV namespaces

Already defined in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "ADM_USERS"
id = "bbff88255b514739ac9485b2109866a2"

[[kv_namespaces]]
binding = "ADM_HISTORY"
id = "5aedcf2dda8842799ca9b4bc110a1ccf"
```

### Endpoints

| Endpoint | Notes |
|---|---|
| `GET /` | Health/info. |
| `POST /api/translate` | Spend 1 credit, call OpenAI, refund on failure. Requires `X-Device-Id` header. Body: `{ text, toolType }`. |
| `POST /api/translate/cost-estimate` | Public, no spend. |
| `GET /api/credits?deviceId=…` | Returns `{ balance, hasFreeRun, runsAvailable }`. |
| `POST /api/credits/grant` | Admin only (`Authorization: Bearer <ADMIN_TOKEN>`). Body: `{ deviceId, credits, token }`. |
| `POST /api/stripe/checkout` | Body: `{ packId, currency, deviceId }`. Creates a Stripe Checkout Session and returns `{ url }`. |
| `POST /api/stripe/webhook` | Stripe-signed. On `checkout.session.completed`, grants `metadata.credits` to `client_reference_id` (the device ID). |

### Deploy

```sh
wrangler deploy
```

## Stripe setup

1. In [Stripe Dashboard](https://dashboard.stripe.com), copy your **Secret key** (`sk_live_…` or `sk_test_…`).
2. Set it on the worker: `wrangler secret put STRIPE_SECRET_KEY`
3. Create a webhook in Stripe → **Developers → Webhooks** pointing at  
   `https://alemdomar-auth.luanagbc.workers.dev/api/stripe/webhook`  
   Listen for `checkout.session.completed`. Copy the signing secret:  
   `wrangler secret put STRIPE_WEBHOOK_SECRET`
4. Redeploy the worker: `wrangler deploy`

The frontend calls `/api/stripe/checkout` when a user clicks **Comprar**. Stripe redirects back to `/?checkout=success` and the webhook grants credits to the device ID in KV. The page syncs the balance on return.

Without `STRIPE_SECRET_KEY`, checkout falls back to the dev mock (`?credits=N&token=…`) so you can test the paywall locally.

## Frontend deploy (Vercel)

The site is plain static files. `vercel deploy` from the repo root.

`vercel.json` rewrites everything except `/api/*` to `index.html`. Since `/api/*` should go to the Cloudflare Worker (not Vercel), consider deleting the `/api/` rewrite from `vercel.json` once you've removed the dead `api/` folder.

## Known issues / things to fix

1. **An old OpenAI key is still in git history** (was at `wrangler.toml:17`). Rotate it on https://platform.openai.com/api-keys.
2. `api/` and `translation-service.js` are dead and should be deleted.
3. Owner bypass (`owner@alemdomar.com` button in `simple-auth.jsx`) is hardcoded — fine for testing, remove before any public release.
4. `assets/logo.png` and `uploads/logoalemdomar.png` are byte-identical — drop one.
5. `design-canvas.jsx` is 31 KB and untested. Touch carefully.
