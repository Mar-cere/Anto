/**
 * #57 — Preguntar en lugar de asumir cuando la certeza interpretativa es baja.
 * Usa la confianza del clasificador de intención (contextAnalyzer), no un segundo modelo.
 */

/** Por debajo de este umbral la intención se considera poco fiable (p. ej. valor por defecto 0.5 sin match fuerte). */
export const LOW_INTENT_CONFIDENCE_THRESHOLD = 0.62;

/** Mensajes muy cortos: no añadir carga de “aclarar intención”. */
export const CLARIFY_MIN_USER_MESSAGE_CHARS = 44;

const SNIPPET_MAX_CHARS = 620;

const STATIC_SNIPPET = [
  '',
  '### Baja certeza interpretativa (clasificador)',
  'La confianza del sistema sobre la **intención** del último mensaje es **baja**. **No inventes** el objetivo del usuario ni rellenes huecos con suposiciones fuertes: quédate con lo que el texto dice con claridad.',
  'Si necesitas precisar algo para responder bien, usa **una sola pregunta concreta** (no lista ni batería de dudas, no menú A/B) salvo crisis o petición explícita del usuario.',
  'Si arriba hay instrucciones de **crisis o seguridad**, esas van primero.'
].join('\n');

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function parseConfidence(raw) {
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.trim());
    return Number.isFinite(n) ? n : null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  return null;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function normalizeRisk(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  const u = raw.trim().toUpperCase();
  return u || null;
}

/**
 * @param {Object} [contexto]
 * @returns {boolean}
 */
export function shouldUseLowConfidenceClarifySnippet(contexto) {
  if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto)) return false;

  const msg = String(contexto.currentMessage ?? '').trim();
  if (msg.length < CLARIFY_MIN_USER_MESSAGE_CHARS) return false;

  const risk = normalizeRisk(contexto.crisis?.riskLevel);
  if (risk === 'MEDIUM' || risk === 'HIGH') return false;

  if (contexto.sessionPhase === 'acute') return false;

  const tipo = contexto.contextual?.intencion?.tipo;
  if (tipo === 'CRISIS') return false;

  const conf = parseConfidence(contexto.contextual?.intencion?.confianza);
  if (conf == null) return false;

  return conf < LOW_INTENT_CONFIDENCE_THRESHOLD;
}

/**
 * @param {Object} [contexto]
 * @returns {string}
 */
export function buildLowConfidenceClarifySnippet(contexto) {
  if (!shouldUseLowConfidenceClarifySnippet(contexto)) return '';

  if (STATIC_SNIPPET.length > SNIPPET_MAX_CHARS) {
    return `${STATIC_SNIPPET.slice(0, SNIPPET_MAX_CHARS - 1)}…`;
  }
  return STATIC_SNIPPET;
}
