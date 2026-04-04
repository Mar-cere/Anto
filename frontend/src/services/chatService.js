import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from '../config/api';
import { clearPersistedChatSession } from '../utils/chatSessionStorage';
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

  // En React Native no usamos stream (getReader suele no existir o response.text() no devuelve el cuerpo bien).
  // Usamos el endpoint normal para que el texto siempre aparezca.
  const useNonStream = Platform.OS === 'ios' || Platform.OS === 'android';
  if (useNonStream) {
    const data = await api.post('/api/chat/messages', {
      content: text,
      role: 'user',
      conversationId,
    });
    if (data?.assistantMessage?.content && onChunk) onChunk(data.assistantMessage.content);
    if (onDone) {
      onDone({
        done: true,
        messageId: data?.assistantMessage?._id?.toString?.() || data?.assistantMessage?._id,
        content: data?.assistantMessage?.content ?? '',
        suggestions: data?.suggestions,
        context: data?.context,
      });
    }
    return;
  }

  const url = `${API_URL}/api/chat/messages?stream=true`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: text,
      role: 'user',
      conversationId,
    }),
  });

  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const data = await response.json();
      errMsg = data.message || data.error || errMsg;
    } catch (_) {}
    const err = new Error(errMsg);
    err.response = { status: response.status };
    throw err;
  }

  const reader = response.body?.getReader?.();
  if (!reader) {
    // Entornos sin getReader: leer todo el cuerpo y parsear SSE
    const rawText = await response.text();
    const lines = rawText.split(/\n\n+/);
    let accumulatedContent = '';
    for (const line of lines) {
      const trimmed = line.trim().replace(/^data:\s*/, '');
      if (!trimmed) continue;
      try {
        const payload = JSON.parse(trimmed);
        if (payload.error) throw new Error(payload.error);
        if (payload.done === true) {
          if (onDone) onDone(payload);
          return;
        }
        if (typeof payload.content === 'string') {
          accumulatedContent += payload.content;
          if (onChunk) onChunk(payload.content);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
    // Si no hubo evento "done", intentar onDone con el contenido acumulado por si el último evento vino sin done
    if (onDone && accumulatedContent) {
      onDone({ done: true, content: accumulatedContent, messageId: null, suggestions: [] });
    }
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.error) throw new Error(payload.error);
          if (payload.done === true) {
            if (onDone) onDone(payload);
          } else if (typeof payload.content === 'string' && onChunk) {
            onChunk(payload.content);
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
    if (buffer.trim()) {
      if (buffer.startsWith('data: ')) {
        try {
          const payload = JSON.parse(buffer.slice(6));
          if (payload.error) throw new Error(payload.error);
          if (payload.done === true) {
            if (onDone) onDone(payload);
          } else if (typeof payload.content === 'string' && onChunk) {
            onChunk(payload.content);
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
    }
  } finally {
    reader.releaseLock?.();
  }
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

// Función para limpiar mensajes
export const clearMessages = async () => {
  try {
    await AsyncStorage.removeItem('chatMessages');
    return true;
  } catch (error) {
    console.error('Error al limpiar mensajes:', error);
    handleError(error);
    return false;
  }
};

// Cerrar servicio (mantener para compatibilidad)
export const closeSocket = () => {
  console.log('Cerrando servicio de chat');
  messageCallbacks = [];
  errorCallbacks = [];
};

// Agregar función para crear una nueva conversación
export const createConversation = async () => {
  try {
    const response = await api.post('/api/chat/conversations', {
      metadata: {
        type: 'general',
        startedAt: new Date().toISOString(),
        platform: Platform.OS
      }
    });

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

// Agregar función para obtener mensajes
export const getMessages = async (conversationId) => {
  try {
    const response = await api.get(`/api/chat/conversations/${conversationId}`);
    return response.messages;
  } catch (error) {
    const status = error?.response?.status;
    const msg = String(error?.message || '');
    if (status === 404 || msg.includes('no encontrada')) {
      await clearPersistedChatSession();
    }
    console.error('Error al obtener mensajes:', error);
    return [];
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
  isGuestChatMode,
  startGuestChatSession,
  clearGuestChat,
  getGuestMessages,
  prepareGuestHandoffBeforeClear,
  clearGuestHandoff,
}; 