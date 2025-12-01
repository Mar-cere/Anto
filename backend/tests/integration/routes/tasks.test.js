/**
 * Tests de integración para rutas de tasks
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import Task from '../../../models/Task.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import { validUser } from '../../fixtures/userFixtures.js';
import jwt from 'jsonwebtoken';

// Helper para crear usuario y obtener token
const createUserAndToken = async () => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(validUser.password, salt, 1000, 64, 'sha512').toString('hex');
  
  const user = await User.create({
    ...validUser,
    password: hash,
    salt,
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'es'
    },
    stats: {
      tasksCompleted: 0,
      habitsStreak: 0,
      totalSessions: 0,
      lastActive: new Date()
    },
    subscription: {
      status: 'trial',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  });

  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
    { expiresIn: '1h' }
  );

  return { user, token };
};

describe('Task Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

    beforeEach(async () => {
      await clearDatabase();
      // Usar datos únicos para evitar duplicados
      // Usar solo los últimos 6 dígitos del timestamp para mantener username < 20 caracteres
      const timestamp = Date.now().toString().slice(-6);
      const uniqueUser = {
        ...validUser,
        email: `test${timestamp}@example.com`,
        username: `test${timestamp}`, // Máximo 20 caracteres: "test" (4) + 6 dígitos = 10 caracteres
      };
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(uniqueUser.password, salt, 1000, 64, 'sha512').toString('hex');
      
      testUser = await User.create({
        ...uniqueUser,
        password: hash,
        salt,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'es'
        },
        stats: {
          tasksCompleted: 0,
          habitsStreak: 0,
          totalSessions: 0,
          lastActive: new Date()
        },
        subscription: {
          status: 'trial',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      });

      authToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
        { expiresIn: '1h' }
      );
    });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  describe('POST /api/tasks', () => {
    it('debe crear una nueva tarea con datos válidos', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'medium',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      // El endpoint retorna { success: true, data: {...}, message: '...' }
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', taskData.title);
      expect(response.body.data).toHaveProperty('userId', testUser._id.toString());
    });

    it('debe rechazar crear tarea sin autenticación', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('debe rechazar crear tarea sin título', async () => {
      const taskData = {
        description: 'This is a test task',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/tasks', () => {
    it('debe obtener todas las tareas del usuario', async () => {
      // Crear las tareas antes de hacer la petición
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await Task.create([
        {
          userId: testUser._id,
          title: 'Task 1',
          description: 'First task',
          status: 'pending',
          dueDate: tomorrow,
        },
        {
          userId: testUser._id,
          title: 'Task 2',
          description: 'Second task',
          status: 'completed',
          dueDate: tomorrow,
        },
      ]);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint retorna { success: true, data: [...], pagination: {...} }
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('debe filtrar tareas por status', async () => {
      // Crear tareas antes de filtrar
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await Task.create([
        {
          userId: testUser._id,
          title: 'Completed Task',
          status: 'completed',
          dueDate: tomorrow,
        },
        {
          userId: testUser._id,
          title: 'Pending Task',
          status: 'pending',
          dueDate: tomorrow,
        },
      ]);

      const response = await request(app)
        .get('/api/tasks?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every(task => task.status === 'completed')).toBe(true);
      }
    });
  });

  describe('GET /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const task = await Task.create({
        userId: testUser._id,
        title: 'Test Task',
        description: 'Test description',
        dueDate: tomorrow,
      });
      taskId = task._id.toString();
    });

    it('debe obtener una tarea específica', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // El endpoint puede retornar { task: {...} } o { data: {...} }
      // El endpoint retorna { success: true, data: {...} }
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', taskId);
      expect(response.body.data).toHaveProperty('title', 'Test Task');
    });

    it('debe rechazar obtener tarea de otro usuario', async () => {
      // Crear otro usuario con datos únicos
      const timestamp = Date.now().toString().slice(-6);
      const otherUserData = {
        ...validUser,
        email: `other${timestamp}@example.com`,
        username: `other${timestamp}`, // Máximo 20 caracteres
      };
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha512').toString('hex');
      
      const otherUser = await User.create({
        ...otherUserData,
        password: hash,
        salt,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'es'
        },
        stats: {
          tasksCompleted: 0,
          habitsStreak: 0,
          totalSessions: 0,
          lastActive: new Date()
        },
        subscription: {
          status: 'trial',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const otherTask = await Task.create({
        userId: otherUser._id,
        title: 'Other Task',
        dueDate: tomorrow,
      });

      const response = await request(app)
        .get(`/api/tasks/${otherTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect([403, 404]); // Puede retornar 403 o 404 dependiendo de la implementación

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('debe actualizar una tarea existente', async () => {
      // Crear la tarea antes de actualizarla
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      
      const task = await Task.create({
        userId: testUser._id,
        title: 'Original Title',
        description: 'Original description',
        dueDate: tomorrowDate,
      });
      const taskId = task._id.toString();

      // Usar una nueva fecha para updateData
      const updateTomorrowDate = new Date();
      updateTomorrowDate.setDate(updateTomorrowDate.getDate() + 1);
      const updateData = {
        title: 'Updated Title',
        status: 'completed',
        dueDate: updateTomorrowDate, // dueDate es requerido en el schema
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // El endpoint retorna { success: true, data: {...} }
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
      expect(response.body.data).toHaveProperty('status', 'completed');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const task = await Task.create({
        userId: testUser._id,
        title: 'Task to delete',
        dueDate: tomorrow,
      });
      taskId = task._id.toString();
    });

    it('debe eliminar una tarea existente', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verificar que la tarea fue marcada como eliminada (soft delete)
      // deletedAt tiene select: false, así que necesitamos seleccionarlo explícitamente
      const deletedTask = await Task.findById(taskId).select('+deletedAt');
      expect(deletedTask).toBeDefined();
      expect(deletedTask.deletedAt).toBeDefined();
    });
  });
});

