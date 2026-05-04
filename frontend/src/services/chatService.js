import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeProposedProductActions } from '../utils/sanitizeProposedProductActions';
import api, { API_URL } from '../config/api';
import { isValidSessionIntentionId } from '../constants/sessionIntention';
import { clearPersistedChatSession } from '../utils/chatSessionStorage';
import { postChatSseWithXHR, streamChatSseWithFetch } from '../utils/chatSseStream';
import { Platform } from 'react-native';
import { GUEST_CHAT_STORAGE_KEYS as GUEST_KEYS } from '../constants/guestChatStorageKeys';

const API_BASE_URL = 'https://antobackend.onrender.com';

// Mantener los callbacks para compatibilidad
let messageCallbacks = [];
let errorCallbacks = [];

// Función para manejar mensajes
const handleMessage = (message) => {
  messageCallbacks.forEach(callback => callback(message));
};

// Función para manejar errores
const handleError = (error) => {
  errorCallbacks.forEach(callback => callback(error));
};

// Inicializar el servicio
export const initializeSocket = async () => {
  try {
    console.log('Inicializando servicio de chat');
    
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.warn('No hay token de autenticación al inicializar chat');
      return false;
    }

    let conversationId = await AsyncStorage.getItem('currentConversationId');
    
    if (!conversationId) {
      try {
      conversationId = await createConversation();
        console.log('Conversación creada durante inicialización:', conversationId);
      } catch (createError) {
        console.error('Error al crear conversación durante inicialización:', createError);
        // No lanzar error aquí, permitir que sendMessage lo maneje
        return false;
      }
    }
    
    console.log('Chat inicializado:', { conversationId });
    return true;
  } catch (error) {
    console.error('Error al inicializar chat:', error);
    return false;
  }
};

// Enviar un mensaje y obtener respuesta
export const sendMessage = async (text) => {
  try {
    console.log('Enviando mensaje:', text);
    
    let conversationId = await AsyncStorage.getItem('currentConversationId');
    
    // Si no hay conversación activa, intentar crear una
    if (!conversationId) {
      console.log('No hay conversación activa, creando una nueva...');
      try {
        conversationId = await createConversation();
        console.log('Conversación creada:', conversationId);
      } catch (createError) {
        console.error('Error al crear conversación:', createError);
        // Preservar el error original si es de suscripción
        if (createError.message?.includes('suscripción') || 
            createError.message?.includes('subscription') ||
            createError.message?.includes('trial') ||
            (createError.response?.status === 403 && createError.response?.data?.requiresSubscription)) {
          // Preservar el error de suscripción para que se maneje correctamente
          throw createError;
        }
        throw new Error('No se pudo crear una conversación. Por favor, intenta de nuevo.');
      }
    }

    const userMessage = {
      content: text,
      role: 'user',
      conversationId: conversationId,
      type: 'text',
      metadata: {
        timestamp: new Date().toISOString(),
        device: Platform.OS
      }
    };

    const response = await api.post('/api/chat/messages', userMessage);
    console.log('Respuesta del servidor:', response);

    // La respuesta ya incluye userMessage y assistantMessage
    return response;
  } catch (error) {
    console.error('Error detallado al enviar mensaje:', error);
    throw error;
  }
};

/**
 * Envía un mensaje y recibe la respuesta por streaming (SSE).
 * En React Native sin getReader se usa el endpoint normal para garantizar que el texto aparezca.
 * @param {string} text - Contenido del mensaje
 * @param {Object} callbacks - { onChunk(content: string), onDone(payload: object) }
 * @returns {Promise<void>}
 */
export const isGuestChatMode = async () => {
  const mode = await AsyncStorage.getItem(GUEST_KEYS.CHAT_MODE);
  const t = await AsyncStorage.getItem(GUEST_KEYS.GUEST_TOKEN);
  return mode === 'guest' && !!t;
};

/** Crea sesión invitada en el servidor y guarda token + conversación localmente. */
export const startGuestChatSession = async () => {
  const response = await fetch(`${API_URL}/api/chat/guest/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  let data = {};
  try {
    data = await response.json();
  } catch (_) {}
  if (response.status === 429) {
    const err = new Error(
      data.message || 'Demasiados intentos. Espera un poco o crea una cuenta.'
    );
    err.code = 'RATE_LIMIT';
    throw err;
  }
  if (!response.ok) {
    throw new Error(data.message || 'No se pudo iniciar el chat de invitado');
  }
  await AsyncStorage.multiSet([
    [GUEST_KEYS.CHAT_MODE, 'guest'],
    [GUEST_KEYS.GUEST_TOKEN, data.guestToken],
    [GUEST_KEYS.GUEST_CONVERSATION_ID, data.conversationId],
  ]);
  return data;
};

export const clearGuestChat = async () => {
  await AsyncStorage.multiRemove([
    GUEST_KEYS.CHAT_MODE,
    GUEST_KEYS.GUEST_TOKEN,
    GUEST_KEYS.GUEST_CONVERSATION_ID,
  ]);
};

const HANDOFF_MAX_LEN = 1500;

function buildGuestHandoffSummary(messages) {
  if (!messages?.length) return '';
  const sorted = [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt || a.metadata?.timestamp || 0).getTime();
    const tb = new Date(b.createdAt || b.metadata?.timestamp || 0).getTime();
    return ta - tb;
  });
  const slice = sorted.slice(-12);
  const lines = slice.map((m) => {
    const role = m.role === 'user' ? 'Yo' : 'Anto';
    const content = (m.content || '').trim().replace(/\s+/g, ' ');
    const short = content.length > 220 ? `${content.slice(0, 217)}…` : content;
    return `${role}: ${short}`;
  });
  let text = lines.join('\n');
  if (text.length > HANDOFF_MAX_LEN) {
    text = `${text.slice(0, HANDOFF_MAX_LEN - 1)}…`;
  }
  return text;
}

/**
 * Antes de borrar la sesión invitada al iniciar sesión, guarda un resumen local
 * para ofrecer continuidad en el chat con cuenta (consentimiento en la UI).
 */
export async function prepareGuestHandoffBeforeClear() {
  try {
    if (!(await isGuestChatMode())) return;
    const convId = await AsyncStorage.getItem(GUEST_KEYS.GUEST_CONVERSATION_ID);
    if (!convId) return;
    const messages = await getGuestMessages(convId);
    if (!messages.length) return;
    const summaryText = buildGuestHandoffSummary(messages);
    await AsyncStorage.setItem(
      GUEST_KEYS.GUEST_HANDOFF_PENDING,
      JSON.stringify({
        summaryText,
        messageCount: messages.length,
        createdAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn('[GuestHandoff] No se pudo preparar el resumen:', e?.message || e);
  }
}

export async function clearGuestHandoff() {
  try {
    await AsyncStorage.removeItem(GUEST_KEYS.GUEST_HANDOFF_PENDING);
  } catch (_) {}
}

export const getGuestMessages = async (conversationId) => {
  const token = await AsyncStorage.getItem(GUEST_KEYS.GUEST_TOKEN);
  if (!token || !conversationId) return [];
  const response = await fetch(
    `${API_URL}/api/chat/guest/conversations/${encodeURIComponent(conversationId)}/messages`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (response.status === 401) {
    await clearGuestChat();
    const err = new Error('Sesión de invitado expirada o no válida');
    err.guestAuthFailed = true;
    err.code = 'GUEST_AUTH_FAILED';
    throw err;
  }
  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(data.message || 'Demasiadas peticiones. Espera un momento.');
    err.code = 'RATE_LIMIT';
    throw err;
  }
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return data.messages || [];
};

async function postGuestMessage(text, conversationId, token) {
  const response = await fetch(`${API_URL}/api/chat/guest/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId, content: text }),
  });
  let data = {};
  try {
    data = await response.json();
  } catch (_) {}
  if (response.status === 401) {
    await clearGuestChat();
    const err = new Error(data.message || 'Sesión de invitado expirada o no válida');
    err.guestAuthFailed = true;
    err.code = data.code || 'GUEST_AUTH_FAILED';
    throw err;
  }
  if (response.status === 429) {
    const err = new Error(data.message || 'Demasiados mensajes. Espera un momento.');
    err.code = 'RATE_LIMIT';
    throw err;
  }
  if (response.status === 403 && data.code === 'GUEST_LIMIT_REACHED') {
    const err = new Error(data.message || 'Límite de mensajes de invitado');
    err.code = 'GUEST_LIMIT_REACHED';
    err.maxUserMessages = data.maxUserMessages;
    err.requiresAccount = true;
    err.response = { status: 403, data };
    throw err;
  }
  if (!response.ok) {
    const e = new Error(data.message || 'Error al enviar el mensaje');
    e.response = { status: response.status, data };
    throw e;
  }
  return data;
}

export const sendMessageStream = async (text, { onChunk, onDone }) => {
  if (await isGuestChatMode()) {
    const conversationId = await AsyncStorage.getItem(GUEST_KEYS.GUEST_CONVERSATION_ID);
    const token = await AsyncStorage.getItem(GUEST_KEYS.GUEST_TOKEN);
    if (!conversationId || !token) {
      throw new Error('Sesión de invitado no válida');
    }
    const data = await postGuestMessage(text, conversationId, token);
    if (data?.assistantMessage?.content && onChunk) onChunk(data.assistantMessage.content);
    if (onDone) {
      onDone({
        done: true,
        messageId: data?.assistantMessage?._id?.toString?.() || data?.assistantMessage?._id,
        content: data?.assistantMessage?.content ?? '',
        suggestions: data?.suggestions,
        proposedProductActions: sanitizeProposedProductActions(data?.proposedProductActions),
        context: data?.context,
        guest: data?.guest,
      });
    }
    return;
  }

  let conversationId = await AsyncStorage.getItem('currentConversationId');
  if (!conversationId) {
    conversationId = await createConversation();
  }

  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('No hay token de autenticación');

  const url = `${API_URL}/api/chat/messages?stream=true`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    Authorization: `Bearer ${token}`,
  };
  const body = JSON.stringify({
    content: text,
    role: 'user',
    conversationId,
  });

  // iOS/Android: SSE incremental con XMLHttpRequest (responseText crece).
  // Web: fetch + getReader o parseo del cuerpo completo.
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  if (isNative) {
    await postChatSseWithXHR({ url, headers, body, onChunk, onDone });
    return;
  }

  await streamChatSseWithFetch({ url, headers, body, onChunk, onDone });
};

// Registrar callbacks (mantener para compatibilidad)
export const onMessage = (callback) => {
  messageCallbacks.push(callback);
  return () => {
    messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
  };
};

export const onError = (callback) => {
  errorCallbacks.push(callback);
  return () => {
    errorCallbacks = errorCallbacks.filter(cb => cb !== callback);
  };
};

// Función para guardar mensajes localmente
export const saveMessages = async (messages) => {
  try {
    await AsyncStorage.setItem('chatMessages', JSON.stringify(messages));
  } catch (error) {
    console.error('Error al guardar mensajes:', error);
    handleError(error);
  }
};

// Función para cargar mensajes
export const loadMessages = async () => {
  try {
    const savedMessages = await AsyncStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
    handleError(error);
    return [];
  }
};

// Función para limpiar mensajes (servidor + caché local)
export const clearMessages = async () => {
  try {
    if (await isGuestChatMode()) {
      const convId = await AsyncStorage.getItem(GUEST_KEYS.GUEST_CONVERSATION_ID);
      const token = await AsyncStorage.getItem(GUEST_KEYS.GUEST_TOKEN);
      if (convId && token) {
        const response = await fetch(
          `${API_URL}/api/chat/guest/conversations/${encodeURIComponent(convId)}/messages`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (response.status === 401) {
          await clearGuestChat();
        } else if (!response.ok) {
          let message = 'No se pudo borrar la conversación';
          try {
            const data = await response.json();
            if (data.message) message = data.message;
          } catch (_) {}
          const err = new Error(message);
          err.response = { status: response.status };
          throw err;
        }
      }
    } else {
      const token = await AsyncStorage.getItem('userToken');
      const convId = await AsyncStorage.getItem('currentConversationId');
      if (token && convId) {
        try {
          await api.delete(`/api/chat/conversations/${encodeURIComponent(convId)}`);
        } catch (err) {
          const status = err?.response?.status;
          if (status !== 404) throw err;
        }
      }
    }

    await AsyncStorage.removeItem('chatMessages');
    return true;
  } catch (error) {
    console.error('Error al limpiar mensajes:', error);
    handleError(error);
    throw error;
  }
};

// Cerrar servicio (mantener para compatibilidad)
export const closeSocket = () => {
  console.log('Cerrando servicio de chat');
  messageCallbacks = [];
  errorCallbacks = [];
};

/**
 * Crea conversación en el servidor.
 * @param {{ sessionIntention?: 'vent'|'organize'|'technique'|'plan' }} [options]
 */
export const createConversation = async (options = {}) => {
  try {
    const sessionIntention =
      typeof options === 'string' ? options : options?.sessionIntention;
    if (sessionIntention != null && String(sessionIntention).trim() !== '') {
      if (!isValidSessionIntentionId(sessionIntention)) {
        const e = new Error('sessionIntention inválido');
        e.code = 'INVALID_SESSION_INTENTION';
        throw e;
      }
    }
    const body = {
      metadata: {
        type: 'general',
        startedAt: new Date().toISOString(),
        platform: Platform.OS
      },
      ...(sessionIntention && isValidSessionIntentionId(sessionIntention)
        ? { sessionIntention: String(sessionIntention).trim() }
        : {})
    };
    const response = await api.post('/api/chat/conversations', body);

    if (response && response.conversationId) {
      await AsyncStorage.setItem('currentConversationId', response.conversationId);
      return response.conversationId;
    }

    throw new Error('No se pudo crear la conversación');
  } catch (error) {
    console.error('Error al crear conversación:', error);
    throw error;
  }
};

/**
 * Fija la intención de sesión (#72) antes del primer mensaje del usuario.
 * @param {string} conversationId
 * @param {'vent'|'organize'|'technique'|'plan'} sessionIntention
 */
export const setSessionIntention = async (conversationId, sessionIntention) => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('Sesión requerida');
  const cid = String(conversationId ?? '').trim();
  if (!/^[\da-f]{24}$/i.test(cid)) {
    const e = new Error('ID de conversación inválido');
    e.code = 'INVALID_CONVERSATION_ID';
    throw e;
  }
  if (!isValidSessionIntentionId(sessionIntention)) {
    const e = new Error('sessionIntention inválido');
    e.code = 'INVALID_SESSION_INTENTION';
    throw e;
  }
  return api.patch(`/api/chat/conversations/${cid}/session-intention`, {
    sessionIntention: String(sessionIntention).trim()
  });
};

/**
 * Valoración rápida de un mensaje del asistente (solo cuenta con sesión registrada).
 * @param {string} messageId - _id Mongo del mensaje
 * @param {'up' | 'down' | null} helpful - null quita la valoración
 * @throws {Error} code NO_AUTH | INVALID_ID | INVALID_HELPFUL o error de red/API
 */
export const submitMessageFeedback = async (messageId, helpful) => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    const e = new Error('Sesión requerida');
    e.code = 'NO_AUTH';
    throw e;
  }
  const id = String(messageId ?? '').trim();
  if (!/^[\da-f]{24}$/i.test(id)) {
    const e = new Error('ID de mensaje inválido');
    e.code = 'INVALID_ID';
    throw e;
  }
  if (helpful !== null && helpful !== 'up' && helpful !== 'down') {
    const e = new Error('Valor de helpful inválido');
    e.code = 'INVALID_HELPFUL';
    throw e;
  }
  return api.patch(`/api/chat/messages/${id}/feedback`, { helpful });
};

// Agregar función para obtener mensajes (+ meta de conversación)
export const getMessages = async (conversationId) => {
  try {
    const response = await api.get(`/api/chat/conversations/${conversationId}`);
    const rawIntention = response.sessionIntention ?? null;
    return {
      messages: response.messages ?? [],
      sessionIntention: isValidSessionIntentionId(rawIntention) ? String(rawIntention).trim() : null
    };
  } catch (error) {
    const status = error?.response?.status;
    const msg = String(error?.message || '');
    if (status === 404 || msg.includes('no encontrada')) {
      await clearPersistedChatSession();
    }
    console.error('Error al obtener mensajes:', error);
    return { messages: [], sessionIntention: null };
  }
};

export default {
  initializeSocket,
  sendMessage,
  sendMessageStream,
  submitMessageFeedback,
  onMessage,
  onError,
  saveMessages,
  loadMessages,
  clearMessages,
  closeSocket,
  getMessages,
  createConversation,
  setSessionIntention,
  isGuestChatMode,
  startGuestChatSession,
  clearGuestChat,
  getGuestMessages,
  prepareGuestHandoffBeforeClear,
  clearGuestHandoff,
}; 