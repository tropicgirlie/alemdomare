// Paywall modal + credit balance pill + privacy notice.
// Uses window.AdM_CREDITS for state. React component, mounted globally.

function useCreditState() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    return window.AdM_CREDITS.subscribe(() => setTick((t) => t + 1));
  }, []);
  return {
    balance: window.AdM_CREDITS.getBalance(),
    hasFreeRun: window.AdM_CREDITS.hasFreeRun(),
    runsAvailable: window.AdM_CREDITS.runsAvailable(),
    currency: window.AdM_CREDITS.getCurrency(),
    setCurrency: window.AdM_CREDITS.setCurrency,
  };
}

function CreditsPill({ direction, onClick }) {
  const s = useCreditState();
  const dirA = direction === 'a';
  const free = s.hasFreeRun;
  const total = s.runsAvailable;
  return (
    <button
      type="button"
      className="credits-pill"
      onClick={onClick}
      title="Créditos disponíveis"
      data-theme={dirA ? 'editorial' : 'maritime'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderRadius: 999,
        border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
        background: dirA ? '#fff' : 'rgba(255,255,255,0.04)',
        fontSize: 13, fontWeight: 600,
        color: dirA ? 'var(--a-text)' : 'var(--b-text)',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: total > 0 ? '#16a34a' : '#dc2626',
      }} />
      {free && total === 1 ? '1 grátis' : total === 0 ? 'sem créditos' : `${total} ${total === 1 ? 'crédito' : 'créditos'}`}
    </button>
  );
}

function PaywallModal({ direction, open, onClose, reason }) {
  const s = useCreditState();
  const { get } = useContent();
  const dirA = direction === 'a';
  const [buying, setBuying] = React.useState(null);
  const [buyError, setBuyError] = React.useState('');
  if (!open) return null;
  const packs = window.AdM_CREDITS.PACKS;
  const cur = s.currency;

  const buy = async (pack) => {
    setBuyError('');
    setBuying(pack.id);
    try {
      const result = await window.AdM_CREDITS.startCheckout(pack, cur);
      if (result && result.ok) return;
      if (result && result.error === 'stripe_not_configured') {
        window.location.href = window.AdM_CREDITS.buildCheckoutUrl(pack, cur);
        return;
      }
      setBuyError(get('paywall.buyError') || 'Não foi possível abrir o pagamento. Tente de novo em instantes.');
    } catch (e) {
      setBuyError(get('paywall.buyError') || 'Não foi possível abrir o pagamento. Tente de novo em instantes.');
    } finally {
      setBuying(null);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,12,18,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 100%)', maxHeight: '90vh', overflow: 'auto',
          background: dirA ? '#fbf7f1' : '#0d1117',
          color: dirA ? 'var(--a-text)' : 'var(--b-text)',
          border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
          borderRadius: 16,
          padding: '32px 32px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>
              <T k={reason === 'out' ? 'paywall.reasonOut' : 'paywall.reasonAdd'} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em', margin: 0 }}>
              <T k="paywall.title" />
            </h2>
            <p style={{ fontSize: 15, opacity: 0.75, marginTop: 8, maxWidth: 540 }}>
              <T k="paywall.sub" />
            </p>
          </div>
          <button onClick={onClose} style={{ fontSize: 22, lineHeight: 1, opacity: 0.5, padding: 4 }}>×</button>
        </div>

        {/* Currency toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['EUR', 'BRL'].map((c) => (
            <button
              key={c}
              onClick={() => window.AdM_CREDITS.setCurrency(c)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
                background: cur === c
                  ? (dirA ? 'var(--a-text)' : 'var(--b-gold)')
                  : 'transparent',
                color: cur === c
                  ? (dirA ? '#fff' : '#0d1117')
                  : (dirA ? 'var(--a-text)' : 'var(--b-text)'),
              }}
            >
              {c === 'EUR' ? '€ Euro' : 'R$ Real'}
            </button>
          ))}
        </div>

        {/* Packs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'stretch' }}>
          {packs.map((p) => {
            const price = p[cur];
            return (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  padding: 18,
                  border: `${p.popular ? 2 : 1}px solid ${p.popular
                    ? (dirA ? 'var(--a-teal)' : 'var(--b-gold)')
                    : (dirA ? 'var(--a-rule)' : 'var(--b-rule)')}`,
                  borderRadius: 12,
                  background: dirA ? '#fff' : 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 220,
                }}
              >
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: -10, right: 12,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '4px 8px', borderRadius: 999,
                    background: dirA ? 'var(--a-teal)' : 'var(--b-gold)',
                    color: dirA ? '#fff' : '#0d1117',
                  }}>
                    Popular
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>{p.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>
                    {price.display}
                  </div>
                  <div style={{ fontSize: 12, opacity: price.perCredit ? 0.6 : 0, minHeight: 18 }}>
                    {price.perCredit || '\u00A0'}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.4 }}>{p.sub}</div>
                </div>
                <button
                  onClick={() => buy(p)}
                  className="btn btn-primary"
                  disabled={!!buying}
                  style={{
                    marginTop: 16,
                    width: '100%',
                    justifyContent: 'center',
                    opacity: buying && buying !== p.id ? 0.6 : 1,
                  }}
                >
                  {buying === p.id ? 'Abrindo…' : 'Comprar'}
                </button>
              </div>
            );
          })}
        </div>

        {buyError && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 8,
            border: '1px solid #dc2626', color: '#dc2626',
            fontSize: 13, lineHeight: 1.5,
          }}>
            {buyError}
          </div>
        )}

        <div style={{
          marginTop: 20, padding: 12, borderRadius: 8,
          background: dirA ? 'rgba(42,157,143,0.06)' : 'rgba(244,185,66,0.06)',
          fontSize: 12, opacity: 0.85, lineHeight: 1.5,
        }}>
          <T k="paywall.footer" />
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, opacity: 0.7, flexWrap: 'wrap' }}>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('adm_open_privacy')); }} style={{ textDecoration: 'underline' }}>Privacidade</a>
          <a href="#" onClick={(e) => { e.preventDefault(); if (confirm(get('privacy.deleteConfirm'))) { window.AdM_CREDITS.deleteAllData(); onClose(); } }} style={{ textDecoration: 'underline' }}>Apagar meus dados</a>
        </div>
      </div>
    </div>
  );
}

function PrivacyModal({ direction, open, onClose }) {
  const dirA = direction === 'a';
  const { get } = useContent();
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'rgba(8,12,18,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 100%)', maxHeight: '85vh', overflow: 'auto',
          background: dirA ? '#fbf7f1' : '#0d1117',
          color: dirA ? 'var(--a-text)' : 'var(--b-text)',
          border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
          borderRadius: 16, padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}><T k="privacy.title" /></h2>
          <button onClick={onClose} style={{ fontSize: 22, opacity: 0.5 }}>×</button>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p><b>O que guardamos.</b> <T k="privacy.p1" as="span" /></p>
          <p><b>O que não guardamos.</b> <T k="privacy.p2" as="span" /></p>
          <p><b>O que enviamos pra IA.</b> <T k="privacy.p3" as="span" /></p>
          <p><b>Pagamentos.</b> <T k="privacy.p4" as="span" /></p>
          <p><b>Cookies.</b> <T k="privacy.p5" as="span" /></p>
          <p><b>Seus direitos (LGPD/GDPR).</b> <T k="privacy.p6" as="span" /></p>
          <p><b>Contato.</b> <a href={`mailto:${get('meta.contactEmail')}`}><T k="meta.contactEmail" /></a></p>
        </div>
        <button
          onClick={() => { if (confirm(get('privacy.deleteConfirm'))) { window.AdM_CREDITS.deleteAllData(); onClose(); } }}
          style={{
            marginTop: 16, padding: '10px 16px', borderRadius: 8,
            border: `1px solid ${dirA ? '#dc2626' : '#dc2626'}`,
            color: '#dc2626', fontSize: 13, fontWeight: 600,
          }}
        >
          <T k="privacy.deleteButton" />
        </button>
      </div>
    </div>
  );
}

window.AdM_useCreditState = useCreditState;
window.CreditsPill = CreditsPill;
window.PaywallModal = PaywallModal;
window.PrivacyModal = PrivacyModal;
