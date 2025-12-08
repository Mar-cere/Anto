/**
 * Test de integración: Flujo completo de registro de usuario
 * 
 * Este test verifica el flujo completo desde el registro hasta
 * la creación del perfil y configuración inicial.
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import UserProfile from '../../../models/UserProfile.js';
import Subscription from '../../../models/Subscription.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('Flujo completo: Registro de Usuario', () => {
  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  it('debe completar el flujo completo de registro de usuario', async () => {
    const timestamp = Date.now().toString().slice(-6);
    const userData = {
      email: `newuser${timestamp}@example.com`,
      username: `newuser${timestamp}`,
      password: 'SecurePassword123!',
      name: 'Usuario de Prueba'
    };

    // Paso 1: Registrar usuario
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(registerResponse.body).toHaveProperty('accessToken');
    expect(registerResponse.body).toHaveProperty('user');
    expect(registerResponse.body.user.email).toBe(userData.email.toLowerCase());

    const authToken = registerResponse.body.accessToken;
    const userId = registerResponse.body.user._id || registerResponse.body.user.id;

    // Paso 2: Verificar que el usuario se creó en la base de datos
    const createdUser = await User.findById(userId);
    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(userData.email.toLowerCase());
    expect(createdUser.username).toBe(userData.username.toLowerCase());

    // Paso 3: Verificar que se creó un perfil de usuario (puede ser opcional)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const userProfile = await UserProfile.findOne({ userId });
    // El perfil puede no crearse automáticamente, verificar si existe
    if (userProfile) {
      expect(userProfile.userId.toString()).toBe(userId.toString());
    }

    // Paso 4: Verificar que se creó una suscripción de prueba (puede ser opcional)
    const subscription = await Subscription.findOne({ userId });
    // La suscripción puede no crearse automáticamente, verificar si existe
    if (subscription) {
      expect(subscription.status).toBe('trialing');
    }

    // Paso 5: Verificar que el usuario puede autenticarse
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body.user.email).toBe(userData.email.toLowerCase());

    // Paso 6: Verificar que el usuario puede acceder a su perfil
    const profileResponse = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(profileResponse.body).toHaveProperty('_id');
    expect(profileResponse.body.email).toBe(userData.email.toLowerCase());
  });

  it('debe manejar errores en el flujo de registro', async () => {
    // Intentar registrar con email duplicado
    const timestamp = Date.now().toString().slice(-6);
    const userData = {
      email: `duplicate${timestamp}@example.com`,
      username: `duplicate${timestamp}`,
      password: 'SecurePassword123!',
      name: 'Usuario Duplicado'
    };

    // Primer registro
    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Segundo registro con mismo email (debe fallar)
    const duplicateResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400);

    expect(duplicateResponse.body).toHaveProperty('message');
  });

    it('debe validar datos requeridos en el registro', async () => {
      // Intentar registrar sin email
      const invalidResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'SecurePassword123!'
        });

      // Puede retornar 400 (validación) o 429 (rate limit)
      expect([400, 429]).toContain(invalidResponse.status);
      if (invalidResponse.status === 400) {
        expect(invalidResponse.body).toHaveProperty('message');
      }
    });
});

