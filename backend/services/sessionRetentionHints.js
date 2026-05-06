/**
 * Señales heurísticas para cierres con continuidad (retorno a segunda sesión / conversación).
 * No sustituye análisis clínico; orienta el tono del system prompt.
 */

const SNIPPET_MAX_CHARS = 1250;
const SNIPPET_COUNT_CAP = 500_000;

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
 * @param {unknown} raw
 * @returns {number|null} entero 1–10 o null si no es usable
 */
export function coerceEmotionalIntensity01to10(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(1, Math.min(10, Math.round(raw)));
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.max(1, Math.min(10, Math.round(n)));
  }
  return null;
}

/**
 * @param {number} n
 * @param {number} cap
 * @returns {number}
 */
function clampNonNegativeIntForSnippet(n, cap) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x) || x < 0) return 0;
  return Math.min(x, cap);
}

/**
 * Trunca sin partir una viñeta a medias cuando es posible.
 * @param {string} out
 * @param {number} max
 * @returns {string}
 */
function truncateRetentionSnippet(out, max) {
  if (out.length <= max) return out;
  let cut = out.slice(0, max - 1);
  const lastNl = cut.lastIndexOf('\n');
  if (lastNl > Math.floor(max * 0.55)) {
    cut = cut.slice(0, lastNl);
  }
  return `${cut}…`;
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
  const limitNum = Number(threadMessageLimit);
  const threadLimitSafe =
    Number.isFinite(limitNum) && limitNum >= 1 ? Math.min(Math.floor(limitNum), SNIPPET_COUNT_CAP) : 100;
  // Umbral un poco antes que antes: muchos usuarios salen si el hilo no “aterriza” a mitad de conversación.
  const longSession = userTurnCount >= 5 || totalMessages >= 10;
  const nearThreadLimit = totalMessages >= Math.max(threadLimitSafe - 8, 1);

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
    threadMessageLimit: threadLimitSafe,
    likelyFarewell,
    nearThreadLimit,
    longSession,
    suggestFirstTimeExpectation,
    suggestBridgeClosing,
    suggestFatigueClosing,
    suggestCheckpointPause,
    suggestReturningUserWarmOpen,
    suggestThematicMicroClosure: false
  };
}

/**
 * Indica si la intensidad emocional registrada en mensajes previos del usuario bajó de forma clara.
 * @param {Array<{ role?: string, metadata?: { context?: { emotional?: { intensity?: number } } } }>} conversationHistoryNewestFirst
 * @returns {boolean}
 */
export function detectEmotionalIntensityWindDown(conversationHistoryNewestFirst) {
  const msgs = Array.isArray(conversationHistoryNewestFirst) ? conversationHistoryNewestFirst : [];
  const chronological = [...msgs].reverse();
  const intensities = [];
  for (const m of chronological) {
    if (m.role !== 'user') continue;
    const coerced = coerceEmotionalIntensity01to10(m.metadata?.context?.emotional?.intensity);
    if (coerced === null) continue;
    intensities.push(coerced);
  }
  if (intensities.length < 2) return false;
  const last = intensities[intensities.length - 1];
  const prevMax = Math.max(...intensities.slice(0, -1));
  return prevMax - last >= 2 || (prevMax >= 8 && last <= 6);
}

/**
 * @param {Array<{ role?: string, metadata?: object }>} conversationHistoryNewestFirst
 * @returns {boolean}
 */
export function historyHasUserEmotionalIntensity(conversationHistoryNewestFirst) {
  const msgs = Array.isArray(conversationHistoryNewestFirst) ? conversationHistoryNewestFirst : [];
  return msgs.some(
    (m) => m.role === 'user' && coerceEmotionalIntensity01to10(m.metadata?.context?.emotional?.intensity) !== null
  );
}

/**
 * Añade suggestThematicMicroClosure cuando la fase es "settled" y el hilo ya es sustantivo (#103).
 * @param {object} payload - resultado de buildSessionRetentionPayload
 * @param {{ sessionPhase?: string, conversationHistoryNewestFirst?: Array }} opts
 * @returns {object}
 */
export function withThematicMicroClosureRetention(payload, { sessionPhase, conversationHistoryNewestFirst = [] } = {}) {
  const base = payload && typeof payload === 'object' ? payload : {};
  const phaseNorm = typeof sessionPhase === 'string' ? sessionPhase.trim() : '';
  if (base.likelyFarewell || phaseNorm !== 'settled') {
    return { ...base, suggestThematicMicroClosure: false };
  }
  // Evitar duplicar instrucciones de cierre cuando ya aplica cierre por fatiga (#103 vs hilo largo).
  if (base.suggestFatigueClosing === true) {
    return { ...base, suggestThematicMicroClosure: false };
  }
  const userTurnCount = Math.floor(Number(base.userTurnCount ?? 0));
  const totalMessages = Math.floor(Number(base.totalMessages ?? 0));
  if (!Number.isFinite(userTurnCount) || !Number.isFinite(totalMessages) || userTurnCount < 4 || totalMessages < 8) {
    return { ...base, suggestThematicMicroClosure: false };
  }
  const windDown = detectEmotionalIntensityWindDown(conversationHistoryNewestFirst);
  const hasIntensity = historyHasUserEmotionalIntensity(conversationHistoryNewestFirst);
  const substantiveWithoutSeries =
    !hasIntensity && (userTurnCount >= 6 || (userTurnCount >= 5 && totalMessages >= 12));
  const suggestThematicMicroClosure = windDown || substantiveWithoutSeries;
  return { ...base, suggestThematicMicroClosure };
}

/**
 * Texto a añadir al system prompt (vacío si no aplica nada).
 * @param {object|null|undefined} payload - resultado de buildSessionRetentionPayload
 * @param {{ sessionPhase?: string }} [options] - en fase `acute` se omiten cierres reflexivos (seguridad primero).
 * @returns {string}
 */
export function buildSessionRetentionSystemSnippet(payload, options = {}) {
  if (!payload) return '';
  const phaseNorm = typeof options.sessionPhase === 'string' ? options.sessionPhase.trim() : '';
  const acute = phaseNorm === 'acute';

  const effective = acute
    ? {
        ...payload,
        suggestReturningUserWarmOpen: false,
        suggestFirstTimeExpectation: false,
        suggestCheckpointPause: false,
        suggestThematicMicroClosure: false,
        suggestBridgeClosing: false,
        suggestFatigueClosing: false
      }
    : payload;

  const lines = [];

  if (effective.likelyFarewell) {
    lines.push(
      '- **Este mensaje suena a despedida o cierre.** Responde con calidez breve. No abras menú de opciones nuevas ni insistas en ejercicios. Puedes agradecer lo compartido, opcionalmente una frase que recoja lo central, y un **puente** natural ("cuando quieras seguimos con…", "aquí estaré cuando vuelvas"). Sin culpa por no escribir antes.'
    );
  }

  if (effective.suggestReturningUserWarmOpen) {
    lines.push(
      '- **Usuario con conversaciones previas y hilo recién empezado:** si encaja, tono de “bienvenida de vuelta” **muy ligero**; puedes ofrecer **retomar** lo pendiente o preguntar cómo va **sin asumir** ni hacer inventario. Si MEMORIA o el mensaje ya traen tema nuevo, prioriza eso y no fuerces el enlace al pasado.'
    );
  }

  if (effective.nearThreadLimit && !effective.likelyFarewell) {
    const totalSafe = clampNonNegativeIntForSnippet(effective.totalMessages, SNIPPET_COUNT_CAP);
    const limitSafe = clampNonNegativeIntForSnippet(effective.threadMessageLimit, SNIPPET_COUNT_CAP);
    lines.push(
      `- El hilo va largo (unos ${totalSafe} mensajes; el límite del chat es ~${limitSafe}). Si encaja, menciona con naturalidad que puede **abrir un chat nuevo** en la app para seguir con frescura antes de llegar al tope.`
    );
  }

  if (effective.suggestFirstTimeExpectation) {
    lines.push(
      '- **Posible primera conversación en la app:** solo si encaja **de forma orgánica** (p. ej. al cerrar un tema o si el usuario abre la puerta). Como mucho **media frase** opcional: que a veces retomar otro día ayuda; sin insistir en volver, sin promesas ni “deberes”. Si no encaja, omítelo.'
    );
  }

  if (effective.suggestCheckpointPause) {
    lines.push(
      '- **Varias preguntas seguidas tuyas (asistente):** este turno **prioriza** **sintetizar en 1–2 frases** lo esencial, validar, y **cerrar el impulso de “seguir interrogando”**: como mucho **ninguna** pregunta o una **muy** corta. Si encaja, **pausa explícita** (“si quieres lo dejamos aquí un rato”) para que el tramo no se sienta interminable. No cierres el chat en nombre del usuario.'
    );
  }

  if (effective.suggestThematicMicroClosure) {
    lines.push(
      '- **La carga emocional o temática parece más baja ahora:** es un buen momento para **aterrizar el tramo**: **una** reflexión breve en prosa (qué parece que la persona se lleva o qué quedó nombrado) y, solo si fluye, **un único paso pequeño** o puente al próximo contacto. **No** hace falta otra pregunta amplia “para seguir”; evita reabrir todo el tema. Sin listas numeradas ni menú. Hábitos o tareas de la app solo si ya encajan con lo hablado y las reglas de propuestas de producto.'
    );
  }

  if (effective.suggestBridgeClosing) {
    lines.push(
      '- **Varios turnos ya compartidos:** si encaja, orienta **cierre suave con sensación de “esto avanzó”**: validación breve, **una frase que una lo central**, y puente para retomar (“cuando quieras seguimos con…”). Puede ser **conclusión del tramo sin pregunta final** si el mensaje del usuario ya cerró el giro. No menú de opciones ni lista de tareas.'
    );
  }

  if (effective.suggestFatigueClosing) {
    lines.push(
      '- **Hilo ya largo:** **prioriza** dejar **sensación de cierre de tramo**: mini-síntesis en prosa, qué quedó en el centro, y puerta de regreso clara; evita reabrir con preguntas amplias. Solo si falta un dato puntual, **una** pregunta muy acotada. Sin temas nuevos ni más carga.'
    );
  }

  if (lines.length === 0) return '';

  const header = acute
    ? '\n\n### Sesión y retorno (breve)\n' +
      '- **Prioridad de seguridad:** no orientes aquí cierre reflexivo del tramo, pausas terapéuticas ni “aterrizaje” salvo **despedida clara** del usuario o **límite técnico** del hilo en la viñeta correspondiente.\n'
    : '\n\n### Sesión y retorno\n' +
      '- El chat **sigue disponible**; tú no decides que la persona deba irse.\n' +
      '- Muchas personas necesitan **sentir que el tramo tuvo una conclusión** (aunque sea breve) para volver con claridad; un hilo que solo “sigue abierto” sin ningún aterrizaje puede cansar y **desincentivar** una nueva conversación. Cuando encaje, ayuda a **aterrizar**: síntesis mínima, qué quedó claro, y **permite pausa** o “seguimos cuando quieras” **sin** otra pregunta amplia solo por hábito.\n' +
      '- Las viñetas siguientes marcan **cuándo** ese cierre natural encaja; si no aplica, sigue como hasta ahora.';

  const out = header + '\n' + lines.join('\n');
  return truncateRetentionSnippet(out, SNIPPET_MAX_CHARS);
}
