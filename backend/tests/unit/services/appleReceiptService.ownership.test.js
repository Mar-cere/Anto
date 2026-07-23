/**
 * Ownership / transfer de original_transaction_id Apple entre cuentas Anto.
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import { jest } from '@jest/globals';
import User from '../../../models/User.js';
import Subscription from '../../../models/Subscription.js';
import AppleServerNotification from '../../../models/AppleServerNotification.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

jest.unstable_mockModule('../../../config/mailer.js', () => ({
  default: {
    sendSubscriptionThankYouEmail: jest.fn(async () => true),
    sendSubscriptionRenewalEmail: jest.fn(async () => true),
  },
}));

const appleReceiptService = (await import('../../../services/appleReceiptService.js')).default;

function buildReceiptResponse(appleTxnId, originalTransactionId) {
  const now = Date.now();
  const future = now + 30 * 24 * 60 * 60 * 1000;
  return {
    status: 0,
    receipt: {},
    latest_receipt_info: [
      {
        product_id: 'com.anto.app.monthly',
        transaction_id: appleTxnId,
        original_transaction_id: originalTransactionId,
        purchase_date_ms: String(now),
        expires_date_ms: String(future),
        price: '4990',
        currency: 'CLP',
      },
    ],
  };
}

async function createUser(prefix) {
  const password = 'testpassword123';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-10);
  return User.create({
    username: `${prefix}${suffix}`.slice(0, 20),
    email: `${prefix}${suffix}@t.l`,
    password: hash,
    salt,
    emailVerified: true,
    isActive: true,
  });
}

describe('AppleReceiptService ownership / transfer OID', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('rechaza bind si el OID pertenece a otro usuario activo', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const owner = await createUser('own');
    const other = await createUser('oth');
    const oid = `oid-conflict-${Date.now()}`;
    const txnId = `txn-conflict-${Date.now()}`;

    const first = await appleReceiptService.processSubscription(
      owner._id,
      buildReceiptResponse(txnId, oid),
      'com.anto.app.monthly',
      txnId
    );
    expect(first.success).toBe(true);

    const second = await appleReceiptService.processSubscription(
      other._id,
      buildReceiptResponse(`${txnId}-b`, oid),
      'com.anto.app.monthly',
      `${txnId}-b`
    );
    expect(second.success).toBe(false);
    expect(second.code).toBe('APPLE_OWNERSHIP_CONFLICT');
  });

  it('transfiere OID desde usuario soft-deleted a cuenta nueva', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const oldUser = await createUser('old');
    const newUser = await createUser('new');
    const oid = `oid-transfer-${Date.now()}`;
    const txnId = `txn-transfer-${Date.now()}`;

    const first = await appleReceiptService.processSubscription(
      oldUser._id,
      buildReceiptResponse(txnId, oid),
      'com.anto.app.monthly',
      txnId
    );
    expect(first.success).toBe(true);

    oldUser.isActive = false;
    await oldUser.save();

    const restored = await appleReceiptService.processSubscription(
      newUser._id,
      buildReceiptResponse(`${txnId}-r`, oid),
      'com.anto.app.monthly',
      `${txnId}-r`
    );
    expect(restored.success).toBe(true);

    const newSub = await Subscription.findOne({ userId: newUser._id }).lean();
    expect(newSub?.metadata?.appleOriginalTransactionId).toBe(oid);

    const oldSub = await Subscription.findOne({ userId: oldUser._id }).lean();
    expect(oldSub?.metadata?.appleOriginalTransactionId == null).toBe(true);
    expect(oldSub?.metadata?.releasedAppleOriginalTransactionId).toBe(oid);
  });

  it('reprocesa ASN skipped user_not_found tras bind', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const user = await createUser('asn');
    const oid = `oid-asn-${Date.now()}`;
    const txnId = `txn-asn-${Date.now()}`;

    await AppleServerNotification.create({
      notificationUUID: `uuid-${Date.now()}`,
      notificationType: 'DID_CHANGE_RENEWAL_STATUS',
      subtype: 'AUTO_RENEW_DISABLED',
      originalTransactionId: oid,
      processingStatus: 'skipped',
      skipReason: 'user_not_found',
    });

    const result = await appleReceiptService.processSubscription(
      user._id,
      buildReceiptResponse(txnId, oid),
      'com.anto.app.monthly',
      txnId
    );
    expect(result.success).toBe(true);

    const asn = await AppleServerNotification.findOne({ originalTransactionId: oid }).lean();
    expect(asn.processingStatus).toBe('processed');
    expect(asn.skipReason).toBeNull();

    const sub = await Subscription.findOne({ userId: user._id }).lean();
    expect(sub.cancelAtPeriodEnd).toBe(true);
  });
});
