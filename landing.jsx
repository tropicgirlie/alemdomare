// Landing page — copy from content.js (editable via Modo edição)

function buildToolCategories(content) {
  const t = content.landing.tools;
  const defs = [
    ['essentials', ['career', 'ats_check', 'salary_reality']],
    ['diagnosis', ['hiring_reality', 'rejection_decoder']],
    ['preparation', ['interview_sim']],
    ['cultural', ['cultural', 'social_scripts']],
    ['advanced', ['say_it_better', 'identity_reframe']],
  ];
  return Object.fromEntries(defs.map(([key, ids]) => [
    key,
    {
      title: t[key].title,
      subtitle: t[key].subtitle,
      tools: ids.map((id) => ({ id, ...t.items[id] })),
    },
  ]));
}

function Landing({ direction, onStart, onStartCultural, onStartTool, onShowReviewers, onShowSobre }) {
  const { content, get } = useContent();
  const [activeCategory, setActiveCategory] = React.useState('essentials');
  const [preferredCity, setPreferredCity] = React.useState(
    () => (window.AdM_CITIES && window.AdM_CITIES.getPreferred()) || 'dublin'
  );

  const pickCity = (cityId) => {
    setPreferredCity(cityId);
    if (window.AdM_CITIES) window.AdM_CITIES.setPreferred(cityId);
  };

  const cityMeta = window.AdM_CITIES && window.AdM_CITIES.byId[preferredCity];
  const toolCategories = buildToolCategories(content);
  const quirks = content.landing.quirks.items || [];
  const contactEmail = get('meta.contactEmail');

  const Header = window.SiteHeader;

  return (
    <div className="landing-page">
      {Header ? (
        <Header>
          <Brand direction="b" size="lg" />
          <div className="nav-links">
            <a className="adm-nav-link" href="#caixa"><T k="landing.nav.ferramentas" /></a>
            <a className="adm-nav-link" href="#como-funciona"><T k="landing.nav.comoFunciona" /></a>
            <button type="button" className="adm-nav-link nav-text-btn" onClick={() => onShowSobre && onShowSobre()}>
              <T k="landing.nav.sobre" />
            </button>
            <button type="button" className="btn btn-secondary btn-header-cta" onClick={onShowReviewers}>
              <T k="landing.nav.revisores" />
            </button>
          </div>
        </Header>
      ) : null}

      <div className="wrap">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <span className="pill"><span className="pill-dot" aria-hidden="true" /><T k="landing.hero.pill" /></span>
          <h1 id="landing-hero-title" className="hero-title">
            <T k="landing.hero.title1" /><br />
            <T k="landing.hero.title2a" as="span" /> <em><T k="landing.hero.title2em" /></em> <T k="landing.hero.title2b" as="span" />
          </h1>
          <p className="hero-sub"><T k="landing.hero.sub" /></p>
          <div className="landing-hero-actions">
            <button type="button" className="btn btn-primary" onClick={onStart}><T k="landing.hero.ctaPrimary" /></button>
            <button type="button" className="btn btn-ghost" onClick={onShowReviewers}><T k="landing.hero.ctaReviewers" /></button>
            <a href="#como-funciona" className="btn btn-ghost"><T k="landing.hero.ctaComo" /></a>
          </div>
          <div className="hero-trust">
            <span><T k="landing.hero.trust1" /></span>
            <span><T k="landing.hero.trust2" /></span>
            <span><T k="landing.hero.trust3" /></span>
          </div>
          <div className="landing-hero-cities">
            <div className="hero-destino-label"><T k="landing.hero.destinoLabel" /></div>
            {window.CityChips && (
              <CityChips direction="a" value={preferredCity} onChange={pickCity} activeVariant="maritime" />
            )}
          </div>
        </section>

      <section id="como-funciona" className="section-pad">
        <div className="eyebrow"><T k="landing.transform.eyebrow" /></div>
        <h2 className="landing-h2" style={{ marginBottom: 0 }}>
          <T k="landing.transform.title1" /><br /><T k="landing.transform.title2" /><br />
          <em><T k="landing.transform.title3a" /></em>
        </h2>
        <div className="transform-compare">
          <div className="transform-compare-before">
            <div className="transform-compare-label"><T k="landing.transform.beforeLabel" /></div>
            <T k="landing.transform.beforeText" multiline />
          </div>
          <div className="transform-compare-after">
            <div className="transform-compare-label transform-compare-label--after"><T k="landing.transform.afterLabel" /></div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, marginBottom: 14, letterSpacing: '-0.01em' }}>
              <T k="landing.transform.afterTitle" />
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.65 }}>
              <li>Managed 40+ daily customer support cases across digital channels</li>
              <li>Resolved billing, account access and service-disruption issues</li>
              <li>Used CRM systems to track interactions and improve response time</li>
              <li>Collaborated with internal teams on complex case escalations</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="cv-por-cidade" className="section-pad">
        <div className="eyebrow"><T k="landing.city.eyebrow" /></div>
        <h2 className="landing-h2">
          <T k="landing.city.titleA" as="span" /> <em><T k="landing.city.titleEm" /></em>
        </h2>
        <p className="landing-lead" style={{ marginBottom: 28 }}><T k="landing.city.body" /></p>
        {window.CvDiffGrid && <CvDiffGrid direction="a" highlightCity={preferredCity} />}
        <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={onStart}>
            <T k="landing.city.cta" vars={{ city: cityMeta ? cityMeta.label : 'Dublin' }} />
          </button>
          <span className="landing-lead" style={{ margin: 0, fontSize: 14 }}><T k="landing.city.hint" /></span>
        </div>
      </section>

      <section className="section-pad">
        <div className="eyebrow"><T k="landing.quirks.eyebrow" /></div>
        <h2 className="landing-h2" style={{ marginBottom: 32 }}><T k="landing.quirks.title" /></h2>
        <div className="landing-quirk-grid">
          {quirks.map((q, i) => (
            <div key={i} className="landing-quirk-card">
              <div className="landing-quirk-n"><T k={`landing.quirks.items.${i}.n`} /></div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}><T k={`landing.quirks.items.${i}.title`} /></div>
              <div className="adm-tool-card-body"><T k={`landing.quirks.items.${i}.body`} /></div>
            </div>
          ))}
        </div>
      </section>

      <section id="caixa" className="section-pad">
        <div className="eyebrow"><T k="landing.toolkit.eyebrow" /></div>
        <h2 className="landing-h2">
          <T k="landing.toolkit.titleA" as="span" /> <em><T k="landing.toolkit.titleEm" /></em>
        </h2>
        <p className="landing-lead" style={{ marginBottom: 32 }}><T k="landing.toolkit.body" /></p>

        <div className="adm-tablist" role="tablist" aria-label="Categorias de ferramentas">
          {Object.entries(toolCategories).map(([key, category]) => {
            const isActive = activeCategory === key;
            const count = category.tools?.length || 0;
            const tabId = `tool-tab-${key}`;
            return (
              <button
                key={key}
                id={tabId}
                type="button"
                role="tab"
                className="adm-tab"
                aria-selected={isActive}
                aria-controls="tool-tabpanel"
                onClick={() => setActiveCategory(key)}
              >
                <T k={`landing.tools.${key}.title`} />
                <span className="adm-tab-count" aria-label={`${count} ferramentas`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div id="tool-tabpanel" role="tabpanel" aria-labelledby={`tool-tab-${activeCategory}`} style={{ marginBottom: 40 }}>
          <h3 className="landing-h2" style={{ fontSize: 24, marginBottom: 8 }}>
            <T k={`landing.tools.${activeCategory}.title`} />
          </h3>
          <p className="landing-lead" style={{ marginBottom: 24, fontSize: 14 }}>
            <T k={`landing.tools.${activeCategory}.subtitle`} />
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: activeCategory === 'essentials' ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {toolCategories[activeCategory].tools.map((t) => (
              <button
                key={t.id}
                type="button"
                className="adm-tool-card"
                onClick={() => onStartTool && onStartTool(t.id)}
              >
                <div className="adm-tool-card-eyebrow"><T k={`landing.tools.items.${t.id}.eyebrow`} /></div>
                <div className="adm-tool-card-title"><T k={`landing.tools.items.${t.id}.title`} /></div>
                <div className="adm-tool-card-body"><T k={`landing.tools.items.${t.id}.body`} /></div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 0', borderTop: '1px solid var(--a-rule)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--a-text-2)', marginBottom: 12 }}>
            <T k="landing.toolkit.quickAccess" />
          </h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => onStartTool && onStartTool('career')} className="btn btn-ghost"><T k="landing.toolkit.quickCareer" /></button>
            <button type="button" onClick={() => onStartTool && onStartTool('cultural')} className="btn btn-ghost"><T k="landing.toolkit.quickCultural" /></button>
            <button type="button" onClick={() => onStartTool && onStartTool('hiring_reality')} className="btn btn-ghost"><T k="landing.toolkit.quickHiring" /></button>
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ textAlign: 'center' }}>
        <h2 className="landing-h2" style={{ margin: '0 auto 24px', textAlign: 'center' }}>
          <T k="landing.cta.title1" /><br /><em><T k="landing.cta.titleEm" /></em>
        </h2>
        <button type="button" className="btn btn-primary" onClick={onStart}><T k="landing.cta.button" /></button>
      </section>

      <section id="cultural" className="section-pad" style={{ paddingTop: 80, borderTop: '1px solid var(--a-rule)' }}>
        <div className="eyebrow"><T k="landing.cultural.eyebrow" /></div>
        <h2 className="landing-h2">
          <T k="landing.cultural.titleA" as="span" /> <em><T k="landing.cultural.titleEm" /></em><T k="landing.cultural.titleB" as="span" />
        </h2>
        <p className="landing-lead" style={{ fontSize: 17, marginBottom: 28 }}><T k="landing.cultural.body" /></p>
        <button type="button" className="btn btn-primary" onClick={onStartCultural}><T k="landing.cultural.button" /></button>
      </section>

      <section className="section-pad" style={{ paddingTop: 56, paddingBottom: 24 }}>
        <span className="landing-pill-inline"><T k="landing.reviewers.pill" /></span>
        <h2 className="landing-h2">
          <T k="landing.reviewers.titleA" as="span" /> <em><T k="landing.reviewers.titleEm" /></em><T k="landing.reviewers.titleB" as="span" />
        </h2>
        <p className="landing-lead" style={{ fontSize: 17, marginBottom: 28 }}><T k="landing.reviewers.body" /></p>
        <button type="button" className="btn btn-primary" onClick={onShowReviewers}><T k="landing.reviewers.button" /></button>
      </section>

      <footer className="landing-footer">
        <div><T k="meta.footerCopyright" /></div>
        <nav aria-label="Rodapé" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="landing-footer-link" onClick={() => onShowSobre && onShowSobre()}><T k="landing.nav.sobre" /></button>
          <a className="landing-footer-link" href={`mailto:${contactEmail}?subject=Contato%20Al%C3%A9m%20do%20Mar`}><T k="landing.footer.contato" /></a>
          <button type="button" className="landing-footer-link" onClick={() => window.dispatchEvent(new CustomEvent('adm_open_privacy'))}><T k="landing.footer.privacidade" /></button>
        </nav>
      </footer>
      </div>
    </div>
  );
}

window.Landing = Landing;
