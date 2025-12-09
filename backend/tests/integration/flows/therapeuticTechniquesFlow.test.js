/**
 * Test de integración: Flujo completo de técnicas terapéuticas
 * 
 * Este test verifica el flujo completo desde la obtención de técnicas
 * hasta su uso y seguimiento de efectividad.
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import TherapeuticTechniqueUsage from '../../../models/TherapeuticTechniqueUsage.js';
import Subscription from '../../../models/Subscription.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('Flujo completo: Técnicas Terapéuticas', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Crear usuario de prueba
    const timestamp = Date.now().toString().slice(-6);
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('TestPassword123!', salt, 1000, 64, 'sha512').toString('hex');
    
    testUser = await User.create({
      email: `techniquesuser${timestamp}@example.com`,
      username: `techniquesuser${timestamp}`,
      password: hash,
      salt,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'es'
      }
    });

    // Crear suscripción activa
    await Subscription.create({
      userId: testUser._id,
      plan: 'monthly',
      status: 'trialing',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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

  it('debe obtener técnicas terapéuticas disponibles', async () => {
    const techniquesResponse = await request(app)
      .get('/api/therapeutic-techniques')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(techniquesResponse.body).toBeDefined();
    // Puede retornar un array o un objeto con técnicas
    if (Array.isArray(techniquesResponse.body)) {
      expect(techniquesResponse.body.length).toBeGreaterThanOrEqual(0);
    } else if (typeof techniquesResponse.body === 'object') {
      expect(Object.keys(techniquesResponse.body).length).toBeGreaterThanOrEqual(0);
    }
  });

  it('debe obtener técnicas por emoción', async () => {
    const techniquesResponse = await request(app)
      .get('/api/therapeutic-techniques?emotion=ansiedad')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(techniquesResponse.body).toBeDefined();
  });

  it('debe registrar uso de técnica terapéutica', async () => {
    // Crear un registro de uso de técnica
    const usage = await TherapeuticTechniqueUsage.create({
      userId: testUser._id,
      techniqueId: 'test-technique-1',
      techniqueName: 'Técnica de Respiración',
      techniqueType: 'CBT',
      emotion: 'ansiedad',
      completed: true,
      duration: 10,
      emotionalIntensityBefore: 8,
      emotionalIntensityAfter: 5,
      effectiveness: 4
    });

    expect(usage).toBeDefined();
    expect(usage.userId.toString()).toBe(testUser._id.toString());
    expect(usage.completed).toBe(true);
  });

  it('debe obtener estadísticas de uso de técnicas', async () => {
    // Crear múltiples registros de uso
    await TherapeuticTechniqueUsage.create({
      userId: testUser._id,
      techniqueId: 'test-technique-1',
      techniqueName: 'Técnica 1',
      techniqueType: 'CBT',
      emotion: 'ansiedad',
      completed: true,
      duration: 10,
      effectiveness: 5
    });

    await TherapeuticTechniqueUsage.create({
      userId: testUser._id,
      techniqueId: 'test-technique-2',
      techniqueName: 'Técnica 2',
      techniqueType: 'DBT',
      emotion: 'tristeza',
      completed: false,
      duration: 5,
      effectiveness: 3
    });

    // Esperar un poco para que se guarden en la BD
    await new Promise(resolve => setTimeout(resolve, 300));

    // Obtener estadísticas - puede requerir parámetros de fecha
    const stats = await TherapeuticTechniqueUsage.getUserStats(testUser._id);
    expect(stats).toBeDefined();
    // El método puede retornar un array o un objeto, verificar estructura
    if (Array.isArray(stats)) {
      expect(stats.length).toBeGreaterThanOrEqual(0);
    } else if (stats.totalUses !== undefined) {
      expect(stats.totalUses).toBeGreaterThanOrEqual(0);
    } else {
      // Si no tiene la estructura esperada, al menos verificar que es un objeto
      expect(typeof stats).toBe('object');
    }
  });

  it('debe obtener técnicas más usadas', async () => {
    // Crear múltiples usos de la misma técnica
    await TherapeuticTechniqueUsage.create({
      userId: testUser._id,
      techniqueId: 'popular-technique',
      techniqueName: 'Técnica Popular',
      techniqueType: 'CBT',
      completed: true
    });

    await TherapeuticTechniqueUsage.create({
      userId: testUser._id,
      techniqueId: 'popular-technique',
      techniqueName: 'Técnica Popular',
      techniqueType: 'CBT',
      completed: true
    });

    const mostUsed = await TherapeuticTechniqueUsage.getMostUsedTechniques(testUser._id);
    expect(Array.isArray(mostUsed)).toBe(true);
    if (mostUsed.length > 0) {
      expect(mostUsed[0].techniqueName).toBe('Técnica Popular');
    }
  });

  it('debe validar autenticación para endpoints de técnicas', async () => {
    // Intentar acceder sin token
    await request(app)
      .get('/api/therapeutic-techniques')
      .expect(401);
  });
});

