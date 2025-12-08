/**
 * Tests unitarios para modelo UserInsight
 * 
 * @author AntoApp Team
 */

import UserInsight from '../../../models/UserInsight.js';
import mongoose from 'mongoose';

describe('UserInsight Model', () => {
  describe('Validaciones', () => {
    it('debe crear un insight válido', () => {
      const insight = new UserInsight({
        userId: new mongoose.Types.ObjectId(),
        interactions: [{
          emotion: 'happy',
          intensity: 7
        }]
      });

      const error = insight.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const insight = new UserInsight({
        interactions: []
      });

      const error = insight.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe validar intensity entre 0 y 10', () => {
      const insight = new UserInsight({
        userId: new mongoose.Types.ObjectId(),
        interactions: [{
          emotion: 'happy',
          intensity: 15 // Mayor que 10
        }]
      });

      const error = insight.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener arrays para interactions, recurringPatterns y activeGoals', () => {
      const insight = new UserInsight({
        userId: new mongoose.Types.ObjectId(),
        interactions: [],
        recurringPatterns: ['pattern1'],
        activeGoals: ['goal1']
      });

      expect(insight.interactions).toBeInstanceOf(Array);
      expect(insight.recurringPatterns).toBeInstanceOf(Array);
      expect(insight.activeGoals).toBeInstanceOf(Array);
    });
  });
});

