/**
 * Servicio de Seguimiento Post-Crisis - Gestiona seguimientos automáticos
 * después de eventos de crisis detectados
 */
import CrisisEvent from '../models/CrisisEvent.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import pushNotificationService from './pushNotificationService.js';
import {
  CHECK_INTERVAL_MS,
  FOLLOW_UP_INTERVALS,
  FIRST_FOLLOW_UP_HOURS_BY_RISK,
  generateFollowUpMessage
} from './crisisFollowUp/index.js';

class CrisisFollowUpService {
  constructor() {
    this.FOLLOW_UP_INTERVALS = FOLLOW_UP_INTERVALS;
  }

  /**
   * Programa seguimientos automáticos para un evento de crisis
   * @param {string} crisisEventId - ID del evento de crisis
   * @param {string} riskLevel - Nivel de riesgo
   * @returns {Promise<Object>} Resultado del programado
   */
  async scheduleFollowUps(crisisEventId, riskLevel) {
    try {
      const crisisEvent = await CrisisEvent.findById(crisisEventId);
      if (!crisisEvent) {
        return { success: false, reason: 'Evento de crisis no encontrado' };
      }

      const firstFollowUpHours = FIRST_FOLLOW_UP_HOURS_BY_RISK[riskLevel] ?? 24;

      // Programar primer seguimiento
      await crisisEvent.scheduleFollowUp(firstFollowUpHours);

      console.log(`[CrisisFollowUpService] ✅ Seguimientos programados para crisis ${crisisEventId} (${riskLevel})`);
      
      return {
        success: true,
        firstFollowUpAt: crisisEvent.followUp.scheduledAt,
        riskLevel
      };
    } catch (error) {
      console.error('[CrisisFollowUpService] Error programando seguimientos:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Procesa seguimientos pendientes y envía mensajes de verificación
   * @returns {Promise<Object>} Resumen de seguimientos procesados
   */
  async processPendingFollowUps() {
    try {
      const pendingFollowUps = await CrisisEvent.getPendingFollowUps();
      
      const results = {
        total: pendingFollowUps.length,
        processed: 0,
        skipped: 0,
        errors: 0,
        details: []
      };

      for (const crisisEvent of pendingFollowUps) {
        try {
          // Verificar si el usuario ha enviado mensajes recientes
          const recentMessages = await this.checkRecentUserActivity(crisisEvent.userId);
          
          if (recentMessages.hasRecentActivity) {
            // Usuario está activo, marcar seguimiento como completado
            await CrisisEvent.findByIdAndUpdate(crisisEvent._id, {
              'followUp.completed': true,
              'followUp.completedAt': new Date(),
              outcome: recentMessages.emotionalState === 'improved' ? 'resolved' : 'ongoing'
            });
            
            results.processed++;
            results.details.push({
              crisisEventId: crisisEvent._id.toString(),
              userId: crisisEvent.userId._id.toString(),
              action: 'marked_completed',
              reason: 'Usuario activo recientemente'
            });
          } else {
            // Usuario no está activo, enviar mensaje de seguimiento
            const followUpSent = await this.sendFollowUpMessage(crisisEvent);
            
            if (followUpSent) {
              // Registrar que se envió el seguimiento
              await CrisisEvent.findByIdAndUpdate(crisisEvent._id, {
                $push: {
                  'followUp.followUpMessages': {
                    sentAt: new Date(),
                    responseReceived: false
                  }
                }
              });
              
              results.processed++;
              results.details.push({
                crisisEventId: crisisEvent._id.toString(),
                userId: crisisEvent.userId._id.toString(),
                action: 'follow_up_sent'
              });
            } else {
              results.skipped++;
            }
          }
        } catch (error) {
          console.error(`[CrisisFollowUpService] Error procesando seguimiento ${crisisEvent._id}:`, error);
          results.errors++;
          results.details.push({
            crisisEventId: crisisEvent._id.toString(),
            action: 'error',
            error: error.message
          });
        }
      }

      console.log(`[CrisisFollowUpService] 📋 Seguimientos procesados: ${results.processed}/${results.total}`);
      return results;
    } catch (error) {
      console.error('[CrisisFollowUpService] Error procesando seguimientos:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario ha tenido actividad reciente
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estado de actividad reciente
   */
  async checkRecentUserActivity(userId) {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentMessages = await Message.find({
        userId,
        role: 'user',
        createdAt: { $gte: last24Hours }
      })
        .select('metadata.context.emotional createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (recentMessages.length === 0) {
        return {
          hasRecentActivity: false,
          messageCount: 0
        };
      }

      // Analizar estado emocional reciente
      const recentEmotions = recentMessages
        .map(msg => msg.metadata?.context?.emotional)
        .filter(e => e);

      const averageIntensity = recentEmotions.length > 0
        ? recentEmotions.reduce((sum, e) => sum + (e.intensity || 5), 0) / recentEmotions.length
        : 5;

      // Determinar si mejoró (intensidad menor) o empeoró
      const emotionalState = averageIntensity < 5 ? 'improved' : 
                            averageIntensity > 7 ? 'worsened' : 'stable';

      return {
        hasRecentActivity: true,
        messageCount: recentMessages.length,
        averageIntensity,
        emotionalState
      };
    } catch (error) {
      console.error('[CrisisFollowUpService] Error verificando actividad:', error);
      return { hasRecentActivity: false, error: error.message };
    }
  }

  /**
   * Envía un mensaje de seguimiento al usuario
   * @param {Object} crisisEvent - Evento de crisis
   * @returns {Promise<boolean>} true si se envió exitosamente
   */
  async sendFollowUpMessage(crisisEvent) {
    try {
      const userId = crisisEvent.userId._id || crisisEvent.userId;
      const message = generateFollowUpMessage(crisisEvent);
      
      // Obtener usuario con token push
      const user = await User.findById(userId).select('+pushToken');
      
      if (!user || !user.pushToken) {
        console.log(`[CrisisFollowUpService] ⚠️ Usuario ${userId} no tiene token push registrado`);
        return false;
      }

      // Calcular horas desde la crisis
      const hoursSinceCrisis = Math.floor(
        (Date.now() - new Date(crisisEvent.detectedAt).getTime()) / (1000 * 60 * 60)
      );

      // Enviar notificación push
      const result = await pushNotificationService.sendFollowUp(
        user.pushToken,
        {
          hoursSinceCrisis,
          message: message.substring(0, 200), // Limitar longitud
        }
      );

      if (result.success) {
        console.log(`[CrisisFollowUpService] ✅ Notificación push de seguimiento enviada a usuario ${userId}`);
        return true;
      } else {
        console.error(`[CrisisFollowUpService] ❌ Error enviando notificación push: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('[CrisisFollowUpService] Error enviando mensaje de seguimiento:', error);
      return false;
    }
  }

  /**
   * Inicia el servicio de seguimiento (debe llamarse al iniciar el servidor)
   */
  start() {
    // Procesar seguimientos pendientes cada hora
    setInterval(() => {
      this.processPendingFollowUps().catch(err => {
        console.error('[CrisisFollowUpService] Error en intervalo de seguimiento:', err);
      });
    }, CHECK_INTERVAL_MS);

    // Procesar inmediatamente al iniciar
    this.processPendingFollowUps().catch(err => {
      console.error('[CrisisFollowUpService] Error en procesamiento inicial:', err);
    });

    console.log('[CrisisFollowUpService] ✅ Servicio de seguimiento iniciado');
  }
}

// Singleton instance
const crisisFollowUpService = new CrisisFollowUpService();
export default crisisFollowUpService;

