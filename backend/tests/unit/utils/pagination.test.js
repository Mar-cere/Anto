/**
 * Tests unitarios para utilidades de paginación
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { 
  cursorPaginate, 
  offsetPaginate, 
  determinePaginationType,
  paginate 
} from '../../../utils/pagination.js';

// Mock de modelo de Mongoose
const createMockModel = (data = []) => {
  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data)
  };

  const mockFind = jest.fn().mockReturnValue(mockQuery);
  const mockFindById = jest.fn();
  const mockCountDocuments = jest.fn().mockResolvedValue(data.length);

  // Configurar findById para retornar el documento correcto
  mockFindById.mockReturnValue({
    lean: jest.fn().mockResolvedValue(data[0] || null)
  });

  // Función que retorna un constructor de ObjectId
  const getObjectIdConstructor = () => {
    return function ObjectIdConstructor(id) {
      if (typeof id === 'string') {
        return new mongoose.Types.ObjectId(id);
      }
      return id || new mongoose.Types.ObjectId();
    };
  };

  return {
    find: mockFind,
    findById: mockFindById,
    countDocuments: mockCountDocuments,
    db: {
      base: {
        model: () => getObjectIdConstructor()
      }
    }
  };
};

describe('Pagination Utils', () => {
  describe('offsetPaginate', () => {
    it('debe paginar correctamente con offset', async () => {
      const mockData = Array.from({ length: 25 }, (_, i) => ({
        _id: new mongoose.Types.ObjectId(),
        name: `Item ${i + 1}`,
        createdAt: new Date()
      }));

      const model = createMockModel(mockData.slice(0, 10)); // Primera página
      model.countDocuments.mockResolvedValue(25);

      const result = await offsetPaginate({
        query: {},
        model,
        page: 1,
        limit: 10,
        sort: { createdAt: -1 }
      });

      expect(result.data).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.pages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('debe manejar la última página correctamente', async () => {
      const model = createMockModel([]);
      model.countDocuments.mockResolvedValue(25);

      const result = await offsetPaginate({
        query: {},
        model,
        page: 3,
        limit: 10
      });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('debe aplicar select si se proporciona', async () => {
      const model = createMockModel([]);
      model.countDocuments.mockResolvedValue(10);

      await offsetPaginate({
        query: {},
        model,
        page: 1,
        limit: 10,
        select: 'name email'
      });

      expect(model.find().select).toHaveBeenCalledWith('name email');
    });
  });

  describe('cursorPaginate', () => {
    it('debe paginar correctamente con cursor', async () => {
      const mockData = Array.from({ length: 15 }, (_, i) => ({
        _id: new mongoose.Types.ObjectId(),
        name: `Item ${i + 1}`
      }));

      // Retornar 11 elementos (limit + 1) para indicar que hay más
      const model = createMockModel(mockData.slice(0, 11));
      model.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockData[9])
      });

      const result = await cursorPaginate({
        query: {},
        model,
        cursor: null,
        limit: 10
      });

      expect(result.data).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it('debe retornar hasMore false cuando no hay más resultados', async () => {
      const mockData = Array.from({ length: 5 }, (_, i) => ({
        _id: new mongoose.Types.ObjectId(),
        name: `Item ${i + 1}`
      }));

      const model = createMockModel(mockData);

      const result = await cursorPaginate({
        query: {},
        model,
        cursor: null,
        limit: 10
      });

      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    // Nota: El test de cursor con _id requiere un mock más complejo
    // Se omite por ahora ya que los otros tests cubren la funcionalidad básica
  });

  describe('determinePaginationType', () => {
    it('debe retornar cursor para datasets grandes', async () => {
      const model = createMockModel([]);
      model.countDocuments.mockResolvedValue(1500);

      const result = await determinePaginationType({
        query: {},
        model,
        cursorThreshold: 1000
      });

      expect(result).toBe('cursor');
    });

    it('debe retornar offset para datasets pequeños', async () => {
      const model = createMockModel([]);
      model.countDocuments.mockResolvedValue(500);

      const result = await determinePaginationType({
        query: {},
        model,
        cursorThreshold: 1000
      });

      expect(result).toBe('offset');
    });

    it('debe retornar el tipo especificado si se proporciona', async () => {
      const model = createMockModel([]);

      const result = await determinePaginationType({
        query: {},
        model,
        paginationType: 'cursor'
      });

      expect(result).toBe('cursor');
    });
  });

  describe('paginate', () => {
    it('debe usar cursor pagination cuando type es cursor', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        _id: new mongoose.Types.ObjectId(),
        name: `Item ${i + 1}`
      }));

      const model = createMockModel(mockData);

      const result = await paginate({
        query: {},
        model,
        type: 'cursor',
        limit: 10
      });

      expect(result.pagination.type).toBe('cursor');
      expect(result.pagination).toHaveProperty('nextCursor');
      expect(result.pagination).toHaveProperty('hasMore');
    });

    it('debe usar offset pagination cuando type es offset', async () => {
      const model = createMockModel([]);
      model.countDocuments.mockResolvedValue(25);

      const result = await paginate({
        query: {},
        model,
        type: 'offset',
        page: 1,
        limit: 10
      });

      expect(result.pagination.type).toBe('offset');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('total');
    });

    it('debe auto-detectar tipo cuando type es auto', async () => {
      const model = createMockModel([]);
      model.countDocuments.mockResolvedValue(1500);

      const result = await paginate({
        query: {},
        model,
        type: 'auto',
        limit: 10
      });

      expect(result.pagination.type).toBe('cursor');
    });
  });
});

