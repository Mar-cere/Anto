/**
 * Tests de hardening para paraphrasisPolicySnippet.js
 * Propuesta #55: Paráfrasis + validación antes consejo
 * 
 * Cubre validación de entrada, edge cases y datos malformados.
 */

import { jest } from '@jest/globals';
import {
  buildParaphrasisPolicySnippet,
  shouldRequireParaphrasis,
  detectsLackOfUnderstanding,
  validateParaphrasisConstraints,
  countRecentParaphrasis,
  markTurnAsParaphrasis,
} from '../../../services/chat/paraphrasisPolicySnippet.js';

describe('paraphrasisPolicySnippet - Hardening', () => {
  describe('buildParaphrasisPolicySnippet - validación de entrada', () => {
    test('debe manejar language null sin error', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet(null, context);
      // Debe usar default 'es'
      expect(typeof snippet).toBe('string');
      if (snippet) {
        expect(snippet).toContain('Paráfrasis');
      }
    });

    test('debe manejar language undefined sin error', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet(undefined, context);
      expect(typeof snippet).toBe('string');
    });

    test('debe manejar language como número sin error', () => {
      const context = { emotionalIntensity: 8, messageLength: 50 };
      const snippet = buildParaphrasisPolicySnippet(123, context);
      expect(typeof snippet).toBe('string');
    });

    test('debe manejar context como array sin error', () => {
      const snippet = buildParaphrasisPolicySnippet('es', [1, 2, 3]);
      expect(snippet).toBe('');
    });

    test('debe manejar context como string sin error', () => {
      const snippet = buildParaphrasisPolicySnippet('es', 'invalid');
      expect(snippet).toBe('');
    });

    test('debe manejar context como null sin error', () => {
      const snippet = buildParaphrasisPolicySnippet('es', null);
      expect(snippet).toBe('');
    });
  });

  describe('shouldRequireParaphrasis - validación de tipos numéricos', () => {
    test('debe normalizar emotionalIntensity NaN a default', () => {
      const context = {
        emotionalIntensity: NaN,
        messageLength: 50,
      };
      // Con default (5), no debe requerir paráfrasis
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe normalizar emotionalIntensity Infinity a default', () => {
      const context = {
        emotionalIntensity: Infinity,
        messageLength: 50,
      };
      // Infinity no es finito, se normaliza a default (5), que es < 7
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe normalizar emotionalIntensity negativa a 0', () => {
      const context = {
        emotionalIntensity: -5,
        messageLength: 50,
      };
      // -5 se normaliza a 0, que es < 7
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe normalizar emotionalIntensity mayor a 10', () => {
      const context = {
        emotionalIntensity: 15,
        messageLength: 50,
      };
      // 15 se normaliza a 10, que es >= 7
      expect(shouldRequireParaphrasis(context)).toBe(true);
    });

    test('debe manejar emotionalIntensity como string sin error', () => {
      const context = {
        emotionalIntensity: '8',
        messageLength: 50,
      };
      // String se convierte a default (5)
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe normalizar messageLength NaN a 0', () => {
      const context = {
        emotionalIntensity: 8,
        messageLength: NaN,
      };
      // messageLength 0 < MIN (10), no requiere
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe normalizar messageLength Infinity a 0', () => {
      const context = {
        emotionalIntensity: 8,
        messageLength: Infinity,
      };
      // Infinity no es finito, se normaliza a 0
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe normalizar messageLength negativo a 0', () => {
      const context = {
        emotionalIntensity: 8,
        messageLength: -10,
      };
      // Negativo no pasa validación >= 0, se normaliza a 0
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe manejar mainEmotion no-string sin error', () => {
      const context = {
        mainEmotion: 123,
        messageLength: 50,
      };
      // mainEmotion se normaliza a null, no requiere
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe manejar mainEmotion null sin error', () => {
      const context = {
        mainEmotion: null,
        messageLength: 50,
      };
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe manejar context como array sin error', () => {
      expect(shouldRequireParaphrasis([1, 2, 3])).toBe(false);
    });

    test('debe manejar context como null sin error', () => {
      expect(shouldRequireParaphrasis(null)).toBe(false);
    });

    test('debe manejar context como string sin error', () => {
      expect(shouldRequireParaphrasis('invalid')).toBe(false);
    });
  });

  describe('validateParaphrasisConstraints - validación de entrada', () => {
    test('debe rechazar context como array', () => {
      const result = validateParaphrasisConstraints([1, 2, 3], []);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_context');
    });

    test('debe rechazar context como null', () => {
      const result = validateParaphrasisConstraints(null, []);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_context');
    });

    test('debe rechazar context como string', () => {
      const result = validateParaphrasisConstraints('invalid', []);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_context');
    });

    test('debe manejar messageLength NaN sin error', () => {
      const context = { messageLength: NaN };
      const result = validateParaphrasisConstraints(context, []);
      // NaN se normaliza a 0, que es < MIN (10)
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('message_too_short');
    });

    test('debe manejar messageLength Infinity sin error', () => {
      const context = { messageLength: Infinity };
      const result = validateParaphrasisConstraints(context, []);
      // Infinity no es finito, se normaliza a 0
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('message_too_short');
    });

    test('debe manejar messageLength negativo sin error', () => {
      const context = { messageLength: -50 };
      const result = validateParaphrasisConstraints(context, []);
      // Negativo se normaliza a 0
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('message_too_short');
    });

    test('debe manejar conversationHistory no-array sin error', () => {
      const context = { messageLength: 50 };
      const result = validateParaphrasisConstraints(context, 'not an array');
      // Debe validar true y emitir warning
      expect(result.valid).toBe(true);
    });

    test('debe manejar conversationHistory null sin error', () => {
      const context = { messageLength: 50 };
      const result = validateParaphrasisConstraints(context, null);
      expect(result.valid).toBe(true);
    });
  });

  describe('countRecentParaphrasis - validación de entrada', () => {
    test('debe retornar 0 para conversationHistory null', () => {
      expect(countRecentParaphrasis(null, 5)).toBe(0);
    });

    test('debe retornar 0 para conversationHistory no-array', () => {
      expect(countRecentParaphrasis('invalid', 5)).toBe(0);
      expect(countRecentParaphrasis(123, 5)).toBe(0);
      expect(countRecentParaphrasis({ key: 'value' }, 5)).toBe(0);
    });

    test('debe normalizar lookbackTurns NaN a default', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      // NaN se normaliza a COOLDOWN_TURNS (2)
      expect(countRecentParaphrasis(history, NaN)).toBe(2);
    });

    test('debe normalizar lookbackTurns Infinity a default', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      // Infinity no es finito, se normaliza a default
      expect(countRecentParaphrasis(history, Infinity)).toBe(1);
    });

    test('debe normalizar lookbackTurns negativo a default', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      // Negativo se normaliza a default
      expect(countRecentParaphrasis(history, -5)).toBe(1);
    });

    test('debe normalizar lookbackTurns decimal a entero', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      // 2.7 se normaliza a 2 (floor)
      expect(countRecentParaphrasis(history, 2.7)).toBe(2);
    });

    test('debe filtrar mensajes malformados (sin role)', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
        { content: 'mensaje sin role' },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      expect(countRecentParaphrasis(history, 5)).toBe(2);
    });

    test('debe filtrar mensajes null en historial', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
        null,
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      expect(countRecentParaphrasis(history, 5)).toBe(2);
    });

    test('debe filtrar mensajes no-object en historial', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
        'string inválido',
        123,
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      expect(countRecentParaphrasis(history, 5)).toBe(2);
    });

    test('debe manejar metadata no-object sin error', () => {
      const history = [
        { role: 'assistant', metadata: 'not an object' },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      expect(countRecentParaphrasis(history, 5)).toBe(1);
    });

    test('debe manejar paraphrasis no-object sin error', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: 'not an object' } },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      expect(countRecentParaphrasis(history, 5)).toBe(1);
    });

    test('debe manejar wasParaphrasis no-boolean sin error', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: 'yes' } } },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      // Solo cuenta los que son === true
      expect(countRecentParaphrasis(history, 5)).toBe(1);
    });
  });

  describe('markTurnAsParaphrasis - validación de entrada', () => {
    test('debe manejar metadata como array sin error', () => {
      const result = markTurnAsParaphrasis([1, 2, 3]);
      expect(result).toBeDefined();
      expect(result.paraphrasis).toBeDefined();
      expect(result.paraphrasis.wasParaphrasis).toBe(true);
    });

    test('debe manejar metadata como string sin error', () => {
      const result = markTurnAsParaphrasis('invalid');
      expect(result).toBeDefined();
      expect(result.paraphrasis.wasParaphrasis).toBe(true);
    });

    test('debe manejar metadata como null sin error', () => {
      const result = markTurnAsParaphrasis(null);
      expect(result).toBeDefined();
      expect(result.paraphrasis.wasParaphrasis).toBe(true);
    });

    test('debe manejar metadata como número sin error', () => {
      const result = markTurnAsParaphrasis(123);
      expect(result).toBeDefined();
      expect(result.paraphrasis.wasParaphrasis).toBe(true);
    });
  });

  describe('Edge cases - combinaciones complejas', () => {
    test('debe manejar contexto con todos los valores inválidos', () => {
      const context = {
        emotionalIntensity: NaN,
        mainEmotion: 123,
        isFirstTurn: 'not a boolean',
        isCrisisActive: null,
        isFactualQuery: undefined,
        messageLength: Infinity,
        hasAbruptToneChange: [],
        previousTurnWasParaphrasis: {},
        userExpressesLackOfUnderstanding: 0,
      };
      // No debe lanzar error
      expect(() => shouldRequireParaphrasis(context)).not.toThrow();
      expect(shouldRequireParaphrasis(context)).toBe(false);
    });

    test('debe manejar historial con estructura inconsistente', () => {
      const history = [
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
        { role: 'user' },
        null,
        'string',
        123,
        { role: 'assistant' },
        { role: 'assistant', metadata: null },
        { role: 'assistant', metadata: {} },
        { role: 'assistant', metadata: { paraphrasis: null } },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: false } } },
        { role: 'assistant', metadata: { paraphrasis: { wasParaphrasis: true } } },
      ];
      // Solo debe contar los 2 con wasParaphrasis === true
      expect(countRecentParaphrasis(history, 20)).toBe(2);
    });
  });

  describe('Protección contra inyección', () => {
    test('buildParaphrasisPolicySnippet debe devolver snippet seguro sin interpolar contexto', () => {
      const context = {
        emotionalIntensity: 8,
        mainEmotion: '<script>alert("xss")</script>',
        messageLength: 50,
      };
      const snippet = buildParaphrasisPolicySnippet('es', context);
      // El snippet no debe contener el mainEmotion porque es estático
      expect(snippet).not.toContain('<script>');
      expect(snippet).not.toContain('alert');
    });

    test('detectsLackOfUnderstanding debe manejar mensaje con caracteres especiales', () => {
      const message = 'No me entiendes <script>alert("xss")</script>';
      // Debe detectar "no me entiendes" sin problema
      expect(detectsLackOfUnderstanding(message)).toBe(true);
    });
  });
});
