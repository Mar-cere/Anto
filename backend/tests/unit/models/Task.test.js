/**
 * Tests unitarios para modelo Task
 * 
 * @author AntoApp Team
 */

import Task from '../../../models/Task.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('Task Model', () => {
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
    it('debe crear una tarea válida', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        description: 'Descripción de la tarea',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
      });

      const error = task.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const task = new Task({
        title: 'Tarea de prueba',
        status: 'pending'
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir title', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe requerir dueDate', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending'
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar status enum', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'invalid-status',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar priority enum', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        priority: 'invalid-priority',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar itemType enum', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        itemType: 'invalid-type',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener subtasks como array', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(task.subtasks).toBeInstanceOf(Array);
    });

    it('debe tener tags como array', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(task.tags).toBeInstanceOf(Array);
    });

    it('debe generar id único automáticamente', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(task.id).toBeDefined();
      expect(typeof task.id).toBe('string');
    });
  });

  describe('Métodos de instancia', () => {
    it('debe marcar tarea como completada', async () => {
      const task = await Task.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await task.markAsCompleted();
      
      expect(task.status).toBe('completed');
      expect(task.completedAt).toBeDefined();
      expect(task.progress).toBe(100);
    });

    it('no debe permitir marcar recordatorio como completado', () => {
      const reminder = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Recordatorio',
        status: 'pending',
        itemType: 'reminder',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(() => reminder.markAsCompleted()).toThrow('Los recordatorios no pueden marcarse como completados');
    });

    it('debe marcar tarea como en progreso', async () => {
      const task = await Task.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await task.markAsInProgress();
      
      expect(task.status).toBe('in_progress');
    });

    it('no debe permitir marcar recordatorio como en progreso', () => {
      const reminder = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Recordatorio',
        status: 'pending',
        itemType: 'reminder',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(() => reminder.markAsInProgress()).toThrow('Los recordatorios no pueden marcarse como en progreso');
    });

    it('debe cancelar tarea', async () => {
      const task = await Task.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await task.cancel();
      
      expect(task.status).toBe('cancelled');
    });

    it('debe agregar subtarea', async () => {
      const task = await Task.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await task.addSubtask('Subtarea 1');
      
      expect(task.subtasks).toHaveLength(1);
      expect(task.subtasks[0].title).toBe('Subtarea 1');
      expect(task.subtasks[0].completed).toBe(false);
    });

    it('debe completar subtarea', async () => {
      const task = await Task.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        subtasks: [
          { title: 'Subtarea 1', completed: false },
          { title: 'Subtarea 2', completed: false }
        ]
      });

      await task.completeSubtask(0);
      
      expect(task.subtasks[0].completed).toBe(true);
      expect(task.subtasks[0].completedAt).toBeDefined();
    });

    it('debe lanzar error al completar subtarea con índice inválido', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(() => task.completeSubtask(0)).toThrow('Índice de subtarea inválido');
    });

    it('debe hacer soft delete', async () => {
      const task = await Task.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await task.softDelete();
      
      expect(task.deletedAt).toBeDefined();
    });
  });

  describe('Propiedades virtuales', () => {
    it('debe calcular isOverdue correctamente', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea vencida',
        status: 'pending',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ayer
      });

      expect(task.isOverdue).toBe(true);
    });

    it('debe retornar false para isOverdue si está completada', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea completada',
        status: 'completed',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      expect(task.isOverdue).toBe(false);
    });

    it('debe calcular daysUntilDue correctamente', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: tomorrow
      });

      expect(task.daysUntilDue).toBeGreaterThanOrEqual(0);
    });

    it('debe calcular completionRate correctamente con subtareas', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        subtasks: [
          { title: 'Subtarea 1', completed: true },
          { title: 'Subtarea 2', completed: false }
        ]
      });

      expect(task.completionRate).toBe(50);
    });

    it('debe retornar 100% completionRate si está completada sin subtareas', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'completed',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(task.completionRate).toBe(100);
    });
  });
});
