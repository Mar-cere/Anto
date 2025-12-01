/**
 * Tests de integración para rutas de crisis
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

describe('Crisis Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    // Usar datos únicos para evitar duplicados
    // Usar timestamp completo + random para mayor unicidad
    const timestamp = Date.now().toString() + Math.random().toString(36).substring(2, 8);
    const uniqueUser = {
      ...validUser,
      email: `test${timestamp.slice(-12)}@example.com`,
      username: `test${timestamp.slice(-12)}`,
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
    
    // Esperar un momento para que se guarde el usuario
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  describe('GET /api/crisis/summary', () => {
    it('debe obtener resumen de crisis del usuario', async () => {
      const response = await request(app)
        .get('/api/crisis/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('debe aceptar parámetro days', async () => {
      const response = await request(app)
        .get('/api/crisis/summary?days=7')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/crisis/summary')
        .expect(401);
    });
  });

  describe('GET /api/crisis/trends', () => {
    it('debe obtener tendencias emocionales', async () => {
      const response = await request(app)
        .get('/api/crisis/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('debe aceptar parámetro period', async () => {
      const response = await request(app)
        .get('/api/crisis/trends?period=7d')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/crisis/by-month', () => {
    it('debe obtener crisis agrupadas por mes', async () => {
      const response = await request(app)
        .get('/api/crisis/by-month')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('debe aceptar parámetro months', async () => {
      const response = await request(app)
        .get('/api/crisis/by-month?months=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/crisis/history', () => {
    it('debe obtener historial de crisis', async () => {
      const response = await request(app)
        .get('/api/crisis/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('debe aceptar parámetros de paginación', async () => {
      const response = await request(app)
        .get('/api/crisis/history?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/crisis/alerts-stats', () => {
    it('debe obtener estadísticas de alertas', async () => {
      const response = await request(app)
        .get('/api/crisis/alerts-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/crisis/followup-stats', () => {
    it('debe obtener estadísticas de seguimiento', async () => {
      const response = await request(app)
        .get('/api/crisis/followup-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/crisis/emotion-distribution', () => {
    it('debe obtener distribución de emociones', async () => {
      const response = await request(app)
        .get('/api/crisis/emotion-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });
});

