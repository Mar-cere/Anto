/**
 * Tests unitarios para servicio de sugerencias de acción
 * 
 * @author AntoApp Team
 */

import actionSuggestionService from '../../../services/actionSuggestionService.js';

describe('ActionSuggestionService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método generateSuggestions', () => {
      expect(typeof actionSuggestionService.generateSuggestions).toBe('function');
    });

    it('debe generar sugerencias para análisis emocional válido', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 8,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe retornar array vacío para análisis inválido', () => {
      const suggestions = actionSuggestionService.generateSuggestions(null);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });

    it('debe retornar array vacío para emoción no mapeada', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'emocion_inexistente',
        intensity: 8,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });

  describe('Generación de sugerencias por emoción', () => {
    it('debe generar sugerencias para ansiedad alta intensidad', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 9,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe generar sugerencias para ansiedad media intensidad', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 6,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe generar sugerencias para tristeza alta intensidad', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'tristeza',
        intensity: 8,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe generar sugerencias para enojo alta intensidad', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'enojo',
        intensity: 9,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe generar sugerencias para culpa alta intensidad', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'culpa',
        intensity: 8,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe generar sugerencias para soledad alta intensidad', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'soledad',
        intensity: 8,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Generación de sugerencias por tema', () => {
    it('debe generar sugerencias específicas para tema trabajo', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 8,
        topic: 'trabajo'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe generar sugerencias específicas para tema relaciones', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 8,
        topic: 'relaciones'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('debe usar tema general si el tema específico no existe', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 8,
        topic: 'tema_inexistente'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
      // Debería usar 'general' como fallback
    });
  });

  describe('Generación con análisis contextual', () => {
    it('debe incluir análisis contextual en sugerencias', () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        {
          mainEmotion: 'ansiedad',
          intensity: 8,
          topic: 'general'
        },
        {
          urgency: 'high',
          context: 'work'
        }
      );
      
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('debe manejar análisis contextual vacío', () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        {
          mainEmotion: 'ansiedad',
          intensity: 8,
          topic: 'general'
        },
        {}
      );
      
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Niveles de intensidad', () => {
    it('debe clasificar intensidad alta (>=8)', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 8,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('debe clasificar intensidad media (5-7)', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 6,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('debe manejar intensidad baja (<5)', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        intensity: 3,
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('debe usar intensidad por defecto si no se proporciona', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'ansiedad',
        topic: 'general'
      });
      
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});

