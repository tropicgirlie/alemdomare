// History view — saved translations from localStorage

function HistoryView({ direction, onBack, onOpen }) {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('adm-history');
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
  }, []);

  const remove = (id) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    localStorage.setItem('adm-history', JSON.stringify(next));
  };

  const dirA = direction === 'a';

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <button onClick={onBack} style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>← Voltar</button>
      <h1 style={{
        fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 400, letterSpacing: '-0.02em', margin: '8px 0 8px', lineHeight: 1.05,
      }}>
        Suas traduções salvas
      </h1>
      <p style={{ color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', marginBottom: 32 }}>
        Tudo guardado só no seu navegador. Sem login, sem servidor.
      </p>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>☆</div>
          <div style={{ fontSize: 16, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)' }}>
            Nada salvo ainda. Quando você gerar uma tradução, clique em <b>☆ Salvar</b> pra ela aparecer aqui.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((it) => (
            <div key={it.id} className="card" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 4 }}>
                  {it.result.internationalTitle}
                </div>
                <div style={{ fontSize: 13, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)' }}>
                  {it.form.brTitle} · {it.form.targetCountry} · {new Date(it.savedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => onOpen(it)} style={{ padding: '8px 14px', fontSize: 13 }}>Abrir</button>
              <button onClick={() => remove(it.id)} style={{
                padding: 8, fontSize: 13, opacity: 0.5,
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.HistoryView = HistoryView;
