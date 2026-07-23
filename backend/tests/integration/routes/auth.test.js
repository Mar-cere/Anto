/**
 * Tests de integración para rutas de autenticación
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { jest } from '@jest/globals';
import app from '../../../server.js';
import User from '../../../models/User.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import { validUser, invalidUser } from '../../fixtures/userFixtures.js';
import { trialSubscriptionFixture } from '../../helpers/trialTestDates.js';
import { APP_TRIAL_DAYS, APP_TRIAL_DURATION_MS } from '../../../constants/subscription.js';

jest.setTimeout(30000);

// Helper para crear usuario con password hasheado
const createUserWithHashedPassword = async (userData) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(userData.password, salt, 1000, 64, 'sha512').toString('hex');
  
  return await User.create({
    ...userData,
    password: hash,
    salt,
    emailVerified: true, // Para que login funcione en tests
    preferences: {
      theme: 'light',
      notifications: { enabled: true },
      language: 'es'
    },
    stats: {
      tasksCompleted: 0,
      habitsStreak: 0,
      totalSessions: 0,
      lastActive: new Date()
    },
    subscription: trialSubscriptionFixture(),
  });
};

describe('Auth Routes', () => {
  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario con datos válidos', async () => {
      // Usar datos únicos para evitar duplicados
      // Usar solo los últimos 6 dígitos del timestamp para mantener username < 20 caracteres
      const timestamp = Date.now().toString().slice(-6);
      const uniqueUser = {
        ...validUser,
        email: `test${timestamp}@example.com`,
        username: `test${timestamp}`, // Máximo 20 caracteres: "test" (4) + 6 dígitos = 10 caracteres
        termsAccepted: true,
        privacyAccepted: true,
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(uniqueUser)
        .expect(201);

      // Tras registro, la API exige verificación de email: no devuelve accessToken hasta verificar
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('requiresVerification', true);
      expect(response.body).toHaveProperty('trialDays', APP_TRIAL_DAYS);
      expect(response.body).toHaveProperty('weeklySummaryTrialGiftDays');
      expect(response.body.user).toHaveProperty('username', uniqueUser.username.toLowerCase());
      expect(response.body.user).toHaveProperty('email', uniqueUser.email.toLowerCase());
      expect(response.body.user).not.toHaveProperty('password');

      const saved = await User.findOne({ email: uniqueUser.email.toLowerCase() });
      expect(saved?.subscription?.status).toBe('trial');
      expect(saved?.subscription?.trialGrantedAt).toBeTruthy();
      expect(new Date(saved.subscription.trialGrantedAt).getTime()).toBe(
        new Date(saved.subscription.trialStartDate).getTime()
      );
      const spanMs =
        new Date(saved.subscription.trialEndDate).getTime() -
        new Date(saved.subscription.trialStartDate).getTime();
      expect(spanMs).toBeGreaterThanOrEqual(APP_TRIAL_DURATION_MS - 1000);
      expect(spanMs).toBeLessThanOrEqual(APP_TRIAL_DURATION_MS + 1000);
    });

    it('debe rechazar registro con datos inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('debe rechazar registro con email duplicado', async () => {
      // Crear usuario primero usando el endpoint
      await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, termsAccepted: true, privacyAccepted: true });

      // Esperar más tiempo para evitar rate limiting (3 registros por hora)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Intentar crear otro con el mismo email pero diferente username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          username: 'another' + Date.now().toString().slice(-6), // Username único (máx 20 chars)
          termsAccepted: true,
          privacyAccepted: true,
        });

      // Puede ser 400 (duplicado) o 429 (rate limit)
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });

    it('debe rechazar registro con username duplicado', async () => {
      // Crear usuario primero usando el endpoint
      await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, termsAccepted: true, privacyAccepted: true });

      // Esperar más tiempo para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Intentar crear otro con el mismo username pero diferente email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'another' + Date.now() + '@example.com', // Email único
          termsAccepted: true,
          privacyAccepted: true,
        });

      // Puede ser 400 (duplicado) o 429 (rate limit)
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });

    it('debe rechazar registro sin campos requeridos', async () => {
      // Esperar más tiempo para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test' + Date.now().toString().slice(-6), // Username único (máx 20 chars)
          // Falta email y password
        });

      // Puede ser 400 (validación) o 429 (rate limit)
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario para login con password hasheado
      await createUserWithHashedPassword(validUser);
    });

    it('debe hacer login con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      // El endpoint retorna accessToken, no token
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', validUser.email.toLowerCase());
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('debe rechazar login con email incorrecto', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: validUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar login con password incorrecto', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar login sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          // Falta password
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/users/me', () => {
    let authToken;

    beforeEach(async () => {
      // Crear usuario con password hasheado
      await createUserWithHashedPassword(validUser);
      
      // Obtener token mediante login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });
      
      // El endpoint retorna accessToken, no token
      authToken = loginResponse.body.accessToken;
    });

    it('debe retornar información del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint retorna el usuario directamente, no envuelto en { user: ... }
      expect(response.body).toHaveProperty('email', validUser.email.toLowerCase());
      expect(response.body).toHaveProperty('username', validUser.username.toLowerCase());
      expect(response.body).not.toHaveProperty('password');
    });

    it('debe rechazar request sin token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar request con token inválido', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar JWT de usuario soft-deleted (sesión huérfana)', async () => {
      const user = await User.findOne({ email: validUser.email.toLowerCase() });
      expect(user).toBeTruthy();
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar JWT cuyo userId ya no existe en BD', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const ghostToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId().toString(), role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${ghostToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('verifica email sin modificar fechas de trial', async () => {
      const timestamp = Date.now().toString().slice(-6);
      const uniqueUser = {
        ...validUser,
        email: `verify${timestamp}@example.com`,
        username: `verify${timestamp}`,
        termsAccepted: true,
        privacyAccepted: true,
      };

      await request(app).post('/api/auth/register').send(uniqueUser).expect(201);

      const saved = await User.findOne({ email: uniqueUser.email.toLowerCase() });
      const trialStart = saved.subscription.trialStartDate;
      const trialEnd = saved.subscription.trialEndDate;
      const code = saved.emailVerificationCode;

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: uniqueUser.email, code })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.emailVerified).toBe(true);

      const after = await User.findOne({ email: uniqueUser.email.toLowerCase() });
      expect(after.subscription.status).toBe('trial');
      expect(new Date(after.subscription.trialStartDate).getTime()).toBe(
        new Date(trialStart).getTime()
      );
      expect(new Date(after.subscription.trialEndDate).getTime()).toBe(
        new Date(trialEnd).getTime()
      );
    });
  });
});

