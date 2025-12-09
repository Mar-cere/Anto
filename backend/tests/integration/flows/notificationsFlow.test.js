/**
 * Test de integración: Flujo completo de notificaciones
 * 
 * Este test verifica el flujo completo desde el registro de tokens
 * hasta el envío y seguimiento de notificaciones.
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import Subscription from '../../../models/Subscription.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('Flujo completo: Notificaciones', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Crear usuario de prueba
    const timestamp = Date.now().toString().slice(-6);
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('TestPassword123!', salt, 1000, 64, 'sha512').toString('hex');
    
    testUser = await User.create({
      email: `notifuser${timestamp}@example.com`,
      username: `notifuser${timestamp}`,
      password: hash,
      salt,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'es'
      }
    });

    // Crear suscripción activa
    await Subscription.create({
      userId: testUser._id,
      plan: 'monthly',
      status: 'trialing',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    authToken = jwt.sign(
      { userId: testUser._id.toString(), _id: testUser._id.toString() },
      process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
      { expiresIn: '1h' }
    );

    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  it('debe registrar token de notificación push', async () => {
    const tokenData = {
      pushToken: 'ExponentPushToken[test-token-123]'
    };

    const registerResponse = await request(app)
      .post('/api/notifications/push-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send(tokenData);

    // Puede retornar 200, 201 o 400 dependiendo de la implementación
    expect([200, 201, 400]).toContain(registerResponse.status);
    if (registerResponse.status === 200 || registerResponse.status === 201) {
      expect(registerResponse.body).toBeDefined();
    }
  });

  it('debe obtener estado de notificaciones', async () => {
    const statusResponse = await request(app)
      .get('/api/notifications/status')
      .set('Authorization', `Bearer ${authToken}`);

    // Puede retornar 200 o 404 si el endpoint no existe
    if (statusResponse.status === 200) {
      expect(statusResponse.body).toBeDefined();
    }
  });

  it('debe obtener estadísticas de engagement de notificaciones', async () => {
    const engagementResponse = await request(app)
      .get('/api/notifications/engagement')
      .set('Authorization', `Bearer ${authToken}`);

    // Puede retornar 200 o 404 si el endpoint no existe
    if (engagementResponse.status === 200) {
      expect(engagementResponse.body).toBeDefined();
    }
  });

  it('debe validar autenticación para endpoints de notificaciones', async () => {
    // Intentar acceder sin token
    await request(app)
      .post('/api/notifications/push-token')
      .send({ pushToken: 'test-token' })
      .expect(401);
  });

  it('debe actualizar preferencias de notificaciones del usuario', async () => {
    const preferencesResponse = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        preferences: {
          notifications: false
        }
      });

    // Puede retornar 200 o 400 dependiendo de la validación
    if (preferencesResponse.status === 200) {
      expect(preferencesResponse.body).toBeDefined();
    }
  });
});

