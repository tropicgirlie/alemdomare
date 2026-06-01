// City-first UX: Dublin, Londres, Berlim — colors, country mapping, CV norms, education copy.

(function () {
  const LS_KEY = 'adm_preferred_city';

  const CITIES = [
    {
      id: 'dublin',
      label: 'Dublin',
      flag: '🇮🇪',
      country: 'Ireland',
      color: '#0f5c8f',
      colorB: '#4a9fd4',
    },
    {
      id: 'london',
      label: 'Londres',
      flag: '🇬🇧',
      country: 'United Kingdom',
      color: '#5e2d8c',
      colorB: '#a97ed4',
    },
    {
      id: 'berlin',
      label: 'Berlim',
      flag: '🇩🇪',
      country: 'Germany',
      color: '#c0392b',
      colorB: '#e87070',
    },
  ];

  const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));

  const cvDiffTips = {
    dublin: {
      title: 'Dublin (Irlanda)',
      tips: [
        '2 páginas máximo, começando com Profile Summary',
        'Sem foto. Pode causar viés inconsciente.',
        'Sem data de nascimento ou estado civil',
        'Foco em conquistas com métricas quantificadas',
        'Cover letter costuma ser esperada. Enderece o recrutador pelo nome',
        'Palavras-chave da job description no CV',
      ],
    },
    london: {
      title: 'Londres (UK)',
      tips: [
        '1 a 2 páginas em A4, sem fotos',
        'Personal statement de 3 linhas no topo',
        'UK English, não americano ("colour", "organisation")',
        'Sem referências no CV (apenas "upon request")',
        'Verbos de ação fortes: "Delivered", "Led", "Achieved"',
        'LinkedIn URL sempre incluída',
      ],
    },
    berlin: {
      title: 'Berlim (Alemanha)',
      tips: [
        'Lebenslauf: formato tabular com datas à esquerda',
        'Foto profissional 4,5×6 cm esperada (canto superior direito)',
        'Data de nascimento e nacionalidade incluídas',
        'Assinatura manuscrita digitalizada no final',
        'Nível de alemão obrigatório (mesmo que iniciante A1)',
        'Sem lacunas: explique cada período sem emprego',
      ],
    },
  };

  const promptNotes = {
    dublin: 'Ireland/Dublin norms: no photo, no DOB, 2-page max, Profile Summary at top, achievements with metrics, references on request.',
    london: 'UK/London norms: no photo, UK English spelling, personal statement, strong action verbs, LinkedIn URL, references upon request.',
    berlin: 'Germany/Berlin Lebenslauf norms: tabular dates-left format, professional photo expected, DOB and nationality, language levels (CEFR), signature block, explain employment gaps.',
  };

  function getPreferred() {
    const id = localStorage.getItem(LS_KEY);
    return byId[id] ? id : 'dublin';
  }

  function setPreferred(id) {
    if (byId[id]) localStorage.setItem(LS_KEY, id);
  }

  function countryForCity(id) {
    return byId[id] ? byId[id].country : 'Ireland';
  }

  window.AdM_CITIES = {
    list: CITIES,
    byId,
    cvDiffTips,
    promptNotes,
    getPreferred,
    setPreferred,
    countryForCity,
  };
})();
