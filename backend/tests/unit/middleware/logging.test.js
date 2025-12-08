/**
 * Tests unitarios para middleware de logging
 * 
 * @author AntoApp Team
 */

import { structuredLogging, errorLogging } from '../../../middleware/logging.js';

describe('Logging Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
      url: '/api/test',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: () => 'test-agent',
      user: { _id: '507f1f77bcf86cd799439011' }
    };

    res = {
      statusCode: 200,
      status: function() { return this; },
      json: function() { return this; }
    };

    next = () => {};
  });

  describe('structuredLogging', () => {
    it('debe ser una función middleware', () => {
      expect(typeof structuredLogging).toBe('function');
    });

    it('debe llamar a next()', () => {
      let nextCalled = false;
      const testNext = () => { nextCalled = true; };
      
      structuredLogging(req, res, testNext);
      expect(nextCalled).toBe(true);
    });

    it('debe saltar logging para health checks', () => {
      req.path = '/health';
      let nextCalled = false;
      const testNext = () => { nextCalled = true; };
      
      structuredLogging(req, res, testNext);
      expect(nextCalled).toBe(true);
    });
  });

  describe('errorLogging', () => {
    it('debe ser una función middleware', () => {
      expect(typeof errorLogging).toBe('function');
    });

    it('debe llamar a next con el error', () => {
      const error = new Error('Test error');
      error.status = 500;
      
      let nextCalledWith = null;
      const testNext = (err) => { nextCalledWith = err; };
      
      errorLogging(error, req, res, testNext);
      
      expect(nextCalledWith).toBe(error);
    });

    it('debe incluir información del error en el log', () => {
      const originalError = console.error;
      let errorLogged = false;
      console.error = (...args) => {
        errorLogged = true;
        expect(args[0]).toBe('[Error]');
        expect(args[1]).toBeDefined();
      };

      const error = new Error('Test error');
      error.status = 404;
      
      let nextCalled = false;
      const testNext = () => { nextCalled = true; };
      
      errorLogging(error, req, res, testNext);
      
      expect(errorLogged).toBe(true);
      expect(nextCalled).toBe(true);
      
      console.error = originalError;
    });
  });
});

