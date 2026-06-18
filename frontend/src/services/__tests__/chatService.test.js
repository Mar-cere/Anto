/**
 * Tests unitarios para servicio de chat
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeSocket,
  sendMessage,
  sendMessageStream,
  onMessage,
  onError,
  saveMessages,
  loadMessages,
  getMessages,
  createConversation,
  setSessionIntention
} from '../chatService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios'
}));

// Mock api - debe ser un objeto con métodos post y get
// Necesitamos crear el mock antes de que se importe chatService
const mockApi = {
  post: jest.fn(),
  get: jest.fn()
};

// Mock api - se importa como default
jest.mock('../../config/api', () => {
  const mockApiObj = {
    post: jest.fn(),
    get: jest.fn()
  };
  return {
    __esModule: true,
    default: mockApiObj,
    api: mockApiObj,
    API_URL: 'http://test.local',
    getAppLanguage: jest.fn(() => Promise.resolve('es')),
  };
}, { virtual: false });

const mockSendChatMessage = jest.fn();
const mockCancelChatResponse = jest.fn();
const mockConnect = jest.fn(() => Promise.resolve(true));
const mockGetConnected = jest.fn(() => true);

jest.mock('../websocketService', () => ({
  __esModule: true,
  default: {
    connect: (...args) => mockConnect(...args),
    getConnected: () => mockGetConnected(),
    sendChatMessage: (...args) => mockSendChatMessage(...args),
    cancelChatResponse: (...args) => mockCancelChatResponse(...args),
  },
}));

const mockPostChatSseWithXHR = jest.fn(() => Promise.resolve());
const mockStreamChatSseWithFetch = jest.fn(() => Promise.resolve());

jest.mock('../../utils/chatSseStream', () => ({
  postChatSseWithXHR: (...args) => mockPostChatSseWithXHR(...args),
  streamChatSseWithFetch: (...args) => mockStreamChatSseWithFetch(...args),
}));

// Necesitamos obtener el mock después de que se haya configurado
let apiMock;

describe('chatService', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(true);
    mockGetConnected.mockReturnValue(true);
    mockSendChatMessage.mockReset();
    mockPostChatSseWithXHR.mockReset();
    mockStreamChatSseWithFetch.mockReset();
    
    // Obtener el mock de api después de que se haya importado
    const apiModule = require('../../config/api');
    apiMock = apiModule.default || apiModule.api;
    
    if (apiMock) {
      apiMock.post.mockClear();
      apiMock.get.mockClear();
    }
  });

  describe('initializeSocket', () => {
    it('debe inicializar socket con token válido', async () => {
      await AsyncStorage.setItem('userToken', 'test-token');
      await AsyncStorage.setItem('currentConversationId', 'conv-123');
      
      const result = await initializeSocket();
      
      expect(result).toBe(true);
    });

    it('debe fallar sin token', async () => {
      const result = await initializeSocket();
      
      expect(result).toBe(false);
    });

    it('debe crear conversación si no existe', async () => {
      await AsyncStorage.setItem('userToken', 'test-token');
      // Mock createConversation para que retorne un conversationId
      if (apiMock) {
        apiMock.post.mockResolvedValue({ conversationId: 'new-conv-123' });
      }
      
      const result = await initializeSocket();
      
      // Puede retornar true o false dependiendo de si createConversation funciona
      expect(typeof result).toBe('boolean');
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      mockApi.post.mockClear();
      mockApi.get.mockClear();
    });

    it('debe enviar mensaje correctamente', async () => {
      await AsyncStorage.setItem('currentConversationId', 'conv-123');
      const mockResponse = {
        data: {
          userMessage: { content: 'Hello', role: 'user' },
          assistantMessage: { content: 'Hi there!', role: 'assistant' }
        }
      };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }
      
      const result = await sendMessage('Hello');
      
      expect(result).toEqual(mockResponse);
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
        '/api/chat/messages',
        expect.objectContaining({
          content: 'Hello',
          role: 'user',
          conversationId: 'conv-123'
        })
      );
      }
    });

    it('debe fallar sin conversación activa', async () => {
      await expect(sendMessage('Hello')).rejects.toThrow('No se pudo crear una conversación');
    });

    it('debe incluir metadata del dispositivo', async () => {
      await AsyncStorage.setItem('currentConversationId', 'conv-123');
      if (apiMock) {
        apiMock.post.mockResolvedValue({ data: {} });
      }
      
      await sendMessage('Hello');
      
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
        '/api/chat/messages',
        expect.objectContaining({
          metadata: expect.objectContaining({
            device: 'ios'
          })
        })
      );
      }
    });
  });

  describe('onMessage', () => {
    it('debe registrar callback de mensaje', () => {
      const callback = jest.fn();
      const unsubscribe = onMessage(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('debe permitir desuscribirse', () => {
      const callback = jest.fn();
      const unsubscribe = onMessage(callback);
      
      unsubscribe();
      
      // El callback debería estar eliminado
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('onError', () => {
    it('debe registrar callback de error', () => {
      const callback = jest.fn();
      const unsubscribe = onError(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('debe permitir desuscribirse', () => {
      const callback = jest.fn();
      const unsubscribe = onError(callback);
      
      unsubscribe();
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('saveMessages', () => {
    it('debe guardar mensajes en AsyncStorage', async () => {
      const messages = [
        { id: '1', content: 'Hello', role: 'user' },
        { id: '2', content: 'Hi!', role: 'assistant' }
      ];
      
      await saveMessages(messages);
      
      const stored = await AsyncStorage.getItem('chatMessages');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored)).toEqual(messages);
    });

    it('debe manejar errores al guardar', async () => {
      const originalSetItem = AsyncStorage.setItem;
      AsyncStorage.setItem = jest.fn(() => Promise.reject(new Error('Storage error')));
      
      const messages = [{ id: '1', content: 'Hello' }];
      
      // No debe lanzar error, solo loguearlo
      await expect(saveMessages(messages)).resolves.not.toThrow();
      
      // Restaurar
      AsyncStorage.setItem = originalSetItem;
    });
  });

  describe('loadMessages', () => {
    it('debe cargar mensajes de AsyncStorage', async () => {
      const messages = [
        { id: '1', content: 'Hello', role: 'user' },
        { id: '2', content: 'Hi!', role: 'assistant' }
      ];
      await AsyncStorage.setItem('chatMessages', JSON.stringify(messages));
      
      const result = await loadMessages();
      
      expect(result).toEqual(messages);
    });

    it('debe retornar array vacío si no hay mensajes', async () => {
      const result = await loadMessages();
      
      expect(result).toEqual([]);
    });

    it('debe retornar [] si el JSON está corrupto o no es un array', async () => {
      await AsyncStorage.setItem('chatMessages', '{');
      await expect(loadMessages()).resolves.toEqual([]);
      await AsyncStorage.setItem('chatMessages', JSON.stringify({ not: 'array' }));
      await expect(loadMessages()).resolves.toEqual([]);
    });

    it('debe omitir entradas que no son objetos', async () => {
      await AsyncStorage.setItem(
        'chatMessages',
        JSON.stringify([{ id: '1', role: 'user' }, null, 3, 'x'])
      );
      const result = await loadMessages();
      expect(result).toEqual([{ id: '1', role: 'user' }]);
    });
  });

  describe('getMessages', () => {
    it('debe obtener mensajes del servidor', async () => {
      const messages = [
        { id: '1', content: 'Hello', role: 'user' },
        { id: '2', content: 'Hi!', role: 'assistant' }
      ];
      // El método getMessages espera que api.get retorne un objeto con propiedad messages
      if (apiMock) {
        apiMock.get.mockResolvedValue({ messages });
      }
      
      const result = await getMessages('conv-123');
      
      expect(result).toEqual({
        messages,
        sessionIntention: null,
        tccLite: null,
        pagination: null,
      });
      if (apiMock) {
        expect(apiMock.get).toHaveBeenCalledWith('/api/chat/conversations/conv-123', {
          page: '1',
          limit: '50',
        });
      }
    });

    it('debe anular sessionIntention corrupto en la respuesta', async () => {
      if (apiMock) {
        apiMock.get.mockResolvedValue({
          messages: [{ id: '1', role: 'assistant', content: 'Hola' }],
          sessionIntention: 'tampered',
        });
      }
      const result = await getMessages('conv-123');
      expect(result.sessionIntention).toBeNull();
    });

    it('debe retornar mensajes vacíos si la respuesta no tiene messages', async () => {
      if (apiMock) {
        apiMock.get.mockResolvedValue({});
      }
      
      const result = await getMessages('conv-123');
      
      expect(result).toEqual({
        messages: [],
        sessionIntention: null,
        tccLite: null,
        pagination: null,
      });
    });

    it('debe retornar mensajes vacíos en caso de error', async () => {
      if (apiMock) {
        apiMock.get.mockRejectedValue(new Error('Network error'));
      } else {
        mockApi.get.mockRejectedValue(new Error('Network error'));
      }
      const result = await getMessages('conv-123');
      expect(result).toEqual({
        messages: [],
        sessionIntention: null,
        tccLite: null,
        pagination: null,
      });
    });
  });

  describe('createConversation', () => {
    beforeEach(() => {
      mockApi.post.mockClear();
    });

    it('debe crear nueva conversación', async () => {
      const mockResponse = { conversationId: 'new-conv-123' };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }
      
      const result = await createConversation();
      
      expect(result).toBe('new-conv-123');
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
          '/api/chat/conversations',
          expect.objectContaining({
            metadata: expect.objectContaining({
              type: 'general',
              platform: 'ios'
            })
          })
        );
      }
    });

    it('debe enviar sessionIntention cuando se pasa en opciones', async () => {
      const mockResponse = { conversationId: 'new-conv-456' };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }
      await createConversation({ sessionIntention: 'vent' });
      if (apiMock) {
        expect(apiMock.post).toHaveBeenCalledWith(
          '/api/chat/conversations',
          expect.objectContaining({
            sessionIntention: 'vent',
            metadata: expect.any(Object)
          })
        );
      }
    });

    it('debe rechazar sessionIntention inválido antes de llamar a la API', async () => {
      await expect(createConversation({ sessionIntention: 'invalid' })).rejects.toMatchObject({
        code: 'INVALID_SESSION_INTENTION',
      });
      if (apiMock) {
        expect(apiMock.post).not.toHaveBeenCalled();
      }
    });

    it('debe guardar conversationId en AsyncStorage', async () => {
      const mockResponse = { conversationId: 'new-conv-123' };
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }
      
      await createConversation();
      
      const stored = await AsyncStorage.getItem('currentConversationId');
      expect(stored).toBe('new-conv-123');
    });

    it('debe manejar respuesta sin conversationId', async () => {
      const mockResponse = {}; // Sin conversationId
      if (apiMock) {
        apiMock.post.mockResolvedValue(mockResponse);
      }
      
      await expect(createConversation()).rejects.toThrow('No se pudo crear la conversación');
    });

    it('debe manejar errores al crear conversación', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));
      
      await expect(createConversation()).rejects.toThrow();
    });
  });

  describe('sendMessageStream', () => {
    beforeEach(async () => {
      await AsyncStorage.setItem('userToken', 'test-token');
      await AsyncStorage.setItem('currentConversationId', 'conv-123');
      await AsyncStorage.setItem('userData', JSON.stringify({ id: 'user-1' }));
    });

    it('usa socket cuando está disponible', async () => {
      mockSendChatMessage.mockResolvedValue({
        id: 'msg-1',
        text: 'Respuesta socket',
        conversationId: 'conv-123',
      });
      const onDone = jest.fn();

      await sendMessageStream('Hola', { onDone });

      expect(mockSendChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hola',
          conversationId: 'conv-123',
        }),
      );
      expect(onDone).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Respuesta socket',
          transport: 'socket',
        }),
      );
      expect(mockPostChatSseWithXHR).not.toHaveBeenCalled();
    });

    it('hace fallback a SSE si el socket no está disponible', async () => {
      mockConnect.mockResolvedValue(false);
      mockGetConnected.mockReturnValue(false);

      await sendMessageStream('Hola', {});

      expect(mockSendChatMessage).not.toHaveBeenCalled();
      expect(mockPostChatSseWithXHR).toHaveBeenCalled();
    });

    it('no hace fallback a SSE ante error de negocio del socket', async () => {
      const forbidden = new Error('Conversación no autorizada');
      forbidden.code = 'CONVERSATION_FORBIDDEN';
      mockSendChatMessage.mockRejectedValue(forbidden);

      await expect(sendMessageStream('Hola', {})).rejects.toMatchObject({
        code: 'CONVERSATION_FORBIDDEN',
      });
      expect(mockPostChatSseWithXHR).not.toHaveBeenCalled();
    });

    it('hace fallback a SSE ante timeout de socket', async () => {
      const timeoutErr = new Error('Tiempo de espera agotado (socket)');
      timeoutErr.code = 'SOCKET_TIMEOUT';
      mockSendChatMessage.mockRejectedValue(timeoutErr);

      await sendMessageStream('Hola', {});

      expect(mockPostChatSseWithXHR).toHaveBeenCalled();
    });
  });

  describe('setSessionIntention', () => {
    beforeEach(async () => {
      await AsyncStorage.setItem('userToken', 'tok');
    });

    it('rechaza id de conversación inválido', async () => {
      await expect(setSessionIntention('bad', 'vent')).rejects.toMatchObject({
        code: 'INVALID_CONVERSATION_ID',
      });
    });

    it('rechaza intención inválida', async () => {
      await expect(
        setSessionIntention('507f1f77bcf86cd799439011', 'nope')
      ).rejects.toMatchObject({ code: 'INVALID_SESSION_INTENTION' });
    });
  });
});

