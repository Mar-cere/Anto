/**
 * Tests unitarios para modelo User
 * 
 * @author AntoApp Team
 */

import User from '../../../models/User.js';
import crypto from 'crypto';

describe('User Model', () => {
  describe('comparePassword', () => {
    it('debe comparar correctamente una contraseña válida', () => {
      const password = 'testpassword123';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hash,
        salt: salt,
      });

      expect(user.comparePassword(password)).toBe(true);
    });

    it('debe rechazar una contraseña incorrecta', () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hash,
        salt: salt,
      });

      expect(user.comparePassword(wrongPassword)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('debe excluir campos sensibles del JSON', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'salt123',
        resetPasswordCode: 'code123',
        resetPasswordExpires: new Date(),
      });

      const json = user.toJSON();

      expect(json).not.toHaveProperty('password');
      expect(json).not.toHaveProperty('salt');
      expect(json).not.toHaveProperty('resetPasswordCode');
      expect(json).not.toHaveProperty('resetPasswordExpires');
      expect(json).not.toHaveProperty('__v');
      expect(json).toHaveProperty('username', 'testuser');
      expect(json).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('updateLastActive', () => {
    it('debe actualizar lastActive y totalSessions', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'salt123',
        stats: {
          totalSessions: 5,
          lastActive: new Date('2024-01-01'),
        },
      });

      const originalSessions = user.stats.totalSessions;
      const originalLastActive = user.stats.lastActive;

      // Mock save method
      user.save = async function() {
        return this;
      };

      await user.updateLastActive();

      expect(user.stats.totalSessions).toBe(originalSessions + 1);
      expect(user.stats.lastActive.getTime()).toBeGreaterThan(originalLastActive.getTime());
    });
  });

  describe('incrementTasksCompleted', () => {
    it('debe incrementar tasksCompleted', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'salt123',
        stats: {
          tasksCompleted: 10,
        },
      });

      // Mock save method
      user.save = async function() {
        return this;
      };

      await user.incrementTasksCompleted();

      expect(user.stats.tasksCompleted).toBe(11);
    });
  });

  describe('updateHabitsStreak', () => {
    it('debe actualizar habitsStreak si el nuevo valor es mayor', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'salt123',
        stats: {
          habitsStreak: 5,
        },
      });

      // Mock save method
      user.save = async function() {
        return this;
      };

      await user.updateHabitsStreak(10);

      expect(user.stats.habitsStreak).toBe(10);
    });

    it('no debe actualizar habitsStreak si el nuevo valor es menor', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'salt123',
        stats: {
          habitsStreak: 10,
        },
      });

      // Mock save method
      user.save = async function() {
        return this;
      };

      await user.updateHabitsStreak(5);

      expect(user.stats.habitsStreak).toBe(10);
    });
  });

  describe('Validaciones', () => {
    it('debe validar formato de email', () => {
      const user = new User({
        username: 'testuser',
        email: 'invalid-email',
        password: 'hashedpassword',
        salt: 'salt123',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('debe validar longitud mínima de username', () => {
      const user = new User({
        username: 'ab', // Mínimo es 3
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'salt123',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
    });

    it('debe validar formato de username (solo letras minúsculas, números y guiones bajos)', () => {
      const user = new User({
        username: 'TestUser!', // Contiene mayúsculas y caracteres especiales
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'salt123',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
    });
  });
});

