/**
 * Acciones en segundo plano de crisis por nivel (flujo §3).
 *
 * | Nivel   | CrisisEvent | Push              | Alerta contactos        |
 * |---------|-------------|-------------------|-------------------------|
 * | WARNING | No          | Push advertencia  | No                      |
 * | MEDIUM  | Sí (async)  | Push medium       | Solo evidencia fuerte   |
 * | HIGH    | Sí (sync)   | Push high         | Solo confidence ≥ 0.9   |
 */
import mongoose from 'mongoose';
import CrisisEvent from '../models/CrisisEvent.js';
import User from '../models/User.js';
import { features } from '../config/features.js';
import { buildCrisisActionDecision } from '../constants/crisis.js';
import {
  calculateRiskScore,
  extractProtectiveFactors,
  extractRiskFactors,
} from '../routes/chat/chatContextAnalysis.js';
import crisisFollowUpService from './crisisFollowUpService.js';
import emergencyAlertService from './emergencyAlertService.js';
import metricsService from './metricsService.js';
import pushNotificationService from './pushNotificationService.js';

const BACKGROUND_LEVELS = new Set(['WARNING', 'MEDIUM', 'HIGH']);

function normalizeRiskLevel(riskLevel) {
  return String(riskLevel || 'LOW').trim().toUpperCase();
}

function isValidObjectId(value) {
  if (!value) return false;
  return mongoose.Types.ObjectId.isValid(String(value));
}

async function maybeScheduleFollowUps(crisisEventId, riskLevel) {
  if (!features.crisisFollowUp || !crisisEventId) return;
  await crisisFollowUpService.scheduleFollowUps(crisisEventId, riskLevel);
}

/**
 * @param {{ riskLevel?: string, isCrisis?: boolean }} params
 */
export function shouldRunCrisisBackgroundActions({ riskLevel, isCrisis = false }) {
  const level = normalizeRiskLevel(riskLevel);
  if (BACKGROUND_LEVELS.has(level)) return true;
  return isCrisis === true && level !== 'LOW';
}

function buildRiskMetadata({
  emotionalAnalysis,
  contextualAnalysis,
  messageContent,
  trendAnalysis,
  crisisHistory,
  conversationContext,
  crisisDecision,
}) {
  return {
    riskScore: calculateRiskScore(emotionalAnalysis, contextualAnalysis, messageContent, {
      trendAnalysis,
      crisisHistory,
      conversationContext,
    }),
    factors: extractRiskFactors(emotionalAnalysis, contextualAnalysis, messageContent, {
      trendAnalysis,
      crisisHistory,
      conversationContext,
    }),
    protectiveFactors: extractProtectiveFactors(emotionalAnalysis, messageContent),
    decision: {
      actionLevel: crisisDecision.actionLevel,
      confidence: crisisDecision.confidence,
      shouldAlertContacts: crisisDecision.shouldAlertContacts,
      reasons: crisisDecision.reasons,
    },
  };
}

function buildCrisisEventPayload({
  userId,
  riskLevel,
  messageId,
  messageContent,
  emotionalAnalysis,
  trendAnalysis,
  crisisHistory,
  alertResult,
  metadata,
}) {
  return {
    userId,
    riskLevel,
    triggerMessage: {
      messageId,
      contentPreview: String(messageContent || '').substring(0, 200),
      emotionalAnalysis: {
        mainEmotion: emotionalAnalysis?.mainEmotion,
        intensity: emotionalAnalysis?.intensity,
      },
    },
    trendAnalysis: trendAnalysis
      ? {
          rapidDecline: trendAnalysis.trends?.rapidDecline || false,
          sustainedLow: trendAnalysis.trends?.sustainedLow || false,
          isolation: trendAnalysis.trends?.isolation || false,
          escalation: trendAnalysis.trends?.escalation || false,
          warnings: trendAnalysis.warnings || [],
        }
      : undefined,
    crisisHistory: crisisHistory
      ? {
          totalCrises: crisisHistory.totalCrises || 0,
          recentCrises: crisisHistory.recentCrises || 0,
        }
      : undefined,
    alerts: alertResult
      ? {
          sent: alertResult.sent || false,
          sentAt: alertResult.sent ? new Date() : undefined,
          contactsNotified: alertResult.successfulSends || 0,
          channels: {
            email: alertResult.successfulEmails > 0 || false,
            whatsapp: alertResult.successfulWhatsApp > 0 || false,
          },
        }
      : undefined,
    metadata,
  };
}

function bumpBackgroundMetric({ riskLevel, transport, phase, action }) {
  metricsService
    .recordMetric(
      'crisis_background_action',
      { riskLevel, transport, phase, action },
      null,
      {},
    )
    .catch(() => {});
}

async function sendHighAlerts({
  userId,
  riskLevel,
  messageContent,
  crisisDecision,
  trendAnalysis,
  emotionalAnalysis,
  contextualAnalysis,
  crisisHistory,
  conversationContext,
  log,
}) {
  let alertResult = null;
  if (crisisDecision.shouldAlertContacts) {
    alertResult = await emergencyAlertService.sendEmergencyAlerts(userId, riskLevel, messageContent, {
      trendAnalysis,
      metadata: {
        riskScore: calculateRiskScore(emotionalAnalysis, contextualAnalysis, messageContent, {
          trendAnalysis,
          crisisHistory,
          conversationContext,
        }),
        factors: extractRiskFactors(emotionalAnalysis, contextualAnalysis, messageContent, {
          trendAnalysis,
          crisisHistory,
          conversationContext,
        }),
        decision: {
          actionLevel: crisisDecision.actionLevel,
          confidence: crisisDecision.confidence,
          reasons: crisisDecision.reasons,
        },
      },
    });
    if (alertResult?.sent) {
      log?.(`Alertas HIGH enviadas a ${alertResult.successfulSends}/${alertResult.totalContacts} contactos`);
    }
  } else {
    log?.(
      `HIGH sin alerta a contactos (evidencia insuficiente, confidence=${crisisDecision.confidence.toFixed(2)})`,
    );
  }

  try {
    const user = await User.findById(userId).select('+pushToken');
    if (user?.pushToken) {
      await pushNotificationService.sendCrisisHigh(user.pushToken);
      bumpBackgroundMetric({ riskLevel, transport: 'sync', action: 'push_high' });
      log?.('Notificación push HIGH enviada');
    }
  } catch (error) {
    console.error('[CrisisBackgroundActions] Error enviando push HIGH:', error);
  }

  return alertResult;
}

async function createCrisisEventIfPossible({
  messageId,
  userId,
  riskLevel,
  messageContent,
  emotionalAnalysis,
  trendAnalysis,
  crisisHistory,
  alertResult,
  metadata,
  log,
}) {
  if (!isValidObjectId(messageId)) {
    console.warn(`[CrisisBackgroundActions] messageId inválido; CrisisEvent ${riskLevel} omitido`);
    return null;
  }

  const crisisEvent = await CrisisEvent.create(
    buildCrisisEventPayload({
      userId,
      riskLevel,
      messageId,
      messageContent,
      emotionalAnalysis,
      trendAnalysis,
      crisisHistory,
      alertResult,
      metadata,
    }),
  );
  log?.(`CrisisEvent ${riskLevel} registrado`);
  return crisisEvent;
}

async function handleMediumAsync({
  userId,
  riskLevel,
  messageId,
  messageContent,
  emotionalAnalysis,
  contextualAnalysis,
  trendAnalysis,
  crisisHistory,
  conversationContext,
  crisisDecision,
  transport,
  log,
}) {
  let mediumAlertResult = null;
  if (crisisDecision.shouldAlertContacts) {
    mediumAlertResult = await emergencyAlertService.sendEmergencyAlerts(userId, riskLevel, messageContent, {
      trendAnalysis,
      metadata: {
        riskScore: calculateRiskScore(emotionalAnalysis, contextualAnalysis, messageContent, {
          trendAnalysis,
          crisisHistory,
          conversationContext,
        }),
        factors: extractRiskFactors(emotionalAnalysis, contextualAnalysis, messageContent, {
          trendAnalysis,
          crisisHistory,
          conversationContext,
        }),
        decision: {
          actionLevel: crisisDecision.actionLevel,
          confidence: crisisDecision.confidence,
          reasons: crisisDecision.reasons,
        },
      },
    });
  }

  const user = await User.findById(userId).select('+pushToken');
  if (user?.pushToken) {
    await pushNotificationService.sendCrisisMedium(user.pushToken);
    bumpBackgroundMetric({ riskLevel, transport, phase: 'async', action: 'push_medium' });
  }

  const metadata = buildRiskMetadata({
    emotionalAnalysis,
    contextualAnalysis,
    messageContent,
    trendAnalysis,
    crisisHistory,
    conversationContext,
    crisisDecision,
  });

  const crisisEvent = await createCrisisEventIfPossible({
    messageId,
    userId,
    riskLevel,
    messageContent,
    emotionalAnalysis,
    trendAnalysis,
    crisisHistory,
    alertResult: mediumAlertResult,
    metadata,
    log,
  });

  if (crisisEvent && mediumAlertResult?.sent) {
    await maybeScheduleFollowUps(crisisEvent._id, riskLevel);
  }

  bumpBackgroundMetric({ riskLevel, transport, phase: 'async', action: 'crisis_event_medium' });
}

async function handleWarningAsync({ userId, emotionalAnalysis, riskLevel, transport, log }) {
  const user = await User.findById(userId).select('+pushToken');
  if (user?.pushToken) {
    await pushNotificationService.sendCrisisWarning(user.pushToken, {
      emotion: emotionalAnalysis?.mainEmotion,
      intensity: emotionalAnalysis?.intensity,
    });
    bumpBackgroundMetric({ riskLevel, transport, phase: 'async', action: 'push_warning' });
    log?.('Notificación push WARNING enviada');
  }
}

/**
 * Ejecuta acciones en segundo plano según nivel de riesgo.
 * HIGH es síncrono; MEDIUM/WARNING se programan sin bloquear la respuesta.
 */
export async function runCrisisBackgroundActions({
  userId,
  messageId,
  messageContent,
  riskLevel,
  emotionalAnalysis,
  contextualAnalysis,
  trendAnalysis = null,
  crisisHistory = null,
  conversationContext = {},
  transport = 'http',
  isCrisis = false,
  log,
}) {
  const normalizedRiskLevel = normalizeRiskLevel(riskLevel);

  if (!isValidObjectId(userId)) {
    return { skipped: true, reason: 'invalid_user_id' };
  }

  if (!shouldRunCrisisBackgroundActions({ riskLevel: normalizedRiskLevel, isCrisis })) {
    return { skipped: true, reason: 'no_background_actions' };
  }

  const crisisDecision = buildCrisisActionDecision({
    riskLevel: normalizedRiskLevel,
    messageContent,
    contextualAnalysis,
    trendAnalysis,
    crisisHistory,
    conversationContext,
  });

  if (normalizedRiskLevel === 'HIGH') {
    bumpBackgroundMetric({
      riskLevel: normalizedRiskLevel,
      transport,
      phase: 'sync',
      action: 'high_start',
    });
    try {
      const alertResult = await sendHighAlerts({
        userId,
        riskLevel: normalizedRiskLevel,
        messageContent,
        crisisDecision,
        trendAnalysis,
        emotionalAnalysis,
        contextualAnalysis,
        crisisHistory,
        conversationContext,
        log,
      });

      const metadata = buildRiskMetadata({
        emotionalAnalysis,
        contextualAnalysis,
        messageContent,
        trendAnalysis,
        crisisHistory,
        conversationContext,
        crisisDecision,
      });

      const crisisEvent = await createCrisisEventIfPossible({
        messageId,
        userId,
        riskLevel: normalizedRiskLevel,
        messageContent,
        emotionalAnalysis,
        trendAnalysis,
        crisisHistory,
        alertResult,
        metadata,
        log,
      });

      if (crisisEvent && alertResult?.sent) {
        await maybeScheduleFollowUps(crisisEvent._id, normalizedRiskLevel);
      }

      bumpBackgroundMetric({
        riskLevel: normalizedRiskLevel,
        transport,
        phase: 'sync',
        action: 'crisis_event_high',
      });
      return {
        skipped: false,
        riskLevel: normalizedRiskLevel,
        phase: 'sync',
        crisisEventId: crisisEvent?._id?.toString(),
      };
    } catch (error) {
      console.error('[CrisisBackgroundActions] Error manejando crisis HIGH:', error);
      metricsService
        .recordMetric('crisis_background_action', {
          riskLevel: normalizedRiskLevel,
          transport,
          phase: 'sync',
          action: 'error',
        })
        .catch(() => {});
      return { skipped: false, riskLevel: normalizedRiskLevel, phase: 'sync', error: error.message };
    }
  }

  if (normalizedRiskLevel === 'MEDIUM' || normalizedRiskLevel === 'WARNING') {
    const runAsync = async () => {
      try {
        if (normalizedRiskLevel === 'MEDIUM') {
          await handleMediumAsync({
            userId,
            riskLevel: normalizedRiskLevel,
            messageId,
            messageContent,
            emotionalAnalysis,
            contextualAnalysis,
            trendAnalysis,
            crisisHistory,
            conversationContext,
            crisisDecision,
            transport,
            log,
          });
        } else {
          await handleWarningAsync({
            userId,
            emotionalAnalysis,
            riskLevel: normalizedRiskLevel,
            transport,
            log,
          });
        }
      } catch (error) {
        console.error(
          `[CrisisBackgroundActions] Error manejando crisis ${normalizedRiskLevel}:`,
          error,
        );
        metricsService
          .recordMetric('crisis_background_action', {
            riskLevel: normalizedRiskLevel,
            transport,
            phase: 'async',
            action: 'error',
          })
          .catch(() => {});
      }
    };

    runAsync().catch(() => {});
    return { skipped: false, riskLevel: normalizedRiskLevel, phase: 'async' };
  }

  return { skipped: true, reason: 'unsupported_level' };
}

export default { shouldRunCrisisBackgroundActions, runCrisisBackgroundActions };
