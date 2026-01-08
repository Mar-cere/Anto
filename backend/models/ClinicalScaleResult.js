/**
 * Modelo de Resultados de Escalas Clínicas
 * Almacena los resultados de escalas validadas (PHQ-9, GAD-7, etc.)
 */
import mongoose from 'mongoose';

const clinicalScaleResultSchema = new mongoose.Schema({
  // Referencia al usuario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Tipo de escala (PHQ9, GAD7, etc.)
  scaleType: {
    type: String,
    enum: ['PHQ9', 'GAD7'],
    required: true,
    index: true
  },
  // Puntuación total
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  // Puntuaciones por ítem (array de objetos con id y score)
  itemScores: [{
    itemId: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    question: String
  }],
  // Interpretación de la puntuación
  interpretation: {
    severity: {
      type: String,
      enum: ['Mínima', 'Leve', 'Moderada', 'Moderadamente severa', 'Severa', 'No determinado'],
      required: true
    },
    level: {
      type: String,
      required: true
    },
    recommendation: {
      type: String,
      required: true
    }
  },
  // Síntomas detectados (para análisis automático)
  detectedSymptoms: [{
    symptom: String,
    question: String,
    frequency: Number
  }],
  // Método de administración
  administrationMethod: {
    type: String,
    enum: ['manual', 'automatic', 'suggested'],
    default: 'manual'
  },
  // Notas adicionales
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Índices para optimizar consultas
clinicalScaleResultSchema.index({ userId: 1, scaleType: 1, createdAt: -1 });
clinicalScaleResultSchema.index({ userId: 1, createdAt: -1 });

// Método para obtener el progreso del usuario
clinicalScaleResultSchema.statics.getUserProgress = async function(userId, scaleType, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const results = await this.find({
    userId,
    scaleType,
    createdAt: { $gte: startDate }
  })
  .sort({ createdAt: 1 })
  .lean();
  
  if (results.length === 0) {
    return {
      hasData: false,
      trend: 'no_data',
      improvement: null,
      results: []
    };
  }
  
  // Calcular tendencia
  const firstScore = results[0].totalScore;
  const lastScore = results[results.length - 1].totalScore;
  const improvement = firstScore - lastScore;
  const improvementPercent = ((improvement / firstScore) * 100).toFixed(1);
  
  let trend = 'stable';
  if (improvement > 2) {
    trend = 'improving';
  } else if (improvement < -2) {
    trend = 'worsening';
  }
  
  // Calcular promedio
  const averageScore = results.reduce((sum, r) => sum + r.totalScore, 0) / results.length;
  
  return {
    hasData: true,
    trend,
    improvement: improvement > 0 ? improvement : 0,
    improvementPercent: improvement > 0 ? improvementPercent : '0',
    firstScore,
    lastScore,
    averageScore: averageScore.toFixed(1),
    totalAssessments: results.length,
    results: results.map(r => ({
      date: r.createdAt,
      score: r.totalScore,
      severity: r.interpretation.severity,
      recommendation: r.interpretation.recommendation
    }))
  };
};

const ClinicalScaleResult = mongoose.models.ClinicalScaleResult || 
  mongoose.model('ClinicalScaleResult', clinicalScaleResultSchema);

export default ClinicalScaleResult;

