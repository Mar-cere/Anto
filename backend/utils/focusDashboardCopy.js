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
    lastSessionSnippetFallback: 'Podés retomar el hilo en el chat cuando quieras.',
    lastSessionPlaceholderBridge:
      'Esta charla fue breve. Cuando quieras podés seguir en el chat; no hace falta guardar mucho detalle.',
    lastSessionPlaceholderSnippet: 'Charla breve — seguí cuando quieras.',
    lastSessionMismatchFallback:
      'Abre tu última conversación para retomar donde lo dejaste.',
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
    activeFollowUp: (tool) => `Active follow-up: ${tool}`,
    focusProtocol: (line) =>
      `With what you have been working on: ${line} What small step fits today?`,
    focusNoChatWeek:
      'You have not written in chat this week yet. A short message is a good first step.',
    focusSparseActivity:
      'There has been little activity this week: a few minutes back in chat often helps keep the rhythm.',
    focusNextTask: (title) =>
      `Next practical focus: “${title}”. You can move it forward a little today or adjust the date if needed.`,
    focusCommitment: (c) =>
      `A gentle reminder of your focus: “${c}”. What small step fits today?`,
    focusResumeOrCheckIn:
      'You can pick up your last conversation or share in one line how you are arriving today.',
    focusDefaultChoice:
      'Today you can choose: one line in chat, a small step on tasks, or logging a habit.',
    lastSessionSnippetFallback: 'You can pick up the thread in chat whenever you want.',
    lastSessionPlaceholderBridge:
      'This chat was brief. You can continue in chat whenever you want; no need to hold on to every detail.',
    lastSessionPlaceholderSnippet: 'Brief chat — continue whenever you want.',
    lastSessionMismatchFallback:
      'Open your last conversation to pick up where you left off.',
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

/** Heurística ligera: texto guardado en español cuando el usuario pide inglés. */
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
 */
export function localizeLastSessionSummaryForDisplay(summary, language = 'es') {
  if (!summary) return null;
  const lang = normalizeFocusLanguage(language);
  const c = focusCopy(lang);
  const storedLang = summary.language === 'en' ? 'en' : 'es';
  let snippet = typeof summary.snippet === 'string' ? summary.snippet : '';
  let bridge = typeof summary.bridge === 'string' ? summary.bridge : '';

  if (summary.placeholder === true) {
    snippet = c.lastSessionPlaceholderSnippet;
    bridge = c.lastSessionPlaceholderBridge;
  } else if (lang !== storedLang && lang === 'en' && looksLikeSpanishText(snippet)) {
    snippet = c.lastSessionMismatchFallback;
    if (looksLikeSpanishText(bridge)) {
      bridge = c.lastSessionMismatchFallback;
    }
  }

  return {
    ...summary,
    snippet,
    bridge,
    headline: c.chatContinuityHeadline
  };
}
