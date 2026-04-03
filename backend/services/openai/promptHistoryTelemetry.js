/**
 * Telemetría de truncado de historial para afinar CHAT_PROMPT_* con datos reales.
 * Métricas (Mongo + memoria), logs estructurados y breadcrumbs en Sentry si aplica.
 */
import metricsService from '../metricsService.js';
import logger from '../../utils/logger.js';
import { addBreadcrumb } from '../../utils/sentry.js';

function isPromptHistoryTelemetryEnabled() {
  return process.env.ENABLE_PROMPT_HISTORY_TELEMETRY !== 'false';
}

function countIntensityGe(messages, threshold) {
  if (!messages?.length) return 0;
  return messages.filter(
    (m) => (m.metadata?.context?.emotional?.intensity ?? 0) >= threshold
  ).length;
}

/**
 * @param {object} telemetry - Payload completo (sin PII de contenido)
 * @param {object} currentContext - Incluye opcional `_promptTelemetry`: { userId?, conversationId?, source?, callSite? }
 */
export function emitPromptHistoryTelemetry(telemetry, currentContext = {}) {
  if (!isPromptHistoryTelemetryEnabled()) return;

  metricsService.recordPromptHistorySelectionSample({ truncated: !!telemetry.truncated });

  const tel = currentContext._promptTelemetry || {};
  const userId = tel.userId ?? null;
  const source = tel.source || 'unknown';
  const callSite = tel.callSite || telemetry.callSite || 'selectHistoryForPrompt';
  const conversationId = tel.conversationId ?? null;

  const payload = {
    ...telemetry,
    source,
    callSite
  };
  delete payload._raw; // por si acaso

  const metadata = {
    conversationId: conversationId != null ? String(conversationId) : undefined
  };

  if (telemetry.truncated) {
    void metricsService.recordMetric('prompt_history_truncation', payload, userId, metadata);
    logger.info('[PromptHistory] truncado', {
      ...payload,
      userId: userId != null ? String(userId) : undefined,
      conversationId: metadata.conversationId
    });
    try {
      addBreadcrumb({
        category: 'prompt.history',
        message: 'Historial truncado para el prompt',
        level: 'info',
        data: {
          truncated: true,
          tailOnly: payload.tailOnly,
          droppedTotal: payload.droppedTotal,
          nonemptyCount: payload.nonemptyCount,
          maxMessages: payload.maxMessages,
          slidingTail: payload.slidingTail,
          budget: payload.budget,
          source,
          callSite
        }
      });
    } catch (_) {
      /* noop */
    }
  }
}

export { countIntensityGe };
