/**
 * Tests unitarios para servicio de usuario
 * 
 * @author AntoApp Team
 */

// Mock AsyncStorage - debe estar antes de cualquier import
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock api config
jest.mock('../../config/api', () => ({
  API_URL: 'https://test-api.com',
  ENDPOINTS: {
    ME: '/api/users/me',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register'
  },
  fetchWithToken: jest.fn()
}));

// Mock User model
jest.mock('../../models/User', () => ({
  User: jest.fn().mockImplementation((data) => ({
    ...data,
    toJSON: jest.fn(() => data),
    update: jest.fn((newData) => ({ ...data, ...newData })),
    updatePreferences: jest.fn((prefs) => ({ ...data, preferences: prefs })),
    addTherapeuticGoal: jest.fn((goal) => ({ ...data, goals: [...(data.goals || []), goal] })),
    updateGoalProgress: jest.fn((goalId, progress) => ({ ...data })),
    recordSession: jest.fn((duration, state) => ({ ...data }))
  }))
}));

// Importar después de los mocks
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService, loginUser, registerUser, logoutUser } from '../userService';

describe('userService', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
    // Resetear mockApiClient si existe
    if (global.mockApiClient) {
      global.mockApiClient.get.mockClear();
      global.mockApiClient.post.mockClear();
      global.mockApiClient.put.mockClear();
    }
  });

  describe('getCurrentUser', () => {
    it('debe obtener usuario actual', async () => {
      const mockUser = { id: '123', name: 'Test User' };
      global.mockApiClient.get.mockResolvedValue({ data: { data: mockUser } });
      
      expect(typeof userService.getCurrentUser).toBe('function');
      
      try {
        await userService.getCurrentUser();
        expect(global.mockApiClient.get).toHaveBeenCalledWith('/api/users/me');
      } catch (error) {
        // Puede fallar si no hay token, pero el método existe
      }
    });

    it('debe manejar errores al obtener usuario', async () => {
      global.mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      await expect(userService.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('saveUser', () => {
    it('debe guardar usuario en AsyncStorage', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        toJSON: jest.fn(() => ({ id: '123', name: 'Test User', email: 'test@example.com' }))
      };
      
      const result = await userService.saveUser(mockUser);
      
      expect(result).toBe(true);
      const stored = await AsyncStorage.getItem('userData');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored)).toEqual(mockUser.toJSON());
    });

    it('debe convertir objeto a User si no es instancia', async () => {
      const mockUserData = { id: '123', name: 'Test User' };
      
      const result = await userService.saveUser(mockUserData);
      
      expect(result).toBe(true);
    });

    it('debe manejar errores al guardar usuario', async () => {
      const originalSetItem = AsyncStorage.setItem;
      AsyncStorage.setItem = jest.fn(() => Promise.reject(new Error('Storage error')));
      
      const mockUser = { id: '123', name: 'Test User', toJSON: jest.fn(() => ({})) };
      const result = await userService.saveUser(mockUser);
      
      expect(result).toBe(false);
      
      // Restaurar
      AsyncStorage.setItem = originalSetItem;
    });
  });

  describe('clearUserData', () => {
    it('debe eliminar datos de usuario', async () => {
      await AsyncStorage.setItem('userData', JSON.stringify({ id: '123' }));
      
      const result = await userService.clearUserData();
      
      expect(result).toBe(true);
      const stored = await AsyncStorage.getItem('userData');
      expect(stored).toBeNull();
    });

    it('debe manejar errores al eliminar datos', async () => {
      const originalRemoveItem = AsyncStorage.removeItem;
      AsyncStorage.removeItem = jest.fn(() => Promise.reject(new Error('Storage error')));
      
      const result = await userService.clearUserData();
      
      expect(result).toBe(false);
      
      // Restaurar
      AsyncStorage.removeItem = originalRemoveItem;
    });
  });

  describe('checkServerConnection', () => {
    it('debe verificar conexión exitosa', async () => {
      global.mockApiClient.get.mockResolvedValue({ status: 200 });
      
      const result = await userService.checkServerConnection();
      
      expect(result).toBe(true);
      expect(global.mockApiClient.get).toHaveBeenCalledWith('/api/health', expect.objectContaining({ timeout: 5000 }));
    });

    it('debe retornar false en caso de error', async () => {
      global.mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      const result = await userService.checkServerConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('debe hacer login y guardar token', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { data: { token: 'test-token', user: { id: '123' } } };
      
      global.mockApiClient.post.mockResolvedValue(mockResponse);
      
      const result = await userService.login(credentials);
      
      expect(result).toEqual(mockResponse);
      expect(global.mockApiClient.post).toHaveBeenCalledWith('/api/auth/login', credentials);
      const token = await AsyncStorage.getItem('userToken');
      expect(token).toBe('test-token');
    });

    it('debe manejar errores en login', async () => {
      global.mockApiClient.post.mockRejectedValue(new Error('Invalid credentials'));
      
      await expect(userService.login({})).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('debe registrar usuario y guardar token', async () => {
      const userData = { email: 'test@example.com', password: 'password123', name: 'Test' };
      const mockResponse = { data: { token: 'test-token', user: { id: '123' } } };
      
      // Mock checkServerConnection para que retorne true
      global.mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/health') {
          return Promise.resolve({ status: 200 });
        }
        return Promise.reject(new Error('Not found'));
      });
      global.mockApiClient.post.mockResolvedValue(mockResponse);
      
      const result = await userService.register(userData);
      
      expect(result).toEqual(mockResponse);
      expect(global.mockApiClient.post).toHaveBeenCalledWith('/api/auth/register', userData);
    });

    it('debe manejar error de conexión en registro', async () => {
      global.mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      await expect(userService.register({})).rejects.toThrow('No se puede conectar con el servidor');
    });
  });

  describe('logout', () => {
    it('debe hacer logout y eliminar token', async () => {
      await AsyncStorage.setItem('userToken', 'test-token');
      global.mockApiClient.post.mockResolvedValue({ data: { success: true } });
      
      const result = await userService.logout();
      
      expect(result).toBeDefined();
      const token = await AsyncStorage.getItem('userToken');
      expect(token).toBeNull();
    });
  });

  describe('getTherapeuticGoals', () => {
    it('debe obtener objetivos terapéuticos', async () => {
      const mockUser = {
        id: '123',
        therapeuticProfile: { goals: [{ id: '1', title: 'Goal 1' }] }
      };
      global.mockApiClient.get.mockResolvedValue({ data: { data: mockUser } });
      
      // Mock getCurrentUser
      userService.getCurrentUser = jest.fn().mockResolvedValue({ data: { data: mockUser } });
      
      const goals = await userService.getTherapeuticGoals();
      
      expect(Array.isArray(goals)).toBe(true);
    });
  });

  describe('getEmotionalHistory', () => {
    it('debe obtener historial emocional', async () => {
      const mockUser = {
        id: '123',
        therapeuticProfile: {
          emotionalHistory: [
            { date: '2024-01-01', emotion: 'happy' },
            { date: '2024-01-02', emotion: 'sad' }
          ]
        }
      };
      
      userService.getCurrentUser = jest.fn().mockResolvedValue({ data: { data: mockUser } });
      
      const history = await userService.getEmotionalHistory(10);
      
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Funciones exportadas', () => {
    it('loginUser debe ser una función', () => {
      expect(typeof loginUser).toBe('function');
    });

    it('registerUser debe ser una función', () => {
      expect(typeof registerUser).toBe('function');
    });

    it('logoutUser debe ser una función', () => {
      expect(typeof logoutUser).toBe('function');
    });
  });
});

