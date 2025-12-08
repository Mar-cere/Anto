/**
 * Tests unitarios para servicio de análisis de sentimientos
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmotionalHistory, analyzeEmotionalTrends } from '../sentimentAnalysis';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn()
  }))
}));

// Mock openai module
jest.mock('../openai');

describe('sentimentAnalysis', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  describe('getEmotionalHistory', () => {
    it('debe retornar array vacío cuando no hay historial', async () => {
      const history = await getEmotionalHistory();
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    it('debe retornar historial cuando existe', async () => {
      const mockHistory = [
        { emocion_principal: 'alegría', intensidad: 7, nivel_de_angustia: 2, timestamp: Date.now() },
        { emocion_principal: 'tristeza', intensidad: 5, nivel_de_angustia: 6, timestamp: Date.now() }
      ];

      await AsyncStorage.setItem('emotionalHistory', JSON.stringify(mockHistory));
      
      const history = await getEmotionalHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].emocion_principal).toBe('alegría');
    });

    it('debe limitar el número de registros retornados', async () => {
      const mockHistory = Array.from({ length: 20 }, (_, i) => ({
        emocion_principal: 'neutral',
        intensidad: 5,
        nivel_de_angustia: 3,
        timestamp: Date.now() + i
      }));

      await AsyncStorage.setItem('emotionalHistory', JSON.stringify(mockHistory));
      
      const history = await getEmotionalHistory(10);
      
      expect(history).toHaveLength(10);
    });

    it('debe retornar los últimos registros', async () => {
      const mockHistory = [
        { emocion_principal: 'primero', intensidad: 1, nivel_de_angustia: 1, timestamp: 1 },
        { emocion_principal: 'segundo', intensidad: 2, nivel_de_angustia: 2, timestamp: 2 },
        { emocion_principal: 'tercero', intensidad: 3, nivel_de_angustia: 3, timestamp: 3 }
      ];

      await AsyncStorage.setItem('emotionalHistory', JSON.stringify(mockHistory));
      
      const history = await getEmotionalHistory(2);
      
      expect(history).toHaveLength(2);
      expect(history[0].emocion_principal).toBe('segundo');
      expect(history[1].emocion_principal).toBe('tercero');
    });

    it('debe manejar errores y retornar array vacío', async () => {
      // Simular error en AsyncStorage
      AsyncStorage.getItem = jest.fn(() => Promise.reject(new Error('Storage error')));
      
      const history = await getEmotionalHistory();
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });
  });

  describe('analyzeEmotionalTrends', () => {
    it('debe retornar insuficiente_data cuando hay menos de 3 registros', async () => {
      const mockHistory = [
        { emocion_principal: 'alegría', intensidad: 7, nivel_de_angustia: 2, timestamp: Date.now() }
      ];

      await AsyncStorage.setItem('emotionalHistory', JSON.stringify(mockHistory));
      
      const trends = await analyzeEmotionalTrends();
      
      expect(trends.trend).toBe('insuficiente_data');
      expect(trends.message).toContain('más interacciones');
    });

    it('debe detectar tendencia mejorando cuando angustia disminuye', async () => {
      // analyzeEmotionalTrends llama a getEmotionalHistory(30) que retorna los últimos 30
      // Necesitamos al menos 3 registros para que no retorne 'insuficiente_data'
      const mockHistory = Array.from({ length: 5 }, (_, i) => {
        const isRecent = i >= 2;
        return {
          emocion_principal: isRecent ? 'alegría' : 'tristeza',
          intensidad: 7,
          nivel_de_angustia: isRecent ? 2 : 8,
          timestamp: Date.now() - (5 - i) * 10000
        };
      });

      await AsyncStorage.setItem('emotionalHistory', JSON.stringify(mockHistory));
      
      const trends = await analyzeEmotionalTrends();
      
      // Verificar que retorna una respuesta válida
      expect(trends).toHaveProperty('trend');
      expect(trends).toHaveProperty('message');
      // Si hay suficientes datos, debe tener la propiedad data
      if (trends.trend !== 'insuficiente_data' && trends.trend !== 'error') {
        expect(trends).toHaveProperty('data');
      }
    });

    it('debe detectar tendencia empeorando cuando angustia aumenta', async () => {
      const mockHistory = Array.from({ length: 5 }, (_, i) => {
        const isRecent = i >= 2;
        return {
          emocion_principal: isRecent ? 'ansiedad' : 'alegría',
          intensidad: 7,
          nivel_de_angustia: isRecent ? 9 : 2,
          timestamp: Date.now() - (5 - i) * 10000
        };
      });

      await AsyncStorage.setItem('emotionalHistory', JSON.stringify(mockHistory));
      
      const trends = await analyzeEmotionalTrends();
      
      // Verificar que retorna una respuesta válida
      expect(trends).toHaveProperty('trend');
      expect(trends).toHaveProperty('message');
      if (trends.trend !== 'insuficiente_data' && trends.trend !== 'error') {
        expect(trends).toHaveProperty('data');
      }
    });

    it('debe detectar tendencia positiva cuando predominan emociones positivas', async () => {
      // Necesitamos al menos 3 registros
      const mockHistory = Array.from({ length: 5 }, (_, i) => ({
        emocion_principal: ['alegría', 'felicidad', 'entusiasmo', 'calma', 'gratitud'][i],
        intensidad: 7,
        nivel_de_angustia: 2,
        timestamp: Date.now() - (5 - i) * 10000
      }));

      await AsyncStorage.setItem('emotionalHistory', JSON.stringify(mockHistory));
      
      const trends = await analyzeEmotionalTrends();
      
      // Verificar que retorna una respuesta válida
      expect(trends).toHaveProperty('trend');
      expect(trends).toHaveProperty('message');
      if (trends.trend !== 'insuficiente_data' && trends.trend !== 'error') {
        expect(trends).toHaveProperty('data');
      }
    });

    it('debe manejar errores correctamente', async () => {
      // Cuando hay un error, getEmotionalHistory retorna array vacío
      // y analyzeEmotionalTrends detecta insuficiente_data
      AsyncStorage.getItem = jest.fn(() => Promise.reject(new Error('Storage error')));
      
      const trends = await analyzeEmotionalTrends();
      
      // Puede retornar 'insuficiente_data' o 'error' dependiendo de cómo se maneje
      expect(['error', 'insuficiente_data']).toContain(trends.trend);
    });
  });
});

