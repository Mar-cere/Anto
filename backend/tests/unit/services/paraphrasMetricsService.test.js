/**
 * Tests unitarios para paraphrasMetricsService.js
 * Propuesta #55: Paráfrasis + validación antes consejo - Fase 2
 */

import { jest } from '@jest/globals';

// Import dinámico de servicios y modelos
let recordParaphrasMetrics,
  getParaphrasStats,
  getUserParaphrasMetrics,
  calculateAdherenceRate,
  validateParaphrasMetricsSetup,
  METRICS_CONFIG;
let Message, Conversation;

beforeAll(async () => {
  // Importar servicios
  const metricsService = await import('../../../services/chat/paraphrasMetricsService.js');
  recordParaphrasMetrics = metricsService.recordParaphrasMetrics;
  getParaphrasStats = metricsService.getParaphrasStats;
  getUserParaphrasMetrics = metricsService.getUserParaphrasMetrics;
  calculateAdherenceRate = metricsService.calculateAdherenceRate;
  validateParaphrasMetricsSetup = metricsService.validateParaphrasMetricsSetup;
  METRICS_CONFIG = metricsService.METRICS_CONFIG;

  // Importar modelos
  Message = (await import('../../../models/Message.js')).default;
  Conversation = (await import('../../../models/Conversation.js')).default;
});

describe('paraphrasMetricsService', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('recordParaphrasMetrics', () => {
    test('debe registrar métricas correctamente', async () => {
      // Mock de findByIdAndUpdate
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });
      Conversation.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'convId' });

      await recordParaphrasMetrics('convId', 'msgId', {
        wasRequired: true,
        wasDetected: true,
        confidence: 0.8,
        emotionalContext: { intensity: 7 },
      });

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith('msgId', {
        $set: {
          'metadata.paraphrasis': expect.objectContaining({
            wasRequired: true,
            wasDetected: true,
            confidence: 0.8,
          }),
        },
      });

      expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith('convId', {
        $inc: {
          'metrics.paraphrasisRequired': 1,
          'metrics.paraphrasisDetected': 1,
        },
      });
    });

    test('debe registrar solo wasRequired cuando wasDetected es false', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });
      Conversation.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'convId' });

      await recordParaphrasMetrics('convId', 'msgId', {
        wasRequired: true,
        wasDetected: false,
        confidence: 0.2,
      });

      expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith('convId', {
        $inc: {
          'metrics.paraphrasisRequired': 1,
        },
      });
    });

    test('debe manejar conversationId inválido sin error', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });

      await recordParaphrasMetrics(null, 'msgId', {
        wasRequired: true,
        wasDetected: true,
        confidence: 0.8,
      });

      expect(Message.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('debe manejar messageId inválido sin error', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });

      await recordParaphrasMetrics('convId', null, {
        wasRequired: true,
        wasDetected: true,
        confidence: 0.8,
      });

      expect(Message.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('debe manejar metricsData inválido sin error', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });

      await recordParaphrasMetrics('convId', 'msgId', null);

      expect(Message.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('debe normalizar confidence a rango 0-1', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });
      Conversation.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'convId' });

      await recordParaphrasMetrics('convId', 'msgId', {
        wasRequired: true,
        wasDetected: true,
        confidence: 1.5, // Fuera de rango
      });

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith('msgId', {
        $set: {
          'metadata.paraphrasis': expect.objectContaining({
            confidence: 1.0, // Normalizado a 1.0
          }),
        },
      });
    });

    test('debe normalizar confidence NaN a 0', async () => {
      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'msgId' });
      Conversation.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'convId' });

      await recordParaphrasMetrics('convId', 'msgId', {
        wasRequired: true,
        wasDetected: true,
        confidence: NaN,
      });

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith('msgId', {
        $set: {
          'metadata.paraphrasis': expect.objectContaining({
            confidence: 0,
          }),
        },
      });
    });

    test('debe manejar error de DB sin fallar', async () => {
      Message.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(
        recordParaphrasMetrics('convId', 'msgId', {
          wasRequired: true,
          wasDetected: true,
          confidence: 0.8,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getParaphrasStats', () => {
    test('debe retornar estadísticas agregadas', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 10,
          totalParaphrasisRequired: 50,
          totalParaphrasisDetected: 40,
          adherenceRate: 0.8,
        },
      ]);

      const stats = await getParaphrasStats();

      expect(stats.totalConversations).toBe(10);
      expect(stats.totalParaphrasisRequired).toBe(50);
      expect(stats.totalParaphrasisDetected).toBe(40);
      expect(stats.adherenceRate).toBe(0.8);
    });

    test('debe retornar valores por defecto si no hay datos', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([]);

      const stats = await getParaphrasStats();

      expect(stats.totalConversations).toBe(0);
      expect(stats.totalParaphrasisRequired).toBe(0);
      expect(stats.totalParaphrasisDetected).toBe(0);
      expect(stats.adherenceRate).toBe(0);
    });

    test('debe filtrar por userId', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 5,
          totalParaphrasisRequired: 20,
          totalParaphrasisDetected: 18,
          adherenceRate: 0.9,
        },
      ]);

      const stats = await getParaphrasStats({ userId: 'user123' });

      expect(Conversation.aggregate).toHaveBeenCalled();
      const aggregatePipeline = Conversation.aggregate.mock.calls[0][0];
      expect(aggregatePipeline[0].$match.userId).toBe('user123');
    });

    test('debe filtrar por rango de fechas', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 5,
          totalParaphrasisRequired: 20,
          totalParaphrasisDetected: 18,
          adherenceRate: 0.9,
        },
      ]);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const stats = await getParaphrasStats({ startDate, endDate });

      expect(Conversation.aggregate).toHaveBeenCalled();
      const aggregatePipeline = Conversation.aggregate.mock.calls[0][0];
      expect(aggregatePipeline[0].$match.createdAt.$gte).toEqual(startDate);
      expect(aggregatePipeline[0].$match.createdAt.$lte).toEqual(endDate);
    });

    test('debe manejar filters inválidos sin error', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 0,
          totalParaphrasisRequired: 0,
          totalParaphrasisDetected: 0,
          adherenceRate: 0,
        },
      ]);

      const stats = await getParaphrasStats('invalid');

      expect(stats).toBeDefined();
      expect(stats.totalConversations).toBe(0);
    });

    test('debe manejar error de DB', async () => {
      Conversation.aggregate = jest.fn().mockRejectedValue(new Error('DB error'));

      const stats = await getParaphrasStats();

      expect(stats.totalConversations).toBe(0);
      expect(stats.error).toBeDefined();
    });
  });

  describe('getUserParaphrasMetrics', () => {
    test('debe retornar métricas de usuario', async () => {
      Conversation.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: 'conv1' }, { _id: 'conv2' }]),
          }),
        }),
      });

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: 'msg1',
                conversationId: 'conv1',
                metadata: {
                  paraphrasis: {
                    wasRequired: true,
                    wasDetected: true,
                    confidence: 0.8,
                  },
                },
                createdAt: new Date(),
              },
              {
                _id: 'msg2',
                conversationId: 'conv1',
                metadata: {
                  paraphrasis: {
                    wasRequired: true,
                    wasDetected: false,
                    confidence: 0.3,
                  },
                },
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const metrics = await getUserParaphrasMetrics('user123');

      expect(metrics.userId).toBe('user123');
      expect(metrics.totalMessages).toBe(2);
      expect(metrics.paraphrasisRequired).toBe(2);
      expect(metrics.paraphrasisDetected).toBe(1);
      expect(metrics.adherenceRate).toBe(0.5);
    });

    test('debe retornar valores por defecto para userId inválido', async () => {
      const metrics = await getUserParaphrasMetrics(null);

      expect(metrics.userId).toBe(null);
      expect(metrics.totalMessages).toBe(0);
      expect(metrics.paraphrasisRequired).toBe(0);
      expect(metrics.paraphrasisDetected).toBe(0);
      expect(metrics.adherenceRate).toBe(0);
    });

    test('debe retornar valores por defecto si no hay conversaciones', async () => {
      Conversation.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const metrics = await getUserParaphrasMetrics('user123');

      expect(metrics.totalMessages).toBe(0);
    });

    test('debe respetar el límite de mensajes', async () => {
      Conversation.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: 'conv1' }]),
          }),
        }),
      });

      const limitMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      });

      await getUserParaphrasMetrics('user123', { limit: 10 });

      expect(Message.find).toHaveBeenCalled();
      expect(limitMock).toHaveBeenCalledWith(10);
    });

    test('debe limitar a máximo 100 mensajes', async () => {
      Conversation.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: 'conv1' }]),
          }),
        }),
      });

      const limitMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      });

      await getUserParaphrasMetrics('user123', { limit: 200 });

      expect(limitMock).toHaveBeenCalledWith(100);
    });

    test('debe manejar error de DB', async () => {
      Conversation.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      });

      const metrics = await getUserParaphrasMetrics('user123');

      expect(metrics.error).toBeDefined();
    });
  });

  describe('calculateAdherenceRate', () => {
    test('debe calcular tasa de adherencia', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([
        {
          totalConversations: 10,
          totalParaphrasisRequired: 50,
          totalParaphrasisDetected: 40,
          adherenceRate: 0.8,
        },
      ]);

      const rate = await calculateAdherenceRate('2026-01-01', '2026-12-31');

      expect(rate).toBe(0.8);
    });

    test('debe retornar 0 si no hay stats', async () => {
      Conversation.aggregate = jest.fn().mockResolvedValue([]);

      const rate = await calculateAdherenceRate('2026-01-01', '2026-12-31');

      expect(rate).toBe(0);
    });

    test('debe manejar error de DB', async () => {
      Conversation.aggregate = jest.fn().mockRejectedValue(new Error('DB error'));

      const rate = await calculateAdherenceRate('2026-01-01', '2026-12-31');

      expect(rate).toBe(0);
    });
  });

  describe('validateParaphrasMetricsSetup', () => {
    test('debe validar setup correcto', async () => {
      Conversation.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'conv1' }),
      });

      Message.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'msg1' }),
      });

      const validation = await validateParaphrasMetricsSetup();

      expect(validation.isConfigured).toBe(true);
      expect(validation.hasSampleConversation).toBe(true);
      expect(validation.hasSampleMessage).toBe(true);
    });

    test('debe detectar setup incompleto', async () => {
      Conversation.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      Message.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const validation = await validateParaphrasMetricsSetup();

      expect(validation.isConfigured).toBe(false);
      expect(validation.hasSampleConversation).toBe(false);
      expect(validation.hasSampleMessage).toBe(false);
    });

    test('debe manejar error de DB', async () => {
      Conversation.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const validation = await validateParaphrasMetricsSetup();

      expect(validation.isConfigured).toBe(false);
      expect(validation.error).toBeDefined();
    });
  });

  describe('METRICS_CONFIG', () => {
    test('debe exportar configuración válida', () => {
      expect(METRICS_CONFIG.MAX_LOOKBACK_DAYS).toBe(90);
      expect(METRICS_CONFIG.MIN_CONVERSATIONS_FOR_STATS).toBe(10);
    });
  });
});
