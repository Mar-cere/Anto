/**
 * Tests de integración para rutas de health check
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../server.js';
import { connectDatabase, closeDatabase } from '../../helpers/testHelpers.js';
import { APP_TRIAL_DAYS, getWeeklySummaryTrialGiftDays } from '../../../constants/subscription.js';

describe('Health Check Routes', () => {
  // Conectar a la base de datos antes de los tests
  beforeAll(async () => {
    await connectDatabase();
    // Esperar un poco para que la conexión se establezca
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  // Cerrar conexión después de los tests
  afterAll(async () => {
    await closeDatabase();
    // Dar tiempo para que los procesos se cierren
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000); // Timeout extendido para cleanup

  describe('GET /api/health/app-config', () => {
    it('expone trialDays sin autenticación', async () => {
      const response = await request(app).get('/api/health/app-config').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trialDays).toBe(APP_TRIAL_DAYS);
      expect(response.body.weeklySummaryTrialGiftDays).toBe(getWeeklySummaryTrialGiftDays());
    });
  });

  describe('GET /health', () => {
    it('debe retornar información de salud (puede ser 200 o 503 dependiendo de MongoDB)', async () => {
      const response = await request(app)
        .get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body).toHaveProperty('version');
    });

    it('debe incluir dependencias principales', async () => {
      const response = await request(app)
        .get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body.dependencies).toHaveProperty('openai');
      expect(response.body.dependencies).toHaveProperty('atlas');
      expect(response.body.dependencies).toHaveProperty('redis');
    });

    it('debe retornar status 200 si MongoDB está conectado', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mongoose.connection.readyState === 1) {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.database).toBe('connected');
        expect(response.body.status).toBe('ok');
      } else {
        console.log('⚠️ MongoDB no está conectado, saltando verificación de status 200');
        const response = await request(app).get('/health');
        expect(response.body).toHaveProperty('database');
      }
    });
  });

  describe('GET /api/health/detailed', () => {
    it('expone chatFeatures.crisisRouting en desarrollo', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        const response = await request(app).get('/api/health/detailed');
        expect([200, 503]).toContain(response.status);
        expect(response.body.chatFeatures?.crisisRouting).toEqual(
          expect.objectContaining({
            hardStop: expect.any(Number),
            llmPath: expect.any(Number),
            sanitizedResponses: expect.any(Number),
            sanitizedByTransport: expect.any(Object),
            sanitizedByRiskLevel: expect.any(Object),
          }),
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('GET /', () => {
    it('debe retornar mensaje de servidor corriendo', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.message).toContain('running');
    });
  });
});
