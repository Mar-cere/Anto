/**
 * Tests unitarios para middleware de errorHandler
 * 
 * @author AntoApp Team
 */

import { errorHandler, notFoundHandler, asyncHandler } from '../../../middleware/errorHandler.js';
import { AppError } from '../../../utils/errors.js';

describe('Error Handler Middleware', () => {
  describe('errorHandler', () => {
    it('debe manejar AppError correctamente', () => {
      const error = new AppError('Test error', 400);
      const req = {
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: function() { return 'test-agent'; }, // Mock para req.get
      };
      let statusCode;
      let responseData;
      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function(data) {
          responseData = data;
          return this;
        },
      };
      const next = function() {};

      errorHandler(error, req, res, next);

      expect(statusCode).toBe(400);
      expect(responseData).toBeDefined();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
      expect(responseData.error.message).toBe('Test error');
    });

    it('debe convertir errores de Mongoose a AppError', () => {
      const mongooseError = {
        name: 'ValidationError',
        errors: {
          email: { path: 'email', message: 'Email inválido' },
        },
      };

      const req = {
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: function() { return 'test-agent'; },
      };
      let statusCode;
      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function() {
          return this;
        },
      };
      const next = function() {};

      errorHandler(mongooseError, req, res, next);

      expect(statusCode).toBe(400);
    });

    it('debe manejar errores de JWT', () => {
      const jwtError = {
        name: 'JsonWebTokenError',
        message: 'Invalid token',
      };

      const req = {
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: function() { return 'test-agent'; },
      };
      let statusCode;
      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function() {
          return this;
        },
      };
      const next = function() {};

      errorHandler(jwtError, req, res, next);

      expect(statusCode).toBe(401);
    });

    it('debe manejar errores desconocidos', () => {
      const error = new Error('Unknown error');
      const req = {
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: function() { return 'test-agent'; },
      };
      let statusCode;
      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function() {
          return this;
        },
      };
      const next = function() {};

      errorHandler(error, req, res, next);

      expect(statusCode).toBe(500);
    });
  });

  describe('notFoundHandler', () => {
    it('debe crear un error 404', () => {
      const req = {
        method: 'GET',
        path: '/api/nonexistent',
        originalUrl: '/api/nonexistent',
      };
      const res = {};
      let nextCalled = false;
      let errorPassed;
      const next = function(err) {
        nextCalled = true;
        errorPassed = err;
      };

      notFoundHandler(req, res, next);

      expect(nextCalled).toBe(true);
      expect(errorPassed).toBeInstanceOf(AppError);
      expect(errorPassed.statusCode).toBe(404);
      expect(errorPassed.message).toContain('Ruta no encontrada');
    });
  });

  describe('asyncHandler', () => {
    it('debe ejecutar función async correctamente', async () => {
      const asyncFn = async (req, res, next) => {
        res.json({ success: true });
      };

      const req = {};
      let jsonCalled = false;
      let jsonData;
      const res = {
        json: function(data) {
          jsonCalled = true;
          jsonData = data;
        },
      };
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      const handler = asyncHandler(asyncFn);
      await handler(req, res, next);

      expect(jsonCalled).toBe(true);
      expect(jsonData).toEqual({ success: true });
      expect(nextCalled).toBe(false);
    });

    it('debe capturar errores y pasarlos a next', async () => {
      const asyncFn = async (req, res, next) => {
        throw new Error('Test error');
      };

      const req = {};
      const res = {};
      let nextCalled = false;
      let errorPassed;
      const next = function(err) {
        nextCalled = true;
        errorPassed = err;
      };

      const handler = asyncHandler(asyncFn);
      await handler(req, res, next);

      expect(nextCalled).toBe(true);
      expect(errorPassed).toBeInstanceOf(Error);
      expect(errorPassed.message).toBe('Test error');
    });
  });
});
