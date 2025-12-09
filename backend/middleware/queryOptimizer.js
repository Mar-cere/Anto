/**
 * Middleware de Optimización de Queries
 * 
 * Proporciona helpers para optimizar consultas de MongoDB
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';

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
    await Habit.collection.createIndex({ userId: 1, isActive: 1 });

    // Índices para CrisisEvent
    const CrisisEvent = mongoose.model('CrisisEvent');
    await CrisisEvent.collection.createIndex({ userId: 1, detectedAt: -1 });
    await CrisisEvent.collection.createIndex({ userId: 1, severity: 1, detectedAt: -1 });

    // Índices para Subscription
    const Subscription = mongoose.model('Subscription');
    await Subscription.collection.createIndex({ userId: 1 });
    await Subscription.collection.createIndex({ status: 1, trialEndDate: 1 });

    console.log('✅ Índices de base de datos verificados/creados');
  } catch (error) {
    console.warn('⚠️ Error al crear índices (puede ser normal si ya existen):', error.message);
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

