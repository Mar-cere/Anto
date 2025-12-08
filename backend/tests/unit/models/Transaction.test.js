/**
 * Tests unitarios para modelo Transaction
 * 
 * @author AntoApp Team
 */

import Transaction from '../../../models/Transaction.js';
import mongoose from 'mongoose';

describe('Transaction Model', () => {
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
  });
});
