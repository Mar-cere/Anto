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

    it('debe validar estimatedTime máximo', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        estimatedTime: 1500 // Mayor que 1440 (24 horas)
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar estimatedTime mínimo', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        estimatedTime: -1
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar progress máximo', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        progress: 150 // Mayor que 100
      });

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar progress mínimo', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        progress: -10
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

    it('debe aceptar todos los tipos de itemType válidos', () => {
      const validTypes = ['task', 'reminder'];
      
      validTypes.forEach(type => {
        const task = new Task({
          userId: new mongoose.Types.ObjectId(),
          title: 'Tarea de prueba',
          status: 'pending',
          itemType: type,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const error = task.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('debe validar que parentTask no sea la misma tarea', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      task._id = new mongoose.Types.ObjectId();
      task.parentTask = task._id;

      const error = task.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar repeat.endDate después de dueDate', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 días (antes de dueDate)
        }
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

    it('isOverdue debe retornar false si no hay dueDate', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea sin fecha',
        status: 'pending'
      });

      expect(task.isOverdue).toBe(false);
    });

    it('daysUntilDue debe retornar null si no hay dueDate', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea sin fecha',
        status: 'pending'
      });

      expect(task.daysUntilDue).toBeNull();
    });

    it('isOverdue debe retornar false si está cancelada', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea cancelada',
        status: 'cancelled',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      expect(task.isOverdue).toBe(false);
    });

    it('completionRate debe calcularse correctamente con todas las subtareas completadas', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        subtasks: [
          { title: 'Subtarea 1', completed: true },
          { title: 'Subtarea 2', completed: true },
          { title: 'Subtarea 3', completed: true }
        ]
      });

      expect(task.completionRate).toBe(100);
    });

    it('completionRate debe retornar 0% si no hay subtareas y no está completada', () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(task.completionRate).toBe(0);
    });

    it('daysUntilDue debe calcular días negativos para fechas pasadas', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea vencida',
        status: 'pending',
        dueDate: yesterday
      });

      expect(task.daysUntilDue).toBeLessThan(0);
    });
  });

  describe('Middleware pre-save', () => {
    it('debe establecer completedAt cuando status cambia a completed', async () => {
      const task = new Task({
        userId: new mongoose.Types.ObjectId(),
        title: 'Tarea de prueba',
        status: 'pending',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await task.save();

      task.status = 'completed';
      await task.save();

      expect(task.completedAt).toBeDefined();
    });

    it('debe actualizar progress basado en subtareas al guardar', async () => {
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

      await task.save();

      expect(task.progress).toBe(50);
    });
  });

  describe('Métodos estáticos', () => {
    let userId;

    beforeEach(() => {
      userId = new mongoose.Types.ObjectId();
    });

    it('debe tener método getPendingItems', () => {
      expect(typeof Task.getPendingItems).toBe('function');
    });

    it('debe tener método getOverdueItems', () => {
      expect(typeof Task.getOverdueItems).toBe('function');
    });

    it('debe tener método getStats', () => {
      expect(typeof Task.getStats).toBe('function');
    });

    it('getPendingItems debe retornar array vacío sin tareas', async () => {
      const tasks = await Task.getPendingItems(userId);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(0);
    });

    it('getPendingItems debe filtrar por tipo', async () => {
      const task = new Task({
        userId,
        title: 'Tarea de prueba',
        status: 'pending',
        itemType: 'task',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await task.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const tasks = await Task.getPendingItems(userId, 'task');
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].itemType).toBe('task');
    });

    it('getPendingItems debe filtrar por categoría', async () => {
      const task = new Task({
        userId,
        title: 'Tarea de prueba',
        status: 'pending',
        itemType: 'task',
        category: 'work',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await task.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const tasks = await Task.getPendingItems(userId, null, { category: 'work' });
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].category).toBe('work');
    });

    it('getPendingItems debe filtrar por prioridad', async () => {
      const task = new Task({
        userId,
        title: 'Tarea de prueba',
        status: 'pending',
        itemType: 'task',
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await task.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const tasks = await Task.getPendingItems(userId, null, { priority: 'high' });
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].priority).toBe('high');
    });

    it('getOverdueItems debe retornar tareas vencidas', async () => {
      const task = new Task({
        userId,
        title: 'Tarea vencida',
        status: 'pending',
        itemType: 'task',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ayer
      });
      await task.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const overdueTasks = await Task.getOverdueItems(userId);
      expect(overdueTasks.length).toBeGreaterThan(0);
    });

    it('getOverdueItems no debe retornar tareas completadas', async () => {
      const task = new Task({
        userId,
        title: 'Tarea vencida pero completada',
        status: 'completed',
        itemType: 'task',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });
      await task.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const overdueTasks = await Task.getOverdueItems(userId);
      expect(overdueTasks.length).toBe(0);
    });

    it('getStats debe calcular estadísticas correctamente', async () => {
      // Crear tareas de diferentes tipos y estados
      await Task.create({
        userId,
        title: 'Tarea 1',
        status: 'completed',
        itemType: 'task',
        dueDate: new Date()
      });

      await Task.create({
        userId,
        title: 'Tarea 2',
        status: 'pending',
        itemType: 'task',
        dueDate: new Date()
      });

      await Task.create({
        userId,
        title: 'Recordatorio 1',
        status: 'pending',
        itemType: 'reminder',
        dueDate: new Date()
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await Task.getStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
    });

    it('getPendingItems debe filtrar por categoría', async () => {
      const task = new Task({
        userId,
        title: 'Tarea de prueba',
        status: 'pending',
        category: 'work',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await task.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const tasks = await Task.getPendingItems(userId, null, { category: 'work' });
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('getOverdueItems debe retornar tareas vencidas', async () => {
      const task = new Task({
        userId,
        title: 'Tarea vencida',
        status: 'pending',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ayer
      });
      await task.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const overdue = await Task.getOverdueItems(userId);
      expect(overdue.length).toBeGreaterThan(0);
    });

    it('getStats debe retornar estadísticas vacías sin tareas', async () => {
      const stats = await Task.getStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.total).toBe(0);
    });

    it('getStats debe calcular estadísticas correctamente', async () => {
      const task1 = new Task({
        userId,
        title: 'Tarea 1',
        status: 'completed',
        itemType: 'task',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await task1.save();

      const task2 = new Task({
        userId,
        title: 'Tarea 2',
        status: 'pending',
        itemType: 'task',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await task2.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await Task.getStats(userId);
      
      expect(stats.total).toBeGreaterThan(0);
    });
  });
});
