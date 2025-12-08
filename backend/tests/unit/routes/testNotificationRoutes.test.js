/**
 * Tests unitarios para rutas de testing de notificaciones
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies antes de importar
const mockUserFindById = jest.fn();
const mockPushNotificationService = {
  sendCrisisWarning: jest.fn(),
  sendCrisisMedium: jest.fn(),
  sendFollowUp: jest.fn()
};

jest.mock('../../../models/User.js', () => ({
  __esModule: true,
  default: {
    findById: mockUserFindById
  }
}));

jest.mock('../../../services/pushNotificationService.js', () => ({
  __esModule: true,
  default: mockPushNotificationService
}));

jest.mock('../../../middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { _id: 'test-user-id' };
    next();
  }
}));

import testNotificationRoutes from '../../../routes/testNotificationRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/notifications/test', testNotificationRoutes);

describe('TestNotificationRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/notifications/test/crisis-warning', () => {
    it('debe enviar notificación de crisis WARNING exitosamente', async () => {
      const mockUser = {
        _id: 'test-user-id',
        pushToken: 'ExponentPushToken[test]'
      };

      mockUserFindById.mockResolvedValue(mockUser);
      mockPushNotificationService.sendCrisisWarning.mockResolvedValue({
        success: true,
        ticketId: 'ticket-123'
      });

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('WARNING');
      expect(mockPushNotificationService.sendCrisisWarning).toHaveBeenCalled();
    });

    it('debe retornar 400 si el usuario no tiene token push', async () => {
      const mockUser = {
        _id: 'test-user-id',
        pushToken: null
      };

      mockUserFindById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token push');
    });

    it('debe retornar 400 si el usuario no existe', async () => {
      mockUserFindById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe retornar 500 si falla el envío', async () => {
      const mockUser = {
        _id: 'test-user-id',
        pushToken: 'ExponentPushToken[test]'
      };

      mockUserFindById.mockResolvedValue(mockUser);
      mockPushNotificationService.sendCrisisWarning.mockResolvedValue({
        success: false,
        error: 'Error de envío'
      });

      const response = await request(app)
        .post('/api/notifications/test/crisis-warning')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/test/crisis-medium', () => {
    it('debe enviar notificación de crisis MEDIUM exitosamente', async () => {
      const mockUser = {
        _id: 'test-user-id',
        pushToken: 'ExponentPushToken[test]'
      };

      mockUserFindById.mockResolvedValue(mockUser);
      mockPushNotificationService.sendCrisisMedium.mockResolvedValue({
        success: true,
        ticketId: 'ticket-456'
      });

      const response = await request(app)
        .post('/api/notifications/test/crisis-medium')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('MEDIUM');
      expect(mockPushNotificationService.sendCrisisMedium).toHaveBeenCalled();
    });

    it('debe retornar 400 si el usuario no tiene token push', async () => {
      const mockUser = {
        _id: 'test-user-id',
        pushToken: null
      };

      mockUserFindById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/notifications/test/crisis-medium')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/test/followup', () => {
    it('debe enviar notificación de seguimiento exitosamente', async () => {
      const mockUser = {
        _id: 'test-user-id',
        pushToken: 'ExponentPushToken[test]'
      };

      mockUserFindById.mockResolvedValue(mockUser);
      mockPushNotificationService.sendFollowUp.mockResolvedValue({
        success: true,
        ticketId: 'ticket-789'
      });

      const response = await request(app)
        .post('/api/notifications/test/followup')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('seguimiento');
      expect(mockPushNotificationService.sendFollowUp).toHaveBeenCalled();
    });

    it('debe retornar 400 si el usuario no tiene token push', async () => {
      const mockUser = {
        _id: 'test-user-id',
        pushToken: null
      };

      mockUserFindById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/notifications/test/followup')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe manejar errores correctamente', async () => {
      mockUserFindById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/notifications/test/followup')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});

