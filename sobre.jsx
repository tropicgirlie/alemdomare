// Sobre — copy from content.js (editable via Modo edição)

function Sobre({ direction, onBack }) {
  const dirA = direction === 'a';
  const { content, get } = useContent();
  const accent = dirA ? 'var(--a-teal)' : 'var(--b-gold)';
  const muted = dirA ? 'var(--a-text-2)' : 'var(--b-text-2)';
  const rule = dirA ? 'var(--a-rule)' : 'var(--b-rule)';
  const surface = dirA ? '#fff' : 'rgba(255,255,255,0.04)';
  const contactEmail = get('meta.contactEmail');
  const founderName = get('meta.founderName');
  const dosItems = content.sobre.dosItems || [];

  const blockStyle = {
    padding: '24px 26px',
    border: `1px solid ${rule}`,
    borderRadius: 12,
    background: surface,
    marginBottom: 20,
  };

  const Header = window.SiteHeader;

  return (
    <>
      {Header && (
        <Header label="Sobre">
          <Brand direction="b" size="lg" />
          <button type="button" className="adm-nav-link" onClick={onBack} style={{ marginLeft: 'auto' }}>
            <T k="sobre.back" />
          </button>
        </Header>
      )}
    <div className="wrap" style={{ paddingBottom: 80 }}>

      <header style={{ paddingTop: 24, paddingBottom: 32, maxWidth: 720 }}>
        <span className="pill"><span className="pill-dot" /><T k="sobre.pill" /></span>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.02em', fontWeight: 400, margin: '20px 0 16px', lineHeight: 1.08 }}>
          <T k="sobre.titleA" as="span" /> <em style={{ color: accent }}><T k="sobre.titleEm" /></em>
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: muted, margin: 0 }}>
          <T k="sobre.intro" />
        </p>
      </header>

      <div style={{ maxWidth: 720 }}>
        <section style={blockStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted, margin: '0 0 12px' }}>
            <T k="sobre.whyTitle" />
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 0 12px' }}><T k="sobre.whyP1" /></p>
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: 0 }}><T k="sobre.whyP2" /></p>
        </section>

        <section style={blockStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted, margin: '0 0 12px' }}>
            <T k="sobre.dosTitle" />
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.65, color: dirA ? 'var(--a-text)' : 'var(--b-text)' }}>
            {dosItems.map((_, i) => (
              <li key={i} style={{ marginBottom: i < dosItems.length - 1 ? 8 : 0 }}>
                <T k={`sobre.dosItems.${i}`} />
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...blockStyle, borderColor: dirA ? 'rgba(42,157,143,0.35)' : 'rgba(244,185,66,0.35)', background: dirA ? 'rgba(42,157,143,0.06)' : 'rgba(244,185,66,0.06)' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, margin: '0 0 12px' }}>
            <T k="sobre.founderTitle" />
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 0 12px' }}>
            <T k="sobre.founderP1" vars={{ name: founderName }} />
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 0 12px' }}><T k="sobre.founderP2" /></p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: muted, margin: 0 }}><T k="sobre.founderP3" /></p>
        </section>

        <section style={blockStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted, margin: '0 0 12px' }}>
            <T k="sobre.contactTitle" />
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 0 16px', color: muted }}>
            <T k="sobre.contactBody" />
          </p>
          <a href={`mailto:${contactEmail}?subject=${encodeURIComponent('Contato Além do Mar')}`} className="btn btn-primary" style={{ display: 'inline-flex' }}>
            {contactEmail}
          </a>
        </section>
      </div>
    </div>
    </>
  );
}

window.Sobre = Sobre;
