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
import paymentService from '../../../services/paymentService.js';

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
  const chain = {
    lean: jest.fn().mockResolvedValue(userDoc),
  };
  const p = Promise.resolve(userDoc);
  chain.then = p.then.bind(p);
  chain.catch = p.catch.bind(p);
  jest.spyOn(User, 'findById').mockImplementation(() => ({
    select: jest.fn(() => chain),
  }));
};

describe('CheckSubscription Middleware', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(paymentAuditService, 'verifyUserAccess').mockResolvedValue({ ok: true });
    jest.spyOn(paymentAuditService, 'logEvent').mockResolvedValue({});
    jest.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
      hasSubscription: false,
      status: 'free',
    });
  });

  describe('requireActiveSubscription', () => {
    it('debe permitir acceso cuando el usuario tiene premium activo (modelo User)', async () => {
      jest.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        hasSubscription: true,
        status: 'premium',
        isActive: true,
        isInTrial: false,
        plan: 'monthly',
        subscriptionEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
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

    it('debe permitir acceso cuando existe documento Subscription desactualizado pero User tiene premium vigente', async () => {
      jest.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        hasSubscription: true,
        status: 'premium',
        isActive: true,
        isInTrial: false,
        plan: 'monthly',
        subscriptionEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      jest.spyOn(Subscription, 'findOne').mockResolvedValue({
        status: 'active',
        isActive: false,
        currentPeriodEnd: new Date(Date.now() - 86400000),
      });
      mockUserFindByIdResult({
        email: 'premium@anto.app',
        subscription: {
          status: 'premium',
          plan: 'monthly',
          trialEndDate: null,
          subscriptionEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
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
          status: 'premium',
        }),
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
