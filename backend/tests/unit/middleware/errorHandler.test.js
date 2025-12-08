/**
 * Tests unitarios para middleware de manejo de errores
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import { errorHandler } from '../../../middleware/errorHandler.js';
import { AppError } from '../../../utils/errors.js';

// Mock logger para evitar logs en tests
jest.mock('../../../utils/logger.js', () => ({
  requestError: jest.fn()
}));

describe('ErrorHandler Middleware', () => {
  describe('Manejo de errores', () => {
    it('debe ser una función', () => {
      expect(typeof errorHandler).toBe('function');
    });

    it('debe manejar AppError', () => {
      const req = {
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const error = new AppError('Test error', 400, true, 'TEST_ERROR');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    it('debe manejar errores sin statusCode', () => {
      const req = {
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const error = new Error('Internal error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
