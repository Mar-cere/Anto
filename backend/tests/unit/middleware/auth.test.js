/**
 * Tests unitarios para middleware de autenticación
 * 
 * @author AntoApp Team
 */

import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../../middleware/auth.js';

describe('Authentication Middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars';

  describe('authenticateToken', () => {
    it('debe autenticar un token válido', () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = {
        status: function() { return this; },
        json: function() { return this; },
      };
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('507f1f77bcf86cd799439011');
      expect(nextCalled).toBe(true);
    });

    it('debe rechazar request sin token', () => {
      const req = {
        headers: {},
        header: function() { return undefined; }, // Mock para req.header
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
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      authenticateToken(req, res, next);

      expect(req.user).toBeUndefined();
      expect(statusCode).toBe(401);
      expect(responseData).toBeDefined();
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar token inválido', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
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
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      authenticateToken(req, res, next);

      expect(req.user).toBeUndefined();
      expect(statusCode).toBe(401);
      expect(responseData).toBeDefined();
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar token expirado', () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Token expirado
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
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
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      authenticateToken(req, res, next);

      expect(req.user).toBeUndefined();
      expect(statusCode).toBe(401);
      expect(responseData).toBeDefined();
      expect(nextCalled).toBe(false);
    });

    it('debe aceptar token sin Bearer prefix (compatibilidad)', () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: token, // Sin "Bearer "
        },
      };
      const res = {
        status: function() { return this; },
        json: function() { return this; },
      };
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      authenticateToken(req, res, next);

      // El middleware actual acepta tokens sin Bearer
      expect(req.user).toBeDefined();
      expect(nextCalled).toBe(true);
    });
  });
});
