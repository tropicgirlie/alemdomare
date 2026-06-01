// Além do Mar — credits & paywall engine.
// Source of truth is the Cloudflare Worker (KV-backed, see worker.js). The
// localStorage layer is just a snappy UI cache that we sync to/from the worker.
// Anyone editing localStorage gets reverted on the next syncFromServer() call.
// Stripe redirect handler syncs balance on ?checkout=success (webhook grants credits).
// Mock mode (?credits=N&token=...) still works when STRIPE_SECRET_KEY isn't set.

(function () {
  const API_BASE = (window.ADM_API_BASE || 'https://alemdomar-auth.luanagbc.workers.dev').replace(/\/+$/, '');
  const LS_DEVICE = 'adm_device_id';
  const LS_BALANCE = 'adm_credits';
  const LS_USED_FREE = 'adm_used_free';
  const LS_LEDGER = 'adm_ledger';
  const LS_REDEEMED_TOKENS = 'adm_redeemed_tokens';
  const LS_CURRENCY = 'adm_currency';

  // --- device id ---
  function getDeviceId() {
    let id = localStorage.getItem(LS_DEVICE);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(LS_DEVICE, id);
    }
    return id;
  }

  // --- balance / free run ---
  function getBalance() {
    const v = parseInt(localStorage.getItem(LS_BALANCE) || '0', 10);
    return isNaN(v) ? 0 : v;
  }
  function setBalance(n) {
    localStorage.setItem(LS_BALANCE, String(Math.max(0, n)));
    notify();
  }
  function hasFreeRun() {
    return localStorage.getItem(LS_USED_FREE) !== '1';
  }
  function consumeFreeRun() {
    localStorage.setItem(LS_USED_FREE, '1');
    appendLedger({ type: 'free_run', at: Date.now() });
    notify();
  }

  // total runs available = (1 if free not used) + balance
  function runsAvailable() {
    return (hasFreeRun() ? 1 : 0) + getBalance();
  }

  // try to spend one run. returns 'free' | 'paid' | null (no runs available).
  function spendRun(toolId) {
    if (hasFreeRun()) {
      consumeFreeRun();
      appendLedger({ type: 'spend', source: 'free', tool: toolId, at: Date.now() });
      return 'free';
    }
    const b = getBalance();
    if (b > 0) {
      setBalance(b - 1);
      appendLedger({ type: 'spend', source: 'paid', tool: toolId, at: Date.now() });
      return 'paid';
    }
    return null;
  }

  function addCredits(n, source) {
    setBalance(getBalance() + n);
    appendLedger({ type: 'credit', amount: n, source: source || 'purchase', at: Date.now() });
  }

  // --- ledger ---
  function appendLedger(entry) {
    try {
      const arr = JSON.parse(localStorage.getItem(LS_LEDGER) || '[]');
      arr.unshift(entry);
      localStorage.setItem(LS_LEDGER, JSON.stringify(arr.slice(0, 200)));
    } catch (e) { /* noop */ }
  }
  function getLedger() {
    try { return JSON.parse(localStorage.getItem(LS_LEDGER) || '[]'); }
    catch (e) { return []; }
  }

  // --- currency preference ---
  function getCurrency() {
    return localStorage.getItem(LS_CURRENCY) || guessCurrency();
  }
  function setCurrency(c) {
    localStorage.setItem(LS_CURRENCY, c);
    notify();
  }
  function guessCurrency() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Sao_Paulo') || tz.includes('Recife') || tz.includes('Manaus') || tz.includes('Fortaleza') || tz.includes('Brazil')) return 'BRL';
    } catch (e) { /* noop */ }
    return 'EUR';
  }

  // --- credit packs ---
  const PACKS = [
    {
      id: 'pack_1',
      credits: 1,
      label: 'Crédito único',
      sub: 'Pra testar mais uma vez.',
      EUR: { price: 3, display: '€3' },
      BRL: { price: 15, display: 'R$ 15' },
    },
    {
      id: 'pack_5',
      credits: 5,
      label: '5 créditos',
      sub: 'Salva 47%.',
      EUR: { price: 8, display: '€8', perCredit: '€1.60/crédito' },
      BRL: { price: 39, display: 'R$ 39', perCredit: 'R$ 7,80/crédito' },
    },
    {
      id: 'pack_15',
      credits: 15,
      label: '15 créditos',
      sub: 'Salva 56%. Mais popular.',
      popular: true,
      EUR: { price: 20, display: '€20', perCredit: '€1.33/crédito' },
      BRL: { price: 99, display: 'R$ 99', perCredit: 'R$ 6,60/crédito' },
    },
  ];

  // Create a Stripe Checkout Session via the worker, then redirect.
  async function startCheckout(pack, currency) {
    const dev = getDeviceId();
    if (window.AdM_TRACK) window.AdM_TRACK.track('pack_clicked', { packId: pack.id, currency });

    try {
      const r = await fetch(API_BASE + '/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id, currency, deviceId: dev }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.url) {
        window.location.href = data.url;
        return { ok: true };
      }
      if (data.error === 'stripe_not_configured') {
        return { ok: false, error: 'stripe_not_configured' };
      }
      return { ok: false, error: data.error || 'checkout_failed', details: data.details };
    } catch (e) {
      return { ok: false, error: 'network_error' };
    }
  }

  // Legacy mock URL builder — used only when Stripe secrets aren't set yet.
  function buildCheckoutUrl(pack, currency) {
    const dev = getDeviceId();
    const successBase = window.location.origin + window.location.pathname;
    // DEV-MODE MOCK: drop straight back with credits granted. Used when Stripe isn't configured.
    const mock = new URL(successBase);
    mock.searchParams.set('credits', String(pack.credits));
    mock.searchParams.set('token', 'mock_' + Math.random().toString(36).slice(2));
    mock.searchParams.set('mock', '1');
    return mock.toString();
  }

  // --- redirect handler ---
  // After Stripe checkout, credits are granted server-side via webhook — sync the balance.
  // Mock mode (?credits=N&token=...) still works for local dev without Stripe secrets.
  async function handleStripeReturn() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('checkout') === 'success') {
      const before = getBalance();
      for (let i = 0; i < 12; i++) {
        const data = await syncFromServer();
        if (data && data.balance > before) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (window.AdM_TRACK) {
        window.AdM_TRACK.track('credits_purchased', { balance: getBalance() });
      }
      params.delete('checkout');
      params.delete('session_id');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      return getBalance() > before ? getBalance() - before : 'synced';
    }

    if (params.get('checkout') === 'cancel') {
      params.delete('checkout');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      return null;
    }

    const creditsParam = params.get('credits');
    const token = params.get('token');
    if (!creditsParam || !token) return null;
    const n = parseInt(creditsParam, 10);
    if (isNaN(n) || n <= 0) return null;
    let redeemed = [];
    try { redeemed = JSON.parse(localStorage.getItem(LS_REDEEMED_TOKENS) || '[]'); }
    catch (e) { redeemed = []; }
    if (redeemed.includes(token)) return null; // already credited
    addCredits(n, params.get('mock') === '1' ? 'mock' : 'stripe');
    redeemed.push(token);
    localStorage.setItem(LS_REDEEMED_TOKENS, JSON.stringify(redeemed.slice(-100)));
    // clean the URL
    params.delete('credits');
    params.delete('token');
    params.delete('mock');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
    return n;
  }

  // --- server sync ---
  // The worker is the source of truth. These helpers keep the local cache in sync
  // so the UI shows the right numbers even when localStorage was tampered with.
  async function syncFromServer() {
    try {
      const url = API_BASE + '/api/credits?deviceId=' + encodeURIComponent(getDeviceId());
      const r = await fetch(url, { method: 'GET' });
      if (!r.ok) return null;
      const data = await r.json();
      if (typeof data.balance === 'number') {
        localStorage.setItem(LS_BALANCE, String(Math.max(0, data.balance)));
      }
      if (typeof data.hasFreeRun === 'boolean') {
        if (data.hasFreeRun) localStorage.removeItem(LS_USED_FREE);
        else localStorage.setItem(LS_USED_FREE, '1');
      }
      notify();
      return data;
    } catch (e) { return null; }
  }
  // Apply the {source, remaining} block the worker returns after a successful spend.
  function applyServerCredits(creditsBlock) {
    if (!creditsBlock) return;
    if (typeof creditsBlock.remaining === 'number') {
      localStorage.setItem(LS_BALANCE, String(Math.max(0, creditsBlock.remaining)));
    }
    if (creditsBlock.source === 'free' || creditsBlock.source === 'paid') {
      localStorage.setItem(LS_USED_FREE, '1');
    }
    notify();
  }

  // --- subscribers (let UI pieces re-render on balance change) ---
  const listeners = new Set();
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function notify() { listeners.forEach((fn) => { try { fn(); } catch (e) {} }); }

  // --- delete-my-data (GDPR) ---
  function deleteAllData() {
    const keys = ['adm_device_id', 'adm_credits', 'adm_used_free', 'adm_ledger',
      'adm_redeemed_tokens', 'adm_currency', 'adm-history', 'adm_history', 'adm_saved',
      'adm_users', 'adm_current_user', 'adm_auth_token', 'adm_content_overrides', 'adm_content_edit_mode'];
    keys.forEach((k) => localStorage.removeItem(k));
    notify();
  }

  window.AdM_CREDITS = {
    PACKS,
    getDeviceId,
    getBalance, setBalance,
    hasFreeRun, runsAvailable,
    spendRun, addCredits,
    getLedger,
    getCurrency, setCurrency,
    buildCheckoutUrl,
    startCheckout,
    handleStripeReturn,
    syncFromServer,
    applyServerCredits,
    subscribe,
    deleteAllData,
  };

  // Sync once on load so the UI shows the server-side balance from the start.
  // If the worker is unreachable, the local cache is used as fallback.
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { syncFromServer(); });
    } else {
      syncFromServer();
    }
  }
})();
