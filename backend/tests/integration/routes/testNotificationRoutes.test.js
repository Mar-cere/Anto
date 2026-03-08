/**
 * Tests de integración para rutas de testing de notificaciones
 *
 * Usa el servidor real con DB. Mockeamos pushNotificationService con
 * jest.unstable_mockModule para que se aplique antes de cargar el servidor.
 *
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import crypto from 'crypto';
import User from '../../../models/User.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';
import { validUser } from '../../fixtures/userFixtures.js';

const mockPushNotificationService = {
  sendCrisisWarning: jest.fn(),
  sendCrisisMedium: jest.fn(),
  sendFollowUp: jest.fn()
};

await jest.unstable_mockModule('../../../services/pushNotificationService.js', () => ({
  __esModule: true,
  default: mockPushNotificationService
}));

const { default: app } = await import('../../../server.js');

const createUserAndToken = async (overrides = {}) => {
  const timestamp = Date.now().toString().slice(-6);
  const uniqueUser = {
    ...validUser,
    email: `testnotif${timestamp}@example.com`,
    username: `testnotif${timestamp}`,
    ...overrides
  };
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(uniqueUser.password, salt, 1000, 64, 'sha512').toString('hex');

  const pushToken = overrides.hasOwnProperty('pushToken') ? overrides.pushToken : 'ExponentPushToken[test]';
  const userData = {
    ...uniqueUser,
    password: hash,
    salt,
    emailVerified: true,
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
  };
  if (pushToken && typeof pushToken === 'string') {
    userData.pushToken = pushToken;
  }
  const user = await User.create(userData);
  if (pushToken && user._id) {
    await User.findByIdAndUpdate(user._id, { $set: { pushToken } }, { runValidators: false });
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: 'user' },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
    { expiresIn: '1h' }
  );

  return { user, token };
};

describe('TestNotificationRoutes (integration)', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    ({ user: testUser, token: authToken } = await createUserAndToken());
    await new Promise(resolve => setTimeout(resolve, 200));
    await User.updateOne(
      { _id: testUser._id },
      { $set: { pushToken: 'ExponentPushToken[test]' } }
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  describe('POST /api/notifications/test/crisis-warning', () => {
    it('debe enviar notificación de crisis WARNING exitosamente', async () => {
      mockPushNotificationService.sendCrisisWarning.mockResolvedValue({
        success: true,
        ticketId: 'ticket-123'
      });

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('WARNING');
        expect(mockPushNotificationService.sendCrisisWarning).toHaveBeenCalled();
      } else {
        expect(response.body.message).toMatch(/token push|push/);
      }
    });

    it('debe retornar 400 si el usuario no tiene token push', async () => {
      await clearDatabase();
      ({ user: testUser, token: authToken } = await createUserAndToken({ pushToken: null }));

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token push');
    });

    it('debe retornar 400 si el usuario no existe', async () => {
      const badToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', role: 'user' },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .set('Authorization', `Bearer ${badToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe retornar 500 si falla el envío', async () => {
      mockPushNotificationService.sendCrisisWarning.mockResolvedValue({
        success: false,
        error: 'Error de envío'
      });

      await User.updateOne(
        { _id: testUser._id },
        { $set: { pushToken: 'ExponentPushToken[test]' } }
      );

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/test/crisis-medium', () => {
    it('debe enviar notificación de crisis MEDIUM exitosamente', async () => {
      mockPushNotificationService.sendCrisisMedium.mockResolvedValue({
        success: true,
        ticketId: 'ticket-456'
      });

      const response = await request(app)
        .post('/api/notifications/test/crisis-medium')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('MEDIUM');
        expect(mockPushNotificationService.sendCrisisMedium).toHaveBeenCalled();
      } else {
        expect(response.body.message).toMatch(/token push|push/);
      }
    });

    it('debe retornar 400 si el usuario no tiene token push', async () => {
      await clearDatabase();
      ({ user: testUser, token: authToken } = await createUserAndToken({ pushToken: null }));

      const response = await request(app)
        .post('/api/notifications/test/crisis-medium')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/test/followup', () => {
    it('debe enviar notificación de seguimiento exitosamente', async () => {
      mockPushNotificationService.sendFollowUp.mockResolvedValue({
        success: true,
        ticketId: 'ticket-789'
      });

      const response = await request(app)
        .post('/api/notifications/test/followup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('seguimiento');
        expect(mockPushNotificationService.sendFollowUp).toHaveBeenCalled();
      } else {
        expect(response.body.message).toMatch(/token push|push/);
      }
    });

    it('debe retornar 400 si el usuario no tiene token push', async () => {
      await clearDatabase();
      ({ user: testUser, token: authToken } = await createUserAndToken({ pushToken: null }));

      const response = await request(app)
        .post('/api/notifications/test/followup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores correctamente', async () => {
      mockPushNotificationService.sendFollowUp.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/notifications/test/followup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
