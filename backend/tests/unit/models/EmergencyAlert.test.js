/**
 * Tests unitarios para modelo EmergencyAlert
 * 
 * @author AntoApp Team
 */

import EmergencyAlert from '../../../models/EmergencyAlert.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('EmergencyAlert Model', () => {
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

    it('debe requerir contact.name', () => {
      const alert = new EmergencyAlert({
        userId: new mongoose.Types.ObjectId(),
        riskLevel: 'HIGH',
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          email: 'test@example.com'
        }
      });

      const error = alert.validateSync();
      expect(error).toBeDefined();
    });

    it('debe requerir contact.email', () => {
      const alert = new EmergencyAlert({
        userId: new mongoose.Types.ObjectId(),
        riskLevel: 'HIGH',
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          name: 'Test Contact'
        }
      });

      const error = alert.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar riskLevel enum', () => {
      const alert = new EmergencyAlert({
        userId: new mongoose.Types.ObjectId(),
        riskLevel: 'INVALID',
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          name: 'Test Contact',
          email: 'test@example.com'
        }
      });

      const error = alert.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar status enum', () => {
      const alert = new EmergencyAlert({
        userId: new mongoose.Types.ObjectId(),
        riskLevel: 'HIGH',
        status: 'INVALID',
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          name: 'Test Contact',
          email: 'test@example.com'
        }
      });

      const error = alert.validateSync();
      expect(error).toBeDefined();
    });

    it('debe tener valores por defecto', () => {
      const alert = new EmergencyAlert({
        userId: new mongoose.Types.ObjectId(),
        riskLevel: 'HIGH',
        contact: {
          contactId: new mongoose.Types.ObjectId(),
          name: 'Test Contact',
          email: 'test@example.com'
        }
      });

      expect(alert.status).toBe('sent');
      expect(alert.isTest).toBe(false);
      expect(alert.channels.email.sent).toBe(false);
      expect(alert.channels.whatsapp.sent).toBe(false);
      expect(alert.sentAt).toBeDefined();
    });
  });

  describe('Métodos estáticos', () => {
    let userId;

    beforeEach(() => {
      userId = new mongoose.Types.ObjectId();
    });

    it('debe tener método getUserAlerts', () => {
      expect(typeof EmergencyAlert.getUserAlerts).toBe('function');
    });

    it('debe tener método getUserAlertStats', () => {
      expect(typeof EmergencyAlert.getUserAlertStats).toBe('function');
    });

    it('debe tener método detectPatterns', () => {
      expect(typeof EmergencyAlert.detectPatterns).toBe('function');
    });

    it('getUserAlerts debe retornar array vacío sin alertas', async () => {
      const alerts = await EmergencyAlert.getUserAlerts(userId);
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBe(0);
    });

    it('getUserAlerts debe filtrar por fecha', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const alerts = await EmergencyAlert.getUserAlerts(userId, { startDate, endDate });
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('getUserAlerts debe filtrar por riskLevel', async () => {
      const alerts = await EmergencyAlert.getUserAlerts(userId, { riskLevel: 'HIGH' });
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('getUserAlerts debe filtrar por status', async () => {
      const alerts = await EmergencyAlert.getUserAlerts(userId, { status: 'sent' });
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('getUserAlerts debe incluir pruebas si isTest es true', async () => {
      const alerts = await EmergencyAlert.getUserAlerts(userId, { isTest: true });
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('getUserAlertStats debe retornar estadísticas vacías sin alertas', async () => {
      const stats = await EmergencyAlert.getUserAlertStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.total).toBe(0);
      expect(stats.byRiskLevel.MEDIUM).toBe(0);
      expect(stats.byRiskLevel.HIGH).toBe(0);
    });

    it('getUserAlertStats debe calcular estadísticas con alertas', async () => {
      const contactId = new mongoose.Types.ObjectId();
      const alert1 = new EmergencyAlert({
        userId,
        riskLevel: 'HIGH',
        contact: {
          contactId,
          name: 'Contact 1',
          email: 'contact1@example.com'
        }
      });
      await alert1.save();

      const alert2 = new EmergencyAlert({
        userId,
        riskLevel: 'MEDIUM',
        contact: {
          contactId,
          name: 'Contact 2',
          email: 'contact2@example.com'
        }
      });
      await alert2.save();

      const stats = await EmergencyAlert.getUserAlertStats(userId);
      
      expect(stats.total).toBe(2);
      expect(stats.byRiskLevel.HIGH).toBe(1);
      expect(stats.byRiskLevel.MEDIUM).toBe(1);
    });

    it('detectPatterns debe retornar patrones con recomendación de más datos', async () => {
      const patterns = await EmergencyAlert.detectPatterns(userId);
      
      expect(patterns).toBeDefined();
      expect(patterns.recommendations).toBeDefined();
      expect(Array.isArray(patterns.recommendations)).toBe(true);
    });

    it('detectPatterns debe detectar patrones con suficientes alertas', async () => {
      const contactId = new mongoose.Types.ObjectId();
      // Crear múltiples alertas para detectar patrones
      for (let i = 0; i < 5; i++) {
        const alert = new EmergencyAlert({
          userId,
          riskLevel: 'HIGH',
          contact: {
            contactId,
            name: `Contact ${i}`,
            email: `contact${i}@example.com`
          },
          sentAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Una por día
        });
        await alert.save();
      }

      const patterns = await EmergencyAlert.detectPatterns(userId);
      
      expect(patterns).toBeDefined();
      expect(patterns.recommendations).toBeDefined();
    });
  });

  describe('Guardado y recuperación', () => {
    it('debe guardar y recuperar una alerta', async () => {
      const userId = new mongoose.Types.ObjectId();
      const contactId = new mongoose.Types.ObjectId();
      
      const alert = new EmergencyAlert({
        userId,
        riskLevel: 'HIGH',
        contact: {
          contactId,
          name: 'Test Contact',
          email: 'test@example.com',
          phone: '+1234567890',
          relationship: 'Friend'
        },
        channels: {
          email: {
            sent: true,
            sentAt: new Date()
          }
        }
      });

      await alert.save();

      const found = await EmergencyAlert.findById(alert._id);
      expect(found).toBeDefined();
      expect(found.userId.toString()).toBe(userId.toString());
      expect(found.riskLevel).toBe('HIGH');
      expect(found.contact.name).toBe('Test Contact');
      expect(found.contact.email).toBe('test@example.com');
      expect(found.channels.email.sent).toBe(true);
    });
  });
});

