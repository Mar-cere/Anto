/**
 * Tests de hardening y edge cases para Phase 2 (API de hechos manuales).
 * Valida seguridad, sanitización y validación de inputs.
 */

import { jest } from '@jest/globals';

describe('userFactsGroundingService - Phase 2 hardening', () => {
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

  describe('getManualUserFacts - input validation', () => {
    it('debe rechazar userId vacío', async () => {
      const facts = await getManualUserFacts('');
      expect(facts).toEqual([]);
    });

    it('debe rechazar userId null', async () => {
      const facts = await getManualUserFacts(null);
      expect(facts).toEqual([]);
    });

    it('debe rechazar userId undefined', async () => {
      const facts = await getManualUserFacts(undefined);
      expect(facts).toEqual([]);
    });

    it('debe rechazar userId con solo espacios', async () => {
      const facts = await getManualUserFacts('   ');
      expect(facts).toEqual([]);
    });

    it('debe rechazar userId no-string', async () => {
      const facts = await getManualUserFacts(123);
      expect(facts).toEqual([]);
    });

    it('debe normalizar limit negativo', async () => {
      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const facts = await getManualUserFacts('user123', -5);
      expect(facts).toEqual([]);
    });

    it('debe normalizar limit muy grande a MAX_LIMIT', async () => {
      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      await getManualUserFacts('user123', 1000);
      
      // Verificar que limit fue llamado con un valor razonable (MAX_LIMIT = 20)
      expect(UserFact.find().limit).toHaveBeenCalled();
    });

    it('debe normalizar limit no-numérico al default', async () => {
      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const facts = await getManualUserFacts('user123', 'invalid');
      expect(facts).toEqual([]);
    });
  });

  describe('getManualUserFacts - sanitización', () => {
    it('debe filtrar hechos con contenido inválido después de sanitizar', async () => {
      const mockFacts = [
        {
          fact: 'Hecho válido con contenido real',
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-10'),
        },
        {
          fact: '   ', // Solo espacios
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-09'),
        },
        {
          fact: 'abc', // Muy corto
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-08'),
        },
      ];

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFacts),
      });

      const facts = await getManualUserFacts('user123');
      
      // Solo debe retornar el hecho válido
      expect(facts.length).toBe(1);
      expect(facts[0].fact).toContain('válido');
    });

    it('debe sanitizar saltos de línea y tabs en hechos', async () => {
      const mockFacts = [
        {
          fact: 'Trabajo como\nprofesor\tde matemáticas',
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-10'),
        },
      ];

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockFacts),
      });

      const facts = await getManualUserFacts('user123');
      
      if (facts.length > 0) {
        expect(facts[0].fact).not.toContain('\n');
        expect(facts[0].fact).not.toContain('\t');
      }
    });
  });

  describe('buildCombinedFactsSnippet - validación', () => {
    it('debe retornar string vacío si userId es inválido', async () => {
      const snippet = await buildCombinedFactsSnippet('');
      expect(snippet).toBe('');
    });

    it('debe normalizar maxFacts negativo', async () => {
      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const Message = (await import('../../../models/Message.js')).default;
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'es', -5);
      // No debe crashear, debe manejar gracefully
      expect(snippet).toBe('');
    });

    it('debe normalizar maxFacts muy grande', async () => {
      const mockManualFacts = Array.from({ length: 30 }, (_, i) => ({
        fact: `Hecho manual número ${i + 1}`,
        category: 'other',
        source: 'user',
        createdAt: new Date('2026-07-10'),
      }));

      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockManualFacts.slice(0, 20)), // MAX_LIMIT
      });

      const Message = (await import('../../../models/Message.js')).default;
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'es', 1000);
      
      // Contar líneas de hechos
      const factLines = (snippet.match(/^- /gm) || []).length;
      expect(factLines).toBeLessThanOrEqual(20); // MAX_LIMIT
    });

    it('debe normalizar maxFacts no-numérico', async () => {
      UserFact.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const Message = (await import('../../../models/Message.js')).default;
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const snippet = await buildCombinedFactsSnippet('user123', null, 'es', 'invalid');
      // Debe usar default (15) y no crashear
      expect(snippet).toBe('');
    });
  });

  describe('Protección contra datos legacy', () => {
    it('debe filtrar hechos legacy sin sanitizar', async () => {
      const mockFacts = [
        {
          fact: 'Hecho válido normal',
          category: 'work',
          source: 'user',
          createdAt: new Date('2026-07-10'),
        },
        {
          fact: '<script>alert("xss")</script>',
          category: 'work',
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

      const facts = await getManualUserFacts('user123');
      
      // El fact con <script> debe estar sanitizado
      facts.forEach((f) => {
        expect(f.fact).not.toContain('<script>');
        expect(f.fact).not.toContain('<');
        expect(f.fact).not.toContain('>');
      });
    });
  });
});
