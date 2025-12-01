/**
 * Tests de integración para rutas de técnicas terapéuticas
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

describe('Therapeutic Techniques Routes', () => {
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

  describe('GET /api/therapeutic-techniques', () => {
    it('debe obtener todas las técnicas terapéuticas disponibles', async () => {
      const response = await request(app)
        .get('/api/therapeutic-techniques')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('count');
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/therapeutic-techniques')
        .expect(401);
    });
  });

  describe('GET /api/therapeutic-techniques/emotion/:emotion', () => {
    it('debe obtener técnicas filtradas por emoción', async () => {
      const response = await request(app)
        .get('/api/therapeutic-techniques/emotion/tristeza')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('emotion', 'tristeza');
    });
  });

  describe('GET /api/therapeutic-techniques/history', () => {
    it('debe obtener historial de técnicas utilizadas', async () => {
      const response = await request(app)
        .get('/api/therapeutic-techniques/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/therapeutic-techniques/stats', () => {
    it('debe obtener estadísticas de técnicas', async () => {
      const response = await request(app)
        .get('/api/therapeutic-techniques/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });
});

