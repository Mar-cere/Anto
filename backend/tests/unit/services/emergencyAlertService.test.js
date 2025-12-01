/**
 * Tests unitarios para el servicio de alertas de emergencia
 *
 * @author AntoApp Team
 */

import emergencyAlertService from '../../../services/emergencyAlertService.js';
import EmergencyAlert from '../../../models/EmergencyAlert.js';
import User from '../../../models/User.js';
import CrisisEvent from '../../../models/CrisisEvent.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';
import crypto from 'crypto';

// Los mocks se manejarán de forma diferente para evitar problemas con jest

describe('Emergency Alert Service', () => {
  let userId;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    if (typeof jest !== 'undefined' && jest.clearAllMocks) {
      jest.clearAllMocks();
    }
    
    // Crear un usuario de prueba con contactos de emergencia
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha512').toString('hex');
    testUser = await User.create({
      email: `emergency${Date.now()}@example.com`,
      username: `emergency${Date.now().toString().slice(-6)}`,
      password: hash,
      salt: salt,
      emergencyContacts: [{
        name: 'Test Contact',
        email: 'contact@example.com',
        phone: '+1234567890',
        relationship: 'friend',
        enabled: true
      }]
    });
    userId = testUser._id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('sendEmergencyAlerts', () => {
    it('debe enviar alertas de emergencia', async () => {
      const crisisEvent = await CrisisEvent.create({
        userId: userId,
        riskLevel: 'HIGH',
        detectedAt: new Date(),
      });

      const result = await emergencyAlertService.sendEmergencyAlerts(
        userId.toString(),
        'HIGH',
        'Test message content',
        { crisisEventId: crisisEvent._id.toString() }
      );

      expect(result).toHaveProperty('sent');
      expect(result).toHaveProperty('contacts');
    });
  });

  // getUserAlerts no existe en el servicio, se omite este test
});

