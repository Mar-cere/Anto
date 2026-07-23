/**
 * Tests unitarios para middleware de autenticación
 *
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../../middleware/auth.js';

describe('Authentication Middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars';

  const makeRes = () => {
    let statusCode;
    let responseData;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
      getStatus: () => statusCode,
      getData: () => responseData,
    };
    return res;
  };

  describe('authenticateToken', () => {
    it('debe autenticar un token válido cuando Mongo no está conectado', async () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', role: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = makeRes();
      let nextCalled = false;
      const next = function () {
        nextCalled = true;
      };

      await authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('507f1f77bcf86cd799439011');
      expect(nextCalled).toBe(true);
    });

    it('debe rechazar request sin token', async () => {
      const req = {
        headers: {},
        header: function () {
          return undefined;
        },
      };
      const res = makeRes();
      let nextCalled = false;
      const next = function () {
        nextCalled = true;
      };

      await authenticateToken(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.getStatus()).toBe(401);
      expect(res.getData()).toBeDefined();
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar token inválido', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };
      const res = makeRes();
      let nextCalled = false;
      const next = function () {
        nextCalled = true;
      };

      await authenticateToken(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.getStatus()).toBe(401);
      expect(res.getData()).toBeDefined();
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar token expirado', async () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = makeRes();
      let nextCalled = false;
      const next = function () {
        nextCalled = true;
      };

      await authenticateToken(req, res, next);

      expect(req.user).toBeUndefined();
      expect(res.getStatus()).toBe(401);
      expect(res.getData()).toBeDefined();
      expect(nextCalled).toBe(false);
    });

    it('debe aceptar token sin Bearer prefix (compatibilidad)', async () => {
      const token = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', role: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: token,
        },
      };
      const res = makeRes();
      let nextCalled = false;
      const next = function () {
        nextCalled = true;
      };

      await authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(nextCalled).toBe(true);
    });

    it('debe rechazar con 401 si Mongo está conectado y el User no existe', async () => {
      const mongoose = (await import('mongoose')).default;
      const User = (await import('../../../models/User.js')).default;
      const originalReadyState = mongoose.connection.readyState;
      const findSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: () => ({
          lean: async () => null,
        }),
      });

      Object.defineProperty(mongoose.connection, 'readyState', {
        configurable: true,
        get: () => 1,
      });

      try {
        const token = jwt.sign(
          { userId: '507f1f77bcf86cd799439011', role: 'user' },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = makeRes();
        let nextCalled = false;

        await authenticateToken(req, res, () => {
          nextCalled = true;
        });

        expect(nextCalled).toBe(false);
        expect(res.getStatus()).toBe(401);
        expect(res.getData()?.message).toMatch(/no encontrado/i);
      } finally {
        findSpy.mockRestore();
        Object.defineProperty(mongoose.connection, 'readyState', {
          configurable: true,
          get: () => originalReadyState,
        });
      }
    });

    it('debe rechazar con 403 si el User está inactivo', async () => {
      const mongoose = (await import('mongoose')).default;
      const User = (await import('../../../models/User.js')).default;
      const originalReadyState = mongoose.connection.readyState;
      const findSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: () => ({
          lean: async () => ({ role: 'user', isActive: false }),
        }),
      });

      Object.defineProperty(mongoose.connection, 'readyState', {
        configurable: true,
        get: () => 1,
      });

      try {
        const token = jwt.sign(
          { userId: '507f1f77bcf86cd799439011', role: 'user' },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = makeRes();
        let nextCalled = false;

        await authenticateToken(req, res, () => {
          nextCalled = true;
        });

        expect(nextCalled).toBe(false);
        expect(res.getStatus()).toBe(403);
        expect(res.getData()?.message).toMatch(/desactivada/i);
      } finally {
        findSpy.mockRestore();
        Object.defineProperty(mongoose.connection, 'readyState', {
          configurable: true,
          get: () => originalReadyState,
        });
      }
    });

    it('debe autenticar si Mongo está conectado y el User existe y está activo', async () => {
      const mongoose = (await import('mongoose')).default;
      const User = (await import('../../../models/User.js')).default;
      const originalReadyState = mongoose.connection.readyState;
      const findSpy = jest.spyOn(User, 'findById').mockReturnValue({
        select: () => ({
          lean: async () => ({ role: 'admin', isActive: true }),
        }),
      });

      Object.defineProperty(mongoose.connection, 'readyState', {
        configurable: true,
        get: () => 1,
      });

      try {
        const token = jwt.sign(
          { userId: '507f1f77bcf86cd799439011', role: 'user' },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = makeRes();
        let nextCalled = false;

        await authenticateToken(req, res, () => {
          nextCalled = true;
        });

        expect(nextCalled).toBe(true);
        expect(req.user.role).toBe('admin');
      } finally {
        findSpy.mockRestore();
        Object.defineProperty(mongoose.connection, 'readyState', {
          configurable: true,
          get: () => originalReadyState,
        });
      }
    });
  });
});
