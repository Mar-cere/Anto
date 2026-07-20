/**
 * Retención sana en primeros turnos: menos entrevista, más motivo para quedarse.
 * Cubre pregunta de capacidad de producto, síntoma fuerte y terapia/medicación ya existentes.
 */

const PRODUCT_CAPABILITY_PATTERN =
  /(?:puede\s+ser\s+para|sirve\s+para|es\s+para\s+(?:la\s+)?(?:ansiedad|estr[eé]s|angustia|depresi[oó]n)|para\s+qu[eé]\s+sirve|qu[eé]\s+puede\s+hacer\s+(?:anto|la\s+app|esto)|can\s+(?:it|this|anto)\s+help\s+with|is\s+(?:this|anto)\s+for\s+(?:anxiety|stress)|what\s+is\s+(?:this|anto)\s+for)/i;

const PROFESSIONAL_CARE_PATTERN =
  /(?:apoyo\s+psicol[oó]gic|psic[oó]log[oa]|psiquiatra|terapia|terapeuta|medicaci[oó]n|medicamentos?|pastillas|antidepresiv|ansiol[ií]tic|psychological\s+support|therapist|therapy|psychiatrist|medication|meds\b|on\s+meds)/i;

const HIGH_SYMPTOM_DISCLOSURE_PATTERN =
  /(?:ataques?\s+de\s+ansiedad|ataques?\s+de\s+p[aá]nico|angustia\s+regular(?:mente)?|casi\s+todos\s+los\s+d[ií]as|todos\s+los\s+d[ií]as|panic\s+attacks?|anxiety\s+attacks?|regular(?:ly)?\s+(?:panic|anxiety)|every\s+day|daily\s+(?:panic|anxiety|attacks?))/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isProductCapabilityQuestion(text = '') {
  return PRODUCT_CAPABILITY_PATTERN.test(String(text || ''));
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function mentionsExistingProfessionalCare(text = '') {
  return PROFESSIONAL_CARE_PATTERN.test(String(text || ''));
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isHighSymptomDisclosure(text = '') {
  return HIGH_SYMPTOM_DISCLOSURE_PATTERN.test(String(text || ''));
}

/**
 * Índice del turno de usuario actual (1-based), tolerando historial newest-first
 * que ya incluye el mensaje guardado.
 * @param {Array<{ role?: string, content?: string }>|null|undefined} history
 * @param {string} currentMessage
 * @returns {number}
 */
export function resolveUserTurnIndex(history = [], currentMessage = '') {
  const users = (Array.isArray(history) ? history : []).filter((m) => m && m.role === 'user');
  const cur = String(currentMessage || '').trim();
  if (!cur) return users.length;
  const newest = users[0] ? String(users[0].content || '').trim() : '';
  if (newest === cur) return users.length;
  return users.length + 1;
}

/**
 * Primeros ~4 turnos de usuario (incluye el actual).
 * @param {Array} history
 * @param {string} currentMessage
 * @returns {boolean}
 */
export function isEarlyConversation(history = [], currentMessage = '') {
  const turnIndex = resolveUserTurnIndex(history, currentMessage);
  return turnIndex >= 1 && turnIndex <= 4;
}

/**
 * @param {'es'|'en'} language
 * @param {{
 *   userMessage?: string,
 *   history?: Array,
 *   safetyHistory?: Array,
 *   dailyMoodCheckIn?: object|null,
 * }} [opts]
 * @returns {string}
 */
export function buildEarlyConversationRetentionSnippet(language = 'es', opts = {}) {
  const userMessage = String(opts.userMessage || '').trim();
  const history = Array.isArray(opts.safetyHistory) && opts.safetyHistory.length
    ? opts.safetyHistory
    : Array.isArray(opts.history)
      ? opts.history
      : [];
  const early = isEarlyConversation(history, userMessage);
  const productQ = isProductCapabilityQuestion(userMessage);
  const proCare = mentionsExistingProfessionalCare(userMessage);
  const highSymptom = isHighSymptomDisclosure(userMessage);
  const fromMood = Boolean(opts.dailyMoodCheckIn);

  if (!early && !productQ && !proCare && !highSymptom) {
    return '';
  }

  const en = language === 'en';

  if (en) {
    const parts = [
      '\n\n### Early conversation retention (internal)',
      'Goal: give a reason to stay — companionship and one useful move — not an intake interview.',
    ];
    if (early || fromMood) {
      parts.push(
        '- Early thread / mood bridge: brief warmth, then their story. Do **not** chain clinical checklist questions across turns.',
      );
    }
    if (productQ) {
      parts.push(
        '- Product/capability question (“is this for anxiety…?”): **one** short yes (Anto supports emotional accompaniment) + invite **their** situation. No feature catalog.',
      );
    }
    if (highSymptom) {
      parts.push(
        '- Strong symptom disclosure (e.g. regular attacks): validate + **one** soft offer (stay talking **or** a 1-min regulation invite) + **at most one** question. Prefer presence over interrogation.',
      );
    }
    if (proCare) {
      parts.push(
        '- Already in therapy/medication: affirm that base; Anto’s role is **between sessions** when intensity rises — do **not** compete with or advise on their clinician/meds.',
      );
    }
    parts.push(
      '- Anti-chain: if the previous assistant turn already asked an open question, deepen their answer — do **not** ask another broad “what happens before / did it improve / what do you notice” in the same shape.',
    );
    return parts.join('\n');
  }

  const parts = [
    '\n\n### Retención en conversación temprana (interno)',
    'Meta: dar un motivo para quedarse — compañía y un movimiento útil — no una entrevista de ingreso.',
  ];
  if (early || fromMood) {
    parts.push(
      '- Hilo temprano / puente de mood: calidez breve y luego **su** historia. **No** encadenes preguntas de checklist clínico entre turnos.',
    );
  }
  if (productQ) {
    parts.push(
      '- Pregunta de capacidad (“¿sirve / puede ser para ansiedad…?”): **una** frase breve de sí (Anto acompaña emocionalmente) + invita a **su** caso. Sin catálogo de features.',
    );
  }
  if (highSymptom) {
    parts.push(
      '- Síntoma fuerte (p. ej. ataques regulares): valida + **una** oferta suave (seguir hablando **o** invitar 1 min de regulación) + **como máximo una** pregunta. Preferir presencia a interrogatorio.',
    );
  }
  if (proCare) {
    parts.push(
      '- Ya tiene terapia/medicación: afirma esa base; el rol de Anto es **entre sesiones** cuando sube la intensidad — **no** compitas ni aconsejes sobre su profesional/fármacos.',
    );
  }
  parts.push(
    '- Anti-cadena: si el turno anterior del asistente ya hizo una pregunta abierta, profundiza su respuesta — **no** reformules otra amplia del mismo molde (“qué pasa antes / si bajó / qué notas”).',
  );
  return parts.join('\n');
}
