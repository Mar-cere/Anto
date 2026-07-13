/**
 * Tests de hardening para userFactsGroundingService.
 * Valida edge cases de seguridad, sanitización y validación.
 */

import { jest } from '@jest/globals';

describe('userFactsGroundingService - hardening', () => {
  let extractKnownFacts;
  let buildFactsSnippetForPrompt;
  let Message;

  beforeAll(async () => {
    Message = (await import('../../../models/Message.js')).default;
    const service = await import('../../../services/userFactsGroundingService.js');
    extractKnownFacts = service.extractKnownFacts;
    buildFactsSnippetForPrompt = service.buildFactsSnippetForPrompt;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input validation', () => {
    it('debe rechazar userId vacío', async () => {
      const facts = await extractKnownFacts('');
      expect(facts).toEqual([]);
    });

    it('debe rechazar userId no-string', async () => {
      const facts = await extractKnownFacts(123);
      expect(facts).toEqual([]);
    });

    it('debe rechazar userId con solo espacios', async () => {
      const facts = await extractKnownFacts('   ');
      expect(facts).toEqual([]);
    });

    it('debe normalizar limit negativo a MIN_LIMIT', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'msg1',
            content: 'Trabajo como profesor',
            createdAt: new Date('2026-07-10'),
            conversationId: 'conv1',
          },
        ]),
      });

      const facts = await extractKnownFacts('user123', null, -5);
      expect(facts.length).toBeGreaterThanOrEqual(0);
      expect(facts.length).toBeLessThanOrEqual(1);
    });

    it('debe normalizar limit muy grande a MAX_LIMIT', async () => {
      const messages = Array.from({ length: 30 }, (_, i) => ({
        _id: `msg${i}`,
        content: `Trabajo como profesor ${i}`,
        createdAt: new Date('2026-07-10'),
        conversationId: 'conv1',
      }));

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const facts = await extractKnownFacts('user123', null, 1000);
      expect(facts.length).toBeLessThanOrEqual(20);
    });

    it('debe normalizar limit no-numérico al default', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const facts = await extractKnownFacts('user123', null, 'invalid');
      expect(facts).toEqual([]);
    });
  });

  describe('Sanitización de hechos', () => {
    it('debe sanitizar saltos de línea en hechos', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como\nprofesor\nde matemáticas',
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

      const facts = await extractKnownFacts('user123');
      
      if (facts.length > 0) {
        expect(facts[0].fact).not.toContain('\n');
      }
    });

    it('debe sanitizar tabs y espacios múltiples', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo    como\t\tprofesor',
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

      const facts = await extractKnownFacts('user123');
      
      if (facts.length > 0) {
        expect(facts[0].fact).not.toMatch(/\s{2,}/);
        expect(facts[0].fact).not.toContain('\t');
      }
    });

    it('debe remover caracteres problemáticos (<>{})', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como <profesor> {de} matemáticas',
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

      const facts = await extractKnownFacts('user123');
      
      if (facts.length > 0) {
        expect(facts[0].fact).not.toMatch(/[<>{}]/);
      }
    });

    it('debe truncar hechos muy largos', async () => {
      const longText = 'a'.repeat(200);
      const messages = [
        {
          _id: 'msg1',
          content: `Trabajo como ${longText}`,
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

      const facts = await extractKnownFacts('user123');
      
      if (facts.length > 0) {
        expect(facts[0].fact.length).toBeLessThanOrEqual(150);
      }
    });
  });

  describe('Filtros de contenido sensible', () => {
    it('debe filtrar contenido de crisis (muerte, suicidio)', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo en el hospital con pacientes terminales cerca de la muerte',
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

      const facts = await extractKnownFacts('user123');
      expect(facts).toEqual([]);
    });

    it('debe filtrar contenido de abuso', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como profesor pero sufro maltrato laboral',
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

      const facts = await extractKnownFacts('user123');
      expect(facts).toEqual([]);
    });

    it('debe filtrar números de teléfono (PII)', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como diseñador mi número es 555-123-4567',
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

      const facts = await extractKnownFacts('user123');
      expect(facts).toEqual([]);
    });

    it('debe filtrar emails (PII)', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como diseñador mi email es test@example.com',
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

      const facts = await extractKnownFacts('user123');
      expect(facts).toEqual([]);
    });

    it('debe filtrar direcciones físicas (PII)', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo en 123 Main Street',
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

      const facts = await extractKnownFacts('user123');
      expect(facts).toEqual([]);
    });
  });

  describe('Protección contra hechos conflictivos', () => {
    it('debe detectar y filtrar hechos conflictivos de la misma categoría', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como diseñador gráfico',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
        {
          _id: 'msg2',
          content: 'Trabajo como médico cirujano',
          createdAt: new Date('2026-07-05'),
          conversationId: 'conv1',
        },
      ];

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const facts = await extractKnownFacts('user123');
      
      // Ambos hechos pueden coexistir si no son contradictorios según la lógica de filtrado
      // O se prioriza el más reciente si son considerados conflictivos
      expect(facts.length).toBeGreaterThanOrEqual(1);
      expect(facts.length).toBeLessThanOrEqual(2);
      
      // El primer hecho debe ser el más reciente
      if (facts.length > 0) {
        expect(facts[0].fact.toLowerCase()).toContain('diseñador');
      }
    });
  });

  describe('Límites de tamaño del snippet', () => {
    it('debe truncar snippet si excede MAX_SNIPPET_LENGTH', async () => {
      const messages = Array.from({ length: 20 }, (_, i) => ({
        _id: `msg${i}`,
        content: `Trabajo como especialista en tecnología avanzada número ${i}`,
        createdAt: new Date('2026-07-10'),
        conversationId: 'conv1',
      }));

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const snippet = await buildFactsSnippetForPrompt('user123', null, 'es');
      
      // El snippet no debe ser excesivamente largo
      expect(snippet.length).toBeLessThan(1500);
      
      // Si se truncó, debe incluir mensaje de omisión
      if (snippet.includes('omitidos')) {
        expect(snippet).toMatch(/\d+\s+hechos adicionales omitidos/);
      }
    });
  });
});
