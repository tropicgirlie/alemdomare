#!/usr/bin/env bash
# Wire Além do Mar to Stripe LIVE mode on Luana.Systems (acct_18XcvRGHOqSwFRzF).
# Usage: export STRIPE_API_KEY=sk_live_... && ./scripts/stripe-setup-live.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${STRIPE_API_KEY:-}" ]] || [[ "$STRIPE_API_KEY" != sk_live_* ]]; then
  echo "Set STRIPE_API_KEY to your live secret key (sk_live_...) from Dashboard → Developers → API keys"
  exit 1
fi

WORKER_NAME="alemdomar-auth"
WEBHOOK_URL="https://alemdomar-auth.luanagbc.workers.dev/api/stripe/webhook"

stripe() { command stripe --api-key "$STRIPE_API_KEY" "$@"; }

echo "==> Live account"
stripe get /v1/account | python3 -c "
import sys, json
a = json.load(sys.stdin)
print('  id:', a.get('id'))
print('  name:', a.get('display_name') or a.get('settings', {}).get('dashboard', {}).get('display_name'))
print('  charges_enabled:', a.get('charges_enabled'))
"

echo "==> Live webhook for alemdomar-auth"
WEBHOOK_SECRET=$(stripe webhook_endpoints list --limit 20 | python3 -c "
import sys, json
url = '${WEBHOOK_URL}'
for w in json.load(sys.stdin).get('data', []):
    if w.get('url') == url and w.get('livemode'):
        print(w.get('secret', ''))
        break
")

if [[ -z "$WEBHOOK_SECRET" ]]; then
  WH=$(stripe webhook_endpoints create \
    --url "$WEBHOOK_URL" \
    -d "enabled_events[]=checkout.session.completed")
  WEBHOOK_SECRET=$(echo "$WH" | python3 -c "import sys,json; print(json.load(sys.stdin)['secret'])")
  echo "  created webhook"
else
  echo "  reusing existing webhook"
fi

echo "==> Push LIVE secrets to Worker ($WORKER_NAME)"
printf '%s' "$STRIPE_API_KEY" | wrangler secret put STRIPE_SECRET_KEY --name "$WORKER_NAME"
printf '%s' "$WEBHOOK_SECRET" | wrangler secret put STRIPE_WEBHOOK_SECRET --name "$WORKER_NAME"

echo "==> Smoke test checkout session"
RESP=$(curl -s -X POST "https://${WORKER_NAME}.luanagbc.workers.dev/api/stripe/checkout" \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://alemdomar.com' \
  -d '{"packId":"pack_1","currency":"EUR","deviceId":"dev_live_smoke123"}')
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('url'):
    print('  checkout ok:', d['url'][:60] + '...')
else:
    print('  checkout failed:', d)
    raise SystemExit(1)
"

echo ""
echo "Live mode wired for alemdomar-auth on Luana.Systems."
