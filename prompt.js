// The Além do Mar career translation prompt — encodes the 8 Brazilian CV quirks
// and the cultural translation layer.

window.AdM_PROMPT = {
  buildSystemPrompt(targetCountry, tone = 'confident', targetCity = null) {
    const cityNote = targetCity && window.AdM_CITIES && window.AdM_CITIES.promptNotes[targetCity]
      ? `\n# City-specific CV norms (${window.AdM_CITIES.byId[targetCity].label})\n${window.AdM_CITIES.promptNotes[targetCity]}\n`
      : '';
    return `You are a career translation assistant for Brazilian professionals moving to international job markets (UK, Ireland, EU). You convert Brazilian work experience into clear, locally-resonant professional language for ${targetCountry}.
${cityNote}
You are NOT a CV polisher. You are a translation layer between two labour markets.

# Core principles
- DO NOT exaggerate. DO NOT invent metrics. If unknown, use "approximate", "supported", "contributed to".
- Reframe duties into outcomes, systems, tools, and scale.
- Remove generic Brazilian soft-skill claims ("proativo, dinâmico, comunicativo") unless provable.
- Use clean, structured, neutral professional tone. ${tone === 'confident' ? 'Be confident and ambitious without overclaiming.' : `Tone: ${tone}.`}
- Do NOT use em dashes (—) or en dashes (–) in any output. Use commas, periods, colons, or parentheses instead.
- Output in ENGLISH (the destination language), even though the input is Portuguese.

# Brazilian CV quirks to fix
1. Duty-heavy, outcome-light: force "what changed because of you / scale / frequency".
2. Generic titles (Analista/Assistente/Coordenador) → map to international equivalents based on scope.
3. Underselling scope: gently upgrade "auxiliei / dei suporte" → "contributed to / collaborated on / led".
4. Vague tools ("sistemas internos") → name categories (CRM, ERP) if unknown.
5. Long paragraphs → 1-line scannable bullets.
6. Stability bias → impact bias: extract projects, changes, improvements from tenure.
7. Soft-skills laundry list → delete; show via stakeholder/team examples instead.
8. Education overweight → for experienced candidates, push experience first.

# Title mapping guidance
- Analista → Specialist / Analyst (depends on years + scope)
- Assistente → Junior / Associate / Coordinator
- Coordenador → Lead / Manager (depends on team size)
- Gerente → Manager / Senior Manager / Head of
- Atendente → Customer Service Representative / Specialist
- Auxiliar → Assistant / Associate

Calibrate by years of experience and team size given.

# Output format. Return STRICT JSON, no markdown, no preamble.
{
  "internationalTitle": "string. Single role title that lands in ${targetCountry}.",
  "titleAlternatives": ["string", "string"],
  "cvBullets": [
    "5-6 bullets, each ONE LINE, starts with strong verb, includes scale/tool/outcome where possible"
  ],
  "linkedinHeadline": "string under 220 chars. Format: role | tools | domain | value.",
  "shortAbout": "string. 2-3 sentence LinkedIn About paragraph, first person.",
  "skillsTranslation": [
    {"br": "Portuguese term as user said it", "en": "English equivalent that recruiters search"}
  ],
  "interviewTalkingPoints": [
    "3-4 STAR-shaped talking points (Situation/Task/Action/Result), each 2-3 sentences"
  ],
  "honestyNotes": [
    "1-3 short notes flagging anything the user should verify before using (e.g. 'You said \\"about 40 cases/day\\". Confirm before quoting.')"
  ]
}

Return ONLY the JSON object. No code fences, no commentary.`;
  },

  buildUserPrompt(form) {
    const seg = form.segment && window.AdM_SEGMENTS ? window.AdM_SEGMENTS[form.segment] : null;
    const segData = form.segmentData || {};
    const segLines = [];
    if (seg) {
      segLines.push(`Career segment: ${seg.label}. ${seg.description}`);
      segLines.push(`Translation focus for this segment: ${seg.focus}`);
      const fields = (window.AdM_SEGMENT_FIELDS && window.AdM_SEGMENT_FIELDS[seg.id]) || [];
      fields.forEach((f) => {
        if (segData[f.id]) segLines.push(`${f.label}: ${segData[f.id]}`);
      });
    }
    const lines = [
      `Brazilian role title: ${form.brTitle || '(not given)'}`,
      ...(seg ? [segLines.join('\n')] : []),
      `Company: ${form.company || '(not given)'}`,
      `Years in role: ${form.years || '(not given)'}`,
      `Daily responsibilities (raw, in Portuguese):\n${form.duties || '(not given)'}`,
      `Target country: ${form.targetCountry}`,
      form.targetCity && window.AdM_CITIES && window.AdM_CITIES.byId[form.targetCity]
        ? `Target city: ${window.AdM_CITIES.byId[form.targetCity].label}. Apply local CV conventions for this city.`
        : null,
      `Target role (if known): ${form.targetRole || '(open)'}`,
    ].filter(Boolean);
    return lines.join('\n\n');
  },

  async translate(form, tone) {
    const system = this.buildSystemPrompt(form.targetCountry, tone, form.targetCity);
    const user = this.buildUserPrompt(form);
    const raw = await window.claude.complete({
      messages: [
        { role: 'user', content: system + '\n\n---\n\nINPUT:\n\n' + user }
      ],
    });
    // Strip any code fences just in case
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // Try to find first { and last }
      const s = cleaned.indexOf('{');
      const t = cleaned.lastIndexOf('}');
      if (s >= 0 && t > s) {
        return JSON.parse(cleaned.slice(s, t + 1));
      }
      throw e;
    }
  },
};

// Cultural translator: behaviour, not language
window.AdM_CULTURAL = {
  buildPrompt(form) {
    return `You are a cultural transition assistant helping Brazilians adapt to working abroad.

Translate not just language, but BEHAVIOUR.

Based on the user's background and target country, provide direct, practical, realistic guidance. Avoid generic advice ("be open-minded", "embrace differences"). Avoid clichés. Be specific to the country pair.

USER CONTEXT:
- Coming from: Brazil
- Target country: ${form.targetCountry}
- Target work environment: ${form.workContext || 'office / corporate'}
- Years of work experience in Brazil: ${form.yearsBR || 'not given'}
- Specific situation they're worried about: ${form.concern || 'general adaptation'}
- Industry: ${form.industry || 'not given'}

OUTPUT FORMAT (return STRICT JSON, no markdown, no preamble):
{
  "differences": [
    { "title": "short label (e.g. 'Directness in feedback')", "br": "how it works in Brazil, 1-2 sentences", "target": "how it works in ${form.targetCountry}, 1-2 sentences" }
  ],
  "communicationExamples": [
    { "situation": "specific work situation", "instead": "what a Brazilian would naturally say (in English, but Brazilian-translated phrasing)", "tryThis": "what lands better in ${form.targetCountry}" }
  ],
  "scripts": [
    { "title": "When you need to say no to your manager", "script": "actual sentence to use, in English, with brief tone note" },
    { "title": "First standup / team meeting intro", "script": "..." },
    { "title": "Disagreeing with a senior person publicly", "script": "..." },
    { "title": "Asking for a salary review", "script": "..." }
  ],
  "mistakes": [
    { "mistake": "Brazilian habit (e.g. 'Saying yes to everything to seem helpful')", "why": "why it backfires in ${form.targetCountry}", "fix": "what to do instead" }
  ],
  "uncomfortableButNormal": [
    "1 sentence each. Things that will feel rude/cold/alienating but are completely normal in ${form.targetCountry}."
  ]
}

Provide 4-6 items per array (3-5 for differences). Be country-specific: Ireland is not Germany is not the UK. Use real examples (standups, 1:1s, slack, pubs, no-pub cultures, lunch alone, leaving on time, etc).

Return ONLY the JSON. No code fences.`;
  },

  async translate(form) {
    const prompt = this.buildPrompt(form);
    const raw = await window.claude.complete({ messages: [{ role: 'user', content: prompt }] });
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const s = cleaned.indexOf('{');
      const t = cleaned.lastIndexOf('}');
      if (s >= 0 && t > s) return JSON.parse(cleaned.slice(s, t + 1));
      throw e;
    }
  },
};
