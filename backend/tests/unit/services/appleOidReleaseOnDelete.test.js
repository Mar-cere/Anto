/**
 * Al soft-delete de cuenta, liberar appleOriginalTransactionId para restore futuro.
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../../../models/User.js';
import Subscription from '../../../models/Subscription.js';
import app from '../../../server.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

async function createActiveUserWithAppleSub(oid) {
  const password = 'testpassword123';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  const suffix = `${Date.now()}`.slice(-8);
  const user = await User.create({
    username: `del${suffix}`,
    email: `del${suffix}@t.l`,
    password: hash,
    salt,
    emailVerified: true,
    isActive: true,
    subscription: {
      status: 'premium',
      plan: 'monthly',
      provider: 'apple',
      appleOriginalTransactionId: oid,
      appleTransactionId: `txn-${oid}`,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 86400000),
    },
  });

  await Subscription.create({
    userId: user._id,
    plan: 'monthly',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 86400000),
    metadata: {
      provider: 'apple',
      appleOriginalTransactionId: oid,
      appleTransactionId: `txn-${oid}`,
      productId: 'com.anto.app.monthly',
    },
  });

  const token = jwt.sign(
    { userId: user._id.toString(), role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
}

describe('DELETE /api/users/me libera OID Apple', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('libera metadata.appleOriginalTransactionId al eliminar cuenta', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const oid = `oid-del-${Date.now()}`;
    const { user, token } = await createActiveUserWithAppleSub(oid);

    await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const sub = await Subscription.findOne({ userId: user._id }).lean();
    expect(sub.status).toBe('canceled');
    expect(sub.metadata.appleOriginalTransactionId == null).toBe(true);
    expect(sub.metadata.releasedAppleOriginalTransactionId).toBe(oid);
    expect(sub.metadata.releasedReason).toBe('account_deletion');

    const deletedUser = await User.findById(user._id).lean();
    expect(deletedUser.isActive).toBe(false);
    expect(deletedUser.subscription?.appleOriginalTransactionId == null).toBe(true);
  });
});
