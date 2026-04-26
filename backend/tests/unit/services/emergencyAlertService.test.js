/**
 * Tests unitarios para servicio de alertas de emergencia
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import emergencyAlertService from '../../../services/emergencyAlertService.js';
import { connectDatabase, closeDatabase } from '../../helpers/testHelpers.js';

jest.mock('../../../services/whatsappService.js', () => ({
  sendEmergencyAlert: jest.fn()
}));

jest.mock('../../../services/pushNotificationService.js', () => ({
  sendNotification: jest.fn()
}));

jest.mock('../../../models/User.js', () => ({
  findById: jest.fn()
}));

jest.mock('../../../models/EmergencyAlert.js', () => ({
  find: jest.fn(() => ({
    lean: jest.fn()
  })),
  create: jest.fn()
}));

describe('EmergencyAlertService', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Métodos del servicio', () => {
    it('debe tener método canSendAlert', () => {
      expect(typeof emergencyAlertService.canSendAlert).toBe('function');
    });

    it('debe tener método recordAlertSent', () => {
      expect(typeof emergencyAlertService.recordAlertSent).toBe('function');
    });

    it('debe tener método getEmergencyContacts', () => {
      expect(typeof emergencyAlertService.getEmergencyContacts).toBe('function');
    });
  });

  describe('canSendAlert', () => {
    beforeEach(() => {
      // Limpiar timestamps antes de cada test
      emergencyAlertService.lastAlertTimestamps.clear();
    });

    it('debe permitir enviar alerta si no hay alerta previa', () => {
      const result = emergencyAlertService.canSendAlert('new-user-id');
      expect(result).toBe(true);
    });

    it('debe permitir enviar alerta después del cooldown', () => {
      const userId = 'test-user-id';
      // Simular alerta enviada hace más de 60 minutos
      const oldTimestamp = Date.now() - (61 * 60 * 1000);
      emergencyAlertService.lastAlertTimestamps.set(userId, oldTimestamp);
      
      const result = emergencyAlertService.canSendAlert(userId);
      expect(result).toBe(true);
    });

    it('debe bloquear alerta dentro del cooldown', () => {
      const userId = 'test-user-id';
      // Simular alerta enviada hace menos de 60 minutos
      const recentTimestamp = Date.now() - (30 * 60 * 1000);
      emergencyAlertService.lastAlertTimestamps.set(userId, recentTimestamp);
      
      const result = emergencyAlertService.canSendAlert(userId);
      expect(result).toBe(false);
    });
  });

  describe('recordAlertSent', () => {
    it('debe registrar timestamp de alerta enviada', () => {
      const userId = 'test-user-id';
      const beforeTime = Date.now();
      
      emergencyAlertService.recordAlertSent(userId);
      
      const timestamp = emergencyAlertService.lastAlertTimestamps.get(userId);
      expect(timestamp).toBeDefined();
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

});
