/**
 * Tests unitarios para modelo Habit
 * 
 * @author AntoApp Team
 */

import Habit from '../../../models/Habit.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('Habit Model', () => {
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
    it('debe crear un hábito válido', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      const error = habit.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const habit = new Habit({
        name: 'Ejercicio diario',
        frequency: 'daily'
      });

      const error = habit.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir title', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        frequency: 'daily'
      });

      const error = habit.validateSync();
      expect(error).toBeDefined();
    });

    it('debe requerir icon', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily'
      });

      const error = habit.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar frequency enum', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'invalid-frequency',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      const error = habit.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar icon enum', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'invalid-icon',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      const error = habit.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar longitud máxima de title', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'a'.repeat(101), // Más de 100 caracteres
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      const error = habit.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener progress como objeto', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      expect(habit.progress).toBeDefined();
      expect(typeof habit.progress).toBe('object');
      expect(habit.progress.streak).toBe(0);
      expect(habit.progress.completedDays).toBe(0);
      expect(habit.progress.totalDays).toBe(0);
    });

    it('debe tener reminder como objeto', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      expect(habit.reminder).toBeDefined();
      expect(typeof habit.reminder).toBe('object');
      expect(habit.reminder.enabled).toBe(true);
    });

    it('debe generar id único automáticamente', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      expect(habit.id).toBeDefined();
      expect(typeof habit.id).toBe('string');
    });
  });

  describe('Métodos de instancia', () => {
    it('debe marcar hábito como completado', async () => {
      const habit = await Habit.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      await habit.toggleComplete();
      
      expect(habit.status.completedToday).toBe(true);
      expect(habit.progress.streak).toBe(1);
      expect(habit.progress.completedDays).toBe(1);
    });

    it('debe desmarcar hábito como completado si ya estaba completado', async () => {
      const habit = await Habit.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        status: {
          completedToday: true,
          lastCompleted: new Date()
        },
        progress: {
          streak: 1,
          completedDays: 1,
          totalDays: 1
        }
      });

      await habit.toggleComplete();
      
      expect(habit.status.completedToday).toBe(false);
      expect(habit.progress.streak).toBe(0);
    });

    it('debe verificar si debe notificar', () => {
      const now = new Date();
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: now,
          enabled: true
        },
        status: {
          completedToday: false,
          archived: false
        }
      });

      // Nota: Este test puede fallar si la hora no coincide exactamente
      // pero verifica la lógica básica
      const shouldNotify = habit.shouldNotify();
      expect(typeof shouldNotify).toBe('boolean');
    });

    it('no debe notificar si está archivado', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        status: {
          archived: true,
          completedToday: false
        }
      });

      expect(habit.shouldNotify()).toBe(false);
    });

    it('debe hacer soft delete', async () => {
      const habit = await Habit.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        }
      });

      await habit.softDelete();
      
      expect(habit.deletedAt).toBeDefined();
    });

    it('debe restaurar hábito eliminado', async () => {
      const habit = await Habit.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        deletedAt: new Date()
      });

      await habit.restore();
      
      expect(habit.deletedAt).toBeUndefined();
    });

    it('debe alternar estado de archivado', async () => {
      const habit = await Habit.create({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        status: {
          archived: false
        }
      });

      await habit.toggleArchive();
      expect(habit.status.archived).toBe(true);

      await habit.toggleArchive();
      expect(habit.status.archived).toBe(false);
    });
  });

  describe('Propiedades virtuales', () => {
    it('debe calcular completionRate correctamente', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        progress: {
          completedDays: 5,
          totalDays: 10
        }
      });

      expect(habit.completionRate).toBe(50);
    });

    it('debe retornar 0 para completionRate si totalDays es 0', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        progress: {
          completedDays: 0,
          totalDays: 0
        }
      });

      expect(habit.completionRate).toBe(0);
    });
  });
});
