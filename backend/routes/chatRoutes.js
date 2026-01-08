/**
 * Rutas de Chat - Gestiona conversaciones, mensajes y análisis emocional/contextual
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { evaluateSuicideRisk } from '../constants/crisis.js';
import { HISTORY_LIMITS } from '../constants/openai.js';
import { authenticateToken as protect } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/checkSubscription.js';
import CrisisEvent from '../models/CrisisEvent.js';
import EmergencyAlert from '../models/EmergencyAlert.js';
import {
  Conversation,
  Message,
  TherapeuticRecord
} from '../models/index.js';
import User from '../models/User.js';
import actionSuggestionService from '../services/actionSuggestionService.js';
import crisisFollowUpService from '../services/crisisFollowUpService.js';
import crisisTrendAnalyzer from '../services/crisisTrendAnalyzer.js';
import emergencyAlertService from '../services/emergencyAlertService.js';
import {
  contextAnalyzer,
  emotionalAnalyzer,
  openaiService,
  progressTracker,
  userProfileService
} from '../services/index.js';
import metricsService from '../services/metricsService.js';
import paymentAuditService from '../services/paymentAuditService.js';
import pushNotificationService from '../services/pushNotificationService.js';
import sessionEmotionalMemory from '../services/sessionEmotionalMemory.js';
import { cursorPaginate } from '../utils/pagination.js';

const router = express.Router();

// Constantes de configuración
const LIMITE_MENSAJES = 100; // Aumentado de 50 a 100 para permitir conversaciones más largas
const VENTANA_CONTEXTO = 20 * 60 * 1000; // 20 minutos en milisegundos (reducido para mejorar velocidad)
const HISTORIAL_LIMITE = 6; // Número de mensajes para contexto (reducido para mejorar velocidad)

// Rate limiters
const deleteConversationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Demasiadas eliminaciones de conversaciones. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

const patchMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: 'Demasiadas actualizaciones de mensajes. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

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
  
  // Asegurar que los IDs sean ObjectIds válidos
  if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(req.user._id)) {
    return res.status(400).json({ message: 'ID de conversación o usuario inválido' });
  }
  
  const conversation = await Conversation.findOne({ 
    _id: new mongoose.Types.ObjectId(conversationId), 
    userId: new mongoose.Types.ObjectId(req.user._id) 
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

    // Asegurar que los IDs sean ObjectIds válidos
    const userId = mongoose.Types.ObjectId.isValid(req.user._id) 
      ? new mongoose.Types.ObjectId(req.user._id) 
      : req.user._id;
    const convId = mongoose.Types.ObjectId.isValid(conversationId) 
      ? new mongoose.Types.ObjectId(conversationId) 
      : conversationId;
    
    const query = {
      conversationId: convId,
      userId: userId,
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

    // Eliminar duplicados basándose en _id y contenido para evitar mensajes repetidos
    const uniqueMessages = messages.reduce((acc, message) => {
      const messageId = message._id?.toString();
      if (!messageId) {
        return acc;
      }
      
      // Verificar si ya existe un mensaje con este ID
      const exists = acc.some(
        msg => msg._id?.toString() === messageId
      );
      
      if (!exists) {
        acc.push(message);
      }
      
      return acc;
    }, []);

    res.json({
      messages: uniqueMessages.reverse(),
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
router.post('/conversations', protect, requireActiveSubscription(true), async (req, res) => {
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

// Rate limiter para envío de mensajes
const sendMessageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // Máximo 20 mensajes por minuto
  message: 'Demasiados mensajes enviados. Por favor, espera un momento antes de intentar de nuevo.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Crear nuevo mensaje
router.post('/messages', protect, requireActiveSubscription(true), sendMessageLimiter, async (req, res) => {
  const startTime = Date.now();
  const logs = [];
  let userMessage = null;
  let assistantMessage = null;
  
  try {
    const { conversationId, content, role = 'user' } = req.body;

    // SEGURIDAD: Validar formato de conversationId
    if (!conversationId) {
      return res.status(400).json({
        message: 'ID de conversación requerido'
      });
    }

    if (!isValidObjectId(conversationId)) {
      // Registrar intento de acceso con ID inválido
      await paymentAuditService.logEvent('SECURITY_INVALID_CONVERSATION_ID', {
        userId: req.user._id?.toString(),
        conversationId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
      }, req.user._id?.toString()).catch(() => {});
      
      return res.status(400).json({
        message: 'ID de conversación inválido'
      });
    }

    // SEGURIDAD: Validar que la conversación pertenece al usuario autenticado
    const conversation = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(req.user._id)
    });

    if (!conversation) {
      // Registrar intento de acceso a conversación no autorizada
      await paymentAuditService.logEvent('SECURITY_UNAUTHORIZED_CONVERSATION_ACCESS', {
        userId: req.user._id?.toString(),
        conversationId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
      }, req.user._id?.toString()).catch(() => {});
      
      return res.status(403).json({
        message: 'No tienes permiso para acceder a esta conversación'
      });
    }

    // SEGURIDAD: Validación adicional de suscripción (defense in depth)
    // Verificar que la suscripción sigue activa después del middleware
    if (!req.subscription || (!req.subscription.isActive && !req.subscription.isInTrial)) {
      await paymentAuditService.logEvent('SECURITY_SUBSCRIPTION_BYPASS_ATTEMPT', {
        userId: req.user._id?.toString(),
        conversationId,
        subscriptionInfo: req.subscription,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
      }, req.user._id?.toString()).catch(() => {});
      
      return res.status(403).json({
        success: false,
        error: 'Se requiere suscripción activa o trial válido para usar el chat',
        requiresSubscription: true
      });
    }

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

    // 1. Crear y guardar mensaje del usuario INMEDIATAMENTE (optimización: no esperar análisis)
    userMessage = new Message({
      userId: req.user._id,
      content: content.trim(),
      role,
      conversationId,
      metadata: {
        status: 'sent'
      }
    });
    // Guardar mensaje del usuario antes de análisis para respuesta más rápida
    await userMessage.save();
    logs.push(`[${Date.now() - startTime}ms] Mensaje del usuario guardado`);

    if (role === 'user') {
      try {
        // 2. Obtener contexto e historial (en paralelo)
        logs.push(`[${Date.now() - startTime}ms] Obteniendo contexto e historial`);
        // Optimización: Usar índices compuestos y proyección para reducir datos transferidos
        const [conversationHistory, userProfile, therapeuticRecord, user] = await Promise.all([
          Message.find({ 
            conversationId,
            createdAt: { $gte: new Date(Date.now() - VENTANA_CONTEXTO) }
          })
          .select('content role metadata.context.emotional createdAt') // Solo campos necesarios
          .sort({ createdAt: -1 })
          .limit(HISTORIAL_LIMITE)
          .lean(),
          userProfileService.getOrCreateProfile(req.user._id),
          TherapeuticRecord.findOne({ userId: req.user._id }).lean(), // Usar lean() para mejor rendimiento
          User.findById(req.user._id).select('preferences').lean() // Obtener User para acceder a preferences.responseStyle
        ]);

        // 3. Análisis completo del mensaje (solo análisis críticos en paralelo)
        // Extraer patrones emocionales del historial para mejorar el análisis
        const previousEmotionalPatterns = conversationHistory
          .filter(msg => msg.metadata?.context?.emotional?.mainEmotion)
          .map(msg => ({
            emotion: msg.metadata.context.emotional.mainEmotion,
            intensity: msg.metadata.context.emotional.intensity || 5,
            timestamp: msg.createdAt
          }))
          .slice(-3); // Solo los últimos 3 para ajuste de tendencia

        logs.push(`[${Date.now() - startTime}ms] Realizando análisis crítico del mensaje`);
        
        // OPTIMIZACIÓN: Solo análisis críticos en paralelo (emocional y contextual)
        // Análisis de tendencias y crisis se harán después si es necesario
        const [emotionalAnalysis, contextualAnalysis] = await Promise.all([
          emotionalAnalyzer.analyzeEmotion(content, previousEmotionalPatterns),
          contextAnalyzer.analizarMensaje(userMessage, conversationHistory)
        ]);
        
        // OPTIMIZACIÓN: Análisis de tendencias y crisis solo si hay indicadores de riesgo
        // Evaluar riesgo básico primero (más rápido)
        const basicRiskLevel = evaluateSuicideRisk(
          emotionalAnalysis, 
          contextualAnalysis, 
          content,
          {
            trendAnalysis: null, // No esperar análisis de tendencias
            crisisHistory: null,
            conversationContext: {}
          }
        );
        
        // Solo hacer análisis completo de tendencias/crisis si hay indicadores de riesgo
        let trendAnalysis = null;
        let crisisHistory = null;
        if (basicRiskLevel !== 'LOW' || emotionalAnalysis?.intensity >= 7) {
          logs.push(`[${Date.now() - startTime}ms] Indicadores de riesgo detectados, analizando tendencias`);
          [trendAnalysis, crisisHistory] = await Promise.all([
            crisisTrendAnalyzer.analyzeTrends(req.user._id).catch(err => {
              console.error('[ChatRoutes] Error analizando tendencias:', err);
              return null;
            }),
            crisisTrendAnalyzer.getCrisisHistory(req.user._id, 30).catch(err => {
              console.error('[ChatRoutes] Error obteniendo historial de crisis:', err);
              return null;
            })
          ]);
        }

        // NUEVO: Agregar análisis emocional a la memoria de sesión
        sessionEmotionalMemory.addAnalysis(req.user._id.toString(), emotionalAnalysis);
        
        // NUEVO: Registrar métricas de forma asíncrona (no bloquea la respuesta)
        Promise.all([
          metricsService.recordMetric('emotional_analysis', emotionalAnalysis, req.user._id.toString()).catch(() => {}),
          Promise.resolve().then(() => {
            const sessionBuffer = sessionEmotionalMemory.getBuffer(req.user._id.toString());
            return metricsService.recordMetric('session_memory', {
              action: 'add',
              bufferSize: sessionBuffer.length
            }, req.user._id.toString());
          }).catch(() => {})
        ]).catch(() => {}); // Ignorar errores en operaciones no críticas
        
        // NUEVO: Obtener tendencias de la sesión actual
        const sessionTrends = sessionEmotionalMemory.analyzeTrends(req.user._id.toString());


        // Evaluar riesgo de crisis/suicida con análisis mejorado
        const riskLevel = evaluateSuicideRisk(
          emotionalAnalysis, 
          contextualAnalysis, 
          content,
          {
            trendAnalysis,
            crisisHistory,
            conversationContext
          }
        );
        // Solo crear evento de crisis si el nivel es MEDIUM o HIGH
        // WARNING no crea evento de crisis ni envía alertas, solo se registra para monitoreo
        // Solo considerar intención CRISIS si la confianza es muy alta (>= 0.9) Y el score es alto
        const isCrisis = (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') || 
                        (contextualAnalysis?.intencion?.tipo === 'CRISIS' && 
                         contextualAnalysis?.intencion?.confianza >= 0.9 && 
                         riskLevel !== 'LOW');
        
        if (isCrisis) {
          logs.push(`[${Date.now() - startTime}ms] ⚠️ Crisis detectada - Nivel de riesgo: ${riskLevel}`);
          
          // Log de advertencias de tendencias si existen
          if (trendAnalysis?.warnings?.length > 0) {
            logs.push(`[${Date.now() - startTime}ms] 📊 Advertencias de tendencias: ${trendAnalysis.warnings.join('; ')}`);
          }
          
          // Variable para almacenar resultado de alertas
          let alertResult = null;

          // OPTIMIZACIÓN: Solo HIGH bloquea la respuesta, MEDIUM/WARNING se manejan después
          let alertResult = null;
          
          if (riskLevel === 'HIGH') {
            // HIGH es crítico, debe manejarse antes de responder
            try {
              const alertOptions = {
                trendAnalysis,
                metadata: {
                  riskScore: calculateRiskScore(emotionalAnalysis, contextualAnalysis, content, {
                    trendAnalysis,
                    crisisHistory,
                    conversationContext
                  }),
                  factors: extractRiskFactors(emotionalAnalysis, contextualAnalysis, content, {
                    trendAnalysis,
                    crisisHistory,
                    conversationContext
                  })
                }
              };
              
              alertResult = await emergencyAlertService.sendEmergencyAlerts(
                req.user._id,
                riskLevel,
                content,
                alertOptions
              );
              
              if (alertResult.sent) {
                logs.push(`[${Date.now() - startTime}ms] 📧 Alertas HIGH enviadas a ${alertResult.successfulSends}/${alertResult.totalContacts} contactos`);
              }
              
              // Notificación push para HIGH
              try {
                const user = await User.findById(req.user._id).select('+pushToken');
                if (user && user.pushToken) {
                  await pushNotificationService.sendCrisisHigh(user.pushToken);
                  logs.push(`[${Date.now() - startTime}ms] 📱 Notificación push HIGH enviada`);
                }
              } catch (error) {
                console.error('[ChatRoutes] Error enviando notificación push HIGH:', error);
              }
            } catch (error) {
              console.error('[ChatRoutes] Error enviando alertas HIGH:', error);
              logs.push(`[${Date.now() - startTime}ms] ❌ Error enviando alertas HIGH: ${error.message}`);
            }
          }
          
          // MEDIUM y WARNING se manejan de forma asíncrona después de responder
          // (se define la función pero se ejecuta después)
          const handleNonCriticalCrisis = async () => {
            if (riskLevel === 'MEDIUM') {
              try {
                const alertOptions = {
                  trendAnalysis,
                  metadata: {
                    riskScore: calculateRiskScore(emotionalAnalysis, contextualAnalysis, content, {
                      trendAnalysis,
                      crisisHistory,
                      conversationContext
                    }),
                    factors: extractRiskFactors(emotionalAnalysis, contextualAnalysis, content, {
                      trendAnalysis,
                      crisisHistory,
                      conversationContext
                    })
                  }
                };
                
                const mediumAlertResult = await emergencyAlertService.sendEmergencyAlerts(
                  req.user._id,
                  riskLevel,
                  content,
                  alertOptions
                );
                
                const user = await User.findById(req.user._id).select('+pushToken');
                if (user && user.pushToken) {
                  await pushNotificationService.sendCrisisMedium(user.pushToken);
                }
                
                // Crear evento de crisis
                const crisisEvent = await CrisisEvent.create({
                  userId: req.user._id,
                  riskLevel,
                  triggerMessage: {
                    messageId: userMessage._id,
                    contentPreview: content.substring(0, 200),
                    emotionalAnalysis: {
                      mainEmotion: emotionalAnalysis?.mainEmotion,
                      intensity: emotionalAnalysis?.intensity
                    }
                  },
                  trendAnalysis: trendAnalysis ? {
                    rapidDecline: trendAnalysis.trends?.rapidDecline || false,
                    sustainedLow: trendAnalysis.trends?.sustainedLow || false,
                    isolation: trendAnalysis.trends?.isolation || false,
                    escalation: trendAnalysis.trends?.escalation || false,
                    warnings: trendAnalysis.warnings || []
                  } : undefined,
                  crisisHistory: crisisHistory ? {
                    totalCrises: crisisHistory.totalCrises || 0,
                    recentCrises: crisisHistory.recentCrises || 0
                  } : undefined,
                  alerts: mediumAlertResult ? {
                    sent: mediumAlertResult.sent || false,
                    sentAt: mediumAlertResult.sent ? new Date() : undefined,
                    contactsNotified: mediumAlertResult.successfulSends || 0,
                    channels: {
                      email: mediumAlertResult.successfulEmails > 0 || false,
                      whatsapp: mediumAlertResult.successfulWhatsApp > 0 || false
                    }
                  } : undefined,
                  metadata: {
                    riskScore: calculateRiskScore(emotionalAnalysis, contextualAnalysis, content, {
                      trendAnalysis,
                      crisisHistory,
                      conversationContext
                    }),
                    factors: extractRiskFactors(emotionalAnalysis, contextualAnalysis, content, {
                      trendAnalysis,
                      crisisHistory,
                      conversationContext
                    }),
                    protectiveFactors: extractProtectiveFactors(emotionalAnalysis, content)
                  }
                });
                
                if (crisisEvent && mediumAlertResult?.sent) {
                  await crisisFollowUpService.scheduleFollowUps(crisisEvent._id, riskLevel);
                }
              } catch (error) {
                console.error('[ChatRoutes] Error manejando crisis MEDIUM:', error);
              }
            } else if (riskLevel === 'WARNING') {
              try {
                const user = await User.findById(req.user._id).select('+pushToken');
                if (user && user.pushToken) {
                  await pushNotificationService.sendCrisisWarning(
                    user.pushToken,
                    {
                      emotion: emotionalAnalysis?.mainEmotion,
                      intensity: emotionalAnalysis?.intensity
                    }
                  );
                }
              } catch (error) {
                console.error('[ChatRoutes] Error manejando crisis WARNING:', error);
              }
            }
          };
          
          // Crear evento de crisis para HIGH (síncrono porque es crítico)
          let crisisEvent = null;
          if (riskLevel === 'HIGH') {
            try {
              crisisEvent = await CrisisEvent.create({
                userId: req.user._id,
                riskLevel,
                triggerMessage: {
                  messageId: userMessage._id,
                  contentPreview: content.substring(0, 200),
                  emotionalAnalysis: {
                    mainEmotion: emotionalAnalysis?.mainEmotion,
                    intensity: emotionalAnalysis?.intensity
                  }
                },
                trendAnalysis: trendAnalysis ? {
                  rapidDecline: trendAnalysis.trends?.rapidDecline || false,
                  sustainedLow: trendAnalysis.trends?.sustainedLow || false,
                  isolation: trendAnalysis.trends?.isolation || false,
                  escalation: trendAnalysis.trends?.escalation || false,
                  warnings: trendAnalysis.warnings || []
                } : undefined,
                crisisHistory: crisisHistory ? {
                  totalCrises: crisisHistory.totalCrises || 0,
                  recentCrises: crisisHistory.recentCrises || 0
                } : undefined,
                alerts: alertResult ? {
                  sent: alertResult.sent || false,
                  sentAt: alertResult.sent ? new Date() : undefined,
                  contactsNotified: alertResult.successfulSends || 0,
                  channels: {
                    email: alertResult.successfulEmails > 0 || false,
                    whatsapp: alertResult.successfulWhatsApp > 0 || false
                  }
                } : undefined,
                metadata: {
                  riskScore: calculateRiskScore(emotionalAnalysis, contextualAnalysis, content, {
                    trendAnalysis,
                    crisisHistory,
                    conversationContext
                  }),
                  factors: extractRiskFactors(emotionalAnalysis, contextualAnalysis, content, {
                    trendAnalysis,
                    crisisHistory,
                    conversationContext
                  }),
                  protectiveFactors: extractProtectiveFactors(emotionalAnalysis, content)
                }
              });
              
              if (crisisEvent && alertResult?.sent) {
                await crisisFollowUpService.scheduleFollowUps(crisisEvent._id, riskLevel);
              }
            } catch (error) {
              console.error('[ChatRoutes] Error registrando evento de crisis HIGH:', error);
            }
          }
          
          // Ejecutar manejo de crisis no críticas después de responder (asíncrono)
          if (riskLevel === 'MEDIUM' || riskLevel === 'WARNING') {
            handleNonCriticalCrisis().catch(err => {
              console.error('[ChatRoutes] Error en manejo asíncrono de crisis:', err);
            });
          }
        }

        // 4. Generar respuesta usando el análisis ya realizado (mensaje ya guardado arriba)
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
        
        // Combinar UserProfile con User para tener acceso a todas las preferencias
        const combinedProfile = {
          ...userProfile,
          preferences: {
            ...userProfile?.preferences,
            ...user?.preferences // Incluir responseStyle de User
          }
        };
        
        const response = await openaiService.generarRespuesta(
          userMessage,
          {
            history: historialParaPrompt,
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis,
            profile: combinedProfile,
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

        // 7. Actualizar registros de forma asíncrona (no bloquea la respuesta)
        // Solo actualizar lastMessage de forma síncrona, el resto puede ser asíncrono
        Promise.all([
          Conversation.findByIdAndUpdate(conversationId, { lastMessage: assistantMessage._id }).catch(() => {}),
          progressTracker.trackProgress(req.user._id, {
            userMessage,
            assistantMessage,
            analysis: {
              emotional: emotionalAnalysis,
              contextual: contextualAnalysis
            }
          }).catch(() => {}),
          userProfileService.actualizarPerfil(req.user._id, userMessage, {
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis
          }).catch(() => {})
        ]).catch(() => {}); // Ignorar errores en operaciones no críticas

        // OPTIMIZACIÓN: Generar sugerencias solo cuando sea apropiado (no en cada mensaje)
        const responseTime = Date.now() - startTime;
        
        // Determinar si debemos mostrar sugerencias basado en criterios inteligentes
        const shouldShowSuggestions = shouldShowActionSuggestions(
          emotionalAnalysis,
          contextualAnalysis,
          conversationHistory,
          req.user._id
        );
        
        // Generar sugerencias solo si es apropiado
        let formattedSuggestions = [];
        if (shouldShowSuggestions) {
          try {
            const actionSuggestions = actionSuggestionService.generateSuggestions(
              emotionalAnalysis,
              contextualAnalysis
            );
            formattedSuggestions = actionSuggestionService.formatSuggestions(actionSuggestions);
            
            // Registrar métricas de sugerencias
            if (actionSuggestions.length > 0) {
              actionSuggestions.forEach(suggestion => {
                metricsService.recordMetric('action_suggestion', {
                  action: 'generate',
                  suggestionType: suggestion
                }, req.user._id.toString()).catch(() => {});
              });
            }
          } catch (error) {
            console.error('[ChatRoutes] Error generando sugerencias:', error);
          }
        }
        
        // Registrar métrica de tiempo de respuesta de forma asíncrona
        metricsService.recordMetric('response_generation', {
          time: responseTime,
          success: true
        }, req.user._id.toString()).catch(() => {});
        
        logs.push(`[${Date.now() - startTime}ms] Proceso completado exitosamente`);
        
        return res.status(201).json({
          userMessage,
          assistantMessage,
          context: {
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis
          },
          suggestions: formattedSuggestions, // Solo se incluyen si es apropiado
          processingTime: responseTime
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
    const { page = 1, limit = 10, cursor, paginationType = 'offset' } = req.query;
    
    // Usar cursor-based pagination si se especifica o si hay muchos resultados
    if (paginationType === 'cursor' || cursor) {
      const result = await cursorPaginate({
        query: { userId: new mongoose.Types.ObjectId(req.user._id) },
        model: Message,
        cursor: cursor || null,
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select: 'conversationId content role metadata.context.emotional createdAt'
      });
      
      // Agrupar por conversación
      const conversationMap = new Map();
      result.data.forEach(msg => {
        const convId = msg.conversationId.toString();
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            _id: msg.conversationId,
            lastMessage: msg.content,
            lastMessageRole: msg.role,
            updatedAt: msg.createdAt,
            messageCount: 1,
            emotionalContext: msg.metadata?.context?.emotional
          });
        } else {
          const conv = conversationMap.get(convId);
          conv.messageCount++;
          if (msg.createdAt > conv.updatedAt) {
            conv.updatedAt = msg.createdAt;
            conv.lastMessage = msg.content;
            conv.lastMessageRole = msg.role;
            conv.emotionalContext = msg.metadata?.context?.emotional;
          }
        }
      });
      
      const conversations = Array.from(conversationMap.values());
      
      return res.json({
        conversations,
        pagination: {
          type: 'cursor',
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
          count: conversations.length
        }
      });
    }
    
    // Paginación tradicional (offset-based)
    const skip = (page - 1) * limit;
    
    // Optimización: Usar índices existentes (userId, createdAt) y proyección
    const conversations = await Message.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(req.user._id) 
        } 
      },
      {
        // Optimización: Proyectar solo campos necesarios antes de agrupar
        $project: {
          conversationId: 1,
          content: 1,
          role: 1,
          createdAt: 1,
          'metadata.status': 1,
          'metadata.context.emotional': 1
        }
      },
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

    // Calcular estadísticas básicas
    const stats = {
      total: conversations.length,
      active: conversations.filter(c => !c.archived).length,
      archived: conversations.filter(c => c.archived).length
    };

    res.json({ 
      conversations,
      stats
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
router.patch('/messages/status', protect, patchMessageLimiter, async (req, res) => {
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

    // Optimización: Solo verificar existencia, no cargar datos completos
    const messageCount = await Message.countDocuments({ 
      _id: { $in: validIds }, 
      userId: req.user._id 
    });
    
    if (messageCount !== validIds.length) {
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
router.delete('/conversations/:conversationId', protect, validarConversationId, validarConversacion, deleteConversationLimiter, async (req, res) => {
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

    // Optimización: Usar proyección para reducir datos transferidos
    const messages = await Message.find(searchQuery)
      .select('content role metadata createdAt') // Solo campos necesarios
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

// ========== FUNCIONES HELPER PARA ANÁLISIS DE CONTEXTO ==========

/**
 * Detecta escalada emocional en la conversación
 * @param {Array} conversationHistory - Historial de la conversación
 * @param {Object} currentEmotionalAnalysis - Análisis emocional actual
 * @returns {boolean} true si hay escalada emocional
 */
function detectEmotionalEscalation(conversationHistory, currentEmotionalAnalysis) {
  if (!conversationHistory || conversationHistory.length < 2) return false;
  
  const recentMessages = conversationHistory
    .filter(msg => msg.role === 'user' && msg.metadata?.context?.emotional?.intensity)
    .slice(0, 3)
    .map(msg => msg.metadata.context.emotional.intensity);
  
  if (recentMessages.length < 2) return false;
  
  const currentIntensity = currentEmotionalAnalysis?.intensity || 5;
  const previousIntensity = recentMessages[0] || 5;
  
  // Escalada si la intensidad aumenta significativamente
  return currentIntensity > previousIntensity + 1.5;
}

/**
 * Detecta si el usuario rechazó ayuda ofrecida
 * @param {Array} conversationHistory - Historial de la conversación
 * @param {string} currentContent - Contenido del mensaje actual
 * @returns {boolean} true si se detecta rechazo de ayuda
 */
function detectHelpRejection(conversationHistory, currentContent) {
  const content = currentContent.toLowerCase();
  const rejectionPatterns = /(?:no.*quiero.*ayuda|no.*necesito.*ayuda|no.*me.*ayudes|déjame.*solo|no.*me.*importa|no.*sirve.*de.*nada)/i;
  return rejectionPatterns.test(content);
}

/**
 * Detecta cambio abrupto en el tono de la conversación
 * @param {Array} conversationHistory - Historial de la conversación
 * @param {Object} currentEmotionalAnalysis - Análisis emocional actual
 * @returns {boolean} true si hay cambio abrupto
 */
function detectAbruptToneChange(conversationHistory, currentEmotionalAnalysis) {
  if (!conversationHistory || conversationHistory.length < 2) return false;
  
  const recentMessages = conversationHistory
    .filter(msg => msg.role === 'user' && msg.metadata?.context?.emotional?.mainEmotion)
    .slice(0, 2);
  
  if (recentMessages.length < 1) return false;
  
  const previousEmotion = recentMessages[0].metadata.context.emotional.mainEmotion;
  const currentEmotion = currentEmotionalAnalysis?.mainEmotion;
  
  // Cambio abrupto si cambia de positiva/neutral a negativa
  const positiveEmotions = ['alegria', 'esperanza', 'neutral'];
  const negativeEmotions = ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'];
  
  return positiveEmotions.includes(previousEmotion) && negativeEmotions.includes(currentEmotion);
}

/**
 * Analiza la frecuencia de mensajes para detectar patrones de ansiedad o aislamiento
 * @param {Array} conversationHistory - Historial de la conversación
 * @param {string} currentContent - Contenido del mensaje actual
 * @returns {Object} Análisis de frecuencia
 */
function analyzeMessageFrequency(conversationHistory, currentContent) {
  if (!conversationHistory || conversationHistory.length < 2) {
    return { veryFrequent: false, frequencyChange: false };
  }

  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  
  if (userMessages.length < 3) {
    return { veryFrequent: false, frequencyChange: false };
  }

  // Calcular tiempo entre mensajes recientes (últimos 5)
  const recentMessages = userMessages.slice(0, 5);
  const timeDiffs = [];
  
  for (let i = 0; i < recentMessages.length - 1; i++) {
    const diff = new Date(recentMessages[i].createdAt) - new Date(recentMessages[i + 1].createdAt);
    timeDiffs.push(diff / (1000 * 60)); // Diferencia en minutos
  }

  const averageTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  
  // Mensajes muy frecuentes (menos de 2 minutos entre mensajes) pueden indicar ansiedad
  const veryFrequent = averageTimeDiff < 2;
  
  // Cambio en ritmo (comparar últimos 3 vs anteriores 3)
  if (userMessages.length >= 6) {
    const recent3 = userMessages.slice(0, 3);
    const previous3 = userMessages.slice(3, 6);
    
    const recentAvg = calculateAverageTimeDiff(recent3);
    const previousAvg = calculateAverageTimeDiff(previous3);
    
    // Cambio significativo si el ritmo cambió más del 50%
    const frequencyChange = Math.abs(recentAvg - previousAvg) / previousAvg > 0.5;
    
    return { veryFrequent, frequencyChange };
  }

  return { veryFrequent, frequencyChange: false };
}

/**
 * Determina si se deben mostrar sugerencias de acciones basado en criterios inteligentes
 * @param {Object} emotionalAnalysis - Análisis emocional actual
 * @param {Object} contextualAnalysis - Análisis contextual actual
 * @param {Array} conversationHistory - Historial de la conversación
 * @param {string} userId - ID del usuario
 * @returns {boolean} true si se deben mostrar sugerencias
 */
function shouldShowActionSuggestions(emotionalAnalysis, contextualAnalysis, conversationHistory, userId) {
  // CRITERIOS CRÍTICOS: Siempre mostrar sugerencias si se cumplen estos casos
  
  // 1. Mostrar si la intensidad emocional es alta (>= 7)
  const intensity = emotionalAnalysis?.intensity || 5;
  if (intensity >= 7) {
    return true;
  }
  
  // 2. Mostrar si hay intención de crisis o urgencia alta
  if (contextualAnalysis?.intencion?.tipo === 'CRISIS' || 
      contextualAnalysis?.urgencia === 'alta' ||
      emotionalAnalysis?.requiresAttention) {
    return true;
  }
  
  // 3. Mostrar si hay cambio significativo de emoción (de positiva/neutral a negativa)
  if (conversationHistory && conversationHistory.length >= 2) {
    const recentUserMessages = conversationHistory
      .filter(msg => msg.role === 'user' && msg.metadata?.context?.emotional?.mainEmotion)
      .slice(0, 2);
    
    if (recentUserMessages.length >= 1) {
      const previousEmotion = recentUserMessages[0].metadata.context.emotional.mainEmotion;
      const currentEmotion = emotionalAnalysis?.mainEmotion;
      const positiveEmotions = ['alegria', 'esperanza', 'neutral'];
      const negativeEmotions = ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'];
      
      // Cambio de positiva/neutral a negativa
      if (positiveEmotions.includes(previousEmotion) && negativeEmotions.includes(currentEmotion)) {
        return true;
      }
    }
  }
  
  // CRITERIOS DE FILTRADO: No mostrar si se cumplen estos casos
  
  // 4. No mostrar si el usuario rechazó ayuda recientemente
  if (conversationHistory && conversationHistory.length > 0) {
    const recentContent = conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(0, 3)
      .map(msg => msg.content?.toLowerCase() || '')
      .join(' ');
    
    const rejectionPatterns = /(?:no.*quiero.*ayuda|no.*necesito.*ayuda|no.*me.*ayudes|déjame.*solo|no.*me.*importa|no.*sirve.*de.*nada|no.*gracias)/i;
    if (rejectionPatterns.test(recentContent)) {
      return false;
    }
  }
  
  // 5. Mostrar solo cada 3-4 mensajes aproximadamente (evitar repetición excesiva)
  // Esto solo aplica si no se cumplieron los criterios críticos arriba
  if (conversationHistory && conversationHistory.length > 0) {
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    const totalUserMessages = userMessages.length;
    
    // Mostrar sugerencias aproximadamente cada 3-4 mensajes
    // Usar un rango para evitar ser demasiado predecible
    const shouldShowByCount = totalUserMessages > 0 && 
      (totalUserMessages % 3 === 0 || totalUserMessages % 4 === 0);
    
    if (!shouldShowByCount) {
      return false;
    }
  }
  
  // 6. Por defecto, no mostrar (evitar repetición)
  return false;
}

/**
 * Calcula el tiempo promedio entre mensajes
 * @param {Array} messages - Array de mensajes
 * @returns {number} Tiempo promedio en minutos
 */
function calculateAverageTimeDiff(messages) {
  if (messages.length < 2) return 0;
  
  const diffs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const diff = new Date(messages[i].createdAt) - new Date(messages[i + 1].createdAt);
    diffs.push(diff / (1000 * 60));
  }
  
  return diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
}

/**
 * Detecta silencio prolongado después de un mensaje negativo
 * @param {Array} conversationHistory - Historial de la conversación
 * @returns {boolean} true si hay silencio después de mensaje negativo
 */
function detectSilenceAfterNegative(conversationHistory) {
  if (!conversationHistory || conversationHistory.length < 2) return false;
  
  // Buscar el último mensaje del usuario con emoción negativa
  const lastUserMessage = conversationHistory.find(msg => 
    msg.role === 'user' && 
    msg.metadata?.context?.emotional?.mainEmotion &&
    ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'].includes(
      msg.metadata.context.emotional.mainEmotion
    )
  );
  
  if (!lastUserMessage) return false;
  
  // Verificar si hay mensajes después (del asistente o del usuario)
  const messagesAfter = conversationHistory.filter(msg => 
    new Date(msg.createdAt) > new Date(lastUserMessage.createdAt)
  );
  
  // Si no hay mensajes después y pasaron más de 24 horas, hay silencio
  if (messagesAfter.length === 0) {
    const hoursSince = (Date.now() - new Date(lastUserMessage.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSince > 24;
  }
  
  return false;
}

/**
 * Calcula el score de riesgo (función auxiliar para registro)
 * @param {Object} emotionalAnalysis - Análisis emocional
 * @param {Object} contextualAnalysis - Análisis contextual
 * @param {string} content - Contenido del mensaje
 * @param {Object} options - Opciones adicionales
 * @returns {number} Score de riesgo
 */
function calculateRiskScore(emotionalAnalysis, contextualAnalysis, content, options) {
  // Esta función replica la lógica de evaluateSuicideRisk pero retorna el score
  // Por simplicidad, usamos una versión simplificada
  let score = 0;
  
  if (contextualAnalysis?.intencion?.tipo === 'CRISIS') score += 3;
  if (/suicid/i.test(content)) score += 4;
  if (emotionalAnalysis?.intensity >= 9) score += 2;
  if (options?.trendAnalysis?.riskAdjustment) score += options.trendAnalysis.riskAdjustment;
  if (options?.crisisHistory?.recentCrises > 0) score += 2;
  
  return score;
}

/**
 * Extrae los factores de riesgo que contribuyeron al score
 * @param {Object} emotionalAnalysis - Análisis emocional
 * @param {Object} contextualAnalysis - Análisis contextual
 * @param {string} content - Contenido del mensaje
 * @param {Object} options - Opciones adicionales
 * @returns {Array<string>} Array de factores
 */
function extractRiskFactors(emotionalAnalysis, contextualAnalysis, content, options) {
  const factors = [];
  
  if (contextualAnalysis?.intencion?.tipo === 'CRISIS') factors.push('Intención de crisis');
  if (/suicid/i.test(content)) factors.push('Ideación suicida');
  if (emotionalAnalysis?.intensity >= 9) factors.push('Intensidad emocional muy alta');
  if (options?.trendAnalysis?.trends?.rapidDecline) factors.push('Deterioro rápido');
  if (options?.crisisHistory?.recentCrises > 0) factors.push('Crisis recientes');
  if (options?.conversationContext?.emotionalEscalation) factors.push('Escalada emocional');
  
  return factors;
}

/**
 * Extrae los factores protectores detectados
 * @param {Object} emotionalAnalysis - Análisis emocional
 * @param {string} content - Contenido del mensaje
 * @returns {Array<string>} Array de factores protectores
 */
function extractProtectiveFactors(emotionalAnalysis, content) {
  const factors = [];
  
  if (/ayuda|hablar|compartir/i.test(content)) factors.push('Búsqueda de ayuda');
  if (emotionalAnalysis?.secondary?.includes('esperanza')) factors.push('Esperanza detectada');
  if (/mejor|mejorando|progreso/i.test(content)) factors.push('Expresiones de mejora');
  if (/familia|amigos|apoyo/i.test(content)) factors.push('Menciones de apoyo social');
  
  return factors;
}

export default router;
