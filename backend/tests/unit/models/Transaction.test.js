/**
 * Tests unitarios para el modelo Transaction
 *
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import Transaction from '../../../models/Transaction.js';
import User from '../../../models/User.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';
import crypto from 'crypto';

describe('Transaction Model', () => {
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
      email: `transuser${Date.now()}@example.com`,
      username: `transuser${Date.now().toString().slice(-6)}`,
      password: hash,
      salt: salt,
    });
    userId = user._id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('debe crear y guardar una transacción exitosamente', async () => {
    const transactionData = {
      userId: userId,
      type: 'subscription',
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'card',
      paymentProvider: 'mercadopago',
      mercadopagoTransactionId: 'mp_trans_123',
    };

    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();

    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.type).toBe('subscription');
    expect(savedTransaction.amount).toBe(9.99);
    expect(savedTransaction.status).toBe('completed');
    expect(savedTransaction.userId.toString()).toBe(userId.toString());
  });

  it('no debe guardar una transacción sin userId', async () => {
    const transactionData = {
      type: 'subscription',
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
    };

    const transaction = new Transaction(transactionData);
    await expect(transaction.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('no debe guardar una transacción sin type', async () => {
    const transactionData = {
      userId: userId,
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
    };

    const transaction = new Transaction(transactionData);
    await expect(transaction.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que el type sea válido', async () => {
    const transactionData = {
      userId: userId,
      type: 'invalid_type',
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
    };

    const transaction = new Transaction(transactionData);
    await expect(transaction.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que el status sea válido', async () => {
    const transactionData = {
      userId: userId,
      type: 'subscription',
      amount: 9.99,
      currency: 'USD',
      status: 'invalid_status',
    };

    const transaction = new Transaction(transactionData);
    await expect(transaction.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe tener valores por defecto correctos', async () => {
    const transactionData = {
      userId: userId,
      type: 'subscription',
      amount: 9.99,
      currency: 'USD',
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    expect(transaction.status).toBe('pending');
    expect(transaction.currency).toBe('USD');
  });

  it('debe guardar información de Mercado Pago', async () => {
    const transaction = await Transaction.create({
      userId: userId,
      type: 'subscription',
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'card',
      paymentProvider: 'mercadopago',
      providerTransactionId: 'mp_trans_123',
    });

    expect(transaction.providerTransactionId).toBe('mp_trans_123');
    expect(transaction.paymentProvider).toBe('mercadopago');
  });

  it('debe guardar metadata adicional', async () => {
    const transaction = await Transaction.create({
      userId: userId,
      type: 'subscription',
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
      metadata: {
        plan: 'monthly',
        subscriptionId: 'sub_123',
      },
    });

    expect(transaction.metadata.plan).toBe('monthly');
    expect(transaction.metadata.subscriptionId).toBe('sub_123');
  });
});

