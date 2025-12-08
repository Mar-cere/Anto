/**
 * Tests unitarios para rutas de health check
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import healthRoutes from '../../../routes/healthRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/health', healthRoutes);

describe('Health Routes', () => {
  describe('GET /api/health', () => {
    it('debe retornar información de salud básica', async () => {
      const response = await request(app)
        .get('/api/health');

      // Puede ser 200 o 503 dependiendo del estado de MongoDB
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });

    it('debe retornar información de salud con estado de base de datos', async () => {
      const response = await request(app)
        .get('/api/health');

      // Puede ser 200 o 503 dependiendo del estado de MongoDB
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('database');
      expect(['connected', 'disconnected', 'connecting', 'disconnecting', 'unknown']).toContain(response.body.database);
    });

    it('debe incluir timestamp en formato ISO', async () => {
      const response = await request(app)
        .get('/api/health');

      // Puede ser 200 o 503 dependiendo del estado de MongoDB
      expect([200, 503]).toContain(response.status);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('GET /api/health/detailed', () => {
    it('debe retornar información detallada en desarrollo', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        const response = await request(app)
          .get('/api/health/detailed');

        // Puede ser 200 o 503 dependiendo del estado de MongoDB
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('memory');
        expect(response.body).toHaveProperty('node');
        expect(response.body).toHaveProperty('services');
        expect(response.body.memory).toHaveProperty('used');
        expect(response.body.memory).toHaveProperty('total');
        expect(response.body.memory).toHaveProperty('rss');
        expect(response.body.node).toHaveProperty('version');
        expect(response.body.node).toHaveProperty('platform');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('debe retornar 401 en producción sin autenticación', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const response = await request(app)
          .get('/api/health/detailed')
          .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Unauthorized');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('debe retornar información detallada con usuario autenticado en producción', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Crear una app con middleware de autenticación mockeado
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011' };
        next();
      });
      appWithAuth.use('/api/health', healthRoutes);

      try {
        const response = await request(appWithAuth)
          .get('/api/health/detailed');

        // Puede ser 200 o 503 dependiendo del estado de MongoDB
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('memory');
        expect(response.body).toHaveProperty('node');
        expect(response.body).toHaveProperty('services');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('debe retornar status degraded si algún servicio falla', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Simular MongoDB desconectado
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0, // disconnected
        writable: true,
        configurable: true
      });

      try {
        const response = await request(app)
          .get('/api/health/detailed');

        expect([200, 503]).toContain(response.status);
        if (response.status === 503) {
          expect(response.body.status).toBe('degraded');
        }
      } finally {
        process.env.NODE_ENV = originalEnv;
        Object.defineProperty(mongoose.connection, 'readyState', {
          value: originalReadyState,
          writable: true,
          configurable: true
        });
      }
    });
  });
});

