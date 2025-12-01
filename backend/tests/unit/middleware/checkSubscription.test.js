/**
 * Tests unitarios para middleware de verificación de suscripción
 *
 * @author AntoApp Team
 */

import { requireActiveSubscription } from '../../../middleware/checkSubscription.js';
import User from '../../../models/User.js';
import Subscription from '../../../models/Subscription.js';
import paymentAuditService from '../../../services/paymentAuditService.js';

// Mock manual de los métodos del servicio de auditoría
if (typeof paymentAuditService !== 'undefined') {
  paymentAuditService.logEvent = async () => true;
  paymentAuditService.verifyUserAccess = async () => ({ hasAccess: true });
}

describe('Check Subscription Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    if (typeof jest !== 'undefined' && jest.clearAllMocks) {
      jest.clearAllMocks();
    }
    
    req = {
      user: {
        _id: '507f1f77bcf86cd799439011',
        toString: function() { return this._id; }
      },
      ip: '127.0.0.1',
      get: () => 'test-agent',
    };

    res = {
      statusCode: 0,
      body: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
    };

    next = () => {};
  });

  describe('requireActiveSubscription', () => {
    it('debe permitir acceso con suscripción activa', async () => {
      // Mock de Subscription.findOne que retorna una suscripción activa
      // Esto es lo primero que verifica el middleware
      const originalFindOne = Subscription.findOne;
      Subscription.findOne = async function(query) {
        // Retornar una suscripción activa solo si se busca por userId
        if (query && query.userId) {
          return {
            status: 'active',
            isActive: true,
            isInTrial: false,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            plan: 'monthly',
            save: async () => true,
          };
        }
        return null;
      };

      // Mock de User.findById().select()
      const originalUserFindById = User.findById;
      User.findById = () => ({
        select: async () => ({
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
        }),
      });

      // Mock de paymentAuditService.verifyUserAccess
      const originalVerifyUserAccess = paymentAuditService.verifyUserAccess;
      paymentAuditService.verifyUserAccess = async () => ({ hasAccess: true });

      let nextCalled = false;
      const testNext = () => { nextCalled = true; };

      const middleware = requireActiveSubscription(true);
      await middleware(req, res, testNext);

      // Restaurar métodos originales
      Subscription.findOne = originalFindOne;
      User.findById = originalUserFindById;
      paymentAuditService.verifyUserAccess = originalVerifyUserAccess;

      expect(nextCalled).toBe(true);
      expect(res.statusCode).toBe(0);
    }, 15000);

    it('debe permitir acceso con trial activo cuando allowTrial es true', async () => {
      Subscription.findOne = async () => null;
      
      // Mock de User.findById().select()
      const mockUser = {
        subscription: {
          status: 'trial',
          trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        save: async () => true,
      };
      User.findById = () => ({
        select: async () => mockUser,
      });

      let nextCalled = false;
      next = () => { nextCalled = true; };
      req.next = next;

      const middleware = requireActiveSubscription(true);
      await middleware(req, res, next);

      expect(nextCalled).toBe(true);
      expect(res.statusCode).toBe(0);
    });

    it('debe rechazar acceso sin suscripción activa cuando allowTrial es false', async () => {
      Subscription.findOne = async () => null;
      
      // Mock de User.findById().select()
      const mockUser = {
        subscription: {
          status: 'trial',
          trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      };
      User.findById = () => ({
        select: async () => mockUser,
      });

      let nextCalled = false;
      next = () => { nextCalled = true; };
      req.next = next;

      const middleware = requireActiveSubscription(false);
      await middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('suscripción');
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar acceso sin usuario autenticado', async () => {
      req.user = null;

      let nextCalled = false;
      next = () => { nextCalled = true; };
      req.next = next;

      const middleware = requireActiveSubscription(true);
      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toBe('Usuario no autenticado');
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar acceso con ID de usuario inválido', async () => {
      req.user._id = 'invalid-id';

      let nextCalled = false;
      next = () => { nextCalled = true; };
      req.next = next;

      const middleware = requireActiveSubscription(true);
      await middleware(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toBe('ID de usuario inválido');
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar acceso cuando el usuario no existe', async () => {
      Subscription.findOne = async () => null;
      
      // Mock de User.findById().select() que retorna null
      User.findById = () => ({
        select: async () => null,
      });

      let nextCalled = false;
      next = () => { nextCalled = true; };
      req.next = next;

      const middleware = requireActiveSubscription(true);
      await middleware(req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toBe('Usuario no encontrado');
      expect(nextCalled).toBe(false);
    });
  });
});

