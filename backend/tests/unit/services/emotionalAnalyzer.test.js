/**
 * Tests unitarios para servicio de análisis emocional
 * 
 * @author AntoApp Team
 */

import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';

describe('EmotionalAnalyzer Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método analyzeEmotion', () => {
      expect(typeof emotionalAnalyzer.analyzeEmotion).toBe('function');
    });

    it('debe tener método detectPrimaryEmotion', () => {
      expect(typeof emotionalAnalyzer.detectPrimaryEmotion).toBe('function');
    });

    it('debe tener método calculateIntensity', () => {
      expect(typeof emotionalAnalyzer.calculateIntensity).toBe('function');
    });

    it('debe tener método isValidString', () => {
      expect(typeof emotionalAnalyzer.isValidString).toBe('function');
    });
  });

  describe('analyzeEmotion', () => {
    it('debe retornar un objeto con análisis emocional', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Me siento muy triste hoy');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('mainEmotion');
      expect(result).toHaveProperty('intensity');
    });

    it('debe manejar texto vacío', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('mainEmotion');
    });

    it('debe manejar texto con emociones positivas', async () => {
      const result = await emotionalAnalyzer.analyzeEmotion('Estoy muy feliz y contento');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('mainEmotion');
    });
  });

  describe('Validaciones básicas', () => {
    it('debe validar strings correctamente', () => {
      expect(emotionalAnalyzer.isValidString('test')).toBe(true);
      expect(emotionalAnalyzer.isValidString('')).toBe(false);
      expect(emotionalAnalyzer.isValidString(null)).toBe(false);
    });

    it('debe detectar emoción primaria', () => {
      const emotion = emotionalAnalyzer.detectPrimaryEmotion('me siento muy triste');
      
      expect(emotion).toBeDefined();
      expect(emotion).toHaveProperty('name');
      expect(emotion).toHaveProperty('category');
    });
  });
});

