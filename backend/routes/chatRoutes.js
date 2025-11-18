/**
 * Rutas de Chat - Gestiona conversaciones, mensajes y análisis emocional/contextual
 */
import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken as protect } from '../middleware/auth.js';
import {
  Conversation,
  Message,
  TherapeuticRecord
} from '../models/index.js';
import {
  contextAnalyzer,
  emotionalAnalyzer,
  openaiService,
  progressTracker,
  userProfileService
} from '../services/index.js';
import { HISTORY_LIMITS } from '../constants/openai.js';
import { evaluateSuicideRisk } from '../constants/crisis.js';
import emergencyAlertService from '../services/emergencyAlertService.js';

const router = express.Router();

// Constantes de configuración
const LIMITE_MENSAJES = 100; // Aumentado de 50 a 100 para permitir conversaciones más largas
const VENTANA_CONTEXTO = 30 * 60 * 1000; // 30 minutos en milisegundos
const HISTORIAL_LIMITE = 10; // Número de mensajes para contexto

// Helper: validar formato de ObjectId (reutilizable)
const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id);
};

// Middleware: validar formato de conversationId
const validarConversationId = (req, res, next) => {
  const { conversationId } = req.params;
  
  if (!conversationId) {
    return res.status(400).json({
      message: 'ID de conversación requerido'
    });
  }

  if (!isValidObjectId(conversationId)) {
    return res.status(400).json({
      message: 'ID de conversación inválido'
    });
  }
  next();
};

// Middleware: validar que la conversación existe y pertenece al usuario
const validarConversacion = async (req, res, next) => {
  const { conversationId } = req.params;
  const conversation = await Conversation.findOne({ 
    _id: conversationId, 
    userId: req.user._id 
  });
  
  if (!conversation) {
    return res.status(404).json({ message: 'Conversación no encontrada' });
  }
  
  req.conversation = conversation;
  next();
};

// Obtener mensajes de una conversación (paginado)
router.get('/conversations/:conversationId', protect, validarConversationId, validarConversacion, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      status, 
      role 
    } = req.query;

    const query = {
      conversationId,
      userId: req.user._id,
      ...(status && { 'metadata.status': status }),
      ...(role && { role })
    };

    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Message.countDocuments(query)
    ]);

    res.json({
      messages: messages.reverse(),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({
      message: 'Error al obtener el historial de mensajes',
      error: error.message
    });
  }
});

// Crear nueva conversación con mensaje de bienvenida
router.post('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Crear conversación
    const conversation = new Conversation({ userId });
    await conversation.save();

    // Generar y guardar mensaje de bienvenida personalizado
    const userPreferences = await userProfileService.getPersonalizedPrompt(userId);
    const welcomeMessage = new Message({
      userId,
      content: await openaiService.generarSaludoPersonalizado(userPreferences),
      role: 'system',
      conversationId: conversation._id,
      metadata: {
        context: {
          preferences: userPreferences
        }
      }
    });
    await welcomeMessage.save();

    res.status(201).json({
      conversationId: conversation._id.toString(),
      message: welcomeMessage
    });
  } catch (error) {
    console.error('Error al crear conversación:', error);
    res.status(500).json({
      message: 'Error al crear la conversación',
      error: error.message
    });
  }
});

// Crear nuevo mensaje
router.post('/messages', protect, async (req, res) => {
  const startTime = Date.now();
  const logs = [];
  let userMessage = null;
  let assistantMessage = null;
  
  try {
    const { conversationId, content, role = 'user' } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        message: 'El contenido del mensaje es requerido'
      });
    }

    // Validar límite de mensajes (permitir crear el mensaje si estamos justo en el límite)
    // El límite se aplica ANTES de crear el nuevo mensaje, así que si hay LIMITE_MENSAJES o más, no permitimos crear más
    const messageCount = await Message.countDocuments({ conversationId });
    if (messageCount >= LIMITE_MENSAJES) {
      return res.status(400).json({ 
        message: `Límite de mensajes alcanzado (${LIMITE_MENSAJES} mensajes por conversación). Por favor, crea una nueva conversación para continuar.`,
        limit: LIMITE_MENSAJES,
        currentCount: messageCount
      });
    }

    logs.push(`[${Date.now() - startTime}ms] Iniciando procesamiento de mensaje`);

    // 1. Crear mensaje del usuario
    userMessage = new Message({
      userId: req.user._id,
      content: content.trim(),
      role,
      conversationId,
      metadata: {
        status: 'sent'
      }
    });

    if (role === 'user') {
      try {
        // 2. Obtener contexto e historial
        logs.push(`[${Date.now() - startTime}ms] Obteniendo contexto e historial`);
        const [conversationHistory, userProfile, therapeuticRecord] = await Promise.all([
          Message.find({ 
            conversationId,
            createdAt: { $gte: new Date(Date.now() - VENTANA_CONTEXTO) }
          })
          .sort({ createdAt: -1 })
          .limit(HISTORIAL_LIMITE)
          .lean(),
          userProfileService.getOrCreateProfile(req.user._id),
          TherapeuticRecord.findOne({ userId: req.user._id })
        ]);

        // 3. Análisis completo del mensaje (en paralelo para optimizar rendimiento)
        // Extraer patrones emocionales del historial para mejorar el análisis
        const previousEmotionalPatterns = conversationHistory
          .filter(msg => msg.metadata?.context?.emotional?.mainEmotion)
          .map(msg => ({
            emotion: msg.metadata.context.emotional.mainEmotion,
            intensity: msg.metadata.context.emotional.intensity || 5,
            timestamp: msg.createdAt
          }))
          .slice(-3); // Solo los últimos 3 para ajuste de tendencia

        logs.push(`[${Date.now() - startTime}ms] Realizando análisis completo del mensaje`);
        const [emotionalAnalysis, contextualAnalysis] = await Promise.all([
          emotionalAnalyzer.analyzeEmotion(content, previousEmotionalPatterns),
          contextAnalyzer.analizarMensaje(userMessage, conversationHistory)
        ]);

        // Evaluar riesgo de crisis/suicida
        const riskLevel = evaluateSuicideRisk(emotionalAnalysis, contextualAnalysis, content);
        const isCrisis = riskLevel !== 'LOW' || contextualAnalysis?.intencion?.tipo === 'CRISIS';
        
        if (isCrisis) {
          logs.push(`[${Date.now() - startTime}ms] ⚠️ Crisis detectada - Nivel de riesgo: ${riskLevel}`);
          
          // Enviar alertas a contactos de emergencia si el riesgo es MEDIUM o HIGH
          if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
            try {
              const alertResult = await emergencyAlertService.sendEmergencyAlerts(
                req.user._id,
                riskLevel,
                content // No enviar el contenido completo por privacidad, pero se puede usar para contexto
              );
              
              if (alertResult.sent) {
                logs.push(`[${Date.now() - startTime}ms] 📧 Alertas enviadas a ${alertResult.successfulSends}/${alertResult.totalContacts} contactos de emergencia`);
              } else {
                logs.push(`[${Date.now() - startTime}ms] ⚠️ No se pudieron enviar alertas: ${alertResult.reason || 'Error desconocido'}`);
              }
            } catch (error) {
              // No bloquear el flujo principal si falla el envío de alertas
              console.error('[ChatRoutes] Error enviando alertas de emergencia:', error);
              logs.push(`[${Date.now() - startTime}ms] ❌ Error enviando alertas de emergencia: ${error.message}`);
            }
          }
        }

        // 4. Guardar mensaje del usuario primero
        await userMessage.save();

        // 5. Generar respuesta usando el análisis ya realizado
        // Preparar historial de conversación en formato para el prompt
        const historialParaPrompt = conversationHistory
          .slice(0, HISTORY_LIMITS.MESSAGES_IN_PROMPT) // Últimos N mensajes (ya están ordenados descendente)
          .reverse() // Invertir para orden cronológico (más antiguo primero)
          .map(msg => ({
            role: msg.role || 'user',
            content: msg.content || ''
          }))
          .filter(msg => msg.content.trim().length > 0);

        logs.push(`[${Date.now() - startTime}ms] Generando respuesta con análisis previo`);
        const response = await openaiService.generarRespuesta(
          userMessage,
          {
            history: historialParaPrompt,
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis,
            profile: userProfile,
            therapeutic: therapeuticRecord,
            // Agregar información de crisis si se detecta
            crisis: isCrisis ? {
              riskLevel,
              country: userProfile?.preferences?.country || 'GENERAL', // Por ahora GENERAL, se puede mejorar después
              detectedAt: new Date()
            } : undefined
          }
        );

        // Nota: La validación de coherencia emocional ya se realiza dentro de generarRespuesta()
        // en el método validarYMejorarRespuesta(), por lo que no es necesario hacerla aquí

        // 6. Crear y guardar mensaje del asistente
        // Normalizar objeto emocional para asegurar compatibilidad con el esquema
        const emocionalNormalizado = openaiService.normalizarAnalisisEmocional(emotionalAnalysis);
        
        try {
          assistantMessage = new Message({
            userId: req.user._id,
            content: response.content,
            role: 'assistant',
            conversationId,
            metadata: {
              status: 'sent',
              context: {
                emotional: emocionalNormalizado,
                contextual: contextualAnalysis,
                response: JSON.stringify(response.context)
              }
            }
          });
          await assistantMessage.save();
        } catch (saveError) {
          // Si hay error de validación del enum, intentar guardar con 'neutral' como fallback
          if (saveError.name === 'ValidationError' && saveError.errors?.['metadata.context.emotional.mainEmotion']) {
            console.warn('⚠️ Error de validación de enum emocional. Guardando con neutral como fallback:', saveError.message);
            assistantMessage = new Message({
              userId: req.user._id,
              content: response.content,
              role: 'assistant',
              conversationId,
              metadata: {
                status: 'sent',
                context: {
                  emotional: {
                    mainEmotion: 'neutral',
                    intensity: emocionalNormalizado.intensity || 5
                  },
                  contextual: contextualAnalysis,
                  response: JSON.stringify(response.context)
                }
              }
            });
            await assistantMessage.save();
          } else {
            throw saveError;
          }
        }

        // 7. Actualizar registros en paralelo
        logs.push(`[${Date.now() - startTime}ms] Actualizando registros adicionales`);
        await Promise.all([
          progressTracker.trackProgress(req.user._id, {
            userMessage,
            assistantMessage,
            analysis: {
              emotional: emotionalAnalysis,
              contextual: contextualAnalysis
            }
          }),
          userProfileService.actualizarPerfil(req.user._id, userMessage, {
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis
          }),
          Conversation.findByIdAndUpdate(conversationId, { lastMessage: assistantMessage._id })
        ]).catch(error => {
          console.warn('Error en actualizaciones secundarias:', error);
          logs.push(`[${Date.now() - startTime}ms] Advertencia: Error en actualizaciones secundarias`);
        });

        logs.push(`[${Date.now() - startTime}ms] Proceso completado exitosamente`);
        
        return res.status(201).json({
          userMessage,
          assistantMessage,
          context: {
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis
          },
          processingTime: Date.now() - startTime
        });

      } catch (error) {
        logs.push(`[${Date.now() - startTime}ms] Error: ${error.message}`);
        console.error('Error procesando mensaje:', {
          error,
          logs,
          userId: req.user._id,
          messageContent: content
        });

        // Si el mensaje del usuario ya se guardó, crear mensaje de error
        if (userMessage._id) {
          assistantMessage = new Message({
            userId: req.user._id,
            content: "Lo siento, ha ocurrido un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?",
            role: 'assistant',
            conversationId,
            metadata: {
              status: 'sent',
              error: error.message
            }
          });

          await assistantMessage.save();
        }

        return res.status(500).json({
          message: 'Error procesando el mensaje',
          error: error.message,
          userMessage: userMessage._id ? userMessage : null,
          errorMessage: assistantMessage,
          logs
        });
      }
    } else {
      // Para mensajes que no son del usuario
      const savedMessage = await userMessage.save();
      return res.status(201).json({ message: savedMessage });
    }

  } catch (error) {
    logs.push(`[${Date.now() - startTime}ms] Error crítico: ${error.message}`);
    console.error('Error crítico en POST /messages:', {
      error,
      logs,
      userId: req?.user?._id
    });

    return res.status(500).json({
      message: 'Error crítico al procesar el mensaje',
      error: error.message,
      logs
    });
  }
});

// Obtener todas las conversaciones del usuario con estadísticas
router.get('/conversations', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const conversations = await Message.aggregate([
      { $match: { userId: req.user._id } },
      { 
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$content' },
          lastMessageRole: { $last: '$role' },
          updatedAt: { $max: '$createdAt' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$metadata.status', 'sent'] }, 1, 0] }
          },
          emotionalContext: {
            $last: '$metadata.context.emotional'
          }
        }
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    res.json({ 
      conversations,
      stats: await userProfileService.getConversationStats(req.user._id)
    });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({
      message: 'Error al obtener las conversaciones',
      error: error.message
    });
  }
});

// Actualizar estado de mensajes (sent, delivered, read, failed)
router.patch('/messages/status', protect, async (req, res) => {
  try {
    const { messageIds, status } = req.body;

    if (!Array.isArray(messageIds) || !messageIds.length) {
      return res.status(400).json({
        message: 'Se requiere al menos un ID de mensaje'
      });
    }

    const validStatuses = ['sent', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Estado de mensaje inválido'
      });
    }

    // Validar que todos los IDs son válidos
    const validIds = messageIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== messageIds.length) {
      return res.status(400).json({ 
        message: 'Algunos IDs de mensaje son inválidos' 
      });
    }

    // Verificar que los mensajes existen y pertenecen al usuario
    const messages = await Message.find({ 
      _id: { $in: validIds }, 
      userId: req.user._id 
    });
    
    if (messages.length !== validIds.length) {
      return res.status(400).json({ 
        message: 'Algunos mensajes no existen o no pertenecen al usuario' 
      });
    }

    // Actualizar estado
    const result = await Message.updateMany(
      {
        _id: { $in: validIds },
        userId: req.user._id
      },
      {
        $set: { 
          'metadata.status': status,
          'metadata.lastStatusUpdate': new Date()
        }
      }
    );

    res.json({
      message: `${result.modifiedCount} mensajes actualizados`,
      status,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error al actualizar estado de mensajes:', error);
    res.status(500).json({
      message: 'Error al actualizar el estado de los mensajes',
      error: error.message
    });
  }
});

// Eliminar mensajes de una conversación (opcional: filtrar por rol)
router.delete('/conversations/:conversationId', protect, validarConversationId, validarConversacion, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { role } = req.query;

    const query = {
      conversationId,
      userId: req.user._id,
      ...(role && { role })
    };

    const result = await Message.deleteMany(query);

    res.json({
      message: 'Mensajes eliminados exitosamente',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error al eliminar mensajes:', error);
    res.status(500).json({
      message: 'Error al eliminar los mensajes',
      error: error.message
    });
  }
});

// Búsqueda avanzada de mensajes (por contenido, rol, estado, emociones, fechas)
router.get('/messages/search', protect, async (req, res) => {
  try {
    const { 
      query: searchText,
      role,
      status,
      startDate,
      endDate,
      emotion,
      intensity
    } = req.query;

    const searchQuery = {
      userId: req.user._id,
      ...(searchText && { content: { $regex: searchText, $options: 'i' } }),
      ...(role && { role }),
      ...(status && { 'metadata.status': status }),
      ...(emotion && { 'metadata.context.emotional.mainEmotion': emotion }),
      ...(intensity && { 'metadata.context.emotional.intensity': parseInt(intensity) })
    };

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      searchQuery.createdAt = {
        ...(startDate && { $gte: new Date(startDate) }),
        ...(endDate && { $lte: new Date(endDate) })
      };
    }

    const messages = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(LIMITE_MENSAJES)
      .lean();

    res.json({ 
      messages,
      count: messages.length,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error en búsqueda de mensajes:', error);
    res.status(500).json({
      message: 'Error al buscar mensajes',
      error: error.message
    });
  }
});

export default router;
