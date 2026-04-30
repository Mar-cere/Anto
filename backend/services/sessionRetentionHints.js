/**
 * Señales heurísticas para cierres con continuidad (retorno a segunda sesión / conversación).
 * No sustituye análisis clínico; orienta el tono del system prompt.
 */

/** @type {RegExp[]} */
const LIKELY_FAREWELL_RES = [
  /\b(chau|chao|adios|adiós|hasta luego|hasta pronto|hasta mañana|nos vemos|me voy|me retiro)\b/i,
  /\b(bye|gracias por todo|gracias x todo)\b/i,
  /\b(ya está|ya estuvo|listo eso|eso es todo|no tengo más|no más por hoy)\b/i,
  /\bhablamos\s+(mañana|después|luego|pronto)\b/i,
  /\b(me despido|me tengo que ir|tengo que irme)\b/i
];

/**
 * @param {string} [content]
 * @returns {boolean}
 */
export function detectLikelyFarewell(content) {
  const t = (content || '').trim();
  if (t.length < 2) return false;
  return LIKELY_FAREWELL_RES.some((re) => re.test(t));
}

/**
 * @param {object} params
 * @param {Array<{ role?: string }>} params.conversationHistoryNewestFirst
 * @param {string} params.userContent
 * @param {number|null} [params.priorConversationCount] - conversaciones previas del usuario (excl. actual). null = desconocido (invitado).
 * @param {number} [params.threadMessageLimit]
 */
export function buildSessionRetentionPayload({
  conversationHistoryNewestFirst = [],
  userContent = '',
  priorConversationCount = null,
  threadMessageLimit = 100,
  conversationPattern = null
}) {
  const msgs = Array.isArray(conversationHistoryNewestFirst) ? conversationHistoryNewestFirst : [];
  const userTurnCount = msgs.filter((m) => m.role === 'user').length;
  const totalMessages = msgs.length;
  const likelyFarewell = detectLikelyFarewell(userContent);
  const longSession = userTurnCount >= 6 || totalMessages >= 12;
  const nearThreadLimit = totalMessages >= Math.max(threadMessageLimit - 8, 1);

  const isFirstConversationEver =
    priorConversationCount !== null && priorConversationCount !== undefined && priorConversationCount === 0;

  // Conservador: solo tras varios intercambios reales (no en los primeros turnos).
  const suggestFirstTimeExpectation =
    isFirstConversationEver &&
    !likelyFarewell &&
    userTurnCount >= 5 &&
    userTurnCount <= 6 &&
    totalMessages >= 10;

  const questionStreak = Number(conversationPattern?.questionStreakCount ?? 0);

  const suggestBridgeClosing =
    longSession &&
    !likelyFarewell &&
    !suggestFirstTimeExpectation &&
    userTurnCount >= 4 &&
    userTurnCount <= 8;

  const suggestFatigueClosing =
    userTurnCount >= 9 && !likelyFarewell && !suggestFirstTimeExpectation;

  const suggestCheckpointPause =
    !likelyFarewell &&
    !suggestFirstTimeExpectation &&
    userTurnCount >= 4 &&
    totalMessages >= 8 &&
    questionStreak >= 2;

  const isReturningUser =
    priorConversationCount !== null &&
    priorConversationCount !== undefined &&
    priorConversationCount > 0;

  // Inicio de un hilo nuevo: usuario ya usó la app antes — continuidad sin asumir ni inventariar.
  const suggestReturningUserWarmOpen =
    isReturningUser &&
    !likelyFarewell &&
    userTurnCount >= 1 &&
    userTurnCount <= 2 &&
    totalMessages <= 5;

  return {
    userTurnCount,
    totalMessages,
    priorConversationCount,
    threadMessageLimit,
    likelyFarewell,
    nearThreadLimit,
    longSession,
    suggestFirstTimeExpectation,
    suggestBridgeClosing,
    suggestFatigueClosing,
    suggestCheckpointPause,
    suggestReturningUserWarmOpen
  };
}

/**
 * Texto a añadir al system prompt (vacío si no aplica nada).
 * @param {object|null|undefined} payload - resultado de buildSessionRetentionPayload
 * @returns {string}
 */
export function buildSessionRetentionSystemSnippet(payload) {
  if (!payload) return '';
  const lines = [];

  if (payload.likelyFarewell) {
    lines.push(
      '- **Este mensaje suena a despedida o cierre.** Responde con calidez breve. No abras menú de opciones nuevas ni insistas en ejercicios. Puedes agradecer lo compartido, opcionalmente una frase que recoja lo central, y un **puente** natural ("cuando quieras seguimos con…", "aquí estaré cuando vuelvas"). Sin culpa por no escribir antes.'
    );
  }

  if (payload.suggestReturningUserWarmOpen) {
    lines.push(
      '- **Usuario con conversaciones previas y hilo recién empezado:** si encaja, tono de “bienvenida de vuelta” **muy ligero**; puedes ofrecer **retomar** lo pendiente o preguntar cómo va **sin asumir** ni hacer inventario. Si MEMORIA o el mensaje ya traen tema nuevo, prioriza eso y no fuerces el enlace al pasado.'
    );
  }

  if (payload.nearThreadLimit && !payload.likelyFarewell) {
    lines.push(
      `- El hilo va largo (unos ${payload.totalMessages} mensajes; el límite del chat es ~${payload.threadMessageLimit}). Si encaja, menciona con naturalidad que puede **abrir un chat nuevo** en la app para seguir con frescura antes de llegar al tope.`
    );
  }

  if (payload.suggestFirstTimeExpectation) {
    lines.push(
      '- **Posible primera conversación en la app:** solo si encaja **de forma orgánica** (p. ej. al cerrar un tema o si el usuario abre la puerta). Como mucho **media frase** opcional: que a veces retomar otro día ayuda; sin insistir en volver, sin promesas ni “deberes”. Si no encaja, omítelo.'
    );
  }

  if (payload.suggestCheckpointPause) {
    lines.push(
      '- **Varias preguntas seguidas tuyas (asistente):** este turno puede **sintetizar en 1–2 frases** lo esencial de lo que contó, validar, y **no añadir otra pregunta larga** (como mucho una muy corta, o ninguna). Si encaja, ofrece **pausa opcional** (“si quieres lo dejamos aquí un rato”) sin despedirte en nombre del usuario ni cerrar el chat.'
    );
  }

  if (payload.suggestBridgeClosing) {
    lines.push(
      '- **Varios turnos ya compartidos:** si encaja, puedes proponer **cierre suave con continuidad**: validación breve, **una frase que una lo central**, **tema o gesto pequeño** para retomar después (“cuando quieras seguimos con…”), o micro-compromiso opcional **una sola** cosa. No menú de opciones ni lista de tareas.'
    );
  }

  if (payload.suggestFatigueClosing) {
    lines.push(
      '- **Hilo ya largo:** alterna este turno: o **una pregunta muy acotada** o **cierre suave opcional** (mini-resumen + “aquí seguimos cuando quieras”), sin abrir temas nuevos ni sumar carga.'
    );
  }

  if (lines.length === 0) return '';

  const header =
    '\n\n### Sesión y retorno\n' +
    '- El chat **sigue abierto**. Las viñetas siguientes **no** ordenan cortar la charla: solo indican cuándo puede **encajar** ofrecer síntesis, pausa opcional o puente de retorno, **sin** empujar a irse.';

  const out = header + '\n' + lines.join('\n');
  // Blindaje: evitar inflar el system prompt por error.
  const MAX_CHARS = 900;
  if (out.length <= MAX_CHARS) return out;
  return out.slice(0, MAX_CHARS - 1) + '…';
}
