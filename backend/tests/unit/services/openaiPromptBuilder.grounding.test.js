/**
 * Tests de integración de grounding policy en openaiPromptBuilder.
 * Valida que la política y los hechos conocidos se inyecten correctamente en el prompt.
 */

import { jest } from '@jest/globals';

describe('openaiPromptBuilder - grounding integration', () => {
  let buildContextualizedPrompt;
  let Message;

  beforeAll(async () => {
    Message = (await import('../../../models/Message.js')).default;
    const builder = await import('../../../services/openai/openaiPromptBuilder.js');
    buildContextualizedPrompt = builder.buildContextualizedPrompt;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseMensaje = {
    content: 'Estoy muy estresado',
    userId: 'user123',
    conversationId: 'conv123',
  };

  const baseContexto = {
    emotional: { mainEmotion: 'ansiedad', intensity: 7 },
    contextual: {},
    profile: { preferences: { language: 'es' } },
    userId: 'user123',
    conversationId: 'conv123',
  };

  describe('grounding policy injection', () => {
    it('debe incluir política de grounding en español', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const prompt = await buildContextualizedPrompt(baseMensaje, baseContexto);

      expect(prompt.systemMessage).toContain('POLÍTICA DE GROUNDING');
      expect(prompt.systemMessage).toContain('NUNCA inventes');
      expect(prompt.systemMessage).toContain('hechos biográficos');
    });

    it('debe incluir política de grounding en inglés', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const contextoEN = {
        ...baseContexto,
        profile: { preferences: { language: 'en' } },
      };

      const prompt = await buildContextualizedPrompt(baseMensaje, contextoEN);

      expect(prompt.systemMessage).toContain('GROUNDING POLICY');
      expect(prompt.systemMessage).toContain('NEVER invent');
      expect(prompt.systemMessage).toContain('biographical facts');
    });

    it('debe incluir ejemplos de violaciones en la política', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const prompt = await buildContextualizedPrompt(baseMensaje, baseContexto);

      expect(prompt.systemMessage).toContain('EJEMPLOS DE VIOLACIONES');
      expect(prompt.systemMessage).toContain('ENFOQUE CORRECTO');
    });
  });

  describe('known facts injection', () => {
    it('debe inyectar hechos conocidos cuando existen', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como diseñador gráfico',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
      ];

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const prompt = await buildContextualizedPrompt(baseMensaje, baseContexto);

      expect(prompt.systemMessage).toContain('HECHOS CONOCIDOS');
      expect(prompt.systemMessage).toContain('diseñador gráfico');
    });

    it('no debe inyectar sección de hechos si no hay hechos extraídos', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const prompt = await buildContextualizedPrompt(baseMensaje, baseContexto);

      expect(prompt.systemMessage).not.toContain('HECHOS CONOCIDOS');
    });

    it('no debe inyectar hechos para usuarios invitados', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como diseñador',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
      ];

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const contextoGuest = {
        ...baseContexto,
        isGuest: true,
      };

      const prompt = await buildContextualizedPrompt(baseMensaje, contextoGuest);

      expect(prompt.systemMessage).not.toContain('HECHOS CONOCIDOS');
    });

    it('debe manejar errores de extracción de hechos sin fallar', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const prompt = await buildContextualizedPrompt(baseMensaje, baseContexto);

      expect(prompt.systemMessage).toContain('POLÍTICA DE GROUNDING');
      expect(prompt).toHaveProperty('systemMessage');
    });
  });

  describe('integration order', () => {
    it('debe incluir política antes que hechos conocidos', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como profesor',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
      ];

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const prompt = await buildContextualizedPrompt(baseMensaje, baseContexto);

      const policyIndex = prompt.systemMessage.indexOf('POLÍTICA DE GROUNDING');
      const factsIndex = prompt.systemMessage.indexOf('HECHOS CONOCIDOS');

      expect(policyIndex).toBeGreaterThan(-1);
      expect(factsIndex).toBeGreaterThan(-1);
      expect(policyIndex).toBeLessThan(factsIndex);
    });

    it('debe incluir política después de identidad clínica', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const prompt = await buildContextualizedPrompt(baseMensaje, baseContexto);

      const identityIndex = prompt.systemMessage.indexOf('IDENTIDAD Y PRIORIDAD CLÍNICA');
      const policyIndex = prompt.systemMessage.indexOf('POLÍTICA DE GROUNDING');

      expect(identityIndex).toBeGreaterThan(-1);
      expect(policyIndex).toBeGreaterThan(-1);
      expect(identityIndex).toBeLessThan(policyIndex);
    });
  });

  describe('bilingual support', () => {
    it('debe inyectar política y hechos en inglés cuando language=en', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'I work as a teacher',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
      ];

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const contextoEN = {
        ...baseContexto,
        profile: { preferences: { language: 'en' } },
      };

      const prompt = await buildContextualizedPrompt(baseMensaje, contextoEN);

      expect(prompt.systemMessage).toContain('GROUNDING POLICY');
      expect(prompt.systemMessage).toContain('KNOWN FACTS');
      expect(prompt.systemMessage).toContain('teacher');
    });
  });
});
