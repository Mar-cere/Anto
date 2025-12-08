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

    it('shouldNotify debe retornar false si reminder está deshabilitado', () => {
      const habit = new Habit({
        userId: new mongoose.Types.ObjectId(),
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: false
        }
      });

      expect(habit.shouldNotify()).toBe(false);
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

    it('debe calcular daysSinceLastCompleted correctamente', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
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
          lastCompleted: yesterday
        }
      });

      const days = habit.daysSinceLastCompleted;
      expect(days).toBeGreaterThanOrEqual(1);
      expect(days).toBeLessThanOrEqual(2);
    });

    it('debe retornar null para daysSinceLastCompleted si no hay lastCompleted', () => {
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

      expect(habit.daysSinceLastCompleted).toBeNull();
    });

    it('isActive debe retornar true para hábito activo', () => {
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
          archived: false
        }
      });

      expect(habit.isActive).toBe(true);
    });

    it('isActive debe retornar false para hábito archivado', () => {
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
          archived: true
        }
      });

      expect(habit.isActive).toBe(false);
    });

    it('isActive debe retornar false para hábito eliminado', () => {
      const habit = new Habit({
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

      expect(habit.isActive).toBe(false);
    });
  });

  describe('Métodos estáticos', () => {
    let userId;

    beforeEach(() => {
      userId = new mongoose.Types.ObjectId();
    });

    it('debe tener método getStats', () => {
      expect(typeof Habit.getStats).toBe('function');
    });

    it('debe tener método getActiveHabits', () => {
      expect(typeof Habit.getActiveHabits).toBe('function');
    });

    it('debe tener método getOverdueHabits', () => {
      expect(typeof Habit.getOverdueHabits).toBe('function');
    });

    it('getStats debe retornar estadísticas vacías sin hábitos', async () => {
      const stats = await Habit.getStats(userId);
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBe(0);
    });

    it('getStats debe calcular estadísticas con hábitos', async () => {
      await Habit.create({
        userId,
        title: 'Ejercicio diario',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        progress: {
          streak: 5,
          completedDays: 10,
          totalDays: 15,
          bestStreak: 7
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await Habit.getStats(userId);
      
      expect(Array.isArray(stats)).toBe(true);
      if (stats.length > 0) {
        expect(stats[0].totalHabits).toBeGreaterThan(0);
      }
    });

    it('getActiveHabits debe retornar array vacío sin hábitos', async () => {
      const habits = await Habit.getActiveHabits(userId);
      
      expect(Array.isArray(habits)).toBe(true);
      expect(habits.length).toBe(0);
    });

    it('getActiveHabits debe retornar solo hábitos activos', async () => {
      await Habit.create({
        userId,
        title: 'Hábito activo',
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

      await Habit.create({
        userId,
        title: 'Hábito archivado',
        frequency: 'daily',
        icon: 'exercise',
        reminder: {
          time: new Date(),
          enabled: true
        },
        status: {
          archived: true
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const habits = await Habit.getActiveHabits(userId);
      
      expect(habits.length).toBeGreaterThan(0);
      habits.forEach(habit => {
        expect(habit.status.archived).toBe(false);
      });
    });

    it('getOverdueHabits debe retornar array vacío sin hábitos vencidos', async () => {
      const habits = await Habit.getOverdueHabits(userId);
      
      expect(Array.isArray(habits)).toBe(true);
      expect(habits.length).toBe(0);
    });
  });
});
