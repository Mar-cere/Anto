/**
 * Plantilla validación → normalización → pregunta (V–N–P) para turnos sensibles (#62).
 * Refuerza en el system prompt una estructura mínima sin sustituir protocolos de crisis.
 */

/** Intenciones que activan VNP (claves de PATRONES_INTENCION, mayúsculas). */
/** @type {ReadonlySet<string>} */
const VNP_INTENT_TYPES = new Set(['CRISIS', 'AYUDA_EMOCIONAL']);

/** Niveles de riesgo que activan VNP (alineado a crisis.js; LOW no activa). */
/** @type {ReadonlySet<string>} */
const VNP_CRISIS_RISK_LEVELS = new Set(['WARNING', 'MEDIUM', 'HIGH']);

/** Umbral inclusivo de intensidad emocional (1–10). Exportado para tests y telemetría. */
export const SENSITIVE_VNP_INTENSITY_MIN = 7;

/** Tope defensivo del fragmento inyectado (el texto fijo actual es ~850 caracteres). */
const SNIPPET_MAX_CHARS = 1200;

const STATIC_VNP_SNIPPET_BODY = [
  '',
  '### Turno sensible: estructura mínima (V–N–P)',
  '- **Prioridad:** si arriba hay instrucciones explícitas de **crisis o seguridad**, cumple esas primero; dentro de ese marco mantén el mensaje breve.',
  '- **Validar (1–2 frases):** refleja con tus palabras **algo concreto** de lo que contó (sentir, situación o matiz), no solo “entiendo” o “es válido” sueltos.',
  '- **Normalizar sin minimizar (como mucho 1 frase):** legitima la reacción **sin** quitar peso ni trivializar (“tiene sentido que…”, “no es raro que…”). Evita “no es para tanto”, “otros pasan por lo mismo” o comparar en frío.',
  '- **Una sola pregunta abierta y concreta** al final (sobre lo que dijo, no genérica). Sin lista de preguntas, sin interrogatorio ni “batería” de dudas en el mismo mensaje.',
  '- **Formato:** 1–2 párrafos cortos en prosa; sin viñetas en tu respuesta al usuario salvo crisis o petición explícita de pasos.',
  '- Si el usuario pidió un formato fijo (“solo sí/no”, una frase), respétalo si es seguro.'
].join('\n');

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function normalizeCrisisRiskForVnp(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  return VNP_CRISIS_RISK_LEVELS.has(normalized) ? normalized : null;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function normalizeIntentTipoForVnp(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  return VNP_INTENT_TYPES.has(normalized) ? normalized : null;
}

/**
 * @param {unknown} intensityRaw
 * @returns {number | null}
 */
function parseIntensity(intensityRaw) {
  const n = Number(intensityRaw);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Object} [contexto]
 * @returns {boolean}
 */
export function shouldUseSensitiveVnpTemplate(contexto) {
  if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto)) return false;

  if (contexto.emotional?.requiresAttention === true) return true;

  const intensity = parseIntensity(contexto.emotional?.intensity);
  if (intensity !== null && intensity >= SENSITIVE_VNP_INTENSITY_MIN) return true;

  const tipo = normalizeIntentTipoForVnp(contexto.contextual?.intencion?.tipo);
  if (tipo) return true;

  if (contexto.sessionPhase === 'acute') return true;

  if (normalizeCrisisRiskForVnp(contexto.crisis?.riskLevel)) return true;

  return false;
}

/**
 * Fragmento de system prompt: solo en turnos sensibles.
 * @param {Object} [contexto]
 * @returns {string}
 */
export function buildSensitiveVnpSystemSnippet(contexto) {
  if (!shouldUseSensitiveVnpTemplate(contexto)) return '';

  let out = STATIC_VNP_SNIPPET_BODY;
  if (out.length > SNIPPET_MAX_CHARS) {
    out = `${out.slice(0, Math.max(0, SNIPPET_MAX_CHARS - 1))}…`;
  }
  return out;
}
