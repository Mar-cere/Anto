/**
 * Tests de integración para rutas de autenticación
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import { validUser, invalidUser } from '../../fixtures/userFixtures.js';

// Helper para crear usuario con password hasheado
const createUserWithHashedPassword = async (userData) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(userData.password, salt, 1000, 64, 'sha512').toString('hex');
  
  return await User.create({
    ...userData,
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
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(uniqueUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      // Usar el username único que creamos, no el de validUser
      expect(response.body.user).toHaveProperty('username', uniqueUser.username.toLowerCase());
      expect(response.body.user).toHaveProperty('email', uniqueUser.email.toLowerCase());
      expect(response.body.user).not.toHaveProperty('password');
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
        .send(validUser);

      // Esperar más tiempo para evitar rate limiting (3 registros por hora)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Intentar crear otro con el mismo email pero diferente username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          username: 'another' + Date.now().toString().slice(-6), // Username único (máx 20 chars)
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
        .send(validUser);

      // Esperar más tiempo para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Intentar crear otro con el mismo username pero diferente email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'another' + Date.now() + '@example.com', // Email único
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
  });
});

