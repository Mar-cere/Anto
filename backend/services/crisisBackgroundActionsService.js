/**
 * Acciones en segundo plano de crisis por nivel (flujo §3).
 *
 * | Nivel   | CrisisEvent | Push              | Alerta contactos        |
 * |---------|-------------|-------------------|-------------------------|
 * | WARNING | No          | Push advertencia  | No                      |
 * | MEDIUM  | Sí (async)  | Push medium       | Solo evidencia fuerte   |
 * | HIGH    | Sí (sync)   | Push high         | Solo confidence ≥ 0.9   |
 */
import CrisisEvent from '../models/CrisisEvent.js';
import User from '../models/User.js';
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

/**
 * @param {{ riskLevel?: string, isCrisis?: boolean }} params
 */
export function shouldRunCrisisBackgroundActions({ riskLevel, isCrisis = false }) {
  if (BACKGROUND_LEVELS.has(riskLevel)) return true;
  return isCrisis === true && riskLevel !== 'LOW';
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
      log?.('Notificación push HIGH enviada');
    }
  } catch (error) {
    console.error('[CrisisBackgroundActions] Error enviando push HIGH:', error);
  }

  return alertResult;
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

  const crisisEvent = await CrisisEvent.create(
    buildCrisisEventPayload({
      userId,
      riskLevel,
      messageId,
      messageContent,
      emotionalAnalysis,
      trendAnalysis,
      crisisHistory,
      alertResult: mediumAlertResult,
      metadata,
    }),
  );

  if (crisisEvent && mediumAlertResult?.sent) {
    await crisisFollowUpService.scheduleFollowUps(crisisEvent._id, riskLevel);
  }

  bumpBackgroundMetric({ riskLevel, transport, phase: 'async', action: 'crisis_event_medium' });
  log?.('CrisisEvent MEDIUM registrado (async)');
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
  if (!shouldRunCrisisBackgroundActions({ riskLevel, isCrisis })) {
    return { skipped: true, reason: 'no_background_actions' };
  }

  const crisisDecision = buildCrisisActionDecision({
    riskLevel,
    messageContent,
    contextualAnalysis,
    trendAnalysis,
    crisisHistory,
    conversationContext,
  });

  if (riskLevel === 'HIGH') {
    bumpBackgroundMetric({ riskLevel, transport, phase: 'sync', action: 'high_start' });
    try {
      const alertResult = await sendHighAlerts({
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

      if (crisisEvent && alertResult?.sent) {
        await crisisFollowUpService.scheduleFollowUps(crisisEvent._id, riskLevel);
      }

      bumpBackgroundMetric({ riskLevel, transport, phase: 'sync', action: 'crisis_event_high' });
      log?.('CrisisEvent HIGH registrado (sync)');
      return { skipped: false, riskLevel, phase: 'sync', crisisEventId: crisisEvent?._id?.toString() };
    } catch (error) {
      console.error('[CrisisBackgroundActions] Error manejando crisis HIGH:', error);
      metricsService
        .recordMetric('crisis_background_action', { riskLevel, transport, phase: 'sync', action: 'error' })
        .catch(() => {});
      return { skipped: false, riskLevel, phase: 'sync', error: error.message };
    }
  }

  if (riskLevel === 'MEDIUM' || riskLevel === 'WARNING') {
    const runAsync = async () => {
      try {
        if (riskLevel === 'MEDIUM') {
          await handleMediumAsync({
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
          });
        } else {
          await handleWarningAsync({ userId, emotionalAnalysis, riskLevel, transport, log });
        }
      } catch (error) {
        console.error(`[CrisisBackgroundActions] Error manejando crisis ${riskLevel}:`, error);
        metricsService
          .recordMetric('crisis_background_action', { riskLevel, transport, phase: 'async', action: 'error' })
          .catch(() => {});
      }
    };

    runAsync().catch(() => {});
    return { skipped: false, riskLevel, phase: 'async' };
  }

  return { skipped: true, reason: 'unsupported_level' };
}

export default { shouldRunCrisisBackgroundActions, runCrisisBackgroundActions };
