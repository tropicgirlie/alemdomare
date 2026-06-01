// Reviewers — "Em breve" page with two inbound signups:
//   1. Reviewer application form (for recruiters/coaches who want to be listed)
//   2. User waitlist form (for users who want to be notified when it's live)
// Both submit via mailto: to the founder's inbox — zero backend required.
// When 3+ real reviewers are signed up, swap this page for the directory grid
// (the original implementation is preserved in git history).

const INBOX_EMAIL = 'info@alemdomar.com';

function buildReviewerMailto(form) {
  const subject = `Candidatura para revisor Além do Mar: ${form.name || 'sem nome'}`;
  const lines = [
    `Nome: ${form.name}`,
    `E-mail: ${form.email}`,
    `Cargo atual: ${form.title}`,
    `País / Cidade: ${form.location}`,
    `Idiomas: ${form.languages}`,
    `Especialidades: ${form.specialties}`,
    `Link de agendamento ou LinkedIn: ${form.link}`,
    `Preço por revisão (e moeda): ${form.price}`,
    `Sobre você: ${form.about}`,
    '',
    'Enviado pelo formulário "Quer ser revisor?" do Além do Mar',
  ];
  return `mailto:${INBOX_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function buildWaitlistMailto(email, role) {
  const subject = 'Quero ser avisado(a) quando os revisores estiverem disponíveis';
  const body = [
    `E-mail: ${email}`,
    `Perfil: ${role || 'não informado'}`,
    '',
    'Me avise quando a lista de revisores estiver no ar.',
    '',
    'Enviado pelo formulário de aviso do Além do Mar',
  ].join('\n');
  return `mailto:${INBOX_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Country → flag map for the preview card.
const COUNTRY_FLAGS = {
  'Portugal': '🇵🇹', 'Irlanda': '🇮🇪', 'Ireland': '🇮🇪',
  'Reino Unido': '🇬🇧', 'Inglaterra': '🇬🇧', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
  'Alemanha': '🇩🇪', 'Germany': '🇩🇪',
  'Holanda': '🇳🇱', 'Países Baixos': '🇳🇱', 'Netherlands': '🇳🇱',
  'Espanha': '🇪🇸', 'Spain': '🇪🇸',
  'França': '🇫🇷', 'France': '🇫🇷',
  'Itália': '🇮🇹', 'Italy': '🇮🇹',
  'Bélgica': '🇧🇪', 'Belgium': '🇧🇪',
  'Suíça': '🇨🇭', 'Switzerland': '🇨🇭',
  'Áustria': '🇦🇹', 'Austria': '🇦🇹',
  'Suécia': '🇸🇪', 'Dinamarca': '🇩🇰', 'Noruega': '🇳🇴', 'Finlândia': '🇫🇮',
};

// Fallback exemplo — what the card looks like before the applicant types.
// Each field falls back to this if the applicant's form input is empty,
// so the preview always shows a fully-finished, realistic card.
const EXAMPLE_REVIEWER = {
  name: 'Camila Andrade',
  title: 'Tech recruiter sênior',
  location: 'Lisboa, Portugal',
  languages: 'PT-BR, PT-PT, EN',
  specialties: 'CV para tech, Visto D2, Entrevistas em inglês',
  bio: 'Ex-recruiter na Talkdesk. Revisa CVs pensando em ATS e cultura europeia. Especialista em transição de devs brasileiros pra Portugal.',
  price: '€80 por revisão · resposta em 48h',
  avatar: 'https://i.pravatar.cc/200?img=47',
};

function buildPreviewReviewer(form) {
  // Merge form input over the example — applicant's text wins, blanks fall back.
  const merged = {
    name: form.name || EXAMPLE_REVIEWER.name,
    title: form.title || EXAMPLE_REVIEWER.title,
    location: form.location || EXAMPLE_REVIEWER.location,
    languages: form.languages || EXAMPLE_REVIEWER.languages,
    specialties: form.specialties || EXAMPLE_REVIEWER.specialties,
    bio: form.about || EXAMPLE_REVIEWER.bio,
    price: form.price || EXAMPLE_REVIEWER.price,
  };

  const parts = merged.location.split(',').map((s) => s.trim()).filter(Boolean);
  const city = parts[0] || '';
  const country = parts[1] || parts[0] || '';
  const flag = COUNTRY_FLAGS[country] || '🌍';
  const languages = merged.languages.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
  const specialties = merged.specialties.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

  // Avatar: once the applicant types a name, switch to dicebear initials
  // (so they see their own initials, not Camila's photo). Otherwise show the example photo.
  const avatar = form.name
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name.trim())}`
    : EXAMPLE_REVIEWER.avatar;

  // Track which fields the applicant has filled — used to label "exemplo" vs "seu"
  const filled = {
    name: !!form.name, title: !!form.title, location: !!form.location,
    languages: !!form.languages, specialties: !!form.specialties,
    bio: !!form.about, price: !!form.price,
  };
  const filledCount = Object.values(filled).filter(Boolean).length;

  return {
    name: merged.name,
    title: merged.title,
    city, country, countryFlag: flag,
    languages, specialties,
    bio: merged.bio,
    price: merged.price,
    avatar,
    filled,
    filledCount,
  };
}

function ReviewerCardPreview({ reviewer, direction }) {
  const dirA = direction === 'a';
  const muted = dirA ? 'var(--a-text-2)' : 'var(--b-text-2)';
  const ruleColor = dirA ? 'var(--a-rule)' : 'var(--b-rule)';
  const tagBg = dirA ? 'rgba(42,157,143,0.08)' : 'rgba(212,175,55,0.10)';
  const tagBorder = dirA ? 'rgba(42,157,143,0.2)' : 'rgba(212,175,55,0.25)';
  const tagColor = dirA ? 'var(--a-teal)' : 'var(--b-gold)';

  // Badge copy adapts based on how much the applicant has filled.
  let badge;
  if (reviewer.filledCount === 0) badge = 'Exemplo · um perfil real fica assim';
  else if (reviewer.filledCount < 7) badge = 'Preview · seu perfil tomando forma';
  else badge = 'Preview · seu perfil completo';

  return (
    <article
      style={{
        background: dirA ? 'var(--a-bg)' : 'var(--b-bg)',
        border: `1px solid ${ruleColor}`,
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        boxShadow: dirA ? '0 1px 3px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{
        position: 'absolute', top: -10, right: 16,
        padding: '3px 12px', borderRadius: 999,
        fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
        background: dirA ? '#fff' : '#0a0a0a',
        color: tagColor, border: `1px solid ${tagBorder}`,
      }}>
        {badge}
      </div>

      <header style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <img
          src={reviewer.avatar}
          alt={reviewer.name}
          width={56}
          height={56}
          style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: tagBg }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 500 }}>
            {reviewer.name}
          </h4>
          <div style={{ fontSize: 13, color: muted }}>
            {reviewer.title}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
        <span>{reviewer.countryFlag} {[reviewer.city, reviewer.country].filter(Boolean).join(', ')}</span>
        {reviewer.languages.length > 0 && (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{reviewer.languages.join(' / ')}</span>
          </>
        )}
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: muted }}>
        {reviewer.bio}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {reviewer.specialties.map((s, i) => (
          <span
            key={i}
            style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 999,
              background: tagBg, color: tagColor, border: `1px solid ${tagBorder}`,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <footer
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${ruleColor}`,
        }}
      >
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500 }}>
          {reviewer.price}
        </div>
        <span
          className="btn btn-primary btn-card-cta"
          style={{ opacity: 0.7, cursor: 'not-allowed' }}
          aria-disabled="true"
        >
          Entrar em contato
        </span>
      </footer>
    </article>
  );
}

function ReviewerApplicationForm({ direction }) {
  const dirA = direction === 'a';
  const [form, setForm] = React.useState({
    name: '', email: '', title: '', location: '', languages: '',
    specialties: '', link: '', price: '', about: '',
  });
  const [submitted, setSubmitted] = React.useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (window.AdM_TRACK) window.AdM_TRACK.track('reviewer_applied', { country: form.location });
    window.location.href = buildReviewerMailto(form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}>
          Quase lá. Confirme o envio no seu e-mail
        </h3>
        <p style={{ fontSize: 14, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: 0 }}>
          Abrimos seu cliente de e-mail com a candidatura preenchida.
          Confirme o envio e a gente responde em até 5 dias úteis.
        </p>
      </div>
    );
  }

  const preview = buildPreviewReviewer(form);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Nome completo *" value={form.name} onChange={update('name')} required direction={direction} />
        <FormField label="E-mail *" type="email" value={form.email} onChange={update('email')} required direction={direction} />
        <FormField label="Cargo atual *" value={form.title} onChange={update('title')} placeholder="Ex: Tech recruiter sênior, Career coach" required direction={direction} />
        <FormField label="País e cidade *" value={form.location} onChange={update('location')} placeholder="Ex: Lisboa, Portugal" required direction={direction} />
        <FormField label="Idiomas *" value={form.languages} onChange={update('languages')} placeholder="Ex: PT-BR, EN, DE" required direction={direction} />
        <FormField label="Especialidades *" value={form.specialties} onChange={update('specialties')} placeholder="Ex: CV para tech, Visto D2, Lebenslauf alemão" required direction={direction} />
        <FormField label="LinkedIn ou Calendly *" value={form.link} onChange={update('link')} placeholder="https://" required direction={direction} />
        <FormField label="Preço por revisão" value={form.price} onChange={update('price')} placeholder="Ex: €80 por CV, ou R$ 250 por sessão de 1h" direction={direction} />
        <FormField label="Sobre você (2-3 linhas)" type="textarea" value={form.about} onChange={update('about')} placeholder="Ex: Trabalhei 7 anos contratando em..." direction={direction} />
        <button type="submit" className="btn btn-primary" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
          Enviar candidatura →
        </button>
        <p style={{ fontSize: 12, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: 0, lineHeight: 1.5 }}>
          Vamos abrir seu app de e-mail com a mensagem já preenchida.
          Você confirma o envio antes de mandar.
        </p>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>
        <ReviewerCardPreview reviewer={preview} direction={direction} />
        <p style={{ fontSize: 12, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: 0, textAlign: 'center', opacity: 0.85, lineHeight: 1.5 }}>
          {preview.filledCount === 0
            ? 'Esse é um exemplo de como o seu card vai aparecer. Comece a preencher pra ver o seu se formando.'
            : 'A foto fica com suas iniciais por padrão. Você pode mandar uma foto profissional junto com a candidatura.'}
        </p>
      </div>
    </div>
  );
}

function WaitlistForm({ direction }) {
  const dirA = direction === 'a';
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (window.AdM_TRACK) window.AdM_TRACK.track('waitlist_submitted', { role });
    window.location.href = buildWaitlistMailto(email, role);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}>
          Confirme o envio no seu e-mail
        </h3>
        <p style={{ fontSize: 14, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: 0 }}>
          A gente te avisa assim que os primeiros revisores estiverem listados.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FormField
        label="Seu e-mail *"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="voce@exemplo.com"
        required
        direction={direction}
      />
      <FormField
        label="Está procurando o quê?"
        type="select"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={[
          { value: '', label: 'Selecione...' },
          { value: 'cv-review', label: 'Revisão do meu CV' },
          { value: 'interview-coaching', label: 'Coaching de entrevistas' },
          { value: 'career-strategy', label: 'Estratégia de carreira' },
          { value: 'visa-help', label: 'Orientação sobre vistos' },
          { value: 'other', label: 'Outro' },
        ]}
        direction={direction}
      />
      <button type="submit" className="btn btn-primary" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
        Me avisa quando estiver no ar 🔔
      </button>
      <p style={{ fontSize: 12, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: 0, lineHeight: 1.5 }}>
        Sem spam. Só te avisamos quando houver revisores reais disponíveis.
      </p>
    </form>
  );
}

function FormField({ label, type = 'text', value, onChange, placeholder, required, options, direction }) {
  const dirA = direction === 'a';
  const baseStyle = {
    padding: '10px 12px',
    fontSize: 14,
    borderRadius: 8,
    border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
    background: dirA ? 'var(--a-bg)' : 'var(--b-bg)',
    color: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)' }}>
        {label}
      </span>
      {type === 'textarea' ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} required={required} rows={3} style={baseStyle} />
      ) : type === 'select' ? (
        <select value={value} onChange={onChange} style={baseStyle}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={baseStyle} />
      )}
    </label>
  );
}

function FormCard({ children, badge, title, subtitle, direction }) {
  const dirA = direction === 'a';
  return (
    <div
      style={{
        background: dirA ? 'var(--a-bg)' : 'var(--b-bg)',
        border: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
        borderRadius: 16,
        padding: 28,
      }}
    >
      <div
        style={{
          display: 'inline-block', padding: '4px 12px', borderRadius: 999,
          fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
          background: dirA ? 'rgba(42,157,143,0.10)' : 'rgba(212,175,55,0.12)',
          color: dirA ? 'var(--a-teal)' : 'var(--b-gold)',
          marginBottom: 12,
        }}
      >
        {badge}
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 500, margin: '0 0 8px', lineHeight: 1.15 }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', margin: '0 0 24px' }}>
        {subtitle}
      </p>
      {children}
    </div>
  );
}

function Reviewers({ direction, onBack }) {
  const dirA = direction === 'a';

  const Header = window.SiteHeader;

  return (
    <>
      {Header && (
        <Header label="Revisores">
          <Brand direction="b" size="lg" />
          <button type="button" className="adm-nav-link" onClick={onBack} style={{ marginLeft: 'auto' }}>
            ← Voltar ao início
          </button>
        </Header>
      )}
    <div className="wrap" style={{ paddingBottom: 80 }}>

      {/* Hero */}
      <header style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
            background: dirA ? 'rgba(42,157,143,0.10)' : 'rgba(212,175,55,0.12)',
            color: dirA ? 'var(--a-teal)' : 'var(--b-gold)',
            marginBottom: 16,
          }}
        >
          <span>🚧</span>
          <span>Em breve teremos</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 5vw, 52px)',
            letterSpacing: '-0.02em', fontWeight: 400, margin: '0 0 16px', lineHeight: 1.05,
            maxWidth: 760,
          }}
        >
          Revisores humanos pra olhar seu CV, <em style={{ color: dirA ? 'var(--a-teal)' : 'var(--b-gold)' }}>chegando em breve</em>.
        </h1>
        <p
          style={{
            fontSize: 17, lineHeight: 1.55,
            color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)',
            maxWidth: 640, margin: 0,
          }}
        >
          Estamos montando uma rede curada de recruiters, coaches e headhunters que já contrataram
          brasileiros no exterior. A IA aqui te guia. Eles validam, refinam e dão o toque final.
        </p>
      </header>

      {/* Reviewer application — full width with form + live preview side by side */}
      <section style={{ marginBottom: 24 }}>
        <FormCard
          direction={direction}
          badge="Para revisores"
          title="Quer ser revisor?"
          subtitle="Você é recruiter, headhunter, career coach ou HR que ajuda brasileiros no exterior? Veja como seu perfil vai aparecer enquanto preenche."
        >
          <ReviewerApplicationForm direction={direction} />
        </FormCard>
      </section>

      {/* Waitlist — narrower, below */}
      <section style={{ marginBottom: 48, maxWidth: 560 }}>
        <FormCard
          direction={direction}
          badge="Para usuários"
          title="Quer ser avisado?"
          subtitle="Vai precisar de uma revisão humana? Te avisamos por e-mail assim que os primeiros revisores entrarem."
        >
          <WaitlistForm direction={direction} />
        </FormCard>
      </section>

      {/* How it'll work */}
      <section
        style={{
          padding: '32px 0',
          borderTop: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
          borderBottom: `1px solid ${dirA ? 'var(--a-rule)' : 'var(--b-rule)'}`,
          marginBottom: 32,
        }}
      >
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, margin: '0 0 20px' }}>
          Como vai funcionar
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, fontSize: 14, lineHeight: 1.55 }}>
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>1.</div>
            <strong>Lista curada, não marketplace.</strong>
            <div style={{ color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', marginTop: 4 }}>
              A gente entrevista cada revisor antes de listar. Sem cadastro automático.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>2.</div>
            <strong>Contato direto.</strong>
            <div style={{ color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', marginTop: 4 }}>
              Você fala com o revisor por e-mail ou Calendly. Sem intermediação, sem comissão.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>3.</div>
            <strong>Preço transparente.</strong>
            <div style={{ color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)', marginTop: 4 }}>
              Cada revisor define o próprio preço e prazo. Sem taxa escondida.
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section
        style={{
          padding: 24, borderRadius: 16,
          background: dirA ? 'rgba(42,157,143,0.05)' : 'rgba(212,175,55,0.06)',
          border: `1px dashed ${dirA ? 'rgba(42,157,143,0.2)' : 'rgba(212,175,55,0.25)'}`,
          fontSize: 14, lineHeight: 1.6,
          color: dirA ? 'var(--a-text-2)' : 'var(--b-text-2)',
        }}
      >
        <strong style={{ color: dirA ? 'var(--a-text)' : 'var(--b-text)' }}>Importante.</strong>{' '}
        Guia com IA para ajudar na busca inicial de emprego, sem grandes gastos. A revisão humana
        é indicada, mas muitos aplicam só com a ajuda da IA.
      </section>
    </div>
    </>
  );
}

window.Reviewers = Reviewers;
