/**
 * Tests unitarios para el modelo Subscription
 *
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import Subscription from '../../../models/Subscription.js';
import User from '../../../models/User.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';
import crypto from 'crypto';

describe('Subscription Model', () => {
  let userId;

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Crear un usuario de prueba
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha512').toString('hex');
    const user = await User.create({
      email: `subuser${Date.now()}@example.com`,
      username: `subuser${Date.now().toString().slice(-6)}`,
      password: hash,
      salt: salt,
    });
    userId = user._id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('debe crear y guardar una suscripción exitosamente', async () => {
    const subscriptionData = {
      userId: userId,
      status: 'active',
      plan: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    const subscription = new Subscription(subscriptionData);
    const savedSubscription = await subscription.save();

    expect(savedSubscription._id).toBeDefined();
    expect(savedSubscription.status).toBe('active');
    expect(savedSubscription.plan).toBe('monthly');
    expect(savedSubscription.userId.toString()).toBe(userId.toString());
  });

  it('no debe guardar una suscripción sin userId', async () => {
    const subscriptionData = {
      status: 'active',
      plan: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    };

    const subscription = new Subscription(subscriptionData);
    await expect(subscription.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('no debe guardar una suscripción sin plan', async () => {
    const subscriptionData = {
      userId: userId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    };

    const subscription = new Subscription(subscriptionData);
    await expect(subscription.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que el status sea válido', async () => {
    const subscriptionData = {
      userId: userId,
      status: 'invalid_status',
      plan: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    };

    const subscription = new Subscription(subscriptionData);
    await expect(subscription.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que el plan sea válido', async () => {
    const subscriptionData = {
      userId: userId,
      status: 'active',
      plan: 'invalid_plan',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    };

    const subscription = new Subscription(subscriptionData);
    await expect(subscription.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe tener valores por defecto correctos', async () => {
    const subscriptionData = {
      userId: userId,
      plan: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    };

    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    expect(subscription.status).toBe('trialing');
    expect(subscription.cancelAtPeriodEnd).toBe(false);
  });

  it('debe permitir userId único', async () => {
    await Subscription.create({
      userId: userId,
      plan: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    });

    const duplicateSubscription = new Subscription({
      userId: userId,
      plan: 'yearly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    });

    await expect(duplicateSubscription.save()).rejects.toThrow(mongoose.Error.MongoServerError);
  });

  it('debe guardar información de Mercado Pago', async () => {
    const subscription = await Subscription.create({
      userId: userId,
      plan: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      mercadopagoSubscriptionId: 'mp_sub_123',
      mercadopagoCustomerId: 'mp_cust_456',
      mercadopagoTransactionId: 'mp_trans_789',
    });

    expect(subscription.mercadopagoSubscriptionId).toBe('mp_sub_123');
    expect(subscription.mercadopagoCustomerId).toBe('mp_cust_456');
    expect(subscription.mercadopagoTransactionId).toBe('mp_trans_789');
  });

  it('debe manejar cancelación de suscripción', async () => {
    const subscription = await Subscription.create({
      userId: userId,
      plan: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Esperar un momento para que se guarde inicialmente
    await new Promise(resolve => setTimeout(resolve, 100));

    subscription.status = 'canceled';
    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();
    await subscription.save();

    // Esperar un momento para que se guarde
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verificar directamente en el documento guardado sin recargar
    expect(subscription.status).toBe('canceled');
    expect(subscription.cancelAtPeriodEnd).toBe(true);
    expect(subscription.canceledAt).toBeDefined();

    // También verificar recargando desde la BD
    const updatedSubscription = await Subscription.findById(subscription._id);
    expect(updatedSubscription).not.toBeNull();
    expect(updatedSubscription.status).toBe('canceled');
    expect(updatedSubscription.cancelAtPeriodEnd).toBe(true);
    expect(updatedSubscription.canceledAt).toBeDefined();
  });
});

