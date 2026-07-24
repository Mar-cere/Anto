/**
 * Soft landing post-crisis (#225): ventana 48 h, strip once, home, prompt snippet.
 */
import User from '../models/User.js';
import features from '../config/features.js';
import metricsService from './metricsService.js';
import {
  getPostCrisisWindow,
  isUserInPostCrisisWindow,
} from '../utils/postCrisisWindowGuard.js';
import {
  buildSoftLandingHomeMessage,
  buildSoftLandingPromptSnippet,
  buildSoftLandingStripPayload,
  SOFT_LANDING_VERSION,
} from '../constants/softLandingPostCrisisCopy.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

function isStripAlreadyAcked(softLandingState, anchorAt) {
  const ack = softLandingState?.stripAckAnchorAt;
  if (!ack || !anchorAt) return false;
  return new Date(ack).getTime() >= new Date(anchorAt).getTime();
}

function isEnteredAlreadyAcked(softLandingState, anchorAt) {
  const ack = softLandingState?.enteredAckAnchorAt;
  if (!ack || !anchorAt) return false;
  return new Date(ack).getTime() >= new Date(anchorAt).getTime();
}

/** Filtro atómico: ack ausente o anterior a la ancla actual. */
function ackFilterForAnchor(fieldPath, anchorAt) {
  return {
    $or: [
      { [fieldPath]: { $exists: false } },
      { [fieldPath]: null },
      { [fieldPath]: { $lt: anchorAt } },
    ],
  };
}

/**
 * Registra soft_landing_entered una vez por ancla de ventana (v1.1).
 * Usa update condicional para evitar doble métrica en carreras home+chat.
 * @param {unknown} userId
 * @param {{ anchorAt: Date, endsAt: Date }} window
 * @param {object|null|undefined} softLandingState
 * @returns {Promise<boolean>} true si se registró ahora
 */
async function markSoftLandingEnteredOnce(userId, window, softLandingState) {
  if (!userId || !window?.anchorAt) return false;
  if (isEnteredAlreadyAcked(softLandingState, window.anchorAt)) return false;
  try {
    const result = await User.updateOne(
      {
        _id: userId,
        ...ackFilterForAnchor('softLandingState.enteredAckAnchorAt', window.anchorAt),
      },
      { $set: { 'softLandingState.enteredAckAnchorAt': window.anchorAt } },
    );
    if (!result?.modifiedCount) return false;
    await metricsService.recordMetric(
      'soft_landing_entered',
      { endsAt: window.endsAt.toISOString() },
      userId,
      { version: SOFT_LANDING_VERSION },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {unknown} userId
 * @returns {Promise<boolean>}
 */
export async function isSoftLandingActive(userId) {
  if (!features.softLandingPostCrisis) return false;
  if (!userId) return false;
  return isUserInPostCrisisWindow(userId);
}

/**
 * Payload para home (`GET /api/summary/focus`).
 * @param {unknown} userId
 * @param {{ language?: string }} [opts]
 */
export async function buildSoftLandingFocusPayload(userId, opts = {}) {
  if (!features.softLandingPostCrisis || !userId) return null;
  const window = await getPostCrisisWindow(userId);
  if (!window.active) return null;
  const language = normalizeApiLanguage(opts.language);

  try {
    const user = await User.findById(userId).select('softLandingState').lean();
    await markSoftLandingEnteredOnce(userId, window, user?.softLandingState);
  } catch {
    /* best-effort */
  }

  return {
    active: true,
    version: SOFT_LANDING_VERSION,
    endsAt: window.endsAt.toISOString(),
    anchorAt: window.anchorAt.toISOString(),
    message: buildSoftLandingHomeMessage({ language }),
    messageKey: 'SOFT_LANDING_HOME',
  };
}

/**
 * Resuelve contexto de turno: active + strip (solo primera vez) + snippet.
 * No emite strip si hay crisis panel / soft check-in #19 en primer plano.
 *
 * @param {object} p
 * @param {unknown} p.userId
 * @param {string} [p.language]
 * @param {boolean} [p.suppressStrip] — true si crisis resources o soft check-in activos
 * @param {boolean} [p.includeStrip=true]
 */
export async function resolveSoftLandingForTurn({
  userId,
  language = 'es',
  suppressStrip = false,
  includeStrip = true,
} = {}) {
  if (!features.softLandingPostCrisis || !userId) {
    return {
      softLandingActive: false,
      softLandingPromptSnippet: null,
      softLanding: null,
    };
  }

  const window = await getPostCrisisWindow(userId);
  if (!window.active) {
    return {
      softLandingActive: false,
      softLandingPromptSnippet: null,
      softLanding: null,
    };
  }

  const lang = normalizeApiLanguage(language);
  const promptSnippet = buildSoftLandingPromptSnippet({ language: lang });

  let softLandingState = null;
  try {
    const user = await User.findById(userId).select('softLandingState').lean();
    softLandingState = user?.softLandingState || null;
  } catch {
    softLandingState = null;
  }

  await markSoftLandingEnteredOnce(userId, window, softLandingState);

  let strip = null;
  if (includeStrip && !suppressStrip) {
    const already = isStripAlreadyAcked(softLandingState, window.anchorAt);
    if (!already) {
      try {
        const result = await User.updateOne(
          {
            _id: userId,
            ...ackFilterForAnchor('softLandingState.stripAckAnchorAt', window.anchorAt),
          },
          {
            $set: {
              'softLandingState.stripAckAnchorAt': window.anchorAt,
              'softLandingState.stripShownAt': new Date(),
            },
          },
        );
        if (result?.modifiedCount) {
          strip = buildSoftLandingStripPayload({ language: lang });
          await metricsService.recordMetric(
            'soft_landing_strip_shown',
            { anchorAt: window.anchorAt.toISOString() },
            userId,
            { version: SOFT_LANDING_VERSION },
          );
        }
      } catch {
        /* best-effort persist — sin strip si no se pudo reclamar el ack */
      }
    }
  }

  return {
    softLandingActive: true,
    softLandingPromptSnippet: promptSnippet,
    softLanding: {
      active: true,
      version: SOFT_LANDING_VERSION,
      endsAt: window.endsAt.toISOString(),
      strip,
    },
  };
}

/**
 * Dismiss / ack strip (idempotente).
 * @param {unknown} userId
 */
export async function dismissSoftLandingStrip(userId) {
  if (!userId) {
    return { success: false, reason: 'missing_user' };
  }
  if (!features.softLandingPostCrisis) {
    return { success: true, skipped: true };
  }

  const window = await getPostCrisisWindow(userId);
  const now = new Date();
  const set = {
    'softLandingState.stripDismissedAt': now,
    'softLandingState.stripShownAt': now,
  };
  if (window.anchorAt) {
    set['softLandingState.stripAckAnchorAt'] = window.anchorAt;
  } else {
    set['softLandingState.stripAckAnchorAt'] = now;
  }

  await User.updateOne({ _id: userId }, { $set: set });

  try {
    await metricsService.recordMetric(
      'soft_landing_strip_dismissed',
      { anchorAt: window.anchorAt ? window.anchorAt.toISOString() : null },
      userId,
      { version: SOFT_LANDING_VERSION },
    );
  } catch {
    /* best-effort */
  }

  return { success: true };
}

export { isStripAlreadyAcked, isEnteredAlreadyAcked, markSoftLandingEnteredOnce };

export default {
  isSoftLandingActive,
  buildSoftLandingFocusPayload,
  resolveSoftLandingForTurn,
  dismissSoftLandingStrip,
};
