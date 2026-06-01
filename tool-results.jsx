// Render functions for each MVP tool's output JSON. Selected by `tool.render`.

function ResultBlock({ direction, label, children, accent }) {
  const dirA = direction === 'a';
  return (
    <div style={{
      padding: 24, marginBottom: 16, borderRadius: 12,
      border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
      background: accent
        ? (dirA ? 'rgba(42,157,143,0.05)' : 'rgba(244,185,66,0.06)')
        : (dirA ? '#fff' : 'rgba(255,255,255,0.02)'),
    }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)',
          marginBottom: 12,
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function Pill({ direction, tone, children }) {
  const dirA = direction === 'a';
  const map = {
    high: { bg: 'rgba(220,38,38,0.1)', fg: '#dc2626' },
    medium: { bg: 'rgba(234,179,8,0.12)', fg: '#a16207' },
    low: { bg: 'rgba(22,163,74,0.1)', fg: '#16a34a' },
    neutral: { bg: dirA ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', fg: dirA ? 'var(--a-text)' : 'var(--b-text)' },
  };
  const c = map[tone] || map.neutral;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      background: c.bg, color: c.fg,
    }}>{children}</span>
  );
}

function toneOf(level) {
  const v = String(level || '').toLowerCase();
  if (v.includes('high') || v.includes('alta') || v.includes('alto')) return 'high';
  if (v.includes('medium') || v.includes('média') || v.includes('médio') || v.includes('mid')) return 'medium';
  if (v.includes('low') || v.includes('baixa') || v.includes('baixo')) return 'low';
  return 'neutral';
}

// ─────────── HIRING REALITY ───────────
function HiringRealityResult({ direction, result }) {
  return (
    <>
      <ResultBlock direction={direction} label="Veredito" accent>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.3, fontWeight: 500 }}>
          {result.verdict}
        </div>
      </ResultBlock>
      <ResultBlock direction={direction} label="Bloqueios prováveis">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(result.blockers || []).map((b, i) => (
            <div key={i} style={{ paddingBottom: 14, borderBottom: i < result.blockers.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <strong style={{ fontSize: 15 }}>{b.blocker}</strong>
                <Pill direction={direction} tone={toneOf(b.likelihood)}>{b.likelihood}</Pill>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.85, marginBottom: 6 }}>{b.why}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>→ {b.fix}</div>
            </div>
          ))}
        </div>
      </ResultBlock>
      <ResultBlock direction={direction} label="Faça essa semana">
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, fontSize: 15 }}>
          {(result.doThisWeek || []).map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}
        </ul>
      </ResultBlock>
      {result.stopDoing && (
        <ResultBlock direction={direction} label="Pare de fazer">
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, fontSize: 15 }}>
            {result.stopDoing.map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}
          </ul>
        </ResultBlock>
      )}
    </>
  );
}

// ─────────── ATS CHECK ───────────
function AtsCheckResult({ direction, result }) {
  const dirA = direction === 'a';
  const score = parseInt(result.score, 10) || 0;
  const scoreColor = score >= 75 ? '#16a34a' : score >= 50 ? '#a16207' : '#dc2626';
  return (
    <>
      <ResultBlock direction={direction} label="Resultado" accent>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            border: `3px solid ${scoreColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 600, color: scoreColor,
          }}>{score}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Pill direction={direction} tone={toneOf(result.passLikelihood)}>{result.passLikelihood}</Pill>
            <div style={{ marginTop: 10, fontSize: 16, lineHeight: 1.5 }}>{result.verdict}</div>
          </div>
        </div>
      </ResultBlock>
      {result.matchedKeywords && result.matchedKeywords.length > 0 && (
        <ResultBlock direction={direction} label={`Palavras-chave que bateram (${result.matchedKeywords.length})`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.matchedKeywords.map((k, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(22,163,74,0.1)', color: '#16a34a', fontSize: 13, fontWeight: 500 }}>{k}</span>
            ))}
          </div>
        </ResultBlock>
      )}
      <ResultBlock direction={direction} label="Faltando (crítico)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(result.missingCritical || []).map((m, i) => (
            <div key={i} style={{ paddingBottom: 12, borderBottom: i < result.missingCritical.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
              <strong style={{ fontSize: 15 }}>{m.keyword}</strong>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{m.why}</div>
              <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: dirA ? 'rgba(42,157,143,0.06)' : 'rgba(255,255,255,0.04)', fontSize: 14, lineHeight: 1.5 }}>
                <strong>Tente:</strong> {m.addAs}
              </div>
            </div>
          ))}
        </div>
      </ResultBlock>
      {result.weakSignals && result.weakSignals.length > 0 && (
        <ResultBlock direction={direction} label="Sinais fracos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.weakSignals.map((w, i) => (
              <div key={i}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>{w.issue}</div>
                <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 13, opacity: 0.8 }}>"{w.currentText}"</div>
                <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500 }}>→ {w.suggested}</div>
              </div>
            ))}
          </div>
        </ResultBlock>
      )}
    </>
  );
}

// ─────────── SALARY REALITY ───────────
function SalaryRealityResult({ direction, result }) {
  const fmt = (n) => {
    const v = Number(n);
    if (isNaN(v)) return n;
    return v.toLocaleString('en-IE');
  };
  const cur = result.currency || '€';
  return (
    <>
      <ResultBlock direction={direction} label="Faixa real (anual bruto)" accent>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 28, opacity: 0.7 }}>{cur} {fmt(result.rangeLow)}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 44, fontWeight: 600 }}>{cur} {fmt(result.rangeMid)}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 28, opacity: 0.7 }}>{cur} {fmt(result.rangeHigh)}</div>
        </div>
        <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.55 }}>{result.explanation}</div>
      </ResultBlock>
      <ResultBlock direction={direction} label="Custo de vida (real)">
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>{result.costOfLivingContext}</div>
      </ResultBlock>
      {result.askThisAmount && (
        <ResultBlock direction={direction} label="Peça este número">
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
            {result.askThisAmount}
          </div>
        </ResultBlock>
      )}
      <ResultBlock direction={direction} label="Como negociar aqui">
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, fontSize: 15 }}>
          {(result.negotiationAdvice || []).map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}
        </ul>
      </ResultBlock>
      {result.redFlags && (
        <ResultBlock direction={direction} label="Sinais de oferta baixa">
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, fontSize: 15 }}>
            {result.redFlags.map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}
          </ul>
        </ResultBlock>
      )}
    </>
  );
}

// ─────────── INTERVIEW SIM ───────────
function InterviewSimResult({ direction, result }) {
  const dirA = direction === 'a';
  return (
    <>
      {result.toneNotes && (
        <ResultBlock direction={direction} label="Tom geral para esse mercado" accent>
          <div style={{ fontSize: 16, lineHeight: 1.55 }}>{result.toneNotes}</div>
        </ResultBlock>
      )}
      {(result.questions || []).map((q, i) => (
        <ResultBlock key={i} direction={direction} label={`Pergunta ${i + 1}`}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, lineHeight: 1.3, marginBottom: 12 }}>
            "{q.question}"
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
            <strong>O que estão sondando:</strong> {q.whyTheyAsk}
          </div>
          <div style={{ marginBottom: 14, padding: 14, borderRadius: 8, background: dirA ? 'rgba(42,157,143,0.06)' : 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>Resposta modelo · {q.structure}</div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{q.exampleAnswer}</div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Erro comum brasileiro:</strong>
            <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 4 }}>{q.brazilianMistake}</div>
          </div>
          <div>
            <strong style={{ fontSize: 13 }}>→ Como corrigir:</strong>
            <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 4 }}>{q.fix}</div>
          </div>
        </ResultBlock>
      ))}
    </>
  );
}

// ─────────── SAY IT BETTER ───────────
function SayItBetterResult({ direction, result }) {
  const dirA = direction === 'a';
  return (
    <>
      <ResultBlock direction={direction} label="Versão pronta para usar" accent>
        <div style={{ fontSize: 17, lineHeight: 1.6, fontFamily: 'var(--serif)' }}>{result.primary}</div>
      </ResultBlock>
      {result.alternatives && result.alternatives.length > 0 && (
        <ResultBlock direction={direction} label="Variações">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {result.alternatives.map((a, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 15, lineHeight: 1.55 }}>{a.text}</div>
              </div>
            ))}
          </div>
        </ResultBlock>
      )}
      {result.notes && (
        <ResultBlock direction={direction} label="O que mudou">
          <div style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.85 }}>{result.notes}</div>
        </ResultBlock>
      )}
    </>
  );
}

// ─────────── REJECTION DECODER ───────────
function RejectionDecoderResult({ direction, result }) {
  return (
    <>
      <ResultBlock direction={direction} label="O que provavelmente quer dizer" accent>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.4 }}>{result.likelyMeaning}</div>
      </ResultBlock>
      {result.phraseDecoding && result.phraseDecoding.length > 0 && (
        <ResultBlock direction={direction} label="Tradução das frases">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.phraseDecoding.map((p, i) => (
              <div key={i} style={{ padding: '10px 12px', borderLeft: `3px solid ${'rgba(220,38,38,0.4)'}`, background: 'rgba(220,38,38,0.04)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, opacity: 0.8 }}>"{p.they_said}"</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>→ {p.really_means}</div>
              </div>
            ))}
          </div>
        </ResultBlock>
      )}
      <ResultBlock direction={direction} label="Foi você?">
        <div style={{ fontSize: 15, lineHeight: 1.55 }}>{result.wasItYou}</div>
      </ResultBlock>
      <ResultBlock direction={direction} label="Pra próxima vez">
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, fontSize: 15 }}>
          {(result.lessons || []).map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}
        </ul>
      </ResultBlock>
      {result.responseTemplate && (
        <ResultBlock direction={direction} label="Resposta sugerida (opcional)">
          <div style={{ padding: 14, borderRadius: 8, background: 'rgba(0,0,0,0.04)', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {result.responseTemplate}
          </div>
        </ResultBlock>
      )}
    </>
  );
}

// ─────────── IDENTITY REFRAME ───────────
function IdentityReframeResult({ direction, result }) {
  return (
    <>
      <ResultBlock direction={direction} label="O que você está sentindo" accent>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.4 }}>{result.validation}</div>
      </ResultBlock>
      <ResultBlock direction={direction} label="O que está acontecendo de verdade">
        <div style={{ fontSize: 15, lineHeight: 1.65 }}>{result.whatsActuallyHappening}</div>
      </ResultBlock>
      <ResultBlock direction={direction} label="Outro ângulo">
        <div style={{ fontSize: 15, lineHeight: 1.65 }}>{result.reframe}</div>
      </ResultBlock>
      <ResultBlock direction={direction} label="Uma ação para esta semana" accent>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, lineHeight: 1.45 }}>{result.nextAction}</div>
      </ResultBlock>
      {result.whatNotToDo && (
        <ResultBlock direction={direction} label="Ciladas comuns dessa fase">
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>{result.whatNotToDo}</div>
        </ResultBlock>
      )}
    </>
  );
}

// ─────────── SOCIAL SCRIPTS ───────────
function SocialScriptsResult({ direction, result }) {
  const dirA = direction === 'a';
  return (
    <>
      <ResultBlock direction={direction} label="Contexto cultural" accent>
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>{result.culturalContext}</div>
      </ResultBlock>
      <ResultBlock direction={direction} label="O que dizer (palavras prontas)">
        <div style={{ padding: 16, borderRadius: 8, background: dirA ? 'rgba(42,157,143,0.06)' : 'rgba(244,185,66,0.06)', fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.5 }}>
          "{result.script}"
        </div>
      </ResultBlock>
      {result.alternatives && result.alternatives.length > 0 && (
        <ResultBlock direction={direction} label="Variações">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.alternatives.map((a, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 15, lineHeight: 1.55 }}>"{a.text}"</div>
              </div>
            ))}
          </div>
        </ResultBlock>
      )}
      {result.bodyLanguage && (
        <ResultBlock direction={direction} label="Linguagem corporal & tom">
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>{result.bodyLanguage}</div>
        </ResultBlock>
      )}
      <ResultBlock direction={direction} label="Cilada brasileira">
        <div style={{ fontSize: 14, lineHeight: 1.55 }}>{result.brazilianTrap}</div>
      </ResultBlock>
      {result.whatComesNext && (
        <ResultBlock direction={direction} label="O que esperar a seguir">
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>{result.whatComesNext}</div>
        </ResultBlock>
      )}
    </>
  );
}

// Render dispatcher
function ToolResult({ direction, render, result }) {
  switch (render) {
    case 'hiringReality': return <HiringRealityResult direction={direction} result={result} />;
    case 'atsCheck': return <AtsCheckResult direction={direction} result={result} />;
    case 'salaryReality': return <SalaryRealityResult direction={direction} result={result} />;
    case 'interviewSim': return <InterviewSimResult direction={direction} result={result} />;
    case 'sayItBetter': return <SayItBetterResult direction={direction} result={result} />;
    case 'rejectionDecoder': return <RejectionDecoderResult direction={direction} result={result} />;
    case 'identityReframe': return <IdentityReframeResult direction={direction} result={result} />;
    case 'socialScripts': return <SocialScriptsResult direction={direction} result={result} />;
    default:
      return (
        <ResultBlock direction={direction} label="Resposta">
          <pre style={{ fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </ResultBlock>
      );
  }
}

window.ToolResult = ToolResult;
