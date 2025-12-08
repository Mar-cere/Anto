/**
 * Tests unitarios para modelo UserProgress
 * 
 * @author AntoApp Team
 */

import UserProgress from '../../../models/UserProgress.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('UserProgress Model', () => {
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
    it('debe crear un progreso válido', () => {
      const progress = new UserProgress({
        userId: new mongoose.Types.ObjectId(),
        entries: []
      });

      const error = progress.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const progress = new UserProgress({
        entries: []
      });

      const error = progress.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe validar intensidad emocional en rango 1-10', () => {
      const progress = new UserProgress({
        userId: new mongoose.Types.ObjectId(),
        entries: [{
          emotionalState: {
            mainEmotion: 'tristeza',
            intensity: 11 // Fuera de rango
          },
          context: {
            topic: 'test'
          }
        }]
      });

      const error = progress.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe('Métodos de instancia', () => {
    it('debe agregar entrada de progreso', async () => {
      const userId = new mongoose.Types.ObjectId();
      const progress = await UserProgress.create({
        userId,
        entries: []
      });

      const entryData = {
        emotionalState: {
          mainEmotion: 'tristeza',
          intensity: 7
        },
        context: {
          topic: 'test topic'
        },
        sessionMetrics: {
          duration: 30,
          messageCount: 5,
          responseQuality: 4
        }
      };

      await progress.addProgressEntry(entryData);
      
      const updated = await UserProgress.findById(progress._id);
      expect(updated.entries).toHaveLength(1);
      expect(updated.entries[0].emotionalState.mainEmotion).toBe('tristeza');
    });

    it('debe actualizar métricas generales', async () => {
      const userId = new mongoose.Types.ObjectId();
      const progress = await UserProgress.create({
        userId,
        entries: [{
          emotionalState: {
            mainEmotion: 'tristeza',
            intensity: 7
          },
          context: {
            topic: 'test topic'
          },
          sessionMetrics: {
            duration: 30,
            messageCount: 5,
            responseQuality: 4
          }
        }]
      });

      await progress.updateOverallMetrics();
      
      expect(progress.overallMetrics.totalSessions).toBe(1);
      expect(progress.overallMetrics.averageSessionDuration).toBe(30);
      expect(progress.overallMetrics.emotionalTrends.averageIntensity).toBe(7);
    });

    it('debe obtener resumen de progreso', async () => {
      const userId = new mongoose.Types.ObjectId();
      const progress = await UserProgress.create({
        userId,
        entries: [{
          timestamp: new Date(),
          emotionalState: {
            mainEmotion: 'tristeza',
            intensity: 7
          },
          context: {
            topic: 'test topic'
          },
          insights: ['insight 1']
        }],
        goals: [{
          description: 'Test goal',
          status: 'en_progreso'
        }]
      });

      const summary = progress.getProgressSummary(30);
      
      expect(summary).toHaveProperty('recentProgress');
      expect(summary).toHaveProperty('overallMetrics');
      expect(summary.recentProgress.totalSessions).toBe(1);
    });

    it('debe analizar emociones recientes', () => {
      const progress = new UserProgress({
        userId: new mongoose.Types.ObjectId(),
        entries: []
      });

      const entries = [{
        emotionalState: {
          mainEmotion: 'tristeza',
          intensity: 7
        }
      }, {
        emotionalState: {
          mainEmotion: 'tristeza',
          intensity: 8
        }
      }];

      const analysis = progress.analyzeRecentEmotions(entries);
      
      expect(analysis).toHaveProperty('predominantEmotions');
      expect(analysis).toHaveProperty('averageIntensity');
      expect(analysis.averageIntensity).toBe(7.5);
    });

    it('debe obtener insights recientes', () => {
      const progress = new UserProgress({
        userId: new mongoose.Types.ObjectId(),
        entries: []
      });

      const entries = [{
        insights: [
          { type: 'insight 1', timestamp: new Date() },
          { type: 'insight 2', timestamp: new Date() }
        ]
      }];

      const insights = progress.getRecentInsights(entries);
      
      expect(insights).toHaveLength(2);
    });

    it('debe retornar array vacío para emociones sin entradas', () => {
      const progress = new UserProgress({
        userId: new mongoose.Types.ObjectId(),
        entries: []
      });

      const analysis = progress.analyzeRecentEmotions([]);
      
      expect(analysis.predominantEmotions).toEqual([]);
      expect(analysis.averageIntensity).toBe(0);
    });
  });
});

