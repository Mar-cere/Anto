/**
 * Fase de sesión de chat (heurística) y micro-resumen del hilo para el system prompt.
 * Sin persistencia en BD: se calcula en cada mensaje a partir del historial y el riesgo.
 */
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../../constants/crisis.js';

const CALM_USER_PHRASE =
  /\b(estoy bien|ahora estoy bien|mejor|más calm[oa]|solo (un )?poco de ansiedad|ya (estoy )?más tranquilo|por ahora estoy ok|no (es|está) tan mal)\b/i;

const IMMINENT_IN_MESSAGE =
  /\b(ahora mismo|en este momento voy|esta noche voy|ya no aguanto|voy a hacerlo|tal vez ahora|en un rato)\b/i;

/**
 * @typedef {'acute' | 'settled' | 'default'} ChatSessionPhase
 */

/**
 * @param {Object} params
 * @param {string} params.riskLevel - LOW | WARNING | MEDIUM | HIGH
 * @param {Object} [params.contextualAnalysis]
 * @param {string} params.userContent - último mensaje del usuario
 * @param {Array<{ role: string, content?: string }>} [params.conversationHistoryNewestFirst]
 * @returns {ChatSessionPhase}
 */
export function inferChatSessionPhase({
  riskLevel,
  contextualAnalysis,
  userContent,
  conversationHistoryNewestFirst = []
}) {
  const content = (userContent || '').trim();
  const intent = contextualAnalysis?.intencion?.tipo;
  const conf = contextualAnalysis?.intencion?.confianza ?? 0;

  const acuteByRisk = riskLevel === 'MEDIUM' || riskLevel === 'HIGH';
  const acuteByCrisisIntent = intent === 'CRISIS' && conf >= 0.9 && riskLevel !== 'LOW';
  const acuteByLexicon =
    hasExplicitSuicidalOrSelfHarmLexicon(content) || IMMINENT_IN_MESSAGE.test(content);

  if (acuteByRisk || acuteByCrisisIntent || acuteByLexicon) {
    return 'acute';
  }

  const userTextsChrono = [...conversationHistoryNewestFirst]
    .reverse()
    .filter((m) => m.role === 'user')
    .map((m) => (m.content || '').trim())
    .filter(Boolean);

  const recentCalm = userTextsChrono.slice(-4).some((t) => CALM_USER_PHRASE.test(t));
  if (recentCalm && (riskLevel === 'LOW' || riskLevel === 'WARNING') && !IMMINENT_IN_MESSAGE.test(content)) {
    return 'settled';
  }

  return 'default';
}

/**
 * Texto corto para el system prompt según la fase (español).
 * @param {ChatSessionPhase} phase
 * @returns {string}
 */
export function getSessionPhaseSystemSnippet(phase) {
  if (phase === 'acute') {
    return (
      '\n\n### Estado de esta sesión (uso interno)\n' +
      'Hay riesgo relevante o crisis: prioriza seguridad, preguntas breves y claras. Evita monólogos largos que retrasen la evaluación de seguridad.'
    );
  }
  if (phase === 'settled') {
    return (
      '\n\n### Estado de esta sesión (uso interno)\n' +
      'La persona indicó recientemente estar más tranquila o estable. No reactives el mismo discurso de emergencia salvo señales nuevas y claras de peligro inmediato. Sigue con empatía y pasos pequeños.'
    );
  }
  return '';
}

/**
 * Lista truncada de los últimos mensajes del usuario (sin llamada a LLM).
 * @param {Array<{ role: string, content?: string }>} conversationHistoryNewestFirst
 * @param {{ minMessages?: number, maxUserLines?: number, maxCharsPerLine?: number }} [opts]
 * @returns {string} fragmento para el system prompt o cadena vacía
 */
export function buildRecentThreadSummarySnippet(conversationHistoryNewestFirst, opts = {}) {
  const { minMessages = 8, maxUserLines = 4, maxCharsPerLine = 90 } = opts;
  const h = conversationHistoryNewestFirst || [];
  if (h.length < minMessages) return '';

  const chronological = [...h].reverse();
  const userMsgs = chronological.filter((m) => m.role === 'user').slice(-maxUserLines);
  if (userMsgs.length < 2) return '';

  const lines = userMsgs.map((m) => {
    const t = (m.content || '').replace(/\s+/g, ' ').trim();
    const clipped = t.length > maxCharsPerLine ? `${t.slice(0, maxCharsPerLine - 1)}…` : t;
    return `- ${clipped}`;
  });

  return (
    '\n\n### Hilo reciente (resumen breve de lo que dijo el usuario)\n' +
    `${lines.join('\n')}\n` +
    'Úsalo solo para continuidad; la fuente de verdad es el último mensaje del usuario.'
  );
}
