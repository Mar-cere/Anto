/**
 * Señales heurísticas para cierres con continuidad (retorno a segunda sesión / conversación).
 * No sustituye análisis clínico; orienta el tono del system prompt.
 */

import { MESSAGE_INTENTS } from '../constants/openai.js';

const SNIPPET_MAX_CHARS = 1250;
const SNIPPET_COUNT_CAP = 500_000;

/** Piso orientativo de turnos del usuario antes de orientar cierre de tramo (no regla rígida). */
export const CLOSURE_MIN_USER_TURNS = 7;

/** Frases de puente de cierre que no deben aparecer fuera de fase `may_close`. */
export const PREMATURE_CLOSURE_PHRASE_RES = [
  /\s*si te sirve,?\s*podemos cerrar aqu[ií] este tramo[^.?!]*[.?!]?/giu,
  /\s*si quieres,?\s*por hoy lo dejamos aqu[ií][^.?!]*[.?!]?/giu,
  /\s*podemos cerrar aqu[ií] este tramo y retomarlo[^.?!]*[.?!]?/giu,
  /\s*retomarlo cuando quieras desde este punto[^.?!]*[.?!]?/giu,
  /\s*dejamos esto por hoy y retomamos[^.?!]*[.?!]?/giu,
  /\s*if it helps,?\s*we can close this segment here[^.?!]*[.?!]?/giu,
  /\s*if you want,?\s*we can leave it here for today[^.?!]*[.?!]?/giu,
  /\s*pick (?:it|this) up whenever you want from here[^.?!]*[.?!]?/giu,
  /\s*when you(?:'re| are) ready,?\s*we can continue from here[^.?!]*[.?!]?/giu,
];

const GREETING_CHECKIN_RES =
  /^(?:hi|hello|hey|hola|buenos?\s+d[ií]as|buenas?\s+tardes|buenas?\s+noches|good\s+(?:morning|afternoon|evening|night)|howdy|yo|what(?:'s| is) up)[\s!.?]*$/iu;

const ONGOING_CRISIS_RECOVERY_RES =
  /\b(crisis de p[aá]nico|ataque de p[aá]nico|p[aá]nico|acaba de pasar|ya va (?:bajando|mejor)|respiraci[oó]n|mejorando|cediendo|en alerta|muy sacudid)\b/i;

/**
 * @param {Array<{ role?: string, content?: string }>} [conversationHistory]
 * @param {number} [limit]
 * @returns {string[]}
 */
export function extractRecentUserMessagesFromHistory(conversationHistory = [], limit = 5) {
  return (Array.isArray(conversationHistory) ? conversationHistory : [])
    .filter((m) => m?.role === 'user')
    .map((m) => String(m.content || '').trim())
    .filter(Boolean)
    .slice(-limit);
}

/**
 * @param {Array<{ role?: string, content?: string }>} [conversationHistory]
 * @param {number} [limit]
 * @returns {string[]}
 */
export function extractRecentAssistantMessagesFromHistory(conversationHistory = [], limit = 2) {
  return (Array.isArray(conversationHistory) ? conversationHistory : [])
    .filter((m) => m?.role === 'assistant')
    .map((m) => String(m.content || '').trim())
    .filter(Boolean)
    .slice(-limit);
}

/**
 * Hilo con crisis de pánico o recuperación reciente: no orientar cierre de tramo.
 * @param {string} [userMessage]
 * @param {Array<{ role?: string, content?: string }>} [conversationHistory]
 */
export function hasActiveCrisisRecoveryInThread(userMessage, conversationHistory = []) {
  const texts = [
    String(userMessage || '').trim(),
    ...extractRecentUserMessagesFromHistory(conversationHistory, 5),
  ].filter(Boolean);
  return texts.some((t) => isOngoingEmotionalShareMessage(t) || ONGOING_CRISIS_RECOVERY_RES.test(t));
}

/**
 * @param {object} [contexto]
 * @returns {boolean}
 */
export function shouldSuppressSessionClosure(contexto = {}) {
  const riskLevel = String(contexto?.crisis?.riskLevel || '').toUpperCase();
  if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') return true;

  const sessionPhase = String(contexto?.sessionPhase || '').trim();
  if (sessionPhase === 'acute' && contexto?.sessionRetention?.likelyFarewell !== true) {
    return true;
  }

  const intent = contexto?.contextual?.intencion?.tipo;
  if (intent === MESSAGE_INTENTS.CRISIS || intent === MESSAGE_INTENTS.GREETING) return true;

  if (isGreetingOrCheckInMessage(contexto?.userMessage)) return true;
  if (hasActiveCrisisRecoveryInThread(contexto?.userMessage, contexto?.conversationHistory)) {
    return true;
  }

  return false;
}

/**
 * Saludo o check-in breve: no debe orientar cierre de tramo.
 * @param {string} [content]
 * @returns {boolean}
 */
export function isGreetingOrCheckInMessage(content) {
  const t = (content || '').trim();
  if (!t || t.length > 48) return false;
  return GREETING_CHECKIN_RES.test(t);
}

/**
 * @param {'es'|'en'} language
 * @param {boolean} likelyFarewell
 * @returns {string}
 */
export function getSessionClosureBridge(language = 'es', likelyFarewell = false) {
  if (language === 'en') {
    return likelyFarewell
      ? ' If you want, we can leave it here for today; when you come back, we can pick up from this point.'
      : ' If it helps, we can close this segment here and pick it up whenever you want from this point.';
  }
  return likelyFarewell
    ? ' Si quieres, por hoy lo dejamos aquí; cuando vuelvas, retomamos desde este punto.'
    : ' Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.';
}

export function resolveLanguageFromContext(contexto = {}) {
  const raw = contexto?.profile?.preferences?.language ?? contexto?.language;
  return raw === 'en' ? 'en' : 'es';
}

/**
 * @typedef {'opening' | 'developing' | 'may_close'} ConversationClosurePhase
 */

/**
 * Evalúa tono y estado del hilo para cierre de tramo (heurística continua, no solo contar mensajes).
 * @param {object} [params]
 * @param {object|null} [params.sessionRetention]
 * @param {object|null} [params.conversationPattern]
 * @param {string} [params.sessionPhase]
 * @param {object|null} [params.contextual]
 * @returns {{ phase: ConversationClosurePhase, reasons: string[] }}
 */
export function evaluateConversationClosureReadiness({
  sessionRetention = null,
  conversationPattern = null,
  sessionPhase = 'default',
  contextual = null,
  userMessage = null,
  conversationHistory = [],
} = {}) {
  const retention = sessionRetention && typeof sessionRetention === 'object' ? sessionRetention : {};
  const pattern = conversationPattern && typeof conversationPattern === 'object' ? conversationPattern : {};
  const userTurnCount = Math.floor(Number(retention.userTurnCount ?? 0));
  const explicitExit = pattern.closureRisk === true || retention.likelyFarewell === true;
  const intent = contextual?.intencion?.tipo;
  const phaseNorm = typeof sessionPhase === 'string' ? sessionPhase.trim() : '';

  if (
    intent === MESSAGE_INTENTS.GREETING ||
    intent === MESSAGE_INTENTS.CRISIS ||
    retention.suggestReturningUserWarmOpen === true ||
    isGreetingOrCheckInMessage(userMessage) ||
    isOngoingEmotionalShareMessage(userMessage) ||
    hasActiveCrisisRecoveryInThread(userMessage, conversationHistory)
  ) {
    return { phase: 'opening', reasons: ['saludo_o_apertura'] };
  }

  if (phaseNorm === 'acute' && !explicitExit) {
    return { phase: 'opening', reasons: ['fase_seguridad'] };
  }

  if (explicitExit) {
    return { phase: 'may_close', reasons: ['salida_explicita'] };
  }

  const retentionSignals =
    retention.suggestBridgeClosing === true ||
    retention.suggestFatigueClosing === true ||
    retention.suggestThematicMicroClosure === true ||
    retention.suggestCheckpointPause === true;

  const hardCloseSignals =
    retention.likelyFarewell === true ||
    retention.suggestFatigueClosing === true ||
    retention.suggestThematicMicroClosure === true;

  const substantiveThread =
    Number.isFinite(userTurnCount) && userTurnCount >= CLOSURE_MIN_USER_TURNS;

  if (!substantiveThread) {
    return { phase: 'opening', reasons: ['hilo_reciente'] };
  }

  if (hardCloseSignals) {
    return { phase: 'may_close', reasons: ['senal_cierre'] };
  }

  if (retention.nearThreadLimit === true) {
    return { phase: 'may_close', reasons: ['limite_tecnico_hilo'] };
  }

  if (retentionSignals) {
    return { phase: 'developing', reasons: ['intercambio_en_curso'] };
  }

  return { phase: 'developing', reasons: ['intercambio_en_curso'] };
}

/**
 * Quita puentes de cierre que el modelo añadió cuando el hilo aún no está en fase `may_close`.
 * @param {string} respuesta
 * @param {object} [contexto]
 * @returns {string}
 */
function normalizeClosureStrippedText(respuesta) {
  return String(respuesta || '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.!?])/g, '$1')
    .trim();
}

function removeSessionClosurePhrases(respuesta) {
  let out = String(respuesta || '');
  for (const re of PREMATURE_CLOSURE_PHRASE_RES) {
    out = out.replace(re, '');
  }
  return normalizeClosureStrippedText(out);
}

/**
 * Evita repetir el mismo puente de cierre en turnos consecutivos del asistente.
 * @param {string} respuesta
 * @param {string[]} [recentAssistantMessages]
 * @returns {string}
 */
export function stripRepeatedSessionClosurePhrase(respuesta, recentAssistantMessages = []) {
  if (!respuesta || typeof respuesta !== 'string') return respuesta;
  const recent = (Array.isArray(recentAssistantMessages) ? recentAssistantMessages : [])
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .slice(-2);
  if (!recent.some((t) => responseHasSessionClosureBridge(t))) return respuesta;
  if (!responseHasSessionClosureBridge(respuesta)) return respuesta;
  return removeSessionClosurePhrases(respuesta);
}

export function stripPrematureSessionClosurePhrases(respuesta, contexto = {}) {
  if (!respuesta || typeof respuesta !== 'string') return respuesta;
  const recentAssistantMessages =
    contexto?.recentAssistantMessages ||
    extractRecentAssistantMessagesFromHistory(contexto?.conversationHistory, 2);

  let out = respuesta;
  if (shouldSuppressSessionClosure(contexto) || !shouldOrientSessionClosure(contexto)) {
    out = removeSessionClosurePhrases(out);
  }
  return stripRepeatedSessionClosurePhrase(out, recentAssistantMessages);
}

/**
 * @param {string} respuesta
 * @returns {boolean}
 */
export function responseHasSessionClosureBridge(respuesta) {
  if (!respuesta || typeof respuesta !== 'string') return false;
  const lower = respuesta.toLowerCase();
  return (
    /cerrar aqu[ií] este tramo/.test(lower) ||
    /retomarlo cuando quieras/.test(lower) ||
    /por hoy lo dejamos aqu[ií]/.test(lower) ||
    /close this segment here/.test(lower) ||
    /pick (?:it|this) up whenever you want/.test(lower) ||
    /leave it here for today/.test(lower)
  );
}

/**
 * @param {object} contexto - contexto de openaiService (sessionRetention, conversationPattern, sessionPhase, contextual, crisis)
 * @returns {boolean}
 */
export function shouldOrientSessionClosure(contexto = {}) {
  if (shouldSuppressSessionClosure(contexto)) return false;

  const { phase } = evaluateConversationClosureReadiness({
    sessionRetention: contexto?.sessionRetention,
    conversationPattern: contexto?.conversationPattern,
    sessionPhase: contexto?.sessionPhase,
    contextual: contexto?.contextual,
    userMessage: contexto?.userMessage,
    conversationHistory: contexto?.conversationHistory,
  });
  return phase === 'may_close';
}

/**
 * Solo inyectar puente de cierre mecánico en salida clara o fatiga real (no en pistas suaves del prompt).
 * @param {object} contexto
 * @returns {boolean}
 */
export function shouldForceSessionClosureBridge(contexto = {}) {
  if (shouldSuppressSessionClosure(contexto)) return false;

  const retention = contexto?.sessionRetention || {};
  const pattern = contexto?.conversationPattern || {};

  if (retention.likelyFarewell === true) return true;
  if (retention.suggestFatigueClosing === true) return true;
  if (pattern.closureRisk === true) return true;

  return false;
}

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
 * Mensaje corto que comparte cómo está la persona (apertura o seguimiento), no cierre.
 * @param {string} [content]
 * @returns {boolean}
 */
export function isOngoingEmotionalShareMessage(content) {
  const t = (content || '').trim();
  if (!t || t.length > 140) return false;
  if (isGreetingOrCheckInMessage(t)) return false;
  if (detectLikelyFarewell(t)) return false;
  if (ONGOING_CRISIS_RECOVERY_RES.test(t)) return true;
  return /\b(feel(?:ing)?|i'?m|me siento|estoy|hoy|today|good|well|okay|ok|bad|anxious|sad|happy|bien|mal|cansad|triste|ansios|contento|agotad|grateful|stressed|worried|calm|better|worse)\b/i.test(
    t
  );
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
  const isGreeting = isGreetingOrCheckInMessage(userContent);
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
    !isGreeting &&
    !suggestFirstTimeExpectation &&
    userTurnCount >= CLOSURE_MIN_USER_TURNS &&
    userTurnCount <= 10;

  const suggestFatigueClosing =
    userTurnCount >= 12 && !likelyFarewell && !suggestFirstTimeExpectation;

  const suggestCheckpointPause =
    !likelyFarewell &&
    !isGreeting &&
    !suggestFirstTimeExpectation &&
    userTurnCount >= CLOSURE_MIN_USER_TURNS &&
    totalMessages >= 10 &&
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
  if (
    !Number.isFinite(userTurnCount) ||
    !Number.isFinite(totalMessages) ||
    userTurnCount < CLOSURE_MIN_USER_TURNS ||
    totalMessages < 10
  ) {
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
 * @param {{ sessionPhase?: string, language?: 'es'|'en' }} [options] - en fase `acute` se omiten cierres reflexivos (seguridad primero).
 * @returns {string}
 */
export function buildSessionRetentionSystemSnippet(payload, options = {}) {
  if (!payload) return '';
  const phaseNorm = typeof options.sessionPhase === 'string' ? options.sessionPhase.trim() : '';
  const acute = phaseNorm === 'acute';
  const en = options.language === 'en';

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
      en
        ? '- **This message sounds like a goodbye or wrap-up.** Reply with brief warmth. Do not open a new menu of options or push exercises. You may thank them for sharing, optionally one line that captures what mattered, and a **natural bridge** ("whenever you want we can pick up with…", "I\'ll be here when you come back"). No guilt for not writing sooner.'
        : '- **Este mensaje suena a despedida o cierre.** Responde con calidez breve. No abras menú de opciones nuevas ni insistas en ejercicios. Puedes agradecer lo compartido, opcionalmente una frase que recoja lo central, y un **puente** natural ("cuando quieras seguimos con…", "aquí estaré cuando vuelvas"). Sin culpa por no escribir antes.'
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
      en
        ? '- **Several turns already shared:** if it fits, orient a **soft close with a sense of "this moved forward"**: brief validation, **one line tying together what mattered**, and a bridge to pick up ("whenever you want we can continue with…"). It can be **segment conclusion without a final question** if the user\'s message already closed the turn. No option menus or task lists.'
        : '- **Varios turnos ya compartidos:** si encaja, orienta **cierre suave con sensación de “esto avanzó”**: validación breve, **una frase que una lo central**, y puente para retomar (“cuando quieras seguimos con…”). Puede ser **conclusión del tramo sin pregunta final** si el mensaje del usuario ya cerró el giro. No menú de opciones ni lista de tareas.'
    );
  }

  if (effective.suggestFatigueClosing) {
    lines.push(
      '- **Hilo ya largo:** **prioriza** dejar **sensación de cierre de tramo**: mini-síntesis en prosa, qué quedó en el centro, y puerta de regreso clara; evita reabrir con preguntas amplias. Solo si falta un dato puntual, **una** pregunta muy acotada. Sin temas nuevos ni más carga.'
    );
  }

  if (lines.length === 0) return '';

  const hasClosureOrientedHint =
    effective.likelyFarewell === true ||
    effective.nearThreadLimit === true ||
    effective.suggestFirstTimeExpectation === true ||
    effective.suggestCheckpointPause === true ||
    effective.suggestThematicMicroClosure === true ||
    effective.suggestBridgeClosing === true ||
    effective.suggestFatigueClosing === true;

  let header;
  if (acute) {
    header = en
      ? '\n\n### Session and return (brief)\n' +
        '- **Safety priority:** do not orient reflective segment closure, therapeutic pauses, or "landing" here except for a **clear user goodbye** or the **technical thread limit** in the corresponding bullet.\n'
      : '\n\n### Sesión y retorno (breve)\n' +
        '- **Prioridad de seguridad:** no orientes aquí cierre reflexivo del tramo, pausas terapéuticas ni “aterrizaje” salvo **despedida clara** del usuario o **límite técnico** del hilo en la viñeta correspondiente.\n';
  } else if (hasClosureOrientedHint) {
    header = en
      ? '\n\n### Session and return\n' +
        '- Chat **stays available**; you do not decide the person should leave.\n' +
        '- Many people need to **feel the segment reached a conclusion** (even briefly) to return with clarity; a thread that only "stays open" without any landing can tire and **discourage** a new conversation. When it fits, help **land**: minimal synthesis, what became clear, and **allow a pause** or "we can continue whenever you want" **without** another broad question out of habit.\n' +
        '- The bullets below mark **when** that natural closure fits; if it does not apply, continue as before.'
      : '\n\n### Sesión y retorno\n' +
        '- El chat **sigue disponible**; tú no decides que la persona deba irse.\n' +
        '- Muchas personas necesitan **sentir que el tramo tuvo una conclusión** (aunque sea breve) para volver con claridad; un hilo que solo “sigue abierto” sin ningún aterrizaje puede cansar y **desincentivar** una nueva conversación. Cuando encaje, ayuda a **aterrizar**: síntesis mínima, qué quedó claro, y **permite pausa** o “seguimos cuando quieras” **sin** otra pregunta amplia solo por hábito.\n' +
        '- Las viñetas siguientes marcan **cuándo** ese cierre natural encaja; si no aplica, sigue como hasta ahora.';
  } else {
    header = en
      ? '\n\n### Session and return (opening)\n' +
        '- Chat **stays available**; in a thread that just started, prioritize **welcome** and following the conversation.\n' +
        '- **Do not** invite closing the segment, pausing the session, or "picking up from this point" unless the person asks or says goodbye.\n'
      : '\n\n### Sesión y retorno (apertura)\n' +
        '- El chat **sigue disponible**; en un hilo recién empezado prioriza **acogida** y seguir la conversación.\n' +
        '- **No** invites a cerrar el tramo, pausar la sesión ni “retomar desde este punto” salvo que la persona lo pida o se despida.\n';
  }

  const out = header + '\n' + lines.join('\n');
  return truncateRetentionSnippet(out, SNIPPET_MAX_CHARS);
}
