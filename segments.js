// Segmentation: auto-detect from job title + 7 fallback cards.
// Used by form to adapt question schema and feed segment context into the prompt.

window.AdM_SEGMENTS = {
  tech: {
    id: 'tech',
    label: 'Tecnologia / Digital',
    icon: '💻',
    description: 'UX, dev, produto, dados, design',
    keywords: ['ux', 'ui', 'dev', 'desenvolved', 'programad', 'engenheiro de software', 'engenheiro de dados', 'cientista de dados', 'product manager', 'gerente de produto', 'analista de produto', 'designer', 'data analyst', 'data scientist', 'frontend', 'backend', 'fullstack', 'mobile', 'devops', 'qa', 'tester', 'tech lead', 'cto', 'arquiteto de software', 'analista de sistemas', 'analista de dados'],
    questions: ['tools', 'scope', 'outcomes'],
    focus: 'tools, systems, scale, product impact',
  },
  trades: {
    id: 'trades',
    label: 'Construção / Manutenção',
    icon: '🛠',
    description: 'Eletricista, encanador, pedreiro, mecânico',
    keywords: ['eletricista', 'encanador', 'pedreiro', 'mecânico', 'mecanico', 'pintor', 'carpinteiro', 'marceneiro', 'soldador', 'serralheiro', 'técnico de manutenção', 'tecnico de manutencao', 'construção', 'construcao', 'obras', 'instalad'],
    questions: ['certifications', 'workTypes', 'tools'],
    focus: 'certifications, safety standards, types of work',
  },
  healthcare: {
    id: 'healthcare',
    label: 'Saúde',
    icon: '🏥',
    description: 'Enfermagem, cuidador, técnico em saúde',
    keywords: ['enfermeir', 'cuidador', 'técnico de enfermagem', 'tecnico de enfermagem', 'auxiliar de enfermagem', 'fisioterapeut', 'farmacêutic', 'farmaceutic', 'nutricionist', 'psicólog', 'psicolog', 'médic', 'medic', 'dentist', 'biomédic', 'biomedic', 'radiolog'],
    questions: ['certifications', 'patientLoad', 'specialty'],
    focus: 'certifications, patient care, regulatory compliance',
  },
  education: {
    id: 'education',
    label: 'Educação',
    icon: '🎓',
    description: 'Professor, auxiliar, pedagogo',
    keywords: ['professor', 'professora', 'pedagog', 'educador', 'auxiliar de classe', 'monitor', 'tutor', 'instrutor', 'coordenador pedagógic', 'coordenador pedagogic'],
    questions: ['ageGroup', 'subjects', 'certifications'],
    focus: 'student outcomes, age groups, methodologies',
  },
  service: {
    id: 'service',
    label: 'Atendimento / Varejo',
    icon: '🛍',
    description: 'Hotelaria, vendas, atendimento',
    keywords: ['atendente', 'vendedor', 'vendedora', 'caixa', 'recepcionist', 'garçon', 'garcon', 'garçonet', 'cozinheir', 'auxiliar de cozinha', 'camareir', 'barista', 'balconist', 'consultor de vendas', 'representante', 'sac', 'call center', 'telemarketing', 'farmacêutico de balcão', 'drogaria'],
    questions: ['volume', 'tools', 'outcomes'],
    focus: 'customer volume, satisfaction, sales targets',
  },
  admin: {
    id: 'admin',
    label: 'Administrativo / Negócios',
    icon: '📊',
    description: 'Finanças, RH, operações, escritório',
    keywords: ['analista financeir', 'contador', 'contadora', 'auxiliar administrativ', 'assistente administrativ', 'rh', 'recursos humanos', 'recrutador', 'analista de rh', 'controller', 'auditor', 'analista contábil', 'analista contabil', 'office', 'secretári', 'secretaria executiva', 'analista de operações', 'analista de operacoes', 'compras', 'logística', 'logistica', 'supply chain'],
    questions: ['scope', 'tools', 'outcomes'],
    focus: 'process improvement, cost reduction, compliance',
  },
  selfemployed: {
    id: 'selfemployed',
    label: 'Autônomo / Beleza',
    icon: '✂️',
    description: 'Cabeleireiro, manicure, freelancer',
    keywords: ['cabeleireir', 'manicure', 'pedicure', 'esteticist', 'maquiador', 'maquiadora', 'barbeir', 'massagist', 'designer de sobrancelhas', 'autônom', 'autonom', 'freelancer', 'mei', 'microempreendedor', 'tatuad', 'fotógraf', 'fotograf'],
    questions: ['clientBase', 'services', 'revenue'],
    focus: 'clientele, service portfolio, revenue',
  },
};

// Auto-detect segment from a free-text job title.
// Returns segment id or null if unclear.
window.AdM_DETECT_SEGMENT = function(title) {
  if (!title) return null;
  const t = title.toLowerCase().trim();
  for (const seg of Object.values(window.AdM_SEGMENTS)) {
    for (const kw of seg.keywords) {
      if (t.includes(kw)) return seg.id;
    }
  }
  return null;
};

// Per-segment question schemas (replace the optional expander fields).
window.AdM_SEGMENT_FIELDS = {
  tech: [
    { id: 'tools', label: 'Ferramentas e linguagens', placeholder: 'Ex: React, Python, Figma, SQL, Jira' },
    { id: 'scope', label: 'Tamanho do time / escopo', placeholder: 'Ex: time de 8 pessoas, 3 squads' },
    { id: 'outcomes', label: 'O que você entregou ou melhorou', textarea: true, placeholder: 'Ex: lancei 2 features, reduzi tempo de build, refiz fluxo de checkout' },
  ],
  trades: [
    { id: 'certifications', label: 'Certificações / NRs que você tem', placeholder: 'Ex: NR-10, NR-35, curso técnico SENAI' },
    { id: 'workTypes', label: 'Tipos de obra ou serviço', placeholder: 'Ex: residencial, predial, industrial' },
    { id: 'tools', label: 'Ferramentas e equipamentos que usa', placeholder: 'Ex: multímetro, alicate amperímetro, soldadora' },
    { id: 'outcomes', label: 'Trabalhos de destaque (opcional)', textarea: true, placeholder: 'Ex: instalei rede elétrica em prédio comercial de 4 andares, reformei 30+ residências' },
  ],
  healthcare: [
    { id: 'certifications', label: 'Registro profissional / cursos', placeholder: 'Ex: COREN-SP 123456, curso de UTI' },
    { id: 'specialty', label: 'Especialidade ou setor', placeholder: 'Ex: pediatria, UTI adulto, home care' },
    { id: 'patientLoad', label: 'Volume / contexto de atendimento', placeholder: 'Ex: 12 leitos por turno, atendimento domiciliar' },
    { id: 'outcomes', label: 'Responsabilidades específicas (opcional)', textarea: true, placeholder: 'Ex: medicação, curativos, supervisão de auxiliares' },
  ],
  education: [
    { id: 'ageGroup', label: 'Faixa etária / nível', placeholder: 'Ex: ensino fundamental I, ensino médio, EJA' },
    { id: 'subjects', label: 'Disciplinas ou áreas', placeholder: 'Ex: matemática, alfabetização, inglês' },
    { id: 'certifications', label: 'Formação e certificações', placeholder: 'Ex: licenciatura em Letras, especialização em educação inclusiva' },
    { id: 'outcomes', label: 'Resultados ou projetos (opcional)', textarea: true, placeholder: 'Ex: melhorei desempenho em leitura, criei projeto interdisciplinar' },
  ],
  service: [
    { id: 'volume', label: 'Volume de atendimento', placeholder: 'Ex: 80 clientes por dia, 200 chamados por semana' },
    { id: 'tools', label: 'Sistemas / ferramentas', placeholder: 'Ex: PDV, CRM, sistema de reservas' },
    { id: 'outcomes', label: 'Conquistas (opcional)', textarea: true, placeholder: 'Ex: prêmio de melhor atendente 2x, bati meta de vendas' },
  ],
  admin: [
    { id: 'scope', label: 'Time / escopo', placeholder: 'Ex: time de 5 pessoas, 200 colaboradores atendidos' },
    { id: 'tools', label: 'Sistemas e ferramentas', placeholder: 'Ex: SAP, Excel avançado, TOTVS, Power BI' },
    { id: 'outcomes', label: 'Processos ou números que você melhorou', textarea: true, placeholder: 'Ex: reduzi erros em folha de pagamento, automatizei conciliação bancária' },
  ],
  selfemployed: [
    { id: 'clientBase', label: 'Sua clientela', placeholder: 'Ex: 60 clientes ativos, atendimento em domicílio' },
    { id: 'services', label: 'Serviços que oferece', placeholder: 'Ex: corte, coloração, alongamento, manicure' },
    { id: 'revenue', label: 'Faixa de faturamento (opcional)', placeholder: 'Ex: R$ 8.000/mês, 3 anos de salão próprio' },
    { id: 'outcomes', label: 'Diferenciais (opcional)', textarea: true, placeholder: 'Ex: especialista em cabelo crespo, atendo casamentos' },
  ],
};
