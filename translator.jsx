// Tradutor view — wraps form, calls AI, shows result

function TranslatorView({ direction, onBack, initialResult, initialForm, initialTone, initialMode }) {
  const [mode, setMode] = React.useState(initialMode || 'career'); // 'career' | 'cultural' | tool id
  const [view, setView] = React.useState(initialResult ? 'result' : 'form');
  const [form, setForm] = React.useState(initialForm || null);
  const [result, setResult] = React.useState(initialResult || null);
  const [tone, setTone] = React.useState(initialTone || 'confident');
  const [loading, setLoading] = React.useState(false);
  const [regen, setRegen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showToast, toastNode] = useToast();

  const dirA = direction === 'a';

  // Is current mode a generic AdM_TOOLS tool?
  const tool = window.AdM_TOOLS && window.AdM_TOOLS[mode];

  const translate = async (formData, opts = {}) => {
    setError('');
    if (window.AdM_TRACK) window.AdM_TRACK.track('tool_started', { tool: mode, regen: !!opts.regen });
    if (!opts.regen) {
      const spent = window.AdM_CREDITS.spendRun(mode);
      if (!spent) {
        if (window.AdM_TRACK) window.AdM_TRACK.track('no_credits', { tool: mode });
        if (window.AdM_openPaywall) window.AdM_openPaywall('out');
        return;
      }
    }
    if (opts.regen) setRegen(true); else setLoading(true);
    try {
      let r;
      if (mode === 'career') {
        r = await window.AdM_PROMPT.translate(formData, tone);
      } else if (mode === 'cultural') {
        r = await window.AdM_CULTURAL.translate(formData);
      } else if (tool) {
        r = await window.runTool(tool, formData);
      } else {
        throw new Error('Unknown mode: ' + mode);
      }
      setResult(r);
      setForm(formData);
      setView('result');
    } catch (e) {
      console.error(e);
      if (e && e.code === 'no_credits') {
        if (window.AdM_openPaywall) window.AdM_openPaywall('out');
      } else {
        setError('Algo falhou. Tente de novo em alguns segundos.');
      }
    } finally {
      setLoading(false); setRegen(false);
    }
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    setView('form');
    setResult(null);
    setForm(null);
  };

  const Header = window.SiteHeader;

  return (
    <>
      {Header && (
        <Header label="Ferramentas">
          <Brand direction="b" size="lg" />
          <div className="nav-links" style={{ marginLeft: 'auto' }}>
            {window.CreditsPill && <CreditsPill direction="a" onClick={() => window.AdM_openPaywall && window.AdM_openPaywall('add')} />}
            <button type="button" className="adm-nav-link" onClick={onBack}>← Voltar ao início</button>
          </div>
        </Header>
      )}
    <div className="wrap" style={{ paddingBottom: 80 }}>

      {/* Tool picker */}
      <ToolPicker direction={direction} mode={mode} onChange={switchMode} />

      {view === 'form' && mode === 'career' && (
        <div style={{ paddingTop: 28, maxWidth: 760, margin: '0 auto' }}>
          <span className="pill"><span className="pill-dot" />Tradutor de Carreira</span>
          <h1 style={{
            fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 400, letterSpacing: '-0.025em', margin: '20px 0 12px', lineHeight: 1.02,
          }}>
            Conta como foi seu trabalho.<br />
            <em style={{ color: dirA ? 'var(--a-teal)' : 'var(--b-gold)' }}>Em português, do jeito que você fala.</em>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: '0 0 36px', maxWidth: 600 }}>
            Sua experiência reescrita em tópicos de currículo, headline de LinkedIn, vocabulário traduzido e pontos de fala pra entrevista. Sem métrica inventada.
          </p>

          <div className="card" style={{ marginBottom: 20 }}>
            <span className="field-label">Tom da escrita</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {[
                ['confident', 'Confiante & ambicioso'],
                ['balanced', 'Equilibrado & profissional'],
                ['humble', 'Direto & humilde'],
              ].map(([k, label]) => (
                <button
                  key={k} type="button"
                  onClick={() => setTone(k)}
                  style={{
                    padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                    border: `1px solid ${tone === k ? (dirA ? 'var(--b-bg)' : 'var(--b-gold)') : (dirA ? 'var(--a-rule)' : 'var(--b-rule)')}`,
                    background: tone === k ? (dirA ? 'var(--b-bg)' : 'var(--b-gold)') : 'transparent',
                    color: tone === k ? (dirA ? 'var(--b-text)' : '#fff') : 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <TranslatorForm
              direction={direction}
              isLoading={loading}
              onSubmit={(f) => translate(f)}
            />
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: 14, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>
      )}

      {view === 'form' && mode === 'cultural' && (
        <div style={{ paddingTop: 28, maxWidth: 760, margin: '0 auto' }}>
          <span className="pill"><span className="pill-dot" />Tradutor Cultural</span>
          <h1 style={{
            fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 400, letterSpacing: '-0.025em', margin: '20px 0 12px', lineHeight: 1.02,
          }}>
            Comportamento, não língua.<br />
            <em style={{ color: dirA ? 'var(--a-teal)' : 'var(--b-gold)' }}>O que ninguém te conta.</em>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: '0 0 36px', maxWidth: 600 }}>
            Diferenças culturais reais no trabalho, scripts pra reuniões, erros comuns no primeiro ano, e o que vai parecer estranho mas é normal.
          </p>

          <div className="card">
            <CulturalForm
              direction={direction}
              isLoading={loading}
              onSubmit={(f) => translate(f)}
            />
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: 14, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>
      )}

      {view === 'result' && result && mode === 'career' && (
        <div style={{ paddingTop: 32, maxWidth: 880, margin: '0 auto' }}>
          <ResultView
            direction={direction}
            result={result}
            form={form}
            tone={tone}
            onResultChange={setResult}
            onRegen={() => translate(form, { regen: true })}
            onBack={() => setView('form')}
            isRegen={regen}
            showToast={showToast}
          />
        </div>
      )}

      {view === 'result' && result && mode === 'cultural' && (
        <div style={{ paddingTop: 32, maxWidth: 880, margin: '0 auto' }}>
          <CulturalResult
            direction={direction}
            result={result}
            form={form}
            onBack={() => setView('form')}
            onRegen={() => translate(form, { regen: true })}
            isRegen={regen}
          />
        </div>
      )}

      {view === 'form' && tool && (
        <div style={{ paddingTop: 28, maxWidth: 760, margin: '0 auto' }}>
          <span className="pill"><span className="pill-dot" />{tool.label}</span>
          <h1 style={{
            fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 4.8vw, 54px)',
            fontWeight: 400, letterSpacing: '-0.025em', margin: '20px 0 12px', lineHeight: 1.04,
          }}>
            {tool.title}
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: '0 0 36px', maxWidth: 600 }}>
            {tool.intro}
          </p>
          <div className="card">
            <GenericToolForm
              direction={direction}
              tool={tool}
              isLoading={loading}
              onSubmit={(f) => translate(f)}
            />
          </div>
          {error && (
            <div style={{ marginTop: 16, padding: 14, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>
      )}

      {view === 'result' && result && tool && (
        <div style={{ paddingTop: 32, maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <span className="pill"><span className="pill-dot" />{tool.label}</span>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 500, margin: '10px 0 0', letterSpacing: '-0.02em' }}>
                {tool.resultTitle || tool.title}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setView('form')} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`, color: 'inherit',
              }}>← Editar</button>
              <button onClick={() => translate(form, { regen: true })} disabled={regen} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: dirA ? 'var(--b-bg)' : 'var(--b-gold)',
                color: dirA ? 'var(--b-text)' : '#fff',
                opacity: regen ? 0.5 : 1,
              }}>{regen ? 'Gerando…' : '↻ Refazer'}</button>
            </div>
          </div>
          <ToolResult direction={direction} render={tool.render} result={result} />
        </div>
      )}

      {toastNode}
    </div>
    </>
  );
}

window.TranslatorView = TranslatorView;
