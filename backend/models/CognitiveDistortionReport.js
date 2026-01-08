/**
 * Modelo de Reporte de Distorsiones Cognitivas
 * Almacena distorsiones cognitivas detectadas para análisis y reportes
 */
import mongoose from 'mongoose';

const cognitiveDistortionReportSchema = new mongoose.Schema({
  // Referencia al usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Referencia al mensaje donde se detectó
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    index: true
  },
  // Contenido del mensaje (para contexto)
  messageContent: {
    type: String,
    maxlength: 2000
  },
  // Distorsiones detectadas
  distortions: [{
    type: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    matchedPattern: String
  }],
  // Distorsión primaria (la más prominente)
  primaryDistortion: {
    type: {
      type: String
    },
    name: String,
    confidence: Number,
    intervention: String
  },
  // Análisis emocional asociado
  emotionalContext: {
    emotion: String,
    intensity: Number
  },
  // Fecha de detección
  detectedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
cognitiveDistortionReportSchema.index({ userId: 1, detectedAt: -1 });
cognitiveDistortionReportSchema.index({ userId: 1, 'primaryDistortion.type': 1 });

// Método estático para obtener estadísticas de distorsiones
cognitiveDistortionReportSchema.statics.getUserStatistics = async function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const reports = await this.find({
    userId,
    detectedAt: { $gte: startDate }
  }).lean();
  
  if (reports.length === 0) {
    return {
      totalDetections: 0,
      mostCommon: [],
      frequencyByType: {},
      trend: 'no_data'
    };
  }
  
  // Contar frecuencia por tipo
  const frequencyByType = {};
  reports.forEach(report => {
    if (report.primaryDistortion?.type) {
      const type = report.primaryDistortion.type;
      frequencyByType[type] = (frequencyByType[type] || 0) + 1;
    }
  });
  
  // Obtener las más comunes
  const mostCommon = Object.entries(frequencyByType)
    .map(([type, count]) => ({
      type,
      count,
      percentage: ((count / reports.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calcular tendencia (últimos 7 días vs anteriores)
  const last7Days = reports.filter(r => 
    new Date(r.detectedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const previous7Days = reports.filter(r => {
    const date = new Date(r.detectedAt);
    return date >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
           date < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }).length;
  
  let trend = 'stable';
  if (last7Days > previous7Days * 1.2) {
    trend = 'increasing';
  } else if (last7Days < previous7Days * 0.8) {
    trend = 'decreasing';
  }
  
  return {
    totalDetections: reports.length,
    mostCommon,
    frequencyByType,
    trend,
    averagePerWeek: (reports.length / (days / 7)).toFixed(1),
    last7Days,
    previous7Days
  };
};

const CognitiveDistortionReport = mongoose.models.CognitiveDistortionReport || 
  mongoose.model('CognitiveDistortionReport', cognitiveDistortionReportSchema);

export default CognitiveDistortionReport;

