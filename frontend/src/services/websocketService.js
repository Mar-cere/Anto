/**
 * Servicio de WebSocket para notificaciones en tiempo real
 * 
 * Gestiona la conexión Socket.IO para recibir notificaciones en tiempo real,
 * incluyendo alertas de emergencia y otras actualizaciones.
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { API_URL } from '../config/api';

// Helper para obtener la URL del servidor
const getSocketUrl = () => {
  // En desarrollo, usar localhost si es necesario
  if (__DEV__ && API_URL.includes('localhost')) {
    return API_URL;
  }
  return API_URL;
};

// Constantes de eventos
const SOCKET_EVENTS = {
  AUTHENTICATE: 'authenticate',
  EMERGENCY_ALERT_SENT: 'emergency:alert:sent',
  EMERGENCY_ALERT_UPDATED: 'emergency:alert:updated',
  ERROR: 'error',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
};

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 segundo inicial
  }

  /**
   * Conectar al servidor Socket.IO
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si la conexión fue exitosa
   */
  async connect(userId) {
    try {
      // Obtener token de autenticación
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('[WebSocketService] No hay token de autenticación');
        return false;
      }

      // Si ya hay una conexión, desconectar primero
      if (this.socket && this.socket.connected) {
        this.disconnect();
      }

      // Crear nueva conexión
      this.socket = io(getSocketUrl(), {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      // Eventos de conexión
      this.socket.on(SOCKET_EVENTS.CONNECTION, () => {
        console.log('[WebSocketService] ✅ Conectado al servidor');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Autenticar con userId
        if (userId) {
          this.socket.emit(SOCKET_EVENTS.AUTHENTICATE, { userId });
        }
      });

      this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('[WebSocketService] Desconectado:', reason);
        this.isConnected = false;
      });

      this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error('[WebSocketService] Error:', error);
        this.emit('error', error);
      });

      // Evento de reconexión
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`[WebSocketService] Reconectado después de ${attemptNumber} intentos`);
        this.reconnectAttempts = 0;
        if (userId) {
          this.socket.emit(SOCKET_EVENTS.AUTHENTICATE, { userId });
        }
      });

      // Evento de error de reconexión
      this.socket.on('reconnect_error', (error) => {
        this.reconnectAttempts++;
        console.error(`[WebSocketService] Error de reconexión (intento ${this.reconnectAttempts}):`, error);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[WebSocketService] Máximo de intentos de reconexión alcanzado');
          this.emit('error', { message: 'No se pudo reconectar al servidor' });
        }
      });

      // Escuchar eventos de alertas de emergencia
      this.socket.on(SOCKET_EVENTS.EMERGENCY_ALERT_SENT, (data) => {
        console.log('[WebSocketService] Alerta de emergencia recibida:', data);
        this.emit('emergency:alert:sent', data);
      });

      this.socket.on(SOCKET_EVENTS.EMERGENCY_ALERT_UPDATED, (data) => {
        console.log('[WebSocketService] Alerta de emergencia actualizada:', data);
        this.emit('emergency:alert:updated', data);
      });

      return true;
    } catch (error) {
      console.error('[WebSocketService] Error conectando:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Desconectar del servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[WebSocketService] Desconectado del servidor');
    }
  }

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback
   * @returns {Function} Función para desuscribirse
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Retornar función para desuscribirse
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Desuscribirse de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emitir evento interno a los listeners
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos del evento
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocketService] Error en callback de evento ${event}:`, error);
        }
      });
    }
  }

  /**
   * Verificar si está conectado
   * @returns {boolean}
   */
  getConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;

