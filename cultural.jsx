// Cultural translator: behaviour, not language

const WORK_CONTEXTS = [
  'Escritório / corporativo',
  'Tecnologia / startup',
  'Saúde / clínico',
  'Hotelaria / atendimento',
  'Varejo',
  'Construção / manutenção',
  'Acadêmico / pesquisa',
  'Remoto / time distribuído',
];

function CulturalForm({ direction, onSubmit, isLoading }) {
  const [form, setForm] = React.useState({
    targetCountry: 'Ireland',
    workContext: 'Escritório / corporativo',
    yearsBR: '',
    industry: '',
    concern: '',
  });
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const dirA = direction === 'a';

  const submit = (e) => {
    e.preventDefault();
    if (!isLoading) onSubmit(form);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <label className="field-label">País de destino</label>
          <select className="field-select" value={form.targetCountry} onChange={update('targetCountry')}>
            {TARGET_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Contexto de trabalho</label>
          <select className="field-select" value={form.workContext} onChange={update('workContext')}>
            {WORK_CONTEXTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <label className="field-label">Anos de carreira no Brasil</label>
          <input className="field-input" type="number" min="0" placeholder="5" value={form.yearsBR} onChange={update('yearsBR')} />
        </div>
        <div>
          <label className="field-label">Setor</label>
          <select className="field-select" value={form.industry} onChange={update('industry')}>
            <option value="">Selecione...</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">O que mais te preocupa? (opcional)</label>
        <textarea
          className="field-textarea"
          placeholder="Ex: tenho medo de parecer rude se for muito direto. Não sei como dar feedback negativo. Não entendo a hora certa de ir embora do trabalho. Não sei se posso discordar do meu chefe..."
          value={form.concern}
          onChange={update('concern')}
        />
        <div className="field-hint">Quanto mais específico, mais útil a resposta.</div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
        style={{ alignSelf: 'flex-start', opacity: isLoading ? 0.5 : 1 }}
      >
        {isLoading ? <><span className="spinner" /> Analisando...</> : <>Gerar guia cultural</>}
      </button>
    </form>
  );
}

function CulturalSection({ direction, eyebrow, title, children }) {
  const dirA = direction === 'a';
  return (
    <section className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>
      <h3 style={{
        margin: '0 0 18px',
        fontFamily: 'var(--serif)',
        fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em',
      }}>{title}</h3>
      {children}
    </section>
  );
}

function CulturalResult({ direction, result, form, onBack, onRegen, isRegen }) {
  const dirA = direction === 'a';
  const accent = dirA ? 'var(--a-teal)' : 'var(--b-teal)';
  const gold = dirA ? 'var(--a-gold)' : 'var(--b-gold)';
  const text2 = dirA ? 'var(--a-text-2)' : 'var(--b-text-2)';
  const rule = dirA ? 'var(--a-rule)' : 'var(--b-rule)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={onBack} style={{ fontSize: 14, color: 'inherit', opacity: 0.7 }}>← Voltar</button>
          <h1 style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 400, letterSpacing: '-0.02em',
            margin: '12px 0 4px', lineHeight: 1.05,
          }}>
            Guia cultural: Brasil <span style={{ color: gold }}>↔</span> {form.targetCountry}
          </h1>
          <p style={{ margin: 0, color: text2, fontSize: 16 }}>
            Comportamento, não língua. Específico, não genérico.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onRegen} disabled={isRegen} style={{ padding: '10px 16px', fontSize: 14 }}>
          {isRegen ? '↻ ...' : '↻ Regenerar'}
        </button>
      </div>

      {/* 1. Differences */}
      <CulturalSection direction={direction} eyebrow="01 · Diferenças que você vai sentir" title="No trabalho, na prática">
        <div style={{ display: 'grid', gap: 14 }}>
          {result.differences.map((d, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{d.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14, lineHeight: 1.55 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: text2, marginBottom: 4 }}>No Brasil</div>
                  <div style={{ color: text2 }}>{d.br}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>Em {form.targetCountry}</div>
                  <div>{d.target}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CulturalSection>

      {/* 2. Communication examples */}
      <CulturalSection direction={direction} eyebrow="02 · Comunicação que funciona" title="Em vez disso... tente assim">
        <div style={{ display: 'grid', gap: 14 }}>
          {result.communicationExamples.map((c, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < result.communicationExamples.length - 1 ? `1px solid ${rule}` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: text2, marginBottom: 8 }}>
                {c.situation}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{
                  padding: '12px 14px', borderRadius: 8,
                  background: dirA ? 'rgba(220,38,38,0.05)' : 'rgba(220,38,38,0.10)',
                  fontSize: 14, lineHeight: 1.5, fontStyle: 'italic',
                  color: text2,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, color: '#dc2626', fontStyle: 'normal' }}>Em vez disso</div>
                  "{c.instead}"
                </div>
                <div style={{ alignSelf: 'center', fontSize: 20, color: accent }}>→</div>
                <div style={{
                  padding: '12px 14px', borderRadius: 8,
                  background: dirA ? 'rgba(42,157,143,0.06)' : 'rgba(79,179,184,0.10)',
                  fontSize: 14, lineHeight: 1.5,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, color: accent }}>Tente assim</div>
                  "{c.tryThis}"
                </div>
              </div>
            </div>
          ))}
        </div>
      </CulturalSection>

      {/* 3. Scripts */}
      <CulturalSection direction={direction} eyebrow="03 · Roteiros prontos" title="Pra situação real">
        <div style={{ display: 'grid', gap: 12 }}>
          {result.scripts.map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', border: `1px solid ${rule}`, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: gold, marginBottom: 8 }}>
                  {s.title}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(s.script)}
                  style={{ fontSize: 12, color: text2, padding: '4px 10px', borderRadius: 999, border: `1px solid ${rule}` }}
                >Copiar</button>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.55, fontStyle: 'italic' }}>
                "{s.script}"
              </div>
            </div>
          ))}
        </div>
      </CulturalSection>

      {/* 4. Mistakes */}
      <CulturalSection direction={direction} eyebrow="04 · Erros comuns" title="O que brasileiro faz no primeiro ano">
        <div style={{ display: 'grid', gap: 14 }}>
          {result.mistakes.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, padding: '12px 0', borderBottom: i < result.mistakes.length - 1 ? `1px solid ${rule}` : 'none' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontStyle: 'italic', color: '#dc2626', lineHeight: 1, paddingTop: 2, minWidth: 32 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{m.mistake}</div>
                <div style={{ fontSize: 14, color: text2, lineHeight: 1.55, marginBottom: 6 }}>{m.why}</div>
                <div style={{ fontSize: 14, lineHeight: 1.55 }}>
                  <span style={{ fontWeight: 600, color: accent }}>Em vez disso: </span>{m.fix}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CulturalSection>

      {/* 5. Uncomfortable but normal */}
      <CulturalSection direction={direction} eyebrow="05 · Vai parecer estranho" title="Mas é normal lá">
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {result.uncomfortableButNormal.map((u, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', fontSize: 15, lineHeight: 1.55 }}>
              <span style={{ color: gold, fontSize: 18 }}>✦</span>
              <span>{u}</span>
            </li>
          ))}
        </ul>
      </CulturalSection>
    </div>
  );
}

window.CulturalForm = CulturalForm;
window.CulturalResult = CulturalResult;
