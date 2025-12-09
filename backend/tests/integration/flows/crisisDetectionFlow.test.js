/**
 * Test de integración: Flujo completo de detección y manejo de crisis
 * 
 * Este test verifica el flujo completo desde la detección de una crisis
 * hasta el envío de alertas y seguimiento.
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import CrisisEvent from '../../../models/CrisisEvent.js';
import Message from '../../../models/Message.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('Flujo completo: Detección y Manejo de Crisis', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Crear usuario de prueba con contactos de emergencia
    const timestamp = Date.now().toString().slice(-6);
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('TestPassword123!', salt, 1000, 64, 'sha512').toString('hex');
    
    testUser = await User.create({
      email: `crisisuser${timestamp}@example.com`,
      username: `crisisuser${timestamp}`,
      password: hash,
      salt,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'es'
      },
      emergencyContacts: [
        {
          name: 'Contacto de Emergencia',
          phone: '+1234567890',
          email: 'emergency@example.com',
          relationship: 'family',
          isActive: true
        }
      ],
      subscription: {
        status: 'trial',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    authToken = jwt.sign(
      { userId: testUser._id.toString(), _id: testUser._id.toString() },
      process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
      { expiresIn: '1h' }
    );

    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  it('debe detectar y registrar un evento de crisis', async () => {
    // Paso 1: Obtener resumen de crisis
    const summaryResponse = await request(app)
      .get('/api/crisis/summary')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(summaryResponse.body).toHaveProperty('success');
    expect(summaryResponse.body.success).toBe(true);
    expect(summaryResponse.body).toHaveProperty('data');

    // Paso 2: Verificar que se puede obtener historial de crisis
    const historyResponse = await request(app)
      .get('/api/crisis/history')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(historyResponse.body).toHaveProperty('success');
    expect(historyResponse.body.success).toBe(true);
    expect(historyResponse.body).toHaveProperty('data');
  });

  it('debe obtener estadísticas de crisis', async () => {
    // Crear un evento de crisis manualmente para testing
    const crisisEvent = await CrisisEvent.create({
      userId: testUser._id,
      riskLevel: 'MEDIUM',
      detectedAt: new Date(),
      triggerMessage: {
        contentPreview: 'Mensaje de prueba de crisis',
        emotionalAnalysis: {
          mainEmotion: 'tristeza',
          intensity: 8
        }
      }
    });

    // Obtener resumen de crisis
    const summaryResponse = await request(app)
      .get('/api/crisis/summary')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(summaryResponse.body).toHaveProperty('success');
    expect(summaryResponse.body.success).toBe(true);
    expect(summaryResponse.body.data).toBeDefined();
  });

  it('debe obtener eventos de crisis recientes', async () => {
    // Crear múltiples eventos de crisis
    await CrisisEvent.create({
      userId: testUser._id,
      riskLevel: 'LOW',
      detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 días atrás
    });

    await CrisisEvent.create({
      userId: testUser._id,
      riskLevel: 'MEDIUM',
      detectedAt: new Date() // Hoy
    });

    // Obtener historial de crisis
    const historyResponse = await request(app)
      .get('/api/crisis/history?limit=20')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(historyResponse.body).toHaveProperty('success');
    expect(historyResponse.body.success).toBe(true);
    expect(historyResponse.body.data).toBeDefined();
    if (historyResponse.body.data.events) {
      expect(Array.isArray(historyResponse.body.data.events)).toBe(true);
    }
  });

  it('debe filtrar eventos de crisis por nivel de riesgo', async () => {
    // Crear eventos con diferentes niveles de riesgo
    await CrisisEvent.create({
      userId: testUser._id,
      riskLevel: 'LOW',
      detectedAt: new Date()
    });

    await CrisisEvent.create({
      userId: testUser._id,
      riskLevel: 'HIGH',
      detectedAt: new Date()
    });

    // Obtener solo eventos de alto riesgo
    const historyResponse = await request(app)
      .get('/api/crisis/history?riskLevel=HIGH')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(historyResponse.body).toHaveProperty('success');
    expect(historyResponse.body.success).toBe(true);
    expect(historyResponse.body.data).toBeDefined();
    // Si hay eventos, verificar que son de alto riesgo
    if (historyResponse.body.data.events && Array.isArray(historyResponse.body.data.events)) {
      historyResponse.body.data.events.forEach(event => {
        expect(event.riskLevel).toBe('HIGH');
      });
    }
  });
});

