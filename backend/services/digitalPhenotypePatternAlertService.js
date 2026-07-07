/**
 * Alerta educativa de pródromos para Inicio (#216).
 *
 * Detecta patrones suaves y observacionales (sueño en descenso, menos
 * movimiento) a partir de los agregados diarios de salud digital y devuelve
 * únicamente un `kind` priorizado. El copy localizado vive en el cliente para
 * respetar el idioma seleccionado y mantener el backend trivialmente testeable.
 *
 * Nunca es diagnóstico: el objetivo es "notarlo con suavidad" antes de que el
 * usuario rumie, no etiquetar un estado clínico.
 */
import Message from '../models/Message.js';
import {
  analyzePhenotypeTrends,
  fetchDigitalPhenotypeSeries,
} from './digitalPhenotypeService.js';
import { getSignalConsentForUser, isDigitalHealthAllowed } from './signalConsentService.js';
import { OBSERVATIONAL_BLOCKED_RISK_LEVELS } from '../utils/chatObservationalContext.js';

const LOOKBACK_DAYS = 7;
const MIN_DAYS_WITH_DATA = 3;
/** Ventana para suprimir la alerta si hubo riesgo elevado reciente (consistente con el chat). */
const RISK_LOOKBACK_HOURS = 72;

/** Umbrales conservadores (más estrictos que el snippet de chat para no saturar Inicio). */
const SLEEP_DECLINE_THRESHOLD = -0.6;
const LOW_MOVEMENT_THRESHOLD = -800;

/**
 * Elige el patrón de mayor prioridad a partir de las tendencias.
 * @returns {('sleep_prodrome'|'sleep_decline'|'low_movement'|null)}
 */
export function pickPhenotypeAlertKind(trends = {}) {
  if (!trends || typeof trends !== 'object') return null;
  if (trends.prodromeSleepDelay === true) return 'sleep_prodrome';
  if (typeof trends.sleepTrend === 'number' && trends.sleepTrend <= SLEEP_DECLINE_THRESHOLD) {
    return 'sleep_decline';
  }
  if (typeof trends.stepsTrend === 'number' && trends.stepsTrend <= LOW_MOVEMENT_THRESHOLD) {
    return 'low_movement';
  }
  return null;
}

/**
 * Suprime la alerta si hubo riesgo elevado reciente (crisis/ideación).
 * Mismo criterio que el contexto observacional del chat; nunca empujar
 * señales de hábitos sobre alguien en un momento delicado.
 *
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function hasRecentElevatedRisk(userId) {
  if (!userId) return false;
  const since = new Date(Date.now() - RISK_LOOKBACK_HOURS * 60 * 60 * 1000);
  const doc = await Message.findOne({
    userId,
    createdAt: { $gte: since },
    'metadata.crisis.riskLevel': { $in: OBSERVATIONAL_BLOCKED_RISK_LEVELS },
  })
    .select('_id')
    .lean();
  return Boolean(doc);
}

/**
 * Construye la alerta de fenotipo para el panel de foco.
 * Devuelve null si no hay consentimiento, riesgo reciente, faltan datos o no hay patrón claro.
 *
 * @param {{ userId: string }} params
 * @returns {Promise<{ kind: string, daysWithData: number } | null>}
 */
export async function buildDigitalPhenotypeFocusAlert({ userId } = {}) {
  if (!userId) return null;

  const consent = await getSignalConsentForUser(userId).catch(() => null);
  if (!isDigitalHealthAllowed(consent)) return null;

  // Blindaje clínico: no mostrar señales de hábitos en momentos de crisis.
  if (await hasRecentElevatedRisk(userId)) return null;

  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);
  since.setHours(0, 0, 0, 0);

  const series = await fetchDigitalPhenotypeSeries({
    userId,
    since,
    limit: LOOKBACK_DAYS,
  });

  const withSignal = (series || []).filter(
    (r) =>
      r?.sleepHours != null ||
      r?.steps != null ||
      r?.screenTimeMinutes != null ||
      r?.activeMinutes != null,
  );
  if (withSignal.length < MIN_DAYS_WITH_DATA) return null;

  const trends = analyzePhenotypeTrends(withSignal);
  const kind = pickPhenotypeAlertKind(trends);
  if (!kind) return null;

  return { kind, daysWithData: withSignal.length };
}

export default {
  pickPhenotypeAlertKind,
  hasRecentElevatedRisk,
  buildDigitalPhenotypeFocusAlert,
};
