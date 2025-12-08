/**
 * Tests unitarios para el modelo CrisisEvent
 *
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import CrisisEvent from '../../../models/CrisisEvent.js';
import User from '../../../models/User.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';
import crypto from 'crypto';

describe('CrisisEvent Model', () => {
  let userId;

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Crear un usuario de prueba
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha512').toString('hex');
    const user = await User.create({
      email: `crisiseventuser${Date.now()}@example.com`,
      username: `crisisev${Date.now().toString().slice(-6)}`,
      password: hash,
      salt: salt,
    });
    userId = user._id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('debe crear y guardar un evento de crisis exitosamente', async () => {
    const crisisData = {
      userId: userId,
      riskLevel: 'MEDIUM',
      detectedAt: new Date(),
      triggerMessage: {
        contentPreview: 'Test message preview',
        emotionalAnalysis: {
          mainEmotion: 'tristeza',
          intensity: 7
        }
      },
      trendAnalysis: {
        rapidDecline: true,
        sustainedLow: false,
        isolation: false,
        escalation: false,
        warnings: []
      },
      crisisHistory: {
        totalCrises: 1,
        recentCrises: 1
      }
    };

    const crisisEvent = new CrisisEvent(crisisData);
    const savedEvent = await crisisEvent.save();

    expect(savedEvent._id).toBeDefined();
    expect(savedEvent.riskLevel).toBe('MEDIUM');
    expect(savedEvent.userId.toString()).toBe(userId.toString());
    expect(savedEvent.detectedAt).toBeDefined();
  });

  it('no debe guardar un evento sin userId', async () => {
    const crisisData = {
      riskLevel: 'MEDIUM',
      detectedAt: new Date(),
    };

    const crisisEvent = new CrisisEvent(crisisData);
    await expect(crisisEvent.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('no debe guardar un evento sin riskLevel', async () => {
    const crisisData = {
      userId: userId,
      detectedAt: new Date(),
    };

    const crisisEvent = new CrisisEvent(crisisData);
    await expect(crisisEvent.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que el riskLevel sea válido', async () => {
    const crisisData = {
      userId: userId,
      riskLevel: 'INVALID_LEVEL',
      detectedAt: new Date(),
    };

    const crisisEvent = new CrisisEvent(crisisData);
    await expect(crisisEvent.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe tener valores por defecto correctos', async () => {
    const crisisData = {
      userId: userId,
      riskLevel: 'LOW',
      detectedAt: new Date(),
    };

    const crisisEvent = new CrisisEvent(crisisData);
    await crisisEvent.save();

    expect(crisisEvent.alerts.sent).toBe(false);
    expect(crisisEvent.alerts.contactsNotified).toBe(0);
    expect(crisisEvent.followUp.scheduled).toBe(false);
    expect(crisisEvent.followUp.completed).toBe(false);
    expect(crisisEvent.outcome).toBe('unknown');
  });

  it('debe marcar alertas como enviadas', async () => {
    const crisisEvent = await CrisisEvent.create({
      userId: userId,
      riskLevel: 'HIGH',
      detectedAt: new Date(),
    });

    // Verificar que se creó correctamente
    expect(crisisEvent._id).toBeDefined();

    // Actualizar alertas
    crisisEvent.alerts.sent = true;
    crisisEvent.alerts.sentAt = new Date();
    crisisEvent.alerts.contactsNotified = 2;
    crisisEvent.markModified('alerts');
    await crisisEvent.save();

    // Verificar directamente en el documento guardado
    expect(crisisEvent.alerts.sent).toBe(true);
    expect(crisisEvent.alerts.contactsNotified).toBe(2);
    
    // Recargar desde la BD usando el ID guardado
    const updatedEvent = await CrisisEvent.findById(crisisEvent._id.toString());
    expect(updatedEvent).not.toBeNull();
    expect(updatedEvent.alerts.sent).toBe(true);
    expect(updatedEvent.alerts.contactsNotified).toBe(2);
  });

  it('debe marcar seguimiento como completado', async () => {
    const crisisEvent = await CrisisEvent.create({
      userId: userId,
      riskLevel: 'MEDIUM',
      detectedAt: new Date(),
    });

    // Verificar que se creó correctamente
    expect(crisisEvent._id).toBeDefined();

    // Actualizar seguimiento
    crisisEvent.followUp.scheduled = true;
    crisisEvent.followUp.completed = true;
    crisisEvent.followUp.completedAt = new Date();
    crisisEvent.markModified('followUp');
    await crisisEvent.save();

    // Recargar el evento desde la base de datos usando el ID guardado
    const updatedEvent = await CrisisEvent.findById(crisisEvent._id.toString());
    expect(updatedEvent).not.toBeNull();
    expect(updatedEvent.followUp.completed).toBe(true);
    expect(updatedEvent.followUp.completedAt).toBeDefined();
  });

  it('debe establecer resolvedAt cuando se resuelve', async () => {
    const crisisEvent = await CrisisEvent.create({
      userId: userId,
      riskLevel: 'LOW',
      detectedAt: new Date(),
    });

    crisisEvent.resolvedAt = new Date();
    crisisEvent.outcome = 'resolved';
    await crisisEvent.save();

    const updatedEvent = await CrisisEvent.findById(crisisEvent._id);
    expect(updatedEvent.resolvedAt).toBeDefined();
    expect(updatedEvent.outcome).toBe('resolved');
  });
});

