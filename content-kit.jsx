// Live content editing — all copy from content.js, overrides in localStorage.
// Toggle: Tweaks panel → "Modo edição de texto" or ?edit=content

const LS_CONTENT = 'adm_content_overrides';
const LS_EDIT_MODE = 'adm_content_edit_mode';

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

function deepGet(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

function deepSet(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let cur = obj;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const nextK = keys[i + 1];
    if (cur[k] == null) {
      cur[k] = nextK != null && /^\d+$/.test(nextK) ? [] : {};
    }
    cur = cur[k];
  }
  cur[last] = value;
}

function deepMerge(base, patch) {
  if (patch == null) return base;
  if (Array.isArray(patch)) return patch.slice();
  if (typeof patch !== 'object') return patch;
  const out = { ...base };
  Object.keys(patch).forEach((k) => {
    if (patch[k] != null && typeof patch[k] === 'object' && !Array.isArray(patch[k]) && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k] || {}, patch[k]);
    } else {
      out[k] = deepMerge(out[k], patch[k]);
    }
  });
  return out;
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(LS_CONTENT);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(LS_CONTENT, JSON.stringify(overrides));
  } catch (e) { /* noop */ }
}

function formatTemplate(str, vars) {
  if (!str || !vars) return str;
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}

const ContentContext = React.createContext(null);

function ContentProvider({ children }) {
  const defaults = window.AdM_CONTENT_DEFAULTS || {};
  const [overrides, setOverridesState] = React.useState(loadOverrides);
  const [editMode, setEditMode] = React.useState(() => {
    if (new URLSearchParams(window.location.search).get('edit') === 'content') return true;
    return localStorage.getItem(LS_EDIT_MODE) === '1';
  });
  const [savedFlash, setSavedFlash] = React.useState(false);

  const content = React.useMemo(
    () => deepMerge(deepClone(defaults), overrides),
    [defaults, overrides]
  );

  const setPath = React.useCallback((path, value) => {
    setOverridesState((prev) => {
      const next = deepClone(prev);
      deepSet(next, path, value);
      saveOverrides(next);
      return next;
    });
    setSavedFlash(true);
    window.clearTimeout(window.__admContentFlash);
    window.__admContentFlash = window.setTimeout(() => setSavedFlash(false), 1800);
  }, []);

  const resetContent = React.useCallback(() => {
    localStorage.removeItem(LS_CONTENT);
    setOverridesState({});
  }, []);

  const exportContent = React.useCallback(() => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alemdomar-content.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const importContent = React.useCallback((json) => {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      saveOverrides(parsed);
      setOverridesState(parsed);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const toggleEditMode = React.useCallback((on) => {
    const next = typeof on === 'boolean' ? on : !editMode;
    setEditMode(next);
    localStorage.setItem(LS_EDIT_MODE, next ? '1' : '0');
  }, [editMode]);

  const api = React.useMemo(() => ({
    content,
    editMode,
    setPath,
    resetContent,
    exportContent,
    importContent,
    toggleEditMode,
    get: (path) => deepGet(content, path),
    t: (path, vars) => formatTemplate(deepGet(content, path), vars),
  }), [content, editMode, setPath, resetContent, exportContent, importContent, toggleEditMode]);

  return (
    <ContentContext.Provider value={api}>
      {editMode && (
        <div className="adm-content-banner" role="status">
          Modo edição · clique no texto para alterar · salva neste navegador
          {savedFlash && <span className="adm-content-banner-saved"> · salvo</span>}
        </div>
      )}
      {children}
    </ContentContext.Provider>
  );
}

function useContent() {
  const ctx = React.useContext(ContentContext);
  if (!ctx) {
    const defaults = window.AdM_CONTENT_DEFAULTS || {};
    return {
      content: defaults,
      editMode: false,
      setPath: () => {},
      get: (path) => deepGet(defaults, path),
      t: (path, vars) => formatTemplate(deepGet(defaults, path), vars),
    };
  }
  return ctx;
}

// T = editable text node. k = dot path, e.g. "landing.hero.sub"
function T({ k, as: Tag = 'span', className, style, vars, multiline, children, ...rest }) {
  const { get, t, editMode, setPath } = useContent();
  const raw = get(k);
  const display = raw != null ? t(k, vars) : (children ?? '');

  const onBlur = (e) => {
    const text = e.currentTarget.innerText;
    setPath(k, text);
  };

  const onKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  if (editMode && k) {
    return (
      <Tag
        className={`adm-copy-edit${className ? ` ${className}` : ''}`}
        style={style}
        contentEditable
        suppressContentEditableWarning
        data-copy={k}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        {...rest}
      >
        {display}
      </Tag>
    );
  }

  if (multiline && typeof display === 'string') {
    const lines = display.split('\n');
    return (
      <Tag className={className} style={style} {...rest}>
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className} style={style} {...rest}>
      {display}
    </Tag>
  );
}

function ContentEditorPanel() {
  const { editMode, toggleEditMode, exportContent, resetContent, importContent } = useContent();
  const [importText, setImportText] = React.useState('');
  const [importErr, setImportErr] = React.useState('');

  return (
    <>
      <TweakSection label="Conteúdo (pt-BR)" />
      <TweakToggle
        label="Modo edição de texto"
        value={editMode}
        onChange={toggleEditMode}
      />
      <TweakButton label="Exportar JSON" onClick={exportContent} secondary />
      <TweakButton
        label="Resetar textos"
        secondary
        onClick={() => {
          if (confirm('Voltar todos os textos ao padrão deste site?')) resetContent();
        }}
      />
      <TweakRow label="Importar JSON">
        <textarea
          className="twk-field"
          rows={4}
          placeholder='Cole o JSON exportado…'
          value={importText}
          onChange={(e) => { setImportText(e.target.value); setImportErr(''); }}
          style={{ resize: 'vertical', minHeight: 72, fontFamily: 'var(--mono, monospace)', fontSize: 11 }}
        />
      </TweakRow>
      <TweakButton
        label="Aplicar import"
        onClick={() => {
          if (!importText.trim()) return;
          if (!importContent(importText)) {
            setImportErr('JSON inválido');
            return;
          }
          setImportText('');
          setImportErr('');
        }}
      />
      {importErr && <div style={{ fontSize: 11, color: '#dc2626' }}>{importErr}</div>}
      <p style={{ fontSize: 10, lineHeight: 1.45, opacity: 0.65, margin: '4px 0 0' }}>
        Edições ficam no navegador. Exporte o JSON e cole em <code>content.js</code> para publicar em produção.
      </p>
    </>
  );
}

window.ContentProvider = ContentProvider;
window.useContent = useContent;
window.T = T;
window.ContentEditorPanel = ContentEditorPanel;
