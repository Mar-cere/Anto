/**
 * Tests de integración para rutas de Cloudinary
 *
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
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
    email: `cloudinarytest${timestamp}@example.com`,
    username: `cloudinarytest${timestamp}`,
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

describe('Cloudinary Routes', () => {
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

  describe('POST /api/cloudinary/signature', () => {
    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .post('/api/cloudinary/signature')
        .expect(401);
    });

    it('debe rechazar request sin datos requeridos', async () => {
      const response = await request(app)
        .post('/api/cloudinary/signature')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});

