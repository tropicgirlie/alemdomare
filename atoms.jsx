// Reusable visual atoms — wave decorations, brand mark, sample data

const SAMPLE_PERSONAS = [
  {
    id: 'product',
    label: 'Analista de Produto · Nubank · 3 anos',
    form: {
      brTitle: 'Analista de Produto',
      company: 'Nubank',
      industry: 'Fintech',
      years: '3',
      scope: 'Time de produto com 8 pessoas, sem reportes diretos',
      tools: 'Jira, Figma, Excel, Confluence',
      duties: 'Responsável por apoiar o time de produto, levantamento de requisitos, contato com stakeholders, acompanhamento de entregas, testes de funcionalidades, apoio ao time de design e tecnologia. Participação em reuniões com áreas internas.',
      outcomes: 'Ajudei a lançar 2 features novas no app. Acho que reduzimos bugs reportados depois que comecei a fazer testes mais sistemáticos.',
      targetCountry: 'Ireland',
      targetCity: 'dublin',
      targetRole: 'Product Analyst / Associate PM',
    },
  },
  {
    id: 'pharmacy',
    label: 'Atendente de Farmácia · Drogasil · 4 anos',
    form: {
      brTitle: 'Atendente de Farmácia',
      company: 'Drogasil',
      industry: 'Varejo / Saúde',
      years: '4',
      scope: 'Loja com 6 atendentes, sem gestão de equipe',
      tools: 'PDV interno, sistema de controle de estoque, balança digital',
      duties: 'Atendimento ao cliente, orientação sobre medicamentos, organização de estoque, operação de caixa, contato com equipe, controle de validade dos produtos.',
      outcomes: 'Ganhei prêmio de melhor atendente do trimestre 2x. Loja teve menos perdas por validade depois que assumi o controle.',
      targetCountry: 'Ireland',
      targetCity: 'dublin',
      targetRole: '',
    },
  },
  {
    id: 'admin',
    label: 'Assistente Administrativo · Logística · 5 anos',
    form: {
      brTitle: 'Assistente Administrativo',
      company: 'Empresa de logística médio porte em São Paulo',
      industry: 'Logística',
      years: '5',
      scope: 'Escritório de 12 pessoas, apoio direto a 3 gerentes',
      tools: 'Excel avançado, SAP, sistema de notas fiscais, Outlook',
      duties: 'Controle de planilhas, suporte ao financeiro, emissão de notas fiscais, contato com fornecedores, organização de documentos, apoio geral ao escritório.',
      outcomes: 'Criei um controle novo de notas que reduziu erros. Ajudei a renegociar 2 contratos com fornecedores.',
      targetCountry: 'United Kingdom',
      targetCity: 'london',
      targetRole: 'Office Coordinator',
    },
  },
  {
    id: 'designer',
    label: 'UX/UI Designer · Saúde · 6 anos',
    form: {
      brTitle: 'UX/UI Designer',
      company: 'Empresa de saúde (tipo Eurofins)',
      industry: 'Saúde / SaaS',
      years: '6',
      scope: 'Time de design com 4 pessoas, ownership do app principal',
      tools: 'Figma, Maze, Hotjar, Miro, Notion',
      duties: 'Pesquisa com usuários, criação de interfaces, colaboração com produto e engenharia, melhoria de fluxos, testes de usabilidade, design de sistemas.',
      outcomes: 'Refiz o fluxo de agendamento e a taxa de conclusão subiu bastante. Construí a primeira versão do design system da empresa.',
      targetCountry: 'Germany',
      targetCity: 'berlin',
      targetRole: 'Senior Product Designer',
    },
  },
];

const TARGET_COUNTRIES = [
  'Ireland', 'United Kingdom', 'Germany', 'Netherlands', 'Portugal',
  'Spain', 'France', 'Sweden', 'Denmark', 'Other EU',
];

const INDUSTRIES = [
  'Fintech', 'Bancos / financeiro', 'Saúde', 'Farmacêutica', 'Varejo', 'E-commerce',
  'Logística', 'Indústria', 'Educação', 'SaaS / Tecnologia', 'Consultoria',
  'Hotelaria', 'Construção civil', 'Setor público', 'Mídia', 'Outro',
];

// Wave SVG — used decoratively, color via currentColor
function Wave({ height = 80, opacity = 1, style = {} }) {
  return (
    <svg className="wave-svg" viewBox="0 0 1200 80" preserveAspectRatio="none" style={{ height, opacity, ...style }}>
      <path d="M0,40 C200,10 400,70 600,40 C800,10 1000,70 1200,40 L1200,80 L0,80 Z" fill="currentColor" />
    </svg>
  );
}

// Compass / star mark from logo
function StarMark({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
    </svg>
  );
}

// Maritime blue top bar (editorial is the default everywhere else)
function SiteHeader({ children, label = 'Principal' }) {
  return (
    <header className="adm-header-maritime">
      <div className="wrap">
        <nav className="nav" aria-label={label}>{children}</nav>
      </div>
    </header>
  );
}

// Brand lockup
function Brand({ direction = 'a', size = 'md' }) {
  const dims = size === 'lg' ? 56 : size === 'sm' ? 32 : 40;
  const fontSize = size === 'lg' ? 28 : size === 'sm' ? 18 : 22;
  return (
    <div className="brand" style={{ fontSize }}>
      <img src="assets/logo.png" alt="Além do Mar" style={{ width: dims, height: dims }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span>Além do Mar</span>
        <span style={{
          fontFamily: 'var(--sans)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: direction === 'a' ? 'var(--a-text-2)' : 'var(--b-text-2)',
          fontStyle: 'normal',
        }}>
          Carreira & recomeço no exterior
        </span>
      </div>
    </div>
  );
}

// Toast helper
function useToast() {
  const [msg, setMsg] = React.useState('');
  const show = React.useCallback((m) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 1800);
  }, []);
  const node = msg ? <div className="toast show">{msg}</div> : null;
  return [show, node];
}

function CityChips({ direction, value, onChange, size = 'md', activeVariant = 'city' }) {
  const dirA = direction === 'a';
  const maritime = activeVariant === 'maritime';
  const cities = window.AdM_CITIES ? window.AdM_CITIES.list : [];
  const pad = size === 'sm' ? '6px 12px' : '8px 16px';
  const fontSize = size === 'sm' ? 12 : 13;

  return (
    <div
      className={'city-chips' + (maritime ? ' city-chips--maritime-active' : '')}
      role="group"
      aria-label="Cidade de destino"
    >
      {cities.map((c) => {
        const active = value === c.id;
        const accent = dirA ? c.color : c.colorB;
        const activeBg = maritime ? 'var(--b-bg)' : accent;
        const activeBorder = maritime ? 'var(--b-bg)' : accent;
        const activeColor = maritime ? 'var(--b-text)' : '#fff';
        const idleBorder = maritime
          ? 'rgba(11, 27, 46, 0.22)'
          : `color-mix(in oklch, ${accent} 35%, transparent)`;
        return (
          <button
            key={c.id}
            type="button"
            className={'city-chip' + (active ? ' active' : '')}
            aria-pressed={active}
            onClick={() => onChange(c.id)}
            style={{
              padding: pad,
              fontSize,
              '--chip-border': dirA ? 'var(--a-rule)' : 'var(--b-rule)',
              '--chip-bg': dirA ? '#fff' : 'rgba(255,255,255,0.04)',
              '--chip-color': dirA ? 'var(--a-text-2)' : 'var(--b-text-2)',
              '--chip-active-bg': active ? activeBg : undefined,
              '--chip-active-border': activeBorder,
              '--chip-active-color': activeColor,
              borderColor: !active ? idleBorder : activeBorder,
            }}
          >
            <span
              className="city-chip-dot"
              style={{ background: active && maritime ? 'var(--b-teal)' : accent }}
              aria-hidden="true"
            />
            {c.flag} {c.label}
          </button>
        );
      })}
    </div>
  );
}

function CvDiffGrid({ direction, highlightCity }) {
  const dirA = direction === 'a';
  if (!window.AdM_CITIES) return null;
  const cityIds = ['dublin', 'london', 'berlin'];

  return (
    <div className="cv-diff-grid">
      {cityIds.map((id) => {
        const meta = window.AdM_CITIES.byId[id];
        const block = window.AdM_CITIES.cvDiffTips[id];
        const accent = dirA ? meta.color : meta.colorB;
        const highlighted = highlightCity === id;
        return (
          <div
            key={id}
            className="cv-diff-card"
            style={{
              '--diff-accent': accent,
              '--diff-border': highlighted
                ? accent
                : (dirA ? 'var(--a-rule)' : 'var(--b-rule)'),
              '--diff-bg': highlighted
                ? (dirA ? '#fff' : 'rgba(255,255,255,0.04)')
                : (dirA ? '#fff' : 'rgba(255,255,255,0.02)'),
              '--diff-text': dirA ? 'var(--a-text-2)' : 'var(--b-text-2)',
              boxShadow: highlighted ? `0 0 0 1px ${accent}` : 'none',
            }}
          >
            <h3><span aria-hidden="true">{meta.flag}</span> {block.title}</h3>
            {block.tips.map((tip) => (
              <div key={tip} className="cv-diff-item">{tip}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { SAMPLE_PERSONAS, TARGET_COUNTRIES, INDUSTRIES, Wave, StarMark, SiteHeader, Brand, useToast, CityChips, CvDiffGrid });
