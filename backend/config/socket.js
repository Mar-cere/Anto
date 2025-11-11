/**
 * Configuración de Socket.IO - Gestiona conexiones WebSocket en tiempo real
 */
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

// Constantes de configuración
const DEFAULT_FRONTEND_URLS = ['http://localhost:3000', 'http://localhost:19006'];
const PING_TIMEOUT = 60000; // 60 segundos
const PING_INTERVAL = 25000; // 25 segundos
const SIMULATED_RESPONSE_DELAY = 1000; // 1 segundo (solo para desarrollo)

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
  DISCONNECT: 'disconnect'
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
     * Procesa mensajes y genera respuestas (simulado por ahora)
     */
    socket.on(SOCKET_EVENTS.MESSAGE, async (data) => {
      try {
        // Validar que el usuario esté autenticado
        if (!currentUserId) {
          throw new Error(ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
        }
        
        // Validar que el mensaje tenga contenido
        if (!data || !data.text || typeof data.text !== 'string') {
          throw new Error('El mensaje debe contener un texto válido');
        }
        
        // Emitir estado de escritura de la IA
        socket.emit(SOCKET_EVENTS.AI_TYPING, true);
        
        // Emitir confirmación de mensaje enviado
        socket.emit(SOCKET_EVENTS.MESSAGE_SENT, {
          ...data,
          userId: currentUserId,
          timestamp: new Date()
        });
        
        // TODO: Aquí se debe agregar la lógica real para procesar el mensaje:
        // - Guardar en la base de datos
        // - Generar respuesta usando el servicio de OpenAI
        // - Actualizar el perfil del usuario
        // - Emitir respuesta al cliente
        
        // Simulación de respuesta (solo para desarrollo)
        responseTimeout = setTimeout(() => {
          socket.emit(SOCKET_EVENTS.AI_TYPING, false);
          socket.emit(SOCKET_EVENTS.MESSAGE_RECEIVED, {
            userId: currentUserId,
            text: `Respuesta al mensaje: "${data.text}"`,
            timestamp: new Date()
          });
        }, SIMULATED_RESPONSE_DELAY);
        
      } catch (error) {
        console.error('[SocketIO] Error en el manejo del mensaje:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        socket.emit(SOCKET_EVENTS.AI_TYPING, false);
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

  return io;
};
