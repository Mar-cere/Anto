/**
 * Tests de integración para rutas de pagos
 *
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import Subscription from '../../../models/Subscription.js';
import Transaction from '../../../models/Transaction.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import { validUser } from '../../fixtures/userFixtures.js';
import jwt from 'jsonwebtoken';

// Helper para crear usuario con password hasheado y token
const createUserAndToken = async () => {
  const timestamp = Date.now().toString().slice(-6);
  const uniqueUser = {
    ...validUser,
    email: `paymenttest${timestamp}@example.com`,
    username: `paymenttest${timestamp}`,
  };
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(uniqueUser.password, salt, 1000, 64, 'sha512').toString('hex');
  
  const user = await User.create({
    ...uniqueUser,
    password: hash,
    salt,
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'es'
    },
    stats: {
      tasksCompleted: 0,
      habitsStreak: 0,
      totalSessions: 0,
      lastActive: new Date()
    },
    subscription: {
      status: 'trial',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  });

  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
    { expiresIn: '1h' }
  );

  return { user, token };
};

describe('Payment Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    ({ user: testUser, token: authToken } = await createUserAndToken());
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  describe('GET /api/payments/plans', () => {
    it('debe obtener información de los planes disponibles', async () => {
      const response = await request(app)
        .get('/api/payments/plans')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('plans');
      expect(response.body.plans).toHaveProperty('weekly');
      expect(response.body.plans).toHaveProperty('monthly');
      expect(response.body.plans).toHaveProperty('yearly');
    });

    it('no debe requerir autenticación', async () => {
      const response = await request(app)
        .get('/api/payments/plans')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/payments/subscription-status', () => {
    it('debe obtener el estado de la suscripción del usuario', async () => {
      const response = await request(app)
        .get('/api/payments/subscription-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/payments/subscription-status')
        .expect(401);
    });
  });

  describe('GET /api/payments/transactions', () => {
    it('debe obtener las transacciones del usuario', async () => {
      // Crear una transacción de prueba
      await Transaction.create({
        userId: testUser._id,
        type: 'subscription',
        amount: 9.99,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
      });

      const response = await request(app)
        .get('/api/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/payments/transactions')
        .expect(401);
    });
  });

  describe('GET /api/payments/transactions/stats', () => {
    it('debe obtener estadísticas de transacciones', async () => {
      const response = await request(app)
        .get('/api/payments/transactions/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('stats');
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/payments/transactions/stats')
        .expect(401);
    });
  });
});

