/**
 * Tests unitarios para modelo UserGoals
 * 
 * @author AntoApp Team
 */

import UserGoals from '../../../models/UserGoals.js';
import mongoose from 'mongoose';

describe('UserGoals Model', () => {
  describe('Validaciones', () => {
    it('debe crear un goal válido', () => {
      const goal = new UserGoals({
        userId: new mongoose.Types.ObjectId(),
        goals: [{
          description: 'Mejorar mi bienestar emocional',
          status: 'active'
        }]
      });

      const error = goal.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const goal = new UserGoals({
        goals: [{
          description: 'Test goal'
        }]
      });

      const error = goal.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir description en goals', () => {
      const goal = new UserGoals({
        userId: new mongoose.Types.ObjectId(),
        goals: [{
          status: 'active'
        }]
      });

      const error = goal.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar status enum en goals', () => {
      const goal = new UserGoals({
        userId: new mongoose.Types.ObjectId(),
        goals: [{
          description: 'Test goal',
          status: 'invalid_status'
        }]
      });

      const error = goal.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener un array de goals', () => {
      const goal = new UserGoals({
        userId: new mongoose.Types.ObjectId(),
        goals: [{
          description: 'Test goal',
          status: 'active'
        }]
      });

      expect(goal.goals).toBeInstanceOf(Array);
      expect(goal.goals.length).toBe(1);
      expect(goal.goals[0].description).toBe('Test goal');
    });

    it('debe validar progress entre 0 y 1', () => {
      const goal = new UserGoals({
        userId: new mongoose.Types.ObjectId(),
        goals: [{
          description: 'Test goal',
          progress: 1.5 // Mayor que 1
        }]
      });

      const error = goal.validateSync();
      expect(error).toBeDefined();
    });
  });
});

