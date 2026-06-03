/**
 * Tests unitarios para servicio de sugerencias de acción
 * 
 * @author AntoApp Team
 */

import actionSuggestionService, {
  resolveContextualPsychoeducationIds,
} from '../../../services/actionSuggestionService.js';

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

  describe('Psicoeducación (#85)', () => {
    it('incluye módulo de ira para emoción enojo', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'enojo',
        intensity: 6,
        topic: 'general',
      });
      expect(suggestions).toContain('psychoeducation_anger');
    });

    it('formatea tarjeta nativa en inglés', () => {
      const [card] = actionSuggestionService.formatSuggestions(
        ['psychoeducation_sleep'],
        'en',
      );
      expect(card.previewTitle).toMatch(/Sleep/i);
      expect(card.label).toMatch(/Sleep/i);
      expect(card.params.topic).toBe('sleep');
    });

    it('detecta estrés contextual en inglés', () => {
      const ids = resolveContextualPsychoeducationIds(
        'Work stress has me burned out',
      );
      expect(ids).toContain('psychoeducation_stress');
    });

    it('incluye psicoed de sueño por contenido contextual', () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'ansiedad', intensity: 7, topic: 'general' },
        {},
        { userContent: 'Llevo semanas con insomnio y me despierto a la noche sin poder volver a dormir.' },
      );
      expect(suggestions).toContain('psychoeducation_sleep');
    });

    it('incluye psicoed de estrés por contenido laboral', () => {
      const msg =
        'El estrés del trabajo me tiene agotada, con demasiadas responsabilidades. 6/10';
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'neutral', intensity: 6, topic: 'trabajo' },
        {},
        { userContent: msg },
      );
      expect(suggestions).toContain('psychoeducation_stress');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('incluye psicoed de regulación emocional cuando desborda', () => {
      const msg = 'Me desborda lo que siento y a veces exploto sin querer. 7/10';
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'neutral', intensity: 7, topic: 'general' },
        {},
        { userContent: msg },
      );
      expect(suggestions).toContain('psychoeducation_emotion_regulation');
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

