// Horizontal scrollable tool selector. Groups: Career, Cultural, Tools.

const TOOL_GROUPS = [
  {
    id: 'career',
    label: 'Carreira',
    items: [
      { id: 'career', label: 'Tradutor de carreira', sub: 'Currículo + LinkedIn' },
      { id: 'ats_check', label: 'Checagem ATS', sub: 'Vai passar do filtro?' },
      { id: 'salary_reality', label: 'Salário real', sub: 'Sua faixa aqui' },
      { id: 'hiring_reality', label: 'Sem resposta?', sub: 'Por que' },
      { id: 'interview_sim', label: 'Entrevista', sub: 'Treino' },
      { id: 'rejection_decoder', label: 'Decoder', sub: 'Rejeição' },
    ],
  },
  {
    id: 'cultural',
    label: 'Cultural',
    items: [
      { id: 'cultural', label: 'Tradutor cultural', sub: 'Comportamento' },
      { id: 'social_scripts', label: 'Scripts sociais', sub: 'O que dizer' },
      { id: 'say_it_better', label: 'Diga melhor', sub: 'Reescreva' },
      { id: 'identity_reframe', label: 'Me sinto perdido', sub: 'Identidade' },
    ],
  },
];

function ToolPicker({ direction, mode, onChange }) {
  const dirA = direction === 'a';
  const groupLabelId = 'tool-picker-label';

  return (
    <div style={{ marginTop: 12, marginBottom: 8 }} role="region" aria-labelledby={groupLabelId}>
      <p id={groupLabelId} className="sr-only">Escolha a ferramenta</p>
      <div className="adm-picker-scroll tool-picker-scroll">
        {TOOL_GROUPS.map((group) => (
          <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 'max-content' }}>
            <div
              style={{
                fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', fontWeight: 700, paddingLeft: 2,
              }}
              aria-hidden="true"
            >
              {group.label}
            </div>
            <div style={{ display: 'flex', gap: 8 }} role="group" aria-label={group.label}>
              {group.items.map((it) => {
                const active = mode === it.id;
                return (
                  <button
                    key={it.id}
                    type="button"
                    className="adm-picker-btn"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onChange(it.id)}
                  >
                    <div className="adm-picker-btn-label">{it.label}</div>
                    <div className="adm-picker-btn-sub">{it.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ToolPicker = ToolPicker;
