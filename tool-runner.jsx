// Generic tool form + result runner. Drives any AdM_TOOLS[id] config.

function ToolField({ field, value, onChange, direction }) {
  const dirA = direction === 'a';
  const opts = typeof field.options === 'string'
    ? (window.AdM_RESOLVE_OPTIONS ? window.AdM_RESOLVE_OPTIONS(field.options) : [])
    : field.options;

  return (
    <div>
      <label className="field-label">
        {field.label}
        {field.required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          className="field-textarea"
          rows={field.rows || 5}
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === 'select' ? (
        <select
          className="field-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecione...</option>
          {(opts || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          className="field-input"
          type={field.type === 'number' ? 'number' : 'text'}
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function GenericToolForm({ tool, direction, isLoading, onSubmit, initialValues }) {
  const [form, setForm] = React.useState(initialValues || {});
  const update = (id) => (v) => setForm({ ...form, [id]: v });

  const canSubmit = tool.fields.every((f) => !f.required || (form[f.id] && String(form[f.id]).trim()));

  const submit = (e) => {
    e.preventDefault();
    if (canSubmit && !isLoading) onSubmit(form);
  };

  const dirA = direction === 'a';
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {tool.fields.map((f) => (
        <ToolField
          key={f.id}
          field={f}
          direction={direction}
          value={form[f.id]}
          onChange={update(f.id)}
        />
      ))}
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
          {isLoading ? <><span className="spinner" /> Processando…</> : 'Rodar →'}
        </button>
        <span style={{ fontSize: 13, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)' }}>
          1 crédito · cerca de 15s
        </span>
      </div>
    </form>
  );
}

// Run a tool against the hybrid translation service
async function runTool(tool, form) {
  const toolId = tool.id;
  const textToTranslate = extractTextFromForm(form, toolId);

  if (!textToTranslate || textToTranslate.trim().length === 0) {
    throw new Error('No text to translate provided');
  }

  const deviceId = window.AdM_CREDITS && window.AdM_CREDITS.getDeviceId();
  const apiBase = (window.ADM_API_BASE || 'https://alemdomar-auth.luanagbc.workers.dev').replace(/\/+$/, '');

  let response;
  try {
    response = await fetch(apiBase + '/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId || '',
      },
      body: JSON.stringify({
        text: textToTranslate,
        toolType: toolId,
        sourceLang: 'pt',
        targetLang: 'en'
      })
    });
  } catch (networkErr) {
    return fallbackToClaude(tool, form, networkErr);
  }

  // 402 = server says no credits. Sync state from server, surface to UI, do NOT fall back.
  if (response.status === 402) {
    if (window.AdM_CREDITS && window.AdM_CREDITS.syncFromServer) {
      try { await window.AdM_CREDITS.syncFromServer(); } catch (_) {}
    }
    const err = new Error('no_credits');
    err.code = 'no_credits';
    throw err;
  }

  if (!response.ok) {
    return fallbackToClaude(tool, form, new Error('translation_service_error_' + response.status));
  }

  const result = await response.json();
  if (result && result.credits && window.AdM_CREDITS && window.AdM_CREDITS.applyServerCredits) {
    window.AdM_CREDITS.applyServerCredits(result.credits);
  }
  return formatTranslationResult(result, tool, form);
}

async function fallbackToClaude(tool, form, originalError) {
  console.error('Hybrid translation failed, falling back to Claude:', originalError);
  if (!(window.claude && typeof window.claude.complete === 'function')) {
    throw originalError;
  }
  const prompt = tool.prompt(form);
  const raw = await window.claude.complete({ messages: [{ role: 'user', content: prompt }] });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); }
  catch (e) {
    const s = cleaned.indexOf('{');
    const t = cleaned.lastIndexOf('}');
    if (s >= 0 && t > s) return JSON.parse(cleaned.slice(s, t + 1));
    throw e;
  }
}

// Extract the main text from form based on tool type
function extractTextFromForm(form, toolId) {
  switch (toolId) {
    case 'career':
      return form.cvBullets || form.experience || '';
    case 'cultural':
      return form.situation || form.context || '';
    case 'say_it_better':
      return form.originalText || form.message || '';
    case 'identity_reframe':
      return form.challenge || form.situation || '';
    case 'ats_check':
      return form.cvText || form.resume || '';
    case 'salary_reality':
      return form.role || form.position || '';
    case 'hiring_reality':
      return form.situation || form.context || '';
    case 'interview_sim':
      return form.role || form.position || '';
    case 'rejection_decoder':
      return form.rejectionMessage || form.message || '';
    default:
      // Try to find the first text field
      const textFields = Object.values(form).filter(value => 
        typeof value === 'string' && value.length > 0
      );
      return textFields[0] || '';
  }
}

// Format translation result to match expected tool structure
function formatTranslationResult(translationResult, tool, originalForm) {
  const { translation, service, estimatedCost } = translationResult;
  
  // Create result structure based on tool type
  switch (tool.id) {
    case 'career':
      return {
        cvBullets: translation.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•*]\s*/, '').trim()),
        service,
        estimatedCost,
        originalText: extractTextFromForm(originalForm, tool.id)
      };
    
    case 'cultural':
      return {
        adaptation: translation,
        service,
        estimatedCost,
        originalText: extractTextFromForm(originalForm, tool.id)
      };
    
    case 'say_it_better':
      return {
        improvedText: translation,
        service,
        estimatedCost,
        originalText: extractTextFromForm(originalForm, tool.id)
      };
    
    case 'identity_reframe':
      return {
        reframedIdentity: translation,
        service,
        estimatedCost,
        originalText: extractTextFromForm(originalForm, tool.id)
      };
    
    default:
      return {
        result: translation,
        service,
        estimatedCost,
        originalText: extractTextFromForm(originalForm, tool.id)
      };
  }
}

window.GenericToolForm = GenericToolForm;
window.runTool = runTool;
