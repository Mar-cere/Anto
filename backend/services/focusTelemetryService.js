/**
 * Servicio de telemetría para eventos de foco (#2 Fase 3).
 * Captura eventos de interacción con el sistema de focos para analytics.
 */
import FocusTelemetryEvent from '../models/FocusTelemetryEvent.js';

// Límites de seguridad
const MAX_EVENTS_QUERY_LIMIT = 1000;
const DEFAULT_EVENTS_QUERY_LIMIT = 100;

/**
 * Registrar un evento de telemetría de foco.
 * @param {Object} event - Datos del evento
 * @param {string|ObjectId} event.userId - ID del usuario
 * @param {string} event.eventType - Tipo de evento
 * @param {string} [event.themeId] - ID del tema del foco
 * @param {Object} [event.metadata] - Metadata adicional del evento
 * @returns {Promise<void>}
 */
export async function logFocusEvent({ userId, eventType, themeId, metadata = {} }) {
  try {
    // Validaciones básicas
    if (!userId) {
      console.warn('[focusTelemetryService] userId is required');
      return;
    }
    
    if (!eventType || typeof eventType !== 'string') {
      console.warn('[focusTelemetryService] eventType is required and must be a string');
      return;
    }
    
    await FocusTelemetryEvent.create({
      userId,
      eventType,
      themeId,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    // No bloquear la operación principal si falla la telemetría
    console.error('[focusTelemetryService] Error logging focus event:', {
      userId: String(userId),
      eventType,
      error: error.message,
    });
  }
}

/**
 * Obtener eventos de foco de un usuario.
 * @param {string|ObjectId} userId - ID del usuario
 * @param {Object} [options] - Opciones de filtrado
 * @param {string} [options.eventType] - Filtrar por tipo de evento
 * @param {string} [options.themeId] - Filtrar por tema
 * @param {Date} [options.since] - Filtrar desde fecha
 * @param {number} [options.limit=100] - Límite de resultados
 * @returns {Promise<Array>} Lista de eventos
 */
export async function getFocusEvents(userId, options = {}) {
  // Validar userId
  if (!userId) {
    throw new Error('userId is required');
  }
  
  const {
    eventType,
    themeId,
    since,
    limit = DEFAULT_EVENTS_QUERY_LIMIT,
  } = options;

  // Validar y cap limit
  const safeLimit = Math.min(
    Math.max(1, Math.floor(limit)),
    MAX_EVENTS_QUERY_LIMIT
  );

  const query = { userId };

  if (eventType) {
    query.eventType = eventType;
  }

  if (themeId) {
    query.themeId = themeId;
  }

  if (since) {
    query.timestamp = { $gte: since };
  }

  return FocusTelemetryEvent
    .find(query)
    .sort({ timestamp: -1 })
    .limit(safeLimit)
    .lean();
}

/**
 * Obtener estadísticas agregadas de eventos de foco.
 * @param {Object} [options] - Opciones de filtrado
 * @param {Date} [options.since] - Desde fecha
 * @param {Date} [options.until] - Hasta fecha
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export async function getFocusEventStats(options = {}) {
  const { since, until } = options;

  const matchStage = {};
  if (since || until) {
    matchStage.timestamp = {};
    if (since) matchStage.timestamp.$gte = since;
    if (until) matchStage.timestamp.$lte = until;
  }

  const pipeline = [];
  
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push({
    $group: {
      _id: {
        eventType: '$eventType',
        themeId: '$themeId',
      },
      count: { $sum: 1 },
      uniqueUsers: { $addToSet: '$userId' },
    },
  });

  pipeline.push({
    $project: {
      _id: 0,
      eventType: '$_id.eventType',
      themeId: '$_id.themeId',
      count: 1,
      uniqueUsers: { $size: '$uniqueUsers' },
    },
  });

  pipeline.push({
    $sort: { count: -1 },
  });

  return FocusTelemetryEvent.aggregate(pipeline);
}
