/**
 * Servicio de telemetría para sesiones programadas (#15).
 * Registra eventos de notificaciones y sesiones para análisis.
 */
import { api, ENDPOINTS } from '../config/api';

/**
 * Registra un evento de telemetría para sesiones programadas.
 * @param {string} sessionId - ID de la sesión
 * @param {string} eventType - Tipo de evento ('notification_sent', 'session_started', 'session_skipped')
 * @param {Object} metadata - Metadata opcional
 * @param {number} metadata.responseLatency - Latencia en ms desde notificación hasta acción
 * @param {boolean} metadata.originatedFromNotification - Si el evento vino de una notificación
 * @param {string} metadata.conversationId - ID de la conversación asociada
 * @param {string} metadata.platform - Plataforma ('ios', 'android', 'web')
 * @param {string} metadata.appVersion - Versión de la app
 * @returns {Promise<Object>} Evento registrado
 */
export async function recordSessionEvent(sessionId, eventType, metadata = {}) {
  try {
    // Validar inputs
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new Error('Invalid sessionId');
    }

    const validEventTypes = ['notification_sent', 'session_started', 'session_skipped'];
    if (!validEventTypes.includes(eventType)) {
      throw new Error(`Invalid eventType: ${eventType}`);
    }

    // Sanitizar metadata
    const sanitizedMetadata = {};

    if (metadata.responseLatency !== undefined && metadata.responseLatency !== null) {
      const latency = Number(metadata.responseLatency);
      if (!isNaN(latency) && isFinite(latency) && latency >= 0) {
        sanitizedMetadata.responseLatency = latency;
      }
    }

    if (metadata.originatedFromNotification !== undefined) {
      sanitizedMetadata.originatedFromNotification = Boolean(metadata.originatedFromNotification);
    }

    if (metadata.conversationId && typeof metadata.conversationId === 'string') {
      sanitizedMetadata.conversationId = metadata.conversationId.trim();
    }

    if (metadata.platform && typeof metadata.platform === 'string') {
      const validPlatforms = ['ios', 'android', 'web', 'unknown'];
      if (validPlatforms.includes(metadata.platform.toLowerCase())) {
        sanitizedMetadata.platform = metadata.platform.toLowerCase();
      }
    }

    if (metadata.appVersion && typeof metadata.appVersion === 'string') {
      sanitizedMetadata.appVersion = metadata.appVersion.trim().slice(0, 50);
    }

    // Enviar al backend
    const response = await api.post(`${ENDPOINTS.SCHEDULED_SESSIONS}/events`, {
      sessionId: sessionId.trim(),
      eventType,
      metadata: sanitizedMetadata,
    });

    // Validar respuesta
    if (!response || typeof response !== 'object' || !response.data) {
      throw new Error('Invalid API response format');
    }

    console.log('[recordSessionEvent] Event recorded:', eventType, sessionId);
    return response.data;
  } catch (error) {
    console.error('[recordSessionEvent] Error recording event:', error);
    // No propagar error - la telemetría no debe romper el flujo principal
    return null;
  }
}

/**
 * Registra que una sesión fue iniciada desde una notificación.
 * @param {string} sessionId - ID de la sesión
 * @param {Object} options - Opciones adicionales
 * @param {number} options.responseLatency - Latencia desde notificación hasta apertura
 * @param {string} options.conversationId - ID de la conversación abierta
 * @param {string} options.platform - Plataforma ('ios', 'android', 'web')
 * @returns {Promise<Object|null>} Evento registrado o null si falla
 */
export async function recordSessionStarted(sessionId, options = {}) {
  return recordSessionEvent(sessionId, 'session_started', {
    responseLatency: options.responseLatency,
    conversationId: options.conversationId,
    platform: options.platform,
    originatedFromNotification: true,
  });
}

/**
 * Registra que una sesión fue omitida/ignorada.
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object|null>} Evento registrado o null si falla
 */
export async function recordSessionSkipped(sessionId) {
  return recordSessionEvent(sessionId, 'session_skipped', {
    originatedFromNotification: false,
  });
}
