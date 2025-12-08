/**
 * Tests unitarios para servicio de recordatorios de emergencia
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import emergencyReminderService from '../../../services/emergencyReminderService.js';

// Mock dependencies
jest.mock('../../../models/User.js', () => ({
  find: jest.fn()
}));

jest.mock('../../../config/mailer.js', () => ({
  sendEmail: jest.fn()
}));

describe('EmergencyReminderService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método needsReminder', () => {
      expect(typeof emergencyReminderService.needsReminder).toBe('function');
    });

    it('debe tener método generateReminderEmail', () => {
      expect(typeof emergencyReminderService.generateReminderEmail).toBe('function');
    });

    it('debe tener método sendReminder', () => {
      expect(typeof emergencyReminderService.sendReminder).toBe('function');
    });
  });

  describe('needsReminder', () => {
    it('debe retornar false si no tiene contactos', () => {
      const user = {
        emergencyContacts: []
      };
      
      const result = emergencyReminderService.needsReminder(user);
      
      expect(result).toBe(false);
    });

    it('debe retornar false si no tiene contactos definidos', () => {
      const user = {};
      
      const result = emergencyReminderService.needsReminder(user);
      
      expect(result).toBe(false);
    });

    it('debe retornar true si tiene contactos sin recordatorio reciente', () => {
      const user = {
        emergencyContacts: [
          {
            name: 'Contact 1',
            email: 'contact1@example.com',
            enabled: true
            // Sin lastReminderSent
          }
        ]
      };
      
      const result = emergencyReminderService.needsReminder(user);
      
      expect(result).toBe(true);
    });

    it('debe retornar false si todos los contactos tienen recordatorio reciente', () => {
      const recentDate = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)); // 10 días atrás
      const user = {
        emergencyContacts: [
          {
            name: 'Contact 1',
            email: 'contact1@example.com',
            enabled: true,
            lastReminderSent: recentDate
          }
        ]
      };
      
      const result = emergencyReminderService.needsReminder(user);
      
      expect(result).toBe(false);
    });
  });

  describe('generateReminderEmail', () => {
    it('debe generar email de recordatorio', () => {
      const userInfo = {
        name: 'Test User',
        email: 'test@example.com'
      };
      const contacts = [
        {
          name: 'Contact 1',
          email: 'contact1@example.com',
          enabled: true
        }
      ];
      
      const email = emergencyReminderService.generateReminderEmail(userInfo, contacts);
      
      expect(email).toBeDefined();
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(typeof email.subject).toBe('string');
      expect(typeof email.html).toBe('string');
    });

    it('debe incluir lista de contactos en el email', () => {
      const userInfo = {
        name: 'Test User'
      };
      const contacts = [
        {
          name: 'Contact 1',
          email: 'contact1@example.com',
          enabled: true
        },
        {
          name: 'Contact 2',
          email: 'contact2@example.com',
          enabled: false
        }
      ];
      
      const email = emergencyReminderService.generateReminderEmail(userInfo, contacts);
      
      expect(email.html).toContain('Contact 1');
      expect(email.html).toContain('contact1@example.com');
      expect(email.html).toContain('Contact 2');
    });
  });
});

