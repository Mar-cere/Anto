/**
 * Pipeline explícito “entender → responder” (#56): resume clasificación previa a la generación
 * para alinear la respuesta del modelo con intención, emoción, urgencia y tema.
 */

import { DEFAULT_VALUES, VALIDATION_LIMITS } from '../../constants/openai.js';

/** Tope del fragmento inyectado (defensivo ante etiquetas largas o datos raros). */
export const UNDERSTANDING_PIPELINE_SNIPPET_MAX_CHARS = 720;

const MAX_LABEL_LEN = 72;

/** @type {ReadonlySet<string>} */
const URGENCIA_NORMALIZADA = new Set(['NORMAL', 'ALTA']);

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function finiteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {number | null} n
 * @returns {number | null}
 */
function clampIntensityDisplay(n) {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.round(
    Math.min(VALIDATION_LIMITS.INTENSITY_MAX, Math.max(VALIDATION_LIMITS.INTENSITY_MIN, n))
  );
}

/**
 * @param {unknown} confRaw
 * @returns {number | null}
 */
function toConfPct(confRaw) {
  let n = confRaw;
  if (typeof n === 'string' && n.trim()) {
    n = Number(n.trim());
  }
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  if (n >= 0 && n <= 1) return Math.max(0, Math.min(100, Math.round(n * 100)));
  if (n > 1 && n <= 100) return Math.round(n);
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Evita saltos de línea o caracteres de control en etiquetas mostradas al modelo.
 * @param {unknown} raw
 * @returns {string | null}
 */
export function sanitizeUnderstandingLabel(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  let s = raw.replace(/[\u0000-\u001F\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (s.length > MAX_LABEL_LEN) s = `${s.slice(0, MAX_LABEL_LEN - 1)}…`;
  return s;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function normalizeUrgencia(raw) {
  const s = sanitizeUnderstandingLabel(raw);
  if (!s) return null;
  const u = s.toUpperCase();
  return URGENCIA_NORMALIZADA.has(u) ? u : null;
}

/**
 * @param {Object} [contexto]
 * @returns {{ intencionTipo: string | null, intencionConfPct: number | null, urgencia: string | null, emocion: string | null, intensidad: number | null, temaCategoria: string | null, crisisRisk: string | null } | null}
 */
export function buildUnderstandingSnapshot(contexto) {
  if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto)) return null;

  const em = contexto.emotional;
  const cx = contexto.contextual;

  if (!em && !cx) return null;

  const intent = cx?.intencion;
  const tema = cx?.tema;

  const intencionTipo = sanitizeUnderstandingLabel(intent?.tipo);
  const intencionConfPct = toConfPct(intent?.confianza);

  const crisisRaw = contexto.crisis?.riskLevel;
  const crisisSan = sanitizeUnderstandingLabel(
    typeof crisisRaw === 'string' ? crisisRaw : null
  );
  const crisisRisk = crisisSan ? crisisSan.toUpperCase() : null;

  return {
    intencionTipo,
    intencionConfPct,
    urgencia: normalizeUrgencia(cx?.urgencia),
    emocion: sanitizeUnderstandingLabel(em?.mainEmotion),
    intensidad: em != null ? clampIntensityDisplay(finiteNumber(em.intensity)) : null,
    temaCategoria: sanitizeUnderstandingLabel(tema?.categoria),
    crisisRisk
  };
}

/**
 * @param {NonNullable<ReturnType<typeof buildUnderstandingSnapshot>>} s
 * @returns {boolean}
 */
function isTotallyBaseline(s) {
  const intent = s.intencionTipo || 'CONVERSACION_GENERAL';
  const emo = s.emocion || DEFAULT_VALUES.EMOTION;
  const inten = s.intensidad != null ? s.intensidad : DEFAULT_VALUES.INTENSITY;
  const urg = s.urgencia || 'NORMAL';
  const tema = s.temaCategoria || 'GENERAL';
  return (
    intent === 'CONVERSACION_GENERAL' &&
    emo === 'neutral' &&
    inten <= 5 &&
    urg === 'NORMAL' &&
    tema === 'GENERAL' &&
    !s.crisisRisk
  );
}

/**
 * Texto para system prompt: lectura obligatoria antes de redactar la respuesta.
 * @param {Object} [contexto]
 * @returns {string}
 */
export function buildUnderstandingPipelineSnippet(contexto) {
  const snap = buildUnderstandingSnapshot(contexto);
  if (!snap) return '';

  if (isTotallyBaseline(snap)) {
    return '';
  }

  const intentLine =
    snap.intencionTipo != null
      ? `- **Intención:** ${snap.intencionTipo}${
          snap.intencionConfPct != null ? ` (~${snap.intencionConfPct}% confianza del clasificador)` : ''
        }`
      : '- **Intención:** (no determinada)';

  const emo =
    snap.emocion != null && snap.intensidad != null
      ? `- **Emoción e intensidad:** ${snap.emocion} (${snap.intensidad}/10)`
      : snap.emocion != null
        ? `- **Emoción e intensidad:** ${snap.emocion}`
        : snap.intensidad != null
          ? `- **Intensidad:** ${snap.intensidad}/10`
          : null;

  const urg =
    snap.urgencia != null ? `- **Urgencia léxica:** ${snap.urgencia}` : null;

  const tema =
    snap.temaCategoria != null ? `- **Tema:** ${snap.temaCategoria}` : null;

  const risk = snap.crisisRisk ? `- **Riesgo (sistema):** ${snap.crisisRisk}` : null;

  const body = [
    '',
    '### Entendimiento previo a responder (clasificación interna)',
    'El sistema ya extrajo señales del **último mensaje**. Prioriza una respuesta **alineada** a esta lectura cuando el texto del usuario la respalde. Si percibes contradicción clara, reconócela con brevedad y aclara con **una** pregunta; no ignores intención ni urgencia sin motivo.',
    intentLine,
    emo,
    urg,
    tema,
    risk
  ]
    .filter(Boolean)
    .join('\n');

  if (body.length > UNDERSTANDING_PIPELINE_SNIPPET_MAX_CHARS) {
    return `${body.slice(0, UNDERSTANDING_PIPELINE_SNIPPET_MAX_CHARS - 1)}…`;
  }
  return body;
}
