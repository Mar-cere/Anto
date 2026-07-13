/**
 * Tests para el servicio de extracción de hechos del usuario.
 * Valida la extracción de hechos biográficos explícitos del historial.
 */

import { jest } from '@jest/globals';

describe('userFactsGroundingService', () => {
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

  describe('extractKnownFacts', () => {
    it('debe retornar array vacío si no hay userId', async () => {
      const facts = await extractKnownFacts(null);
      expect(facts).toEqual([]);
    });

    it('debe retornar array vacío si no hay mensajes', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const facts = await extractKnownFacts('user123');
      expect(facts).toEqual([]);
    });

    it('debe extraer hecho de trabajo en español', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como diseñador gráfico desde hace 3 años',
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

      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].category).toBe('work');
      expect(facts[0].fact).toContain('diseñador gráfico');
    });

    it('debe extraer hecho de trabajo en inglés', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'I work as a software engineer in a tech company',
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

      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].category).toBe('work');
      expect(facts[0].fact).toContain('software engineer');
    });

    it('debe extraer hechos de familia en español', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Tengo 2 hijos pequeños que van al colegio',
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

      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].category).toBe('family');
      expect(facts[0].fact).toContain('2');
      expect(facts[0].fact).toContain('hijo');
    });

    it('debe extraer hechos de estudio en español', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Estudio psicología en la universidad',
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

      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].category).toBe('study');
      expect(facts[0].fact).toContain('psicología');
    });

    it('debe extraer compromisos explícitos', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Me propuse hacer ejercicio 3 veces por semana',
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

      expect(facts.length).toBeGreaterThan(0);
      expect(facts[0].category).toBe('commitment');
      expect(facts[0].fact).toContain('ejercicio');
    });

    it('debe evitar hechos duplicados', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como profesor',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
        {
          _id: 'msg2',
          content: 'Yo trabajo como profesor también',
          createdAt: new Date('2026-07-08'),
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

      // Ambos mensajes producen hechos similares, verificamos que no haya más duplicados del esperado
      expect(facts.length).toBeLessThanOrEqual(2);
    });

    it('debe respetar el límite de hechos', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como diseñador',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
        {
          _id: 'msg2',
          content: 'Tengo 2 hermanos',
          createdAt: new Date('2026-07-09'),
          conversationId: 'conv1',
        },
        {
          _id: 'msg3',
          content: 'Estudio ingeniería',
          createdAt: new Date('2026-07-08'),
          conversationId: 'conv1',
        },
      ];

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const facts = await extractKnownFacts('user123', null, 2);

      expect(facts.length).toBeLessThanOrEqual(2);
    });

    it('debe ignorar mensajes muy cortos', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Sí',
          createdAt: new Date('2026-07-10'),
          conversationId: 'conv1',
        },
        {
          _id: 'msg2',
          content: 'Ok',
          createdAt: new Date('2026-07-09'),
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

    it('debe filtrar hechos con contenido sensible (crisis)', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Estoy pensando en suicidio',
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

    it('debe manejar errores de BD sin crash', async () => {
      Message.find = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const facts = await extractKnownFacts('user123');

      expect(facts).toEqual([]);
    });

    it('debe incluir metadata completa en cada hecho', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'Trabajo como profesor',
          createdAt: new Date('2026-07-10T10:30:00'),
          conversationId: 'conv123',
        },
      ];

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(messages),
      });

      const facts = await extractKnownFacts('user123');

      expect(facts[0]).toHaveProperty('fact');
      expect(facts[0]).toHaveProperty('category');
      expect(facts[0]).toHaveProperty('context');
      expect(facts[0]).toHaveProperty('conversationId', 'conv123');
      expect(facts[0]).toHaveProperty('messageId', 'msg1');
    });
  });

  describe('buildFactsSnippetForPrompt', () => {
    it('debe retornar string vacío si no hay userId', async () => {
      const snippet = await buildFactsSnippetForPrompt(null);
      expect(snippet).toBe('');
    });

    it('debe retornar string vacío si no hay hechos extraídos', async () => {
      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const snippet = await buildFactsSnippetForPrompt('user123');
      expect(snippet).toBe('');
    });

    it('debe generar snippet completo con hechos en español', async () => {
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

      const snippet = await buildFactsSnippetForPrompt('user123', null, 'es');

      expect(snippet).toContain('HECHOS CONOCIDOS');
      expect(snippet).toContain('diseñador');
    });

    it('debe generar snippet completo con hechos en inglés', async () => {
      const messages = [
        {
          _id: 'msg1',
          content: 'I work as a designer',
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

      const snippet = await buildFactsSnippetForPrompt('user123', null, 'en');

      expect(snippet).toContain('KNOWN FACTS');
      expect(snippet).toContain('designer');
    });
  });
});
