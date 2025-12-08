/**
 * Tests unitarios para modelo Subscription
 * 
 * @author AntoApp Team
 */

import Subscription from '../../../models/Subscription.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('Subscription Model', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

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

  describe('Virtual properties', () => {
    it('isActive debe retornar true para suscripción activa', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(subscription.isActive).toBe(true);
    });

    it('isActive debe retornar false para suscripción cancelada', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'canceled',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(subscription.isActive).toBe(false);
    });

    it('daysRemaining debe calcular días restantes correctamente', () => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: futureDate
      });

      const days = subscription.daysRemaining;
      expect(days).toBeGreaterThanOrEqual(14);
      expect(days).toBeLessThanOrEqual(15);
    });

    it('daysRemaining debe retornar 0 si no hay currentPeriodEnd', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date()
      });

      expect(subscription.daysRemaining).toBe(0);
    });

    it('isInTrial debe retornar true para trial activo', () => {
      const now = new Date();
      const trialStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 días atrás
      const trialEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 días adelante
      
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'trialing',
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        trialStart: trialStart,
        trialEnd: trialEnd
      });

      // Verificar que el trial está activo (ahora está entre trialStart y trialEnd y status es trialing)
      expect(subscription.isInTrial).toBe(true);
    });

    it('isInTrial debe retornar false si no hay trialStart', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(subscription.isInTrial).toBe(false);
    });

    it('isInTrial debe retornar false si el trial expiró', () => {
      const now = new Date();
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'trialing',
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        trialStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 días atrás
        trialEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 días atrás (expirado)
      });

      expect(subscription.isInTrial).toBe(false);
    });

    it('isActive debe retornar false si el período expiró', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 días atrás
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: pastDate,
        currentPeriodEnd: pastDate
      });

      expect(subscription.isActive).toBe(false);
    });
  });

  describe('Métodos de instancia', () => {
    it('debe tener método cancel', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(typeof subscription.cancel).toBe('function');
    });

    it('cancel debe cancelar al final del período por defecto', async () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();

      await subscription.cancel();

      expect(subscription.cancelAtPeriodEnd).toBe(true);
      expect(subscription.canceledAt).toBeDefined();
      expect(subscription.status).toBe('active'); // No se cancela inmediatamente
    });

    it('cancel debe cancelar inmediatamente si se especifica', async () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();

      await subscription.cancel(true);

      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.canceledAt).toBeDefined();
      expect(subscription.status).toBe('canceled');
      expect(subscription.endedAt).toBeDefined();
    });

    it('debe tener método reactivate', () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(typeof subscription.reactivate).toBe('function');
    });

    it('reactivate debe reactivar una suscripción cancelada', async () => {
      const subscription = new Subscription({
        userId: new mongoose.Types.ObjectId(),
        plan: 'monthly',
        status: 'canceled',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      });
      await subscription.save();

      await subscription.reactivate();

      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.canceledAt).toBeNull();
      expect(subscription.status).toBe('active');
    });
  });

  describe('Métodos estáticos', () => {
    it('debe tener método findActiveByUserId', () => {
      expect(typeof Subscription.findActiveByUserId).toBe('function');
    });

    it('debe tener método findExpiringSoon', () => {
      expect(typeof Subscription.findExpiringSoon).toBe('function');
    });

    it('findActiveByUserId debe retornar null sin suscripciones', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = await Subscription.findActiveByUserId(userId);
      
      expect(subscription).toBeNull();
    });

    it('findActiveByUserId debe encontrar suscripción activa', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        userId,
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();

      const found = await Subscription.findActiveByUserId(userId);
      
      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(subscription._id.toString());
    });

    it('findActiveByUserId debe encontrar suscripción en trial', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        userId,
        plan: 'monthly',
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();

      const found = await Subscription.findActiveByUserId(userId);
      
      expect(found).toBeDefined();
      expect(found.status).toBe('trialing');
    });

    it('findExpiringSoon debe retornar array vacío sin suscripciones', async () => {
      const subscriptions = await Subscription.findExpiringSoon(7);
      
      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBe(0);
    });

    it('findExpiringSoon debe encontrar suscripciones que expiran pronto', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        userId,
        plan: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
        cancelAtPeriodEnd: false
      });
      await subscription.save();

      const subscriptions = await Subscription.findExpiringSoon(7);
      
      expect(subscriptions.length).toBeGreaterThan(0);
    });
  });
});
