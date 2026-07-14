/**
 * Modelo de telemetría para sesiones programadas (#15).
 * Registra eventos de notificaciones enviadas, sesiones iniciadas, y métricas de adherencia.
 */
const mongoose = require('mongoose');

const scheduledSessionEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'sessionId debe tener al menos 1 caracter'],
      maxlength: [128, 'sessionId no puede exceder 128 caracteres'],
      validate: {
        validator: function (v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'sessionId debe ser una cadena no vacía',
      },
    },
    eventType: {
      type: String,
      required: true,
      enum: {
        values: ['notification_sent', 'session_started', 'session_skipped'],
        message: 'eventType debe ser notification_sent, session_started o session_skipped',
      },
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    metadata: {
      responseLatency: {
        type: Number,
        default: null,
        min: [0, 'responseLatency no puede ser negativo'],
        max: [3600000, 'responseLatency no puede exceder 1 hora (3600000 ms)'],
        validate: {
          validator: function (v) {
            if (v === null || v === undefined) return true;
            return Number.isFinite(v) && v >= 0 && v <= 3600000;
          },
          message: 'responseLatency debe ser un número finito entre 0 y 3600000',
        },
      },
      originatedFromNotification: {
        type: Boolean,
        default: false,
      },
      conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null,
      },
      platform: {
        type: String,
        enum: ['ios', 'android', 'web', 'unknown'],
        default: 'unknown',
      },
      appVersion: {
        type: String,
        default: null,
        maxlength: [50, 'appVersion no puede exceder 50 caracteres'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos para queries de análisis
scheduledSessionEventSchema.index({ userId: 1, sessionId: 1, timestamp: -1 });
scheduledSessionEventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
scheduledSessionEventSchema.index({ eventType: 1, timestamp: -1 });

// Índice TTL opcional para limpieza automática de datos antiguos (retener 90 días)
// Descomentado para producción si se desea limpieza automática
// scheduledSessionEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 días

/**
 * Método estático para registrar un evento.
 * @param {Object} eventData - Datos del evento
 * @returns {Promise<ScheduledSessionEvent>} Evento creado
 */
scheduledSessionEventSchema.statics.recordEvent = async function (eventData) {
  try {
    // Validar que eventData es un objeto
    if (!eventData || typeof eventData !== 'object' || Array.isArray(eventData)) {
      throw new Error('eventData debe ser un objeto válido');
    }

    // Validar campos requeridos
    if (!eventData.userId) {
      throw new Error('userId es requerido');
    }

    if (!eventData.sessionId || typeof eventData.sessionId !== 'string') {
      throw new Error('sessionId es requerido y debe ser una cadena');
    }

    if (!eventData.eventType || typeof eventData.eventType !== 'string') {
      throw new Error('eventType es requerido y debe ser una cadena');
    }

    const event = new this(eventData);
    await event.save();
    return event;
  } catch (error) {
    console.error('[ScheduledSessionEvent.recordEvent] Error:', error);
    throw error;
  }
};

/**
 * Método estático para obtener estadísticas de adherencia.
 * @param {Object} filters - Filtros opcionales (userId, startDate, endDate)
 * @returns {Promise<Object>} Estadísticas agregadas
 */
scheduledSessionEventSchema.statics.getAdherenceStats = async function (filters = {}) {
  try {
    // Validar que filters es un objeto
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
      filters = {};
    }

    const match = {};

    // Validar y agregar userId si presente
    if (filters.userId) {
      try {
        match.userId = mongoose.Types.ObjectId(filters.userId);
      } catch (error) {
        console.warn('[getAdherenceStats] Invalid userId:', filters.userId);
        throw new Error('userId inválido');
      }
    }

    // Validar y agregar filtros de fecha
    if (filters.startDate || filters.endDate) {
      match.timestamp = {};
      
      if (filters.startDate) {
        try {
          const startDate = new Date(filters.startDate);
          if (isNaN(startDate.getTime())) {
            throw new Error('startDate inválida');
          }
          match.timestamp.$gte = startDate;
        } catch (error) {
          console.warn('[getAdherenceStats] Invalid startDate:', filters.startDate);
          throw new Error('startDate inválida');
        }
      }
      
      if (filters.endDate) {
        try {
          const endDate = new Date(filters.endDate);
          if (isNaN(endDate.getTime())) {
            throw new Error('endDate inválida');
          }
          match.timestamp.$lte = endDate;
        } catch (error) {
          console.warn('[getAdherenceStats] Invalid endDate:', filters.endDate);
          throw new Error('endDate inválida');
        }
      }
    }

    const stats = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          avgResponseLatency: { $avg: '$metadata.responseLatency' },
        },
      },
    ]);

    // Validar que stats es un array
    if (!Array.isArray(stats)) {
      console.warn('[getAdherenceStats] Aggregate returned non-array');
      stats = [];
    }

    // Transformar a objeto más legible
    const result = {
      notificationsSent: 0,
      sessionsStarted: 0,
      sessionsSkipped: 0,
      avgResponseLatency: null,
      adherenceRate: 0,
    };

    stats.forEach((stat) => {
      // Validar que stat es un objeto válido
      if (!stat || typeof stat !== 'object' || !stat._id) {
        return;
      }

      const count = Number(stat.count) || 0;

      if (stat._id === 'notification_sent') {
        result.notificationsSent = count;
      } else if (stat._id === 'session_started') {
        result.sessionsStarted = count;
        // Validar avgResponseLatency
        if (stat.avgResponseLatency !== null && stat.avgResponseLatency !== undefined) {
          const latency = Number(stat.avgResponseLatency);
          if (!isNaN(latency) && isFinite(latency)) {
            result.avgResponseLatency = latency;
          }
        }
      } else if (stat._id === 'session_skipped') {
        result.sessionsSkipped = count;
      }
    });

    // Calcular tasa de adherencia (sesiones iniciadas / notificaciones enviadas)
    if (result.notificationsSent > 0) {
      result.adherenceRate = result.sessionsStarted / result.notificationsSent;
    }

    return result;
  } catch (error) {
    console.error('[ScheduledSessionEvent.getAdherenceStats] Error:', error);
    throw error;
  }
};

const ScheduledSessionEvent = mongoose.model('ScheduledSessionEvent', scheduledSessionEventSchema);

module.exports = ScheduledSessionEvent;
