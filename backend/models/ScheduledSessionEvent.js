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
      maxlength: [128, 'sessionId no puede exceder 128 caracteres'],
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
        validate: {
          validator: function (v) {
            if (v === null || v === undefined) return true;
            return Number.isFinite(v);
          },
          message: 'responseLatency debe ser un número finito',
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
    const match = {};

    if (filters.userId) {
      match.userId = mongoose.Types.ObjectId(filters.userId);
    }

    if (filters.startDate || filters.endDate) {
      match.timestamp = {};
      if (filters.startDate) {
        match.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        match.timestamp.$lte = new Date(filters.endDate);
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

    // Transformar a objeto más legible
    const result = {
      notificationsSent: 0,
      sessionsStarted: 0,
      sessionsSkipped: 0,
      avgResponseLatency: null,
      adherenceRate: 0,
    };

    stats.forEach((stat) => {
      if (stat._id === 'notification_sent') {
        result.notificationsSent = stat.count;
      } else if (stat._id === 'session_started') {
        result.sessionsStarted = stat.count;
        result.avgResponseLatency = stat.avgResponseLatency;
      } else if (stat._id === 'session_skipped') {
        result.sessionsSkipped = stat.count;
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
