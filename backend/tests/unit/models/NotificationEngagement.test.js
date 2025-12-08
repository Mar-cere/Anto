/**
 * Tests unitarios para modelo NotificationEngagement
 * 
 * @author AntoApp Team
 */

import NotificationEngagement from '../../../models/NotificationEngagement.js';
import mongoose from 'mongoose';

describe('NotificationEngagement Model', () => {
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
  });
});

