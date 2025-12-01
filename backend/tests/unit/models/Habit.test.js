/**
 * Tests unitarios para el modelo Habit
 *
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import Habit from '../../../models/Habit.js';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';
import crypto from 'crypto';

describe('Habit Model', () => {
  let testUserId;

  beforeAll(async () => {
    await connectDatabase();
    // Crear un usuario de prueba
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      username: String,
    }));
    const user = await User.create({ email: 'test@example.com', username: 'testuser' });
    testUserId = user._id;
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('debe crear y guardar un hábito exitosamente', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      title: 'Ejercicio diario',
      description: 'Hacer ejercicio todos los días',
      icon: 'exercise',
      frequency: 'daily',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    const validHabit = new Habit(habitData);
    const savedHabit = await validHabit.save();
    expect(savedHabit._id).toBeDefined();
    expect(savedHabit.title).toBe(habitData.title);
    expect(savedHabit.icon).toBe(habitData.icon);
    expect(savedHabit.frequency).toBe(habitData.frequency);
  });

  it('no debe guardar un hábito sin título', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      icon: 'exercise',
      frequency: 'daily',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    const habitWithoutTitle = new Habit(habitData);
    await expect(habitWithoutTitle.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('no debe guardar un hábito sin icono', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      title: 'Test Habit',
      frequency: 'daily',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    const habitWithoutIcon = new Habit(habitData);
    await expect(habitWithoutIcon.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe usar frecuencia por defecto si no se proporciona', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      title: 'Test Habit',
      icon: 'exercise',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    // La frecuencia tiene un valor por defecto 'daily', así que no debe fallar
    const habitWithoutFrequency = new Habit(habitData);
    const savedHabit = await habitWithoutFrequency.save();
    expect(savedHabit.frequency).toBe('daily'); // Valor por defecto
  });

  it('debe validar que el icono sea válido', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      title: 'Test Habit',
      icon: 'invalid-icon',
      frequency: 'daily',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    const habitWithInvalidIcon = new Habit(habitData);
    await expect(habitWithInvalidIcon.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe validar que la frecuencia sea válida', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      title: 'Test Habit',
      icon: 'exercise',
      frequency: 'invalid-frequency',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    const habitWithInvalidFrequency = new Habit(habitData);
    await expect(habitWithInvalidFrequency.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('debe tener valores por defecto correctos', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      title: 'Test Habit',
      icon: 'exercise',
      frequency: 'daily',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    const habit = await Habit.create(habitData);
    expect(habit.priority).toBe('medium');
    expect(habit.status.completedToday).toBe(false);
    expect(habit.status.archived).toBe(false);
    expect(habit.progress.streak).toBe(0);
    expect(habit.progress.completedDays).toBe(0);
  });

  it('debe generar un ID único automáticamente', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habitData = {
      title: 'Test Habit',
      icon: 'exercise',
      frequency: 'daily',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    };
    const habit = await Habit.create(habitData);
    expect(habit.id).toBeDefined();
    expect(typeof habit.id).toBe('string');
    expect(habit.id.length).toBeGreaterThan(0);
  });

  it('debe excluir campos sensibles en toJSON', async () => {
    const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
    const habit = await Habit.create({
      title: 'Test Habit',
      icon: 'exercise',
      frequency: 'daily',
      userId: testUserId,
      reminder: {
        time: reminderTime,
        enabled: true
      }
    });

    const habitObject = habit.toJSON();
    // __v puede estar presente dependiendo de la configuración del modelo
    // deletedAt no debe estar presente (tiene select: false)
    expect(habitObject).not.toHaveProperty('deletedAt');
    // Verificar que tiene los campos esperados
    expect(habitObject).toHaveProperty('title');
    expect(habitObject).toHaveProperty('id');
  });
});

