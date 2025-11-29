/**
 * Modelo de Suscripción
 * 
 * Gestiona las suscripciones premium de los usuarios,
 * incluyendo información de Mercado Pago, períodos de facturación,
 * y estado de cancelación.
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  // Usuario propietario de la suscripción
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },

  // Estado de la suscripción
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired'],
    default: 'trialing',
    index: true,
  },

  // Plan de suscripción
  plan: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'semestral', 'yearly'],
    required: true,
    index: true,
  },

  // Fecha de inicio del período actual
  currentPeriodStart: {
    type: Date,
    required: true,
  },

  // Fecha de fin del período actual
  currentPeriodEnd: {
    type: Date,
    required: true,
    index: true,
  },

  // Si la suscripción se cancelará al final del período
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },

  // Fecha de cancelación
  canceledAt: {
    type: Date,
    default: null,
  },

  // Fecha de finalización (cuando realmente terminó)
  endedAt: {
    type: Date,
    default: null,
  },

  // IDs de Mercado Pago
  mercadopagoSubscriptionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },

  mercadopagoCustomerId: {
    type: String,
    index: true,
  },

  mercadopagoTransactionId: {
    type: String,
    index: true,
  },

  mercadopagoPreferenceId: {
    type: String,
    index: true,
  },

  // Fecha de inicio del trial (si aplica)
  trialStart: {
    type: Date,
    default: null,
  },

  // Fecha de fin del trial (si aplica)
  trialEnd: {
    type: Date,
    default: null,
  },

  // Metadatos adicionales
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índices adicionales
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });

// Virtual: verificar si la suscripción está activa
subscriptionSchema.virtual('isActive').get(function() {
  if (this.status !== 'active' && this.status !== 'trialing') {
    return false;
  }
  const now = new Date();
  return now <= this.currentPeriodEnd;
});

// Virtual: verificar si está en trial
subscriptionSchema.virtual('isInTrial').get(function() {
  if (!this.trialStart || !this.trialEnd) {
    return false;
  }
  const now = new Date();
  return now >= this.trialStart && now <= this.trialEnd && this.status === 'trialing';
});

// Virtual: días restantes en el período actual
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.currentPeriodEnd) {
    return 0;
  }
  const now = new Date();
  const diff = this.currentPeriodEnd - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Método de instancia: cancelar suscripción
subscriptionSchema.methods.cancel = async function(cancelImmediately = false) {
  this.cancelAtPeriodEnd = !cancelImmediately;
  this.canceledAt = new Date();
  
  if (cancelImmediately) {
    this.status = 'canceled';
    this.endedAt = new Date();
  }
  
  return await this.save();
};

// Método de instancia: reactivar suscripción
subscriptionSchema.methods.reactivate = async function() {
  this.cancelAtPeriodEnd = false;
  this.canceledAt = null;
  this.status = 'active';
  return await this.save();
};

// Método estático: encontrar suscripción activa por usuario
subscriptionSchema.statics.findActiveByUserId = async function(userId) {
  return await this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gte: new Date() }
  });
};

// Método estático: encontrar suscripciones que expiran pronto
subscriptionSchema.statics.findExpiringSoon = async function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return await this.find({
    status: 'active',
    currentPeriodEnd: { $lte: date, $gte: new Date() },
    cancelAtPeriodEnd: false
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;

