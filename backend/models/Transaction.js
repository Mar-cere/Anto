/**
 * Modelo de Transacción
 * 
 * Registra todas las transacciones de pago realizadas por los usuarios,
 * incluyendo suscripciones, pagos únicos y reembolsos.
 * Usa Mercado Pago como proveedor principal de pagos.
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // Usuario que realizó la transacción
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Tipo de transacción
  type: {
    type: String,
    enum: ['subscription', 'one-time', 'refund', 'upgrade', 'downgrade'],
    required: true,
    index: true,
  },

  // Monto de la transacción (en pesos chilenos para Mercado Pago)
  amount: {
    type: Number,
    required: true,
    min: 0,
  },

  // Moneda (CLP, USD, etc.)
  currency: {
    type: String,
    default: 'clp',
    uppercase: true,
  },

  // Estado de la transacción
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'canceled'],
    default: 'pending',
    index: true,
  },

  // Método de pago utilizado
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'other'],
    default: 'card',
  },

  // Proveedor de pago
  paymentProvider: {
    type: String,
    enum: ['mercadopago', 'paypal', 'transbank', 'flow', 'other'],
    default: 'mercadopago',
    index: true,
  },

  // ID de la transacción en el proveedor (Mercado Pago Payment ID, etc.)
  providerTransactionId: {
    type: String,
    index: true,
    sparse: true,
  },

  // ID de la suscripción relacionada (si aplica)
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
    index: true,
  },

  // Plan asociado (si aplica)
  plan: {
    type: String,
    enum: ['monthly', 'yearly', null],
    default: null,
  },

  // Descripción de la transacción
  description: {
    type: String,
    default: null,
  },

  // Metadatos adicionales (datos del cliente, dirección, etc.)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Información de error (si la transacción falló)
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
  },

  // Fecha de procesamiento
  processedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índices compuestos para consultas frecuentes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ providerTransactionId: 1, paymentProvider: 1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

// Método estático: obtener transacciones de un usuario
transactionSchema.statics.getUserTransactions = async function(userId, options = {}) {
  const { limit = 50, skip = 0, status, type } = options;
  
  const query = { userId: new mongoose.Types.ObjectId(userId) };
  if (status) query.status = status;
  if (type) query.type = type;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('subscriptionId', 'plan status')
    .lean();
};

// Método estático: obtener estadísticas de transacciones
transactionSchema.statics.getTransactionStats = async function(userId, startDate, endDate) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              '$amount',
              0
            ]
          }
        },
        completedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        refundedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
        },
        averageAmount: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              '$amount',
              null
            ]
          }
        },
      }
    }
  ]);

  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    refundedTransactions: 0,
    averageAmount: 0,
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;

