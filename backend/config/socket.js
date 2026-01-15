/**
 * Configuración de Socket.IO - Gestiona conexiones WebSocket en tiempo real
 */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import {
  openaiService,
  emotionalAnalyzer,
  contextAnalyzer,
  userProfileService
} from '../services/index.js';

// Constantes de configuración
const DEFAULT_FRONTEND_URLS = ['http://localhost:3000', 'http://localhost:19006'];
const PING_TIMEOUT = 60000; // 60 segundos
const PING_INTERVAL = 25000; // 25 segundos

// Constantes de mensajes de error
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Autenticación requerida',
  INVALID_TOKEN: 'Token inválido',
  USER_NOT_AUTHENTICATED: 'Usuario no autenticado'
};

// Constantes de eventos de socket
const SOCKET_EVENTS = {
  AUTHENTICATE: 'authenticate',
  MESSAGE: 'message',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  AI_TYPING: 'ai:typing',
  CANCEL_RESPONSE: 'cancel:response',
  ERROR: 'error',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  // Eventos de alertas de emergencia
  EMERGENCY_ALERT_SENT: 'emergency:alert:sent',
  EMERGENCY_ALERT_UPDATED: 'emergency:alert:updated',
};

// Helper: obtener URLs permitidas para CORS
const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    return Array.isArray(frontendUrl) ? frontendUrl : [frontendUrl];
  }
  return DEFAULT_FRONTEND_URLS;
};

// Helper: verificar y decodificar token JWT
const verifySocketToken = (token) => {
  if (!token) {
    throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
  }
};

/**
 * Configura y inicializa Socket.IO
 * @param {Object} server - Servidor HTTP de Express
 * @returns {Object} Instancia de Socket.IO configurada
 */
export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: PING_TIMEOUT,
    pingInterval: PING_INTERVAL
  });

  // Middleware de autenticación para sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const payload = verifySocketToken(token);
      socket.user = payload;
      next();
    } catch (error) {
      return next(new Error(error.message));
    }
  });

  // Manejo de eventos de conexión
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log('[SocketIO] Usuario conectado:', socket.id);
    
    let currentUserId = null;
    let responseTimeout = null;
    
    /**
     * Autenticación del socket
     * El cliente debe enviar su userId para unirse a su sala personal
     */
    socket.on(SOCKET_EVENTS.AUTHENTICATE, ({ userId }) => {
      if (!userId) {
        socket.emit(SOCKET_EVENTS.ERROR, { 
          message: 'userId es requerido para autenticación' 
        });
        return;
      }
      
      currentUserId = userId;
      socket.join(userId); // Unir al socket a una sala específica del usuario
      console.log(`[SocketIO] Socket ${socket.id} autenticado como usuario ${currentUserId}`);
    });
    
    /**
     * Manejo de mensajes del usuario
     * Procesa mensajes y genera respuestas usando OpenAI
     */
    socket.on(SOCKET_EVENTS.MESSAGE, async (data) => {
      try {
        // Validar que el usuario esté autenticado
        if (!currentUserId) {
          throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
        }
        
        // Validar que el mensaje tenga contenido
        if (!data || !data.text || typeof data.text !== 'string' || !data.text.trim()) {
          throw new Error('El mensaje debe contener un texto válido');
        }
        
        const messageText = data.text.trim();
        const userId = new mongoose.Types.ObjectId(currentUserId);
        
        // Emitir estado de escritura de la IA
        socket.emit(SOCKET_EVENTS.AI_TYPING, true);
        
        // 1. Obtener o crear conversación para el usuario
        let conversation = await Conversation.findOne({ 
          userId: userId,
          status: 'active'
        }).sort({ updatedAt: -1 }); // Obtener la conversación más reciente
        
        if (!conversation) {
          // Crear nueva conversación si no existe
          conversation = new Conversation({ userId });
          await conversation.save();
          console.log(`[SocketIO] Nueva conversación creada: ${conversation._id}`);
        }
        
        // 2. Guardar mensaje del usuario
        const userMessage = new Message({
          userId: userId,
          content: messageText,
          role: 'user',
          conversationId: conversation._id,
          metadata: {
            status: 'sent'
          }
        });
        await userMessage.save();
        
        // Emitir confirmación de mensaje enviado (el frontend ya lo mostró, esto es solo confirmación)
        socket.emit(SOCKET_EVENTS.MESSAGE_SENT, {
          id: userMessage._id.toString(),
          text: messageText,
          userId: currentUserId,
          timestamp: new Date()
        });
        
        // 3. Obtener historial de conversación para contexto (incluir el mensaje recién guardado)
        const conversationHistory = await Message.find({
          conversationId: conversation._id,
          createdAt: { $gte: new Date(Date.now() - 20 * 60 * 1000) } // Últimos 20 minutos
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
        
        // 4. Análisis emocional y contextual (en paralelo)
        const [emotionalAnalysis, contextualAnalysis, userProfile] = await Promise.all([
          emotionalAnalyzer.analyzeEmotion(messageText).catch(err => {
            console.error('[SocketIO] Error en análisis emocional:', err);
            return null;
          }),
          contextAnalyzer.analizarMensaje(userMessage, conversationHistory).catch(err => {
            console.error('[SocketIO] Error en análisis contextual:', err);
            return null;
          }),
          userProfileService.getOrCreateProfile(userId).catch(err => {
            console.error('[SocketIO] Error obteniendo perfil:', err);
            return null;
          })
        ]);
        
        // 5. Preparar historial para el prompt
        const historialParaPrompt = conversationHistory
          .slice(0, 6)
          .reverse()
          .map(msg => ({
            role: msg.role || 'user',
            content: msg.content || ''
          }))
          .filter(msg => msg.content.trim().length > 0);
        
        // 6. Generar respuesta usando OpenAI
        const response = await openaiService.generarRespuesta(
          userMessage,
          {
            history: historialParaPrompt,
            emotional: emotionalAnalysis,
            contextual: contextualAnalysis,
            profile: userProfile
          }
        );
        
        // 7. Guardar mensaje del asistente
        const assistantMessage = new Message({
          userId: userId,
          content: response.content,
          role: 'assistant',
          conversationId: conversation._id,
          metadata: {
            status: 'sent',
            context: {
              emotional: emotionalAnalysis,
              contextual: contextualAnalysis,
              response: JSON.stringify(response.context)
            }
          }
        });
        await assistantMessage.save();
        
        // 8. Actualizar última conversación
        await Conversation.findByIdAndUpdate(conversation._id, { 
          lastMessage: assistantMessage._id 
        });
        
        // 9. Emitir respuesta al cliente
        socket.emit(SOCKET_EVENTS.AI_TYPING, false);
        socket.emit(SOCKET_EVENTS.MESSAGE_RECEIVED, {
          id: assistantMessage._id.toString(),
          text: response.content,
          userId: currentUserId,
          timestamp: new Date()
        });
        
        console.log(`[SocketIO] Mensaje procesado para usuario ${currentUserId}`);
        
      } catch (error) {
        console.error('[SocketIO] Error en el manejo del mensaje:', error);
        socket.emit(SOCKET_EVENTS.AI_TYPING, false);
        socket.emit(SOCKET_EVENTS.ERROR, { 
          message: error.message || 'Error al procesar el mensaje' 
        });
      }
    });
    
    /**
     * Cancelar respuesta en proceso
     * Permite al usuario cancelar una respuesta que se está generando
     */
    socket.on(SOCKET_EVENTS.CANCEL_RESPONSE, () => {
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }
      socket.emit(SOCKET_EVENTS.AI_TYPING, false);
      console.log(`[SocketIO] Respuesta cancelada por usuario ${currentUserId}`);
    });
    
    /**
     * Manejo de desconexión
     * Limpia recursos y notifica la desconexión
     */
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      // Limpiar timeout si existe
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }
      
      // Salir de la sala del usuario
      if (currentUserId) {
        socket.leave(currentUserId);
        console.log(`[SocketIO] Usuario ${currentUserId} desconectado del socket ${socket.id}`);
      } else {
        console.log(`[SocketIO] Usuario desconectado: ${socket.id}`);
      }
    });
  });

  // Exportar instancia de io y eventos para uso en otros módulos
  io.SOCKET_EVENTS = SOCKET_EVENTS;
  
  return io;
};

// Helper: Emitir evento de alerta de emergencia a un usuario específico
export const emitEmergencyAlert = (io, userId, alertData) => {
  if (!io || !userId) {
    console.error('[SocketIO] No se puede emitir alerta: io o userId no válidos');
    return;
  }
  
  try {
    io.to(userId.toString()).emit(SOCKET_EVENTS.EMERGENCY_ALERT_SENT, {
      ...alertData,
      timestamp: new Date().toISOString()
    });
    console.log(`[SocketIO] ✅ Alerta de emergencia emitida a usuario ${userId}`);
  } catch (error) {
    console.error('[SocketIO] Error emitiendo alerta de emergencia:', error);
  }
};
