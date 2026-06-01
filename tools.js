// Além do Mar tool registry. Each tool is a self-describing schema:
// fields[] for the form, system prompt, and a render schema for the result.
// All tools share the same Form + Result shell — adding a tool is a config edit.

window.AdM_TOOLS = {
  // ──────────────────────────────────────────
  hiring_reality: {
    id: 'hiring_reality',
    label: 'Por que sem resposta',
    eyebrow: 'Realidade do mercado',
    title: 'Por que você não está recebendo resposta',
    subtitle: 'A verdade desconfortável: quase nunca é "você não é bom o suficiente". É filtro, mismatch ou timing. Vamos descobrir qual.',
    fields: [
      { id: 'role', label: 'Cargo que você está buscando', type: 'text', required: true, placeholder: 'Product Analyst' },
      { id: 'country', label: 'País', type: 'select', options: 'countries', required: true },
      { id: 'applications', label: 'Quantas candidaturas em quanto tempo', type: 'text', placeholder: 'Ex: 80 nas últimas 6 semanas', required: true },
      { id: 'visa', label: 'Situação de visto', type: 'select', options: ['Cidadão UE / passaporte UE', 'Visto de trabalho / Stamp 1', 'Critical Skills / Tech visa', 'Visto de estudante', 'Sem visto ainda', 'Outro'], required: true },
      { id: 'experience', label: 'Anos de experiência', type: 'number', required: true },
      { id: 'cvSample', label: 'Cole 2 a 3 tópicos do seu currículo atual (opcional)', type: 'textarea', placeholder: 'Tópicos em inglês ou português. Usamos só para calibrar o tom da análise.' },
    ],
    prompt: (f) => `You are a brutally honest hiring-market analyst helping a Brazilian job-seeker understand WHY their applications aren't converting in ${f.country}.

Don't be motivational. Don't soften. Tell the uncomfortable truth, but be specific and actionable. Most candidates blame themselves; the real causes are usually structural (visa filters, ATS keyword mismatch, seniority mis-signaling, junior-coded CV language, application volume too low or too high without targeting).

INPUT:
- Target role: ${f.role}
- Country: ${f.country}
- Application volume: ${f.applications}
- Visa: ${f.visa}
- Experience: ${f.experience} years
- CV sample: ${f.cvSample || '(none provided)'}

Return STRICT JSON only:
{
  "verdict": "1 sentence honest summary of the most likely reason",
  "blockers": [
    { "blocker": "name (e.g. 'Visa filter')", "likelihood": "High|Medium|Low", "why": "1-2 sentences specific to ${f.country} and this role", "fix": "concrete next action" }
  ],
  "doThisWeek": [ "3-4 specific actions, ranked by impact" ],
  "stopDoing": [ "2-3 things they're probably doing that hurt them" ]
}`,
    render: 'hiringReality',
  },

  // ──────────────────────────────────────────
  ats_check: {
    id: 'ats_check',
    label: 'Checagem ATS',
    eyebrow: 'Vai passar do filtro?',
    title: 'Vai passar do filtro automático?',
    subtitle: 'Cole a descrição da vaga e os tópicos do seu currículo. Comparamos o vocabulário e mostramos o que falta para passar no filtro automático (ATS).',
    fields: [
      { id: 'jobDescription', label: 'Cole a descrição da vaga (em inglês)', type: 'textarea', required: true, placeholder: 'Cole a descrição inteira aqui. Quanto mais completa, melhor.', rows: 8 },
      { id: 'cvBullets', label: 'Cole os tópicos relevantes do seu currículo', type: 'textarea', required: true, placeholder: 'Cole os tópicos do cargo mais relevante.', rows: 6 },
      { id: 'targetRole', label: 'Cargo-alvo', type: 'text', required: true },
    ],
    prompt: (f) => `You are an ATS (Applicant Tracking System) optimisation analyst. Compare the user's CV bullets against a real job description and identify keyword/skill gaps that would cause filtering.

Be specific. Don't say "add more keywords". Say which keywords, where to add them, and how to phrase them honestly (no keyword-stuffing).

INPUT:
- Target role: ${f.targetRole}
- Job description:\n${f.jobDescription}
- Current CV bullets:\n${f.cvBullets}

Return STRICT JSON:
{
  "passLikelihood": "High|Medium|Low",
  "score": "0-100 number",
  "matchedKeywords": ["actual keywords from JD that appear in CV"],
  "missingCritical": [
    { "keyword": "exact phrase from JD", "why": "why it matters", "addAs": "concrete bullet rewrite using this keyword honestly" }
  ],
  "weakSignals": [
    { "issue": "junior-coded phrasing or vague language", "currentText": "quote from their CV", "suggested": "stronger version" }
  ],
  "verdict": "1-2 sentence brutal honest summary"
}`,
    render: 'atsCheck',
  },

  // ──────────────────────────────────────────
  salary_reality: {
    id: 'salary_reality',
    label: 'Salário real',
    eyebrow: 'Realidade salarial',
    title: 'O que você vale aqui (de verdade)',
    subtitle: 'Brasileiros costumam errar a mão: pedem pouco demais ou muito para o nível. Esta ferramenta calibra a faixa real para o cargo, o país e o tempo de carreira.',
    fields: [
      { id: 'role', label: 'Cargo-alvo', type: 'text', required: true, placeholder: 'Product Designer' },
      { id: 'country', label: 'País', type: 'select', options: 'countries', required: true },
      { id: 'city', label: 'Cidade (se souber)', type: 'text', placeholder: 'Dublin, Berlin, London...' },
      { id: 'experience', label: 'Anos de experiência total', type: 'number', required: true },
      { id: 'currentBR', label: 'Salário atual no Brasil (R$ por mês, opcional)', type: 'text', placeholder: 'R$ 12.000' },
    ],
    prompt: (f) => `You are a labour-market analyst giving a Brazilian candidate a brutally realistic salary picture for ${f.country}. Don't inflate. Don't quote bullshit "average" numbers. Use ranges that reflect real hiring data and are calibrated to seniority.

INPUT:
- Role: ${f.role}
- Country: ${f.country}
- City: ${f.city || 'unspecified'}
- Experience: ${f.experience} years
- Current BR salary: ${f.currentBR || 'not provided'}

Return STRICT JSON:
{
  "rangeLow": "number (annual gross, local currency)",
  "rangeMid": "number",
  "rangeHigh": "number",
  "currency": "EUR|GBP|USD etc",
  "period": "year",
  "explanation": "2-3 sentences on what drives the range (city, seniority, visa cost to employer)",
  "costOfLivingContext": "1-2 sentences on what that salary actually buys (rent, savings) in this city",
  "negotiationAdvice": [ "3 specific tactics, country-specific" ],
  "redFlags": [ "2-3 things that would signal a lowball offer for this role/level" ],
  "askThisAmount": "specific number to anchor in negotiation, with 1-sentence justification"
}`,
    render: 'salaryReality',
  },

  // ──────────────────────────────────────────
  interview_sim: {
    id: 'interview_sim',
    label: 'Simulador de entrevista',
    eyebrow: 'Treino de entrevista',
    title: 'Entrevista para esse cargo',
    subtitle: 'Perguntas que recrutadores no seu país-alvo de fato fazem para esse cargo, com estrutura de resposta esperada e correção de tom cultural.',
    fields: [
      { id: 'role', label: 'Cargo-alvo', type: 'text', required: true },
      { id: 'country', label: 'País', type: 'select', options: 'countries', required: true },
      { id: 'seniority', label: 'Nível', type: 'select', options: ['Junior', 'Mid', 'Senior', 'Lead / Manager'], required: true },
      { id: 'companyType', label: 'Tipo de empresa', type: 'select', options: ['Startup', 'Scale-up', 'Big tech', 'Empresa tradicional / corporate', 'Consultoria', 'Setor público'] },
    ],
    prompt: (f) => `You are an interview coach prepping a Brazilian candidate for a ${f.seniority} ${f.role} role at a ${f.companyType || 'typical'} company in ${f.country}.

Generate 5 interview questions that are SPECIFIC to this role, country, and seniority. Don't give generic ones. For each: show the expected answer structure (STAR or otherwise) and a cultural-tone correction (Brazilians often over-explain, under-claim, or misread directness expectations).

Country tone notes:
- Ireland: indirect, polite, collaborative, self-deprecation respected
- UK: structured, understated confidence, dry
- Germany: direct, structured, technical depth, no padding
- Netherlands: very direct, transparent, anti-hierarchy
- US: confident, outcome-led, big numbers

Return STRICT JSON:
{
  "questions": [
    {
      "question": "actual question recruiter would ask",
      "whyTheyAsk": "1 sentence on what they're really probing for",
      "structure": "expected answer shape (e.g. 'STAR with emphasis on Result')",
      "exampleAnswer": "2-3 sentence model answer in correct cultural tone",
      "brazilianMistake": "what a Brazilian candidate typically does wrong on this question",
      "fix": "how to correct it"
    }
  ],
  "toneNotes": "2-3 sentences on the overall tone they should hit in this market"
}`,
    render: 'interviewSim',
  },

  // ──────────────────────────────────────────
  say_it_better: {
    id: 'say_it_better',
    label: 'Diga melhor',
    eyebrow: 'Tradução micro',
    title: 'Diga isso melhor em inglês',
    subtitle: 'Você escreve do jeito que pensa. Recebe de volta em inglês profissional, no tom certo para o contexto.',
    fields: [
      { id: 'rough', label: 'O que você quer dizer (em português, ou em inglês mesmo que tosco)', type: 'textarea', required: true, rows: 4, placeholder: 'Ex: "oi, posso pedir um aumento? trabalho aqui há 2 anos e nunca pedi nada"' },
      { id: 'context', label: 'Para quem / em que contexto', type: 'select', options: ['E-mail para o chefe', 'Slack / mensagem rápida', 'Reunião 1:1', 'E-mail para recrutador', 'Mensagem no LinkedIn', 'Carta de apresentação', 'Reunião diária / equipe', 'Pedido formal (RH)'], required: true },
      { id: 'country', label: 'País / cultura de trabalho', type: 'select', options: 'countries' },
    ],
    prompt: (f) => `Rewrite the user's rough phrasing into professional English appropriate for ${f.context} in ${f.country}'s work culture.

Don't make it generic-corporate. Match the register: Slack messages stay short and informal, emails to managers are warm but clear, formal HR requests are structured. Adjust for cultural directness norms (Ireland softer, Germany direct, etc).

INPUT:
- Rough text: "${f.rough}"
- Context: ${f.context}
- Country: ${f.country}

Return STRICT JSON:
{
  "primary": "the best version, ready to send",
  "alternatives": [
    { "label": "More direct", "text": "..." },
    { "label": "More cautious / softer", "text": "..." }
  ],
  "notes": "1-2 sentences on what changed and why"
}`,
    render: 'sayItBetter',
  },

  // ──────────────────────────────────────────
  rejection_decoder: {
    id: 'rejection_decoder',
    label: 'Decoder de rejeição',
    eyebrow: 'Tradução de rejeição',
    title: 'O que essa rejeição realmente quer dizer',
    subtitle: 'Recrutadores europeus mascaram o motivo real com frases padrão. Aqui você descobre o que cada uma realmente quer dizer.',
    fields: [
      { id: 'message', label: 'Cole a mensagem que você recebeu', type: 'textarea', required: true, rows: 6, placeholder: '"Hi [name], thank you for your interest in the role. Unfortunately we have decided to move forward with another candidate..."' },
      { id: 'role', label: 'Cargo da vaga', type: 'text' },
      { id: 'country', label: 'País', type: 'select', options: 'countries' },
      { id: 'stage', label: 'Em que etapa veio a rejeição', type: 'select', options: ['Após aplicação (sem entrevista)', 'Após screening / RH', 'Após entrevista técnica', 'Após entrevista final', 'Após case / take-home'] },
    ],
    prompt: (f) => `You are decoding a polite rejection message for a Brazilian candidate. Recruiters use standard phrases to hide the real reason. Map common phrases to likely real meaning, calibrated to the stage of rejection.

INPUT:
- Rejection message: """${f.message}"""
- Role: ${f.role}
- Country: ${f.country}
- Stage: ${f.stage}

Return STRICT JSON:
{
  "likelyMeaning": "1-2 sentence honest read of what they're really saying",
  "phraseDecoding": [
    { "they_said": "exact phrase from the message", "really_means": "honest interpretation" }
  ],
  "wasItYou": "Did the candidate likely cause this, or is it structural? 1-2 sentences.",
  "lessons": [ "2-3 specific things to do differently next time" ],
  "responseTemplate": "optional reply they can send (asking for feedback). Only if appropriate to this stage."
}`,
    render: 'rejectionDecoder',
  },

  // ──────────────────────────────────────────
  identity_reframe: {
    id: 'identity_reframe',
    label: 'Eu me sinto perdido',
    eyebrow: 'Transição de identidade',
    title: 'Eu me sinto perdido aqui fora',
    subtitle: 'Não é fraqueza. É o que acontece quando a identidade profissional foi construída num país e precisa recomeçar em outro. Esta ferramenta ajuda a reformular o que você está sentindo.',
    fields: [
      { id: 'feeling', label: 'O que você está sentindo, em português, sem filtro', type: 'textarea', required: true, rows: 6, placeholder: 'Ex: "Eu era respeitado lá. Aqui ninguém sabe quem eu sou. Sinto que voltei pra estaca zero."' },
      { id: 'monthsAbroad', label: 'Há quanto tempo você está fora (meses)', type: 'number' },
      { id: 'country', label: 'País', type: 'select', options: 'countries' },
      { id: 'situation', label: 'Situação atual', type: 'select', options: ['Procurando primeiro emprego no exterior', 'Empregado mas em cargo abaixo do que tinha', 'Empregado em cargo equivalente', 'Empreendendo / freelancer', 'Estudando', 'Sem trabalho'] },
    ],
    prompt: (f) => `You are helping a Brazilian professional reframe an identity-transition feeling abroad. Don't be motivational. Don't be generic therapist-speak. Be specific to the migration experience: the loss of professional standing, language confidence, social network, and known cultural codes.

Validate first. Then reframe with structure. Then give one concrete next action.

INPUT:
- What they're feeling: "${f.feeling}"
- Months abroad: ${f.monthsAbroad || 'not given'}
- Country: ${f.country}
- Situation: ${f.situation}

Return STRICT JSON:
{
  "validation": "1-2 sentences naming the specific thing they're going through. Not generic. Specific to migration.",
  "whatsActuallyHappening": "2-3 sentences explaining the structural reason this feeling exists at this stage of migration (identity capital reset, status invisibility, code-switch fatigue).",
  "reframe": "1-2 sentences offering an honest reframe that doesn't deny the loss but locates it in time and context.",
  "nextAction": "ONE small concrete thing to do this week. Not 'practice gratitude'. Something specific like 'call one person from your old field in Portuguese, just to hear yourself in your language of competence'.",
  "whatNotToDo": "1-2 traps Brazilians fall into at this stage (over-comparing on LinkedIn, isolating, performing fine to family back home)."
}`,
    render: 'identityReframe',
  },

  // ──────────────────────────────────────────
  social_scripts: {
    id: 'social_scripts',
    label: 'Scripts sociais',
    eyebrow: 'Como se comportar',
    title: 'Roteiros para situações no trabalho',
    subtitle: 'Brasileiros costumam ler mal os códigos sutis do trabalho fora: conversa fiada na cozinha, discordar do chefe, sair pontualmente, recusar convite. Aqui você recebe o roteiro certo.',
    fields: [
      { id: 'situation', label: 'Qual situação você precisa navegar', type: 'select', required: true, options: ['Conversa fiada com colega que mal conheço', 'Discordar do meu gerente', 'Pedir feedback honesto', 'Recusar trabalho extra sem queimar filme', 'Dizer que não entendi (sem parecer fraco)', 'Sair pontualmente sem parecer descompromissado', 'Falar sobre salário com colega', 'Evento de networking / drinks depois do expediente', 'Pedir ajuda quando estou travado', 'Outro'] },
      { id: 'country', label: 'País', type: 'select', options: 'countries', required: true },
      { id: 'detail', label: 'Detalhe específico (opcional)', type: 'textarea', rows: 3, placeholder: 'Ex: "meu gerente é irlandês, equipe pequena, ambiente informal"' },
    ],
    prompt: (f) => `You are coaching a Brazilian professional on a specific workplace social situation in ${f.country}. Brazilians often misread subtle codes around hierarchy, directness, smalltalk, and boundary-setting. Give a concrete script, not theory.

INPUT:
- Situation: ${f.situation}
- Country: ${f.country}
- Detail: ${f.detail || 'none'}

Return STRICT JSON:
{
  "culturalContext": "2-3 sentences on what's actually expected here, why it differs from Brazilian norms",
  "script": "the actual words to say, in English, ready to use",
  "alternatives": [
    { "label": "More casual", "text": "..." },
    { "label": "More formal", "text": "..." }
  ],
  "bodyLanguage": "1-2 sentences on tone, eye contact, pace specific to this culture",
  "brazilianTrap": "the typical Brazilian mistake in this exact situation and how to avoid it",
  "whatComesNext": "what to expect from the other person and how to respond"
}`,
    render: 'socialScripts',
  },
};

// Resolve dynamic option lists
window.AdM_RESOLVE_OPTIONS = (key) => {
  if (key === 'countries') return window.TARGET_COUNTRIES;
  return key;
};
