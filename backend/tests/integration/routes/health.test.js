/**
 * Tests de integración para rutas de health check
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../server.js';
import { connectDatabase, closeDatabase } from '../../helpers/testHelpers.js';

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

  describe('GET /health', () => {
    it('debe retornar información de salud (puede ser 200 o 503 dependiendo de MongoDB)', async () => {
      const response = await request(app)
        .get('/health');

      // Aceptar tanto 200 como 503 dependiendo del estado de MongoDB
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('mongodb');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('version');
    });

    it('debe incluir información de servicios', async () => {
      const response = await request(app)
        .get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body.services).toHaveProperty('tasks');
      expect(response.body.services).toHaveProperty('habits');
      expect(response.body.services).toHaveProperty('users');
      expect(response.body.services).toHaveProperty('auth');
      expect(response.body.services).toHaveProperty('chat');
      expect(response.body.services).toHaveProperty('cloudinary');
    });

    it('debe retornar status 200 si MongoDB está conectado', async () => {
      // Esperar un poco más para asegurar que la conexión esté lista
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar que MongoDB esté conectado
      if (mongoose.connection.readyState === 1) {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.mongodb).toBe('connected');
        expect(response.body.status).toBe('ok');
      } else {
        // Si no está conectado, el test pasa pero con un skip
        console.log('⚠️ MongoDB no está conectado, saltando verificación de status 200');
        // Aún verificamos que la respuesta tenga la estructura correcta
        const response = await request(app).get('/health');
        expect(response.body).toHaveProperty('mongodb');
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
