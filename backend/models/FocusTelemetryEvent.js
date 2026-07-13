/**
 * Telemetría de eventos de foco de acompañamiento (#2 Fase 3).
 * Captura interacciones del usuario con el sistema de focos.
 */
import mongoose from 'mongoose';

const focusTelemetryEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'focus_started',         // Usuario inicia un nuevo foco
        'focus_paused',          // Usuario pausa el foco
        'focus_resumed',         // Usuario reanuda un foco pausado
        'focus_completed',       // Usuario completa el foco
        'focus_progress_viewed', // Usuario visualiza pantalla de progreso
        'focus_onboarding_opened', // Usuario abre onboarding de selección
        'focus_onboarding_skipped', // Usuario omite onboarding
        'focus_dashboard_viewed', // Usuario ve el foco en dashboard
      ],
      index: true,
    },
    themeId: {
      type: String,
      enum: ['anxiety', 'boundaries', 'selfCare'],
      index: true,
    },
    metadata: {
      // Metadata específica del evento (flexible)
      weekNumber: { type: Number, min: 1 },
      durationWeeks: { type: Number, min: 1, max: 12 },
      hasCustomGoal: { type: Boolean },
      previousStatus: { type: String, enum: ['active', 'paused', 'completed'] },
      newStatus: { type: String, enum: ['active', 'paused', 'completed'] },
      progress: { type: Number, min: 0, max: 100 },
      // Contexto de origen del evento
      source: { type: String, enum: ['dashboard', 'onboarding', 'progress_screen', 'api'] },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Índices compuestos para analytics
focusTelemetryEventSchema.index({ userId: 1, timestamp: -1 });
focusTelemetryEventSchema.index({ eventType: 1, timestamp: -1 });
focusTelemetryEventSchema.index({ themeId: 1, eventType: 1, timestamp: -1 });

export default mongoose.model('FocusTelemetryEvent', focusTelemetryEventSchema);
