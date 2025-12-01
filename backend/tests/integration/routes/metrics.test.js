/**
 * Tests de integración para rutas de métricas
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

describe('Metrics Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    // Usar datos únicos para evitar duplicados
    const timestamp = Date.now().toString().slice(-6);
    const uniqueUser = {
      ...validUser,
      email: `test${timestamp}@example.com`,
      username: `test${timestamp}`,
    };
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(uniqueUser.password, salt, 1000, 64, 'sha512').toString('hex');
    
    testUser = await User.create({
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

    authToken = jwt.sign(
      { userId: testUser._id.toString() },
      process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  describe('GET /api/metrics/system', () => {
    it('debe obtener métricas generales del sistema', async () => {
      const response = await request(app)
        .get('/api/metrics/system')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/metrics/system')
        .expect(401);
    });
  });

  describe('GET /api/metrics/me', () => {
    it('debe obtener métricas del usuario', async () => {
      const response = await request(app)
        .get('/api/metrics/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/metrics/health', () => {
    it('debe obtener estadísticas de salud del sistema', async () => {
      const response = await request(app)
        .get('/api/metrics/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });
});

