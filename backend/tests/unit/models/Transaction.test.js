/**
 * Tests unitarios para modelo Transaction
 * 
 * @author AntoApp Team
 */

import Transaction from '../../../models/Transaction.js';
import Subscription from '../../../models/Subscription.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('Transaction Model', () => {
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
    it('debe crear una transacción válida', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        currency: 'CLP',
        status: 'pending',
        type: 'subscription'
      });

      const error = transaction.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const transaction = new Transaction({
        amount: 10000,
        currency: 'CLP',
        status: 'pending'
      });

      const error = transaction.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir amount', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        currency: 'CLP',
        status: 'pending'
      });

      const error = transaction.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar status enum', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        currency: 'CLP',
        status: 'invalid-status'
      });

      const error = transaction.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar type enum', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        currency: 'CLP',
        status: 'pending',
        type: 'invalid-type'
      });

      const error = transaction.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar paymentMethod enum', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        currency: 'CLP',
        status: 'pending',
        type: 'subscription',
        paymentMethod: 'invalid-method'
      });

      const error = transaction.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar paymentProvider enum', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        currency: 'CLP',
        status: 'pending',
        type: 'subscription',
        paymentProvider: 'invalid-provider'
      });

      const error = transaction.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar amount mínimo', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: -100,
        currency: 'CLP',
        status: 'pending',
        type: 'subscription'
      });

      const error = transaction.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener campos de proveedor de pago', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        currency: 'CLP',
        status: 'pending',
        type: 'subscription',
        providerTransactionId: 'mp-pay-123'
      });

      expect(transaction.providerTransactionId).toBe('mp-pay-123');
    });

    it('debe tener valores por defecto', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        type: 'subscription'
      });

      expect(transaction.currency).toBe('CLP');
      expect(transaction.status).toBe('pending');
      expect(transaction.paymentMethod).toBe('card');
      expect(transaction.paymentProvider).toBe('mercadopago');
    });

    it('debe guardar y recuperar una transacción', async () => {
      const userId = new mongoose.Types.ObjectId();
      const transaction = new Transaction({
        userId,
        amount: 15000,
        currency: 'CLP',
        status: 'completed',
        type: 'subscription',
        plan: 'monthly',
        providerTransactionId: 'mp-12345',
        description: 'Suscripción mensual'
      });

      await transaction.save();

      const found = await Transaction.findById(transaction._id);
      expect(found).toBeDefined();
      expect(found.userId.toString()).toBe(userId.toString());
      expect(found.amount).toBe(15000);
      expect(found.status).toBe('completed');
      expect(found.plan).toBe('monthly');
    });

    it('debe aceptar todos los tipos de transacción válidos', () => {
      const validTypes = ['subscription', 'one-time', 'refund', 'upgrade', 'downgrade'];
      
      validTypes.forEach(type => {
        const transaction = new Transaction({
          userId: new mongoose.Types.ObjectId(),
          amount: 10000,
          type
        });

        const error = transaction.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('debe aceptar todos los estados válidos', () => {
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'canceled'];
      
      validStatuses.forEach(status => {
        const transaction = new Transaction({
          userId: new mongoose.Types.ObjectId(),
          amount: 10000,
          type: 'subscription',
          status
        });

        const error = transaction.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('debe aceptar todos los métodos de pago válidos', () => {
      const validMethods = ['card', 'paypal', 'bank_transfer', 'other'];
      
      validMethods.forEach(method => {
        const transaction = new Transaction({
          userId: new mongoose.Types.ObjectId(),
          amount: 10000,
          type: 'subscription',
          paymentMethod: method
        });

        const error = transaction.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('debe aceptar todos los proveedores válidos', () => {
      const validProviders = ['mercadopago', 'paypal', 'transbank', 'flow', 'other'];
      
      validProviders.forEach(provider => {
        const transaction = new Transaction({
          userId: new mongoose.Types.ObjectId(),
          amount: 10000,
          type: 'subscription',
          paymentProvider: provider
        });

        const error = transaction.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('debe aceptar todos los planes válidos', () => {
      const validPlans = ['weekly', 'monthly', 'quarterly', 'semestral', 'yearly', null];
      
      validPlans.forEach(plan => {
        const transaction = new Transaction({
          userId: new mongoose.Types.ObjectId(),
          amount: 10000,
          type: 'subscription',
          plan
        });

        const error = transaction.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('debe guardar metadata adicional', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        amount: 10000,
        type: 'subscription',
        metadata: {
          customerName: 'Test User',
          address: 'Test Address'
        }
      });

      expect(transaction.metadata.customerName).toBe('Test User');
      expect(transaction.metadata.address).toBe('Test Address');
    });
  });

  describe('Métodos estáticos', () => {
    let userId;

    beforeEach(() => {
      userId = new mongoose.Types.ObjectId();
    });

    it('debe tener método getUserTransactions', () => {
      expect(typeof Transaction.getUserTransactions).toBe('function');
    });

    it('debe tener método getTransactionStats', () => {
      expect(typeof Transaction.getTransactionStats).toBe('function');
    });

    it('getUserTransactions debe retornar array vacío sin transacciones', async () => {
      const transactions = await Transaction.getUserTransactions(userId);
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBe(0);
    });

    it('getUserTransactions debe filtrar por status', async () => {
      const transaction = new Transaction({
        userId,
        amount: 10000,
        type: 'subscription',
        status: 'completed'
      });
      await transaction.save();

      const transactions = await Transaction.getUserTransactions(userId, { status: 'completed' });
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].status).toBe('completed');
    });

    it('getUserTransactions debe filtrar por type', async () => {
      const transaction = new Transaction({
        userId,
        amount: 10000,
        type: 'subscription',
        status: 'completed'
      });
      await transaction.save();

      const transactions = await Transaction.getUserTransactions(userId, { type: 'subscription' });
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].type).toBe('subscription');
    });

    it('getTransactionStats debe retornar estadísticas vacías sin transacciones', async () => {
      const stats = await Transaction.getTransactionStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.totalTransactions).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.completedTransactions).toBe(0);
    });

    it('getTransactionStats debe calcular estadísticas correctamente', async () => {
      const transaction1 = new Transaction({
        userId,
        amount: 10000,
        type: 'subscription',
        status: 'completed'
      });
      await transaction1.save();

      const transaction2 = new Transaction({
        userId,
        amount: 15000,
        type: 'subscription',
        status: 'completed'
      });
      await transaction2.save();

      const transaction3 = new Transaction({
        userId,
        amount: 5000,
        type: 'subscription',
        status: 'failed'
      });
      await transaction3.save();

      // Esperar un poco para que se guarden
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await Transaction.getTransactionStats(userId);
      
      expect(stats.totalTransactions).toBe(3);
      expect(stats.completedTransactions).toBe(2);
      expect(stats.failedTransactions).toBe(1);
      expect(stats.totalAmount).toBe(25000); // Solo las completadas
    });

    it('getTransactionStats debe filtrar por fecha', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const stats = await Transaction.getTransactionStats(userId, startDate, endDate);
      
      expect(stats).toBeDefined();
      expect(stats.totalTransactions).toBe(0);
    });
  });
});
