/**
 * Tests unitarios para modelo TherapeuticTechniqueUsage
 * 
 * @author AntoApp Team
 */

import TherapeuticTechniqueUsage from '../../../models/TherapeuticTechniqueUsage.js';
import mongoose from 'mongoose';

describe('TherapeuticTechniqueUsage Model', () => {
  describe('Validaciones', () => {
    it('debe crear un uso de técnica válido', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT'
      });

      const error = usage.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const usage = new TherapeuticTechniqueUsage({
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT'
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });
  });
});

