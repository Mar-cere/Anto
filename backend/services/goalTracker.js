/**
 * Rastreador de Metas - Gestiona el seguimiento y progreso de las metas del usuario
 */
import mongoose from 'mongoose';
import UserGoals from '../models/UserGoals.js';

class GoalTracker {
  constructor() {
    // Constantes de configuración
    this.INTENSITY_DEFAULT = 5;
  }
  
  // Helper: validar que el userId es válido
  isValidUserId(userId) {
    return userId && (
      typeof userId === 'string' || 
      userId instanceof mongoose.Types.ObjectId ||
      mongoose.Types.ObjectId.isValid(userId)
    );
  }
  
  // Helper: validar que el mensaje tiene contenido válido
  isValidMessage(message) {
    return message && typeof message.content === 'string' && message.content.trim().length > 0;
  }
  
  // Helper: buscar o inicializar objetivos del usuario
  async findOrInitializeUserGoals(userId) {
    let userGoals = await UserGoals.findOne({ userId });
    if (!userGoals) {
      userGoals = await this.initializeUserGoals(userId);
    }
    return userGoals;
  }
  /**
   * Rastrea el progreso del usuario basado en el mensaje y análisis
   * @param {string|ObjectId} userId - ID del usuario
   * @param {Object} data - Debe contener 'message' y 'analysis'
   * @returns {Promise<Object|null>} Objetivos del usuario o null si hay error
   */
  async trackProgress(userId, data) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      const { message, analysis } = data;
      if (!this.isValidMessage(message)) {
        throw new Error('El mensaje debe tener contenido válido');
      }
      
      const userGoals = await this.findOrInitializeUserGoals(userId);
      await this.updateGoalProgress(userId, message, analysis);
      
      return userGoals;
    } catch (error) {
      console.error('[GoalTracker] Error tracking progress:', error, { userId, data });
      return null;
    }
  }

  /**
   * Actualiza el progreso del usuario basado en el contexto
   * @param {string|ObjectId} userId - ID del usuario
   * @param {Object} data - Debe contener 'message' y 'context'
   * @returns {Promise<Object|null>} Objetivos del usuario actualizados o null si hay error
   */
  async updateProgress(userId, data) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      const { message, context } = data;
      if (!this.isValidMessage(message)) {
        throw new Error('El mensaje debe tener contenido válido');
      }
      
      await this.findOrInitializeUserGoals(userId);
      
      // Calcular actualizaciones basadas en el contexto
      const updates = this.calculateProgressUpdates(message, context);
      
      // Actualizar (Mongoose timestamps maneja updatedAt automáticamente)
      return await UserGoals.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true }
      );
    } catch (error) {
      console.error('[GoalTracker] Error updating progress:', error, { userId, data });
      return null;
    }
  }

  /**
   * Inicializa los objetivos del usuario si no existen
   * @param {string|ObjectId} userId - ID del usuario
   * @returns {Promise<Object|null>} Documento de objetivos creado o null si hay error
   */
  async initializeUserGoals(userId) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      // Crear documento inicial (Mongoose timestamps maneja createdAt y updatedAt automáticamente)
      return await UserGoals.create({
        userId,
        goals: []
      });
    } catch (error) {
      console.error('[GoalTracker] Error initializing user goals:', error, { userId });
      return null;
    }
  }

  /**
   * Calcula las actualizaciones de progreso basadas en el mensaje y contexto
   * @param {Object} message - Mensaje del usuario
   * @param {Object} context - Contexto del mensaje (emocional y contextual)
   * @returns {Object} Actualizaciones para el progreso
   */
  calculateProgressUpdates(message, context) {
    const updates = {
      'progress.lastInteraction': new Date()
    };
    
    // Actualizar estado emocional si está disponible
    if (context?.emotional?.mainEmotion) {
      updates['progress.emotionalState'] = {
        emotion: context.emotional.mainEmotion,
        intensity: context.emotional.intensity || this.INTENSITY_DEFAULT,
        timestamp: new Date()
      };
    }
    
    // Actualizar temas activos si están disponibles
    if (context?.contextual?.topics) {
      updates['progress.activeTopics'] = context.contextual.topics;
    }
    
    return updates;
  }

  /**
   * Actualiza el progreso de los objetivos del usuario con una nueva interacción
   * @param {string|ObjectId} userId - ID del usuario
   * @param {Object} message - Mensaje del usuario
   * @param {Object} analysis - Análisis del mensaje
   * @returns {Promise<Object|null>} Documento actualizado o null si hay error
   */
  async updateGoalProgress(userId, message, analysis) {
    try {
      if (!this.isValidUserId(userId)) {
        throw new Error('userId válido es requerido');
      }
      
      if (!this.isValidMessage(message)) {
        throw new Error('El mensaje debe tener contenido válido');
      }
      
      // Actualizar con nueva interacción (Mongoose timestamps maneja updatedAt automáticamente)
      const update = {
        $push: {
          'interactions': {
            timestamp: new Date(),
            content: message.content,
            analysis
          }
        }
      };
      
      return await UserGoals.findOneAndUpdate(
        { userId },
        update,
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('[GoalTracker] Error updating goal progress:', error, { userId, message, analysis });
      return null;
    }
  }
}

export default new GoalTracker(); 