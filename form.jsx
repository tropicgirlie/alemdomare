// Form: progressive — auto-detects segment from job title, adapts questions per segment.

function SegmentBadge({ segment, direction, onChange }) {
  if (!segment) return null;
  const dirA = direction === 'a';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 999,
      background: dirA ? 'rgba(42,157,143,0.08)' : 'rgba(244,185,66,0.08)',
      border: `1px solid ${dirA ? 'rgba(42,157,143,0.25)' : 'rgba(244,185,66,0.30)'}`,
      fontSize: 13,
    }}>
      <span style={{ fontSize: 16 }}>{segment.icon}</span>
      <span>
        Perfil identificado: <b>{segment.label}</b>
      </span>
      <button
        type="button"
        onClick={onChange}
        style={{
          fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
          color: dirA ? 'var(--a-teal)' : 'var(--b-gold)',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}
      >
        Mudar
      </button>
    </div>
  );
}

function SegmentPicker({ direction, onPick, onClose }) {
  const dirA = direction === 'a';
  const segments = Object.values(window.AdM_SEGMENTS);
  return (
    <div style={{
      padding: 20,
      border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
      borderRadius: 12,
      background: dirA ? 'rgba(42,157,143,0.04)' : 'rgba(255,255,255,0.02)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Qual área descreve melhor seu trabalho?</div>
        {onClose && (
          <button type="button" onClick={onClose} style={{ fontSize: 13, opacity: 0.6 }}>fechar</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {segments.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s.id)}
            style={{
              padding: '16px 14px', borderRadius: 10,
              border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
              background: dirA ? '#fff' : 'rgba(255,255,255,0.04)',
              textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 6,
              minHeight: 96,
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{s.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{s.label}</span>
            <span style={{ fontSize: 12, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', lineHeight: 1.35 }}>
              {s.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SegmentField({ field, value, onChange, direction }) {
  const dirA = direction === 'a';
  return (
    <div>
      <label className="field-label">{field.label}</label>
      {field.textarea ? (
        <textarea
          className="field-textarea"
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="field-input"
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function TranslatorForm({ direction, onSubmit, isLoading, initialValues, onChangePersona }) {
  const defaultCity = (window.AdM_CITIES && window.AdM_CITIES.getPreferred()) || 'dublin';
  const defaultCountry = window.AdM_CITIES
    ? window.AdM_CITIES.countryForCity(defaultCity)
    : 'Ireland';

  const [form, setForm] = React.useState(initialValues || {
    brTitle: '', company: '', industry: '', years: '',
    duties: '', targetCountry: defaultCountry, targetCity: defaultCity, targetRole: '',
    segment: null, segmentData: {},
  });
  const [showPicker, setShowPicker] = React.useState(false);
  const [showOtherCountry, setShowOtherCountry] = React.useState(false);

  React.useEffect(() => {
    if (initialValues) {
      setForm({ segmentData: {}, ...initialValues });
      const cityIds = window.AdM_CITIES ? window.AdM_CITIES.list.map((c) => c.country) : [];
      setShowOtherCountry(initialValues.targetCountry && !cityIds.includes(initialValues.targetCountry));
    }
  }, [initialValues]);

  const selectCity = (cityId) => {
    if (!window.AdM_CITIES) return;
    window.AdM_CITIES.setPreferred(cityId);
    setForm((f) => ({
      ...f,
      targetCity: cityId,
      targetCountry: window.AdM_CITIES.countryForCity(cityId),
    }));
    setShowOtherCountry(false);
  };

  const onCountryChange = (country) => {
    const match = window.AdM_CITIES && window.AdM_CITIES.list.find((c) => c.country === country);
    setForm((f) => ({
      ...f,
      targetCountry: country,
      targetCity: match ? match.id : null,
    }));
    if (match && window.AdM_CITIES) window.AdM_CITIES.setPreferred(match.id);
  };

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const updateSegmentField = (k) => (v) => setForm({ ...form, segmentData: { ...form.segmentData, [k]: v } });

  // Auto-detect segment when brTitle blurs (or changes meaningfully)
  const onTitleBlur = () => {
    if (form.segment) return; // user already chose
    const detected = window.AdM_DETECT_SEGMENT(form.brTitle);
    if (detected) {
      setForm((f) => ({ ...f, segment: detected }));
    } else if (form.brTitle && form.brTitle.length > 2) {
      setShowPicker(true);
    }
  };

  const pickSegment = (id) => {
    setForm({ ...form, segment: id });
    setShowPicker(false);
  };

  const dirA = direction === 'a';
  const segObj = form.segment ? window.AdM_SEGMENTS[form.segment] : null;
  const segFields = form.segment ? window.AdM_SEGMENT_FIELDS[form.segment] : null;

  const canSubmit = form.brTitle && form.years && form.duties && form.targetCountry && form.segment;

  const submit = (e) => {
    e.preventDefault();
    if (canSubmit && !isLoading) onSubmit(form);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Quick personas */}
      <div>
        <span className="field-label">Exemplos prontos (para preencher rápido)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {SAMPLE_PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const detected = window.AdM_DETECT_SEGMENT(p.form.brTitle) || 'admin';
                setForm({ ...p.form, segment: detected, segmentData: {} });
                onChangePersona && onChangePersona(p.id);
              }}
              style={{
                padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
                background: dirA ? '#fff' : 'rgba(255,255,255,0.04)',
                color: dirA ? 'var(--a-text)' : 'var(--b-text)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rule-thin" style={{ height: 1, background: dirA ? 'var(--a-rule)' : 'var(--b-rule)' }} />

      {/* Essentials */}
      <div className="form-grid-2col">
        <div>
          <label className="field-label">Cargo no Brasil <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            className="field-input"
            placeholder="Ex: Eletricista, Analista de Produto, Cabeleireira"
            value={form.brTitle}
            onChange={update('brTitle')}
            onBlur={onTitleBlur}
            required
          />
          <div className="field-hint">Como está no seu currículo, em português.</div>
        </div>
        <div>
          <label className="field-label">Anos no cargo <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            className="field-input"
            type="number" min="0" step="0.5"
            placeholder="3"
            value={form.years}
            onChange={update('years')}
            required
          />
        </div>
      </div>

      {/* Segment badge or picker */}
      {segObj && !showPicker && (
        <SegmentBadge segment={segObj} direction={direction} onChange={() => setShowPicker(true)} />
      )}
      {showPicker && (
        <SegmentPicker
          direction={direction}
          onPick={pickSegment}
          onClose={segObj ? () => setShowPicker(false) : null}
        />
      )}
      {!segObj && !showPicker && form.brTitle && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          style={{
            alignSelf: 'flex-start',
            fontSize: 14, fontWeight: 600,
            color: dirA ? 'var(--a-teal)' : 'var(--b-gold)',
            textDecoration: 'underline', textUnderlineOffset: 4,
          }}
        >
          Escolher área de atuação →
        </button>
      )}

      {/* Daily duties */}
      <div>
        <label className="field-label">O que você fazia no dia a dia <span style={{ color: '#dc2626' }}>*</span></label>
        <textarea
          className="field-textarea"
          placeholder="Escreva como falaria pra um amigo. Pode ser bagunçado, em português, sem métricas.&#10;&#10;Ex: Atendia clientes, organizava estoque, dava suporte ao caixa, ajudava o gerente com planilhas..."
          value={form.duties}
          onChange={update('duties')}
          required
        />
        <div className="field-hint">Não precisa estar bonito. Quanto mais cru, melhor.</div>
      </div>

      <div>
        <label className="field-label">Cidade de destino <span style={{ color: '#dc2626' }}>*</span></label>
        {window.CityChips && (
          <CityChips
            direction={direction}
            value={form.targetCity || defaultCity}
            onChange={selectCity}
          />
        )}
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setShowOtherCountry((v) => !v)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: dirA ? 'var(--a-teal)' : 'var(--b-gold)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            {showOtherCountry ? 'Usar Dublin, Londres ou Berlim' : 'Outro país da UE →'}
          </button>
        </div>
        {showOtherCountry && (
          <div style={{ marginTop: 12 }}>
            <select
              className="field-select"
              value={form.targetCountry}
              onChange={(e) => onCountryChange(e.target.value)}
            >
              {TARGET_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="field-hint">Portugal, Holanda, Espanha e outros. Sem guia por cidade ainda.</div>
          </div>
        )}
        {!showOtherCountry && form.targetCity && window.AdM_CITIES && (
          <div className="field-hint" style={{ marginTop: 8 }}>
            Adaptando ao mercado de {window.AdM_CITIES.byId[form.targetCity].label} ({form.targetCountry}).
          </div>
        )}
      </div>

      {/* Segment-specific fields */}
      {segFields && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8,
          borderTop: `1px dashed ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)' }}>
            Detalhes específicos {segObj && `· ${segObj.label}`}
          </div>
          {segFields.map((f) => (
            <SegmentField
              key={f.id}
              field={f}
              direction={direction}
              value={form.segmentData[f.id]}
              onChange={updateSegmentField(f.id)}
            />
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label className="field-label">Empresa (opcional)</label>
              <input className="field-input" placeholder="Nubank, Drogasil, autônoma..." value={form.company} onChange={update('company')} />
            </div>
            <div>
              <label className="field-label">Cargo-alvo (opcional)</label>
              <input className="field-input" placeholder="Ex: Product Analyst, Electrician" value={form.targetRole} onChange={update('targetRole')} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSubmit || isLoading}
          style={{
            opacity: (!canSubmit || isLoading) ? 0.5 : 1,
            cursor: (!canSubmit || isLoading) ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? <><span className="spinner" /> Traduzindo…</> : <>Traduzir minha experiência →</>}
        </button>
        <span style={{ fontSize: 13, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)' }}>
          {!form.segment ? 'Informe o cargo para começar.' : 'Leva cerca de 15 segundos · sem login.'}
        </span>
      </div>
    </form>
  );
}

window.TranslatorForm = TranslatorForm;
