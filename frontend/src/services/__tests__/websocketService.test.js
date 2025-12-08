/**
 * Tests unitarios para servicio de WebSocket
 * 
 * @author AntoApp Team
 */

// Mock socket.io-client antes de importar
const mockSocket = {
  connected: false,
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  close: jest.fn()
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}));

// Mock AsyncStorage antes de importar
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Importar después de mocks
import AsyncStorage from '@react-native-async-storage/async-storage';
import websocketService from '../websocketService';

describe('WebSocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
    AsyncStorage.clear();
    // Resetear el servicio
    websocketService.socket = null;
    websocketService.isConnected = false;
    websocketService.listeners.clear();
  });

  describe('Constructor', () => {
    it('debe inicializar con valores por defecto', () => {
      expect(websocketService.socket).toBeNull();
      expect(websocketService.isConnected).toBe(false);
      expect(websocketService.listeners).toBeDefined();
      expect(websocketService.reconnectAttempts).toBe(0);
    });
  });

  describe('connect', () => {
    it('debe retornar false si no hay token', async () => {
      const result = await websocketService.connect('user-id');
      
      expect(result).toBe(false);
    });

    it('debe conectar si hay token', async () => {
      await AsyncStorage.setItem('userToken', 'test-token');
      mockSocket.connected = true;
      
      const result = await websocketService.connect('user-id');
      
      expect(result).toBeDefined();
      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('debe desconectar conexión existente antes de conectar nueva', async () => {
      await AsyncStorage.setItem('userToken', 'test-token');
      websocketService.socket = { ...mockSocket, connected: true, disconnect: jest.fn() };
      websocketService.disconnect = jest.fn();
      
      await websocketService.connect('user-id');
      
      expect(websocketService.disconnect).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('debe desconectar el socket si existe', () => {
      const socketInstance = { 
        ...mockSocket, 
        connected: true, 
        disconnect: jest.fn()
      };
      websocketService.socket = socketInstance;
      websocketService.isConnected = true;
      
      websocketService.disconnect();
      
      // Verificar que se desconectó
      expect(socketInstance.disconnect).toHaveBeenCalled();
      expect(websocketService.isConnected).toBe(false);
      expect(websocketService.socket).toBeNull();
    });

    it('debe manejar desconexión cuando no hay socket', () => {
      websocketService.socket = null;
      
      expect(() => websocketService.disconnect()).not.toThrow();
    });
  });

  describe('on', () => {
    it('debe agregar listener para evento', () => {
      const callback = jest.fn();
      
      websocketService.on('test-event', callback);
      
      expect(websocketService.listeners.has('test-event')).toBe(true);
    });
  });

  describe('off', () => {
    it('debe remover listener para evento', () => {
      const callback = jest.fn();
      websocketService.on('test-event', callback);
      
      // Verificar que se agregó
      expect(websocketService.listeners.has('test-event')).toBe(true);
      const listenersBefore = websocketService.listeners.get('test-event');
      expect(listenersBefore).toContain(callback);
      
      websocketService.off('test-event', callback);
      
      // Verificar que se removió
      const listenersAfter = websocketService.listeners.get('test-event');
      if (listenersAfter) {
        expect(listenersAfter).not.toContain(callback);
      }
    });
  });

  describe('emit', () => {
    it('debe emitir evento a los listeners internos', () => {
      const callback = jest.fn();
      websocketService.on('test-event', callback);
      
      websocketService.emit('test-event', { data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('no debe fallar si no hay listeners', () => {
      expect(() => websocketService.emit('non-existent-event', { data: 'test' })).not.toThrow();
    });
  });
});

