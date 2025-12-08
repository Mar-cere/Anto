/**
 * Tests unitarios para modelo Subscription
 * 
 * @author AntoApp Team
 */

import Subscription from '../../../models/Subscription.js';
import mongoose from 'mongoose';

describe('Subscription Model', () => {
  describe('Validaciones', () => {
    it('debe crear una suscripción válida', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const error = subscription.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const subscription = new Subscription({
        plan: 'monthly',
        status: 'active'
      });

      const error = subscription.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe validar plan enum', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'invalid-plan',
        status: 'active'
      });

      const error = subscription.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar status enum', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'invalid-status'
      });

      const error = subscription.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener campos de Mercado Pago', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        mercadopagoSubscriptionId: 'mp-sub-123'
      });

      expect(subscription.mercadopagoSubscriptionId).toBe('mp-sub-123');
    });

    it('debe tener campos de trial', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(subscription.trialStart).toBeDefined();
      expect(subscription.trialEnd).toBeDefined();
    });
  });
});
