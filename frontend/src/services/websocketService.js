/**
 * Servicio de WebSocket (Socket.IO): chat en tiempo real + alertas de emergencia.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { API_URL } from '../config/api';
import { CHAT_SOCKET_EVENTS } from '../constants/chatSocketEvents';

const CONNECT_TIMEOUT_MS = 12000;
const CHAT_TURN_TIMEOUT_MS = 120000;

const getSocketUrl = () => {
  if (__DEV__ && API_URL.includes('localhost')) {
    return API_URL;
  }
  return API_URL;
};

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.lastUserId = null;
    this.chatTurnCleanup = null;
  }

  _bindSocketHandlers(userId) {
    if (!this.socket) return;

    this.socket.on(CHAT_SOCKET_EVENTS.AI_TYPING, (typing) => {
      this.emit('chat:typing', Boolean(typing));
    });

    this.socket.on(CHAT_SOCKET_EVENTS.ERROR, (error) => {
      this.emit('error', error);
    });

    this.socket.on('reconnect', () => {
      this.reconnectAttempts = 0;
      if (userId) {
        this.socket.emit(CHAT_SOCKET_EVENTS.AUTHENTICATE, { userId });
      }
    });

    this.socket.on('reconnect_error', (error) => {
      this.reconnectAttempts += 1;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('error', { message: 'No se pudo reconectar al servidor' });
      }
      console.error('[WebSocketService] reconnect_error:', error?.message || error);
    });

    this.socket.on(CHAT_SOCKET_EVENTS.EMERGENCY_ALERT_SENT, (data) => {
      this.emit('emergency:alert:sent', data);
    });

    this.socket.on(CHAT_SOCKET_EVENTS.EMERGENCY_ALERT_UPDATED, (data) => {
      this.emit('emergency:alert:updated', data);
    });
  }

  async _waitForSocketConnect() {
    if (this.socket?.connected) return true;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, CONNECT_TIMEOUT_MS);

      const onConnect = () => {
        cleanup();
        resolve(true);
      };
      const onError = () => {
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        clearTimeout(timer);
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
      };

      this.socket?.on('connect', onConnect);
      this.socket?.on('connect_error', onError);
    });
  }

  /**
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async connect(userId) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('[WebSocketService] No hay token de autenticación');
        return false;
      }

      this.lastUserId = userId ? String(userId) : this.lastUserId;

      if (this.socket?.connected) {
        if (userId) {
          this.socket.emit(CHAT_SOCKET_EVENTS.AUTHENTICATE, { userId });
        }
        this.isConnected = true;
        return true;
      }

      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(getSocketUrl(), {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (userId) {
          this.socket.emit(CHAT_SOCKET_EVENTS.AUTHENTICATE, { userId });
        }
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this._bindSocketHandlers(userId);

      const ok = await this._waitForSocketConnect();
      this.isConnected = ok && Boolean(this.socket?.connected);
      return this.isConnected;
    } catch (error) {
      console.error('[WebSocketService] Error conectando:', error);
      this.emit('error', error);
      return false;
    }
  }

  disconnect() {
    this._clearChatTurnWaiters();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  cancelChatResponse() {
    if (this.socket?.connected) {
      this.socket.emit(CHAT_SOCKET_EVENTS.CANCEL_RESPONSE);
    }
    this._clearChatTurnWaiters(new Error('Aborted'));
  }

  _clearChatTurnWaiters(rejectError = null) {
    if (this.chatTurnCleanup) {
      const cleanup = this.chatTurnCleanup;
      this.chatTurnCleanup = null;
      cleanup(rejectError);
    }
  }

  /**
   * Envía mensaje de chat y espera message:received (un turno).
   */
  sendChatMessage({ text, conversationId, resumeTccLite, language, signal } = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        const err = new Error('Socket no conectado');
        err.code = 'SOCKET_UNAVAILABLE';
        reject(err);
        return;
      }

      if (signal?.aborted) {
        const err = new Error('Aborted');
        err.code = 'ABORTED';
        err.name = 'AbortError';
        reject(err);
        return;
      }

      const supersededErr = new Error('Turno de chat reemplazado');
      supersededErr.code = 'TURN_SUPERSEDED';
      this._clearChatTurnWaiters(supersededErr);

      const turnTimer = setTimeout(() => {
        const timeoutErr = new Error('Tiempo de espera agotado (socket)');
        timeoutErr.code = 'SOCKET_TIMEOUT';
        finish(timeoutErr);
      }, CHAT_TURN_TIMEOUT_MS);

      const onReceived = (payload) => {
        finish(null, payload);
      };

      const onSocketError = (payload) => {
        const err = new Error(payload?.message || 'Error de socket en chat');
        const code = payload?.code ? String(payload.code).trim().toUpperCase() : '';
        err.code = code || 'SOCKET_ERROR';
        finish(err);
      };

      const onAbort = () => {
        this.cancelChatResponse();
        const err = new Error('Aborted');
        err.code = 'ABORTED';
        err.name = 'AbortError';
        finish(err);
      };

      const finish = (err, payload) => {
        clearTimeout(turnTimer);
        this.socket?.off(CHAT_SOCKET_EVENTS.MESSAGE_RECEIVED, onReceived);
        this.socket?.off(CHAT_SOCKET_EVENTS.ERROR, onSocketError);
        signal?.removeEventListener('abort', onAbort);
        if (this.chatTurnCleanup === cleanupRef) {
          this.chatTurnCleanup = null;
        }
        if (err) {
          if (!err.code && err.message?.includes('Tiempo')) err.code = 'SOCKET_TIMEOUT';
          reject(err);
        } else {
          resolve(payload);
        }
      };

      const cleanupRef = (rejectError) => {
        clearTimeout(turnTimer);
        this.socket?.off(CHAT_SOCKET_EVENTS.MESSAGE_RECEIVED, onReceived);
        this.socket?.off(CHAT_SOCKET_EVENTS.ERROR, onSocketError);
        signal?.removeEventListener('abort', onAbort);
        if (rejectError) {
          if (!rejectError.code) rejectError.code = 'ABORTED';
          reject(rejectError);
        }
      };
      this.chatTurnCleanup = cleanupRef;

      this.socket.on(CHAT_SOCKET_EVENTS.MESSAGE_RECEIVED, onReceived);
      this.socket.on(CHAT_SOCKET_EVENTS.ERROR, onSocketError);
      signal?.addEventListener('abort', onAbort, { once: true });

      const resumePayload =
        resumeTccLite?.distortionType
          ? {
              distortionType: resumeTccLite.distortionType,
              distortionLabel: resumeTccLite.distortionLabel || '',
            }
          : undefined;

      const trimmed = String(text || '').trim();
      if (!trimmed) {
        const err = new Error('El mensaje no puede estar vacío');
        err.code = 'EMPTY_MESSAGE';
        reject(err);
        return;
      }

      this.socket.emit(CHAT_SOCKET_EVENTS.MESSAGE, {
        text: trimmed,
        conversationId: conversationId ? String(conversationId) : undefined,
        language: language || undefined,
        ...(resumePayload ? { resumeTccLite: resumePayload } : {}),
      });
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WebSocketService] Error en callback ${event}:`, error);
      }
    });
  }

  getConnected() {
    return this.isConnected && Boolean(this.socket?.connected);
  }
}

const websocketService = new WebSocketService();

export { CHAT_SOCKET_EVENTS };
export default websocketService;
