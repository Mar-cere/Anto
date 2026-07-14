/**
 * Tests unitarios para paraphrasisPolicySnippet.js
 * Propuesta #55: Paráfrasis + validación antes consejo
 */

import { jest } from '@jest/globals';
import {
  buildParaphrasisPolicySnippet,
  shouldRequireParaphrasis,
  detectsLackOfUnderstanding,
  validateParaphrasisConstraints,
  countRecentParaphrasis,
  markTurnAsParaphrasis,
  PARAPHRASIS_LIMITS,
} from '../../../services/chat/paraphrasisPolicySnippet.js';

describe('paraphrasisPolicySnippet', () => {
  describe('shouldRequireParaphrasis', () => {
    test('debe requerir paráfrasis para alta intensidad emocional (>= 7)', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe requerir paráfrasis para intensidad exacta en umbral (7)', () => {
      const context = { emotionalIntensity: 7, messageLength: 50 };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('NO debe requerir paráfrasis para intensidad baja (< 7)', () => {
      const context = { emotionalIntensity: 6, messageLength: 50 };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('NO debe requerir paráfrasis durante crisis activa', () => {
      const context = {
        emotionalIntensity: 9,
        isCrisisActive: true,
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe requerir paráfrasis en primer turno del usuario', () => {
      const context = { isFirstTurn: true, messageLength: 50 };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('NO debe requerir paráfrasis para consulta factual', () => {
      const context = {
        emotionalIntensity: 7,
        isFactualQuery: true,
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('NO debe requerir paráfrasis para mensaje muy corto', () => {
      const context = {
        emotionalIntensity: 8,
        messageLength: 5, // < MIN_USER_MESSAGE_LENGTH (10)
      };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('NO debe requerir paráfrasis para mensaje muy largo', () => {
      const context = {
        emotionalIntensity: 8,
        messageLength: 600, // > MAX_USER_MESSAGE_LENGTH (500)
      };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('NO debe parafrasear dos veces seguidas', () => {
      const context = {
        emotionalIntensity: 8,
        previousTurnWasParaphrasis: true,
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe requerir paráfrasis para cambio abrupto de tono', () => {
      const context = {
        hasAbruptToneChange: true,
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe requerir paráfrasis cuando usuario expresa falta de comprensión', () => {
      const context = {
        userExpressesLackOfUnderstanding: true,
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe requerir paráfrasis para emoción vulnerable (miedo)', () => {
      const context = {
        mainEmotion: 'miedo',
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe requerir paráfrasis para emoción vulnerable (tristeza)', () => {
      const context = {
        mainEmotion: 'tristeza',
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe requerir paráfrasis para emoción vulnerable (vergüenza)', () => {
      const context = {
        mainEmotion: 'vergüenza',
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe requerir paráfrasis para emoción vulnerable (culpa)', () => {
      const context = {
        mainEmotion: 'culpa',
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe requerir paráfrasis para emoción vulnerable (ansiedad)', () => {
      const context = {
        mainEmotion: 'ansiedad',
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('NO debe requerir paráfrasis para emoción neutral sin alta intensidad', () => {
      const context = {
        mainEmotion: 'calma',
        emotionalIntensity: 3,
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe manejar contexto vacío sin errores', () => {
      expect(shouldRequireParaphrasis({})).toBe(false);
    });

    test('debe manejar contexto undefined sin errores', () => {
      expect(shouldRequireParaphrasis(undefined)).toBe(false);
    });
  });

  describe('buildParaphrasisPolicySnippet', () => {
    test('debe devolver snippet en español cuando requiere paráfrasis', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet('es', context);

      expect(snippet).toContain('Paráfrasis antes de intervenir');
      expect(snippet).toContain('sin eco');
      expect(snippet).toContain('Buen ejemplo:');
      expect(snippet).toContain('Evitar:');
      expect(snippet).not.toMatch(/Entiendo que el trabajo te está generando/);
    });

    test('debe devolver snippet en inglés cuando requiere paráfrasis', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet('en', context);

      expect(snippet).toContain('Reflect before intervening');
      expect(snippet).toContain('no parrot');
      expect(snippet).toContain('Good example:');
      expect(snippet).toContain('Avoid:');
      expect(snippet).not.toMatch(/I understand that work is generating/);
    });

    test('debe devolver string vacío si no requiere paráfrasis', () => {
      const context = { emotionalIntensity: 3, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet('es', context);

      expect(snippet).toBe('');
    });

    test('debe devolver string vacío durante crisis', () => {
      const context = {
        emotionalIntensity: 9,
        isCrisisActive: true,
        messageLength: 50,
      };
      const snippet = buildParaphrasisPolicySnippet('es', context);

      expect(snippet).toBe('');
    });

    test('debe devolver snippet con instrucciones de brevedad', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet('es', context);

      expect(snippet).toContain('frase corta');
      expect(snippet).toContain('emoción');
    });

    test('debe incluir ejemplo práctico en español', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet('es', context);

      expect(snippet).toContain('Usuario:');
      expect(snippet).toContain('Tú:');
      expect(snippet).toContain('palabras nuevas');
    });

    test('debe incluir ejemplo práctico en inglés', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet('en', context);

      expect(snippet).toContain('User:');
      expect(snippet).toContain('You:');
      expect(snippet).toContain('fresh words');
    });

    test('debe manejar contexto vacío sin errores', () => {
      const snippet = buildParaphrasisPolicySnippet('es', {});
      expect(typeof snippet).toBe('string');
    });

    test('debe manejar idioma no reconocido (usar español por defecto)', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet('fr', context);

      expect(snippet).toContain('Paráfrasis antes de intervenir');
    });

    test('NO debe exigir paráfrasis por emoción vulnerable con intensidad baja', () => {
      expect(
        shouldRequireParaphrasis({
          mainEmotion: 'tristeza',
          emotionalIntensity: 3,
          messageLength: 50,
        }),
      ).toBe(false);
    });
  });

  describe('detectsLackOfUnderstanding', () => {
    test('debe detectar "no me entiendes"', () => {
      expect(detectsLackOfUnderstanding('Siento que no me entiendes')).toBe(true);
    });

    test('debe detectar "no me escuchas"', () => {
      expect(detectsLackOfUnderstanding('Parece que no me escuchas')).toBe(true);
    });

    test('debe detectar "parece que no captas"', () => {
      expect(detectsLackOfUnderstanding('Parece que no captas lo que digo')).toBe(true);
    });

    test('debe detectar "no estás entendiendo"', () => {
      expect(detectsLackOfUnderstanding('No estás entendiendo mi punto')).toBe(true);
    });

    test('debe detectar "nadie me entiende"', () => {
      expect(detectsLackOfUnderstanding('Nadie me entiende')).toBe(true);
    });

    test('debe detectar variante "no me comprendes"', () => {
      expect(detectsLackOfUnderstanding('No me comprendes para nada')).toBe(true);
    });

    test('NO debe detectar en mensaje sin señal', () => {
      expect(detectsLackOfUnderstanding('Hoy fue un buen día')).toBe(false);
    });

    test('NO debe detectar en mensaje neutral', () => {
      expect(detectsLackOfUnderstanding('Quiero hablar de mi trabajo')).toBe(false);
    });

    test('debe manejar string vacío sin error', () => {
      expect(detectsLackOfUnderstanding('')).toBe(false);
    });

    test('debe manejar null sin error', () => {
      expect(detectsLackOfUnderstanding(null)).toBe(false);
    });

    test('debe manejar undefined sin error', () => {
      expect(detectsLackOfUnderstanding(undefined)).toBe(false);
    });

    test('debe ser case-insensitive', () => {
      expect(detectsLackOfUnderstanding('NO ME ENTIENDES')).toBe(true);
      expect(detectsLackOfUnderstanding('No Me Entiendes')).toBe(true);
    });
  });

  describe('validateParaphrasisConstraints', () => {
    test('debe validar mensaje de longitud correcta', () => {
      const context = { messageLength: 50 };
      const result = validateParaphrasisConstraints(context);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('debe rechazar mensaje muy largo', () => {
      const context = { messageLength: 600 };
      const result = validateParaphrasisConstraints(context);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('message_too_long');
    });

    test('debe rechazar mensaje muy corto', () => {
      const context = { messageLength: 5 };
      const result = validateParaphrasisConstraints(context);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('message_too_short');
    });

    test('debe rechazar si se excede máximo de paráfrasis consecutivas', () => {
      const context = { messageLength: 50 };
      const history = [
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
      ];

      const result = validateParaphrasisConstraints(context, history);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('max_consecutive_reached');
    });

    test('debe validar con historial vacío', () => {
      const context = { messageLength: 50 };
      const result = validateParaphrasisConstraints(context, []);

      expect(result.valid).toBe(true);
    });

    test('debe validar con una paráfrasis reciente por debajo del máximo', () => {
      const context = { messageLength: 50 };
      const history = [
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
      ];

      const result = validateParaphrasisConstraints(context, history);

      expect(result.valid).toBe(true);
    });

    test('debe rechazar al alcanzar el máximo de paráfrasis consecutivas (2)', () => {
      const context = { messageLength: 50 };
      const history = [
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
      ];

      const result = validateParaphrasisConstraints(context, history);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('max_consecutive_reached');
    });
  });

  describe('countRecentParaphrasis', () => {
    test('debe contar 0 para historial vacío', () => {
      expect(countRecentParaphrasis([], 5)).toBe(0);
    });

    test('debe contar paráfrasis recientes correctamente', () => {
      const history = [
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        { role: 'user', content: 'mensaje' },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        { role: 'user', content: 'otro mensaje' },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: false } },
        },
      ];

      // Últimos 3 turnos del asistente
      expect(countRecentParaphrasis(history, 3)).toBe(2);
    });

    test('debe limitar a últimos N turnos', () => {
      const history = [
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
      ];

      // Solo últimos 2
      expect(countRecentParaphrasis(history, 2)).toBe(2);
    });

    test('debe ignorar turnos sin metadata de paráfrasis', () => {
      const history = [
        { role: 'assistant', content: 'sin metadata' },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        { role: 'assistant', metadata: {} },
      ];

      expect(countRecentParaphrasis(history, 3)).toBe(1);
    });

    test('debe contar solo turnos del asistente', () => {
      const history = [
        { role: 'user', content: 'mensaje' },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
        { role: 'user', content: 'otro' },
        {
          role: 'assistant',
          metadata: { paraphrasis: { wasParaphrasis: true } },
        },
      ];

      expect(countRecentParaphrasis(history, 10)).toBe(2);
    });

    test('debe manejar null o undefined sin error', () => {
      expect(countRecentParaphrasis(null, 5)).toBe(0);
      expect(countRecentParaphrasis(undefined, 5)).toBe(0);
    });
  });

  describe('markTurnAsParaphrasis', () => {
    test('debe marcar metadata con paráfrasis', () => {
      const metadata = {};
      const result = markTurnAsParaphrasis(metadata);

      expect(result.paraphrasis).toBeDefined();
      expect(result.paraphrasis.wasParaphrasis).toBe(true);
      expect(result.paraphrasis.timestamp).toBeDefined();
    });

    test('debe preservar metadata existente', () => {
      const metadata = {
        context: { emotional: { intensity: 8 } },
        someOtherField: 'value',
      };

      const result = markTurnAsParaphrasis(metadata);

      expect(result.context).toEqual(metadata.context);
      expect(result.someOtherField).toBe('value');
      expect(result.paraphrasis.wasParaphrasis).toBe(true);
    });

    test('debe generar timestamp válido', () => {
      const result = markTurnAsParaphrasis({});
      const timestamp = new Date(result.paraphrasis.timestamp);

      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    test('debe manejar metadata undefined', () => {
      const result = markTurnAsParaphrasis(undefined);

      expect(result.paraphrasis).toBeDefined();
      expect(result.paraphrasis.wasParaphrasis).toBe(true);
    });

    test('debe sobrescribir marca de paráfrasis anterior', () => {
      const metadata = {
        paraphrasis: {
          wasParaphrasis: false,
          timestamp: '2020-01-01T00:00:00.000Z',
        },
      };

      const result = markTurnAsParaphrasis(metadata);

      expect(result.paraphrasis.wasParaphrasis).toBe(true);
      expect(result.paraphrasis.timestamp).not.toBe(
        '2020-01-01T00:00:00.000Z'
      );
    });
  });

  describe('PARAPHRASIS_LIMITS', () => {
    test('debe exportar límites válidos', () => {
      expect(PARAPHRASIS_LIMITS.MAX_USER_MESSAGE_LENGTH).toBe(500);
      expect(PARAPHRASIS_LIMITS.MIN_USER_MESSAGE_LENGTH).toBe(10);
      expect(PARAPHRASIS_LIMITS.MAX_CONSECUTIVE_PARAPHRASIS).toBe(2);
      expect(PARAPHRASIS_LIMITS.COOLDOWN_TURNS).toBe(3);
      expect(PARAPHRASIS_LIMITS.MIN_EMOTIONAL_INTENSITY).toBe(7);
      expect(PARAPHRASIS_LIMITS.MIN_VULNERABLE_EMOTION_INTENSITY).toBe(5);
    });
  });
});
