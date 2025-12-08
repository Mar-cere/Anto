/**
 * Tests unitarios para rutas de autenticación
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import express from 'express';
import authRoutes from '../../../routes/authRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {

  describe('POST /api/auth/register', () => {
    it('debe rechazar registro sin datos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('debe rechazar registro con email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });

    it('debe rechazar registro con contraseña muy corta', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe rechazar login sin credenciales', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar login con email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('debe rechazar refresh sin token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('debe rechazar reset sin datos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          password: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar reset sin contraseña', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'test@example.com',
          code: 'reset-code'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});

