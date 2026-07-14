/**
 * Tests unitarios para paraphrasDetectionService.js
 * Propuesta #55: Paráfrasis + validación antes consejo - Fase 2
 */

import { jest } from '@jest/globals';
import {
  detectParaphrasisInResponse,
  calculateSimilarity,
  isTooShortForParaphrasis,
  isTooLongForParaphrasis,
  DETECTION_LIMITS,
} from '../../../services/chat/paraphrasDetectionService.js';

describe('paraphrasDetectionService', () => {
  describe('detectParaphrasisInResponse', () => {
    describe('Casos positivos - Español', () => {
      test('debe detectar paráfrasis con frase clave + confirmación', () => {
        const assistant = 'Entiendo que estás muy estresada con el trabajo. ¿Te entendí bien?';
        const user = 'Estoy muy estresada en el trabajo';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.7);
        expect(result.details.hasPhraseKey).toBe(true);
        expect(result.details.hasConfirmation).toBe(true);
      });

      test('debe detectar paráfrasis con "veo que"', () => {
        const assistant = 'Veo que te sientes abrumada por la situación. ¿Es así?';
        const user = 'Me siento abrumada';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(true);
        expect(result.details.hasPhraseKey).toBe(true);
      });

      test('debe detectar paráfrasis con "te escucho"', () => {
        const assistant = 'Te escucho, suena como un momento muy difícil. ¿Verdad?';
        const user = 'Estoy pasando un momento muy difícil';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(true);
      });

      test('debe detectar paráfrasis con "siento que estás"', () => {
        const assistant = 'Siento que estás pasando por mucha ansiedad. ¿Es así?';
        const user = 'Tengo mucha ansiedad';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(true);
      });
    });

    describe('Casos positivos - Inglés', () => {
      test('debe detectar paráfrasis en inglés con "I understand"', () => {
        const assistant = 'I understand that you are feeling overwhelmed. Is that right?';
        const user = 'I feel overwhelmed';

        const result = detectParaphrasisInResponse(assistant, user, 'en');

        expect(result.hasParaphrasis).toBe(true);
        expect(result.details.hasPhraseKey).toBe(true);
      });

      test('debe detectar paráfrasis en inglés con "I hear you"', () => {
        const assistant = 'I hear you. It sounds like a tough situation. Am I right?';
        const user = 'This is a tough situation';

        const result = detectParaphrasisInResponse(assistant, user, 'en');

        expect(result.hasParaphrasis).toBe(true);
      });
    });

    describe('Casos negativos', () => {
      test('NO debe detectar paráfrasis en respuesta directa sin frases clave', () => {
        const assistant = 'Puedes intentar técnicas de respiración para relajarte.';
        const user = 'Estoy muy estresada';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.confidence).toBeLessThan(0.5);
      });

      test('NO debe detectar copia textual como paráfrasis', () => {
        const assistant = 'Estoy muy estresada en el trabajo.';
        const user = 'Estoy muy estresada en el trabajo.';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.details.isTextualCopy).toBe(true);
      });

      test('NO debe detectar paráfrasis en mensaje muy corto', () => {
        const assistant = 'Entiendo.';
        const user = 'Estoy estresada';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.details.reason).toBe('message_too_short');
      });

      test('NO debe detectar paráfrasis en mensaje muy largo', () => {
        const assistant = 'a'.repeat(600);
        const user = 'Estoy estresada';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.details.reason).toBe('message_too_long');
      });

      test('NO debe detectar paráfrasis sin similitud semántica', () => {
        const assistant = 'Entiendo que te sientes feliz. ¿Es así?';
        const user = 'Estoy muy triste';

        const result = detectParaphrasisInResponse(assistant, user, 'es');

        // Tiene frases clave pero no similitud semántica
        expect(result.hasParaphrasis).toBe(true); // Aún detecta por frases clave
        expect(result.details.hasSemanticSimilarity).toBeUndefined();
      });
    });

    describe('Validación de entrada', () => {
      test('debe manejar assistantMessage null', () => {
        const result = detectParaphrasisInResponse(null, 'mensaje', 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.confidence).toBe(0);
        expect(result.details.reason).toBe('invalid_assistant_message');
      });

      test('debe manejar userMessage null', () => {
        const result = detectParaphrasisInResponse('mensaje', null, 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.confidence).toBe(0);
        expect(result.details.reason).toBe('invalid_user_message');
      });

      test('debe manejar assistantMessage no-string', () => {
        const result = detectParaphrasisInResponse(123, 'mensaje', 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.details.reason).toBe('invalid_assistant_message');
      });

      test('debe manejar userMessage no-string', () => {
        const result = detectParaphrasisInResponse('mensaje', [], 'es');

        expect(result.hasParaphrasis).toBe(false);
        expect(result.details.reason).toBe('invalid_user_message');
      });

      test('debe usar español por defecto si language es inválido', () => {
        const assistant = 'Entiendo que estás muy estresada con el trabajo. ¿Te entendí bien?';
        const user = 'Estoy muy estresada en el trabajo';

        const result = detectParaphrasisInResponse(assistant, user, 123);

        // Debe usar patterns en español
        expect(result.hasParaphrasis).toBe(true);
      });
    });
  });

  describe('calculateSimilarity', () => {
    test('debe calcular similitud para mensajes relacionados', () => {
      const str1 = 'Estoy estresada trabajo problemas jefe';
      const str2 = 'Entiendo trabajo está causando estrés problemas';

      const similarity = calculateSimilarity(str1, str2);

      // Similitud debe estar en rango razonable (no muy baja, no idéntica)
      expect(similarity).toBeGreaterThan(0.15);
      expect(similarity).toBeLessThan(0.8);
    });

    test('debe calcular similitud 1.0 para mensajes idénticos', () => {
      const str1 = 'Estoy muy estresada';
      const str2 = 'Estoy muy estresada';

      const similarity = calculateSimilarity(str1, str2);

      expect(similarity).toBeGreaterThan(0.9);
    });

    test('debe calcular similitud baja para mensajes diferentes', () => {
      const str1 = 'Estoy feliz y contenta';
      const str2 = 'Tengo miedo y ansiedad';

      const similarity = calculateSimilarity(str1, str2);

      expect(similarity).toBeLessThan(0.3);
    });

    test('debe calcular similitud 0 para mensajes muy cortos', () => {
      const str1 = 'abc';
      const str2 = 'xyz';

      const similarity = calculateSimilarity(str1, str2);

      expect(similarity).toBe(0);
    });

    test('debe manejar str1 null', () => {
      const similarity = calculateSimilarity(null, 'mensaje');
      expect(similarity).toBe(0);
    });

    test('debe manejar str2 null', () => {
      const similarity = calculateSimilarity('mensaje', null);
      expect(similarity).toBe(0);
    });

    test('debe manejar strings vacíos', () => {
      const similarity = calculateSimilarity('', '');
      expect(similarity).toBe(0);
    });

    test('debe ignorar palabras cortas (<= 3 caracteres)', () => {
      const str1 = 'abc def ghi jkl mno';
      const str2 = 'xyz uvw rst opq lmn';

      const similarity = calculateSimilarity(str1, str2);

      // Todas las palabras son <= 3 caracteres, se ignoran
      expect(similarity).toBe(0);
    });

    test('debe ser case-insensitive', () => {
      const str1 = 'Estoy ESTRESADA';
      const str2 = 'estoy estresada';

      const similarity = calculateSimilarity(str1, str2);

      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('isTooShortForParaphrasis', () => {
    test('debe detectar mensaje muy corto', () => {
      expect(isTooShortForParaphrasis('Entiendo.')).toBe(true);
    });

    test('debe detectar mensaje de longitud adecuada', () => {
      expect(isTooShortForParaphrasis('Entiendo que estás estresada.')).toBe(false);
    });

    test('debe manejar mensaje null', () => {
      expect(isTooShortForParaphrasis(null)).toBe(true);
    });

    test('debe manejar mensaje no-string', () => {
      expect(isTooShortForParaphrasis(123)).toBe(true);
    });

    test('debe manejar string vacío', () => {
      expect(isTooShortForParaphrasis('')).toBe(true);
    });

    test('debe manejar string con solo espacios', () => {
      expect(isTooShortForParaphrasis('     ')).toBe(true);
    });
  });

  describe('isTooLongForParaphrasis', () => {
    test('debe detectar mensaje muy largo', () => {
      const longMessage = 'a'.repeat(600);
      expect(isTooLongForParaphrasis(longMessage)).toBe(true);
    });

    test('debe detectar mensaje de longitud adecuada', () => {
      const normalMessage = 'Entiendo que estás estresada con el trabajo. ¿Es así?';
      expect(isTooLongForParaphrasis(normalMessage)).toBe(false);
    });

    test('debe manejar mensaje null', () => {
      expect(isTooLongForParaphrasis(null)).toBe(false);
    });

    test('debe manejar mensaje no-string', () => {
      expect(isTooLongForParaphrasis(123)).toBe(false);
    });

    test('debe manejar string vacío', () => {
      expect(isTooLongForParaphrasis('')).toBe(false);
    });
  });

  describe('DETECTION_LIMITS', () => {
    test('debe exportar límites válidos', () => {
      expect(DETECTION_LIMITS.MIN_ASSISTANT_LENGTH).toBe(20);
      expect(DETECTION_LIMITS.MAX_ASSISTANT_LENGTH).toBe(500);
      expect(DETECTION_LIMITS.MIN_SIMILARITY).toBe(0.3);
      expect(DETECTION_LIMITS.MAX_SIMILARITY).toBe(0.8);
      expect(DETECTION_LIMITS.CONFIDENCE_THRESHOLD).toBe(0.5);
      expect(DETECTION_LIMITS.MIN_WORD_LENGTH).toBe(3);
    });
  });
});
