import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from '../config/api';
import { Platform } from 'react-native';

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
export const sendMessageStream = async (text, { onChunk, onDone }) => {
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

// Agregar función para obtener mensajes
export const getMessages = async (conversationId) => {
  try {
    const response = await api.get(`/api/chat/conversations/${conversationId}`);
    return response.messages;
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return [];
  }
};

export default {
  initializeSocket,
  sendMessage,
  sendMessageStream,
  onMessage,
  onError,
  saveMessages,
  loadMessages,
  clearMessages,
  closeSocket,
  getMessages
}; 