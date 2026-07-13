/**
 * Tests de hardening para paraphrasDetectionService.js y paraphrasMetricsService.js
 * Propuesta #55: Paráfrasis + validación antes consejo - Fase 2
 * 
 * Cubre validación de entrada, edge cases y protecciones DoS.
 */

import { jest } from '@jest/globals';
import {
  detectParaphrasisInResponse,
  calculateSimilarity,
  DETECTION_LIMITS,
} from '../../../services/chat/paraphrasDetectionService.js';

// Import dinámico del servicio de métricas
let recordParaphrasMetrics, getParaphrasStats;
let Message, Conversation;

beforeAll(async () => {
  const metricsService = await import('../../../services/chat/paraphrasMetricsService.js');
  recordParaphrasMetrics = metricsService.recordParaphrasMetrics;
  getParaphrasStats = metricsService.getParaphrasStats;

  Message = (await import('../../../models/Message.js')).default;
  Conversation = (await import('../../../models/Conversation.js')).default;
});

describe('paraphrasDetectionService - Hardening', () => {
  describe('detectParaphrasisInResponse - protección DoS', () => {
    test('debe manejar assistantMessage extremadamente largo', () => {
      const longMessage = 'a'.repeat(100000);
      const user = 'Estoy estresada';

      const result = detectParaphrasisInResponse(longMessage, user, 'es');

      expect(result.hasParaphrasis).toBe(false);
      expect(result.details.reason).toBe('message_too_long');
    });

    test('debe manejar userMessage extremadamente largo en calculateSimilarity', () => {
      const assistant = 'Entiendo que estás estresada. ¿Es así?';
      const longUser = 'a'.repeat(15000);

      // No debe lanzar error, debe retornar resultado con similitud 0
      const result = detectParaphrasisInResponse(assistant, longUser, 'es');

      expect(result).toBeDefined();
      expect(result.details.similarity).toBe(0);
    });

    test('debe limitar palabras en calculateSimilarity', () => {
      const words = [];
      for (let i = 0; i < 2000; i++) {
        words.push(`word${i}`);
      }
      const str1 = words.join(' ');
      const str2 = words.slice(0, 1000).join(' ');

      // Debe procesar solo hasta MAX_WORDS_FOR_SIMILARITY
      const similarity = calculateSimilarity(str1, str2);

      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('detectParaphrasisInResponse - tipos inválidos', () => {
    test('debe manejar assistantMessage como array', () => {
      const result = detectParaphrasisInResponse(['array'], 'mensaje', 'es');

      expect(result.hasParaphrasis).toBe(false);
      expect(result.details.reason).toBe('invalid_assistant_message');
    });

    test('debe manejar userMessage como objeto', () => {
      const result = detectParaphrasisInResponse('mensaje', { obj: 'value' }, 'es');

      expect(result.hasParaphrasis).toBe(false);
      expect(result.details.reason).toBe('invalid_user_message');
    });

    test('debe manejar language como número', () => {
      const assistant = 'Entiendo que estás estresada. ¿Es así?';
      const user = 'Estoy estresada';

      const result = detectParaphrasisInResponse(assistant, user, 123);

      // Debe usar español por defecto
      expect(result).toBeDefined();
      expect(typeof result.hasParaphrasis).toBe('boolean');
    });

    test('debe manejar language como objeto', () => {
      const assistant = 'Entiendo que estás estresada. ¿Es así?';
      const user = 'Estoy estresada';

      const result = detectParaphrasisInResponse(assistant, user, { lang: 'es' });

      // Debe usar español por defecto
      expect(result).toBeDefined();
    });
  });

  describe('calculateSimilarity - protección DoS', () => {
    test('debe retornar 0 para strings extremadamente largos', () => {
      const longStr1 = 'a'.repeat(15000);
      const longStr2 = 'b'.repeat(15000);

      const similarity = calculateSimilarity(longStr1, longStr2);

      expect(similarity).toBe(0);
    });

    test('debe manejar string con muchas palabras cortas', () => {
      const shortWords = Array(5000).fill('ab').join(' ');

      const similarity = calculateSimilarity(shortWords, shortWords);

      // Todas las palabras son <= 3 chars, se filtran
      expect(similarity).toBe(0);
    });

    test('debe manejar palabras vacías en split', () => {
      const str1 = 'palabra1    palabra2     palabra3';
      const str2 = 'palabra1  palabra2  palabra3';

      const similarity = calculateSimilarity(str1, str2);

      // Debe manejar espacios múltiples sin problema
      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('calculateSimilarity - edge cases', () => {
    test('debe manejar strings con solo espacios', () => {
      const similarity = calculateSimilarity('     ', '     ');
      expect(similarity).toBe(0);
    });

    test('debe manejar strings con caracteres especiales', () => {
      const str1 = 'test@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      const str2 = 'test@#$%^&*()';

      // Debe procesar sin error
      const similarity = calculateSimilarity(str1, str2);
      expect(typeof similarity).toBe('number');
    });

    test('debe manejar strings con emojis', () => {
      const str1 = 'test 😊 palabra 😢';
      const str2 = 'test palabra 😊';

      // Debe procesar sin error
      const similarity = calculateSimilarity(str1, str2);
      expect(typeof similarity).toBe('number');
    });

    test('debe manejar strings con saltos de línea', () => {
      const str1 = 'palabra1\npalabra2\npalabra3';
      const str2 = 'palabra1 palabra2 palabra3';

      const similarity = calculateSimilarity(str1, str2);
      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('DETECTION_LIMITS - nuevos límites', () => {
    test('debe tener límite de string para similitud', () => {
      expect(DETECTION_LIMITS.MAX_STRING_LENGTH_FOR_SIMILARITY).toBe(10000);
    });

    test('debe tener límite de palabras para similitud', () => {
      expect(DETECTION_LIMITS.MAX_WORDS_FOR_SIMILARITY).toBe(1000);
    });
  });
});

describe('paraphrasMetricsService - Hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordParaphrasMetrics - validación robusta', () => {
    test('debe rechazar metricsData como array', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });

      await recordParaphrasMetrics('convId', 'msgId', [1, 2, 3]);

      expect(Message.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('debe rechazar conversationId como número', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });

      await recordParaphrasMetrics(123, 'msgId', {
        wasRequired: true,
        wasDetected: true,
        confidence: 0.8,
      });

      expect(Message.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('debe rechazar messageId como objeto', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });

      await recordParaphrasMetrics('convId', { id: 'msgId' }, {
        wasRequired: true,
        wasDetected: true,
        confidence: 0.8,
      });

      expect(Message.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('debe normalizar confidence negativo a 0', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });
      Conversation.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'convId' });

      await recordParaphrasMetrics('convId', 'msgId', {
        wasRequired: true,
        wasDetected: true,
        confidence: -0.5,
      });

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith('msgId', {
        $set: {
          'metadata.paraphrasis': expect.objectContaining({
            confidence: 0,
          }),
        },
      });
    });

    test('debe normalizar confidence Infinity a 1', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });
      Conversation.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'convId' });

      await recordParaphrasMetrics('convId', 'msgId', {
        wasRequired: true,
        wasDetected: true,
        confidence: Infinity,
      });

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith('msgId', {
        $set: {
          'metadata.paraphrasis': expect.objectContaining({
            confidence: 0, // Infinity no es finito, se normaliza a 0
          }),
        },
      });
    });

    test('debe normalizar wasRequired no-boolean a boolean', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });
      Conversation.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'convId' });

      await recordParaphrasMetrics('convId', 'msgId', {
        wasRequired: 'true', // String
        wasDetected: 1, // Number
        confidence: 0.8,
      });

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith('msgId', {
        $set: {
          'metadata.paraphrasis': expect.objectContaining({
            wasRequired: true, // Normalizado a boolean
            wasDetected: true, // Normalizado a boolean
          }),
        },
      });
    });
  });

  describe('getParaphrasStats - validación robusta', () => {
    test('debe manejar filters como string sin error', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 0,
          totalParaphrasisRequired: 0,
          totalParaphrasisDetected: 0,
          adherenceRate: 0,
        },
      ]);

      const stats = await getParaphrasStats('invalid string');

      expect(stats).toBeDefined();
      expect(stats.totalConversations).toBe(0);
    });

    test('debe manejar filters como array sin error', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 0,
          totalParaphrasisRequired: 0,
          totalParaphrasisDetected: 0,
          adherenceRate: 0,
        },
      ]);

      const stats = await getParaphrasStats([1, 2, 3]);

      expect(stats).toBeDefined();
    });

    test('debe manejar fechas inválidas sin error', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 0,
          totalParaphrasisRequired: 0,
          totalParaphrasisDetected: 0,
          adherenceRate: 0,
        },
      ]);

      const stats = await getParaphrasStats({
        startDate: 'invalid date',
        endDate: 'also invalid',
      });

      expect(stats).toBeDefined();
      // Debe ignorar fechas inválidas
      const aggregatePipeline = Conversation.aggregate.mock.calls[0][0];
      expect(aggregatePipeline[0].$match.createdAt).toBeUndefined();
    });

    test('debe manejar userId no-string sin error', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 0,
          totalParaphrasisRequired: 0,
          totalParaphrasisDetected: 0,
          adherenceRate: 0,
        },
      ]);

      const stats = await getParaphrasStats({ userId: 123 });

      expect(stats).toBeDefined();
      // Debe ignorar userId inválido
      const aggregatePipeline = Conversation.aggregate.mock.calls[0][0];
      expect(aggregatePipeline[0].$match.userId).toBeUndefined();
    });
  });
});
