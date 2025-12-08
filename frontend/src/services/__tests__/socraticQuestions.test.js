/**
 * Tests unitarios para servicio de preguntas socráticas
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocraticQuestion } from '../socraticQuestions';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('socraticQuestions', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('getSocraticQuestion', () => {
    it('debe retornar una pregunta socrática', async () => {
      const question = await getSocraticQuestion('trabajo', 'Estoy estresado');
      
      expect(question).toBeDefined();
      expect(typeof question).toBe('string');
      expect(question.length).toBeGreaterThan(0);
    });

    it('debe retornar pregunta de categoría general por defecto', async () => {
      const question = await getSocraticQuestion();
      
      expect(question).toBeDefined();
      expect(typeof question).toBe('string');
    });

    it('debe personalizar según preferencia cognitiva', async () => {
      await AsyncStorage.setItem('userProfile', JSON.stringify({
        preferredApproach: 'cognitive'
      }));
      
      const question = await getSocraticQuestion('trabajo', 'Estoy estresado');
      
      expect(question).toBeDefined();
      expect(typeof question).toBe('string');
    });

    it('debe personalizar según preferencia emocional', async () => {
      await AsyncStorage.setItem('userProfile', JSON.stringify({
        preferredApproach: 'emotional'
      }));
      
      const question = await getSocraticQuestion('trabajo', 'Estoy estresado');
      
      expect(question).toBeDefined();
      expect(typeof question).toBe('string');
    });

    it('debe personalizar según preferencia conductual', async () => {
      await AsyncStorage.setItem('userProfile', JSON.stringify({
        preferredApproach: 'behavioral'
      }));
      
      const question = await getSocraticQuestion('trabajo', 'Estoy estresado');
      
      expect(question).toBeDefined();
      expect(typeof question).toBe('string');
    });

    it('debe evitar repetir preguntas recientes', async () => {
      await AsyncStorage.setItem('recentSocraticQuestions', JSON.stringify([
        '¿Qué evidencia tienes para apoyar ese pensamiento?'
      ]));
      
      const question = await getSocraticQuestion('trabajo', 'Estoy estresado');
      
      expect(question).toBeDefined();
      expect(question).not.toBe('¿Qué evidencia tienes para apoyar ese pensamiento?');
    });

    it('debe manejar errores correctamente', async () => {
      AsyncStorage.getItem = jest.fn(() => Promise.reject(new Error('Storage error')));
      
      const question = await getSocraticQuestion('trabajo', 'Estoy estresado');
      
      // Debe retornar una pregunta por defecto incluso con error
      expect(question).toBeDefined();
      expect(typeof question).toBe('string');
    });
  });
});

