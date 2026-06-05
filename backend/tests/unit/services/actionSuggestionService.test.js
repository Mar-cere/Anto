/**
 * Tests unitarios para servicio de sugerencias de acción
 * 
 * @author AntoApp Team
 */

import actionSuggestionService, {
  applyAbcSuggestionPolicy,
  resolveContextualPsychoeducationIds,
  shouldBoostAbcSuggestion,
} from '../../../services/actionSuggestionService.js';
import { rankInterventionIds } from '../../../services/interventionRankingService.js';

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

  describe('Autorregistro ABC (#86)', () => {
    it('incluye abc_record en tristeza intensidad media', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'tristeza',
        intensity: 6,
        topic: 'general',
      });
      expect(suggestions).toContain('abc_record');
    });

    it('no incluye abc_record en tristeza alta intensidad', () => {
      const suggestions = actionSuggestionService.generateSuggestions({
        mainEmotion: 'tristeza',
        intensity: 9,
        topic: 'general',
      });
      expect(suggestions).not.toContain('abc_record');
    });

    it('formatea abc_record con pantalla AbcRecord', () => {
      const [card] = actionSuggestionService.formatSuggestions(['abc_record'], 'es');
      expect(card.screen).toBe('AbcRecord');
      expect(card.interventionType).toBe('exercise');
    });

    it('prioriza abc_record aunque el ranking favorezca otras técnicas', () => {
      const msg =
        'Me siento triste y apagado, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.';
      const ranked = rankInterventionIds(
        ['abc_record', 'communication_tool', 'psychoeducation_depression'],
        new Map([
          ['communication_tool', 10],
          ['self_care', 8],
          ['abc_record', 0],
        ]),
      );
      expect(ranked[0]).toBe('communication_tool');
      const pinned = applyAbcSuggestionPolicy(ranked, {
        emotion: 'tristeza',
        intensityLevel: 'medium',
        userContent: msg,
      });
      expect(pinned[0]).toBe('abc_record');
    });

    it('inyecta abc_record si hay señal cognitiva y falta en la lista (legacy)', () => {
      const msg = 'Siempre pienso lo peor después de discutir, 6/10';
      expect(shouldBoostAbcSuggestion(msg)).toBe(true);
      const pinned = applyAbcSuggestionPolicy(
        ['communication_tool', 'self_care', 'psychoeducation_depression'],
        { emotion: 'tristeza', intensityLevel: 'medium', userContent: msg },
      );
      expect(pinned[0]).toBe('abc_record');
    });

    it('coloca abc_record primero en mensaje cognitivo sin distorsión clara', () => {
      const msg =
        'Me siento enojado, 6/10. Noto que reaccioné mal y no paro de darle vueltas a lo que dije.';
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'enojo', intensity: 6, topic: 'general' },
        {},
        { userContent: msg },
      );
      expect(suggestions[0]).toBe('abc_record');
    });

    it('prioriza automatic_thought_record cuando hay distorsión detectada (#89)', () => {
      const msg =
        'Me siento triste y apagado, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.';
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'tristeza', intensity: 7, topic: 'relaciones' },
        {},
        {
          userContent: msg,
          rankingScores: new Map([['communication_tool', 10], ['self_care', 9]]),
        },
      );
      expect(suggestions[0]).toBe('automatic_thought_record');
    });
  });

  describe('Jerarquía exposición (#87)', () => {
    it('incluye exposure_hierarchy en ansiedad intensidad media', () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'ansiedad', intensity: 6, topic: 'general' },
        {},
        { userContent: 'Me siento ansioso, 6/10' },
      );
      expect(suggestions).toContain('exposure_hierarchy');
    });

    it('no incluye exposure_hierarchy en ansiedad alta sin evitación', () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'ansiedad', intensity: 9, topic: 'general' },
        {},
        { userContent: 'Corazón acelerado y mucha anticipación. 9/10' },
      );
      expect(suggestions).not.toContain('exposure_hierarchy');
      expect(suggestions).toContain('breathing_exercise');
    });

    it('prioriza exposure_hierarchy con evitación en ansiedad alta', () => {
      const msg =
        'Tengo ansiedad social, 8/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.';
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'miedo', intensity: 8, topic: 'general' },
        {},
        { userContent: msg },
      );
      expect(suggestions[0]).toBe('exposure_hierarchy');
    });
  });

  describe('Activación conductual (#88)', () => {
    it('incluye behavioral_activation en tristeza intensidad media', () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'tristeza', intensity: 6, topic: 'general' },
        {},
        { userContent: 'Me siento triste, 6/10' },
      );
      expect(suggestions).toContain('behavioral_activation');
    });

    it('prioriza behavioral_activation con apatía en tristeza media', () => {
      const msg =
        'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.';
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'tristeza', intensity: 6, topic: 'general' },
        {},
        { userContent: msg },
      );
      expect(suggestions[0]).toBe('behavioral_activation');
    });

    it('no incluye behavioral_activation en tristeza alta', () => {
      const suggestions = actionSuggestionService.generateSuggestions(
        { mainEmotion: 'tristeza', intensity: 9, topic: 'general' },
        {},
        { userContent: 'Me siento muy mal, 9/10' },
      );
      expect(suggestions).not.toContain('behavioral_activation');
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

