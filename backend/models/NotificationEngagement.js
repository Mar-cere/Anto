/**
 * Modelo de Engagement de Notificaciones
 * 
 * Rastrea el engagement del usuario con las notificaciones push
 * para analytics y optimización
 */
import mongoose from 'mongoose';

const notificationEngagementSchema = new mongoose.Schema({
  // Referencia al usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Tipo de notificación
  notificationType: {
    type: String,
    required: true,
    index: true
  },
  // Token push usado
  pushToken: {
    type: String,
    required: true
  },
  // Estado de la notificación
  status: {
    type: String,
    enum: ['sent', 'delivered', 'opened', 'dismissed', 'error'],
    default: 'sent',
    index: true
  },
  // Timestamp de envío
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Timestamp de entrega (si está disponible)
  deliveredAt: {
    type: Date,
    default: null
  },
  // Timestamp de apertura (cuando el usuario interactúa)
  openedAt: {
    type: Date,
    default: null
  },
  // Datos adicionales de la notificación
  notificationData: {
    title: String,
    body: String,
    data: mongoose.Schema.Types.Mixed
  },
  // Error si hubo alguno
  error: {
    type: String,
    default: null
  },
  // Metadata adicional
  metadata: {
    deviceType: String,
    appVersion: String,
    timeOfDay: String
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
notificationEngagementSchema.index({ userId: 1, sentAt: -1 });
notificationEngagementSchema.index({ notificationType: 1, status: 1 });
notificationEngagementSchema.index({ sentAt: -1 });

// Métodos estáticos para analytics
notificationEngagementSchema.statics.getEngagementStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        sentAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$notificationType',
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
        dismissed: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
        errors: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } }
      }
    },
    {
      $project: {
        notificationType: '$_id',
        total: 1,
        sent: 1,
        delivered: 1,
        opened: 1,
        dismissed: 1,
        errors: 1,
        deliveryRate: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$delivered', '$total'] }, 0] },
        openRate: { $cond: [{ $gt: ['$delivered', 0] }, { $divide: ['$opened', '$delivered'] }, 0] }
      }
    }
  ]);

  return stats;
};

notificationEngagementSchema.statics.getOverallStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        sentAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
        dismissed: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
        errors: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        sent: 1,
        delivered: 1,
        opened: 1,
        dismissed: 1,
        errors: 1,
        deliveryRate: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$delivered', '$total'] }, 0] },
        openRate: { $cond: [{ $gt: ['$delivered', 0] }, { $divide: ['$opened', '$delivered'] }, 0] }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    dismissed: 0,
    errors: 0,
    deliveryRate: 0,
    openRate: 0
  };
};

const NotificationEngagement = mongoose.models.NotificationEngagement || 
  mongoose.model('NotificationEngagement', notificationEngagementSchema);

export default NotificationEngagement;

