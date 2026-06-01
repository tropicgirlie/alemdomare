// Além do Mar — lightweight first-party analytics.
// Captures UTM source on first visit, attaches device id + utm to every event,
// fire-and-forgets to /api/event on the Cloudflare Worker.
// No third-party trackers, no cookies, GDPR-friendly.

(function () {
  const LS_UTM = 'adm_utm';
  const LS_FIRST_VISIT = 'adm_first_visit';
  const API_BASE = (window.ADM_API_BASE || 'https://alemdomar-auth.luanagbc.workers.dev').replace(/\/+$/, '');

  // Capture utm_source/medium/campaign/term/content on first visit.
  // Persist for the lifetime of the device so we can attribute later purchases.
  function captureUtm() {
    try {
      const url = new URL(window.location.href);
      const utm = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'].forEach((k) => {
        const v = url.searchParams.get(k);
        if (v) utm[k] = v;
      });
      // Also stamp the referrer if no explicit utm_source
      if (!utm.utm_source && document.referrer) {
        try { utm.referrer_host = new URL(document.referrer).hostname; } catch (_) {}
      }
      if (Object.keys(utm).length === 0) return;
      // Don't overwrite the first-touch attribution.
      if (localStorage.getItem(LS_UTM)) return;
      localStorage.setItem(LS_UTM, JSON.stringify(utm));
    } catch (e) { /* noop */ }
  }

  function getUtm() {
    try { return JSON.parse(localStorage.getItem(LS_UTM) || '{}'); }
    catch (e) { return {}; }
  }

  function getDeviceId() {
    return (window.AdM_CREDITS && window.AdM_CREDITS.getDeviceId)
      ? window.AdM_CREDITS.getDeviceId()
      : null;
  }

  function markFirstVisit() {
    if (!localStorage.getItem(LS_FIRST_VISIT)) {
      localStorage.setItem(LS_FIRST_VISIT, String(Date.now()));
      track('first_visit', { path: window.location.pathname });
    }
  }

  // Fire-and-forget event. Never throws, never blocks the UI.
  function track(type, props) {
    if (!type) return;
    const body = JSON.stringify({
      type,
      deviceId: getDeviceId(),
      utm: getUtm(),
      props: props || {},
      path: window.location.pathname,
      ts: Date.now(),
    });
    try {
      // sendBeacon is best — works even on page unload, doesn't block navigation.
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(API_BASE + '/api/event', blob);
        return;
      }
      fetch(API_BASE + '/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* noop */ }
  }

  // Auto-fire page_view on load (and re-fire if SPA navigation updates the title)
  function pageView() {
    track('page_view', { title: document.title });
  }

  window.AdM_TRACK = { track, captureUtm, getUtm, pageView };

  // Boot
  captureUtm();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { markFirstVisit(); pageView(); });
  } else {
    markFirstVisit();
    pageView();
  }
})();
