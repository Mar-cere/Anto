/**
 * Tests unitarios para el modelo Task
 *
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import Task from '../../../models/Task.js';
import User from '../../../models/User.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('Task Model', () => {
  let testUserId;

  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Crear un usuario de prueba en cada test usando el modelo real
    const timestamp = Date.now().toString().slice(-6);
    const user = await User.create({
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: 'hashedpassword',
      salt: 'salt',
    });
    testUserId = user._id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('debe crear y guardar una tarea exitosamente', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskData = {
      title: 'Test Task',
      description: 'Test description',
      dueDate: tomorrow,
      userId: testUserId,
      priority: 'medium',
      status: 'pending'
    };
    const validTask = new Task(taskData);
    const savedTask = await validTask.save();
    expect(savedTask._id).toBeDefined();
    expect(savedTask.title).toBe(taskData.title);
    expect(savedTask.userId.toString()).toBe(testUserId.toString());
  });

  it('no debe guardar una tarea sin título', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskData = {
      description: 'Test description',
      dueDate: tomorrow,
      userId: testUserId
    };
    const taskWithoutTitle = new Task(taskData);
    await expect(taskWithoutTitle.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('no debe guardar una tarea sin dueDate', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test description',
      userId: testUserId
    };
    const taskWithoutDueDate = new Task(taskData);
    await expect(taskWithoutDueDate.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que el status sea válido', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskData = {
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId,
      status: 'invalid-status'
    };
    const taskWithInvalidStatus = new Task(taskData);
    await expect(taskWithInvalidStatus.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que la prioridad sea válida', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskData = {
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId,
      priority: 'invalid-priority'
    };
    const taskWithInvalidPriority = new Task(taskData);
    await expect(taskWithInvalidPriority.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe tener valores por defecto correctos', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskData = {
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId
    };
    const task = await Task.create(taskData);
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
    expect(task.itemType).toBe('task');
    expect(task.category).toBe('General');
    expect(Array.isArray(task.tags)).toBe(true);
    expect(task.tags.length).toBe(0);
  });

  it('debe generar un ID único automáticamente', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const task = await Task.create({
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId
    });
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('string');
    expect(task.id.length).toBeGreaterThan(0);
  });

  it('debe excluir campos sensibles en toJSON', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const task = await Task.create({
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId
    });

    const taskObject = task.toJSON();
    // __v puede estar presente dependiendo de la configuración del modelo
    // deletedAt no debe estar presente (tiene select: false)
    expect(taskObject).not.toHaveProperty('deletedAt');
    // Verificar que tiene los campos esperados
    expect(taskObject).toHaveProperty('title');
    expect(taskObject).toHaveProperty('id');
  });

  it('debe calcular daysUntilDue correctamente', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const task = await Task.create({
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId
    });

    expect(task.daysUntilDue).toBeDefined();
    expect(task.daysUntilDue).toBeGreaterThanOrEqual(0);
  });

  it('debe marcar tarea como completada', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const task = await Task.create({
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId
    });

    await task.markAsCompleted();
    // Recargar la tarea desde la base de datos usando el documento guardado
    await task.save();
    const updatedTask = await Task.findById(task._id);
    expect(updatedTask).not.toBeNull();
    expect(updatedTask.status).toBe('completed');
    expect(updatedTask.completedAt).toBeDefined();
  });

  it('debe realizar soft delete correctamente', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const task = await Task.create({
      title: 'Test Task',
      dueDate: tomorrow,
      userId: testUserId
    });

    await task.softDelete();
    const deletedTask = await Task.findById(task._id).select('+deletedAt');
    expect(deletedTask.deletedAt).toBeDefined();
  });
});

