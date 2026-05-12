/**
 * Idempotencia al reprocesar el mismo recibo Apple (mismo transaction_id).
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import { jest } from '@jest/globals';
import User from '../../../models/User.js';
import Transaction from '../../../models/Transaction.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

// Evita IO real (Gmail/SendGrid) durante este test: el servicio importa el mailer dinámicamente.
jest.unstable_mockModule('../../../config/mailer.js', () => ({
  default: {
    sendSubscriptionThankYouEmail: jest.fn(async () => true),
  },
}));

const appleReceiptService = (await import('../../../services/appleReceiptService.js')).default;

function buildReceiptResponse(appleTxnId) {
  const now = Date.now();
  const future = now + 30 * 24 * 60 * 60 * 1000;
  return {
    status: 0,
    receipt: {},
    latest_receipt_info: [
      {
        product_id: 'com.anto.app.monthly',
        transaction_id: appleTxnId,
        original_transaction_id: `orig-${appleTxnId}`,
        purchase_date_ms: String(now),
        expires_date_ms: String(future),
        price: '4990',
        currency: 'CLP',
      },
    ],
  };
}

describe('AppleReceiptService processSubscription idempotencia', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('dos llamadas con el mismo recibo no duplican Transaction', async () => {
    if (mongoose.connection.readyState !== 1) {
      console.warn('Mongo no conectado; omitiendo test de idempotencia Apple');
      return;
    }

    const password = 'testpassword123';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const suffix = `${Date.now()}`.slice(-8);
    const user = await User.create({
      username: `ap${suffix}`,
      email: `a${suffix}@t.l`,
      password: hash,
      salt,
    });

    const appleTxnId = `apple-txn-${Date.now()}`;
    const receipt = buildReceiptResponse(appleTxnId);

    const r1 = await appleReceiptService.processSubscription(
      user._id,
      receipt,
      'com.anto.app.monthly',
      'client-wrong-id',
    );
    expect(r1.success).toBe(true);
    expect(r1.idempotentReplay).toBe(false);

    const r2 = await appleReceiptService.processSubscription(
      user._id,
      receipt,
      'com.anto.app.monthly',
      appleTxnId,
    );
    expect(r2.success).toBe(true);
    expect(r2.idempotentReplay).toBe(true);

    const count = await Transaction.countDocuments({
      userId: user._id,
      paymentProvider: 'apple',
      providerTransactionId: appleTxnId,
    });
    expect(count).toBe(1);
  });

  it('con dos líneas del mismo product_id elige la que caduca más tarde (no solo la compra más reciente)', async () => {
    if (mongoose.connection.readyState !== 1) {
      console.warn('Mongo no conectado; omitiendo test de selección Apple');
      return;
    }

    const password = 'testpassword123';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const suffix = `${Date.now()}`.slice(-8);
    const user = await User.create({
      username: `ap2${suffix}`,
      email: `a2${suffix}@t.l`,
      password: hash,
      salt,
    });

    const now = Date.now();
    const shortRenewalEnd = now + 5 * 24 * 60 * 60 * 1000;
    const longPeriodEnd = now + 40 * 24 * 60 * 60 * 1000;

    const receipt = {
      status: 0,
      receipt: {},
      latest_receipt_info: [
        {
          product_id: 'com.anto.app.monthly',
          transaction_id: 'recent-purchase',
          original_transaction_id: 'orig-same',
          purchase_date_ms: String(now),
          expires_date_ms: String(shortRenewalEnd),
          price: '4990',
          currency: 'CLP',
        },
        {
          product_id: 'com.anto.app.monthly',
          transaction_id: 'older-purchase',
          original_transaction_id: 'orig-same',
          purchase_date_ms: String(now - 86400000),
          expires_date_ms: String(longPeriodEnd),
          price: '4990',
          currency: 'CLP',
        },
      ],
    };

    const r = await appleReceiptService.processSubscription(
      user._id,
      receipt,
      'com.anto.app.monthly',
      'recent-purchase',
    );
    expect(r.success).toBe(true);
    const updated = await User.findById(user._id).lean();
    const end = new Date(updated.subscription.subscriptionEndDate).getTime();
    expect(end).toBeGreaterThanOrEqual(longPeriodEnd - 2000);
    expect(end).toBeLessThanOrEqual(longPeriodEnd + 2000);
  });
});
