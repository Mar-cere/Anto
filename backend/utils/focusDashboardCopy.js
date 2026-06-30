/**
 * Textos del panel "foco actual" (#34) en es/en.
 */

export function normalizeFocusLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

export function focusLocale(language) {
  return normalizeFocusLanguage(language) === 'en' ? 'en-US' : 'es-ES';
}

const COPY = {
  es: {
    chatContinuityHeadline: 'Continuidad del chat',
    chatResumeDefault: 'Tu conversación sigue en el chat, en privado.',
    chatResumeRecent: 'Hubo actividad reciente en el chat.',
    chatResumeOneDay: 'Última actividad en el chat: hace un día.',
    chatResumeDays: (days) => `Última actividad en el chat: hace ${days} días.`,
    resumeLastChat: 'Retoma tu última conversación',
    startConversation: 'Empieza una conversación',
    startConversationSub: 'Un mensaje corto ya es un buen primer paso.',
    nextTask: (title) => `Próxima tarea: ${title}`,
    dueOn: (date) => `Vence el ${date}`,
    habit: (title) => `Hábito: ${title}`,
    reminderAround: (time) => `Recordatorio hacia las ${time}`,
    scheduledReminder: 'Recordatorio programado',
    scheduledReminderMorning: 'Recordatorio programado (mañana)',
    scheduledReminderEvening: 'Recordatorio programado (tarde-noche)',
    activeFollowUp: (tool) => `Seguimiento activo: ${tool}`,
    focusProtocol: (line) =>
      `Con lo que has estado trabajando: ${line} ¿Qué micro-paso encaja hoy?`,
    focusNoChatWeek:
      'Esta semana aún no escribiste en el chat. Un mensaje corto ya es un buen primer paso.',
    focusSparseActivity:
      'Hay poca actividad esta semana: volver al chat unos minutos suele ayudar a mantener el ritmo.',
    focusNextTask: (title) =>
      `Próximo foco práctico: “${title}”. Puedes avanzar un poco hoy o ajustar la fecha si hace falta.`,
    focusCommitment: (c) =>
      `Recordatorio suave de tu foco: “${c}”. ¿Qué micro-paso encaja hoy?`,
    focusResumeOrCheckIn:
      'Puedes retomar tu última conversación o contar en una frase cómo llegas hoy.',
    focusDefaultChoice:
      'Hoy puedes elegir: una línea en el chat, un avance pequeño en tareas o registrar un hábito.',
    lastSessionSnippetFallback: 'Puedes retomar el hilo en el chat cuando quieras.',
    lastSessionPlaceholderBridge:
      'Esta charla fue breve. Cuando quieras puedes seguir en el chat; no hace falta guardar mucho detalle.',
    lastSessionPlaceholderSnippet: 'Charla breve — sigue cuando quieras.',
    lastSessionMismatchFallback:
      'Abre tu última conversación para retomar donde lo dejaste.',
    lastSessionRecentActivitySnippet:
      'Hubo actividad reciente en el chat. Puedes retomar el hilo cuando quieras.',
    lastSessionRecentUserPrefix: 'Compartiste hace poco: «',
    lastSessionRecentUserSuffix: '»',
    llmFocusSystem:
      'Eres guía de producto para bienestar. Redacta en español neutro y natural: tono cotidiano y amable, comprensible en cualquier país hispanohablante; sin voseo ni localismos marcados, sin jerga clínica ni tono publicitario, sin imperativos duros ni listas. Suena a persona, no a anuncio ni informe. Devuelve UNA sola línea (máx. 260 caracteres), cálida, sin diagnosticar, sin mencionar PHQ/GAD como enfermedad. Prioriza retorno al chat si hay baja actividad; si hay tarea próxima, menciónala sin presión. No cites texto del usuario ni extractos del chat. No cierres con pregunta. No uses emojis.',
    llmFocusUserSuffix:
      'Escribe solo la línea final, sin prefijos ni comillas: debe sonar humana, breve y con registro neutro.',
    llmFocusSparseHint:
      ' Actividad muy baja: una o dos frases cortas, invitación sin culpa; puede mencionar empezar o retomar el chat y una razón humana y no comercial (ordenar ideas, sentirse acompañado o acompañada), sin prometer curación ni diagnosticar.',
    llmFocusProtocolHint:
      ' Si hay protocolHintFromRecord, intégralo como micro-paso en lenguaje natural y neutro; si no hay, sugiere un siguiente paso suave sin inventar historial clínico.'
  },
  en: {
    chatContinuityHeadline: 'Chat continuity',
    chatResumeDefault: 'Your conversation is still in chat, privately.',
    chatResumeRecent: 'There was recent activity in chat.',
    chatResumeOneDay: 'Last chat activity: one day ago.',
    chatResumeDays: (days) => `Last chat activity: ${days} days ago.`,
    resumeLastChat: 'Resume your last conversation',
    startConversation: 'Start a conversation',
    startConversationSub: 'A short message is a good first step.',
    nextTask: (title) => `Next task: ${title}`,
    dueOn: (date) => `Due ${date}`,
    habit: (title) => `Habit: ${title}`,
    reminderAround: (time) => `Reminder around ${time}`,
    scheduledReminder: 'Scheduled reminder',
    scheduledReminderMorning: 'Scheduled reminder (morning)',
    scheduledReminderEvening: 'Scheduled reminder (evening)',
    activeFollowUp: (tool) => `Active follow-up: ${tool}`,
    focusProtocol: (line) =>
      `With what you have been working on: ${line}. What small step fits today?`,
    focusNoChatWeek:
      'You have not written in chat this week yet. A short message is a good first step.',
    focusSparseActivity:
      'There has been little activity this week: a few minutes back in chat often helps keep the rhythm.',
    focusNextTask: (title) =>
      `Next practical focus: “${title}”. You can move it forward a little today or adjust the date if needed.`,
    focusCommitment: (c) =>
      `A gentle reminder of your focus: “${c}”. What small step fits today?`,
    focusResumeOrCheckIn:
      'You can pick up your last conversation or share in one line how you are feeling today.',
    focusDefaultChoice:
      'Today you can choose: one line in chat, a small step on tasks, or logging a habit.',
    lastSessionSnippetFallback: 'You can pick up the thread in chat whenever you want.',
    lastSessionPlaceholderBridge:
      'This chat was brief. You can continue in chat whenever you want; no need to hold on to every detail.',
    lastSessionPlaceholderSnippet: 'Brief chat — continue whenever you want.',
    lastSessionMismatchFallback:
      'Open your last conversation to continue where you left off.',
    lastSessionRecentActivitySnippet:
      'There was recent activity in chat. You can pick up the thread whenever you want.',
    lastSessionRecentUserPrefix: 'You recently shared: "',
    lastSessionRecentUserSuffix: '"',
    llmFocusSystem:
      'You are a wellbeing product guide. Write in neutral, natural English: everyday, friendly tone; no heavy clinical jargon or marketing voice; no harsh imperatives or bullet lists. Sound human, not like an ad or report. Return ONE line only (max 260 characters), warm, no diagnosing, do not mention PHQ/GAD as illness. Prioritize returning to chat when activity is low; if there is an upcoming task, mention it without pressure. Do not quote user text or chat excerpts. Do not end with a question. No emojis.',
    llmFocusUserSuffix:
      'Write only the final line, no prefixes or quotes: it should feel human, brief, and neutral.',
    llmFocusSparseHint:
      ' Very low activity: one or two short sentences, invitation without guilt; may mention starting or returning to chat for a human, non-commercial reason (sorting thoughts, feeling accompanied), without promising cure or diagnosing.',
    llmFocusProtocolHint:
      ' If protocolHintFromRecord is present, weave it in as a natural micro-step; otherwise suggest a gentle next step without inventing clinical history.'
  }
};

export function focusCopy(language) {
  return COPY[normalizeFocusLanguage(language)];
}

/** Etiqueta del slot de push rutinario (mañana / tarde-noche) según idioma. */
export function routinePushSlotLabel(kind, language = 'es') {
  const c = focusCopy(language);
  if (kind === 'morning') return c.scheduledReminderMorning;
  if (kind === 'evening') return c.scheduledReminderEvening;
  return c.scheduledReminder;
}

/**
 * Días calendario entre dos instantes (misma zona; IANA si se pasa timeZone).
 * @param {Date|string|number} fromDate
 * @param {Date|string|number} toDate
 * @param {string} [timeZone]
 */
export function calendarDaysBetweenInTz(fromDate, toDate, timeZone) {
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit' };
  if (timeZone && typeof timeZone === 'string' && timeZone.trim()) {
    opts.timeZone = timeZone.trim();
  }
  const fmt = new Intl.DateTimeFormat('en-CA', opts);
  const dayKey = (d) => {
    const [y, m, day] = fmt.format(new Date(d)).split('-').map((x) => Number(x));
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((dayKey(toDate) - dayKey(fromDate)) / 86400000);
}

/**
 * Sustituto de "Hoy"/"Today" al inicio del snippet según cuándo terminó la sesión.
 * @param {number} daysAgo días calendario entre sesión y ahora (0 = mismo día)
 * @param {'es'|'en'} language
 */
export function relativeSessionDayOpener(daysAgo, language = 'es') {
  const lang = normalizeFocusLanguage(language);
  if (daysAgo <= 0) return lang === 'en' ? 'Today' : 'Hoy';
  if (daysAgo === 1) return lang === 'en' ? 'Yesterday' : 'Ayer';
  return lang === 'en' ? `${daysAgo} days ago` : `Hace ${daysAgo} días`;
}

/**
 * Corrige "Hoy"/"Today" al inicio cuando el resumen es de otra fecha (p. ej. snippet generado hace semanas).
 */
export function fixContinuationTemporalOpeners(
  text,
  sessionReferenceAt,
  language = 'es',
  now = new Date(),
  timeZone
) {
  if (!text || typeof text !== 'string' || !sessionReferenceAt) return text;
  const days = calendarDaysBetweenInTz(sessionReferenceAt, now, timeZone);
  if (days <= 0) return text;
  const replacement = relativeSessionDayOpener(days, language);
  const lang = normalizeFocusLanguage(language);
  if (lang === 'en') {
    return text.replace(/^Today\b/i, replacement);
  }
  return text.replace(/^Hoy\b/i, replacement);
}

export function looksLikeSpanishText(text) {
  if (!text || typeof text !== 'string') return false;
  if (/[áéíóúñ¿¡]/iu.test(text)) return true;
  return /\b(hoy|ayer|cuando|quieras|charla|pod[eé]s|tareas|semana|hace|d[ií]as|continuar|retomar|[uú]ltima|planificaste|organizando)\b/i.test(
    text
  );
}

/**
 * Ajusta continuidad del chat al idioma solicitado (resúmenes legacy pueden estar en español).
 * @param {object|null} summary
 * @param {'es'|'en'} language
 * @param {{ now?: Date, timezone?: string }} [opts]
 */
export function localizeLastSessionSummaryForDisplay(summary, language = 'es', opts = {}) {
  if (!summary) return null;
  const lang = normalizeFocusLanguage(language);
  const c = focusCopy(lang);
  const storedLang = summary.language === 'en' ? 'en' : 'es';
  const now = opts.now instanceof Date ? opts.now : new Date();
  const timezone = opts.timezone;
  let snippet = typeof summary.snippet === 'string' ? summary.snippet : '';
  let bridge = typeof summary.bridge === 'string' ? summary.bridge : '';

  if (summary.placeholder === true && !summary.recentActivityPending) {
    snippet = c.lastSessionPlaceholderSnippet;
    bridge = c.lastSessionPlaceholderBridge;
  } else if (summary.recentActivityPending === true && snippet) {
    const sessionRef = summary.sessionEndedAt || summary.generatedAt;
    if (sessionRef) {
      snippet = fixContinuationTemporalOpeners(snippet, sessionRef, lang, now, timezone);
    }
  } else if (lang !== storedLang && lang === 'en' && looksLikeSpanishText(snippet)) {
    snippet = c.lastSessionMismatchFallback;
    if (looksLikeSpanishText(bridge)) {
      bridge = c.lastSessionMismatchFallback;
    }
  } else {
    const sessionRef = summary.sessionEndedAt || summary.generatedAt;
    if (sessionRef) {
      snippet = fixContinuationTemporalOpeners(snippet, sessionRef, lang, now, timezone);
      bridge = fixContinuationTemporalOpeners(bridge, sessionRef, lang, now, timezone);
    }
  }

  return {
    ...summary,
    snippet,
    bridge,
    headline: c.chatContinuityHeadline
  };
}

export function getLastSessionDisplayText(lastSession) {
  if (!lastSession) return '';
  const snippet = String(lastSession.snippet || '').trim();
  const bridge = String(lastSession.bridge || '').trim();
  if (lastSession.placeholder && bridge) return bridge;
  if (snippet) return snippet;
  return bridge;
}

export function hasChatContinuityDisplayText(lastSession) {
  return Boolean(getLastSessionDisplayText(lastSession));
}

/** Oculta líneas de foco genéricas al chat cuando ya hay continuidad específica. */
export function shouldSuppressFocusLineForContinuity(line, language = 'es') {
  const text = String(line || '').trim();
  if (!text) return false;
  const c = focusCopy(language);
  const needles = [
    c.focusResumeOrCheckIn,
    c.focusNoChatWeek,
    c.focusSparseActivity,
    c.resumeLastChat,
    c.startConversation,
  ]
    .map((s) => String(s || '').trim().toLowerCase())
    .filter((s) => s.length >= 12);
  const lower = text.toLowerCase();
  if (needles.some((n) => lower.includes(n.slice(0, Math.min(24, n.length))))) return true;
  return /retomar tu [uú]ltima conversaci[oó]n|resume your last conversation|volver al chat|return to chat/i.test(
    text,
  );
}
