/**
 * Tests unitarios para modelo TherapeuticRecord
 * 
 * @author AntoApp Team
 */

import TherapeuticRecord from '../../../models/TherapeuticRecord.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('TherapeuticRecord Model', () => {
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

    it('debe validar intensidad de emoción entre 1 y 10', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId(),
        sessions: [{
          emotion: { name: 'happy', intensity: 11 }
        }]
      });

      const error = record.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar intensidad mínima de emoción', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId(),
        sessions: [{
          emotion: { name: 'happy', intensity: 0 }
        }]
      });

      const error = record.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar métricas de progreso entre 1 y 10', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId(),
        progressMetrics: {
          emotionalStability: 11,
          toolMastery: 5,
          engagementLevel: 5
        }
      });

      const error = record.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener currentStatus con valores por defecto', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId()
      });

      expect(record.currentStatus).toBeDefined();
      expect(record.currentStatus.emotion).toBe('neutral');
      expect(record.currentStatus.lastUpdate).toBeDefined();
    });

    it('debe tener progressMetrics con valores por defecto', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId()
      });

      expect(record.progressMetrics.emotionalStability).toBe(5);
      expect(record.progressMetrics.toolMastery).toBe(1);
      expect(record.progressMetrics.engagementLevel).toBe(5);
    });

    it('debe guardar y recuperar un registro terapéutico', async () => {
      const userId = new mongoose.Types.ObjectId();
      const record = new TherapeuticRecord({
        userId,
        sessions: [{
          emotion: { name: 'tristeza', intensity: 6 },
          tools: ['mindfulness', 'breathing'],
          progress: 'en_curso'
        }],
        activeTools: ['mindfulness'],
        progressMetrics: {
          emotionalStability: 6,
          toolMastery: 3,
          engagementLevel: 7
        }
      });

      await record.save();

      const found = await TherapeuticRecord.findById(record._id);
      expect(found).toBeDefined();
      expect(found.userId.toString()).toBe(userId.toString());
      expect(found.sessions.length).toBe(1);
      expect(found.sessions[0].emotion.name).toBe('tristeza');
      expect(found.activeTools).toContain('mindfulness');
    });

    it('debe permitir múltiples sesiones', () => {
      const record = new TherapeuticRecord({
        userId: new mongoose.Types.ObjectId(),
        sessions: [
          {
            emotion: { name: 'happy', intensity: 8 },
            progress: 'completado'
          },
          {
            emotion: { name: 'neutral', intensity: 5 },
            progress: 'en_curso'
          }
        ]
      });

      expect(record.sessions.length).toBe(2);
    });
  });
});

