/**
 * Modelo de Alerta de Emergencia - Registra cada alerta individual enviada
 * a contactos de emergencia para transparencia y análisis de patrones
 */
import mongoose from 'mongoose';

const emergencyAlertSchema = new mongoose.Schema({
  // Referencia al usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Referencia al evento de crisis relacionado (opcional)
  crisisEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrisisEvent',
    default: null,
    index: true
  },
  // Nivel de riesgo que activó la alerta
  riskLevel: {
    type: String,
    enum: ['MEDIUM', 'HIGH'],
    required: true,
    index: true
  },
  // Información del contacto al que se envió la alerta
  contact: {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: null
    },
    relationship: {
      type: String,
      default: null
    }
  },
  // Canales de envío
  channels: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String,
      messageId: String // ID del mensaje de email si está disponible
    },
    whatsapp: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      error: String,
      messageId: String // ID del mensaje de WhatsApp
    }
  },
  // Si es una alerta de prueba
  isTest: {
    type: Boolean,
    default: false,
    index: true
  },
  // Fecha de envío
  sentAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  // Estado general de la alerta
  status: {
    type: String,
    enum: ['sent', 'partial', 'failed'],
    default: 'sent',
    index: true
  },
  // Información del mensaje que activó la alerta (preview)
  triggerMessagePreview: {
    type: String,
    maxlength: 200
  },
  // Análisis de tendencias al momento de la alerta
  trendAnalysis: {
    rapidDecline: Boolean,
    sustainedLow: Boolean,
    isolation: Boolean,
    escalation: Boolean,
    warnings: [String]
  },
  // Metadatos adicionales
  metadata: {
    riskScore: Number,
    factors: [String],
    cooldownActive: Boolean, // Si había cooldown activo
    totalContactsNotified: Number // Total de contactos notificados en esta crisis
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
emergencyAlertSchema.index({ userId: 1, sentAt: -1 });
emergencyAlertSchema.index({ crisisEventId: 1 });
emergencyAlertSchema.index({ 'contact.contactId': 1 });
emergencyAlertSchema.index({ riskLevel: 1, sentAt: -1 });
emergencyAlertSchema.index({ status: 1, sentAt: -1 });
emergencyAlertSchema.index({ isTest: 1, sentAt: -1 });

// Método estático: obtener alertas de un usuario
emergencyAlertSchema.statics.getUserAlerts = function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    startDate,
    endDate,
    riskLevel,
    isTest = false,
    status
  } = options;

  const query = {
    userId,
    isTest: isTest === true ? true : { $ne: true } // Por defecto excluir pruebas
  };

  if (startDate || endDate) {
    query.sentAt = {};
    if (startDate) query.sentAt.$gte = new Date(startDate);
    if (endDate) query.sentAt.$lte = new Date(endDate);
  }

  if (riskLevel) {
    query.riskLevel = riskLevel;
  }

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ sentAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Método estático: obtener estadísticas de alertas de un usuario
emergencyAlertSchema.statics.getUserAlertStats = async function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const alerts = await this.find({
    userId,
    sentAt: { $gte: startDate },
    isTest: { $ne: true }
  }).lean();

  const stats = {
    total: alerts.length,
    byRiskLevel: {
      MEDIUM: 0,
      HIGH: 0
    },
    byStatus: {
      sent: 0,
      partial: 0,
      failed: 0
    },
    byChannel: {
      email: {
        sent: 0,
        failed: 0
      },
      whatsapp: {
        sent: 0,
        failed: 0
      }
    },
    byContact: {},
    byDay: {},
    averageContactsPerAlert: 0,
    mostActiveDay: null,
    mostActiveHour: null,
    hoursDistribution: {}
  };

  // Calcular estadísticas
  alerts.forEach(alert => {
    // Por nivel de riesgo
    stats.byRiskLevel[alert.riskLevel] = (stats.byRiskLevel[alert.riskLevel] || 0) + 1;

    // Por estado
    stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;

    // Por canal
    if (alert.channels.email.sent) {
      stats.byChannel.email.sent++;
    } else if (alert.channels.email.error) {
      stats.byChannel.email.failed++;
    }

    if (alert.channels.whatsapp.sent) {
      stats.byChannel.whatsapp.sent++;
    } else if (alert.channels.whatsapp.error) {
      stats.byChannel.whatsapp.failed++;
    }

    // Por contacto
    const contactKey = alert.contact.email;
    if (!stats.byContact[contactKey]) {
      stats.byContact[contactKey] = {
        name: alert.contact.name,
        total: 0,
        email: { sent: 0, failed: 0 },
        whatsapp: { sent: 0, failed: 0 }
      };
    }
    stats.byContact[contactKey].total++;
    if (alert.channels.email.sent) stats.byContact[contactKey].email.sent++;
    if (alert.channels.email.error) stats.byContact[contactKey].email.failed++;
    if (alert.channels.whatsapp.sent) stats.byContact[contactKey].whatsapp.sent++;
    if (alert.channels.whatsapp.error) stats.byContact[contactKey].whatsapp.failed++;

    // Por día
    const day = new Date(alert.sentAt).toISOString().split('T')[0];
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;

    // Por hora
    const hour = new Date(alert.sentAt).getHours();
    stats.hoursDistribution[hour] = (stats.hoursDistribution[hour] || 0) + 1;
  });

  // Calcular promedios y más activos
  if (alerts.length > 0) {
    const totalContacts = alerts.reduce((sum, alert) => 
      sum + (alert.metadata?.totalContactsNotified || 1), 0
    );
    stats.averageContactsPerAlert = Math.round((totalContacts / alerts.length) * 10) / 10;

    // Día más activo
    const dayEntries = Object.entries(stats.byDay);
    if (dayEntries.length > 0) {
      const mostActiveDayEntry = dayEntries.reduce((max, [day, count]) => 
        count > max[1] ? [day, count] : max
      );
      stats.mostActiveDay = {
        date: mostActiveDayEntry[0],
        count: mostActiveDayEntry[1]
      };
    }

    // Hora más activa
    const hourEntries = Object.entries(stats.hoursDistribution);
    if (hourEntries.length > 0) {
      const mostActiveHourEntry = hourEntries.reduce((max, [hour, count]) => 
        count > max[1] ? [hour, count] : max
      );
      stats.mostActiveHour = {
        hour: parseInt(mostActiveHourEntry[0]),
        count: mostActiveHourEntry[1]
      };
    }
  }

  return stats;
};

// Método estático: detectar patrones en las alertas
emergencyAlertSchema.statics.detectPatterns = async function(userId, days = 90) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const alerts = await this.find({
    userId,
    sentAt: { $gte: startDate },
    isTest: { $ne: true }
  }).sort({ sentAt: 1 }).lean();

  const patterns = {
    frequency: {
      increasing: false,
      decreasing: false,
      stable: true
    },
    riskLevelTrend: {
      escalating: false,
      improving: false,
      stable: true
    },
    timePatterns: {
      mostCommonDays: [],
      mostCommonHours: [],
      weekendVsWeekday: {
        weekend: 0,
        weekday: 0
      }
    },
    contactReliability: {},
    recommendations: []
  };

  if (alerts.length < 2) {
    patterns.recommendations.push('Necesitas más datos para detectar patrones');
    return patterns;
  }

  // Analizar frecuencia
  const recentAlerts = alerts.slice(-Math.min(10, alerts.length));
  const olderAlerts = alerts.slice(0, Math.max(0, alerts.length - 10));
  
  if (recentAlerts.length > 0 && olderAlerts.length > 0) {
    const recentFrequency = recentAlerts.length / (recentAlerts.length > 1 ? 
      (new Date(recentAlerts[recentAlerts.length - 1].sentAt) - new Date(recentAlerts[0].sentAt)) / (1000 * 60 * 60 * 24) : 1);
    const olderFrequency = olderAlerts.length / (olderAlerts.length > 1 ? 
      (new Date(olderAlerts[olderAlerts.length - 1].sentAt) - new Date(olderAlerts[0].sentAt)) / (1000 * 60 * 60 * 24) : 1);
    
    if (recentFrequency > olderFrequency * 1.2) {
      patterns.frequency.increasing = true;
      patterns.frequency.stable = false;
      patterns.recommendations.push('Se detectó un aumento en la frecuencia de alertas. Considera buscar apoyo profesional adicional.');
    } else if (recentFrequency < olderFrequency * 0.8) {
      patterns.frequency.decreasing = true;
      patterns.frequency.stable = false;
      patterns.recommendations.push('La frecuencia de alertas ha disminuido. ¡Sigue así!');
    }
  }

  // Analizar tendencia de nivel de riesgo
  const riskLevels = alerts.map(a => a.riskLevel === 'HIGH' ? 2 : 1);
  const recentRisk = riskLevels.slice(-Math.min(5, riskLevels.length));
  const olderRisk = riskLevels.slice(0, Math.max(0, riskLevels.length - 5));
  
  if (recentRisk.length > 0 && olderRisk.length > 0) {
    const recentAvg = recentRisk.reduce((a, b) => a + b, 0) / recentRisk.length;
    const olderAvg = olderRisk.reduce((a, b) => a + b, 0) / olderRisk.length;
    
    if (recentAvg > olderAvg + 0.3) {
      patterns.riskLevelTrend.escalating = true;
      patterns.riskLevelTrend.stable = false;
      patterns.recommendations.push('Se detectó una escalada en el nivel de riesgo. Es importante buscar ayuda profesional.');
    } else if (recentAvg < olderAvg - 0.3) {
      patterns.riskLevelTrend.improving = true;
      patterns.riskLevelTrend.stable = false;
      patterns.recommendations.push('El nivel de riesgo ha mejorado. ¡Continúa con las estrategias que te están ayudando!');
    }
  }

  // Analizar patrones de tiempo
  const dayCounts = {};
  const hourCounts = {};
  
  alerts.forEach(alert => {
    const date = new Date(alert.sentAt);
    const day = date.getDay(); // 0 = domingo, 6 = sábado
    const hour = date.getHours();
    
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    
    if (day === 0 || day === 6) {
      patterns.timePatterns.weekendVsWeekday.weekend++;
    } else {
      patterns.timePatterns.weekendVsWeekday.weekday++;
    }
  });

  // Días más comunes
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const sortedDays = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day, count]) => ({ day: dayNames[parseInt(day)], count }));
  patterns.timePatterns.mostCommonDays = sortedDays;

  // Horas más comunes
  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  patterns.timePatterns.mostCommonHours = sortedHours;

  // Analizar confiabilidad de contactos
  alerts.forEach(alert => {
    const contactKey = alert.contact.email;
    if (!patterns.contactReliability[contactKey]) {
      patterns.contactReliability[contactKey] = {
        name: alert.contact.name,
        total: 0,
        successful: 0,
        failed: 0
      };
    }
    patterns.contactReliability[contactKey].total++;
    if (alert.status === 'sent') {
      patterns.contactReliability[contactKey].successful++;
    } else if (alert.status === 'failed') {
      patterns.contactReliability[contactKey].failed++;
    }
  });

  return patterns;
};

// Eliminar modelo de caché si existe
if (mongoose.models.EmergencyAlert) {
  delete mongoose.models.EmergencyAlert;
}

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

export default EmergencyAlert;

