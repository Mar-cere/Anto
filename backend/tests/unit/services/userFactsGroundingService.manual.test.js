/**
 * Tests unitarios para funciones de hechos manuales en userFactsGroundingService.
 */

import { jest } from '@jest/globals';

describe('userFactsGroundingService - manual facts', () => {
  let getManualUserFacts;
  let buildCombinedFactsSnippet;
  let UserFact;

  beforeAll(async () => {
    UserFact = (await import('../../../models/UserFact.js')).default;
    const service = await import('../../../services/userFactsGroundingService.js');
    getManualUserFacts = service.getManualUserFacts;
    buildCombinedFactsSnippet = service.buildCombinedFactsSnippet;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getManualUserFacts', () => {
    it('debe retornar array vacío si no hay userId', async () => {
      const facts = await getManualUserFacts(null);
      expect(facts).toEqual([]);
    });

    it('debe retornar array vacío si userId es inválido', async () => {
      const facts = await getManualUserFacts('');
      expect(facts).toEqual([]);
    });

    it('debe obtener hechos manuales activos', async () => {
      const mockFacts = [
        {
          fact: 'Trabajo como diseñador',
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-10'),
        },
        {
          fact: 'Vivo con mi familia',
          category: 'family',
          source: 'user',
          createdAt: new Date('2026-07-09'),
        },
      ];

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFacts),
      });

      const facts = await getManualUserFacts('user123', 10);

      expect(facts).toHaveLength(2);
      expect(facts[0].fact).toBe('Trabajo como diseñador');
      expect(facts[0].category).toBe('work');
      expect(facts[0].source).toBe('user');
      expect(facts[0].context).toBeTruthy();
    });

    it('debe manejar errores de BD sin crash', async () => {
      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const facts = await getManualUserFacts('user123');
      expect(facts).toEqual([]);
    });
  });

  describe('buildCombinedFactsSnippet', () => {
    it('debe retornar string vacío si no hay userId', async () => {
      const snippet = await buildCombinedFactsSnippet(null);
      expect(snippet).toBe('');
    });

    it('debe priorizar hechos manuales sobre extraídos', async () => {
      const mockManualFacts = [
        {
          fact: 'Trabajo como diseñador',
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-10'),
        },
      ];

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockManualFacts),
      });

      // Mock Message for extracted facts
      const Message = (await import('../../../models/Message.js')).default;
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'msg1',
            content: 'Estudio ingeniería',
            createdAt: new Date('2026-07-09'),
            conversationId: 'conv1',
          },
        ]),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'es', 15);

      expect(snippet).toContain('Trabajo como diseñador');
      expect(snippet).toContain('HECHOS CONOCIDOS');
    });

    it('debe evitar duplicados entre manuales y extraídos', async () => {
      const mockManualFacts = [
        {
          fact: 'Trabajo como diseñador',
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-10'),
        },
      ];

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockManualFacts),
      });

      // Mock Message with same fact
      const Message = (await import('../../../models/Message.js')).default;
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'msg1',
            content: 'Trabajo como diseñador',
            createdAt: new Date('2026-07-09'),
            conversationId: 'conv1',
          },
        ]),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'es', 15);

      // Contar cuántas veces aparece "Trabajo como diseñador"
      const matches = (snippet.match(/trabajo como diseñador/gi) || []).length;
      expect(matches).toBeLessThanOrEqual(1); // No debería estar duplicado
    });

    it('debe respetar maxFacts limit', async () => {
      const mockManualFacts = Array.from({ length: 20 }, (_, i) => ({
        fact: `Hecho manual ${i}`,
        category: 'other',
        source: 'user',
        createdAt: new Date('2026-07-10'),
      }));

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockManualFacts.slice(0, 5)),
      });

      const Message = (await import('../../../models/Message.js')).default;
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'es', 5);

      // Contar líneas de hechos (cada hecho es una línea que empieza con "- ")
      const factLines = (snippet.match(/^- /gm) || []).length;
      expect(factLines).toBeLessThanOrEqual(5);
    });

    it('debe generar snippet en inglés cuando se solicita', async () => {
      const mockManualFacts = [
        {
          fact: 'I work as a designer',
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-10'),
        },
      ];

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockManualFacts),
      });

      const Message = (await import('../../../models/Message.js')).default;
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'en', 15);

      expect(snippet).toContain('KNOWN FACTS');
      expect(snippet).toContain('mentioned');
    });

    it('debe manejar errores sin crash', async () => {
      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'es', 15);
      expect(snippet).toBe('');
    });
  });
});
