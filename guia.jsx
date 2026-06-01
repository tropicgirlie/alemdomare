// Guia gratuito, lead magnet for "Carreira no exterior".
// Later: add the PDF at assets/carreira-no-exterior.pdf and set GUIDE_PDF_READY = true.

const GUIDE_INBOX_EMAIL = 'info@alemdomar.com';
const GUIDE_PDF_URL = 'assets/carreira-no-exterior.pdf';
const GUIDE_COVER_URL = 'assets/bookcoveralem.png';
const GUIDE_PDF_READY = false;

function buildGuideMailto(email, stage) {
  const subject = 'Quero receber o guia gratuito Carreira no exterior';
  const body = [
    `E-mail: ${email}`,
    `Momento atual: ${stage || 'não informado'}`,
    '',
    'Quero receber o guia gratuito Carreira no exterior quando o PDF estiver disponível.',
    '',
    'Enviado pela página do guia gratuito do Além do Mar',
  ].join('\n');
  return `mailto:${GUIDE_INBOX_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function BookCoverPreview({ compact = false }) {
  const [imageFailed, setImageFailed] = React.useState(false);

  if (!imageFailed) {
    return (
      <figure className={compact ? 'book-cover-image book-cover-image-compact' : 'book-cover-image'}>
        <img
          src={GUIDE_COVER_URL}
          alt="Capa do guia gratuito Carreira no exterior, por Luana Pacheco"
          loading={compact ? 'lazy' : 'eager'}
          onError={() => setImageFailed(true)}
        />
      </figure>
    );
  }

  return (
    <figure className={compact ? 'book-cover book-cover-compact' : 'book-cover'} aria-label="Capa do guia Carreira no exterior">
      <div className="book-cover-top">
        <div className="book-cover-logo-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <div className="book-cover-brand">ALEM DO MAR</div>
          <div className="book-cover-club">BOOK CLUB</div>
        </div>
        <div className="book-cover-badge">Guia<br />gratuito</div>
      </div>

      <div className="book-cover-title">
        Carreira<br />
        <em>no exterior</em>
      </div>
      <div className="book-cover-subtitle">
        Como jogar o jogo das oportunidades quando você muda de país
      </div>
      <div className="book-cover-author">Por <strong>Luana Pacheco</strong></div>

      <div className="book-cover-wave" aria-hidden="true">
        <div className="book-cover-sun" />
      </div>
      <div className="book-cover-road" aria-hidden="true" />

      <div className="book-cover-steps" aria-hidden="true">
        <span>CV</span>
        <span>LinkedIn</span>
        <span>Entrevistas</span>
        <span>Networking</span>
        <span>Salário</span>
        <span>Mudança</span>
      </div>

      <figcaption className="book-cover-caption">
        Estratégia. Propósito. Novos horizontes.
      </figcaption>
    </figure>
  );
}

function GuideSignupForm({ direction }) {
  const [email, setEmail] = React.useState('');
  const [stage, setStage] = React.useState('planejando');
  const [submitted, setSubmitted] = React.useState(false);
  const muted = direction === 'a' ? 'var(--a-text-2)' : 'var(--b-text-2)';

  const submit = (e) => {
    e.preventDefault();
    if (window.AdM_TRACK) window.AdM_TRACK.track('guide_requested', { stage });
    window.location.href = buildGuideMailto(email, stage);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="guide-card guide-success" role="status">
        <div className="guide-success-icon">✉️</div>
        <h3>Quase lá. Confirme o envio no seu e-mail</h3>
        <p>Seu aplicativo de e-mail abriu com a mensagem preenchida. Envie para entrar na lista do guia gratuito.</p>
      </div>
    );
  }

  return (
    <form className="guide-card guide-form" onSubmit={submit}>
      <div>
        <div className="eyebrow">Receber o PDF</div>
        <h3>Entre na lista do guia gratuito.</h3>
        <p>Quando o PDF estiver pronto, você recebe o link. Sem promessa mágica, sem funil infinito.</p>
      </div>

      <label className="guide-field">
        <span>E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
        />
      </label>

      <label className="guide-field">
        <span>Onde você está na jornada?</span>
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="planejando">Ainda no Brasil, planejando sair</option>
          <option value="mudando">Com mudança marcada</option>
          <option value="recem-cheguei">Já cheguei e estou procurando trabalho</option>
          <option value="morando-fora">Já moro fora e quero crescer</option>
        </select>
      </label>

      <button type="submit" className="btn btn-primary guide-submit">
        Quero receber o guia
      </button>
      <p className="guide-form-note" style={{ color: muted }}>
        Por enquanto usamos e-mail manual. Quando o PDF entrar no site, este botão vira download direto.
      </p>
    </form>
  );
}

function Guia({ direction, onBack, onStart }) {
  const accent = direction === 'a' ? 'var(--a-teal)' : 'var(--b-gold)';
  const muted = direction === 'a' ? 'var(--a-text-2)' : 'var(--b-text-2)';

  return (
    <div className="wrap guide-page">
      <nav className="nav" style={{ marginBottom: 24 }}>
        <Brand direction="b" />
        <button type="button" onClick={onBack} className="adm-nav-link nav-text-btn">Voltar ao início</button>
      </nav>

      <section className="guide-hero">
        <div className="guide-hero-copy">
          <span className="pill"><span className="pill-dot" />Guia gratuito</span>
          <h1 className="hero-title guide-title">
            Carreira no exterior,<br />
            <em style={{ color: accent }}>antes de você jogar o jogo.</em>
          </h1>
          <p className="hero-sub guide-sub">
            Um guia gratuito para entender CV, LinkedIn, entrevistas, networking, negociação salarial e mudança de país sem precisar descobrir tudo no susto.
          </p>
          <div className="guide-actions">
            {GUIDE_PDF_READY ? (
              <a className="btn btn-primary" href={GUIDE_PDF_URL} download>
                Baixar PDF gratuito
              </a>
            ) : (
              <a className="btn btn-primary" href="#receber-guia">
                Receber quando sair
              </a>
            )}
            <button type="button" className="btn btn-ghost" onClick={onStart}>
              Testar ferramenta de CV
            </button>
          </div>
          <p className="guide-availability" style={{ color: muted }}>
            PDF em breve. A página já está preparada para o download quando você adicionar o arquivo.
          </p>
        </div>
        <BookCoverPreview />
      </section>

      <section className="guide-topics" aria-label="O que tem no guia">
        {[
          ['CV', 'O que sai, o que fica e como transformar experiência brasileira em leitura internacional.'],
          ['LinkedIn', 'Headline, sobre e palavras-chave para ser encontrado fora do Brasil.'],
          ['Entrevistas', 'Como responder sem traduzir literalmente sua trajetória.'],
          ['Networking', 'Como pedir conversa, referência e informação sem soar perdido.'],
          ['Salário', 'Como pesquisar faixa, custo de vida e margem de negociação.'],
          ['Mudança de país', 'O que muda na cabeça, no ritmo e na forma de provar valor.'],
        ].map(([title, body]) => (
          <article className="guide-topic-card" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section id="receber-guia" className="guide-form-section">
        <div>
          <div className="eyebrow">Book club</div>
          <h2 className="landing-h2">
            Primeiro o guia. Depois, <em style={{ color: accent }}>a ferramenta ajuda a executar.</em>
          </h2>
          <p className="landing-lead">
            O guia organiza a estratégia. O Além do Mar transforma uma parte disso em ação: CV, tradução cultural, ATS, entrevistas e salário.
          </p>
        </div>
        <GuideSignupForm direction={direction} />
      </section>
    </div>
  );
}

window.BookCoverPreview = BookCoverPreview;
window.Guia = Guia;
