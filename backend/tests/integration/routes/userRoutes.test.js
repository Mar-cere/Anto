/**
 * Tests de integración para rutas de usuarios
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
    email: `usertest${timestamp}@example.com`,
    username: `usertest${timestamp}`,
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

describe('User Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    // Esperar un momento después de limpiar la base de datos
    await new Promise(resolve => setTimeout(resolve, 100));
    ({ user: testUser, token: authToken } = await createUserAndToken());
    // Esperar un momento para que se guarde el usuario
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  describe('GET /api/users/me', () => {
    it('debe obtener información del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint retorna el usuario directamente, no envuelto en success/data
      expect(response.body).toHaveProperty('email', testUser.email.toLowerCase());
      expect(response.body).toHaveProperty('username', testUser.username.toLowerCase());
      expect(response.body).not.toHaveProperty('password');
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/users/me')
        .expect(401);
    });
  });

  describe('GET /api/users/me/stats', () => {
    it('debe obtener estadísticas del usuario', async () => {
      const response = await request(app)
        .get('/api/users/me/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint retorna las stats directamente
      expect(response.body).toHaveProperty('tasksCompleted');
      expect(response.body).toHaveProperty('habitsStreak');
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .get('/api/users/me/stats')
        .expect(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('debe actualizar el perfil del usuario', async () => {
      const updateData = {
        name: 'Updated Name',
        preferences: {
          theme: 'dark',
          notifications: false,
          language: 'en'
        }
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Perfil actualizado correctamente');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('name', 'Updated Name');
    });

    it('debe rechazar actualización con datos inválidos', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar request sin autenticación', async () => {
      await request(app)
        .put('/api/users/me')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('PUT /api/users/me/password', () => {
    it('debe actualizar la contraseña con contraseña actual correcta', async () => {
      const updateData = {
        currentPassword: validUser.password,
        newPassword: 'newPassword123'
      };

      const response = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar actualización con contraseña actual incorrecta', async () => {
      const updateData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      const response = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400); // El endpoint retorna 400, no 401

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar contraseña nueva muy corta', async () => {
      const updateData = {
        currentPassword: validUser.password,
        newPassword: 'short'
      };

      const response = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/users/me/subscription', () => {
    it('debe obtener información de suscripción del usuario', async () => {
      const response = await request(app)
        .get('/api/users/me/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint retorna la suscripción directamente
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('trialDaysLeft');
    });
  });

  describe('GET /api/users/me/emergency-contacts', () => {
    it('debe obtener contactos de emergencia del usuario', async () => {
      // Usar findByIdAndUpdate para evitar problemas de versión
      await User.findByIdAndUpdate(
        testUser._id,
        {
          $set: {
            emergencyContacts: [{
              name: 'Test Contact',
              email: 'contact@example.com',
              phone: '+1234567890',
              relationship: 'friend',
              enabled: true
            }]
          }
        },
        { new: true }
      );

      const response = await request(app)
        .get('/api/users/me/emergency-contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint retorna contacts directamente
      expect(response.body).toHaveProperty('contacts');
      expect(Array.isArray(response.body.contacts)).toBe(true);
    });
  });

  describe('POST /api/users/me/emergency-contacts', () => {
    it('debe crear un nuevo contacto de emergencia', async () => {
      const contactData = {
        name: 'New Contact',
        email: 'newcontact@example.com',
        phone: '+1234567890',
        relationship: 'family'
      };

      const response = await request(app)
        .post('/api/users/me/emergency-contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      // El endpoint retorna message y contact directamente
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('contact');
    });

    it('debe rechazar contacto con datos inválidos', async () => {
      const contactData = {
        name: 'Invalid Contact',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/users/me/emergency-contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/users/me', () => {
    it('debe eliminar la cuenta del usuario', async () => {
      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint puede retornar error si el username es demasiado largo
      // Verificar que la respuesta tiene un mensaje
      expect(response.body).toHaveProperty('message');
    });
  });
});

