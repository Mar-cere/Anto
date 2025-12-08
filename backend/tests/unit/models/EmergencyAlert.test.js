/**
 * Tests unitarios para modelo EmergencyAlert
 * 
 * @author AntoApp Team
 */

import EmergencyAlert from '../../../models/EmergencyAlert.js';
import mongoose from 'mongoose';

describe('EmergencyAlert Model', () => {
  describe('Validaciones', () => {
    it('debe crear una alerta de emergencia válida', () => {
      const alert = new EmergencyAlert({
        userId: new mongoose.Types.ObjectId(),
        riskLevel: 'HIGH',
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          name: 'Test Contact',
          email: 'test@example.com'
        }
      });

      const error = alert.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const alert = new EmergencyAlert({
        riskLevel: 'HIGH',
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          name: 'Test Contact',
          email: 'test@example.com'
        }
      });

      const error = alert.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir riskLevel', () => {
      const alert = new EmergencyAlert({
        userId: new mongoose.Types.ObjectId(),
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          name: 'Test Contact',
          email: 'test@example.com'
        }
      });

      const error = alert.validateSync();
      expect(error).toBeDefined();
    });
  });
});

