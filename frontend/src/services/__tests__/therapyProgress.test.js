/**
 * Tests unitarios para servicio de progreso terapéutico
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackTherapyProgress } from '../therapyProgress';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('therapyProgress', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('trackTherapyProgress', () => {
    it('debe crear nuevo progreso si no existe', async () => {
      const newMessage = { content: 'Test message' };
      const sentimentAnalysis = {
        emocion_principal: 'tristeza',
        intensidad: 7,
        nivel_de_angustia: 6,
        temas_detectados: 'trabajo, ansiedad'
      };

      const result = await trackTherapyProgress(newMessage, sentimentAnalysis);

      expect(result).toBeDefined();
      expect(result.sessions).toBe(1);
      expect(result.emotionalStates).toHaveLength(1);
      expect(result.emotionalStates[0].emotion).toBe('tristeza');
    });

    it('debe incrementar sesiones en nuevo día', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await AsyncStorage.setItem('therapyProgressData', JSON.stringify({
        sessions: 1,
        emotionalStates: [],
        topics: {},
        improvements: {},
        lastSessionDate: yesterdayStr
      }));

      const result = await trackTherapyProgress(
        { content: 'Test' },
        { emocion_principal: 'alegria', intensidad: 5, nivel_de_angustia: 3, temas_detectados: 'general' }
      );

      expect(result.sessions).toBe(2);
    });

    it('debe mantener sesiones en el mismo día', async () => {
      const today = new Date().toISOString().split('T')[0];

      await AsyncStorage.setItem('therapyProgressData', JSON.stringify({
        sessions: 1,
        emotionalStates: [],
        topics: {},
        improvements: {},
        lastSessionDate: today
      }));

      const result = await trackTherapyProgress(
        { content: 'Test' },
        { emocion_principal: 'alegria', intensidad: 5, nivel_de_angustia: 3, temas_detectados: 'general' }
      );

      expect(result.sessions).toBe(1);
    });

    it('debe registrar estados emocionales', async () => {
      const sentimentAnalysis = {
        emocion_principal: 'ansiedad',
        intensidad: 8,
        nivel_de_angustia: 7,
        temas_detectados: 'trabajo'
      };

      const result = await trackTherapyProgress({ content: 'Test' }, sentimentAnalysis);

      expect(result.emotionalStates).toHaveLength(1);
      expect(result.emotionalStates[0].emotion).toBe('ansiedad');
      expect(result.emotionalStates[0].intensity).toBe(8);
      expect(result.emotionalStates[0].distress).toBe(7);
    });

    it('debe actualizar temas discutidos', async () => {
      const sentimentAnalysis = {
        emocion_principal: 'tristeza',
        intensidad: 5,
        nivel_de_angustia: 4,
        temas_detectados: 'trabajo, familia, salud'
      };

      const result = await trackTherapyProgress({ content: 'Test' }, sentimentAnalysis);

      expect(result.topics).toBeDefined();
      expect(result.topics.trabajo).toBe(1);
      expect(result.topics.familia).toBe(1);
      expect(result.topics.salud).toBe(1);
    });

    it('debe limitar estados emocionales a 30', async () => {
      const today = new Date().toISOString().split('T')[0];
      const emotionalStates = Array.from({ length: 30 }, (_, i) => ({
        date: new Date().toISOString(),
        emotion: 'tristeza',
        intensity: 5,
        distress: 4
      }));

      await AsyncStorage.setItem('therapyProgressData', JSON.stringify({
        sessions: 1,
        emotionalStates,
        topics: {},
        improvements: {},
        lastSessionDate: today
      }));

      const result = await trackTherapyProgress(
        { content: 'Test' },
        { emocion_principal: 'alegria', intensidad: 5, nivel_de_angustia: 3, temas_detectados: 'general' }
      );

      expect(result.emotionalStates).toHaveLength(30);
    });

    it('debe manejar errores correctamente', async () => {
      AsyncStorage.setItem = jest.fn(() => Promise.reject(new Error('Storage error')));

      const result = await trackTherapyProgress({ content: 'Test' }, null);

      expect(result).toBeNull();
    });

    it('debe funcionar sin análisis de sentimiento', async () => {
      const result = await trackTherapyProgress({ content: 'Test' }, null);

      expect(result).toBeDefined();
      if (result) {
        expect(result.sessions).toBe(1);
        expect(result.emotionalStates).toHaveLength(0);
      }
    });
  });
});

