/**
 * Middleware de Optimización de Queries
 * 
 * Proporciona helpers para optimizar consultas de MongoDB
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Agrega índices compuestos comunes si no existen
 * Esto se ejecuta una vez al iniciar la aplicación
 */
export const ensureIndexes = async () => {
  try {
    // Índices para User
    const User = mongoose.model('User');
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ createdAt: -1 });
    // Programador de notificaciones: usuarios con push habilitado (processScheduled, hábitos, inactivos)
    await User.collection.createIndex(
      { 'notificationPreferences.enabled': 1, pushToken: 1, 'stats.lastActive': 1 },
      {
        partialFilterExpression: {
          'notificationPreferences.enabled': true,
          pushToken: { $exists: true, $ne: null },
        },
      }
    );

    // Índices para Message
    const Message = mongoose.model('Message');
    await Message.collection.createIndex({ userId: 1, createdAt: -1 });
    await Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
    await Message.collection.createIndex({ 'metadata.context.emotional.mainEmotion': 1 });

    // Índices para Task
    const Task = mongoose.model('Task');
    await Task.collection.createIndex({ userId: 1, dueDate: 1, status: 1 });
    await Task.collection.createIndex({ userId: 1, createdAt: -1 });
    await Task.collection.createIndex({ userId: 1, status: 1, dueDate: 1 });

    // Índices para Habit
    const Habit = mongoose.model('Habit');
    await Habit.collection.createIndex({ userId: 1, createdAt: -1 });
    // Nota: isActive es un virtual, no indexable.
    await Habit.collection.createIndex({ userId: 1, 'status.archived': 1 });
    await Habit.collection.createIndex({ userId: 1, 'reminder.enabled': 1, 'reminder.lastNotified': 1 });
    await Habit.collection.createIndex({ 'reminder.time': 1 });
    // Índice parcial: hábitos activos con recordatorio habilitado (scheduler)
    await Habit.collection.createIndex(
      { userId: 1, 'reminder.lastNotified': 1 },
      {
        partialFilterExpression: {
          'reminder.enabled': true,
          'status.archived': { $ne: true },
          deletedAt: { $exists: false },
        },
      }
    );

    // Índices para CrisisEvent
    const CrisisEvent = mongoose.model('CrisisEvent');
    await CrisisEvent.collection.createIndex({ userId: 1, detectedAt: -1 });
    await CrisisEvent.collection.createIndex({ userId: 1, severity: 1, detectedAt: -1 });

    // Índices para Subscription
    const Subscription = mongoose.model('Subscription');
    await Subscription.collection.createIndex({ userId: 1 });
    await Subscription.collection.createIndex({ status: 1, trialEndDate: 1 });

    logger.info('✅ Índices de base de datos verificados/creados');
  } catch (error) {
    logger.warn('⚠️ Error al crear índices (puede ser normal si ya existen):', { error: error.message });
  }
};

/**
 * Helper para optimizar queries con proyección y límites
 */
export const optimizeQuery = (query, options = {}) => {
  const {
    select = null,
    limit = null,
    skip = null,
    sort = null,
    lean = false
  } = options;

  if (select) {
    query = query.select(select);
  }

  if (sort) {
    query = query.sort(sort);
  }

  if (skip) {
    query = query.skip(skip);
  }

  if (limit) {
    query = query.limit(limit);
  }

  if (lean) {
    query = query.lean();
  }

  return query;
};

export default {
  ensureIndexes,
  optimizeQuery
};

