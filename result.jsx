// Result view — output blocks, copy/edit/regen/share/download

function ResultBlock({ direction, title, eyebrow, children, onCopy, copyText, actions }) {
  const [copied, setCopied] = React.useState(false);

  const doCopy = () => {
    if (onCopy) { onCopy(); }
    else if (copyText) {
      navigator.clipboard.writeText(copyText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="card" style={{ marginBottom: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
          <h3 style={{
            margin: 0,
            fontFamily: 'var(--serif)',
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {actions}
          {(copyText || onCopy) && (
            <button
              onClick={doCopy}
              style={{
                padding: '7px 12px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 999,
                border: `1px solid ${direction === 'a' ? 'var(--a-rule)' : 'var(--b-rule)'}`,
                color: copied ? (direction === 'a' ? 'var(--a-teal)' : 'var(--b-teal)') : 'inherit',
                background: 'transparent',
              }}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

// Editable text component
function Editable({ value, onChange, multiline, style }) {
  const ref = React.useRef(null);
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.innerText)}
      style={{
        outline: 'none',
        borderRadius: 4,
        padding: '4px 6px',
        margin: '-4px -6px',
        cursor: 'text',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = 'rgba(233,196,106,0.12)';
      }}
      onMouseLeave={(e) => {
        if (document.activeElement !== e.currentTarget) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {value}
    </div>
  );
}

function ResultView({ direction, result, form, tone, onResultChange, onRegen, onBack, onSave, isRegen, showToast }) {
  const dirA = direction === 'a';
  const accent = dirA ? 'var(--a-teal)' : 'var(--b-teal)';
  const gold = dirA ? 'var(--a-gold)' : 'var(--b-gold)';

  // Local edits
  const update = (k, v) => onResultChange({ ...result, [k]: v });
  const updateBullet = (i, v) => {
    const next = [...result.cvBullets];
    next[i] = v;
    update('cvBullets', next);
  };

  const fullText = React.useMemo(() => {
    const lines = [];
    lines.push(`# ${result.internationalTitle}`);
    if (result.titleAlternatives?.length) {
      lines.push(`Alternativas: ${result.titleAlternatives.join(' · ')}`);
    }
    lines.push('');
    lines.push('## CV bullets');
    result.cvBullets?.forEach((b) => lines.push(`• ${b}`));
    lines.push('');
    lines.push('## LinkedIn headline');
    lines.push(result.linkedinHeadline || '');
    lines.push('');
    lines.push('## About');
    lines.push(result.shortAbout || '');
    lines.push('');
    lines.push('## Skills translation');
    result.skillsTranslation?.forEach((s) => lines.push(`• ${s.br} → ${s.en}`));
    lines.push('');
    lines.push('## Interview talking points');
    result.interviewTalkingPoints?.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    if (result.honestyNotes?.length) {
      lines.push('');
      lines.push('## Verificar antes de usar');
      result.honestyNotes.forEach((n) => lines.push(`• ${n}`));
    }
    return lines.join('\n');
  }, [result]);

  const downloadTxt = () => {
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alemdomar-${(result.internationalTitle || 'cv').toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Baixado como .txt');
  };

  const downloadPdf = () => {
    // Open print dialog with formatted view; user saves as PDF
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html><head><title>${result.internationalTitle}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 680px; margin: 60px auto; padding: 0 40px; color: #1F2933; line-height: 1.55; }
        h1 { font-size: 32px; margin: 0 0 8px; letter-spacing: -0.02em; }
        h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B7280; margin: 32px 0 12px; font-weight: 600; }
        ul { padding-left: 20px; } li { margin-bottom: 8px; }
        .alt { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
        .note { font-size: 13px; color: #6B7280; padding: 12px 16px; background: #F7F7F5; border-left: 3px solid #E9C46A; margin: 8px 0; }
      </style></head><body>
      <h1>${result.internationalTitle}</h1>
      ${result.titleAlternatives?.length ? `<div class="alt">also: ${result.titleAlternatives.join(' · ')}</div>` : ''}
      <h2>CV bullets</h2><ul>${result.cvBullets.map(b => `<li>${b}</li>`).join('')}</ul>
      <h2>LinkedIn headline</h2><p>${result.linkedinHeadline}</p>
      <h2>About</h2><p>${result.shortAbout}</p>
      <h2>Skills translation</h2><ul>${result.skillsTranslation.map(s => `<li><b>${s.br}</b> → ${s.en}</li>`).join('')}</ul>
      <h2>Interview talking points</h2><ul>${result.interviewTalkingPoints.map(t => `<li>${t}</li>`).join('')}</ul>
      ${result.honestyNotes?.length ? `<h2>Verificar antes de usar</h2>${result.honestyNotes.map(n => `<div class="note">${n}</div>`).join('')}` : ''}
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
    showToast('Abrindo PDF...');
  };

  const emailSelf = () => {
    const subject = encodeURIComponent(`Além do Mar: ${result.internationalTitle}`);
    const body = encodeURIComponent(fullText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showToast('Abrindo e-mail...');
  };

  const shareLink = async () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({ result, form }))));
    const url = `${window.location.origin}${window.location.pathname}?share=${data}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copiado');
    } catch {
      prompt('Copie o link:', url);
    }
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 32, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <button onClick={onBack} style={{ fontSize: 14, color: 'inherit', opacity: 0.7 }}>
            ← Editar respostas
          </button>
          <h1 style={{
            margin: '12px 0 4px',
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}>
            Sua tradução está pronta.
          </h1>
          <p style={{ margin: 0, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', fontSize: 16 }}>
            Clique em qualquer trecho pra editar antes de copiar. Nada foi inventado, só reformulado.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['✉', 'E-mail', emailSelf],
            ['↗', 'Link', shareLink],
            ['↓', '.txt', downloadTxt],
            ['↓', 'PDF', downloadPdf],
          ].map(([icon, label, fn]) => (
            <button
              key={label}
              className="btn btn-ghost"
              onClick={fn}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                whiteSpace: 'nowrap',
                lineHeight: 1,
                gap: 6,
                flex: '0 0 auto',
              }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Honesty banner */}
      {result.honestyNotes?.length > 0 && (
        <div style={{
          background: dirA ? 'rgba(233,196,106,0.18)' : 'rgba(244,185,66,0.10)',
          borderLeft: `3px solid ${gold}`,
          padding: '14px 18px',
          borderRadius: '0 8px 8px 0',
          marginBottom: 24,
          fontSize: 14,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ⚠ Verificar antes de usar
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.55 }}>
            {result.honestyNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {/* Block 1: Job title */}
      <ResultBlock
        direction={direction}
        eyebrow="01 · Equivalente internacional"
        title="Título do cargo"
        copyText={result.internationalTitle}
      >
        <div style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          <Editable value={result.internationalTitle} onChange={(v) => update('internationalTitle', v)} />
        </div>
        {result.titleAlternatives?.length > 0 && (
          <div style={{ marginTop: 12, fontSize: 14, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)' }}>
            Alternativas: {result.titleAlternatives.map((a, i) => (
              <span key={i}>
                {i > 0 && <span style={{ opacity: 0.5 }}> · </span>}
                <span style={{ fontStyle: 'italic' }}>{a}</span>
              </span>
            ))}
          </div>
        )}
      </ResultBlock>

      {/* Block 2: CV bullets */}
      <ResultBlock
        direction={direction}
        eyebrow="02 · Para o currículo"
        title="Tópicos pro CV"
        copyText={result.cvBullets.map((b) => `• ${b}`).join('\n')}
        actions={
          <button
            onClick={onRegen}
            disabled={isRegen}
            style={{
              padding: '7px 12px', fontSize: 13, fontWeight: 500, borderRadius: 999,
              border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
              opacity: isRegen ? 0.5 : 1,
            }}
          >
            {isRegen ? '↻ ...' : '↻ Regenerar'}
          </button>
        }
      >
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
          {result.cvBullets.map((b, i) => (
            <li key={i} style={{
              padding: '10px 0',
              borderBottom: i < result.cvBullets.length - 1 ? `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}` : 'none',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ color: accent, marginTop: 2, fontSize: 12 }}>◆</span>
              <span style={{ flex: 1, fontSize: 15, lineHeight: 1.55 }}>
                <Editable value={b} onChange={(v) => updateBullet(i, v)} />
              </span>
            </li>
          ))}
        </ul>
      </ResultBlock>

      {/* Block 3: LinkedIn */}
      <ResultBlock
        direction={direction}
        eyebrow="03 · Para o LinkedIn"
        title="Headline + sobre você"
        copyText={`${result.linkedinHeadline}\n\n${result.shortAbout}`}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', marginBottom: 8 }}>
            Headline
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4 }}>
            <Editable value={result.linkedinHeadline} onChange={(v) => update('linkedinHeadline', v)} />
          </div>
          <div style={{ fontSize: 12, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', marginTop: 8 }}>
            {result.linkedinHeadline?.length || 0} / 220 caracteres
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', marginBottom: 8 }}>
            Sobre você
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6 }}>
            <Editable value={result.shortAbout} onChange={(v) => update('shortAbout', v)} multiline />
          </div>
        </div>
      </ResultBlock>

      {/* Block 4: Skills translation */}
      <ResultBlock
        direction={direction}
        eyebrow="04 · Vocabulário"
        title="Tradução de habilidades"
        copyText={result.skillsTranslation.map((s) => `${s.br} → ${s.en}`).join('\n')}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {result.skillsTranslation.map((s, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 16, alignItems: 'center',
              padding: '8px 0',
            }}>
              <div style={{ fontSize: 14, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', fontStyle: 'italic' }}>
                {s.br}
              </div>
              <span style={{ fontSize: 18, color: accent }}>→</span>
              <div style={{ fontSize: 15, fontWeight: 500 }}>
                {s.en}
              </div>
            </div>
          ))}
        </div>
      </ResultBlock>

      {/* Block 5: Interview talking points */}
      <ResultBlock
        direction={direction}
        eyebrow="05 · Para a entrevista"
        title="Pontos de fala (método STAR)"
        copyText={result.interviewTalkingPoints.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}
      >
        <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', counterReset: 'tp' }}>
          {result.interviewTalkingPoints.map((t, i) => (
            <li key={i} style={{
              counterIncrement: 'tp',
              padding: '14px 0',
              borderBottom: i < result.interviewTalkingPoints.length - 1 ? `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}` : 'none',
              display: 'flex', gap: 16,
            }}>
              <div style={{
                fontFamily: 'var(--serif)',
                fontSize: 24,
                fontStyle: 'italic',
                color: gold,
                lineHeight: 1, minWidth: 30,
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, flex: 1 }}>
                {t}
              </div>
            </li>
          ))}
        </ol>
      </ResultBlock>
    </div>
  );
}

window.ResultView = ResultView;
