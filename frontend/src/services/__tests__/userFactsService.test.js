/**
 * Tests unitarios para userFactsService (#63 grounding)
 * 
 * @author AntoApp Team
 */

import {
  fetchUserFacts,
  createUserFact,
  updateUserFact,
  deleteUserFact,
} from '../userFactsService';
import { api } from '../../config/api';

// Mock del módulo api
jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  ENDPOINTS: {
    USER_FACTS: '/api/user-facts',
    USER_FACT_BY_ID: (id) => `/api/user-facts/${id}`,
  },
}));

describe('userFactsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserFacts', () => {
    it('debe obtener hechos del usuario exitosamente', async () => {
      const mockFacts = {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            fact: 'Trabajo como ingeniero',
            category: 'work',
            source: 'user',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      api.get.mockResolvedValueOnce({ data: mockFacts });

      const result = await fetchUserFacts();

      expect(api.get).toHaveBeenCalledWith(
        '/api/user-facts',
        expect.objectContaining({ limit: '100' })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        _id: '507f1f77bcf86cd799439011',
        fact: 'Trabajo como ingeniero',
        category: 'work',
        source: 'user',
        isActive: true,
      });
    });

    it('debe aplicar filtros correctamente', async () => {
      api.get.mockResolvedValueOnce({ data: { data: [] } });

      await fetchUserFacts({
        category: 'work',
        includeInactive: true,
        limit: 50,
      });

      expect(api.get).toHaveBeenCalledWith('/api/user-facts', {
        category: 'work',
        includeInactive: 'true',
        limit: '50',
      });
    });

    it('debe validar categoría inválida', async () => {
      await expect(
        fetchUserFacts({ category: 'invalid_category' })
      ).rejects.toThrow('Invalid category');
    });

    it('debe validar límite mínimo', async () => {
      await expect(
        fetchUserFacts({ limit: 0 })
      ).rejects.toThrow('Limit must be at least 1');
    });

    it('debe aplicar límite máximo (500)', async () => {
      api.get.mockResolvedValueOnce({ data: { data: [] } });

      await fetchUserFacts({ limit: 1000 });

      expect(api.get).toHaveBeenCalledWith(
        '/api/user-facts',
        expect.objectContaining({ limit: '500' })
      );
    });

    it('debe filtrar hechos inválidos de la respuesta', async () => {
      const mockFacts = {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            fact: 'Trabajo como ingeniero',
            category: 'work',
            isActive: true,
          },
          {
            // Sin _id, debe ser filtrado
            fact: 'Hecho inválido',
            category: 'other',
          },
          {
            _id: '507f1f77bcf86cd799439012',
            // Sin fact, debe ser filtrado
            category: 'family',
          },
        ],
      };

      api.get.mockResolvedValueOnce({ data: mockFacts });

      const result = await fetchUserFacts();

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('507f1f77bcf86cd799439011');
    });

    it('debe sanitizar caracteres problemáticos en hechos', async () => {
      const mockFacts = {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            fact: 'Trabajo como <script>alert("xss")</script> ingeniero',
            category: 'work',
            isActive: true,
          },
        ],
      };

      api.get.mockResolvedValueOnce({ data: mockFacts });

      const result = await fetchUserFacts();

      expect(result[0].fact).not.toContain('<script>');
      expect(result[0].fact).not.toContain('<');
      expect(result[0].fact).not.toContain('>');
    });

    it('debe manejar respuesta vacía', async () => {
      api.get.mockResolvedValueOnce({ data: { data: [] } });

      const result = await fetchUserFacts();

      expect(result).toEqual([]);
    });

    it('debe manejar error de red', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchUserFacts()).rejects.toThrow(
        'Failed to fetch user facts'
      );
    });
  });

  describe('createUserFact', () => {
    it('debe crear un hecho exitosamente', async () => {
      const mockCreated = {
        data: {
          _id: '507f1f77bcf86cd799439011',
          fact: 'Trabajo como ingeniero',
          category: 'work',
          source: 'user',
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      };

      api.post.mockResolvedValueOnce({ data: mockCreated });

      const result = await createUserFact({
        fact: 'Trabajo como ingeniero',
        category: 'work',
      });

      expect(api.post).toHaveBeenCalledWith('/api/user-facts', {
        fact: 'Trabajo como ingeniero',
        category: 'work',
      });
      expect(result.fact).toBe('Trabajo como ingeniero');
      expect(result.category).toBe('work');
    });

    it('debe validar fact vacío', async () => {
      await expect(createUserFact({ fact: '' })).rejects.toThrow(
        'Fact must be at least 5 characters long'
      );
    });

    it('debe validar fact muy corto', async () => {
      await expect(createUserFact({ fact: 'abc' })).rejects.toThrow(
        'Fact must be at least 5 characters long'
      );
    });

    it('debe validar fact muy largo', async () => {
      const longFact = 'a'.repeat(200);
      await expect(createUserFact({ fact: longFact })).rejects.toThrow(
        'Fact cannot exceed 150 characters'
      );
    });

    it('debe sanitizar saltos de línea', async () => {
      const mockCreated = {
        data: {
          _id: '507f1f77bcf86cd799439011',
          fact: 'Trabajo como ingeniero senior',
          category: 'work',
          isActive: true,
        },
      };

      api.post.mockResolvedValueOnce({ data: mockCreated });

      await createUserFact({
        fact: 'Trabajo como\ningeniero\nsenior',
        category: 'work',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/api/user-facts',
        expect.objectContaining({
          fact: 'Trabajo como ingeniero senior',
        })
      );
    });

    it('debe sanitizar tabs y múltiples espacios', async () => {
      const mockCreated = {
        data: {
          _id: '507f1f77bcf86cd799439011',
          fact: 'Trabajo como ingeniero',
          category: 'work',
          isActive: true,
        },
      };

      api.post.mockResolvedValueOnce({ data: mockCreated });

      await createUserFact({
        fact: 'Trabajo\tcomo   ingeniero',
        category: 'work',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/api/user-facts',
        expect.objectContaining({
          fact: 'Trabajo como ingeniero',
        })
      );
    });

    it('debe sanitizar caracteres problemáticos', async () => {
      const mockCreated = {
        data: {
          _id: '507f1f77bcf86cd799439011',
          fact: 'Trabajo alertxss',
          category: 'other',
          isActive: true,
        },
      };

      api.post.mockResolvedValueOnce({ data: mockCreated });

      await createUserFact({
        fact: 'Trabajo <script>alert("xss")</script>',
      });

      // Debe remover <, >, {, }
      const postedData = api.post.mock.calls[0][1];
      expect(postedData.fact).not.toContain('<');
      expect(postedData.fact).not.toContain('>');
      expect(postedData.fact).toBe('Trabajo scriptalert("xss")/script');
    });

    it('debe validar categoría inválida', async () => {
      await expect(
        createUserFact({
          fact: 'Trabajo como ingeniero',
          category: 'invalid',
        })
      ).rejects.toThrow('Invalid category');
    });

    it('debe validar source inválido', async () => {
      await expect(
        createUserFact({
          fact: 'Trabajo como ingeniero',
          source: 'invalid',
        })
      ).rejects.toThrow('Invalid source');
    });

    it('debe validar conversationId inválido', async () => {
      await expect(
        createUserFact({
          fact: 'Trabajo como ingeniero',
          conversationId: 'not-a-valid-objectid',
        })
      ).rejects.toThrow('Invalid conversationId format');
    });

    it('debe aceptar conversationId válido', async () => {
      const mockCreated = {
        data: {
          _id: '507f1f77bcf86cd799439011',
          fact: 'Trabajo como ingeniero',
          category: 'work',
          conversationId: '507f1f77bcf86cd799439012',
          isActive: true,
        },
      };

      api.post.mockResolvedValueOnce({ data: mockCreated });

      await createUserFact({
        fact: 'Trabajo como ingeniero',
        conversationId: '507f1f77bcf86cd799439012',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/api/user-facts',
        expect.objectContaining({
          conversationId: '507f1f77bcf86cd799439012',
        })
      );
    });

    it('debe manejar error de red', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        createUserFact({ fact: 'Trabajo como ingeniero' })
      ).rejects.toThrow('Failed to create user fact');
    });
  });

  describe('updateUserFact', () => {
    const validId = '507f1f77bcf86cd799439011';

    it('debe actualizar un hecho exitosamente', async () => {
      const mockUpdated = {
        data: {
          _id: validId,
          fact: 'Trabajo como ingeniero senior',
          category: 'work',
          isActive: true,
        },
      };

      api.put.mockResolvedValueOnce({ data: mockUpdated });

      const result = await updateUserFact(validId, {
        fact: 'Trabajo como ingeniero senior',
      });

      expect(api.put).toHaveBeenCalledWith(
        `/api/user-facts/${validId}`,
        expect.objectContaining({
          fact: 'Trabajo como ingeniero senior',
        })
      );
      expect(result.fact).toBe('Trabajo como ingeniero senior');
    });

    it('debe validar ID vacío', async () => {
      await expect(updateUserFact('', { fact: 'Test' })).rejects.toThrow(
        'Invalid fact ID'
      );
    });

    it('debe validar formato de ID inválido', async () => {
      await expect(
        updateUserFact('not-a-valid-id', { fact: 'Test fact' })
      ).rejects.toThrow('Invalid fact ID format');
    });

    it('debe validar que haya al menos un campo para actualizar', async () => {
      await expect(updateUserFact(validId, {})).rejects.toThrow(
        'at least one field'
      );
    });

    it('debe validar fact muy corto en actualización', async () => {
      await expect(
        updateUserFact(validId, { fact: 'abc' })
      ).rejects.toThrow('Fact must be at least 5 characters long');
    });

    it('debe validar fact muy largo en actualización', async () => {
      const longFact = 'a'.repeat(200);
      await expect(
        updateUserFact(validId, { fact: longFact })
      ).rejects.toThrow('Fact cannot exceed 150 characters');
    });

    it('debe validar categoría inválida en actualización', async () => {
      await expect(
        updateUserFact(validId, { category: 'invalid' })
      ).rejects.toThrow('Invalid category');
    });

    it('debe actualizar solo isActive', async () => {
      const mockUpdated = {
        data: {
          _id: validId,
          fact: 'Trabajo como ingeniero',
          category: 'work',
          isActive: false,
        },
      };

      api.put.mockResolvedValueOnce({ data: mockUpdated });

      const result = await updateUserFact(validId, { isActive: false });

      expect(api.put).toHaveBeenCalledWith(
        `/api/user-facts/${validId}`,
        expect.objectContaining({ isActive: false })
      );
      expect(result.isActive).toBe(false);
    });

    it('debe sanitizar saltos de línea en actualización', async () => {
      const mockUpdated = {
        data: {
          _id: validId,
          fact: 'Trabajo como ingeniero senior',
          category: 'work',
          isActive: true,
        },
      };

      api.put.mockResolvedValueOnce({ data: mockUpdated });

      await updateUserFact(validId, {
        fact: 'Trabajo como\ningeniero\nsenior',
      });

      expect(api.put).toHaveBeenCalledWith(
        `/api/user-facts/${validId}`,
        expect.objectContaining({
          fact: 'Trabajo como ingeniero senior',
        })
      );
    });

    it('debe manejar error de red', async () => {
      api.put.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        updateUserFact(validId, { fact: 'Trabajo como ingeniero' })
      ).rejects.toThrow('Failed to update user fact');
    });
  });

  describe('deleteUserFact', () => {
    const validId = '507f1f77bcf86cd799439011';

    it('debe eliminar con soft delete por defecto', async () => {
      api.delete.mockResolvedValueOnce({
        data: { message: 'Fact deactivated' },
      });

      await deleteUserFact(validId);

      expect(api.delete).toHaveBeenCalledWith(`/api/user-facts/${validId}`, {});
    });

    it('debe eliminar con hard delete cuando se solicita', async () => {
      api.delete.mockResolvedValueOnce({
        data: { message: 'Fact deleted' },
      });

      await deleteUserFact(validId, true);

      expect(api.delete).toHaveBeenCalledWith(
        `/api/user-facts/${validId}`,
        { hard: 'true' }
      );
    });

    it('debe validar ID vacío', async () => {
      await expect(deleteUserFact('')).rejects.toThrow('Invalid fact ID');
    });

    it('debe validar formato de ID inválido', async () => {
      await expect(deleteUserFact('not-a-valid-id')).rejects.toThrow(
        'Invalid fact ID format'
      );
    });

    it('debe manejar error de red', async () => {
      api.delete.mockRejectedValueOnce(new Error('Network error'));

      await expect(deleteUserFact(validId)).rejects.toThrow(
        'Failed to delete user fact'
      );
    });
  });
});
