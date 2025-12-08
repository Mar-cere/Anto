/**
 * Tests unitarios para modelo TherapeuticRecord
 * 
 * @author AntoApp Team
 */

import TherapeuticRecord from '../../../models/TherapeuticRecord.js';
import mongoose from 'mongoose';

describe('TherapeuticRecord Model', () => {
  describe('Validaciones', () => {
    it('debe crear un registro terapéutico válido', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId(),
        sessions: [{
          emotion: { name: 'happy', intensity: 7 },
          progress: 'en_curso'
        }]
      });

      const error = record.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const record = new TherapeuticRecord({
        sessions: []
      });

      const error = record.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe tener valores por defecto para sessions y activeTools', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId()
      });

      expect(record.sessions).toBeInstanceOf(Array);
      expect(record.activeTools).toBeInstanceOf(Array);
      expect(record.progressMetrics).toBeDefined();
    });

    it('debe tener estructura correcta con valores por defecto', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId()
      });

      expect(record.sessions).toBeInstanceOf(Array);
      expect(record.activeTools).toBeInstanceOf(Array);
      expect(record.progressMetrics).toBeDefined();
    });
  });
});

