/**
 * Tests unitarios para modelo NotificationEngagement
 * 
 * @author AntoApp Team
 */

import NotificationEngagement from '../../../models/NotificationEngagement.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('NotificationEngagement Model', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Validaciones', () => {
    it('debe crear un engagement válido', () => {
      const engagement = new NotificationEngagement({
        userId: new mongoose.Types.ObjectId(),
        notificationType: 'reminder',
        pushToken: 'ExponentPushToken[test]',
        status: 'sent'
      });

      const error = engagement.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const engagement = new NotificationEngagement({
        notificationType: 'reminder',
        pushToken: 'ExponentPushToken[test]',
        status: 'sent'
      });

      const error = engagement.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir notificationType', () => {
      const engagement = new NotificationEngagement({
        userId: new mongoose.Types.ObjectId(),
        pushToken: 'ExponentPushToken[test]',
        status: 'sent'
      });

      const error = engagement.validateSync();
      expect(error).toBeDefined();
    });

    it('debe requerir pushToken', () => {
      const engagement = new NotificationEngagement({
        userId: new mongoose.Types.ObjectId(),
        notificationType: 'reminder',
        status: 'sent'
      });

      const error = engagement.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar status enum', () => {
      const engagement = new NotificationEngagement({
        userId: new mongoose.Types.ObjectId(),
        notificationType: 'reminder',
        pushToken: 'ExponentPushToken[test]',
        status: 'invalid-status'
      });

      const error = engagement.validateSync();
      expect(error).toBeDefined();
    });

    it('debe tener valores por defecto', () => {
      const engagement = new NotificationEngagement({
        userId: new mongoose.Types.ObjectId(),
        notificationType: 'reminder',
        pushToken: 'ExponentPushToken[test]'
      });

      expect(engagement.status).toBe('sent');
      expect(engagement.sentAt).toBeDefined();
    });
  });

  describe('Métodos estáticos', () => {
    it('debe tener método getEngagementStats', () => {
      expect(typeof NotificationEngagement.getEngagementStats).toBe('function');
    });

    it('getEngagementStats debe retornar estadísticas vacías sin datos', async () => {
      const userId = new mongoose.Types.ObjectId();
      const stats = await NotificationEngagement.getEngagementStats(userId, 30);
      
      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBe(0);
    });

    it('debe tener método getOverallStats', () => {
      expect(typeof NotificationEngagement.getOverallStats).toBe('function');
    });

    it('getOverallStats debe retornar estadísticas vacías sin datos', async () => {
      const userId = new mongoose.Types.ObjectId();
      const stats = await NotificationEngagement.getOverallStats(userId, 30);
      
      expect(stats).toBeDefined();
      expect(stats.total).toBe(0);
      expect(stats.deliveryRate).toBe(0);
      expect(stats.openRate).toBe(0);
    });

    it('getOverallStats debe calcular estadísticas con engagements', async () => {
      const userId = new mongoose.Types.ObjectId();
      const engagement1 = new NotificationEngagement({
        userId,
        notificationType: 'reminder',
        pushToken: 'ExponentPushToken[test1]',
        status: 'delivered'
      });
      await engagement1.save();

      const engagement2 = new NotificationEngagement({
        userId,
        notificationType: 'reminder',
        pushToken: 'ExponentPushToken[test2]',
        status: 'opened'
      });
      await engagement2.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await NotificationEngagement.getOverallStats(userId, 30);
      
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('Guardado y recuperación', () => {
    it('debe guardar y recuperar un engagement', async () => {
      const userId = new mongoose.Types.ObjectId();
      const engagement = new NotificationEngagement({
        userId,
        notificationType: 'crisis-warning',
        pushToken: 'ExponentPushToken[test123]',
        status: 'delivered',
        notificationData: {
          title: 'Test Notification',
          body: 'Test body'
        }
      });

      await engagement.save();

      const found = await NotificationEngagement.findById(engagement._id);
      expect(found).toBeDefined();
      expect(found.userId.toString()).toBe(userId.toString());
      expect(found.notificationType).toBe('crisis-warning');
      expect(found.status).toBe('delivered');
    });
  });
});

