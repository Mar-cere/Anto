/**
 * Tests unitarios para middleware de verificación de suscripción
 *
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import { requireActiveSubscription } from '../../../middleware/checkSubscription.js';
import Message from '../../../models/Message.js';
import Subscription from '../../../models/Subscription.js';
import User from '../../../models/User.js';
import paymentAuditService from '../../../services/paymentAuditService.js';

const makeRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

const makeReq = (overrides = {}) => ({
  user: { _id: '507f1f77bcf86cd799439011', role: 'user' },
  ip: '127.0.0.1',
  path: '/messages',
  method: 'POST',
  get: jest.fn(() => 'jest-agent'),
  ...overrides
});

const mockUserFindByIdResult = (userDoc) => {
  jest.spyOn(User, 'findById').mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(userDoc)
  }));
};

describe('CheckSubscription Middleware', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(paymentAuditService, 'verifyUserAccess').mockResolvedValue({ ok: true });
    jest.spyOn(paymentAuditService, 'logEvent').mockResolvedValue({});
  });

  describe('requireActiveSubscription', () => {
    it('debe permitir acceso cuando el usuario tiene premium activo (modelo User)', async () => {
      jest.spyOn(Subscription, 'findOne').mockResolvedValue(null);
      mockUserFindByIdResult({
        email: 'test@anto.app',
        subscription: {
          status: 'premium',
          plan: 'monthly',
          trialEndDate: null,
          subscriptionEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        save: jest.fn()
      });
      jest.spyOn(Message, 'exists').mockResolvedValue(false);

      const middleware = requireActiveSubscription(true);
      const req = makeReq();
      const res = makeRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.subscription).toEqual(
        expect.objectContaining({
          isActive: true,
          isInTrial: false,
          status: 'premium'
        })
      );
    });

    it('debe permitir primera sesión por gracia cuando no hay suscripción y no hay mensajes previos', async () => {
      jest.spyOn(Subscription, 'findOne').mockResolvedValue(null);
      mockUserFindByIdResult({
        email: 'new@anto.app',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        subscription: {
          status: 'free',
          plan: null,
          trialEndDate: null,
          subscriptionEndDate: null
        }
      });
      jest.spyOn(Message, 'exists').mockResolvedValue(false);

      const middleware = requireActiveSubscription(true);
      const req = makeReq({ path: '/messages' });
      const res = makeRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.subscription).toEqual(
        expect.objectContaining({
          firstSessionGrace: true,
          status: 'free'
        })
      );
      expect(Message.exists).toHaveBeenCalled();
    });

    it('debe bloquear cuando no hay suscripción y ya existe historial del usuario', async () => {
      jest.spyOn(Subscription, 'findOne').mockResolvedValue(null);
      mockUserFindByIdResult({
        email: 'old@anto.app',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        subscription: {
          status: 'free',
          plan: null,
          trialEndDate: null,
          subscriptionEndDate: null
        }
      });
      jest.spyOn(Message, 'exists').mockResolvedValue(true);

      const middleware = requireActiveSubscription(true);
      const req = makeReq({ path: '/messages' });
      const res = makeRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body).toEqual(
        expect.objectContaining({
          requiresSubscription: true
        })
      );
    });

    it('no debe aplicar gracia fuera de rutas iniciales del chat', async () => {
      jest.spyOn(Subscription, 'findOne').mockResolvedValue(null);
      mockUserFindByIdResult({
        email: 'new@anto.app',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        subscription: {
          status: 'free',
          plan: null,
          trialEndDate: null,
          subscriptionEndDate: null
        }
      });
      jest.spyOn(Message, 'exists').mockResolvedValue(false);

      const middleware = requireActiveSubscription(true);
      const req = makeReq({ path: '/conversations/507f1f77bcf86cd799439011/session-intention' });
      const res = makeRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(req.subscription).toBeUndefined();
    });
  });
});
