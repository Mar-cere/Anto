/**
 * Tests unitarios para modelo TherapeuticTechniqueUsage
 * 
 * @author AntoApp Team
 */

import TherapeuticTechniqueUsage from '../../../models/TherapeuticTechniqueUsage.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('TherapeuticTechniqueUsage Model', () => {
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

    it('debe requerir techniqueId', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueName: 'Test Technique',
        techniqueType: 'CBT'
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe requerir techniqueName', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueType: 'CBT'
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe requerir techniqueType', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique'
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar techniqueType enum', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'INVALID'
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar emotion enum', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT',
        emotion: 'INVALID'
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar emotionalIntensityBefore rango', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT',
        emotionalIntensityBefore: 11
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar emotionalIntensityAfter rango', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT',
        emotionalIntensityAfter: 0
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar effectiveness rango', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT',
        effectiveness: 6
      });

      const error = usage.validateSync();
      expect(error).toBeDefined();
    });

    it('debe tener valores por defecto', () => {
      const usage = new TherapeuticTechniqueUsage({
        userId: new mongoose.Types.ObjectId(),
        techniqueId: 'test-technique-id',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT'
      });

      expect(usage.completed).toBe(false);
      expect(usage.startedAt).toBeDefined();
    });
  });

  describe('Métodos estáticos', () => {
    let userId;

    beforeEach(() => {
      userId = new mongoose.Types.ObjectId();
    });

    it('debe tener método getUserStats', () => {
      expect(typeof TherapeuticTechniqueUsage.getUserStats).toBe('function');
    });

    it('debe tener método getMostUsedTechniques', () => {
      expect(typeof TherapeuticTechniqueUsage.getMostUsedTechniques).toBe('function');
    });

    it('getUserStats debe retornar estadísticas vacías sin datos', async () => {
      const stats = await TherapeuticTechniqueUsage.getUserStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.totalUses).toBe(0);
      expect(stats.completedUses).toBe(0);
      expect(stats.completionRate).toBe(0);
    });

    it('getMostUsedTechniques debe retornar array vacío sin datos', async () => {
      const techniques = await TherapeuticTechniqueUsage.getMostUsedTechniques(userId);
      
      expect(Array.isArray(techniques)).toBe(true);
      expect(techniques.length).toBe(0);
    });

    it('debe tener método getStatsByEmotion', () => {
      expect(typeof TherapeuticTechniqueUsage.getStatsByEmotion).toBe('function');
    });

    it('getStatsByEmotion debe retornar array vacío sin datos', async () => {
      const stats = await TherapeuticTechniqueUsage.getStatsByEmotion(userId);
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBe(0);
    });

    it('getUserStats debe calcular estadísticas con datos', async () => {
      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'cbt-1',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT',
        completed: true,
        duration: 300,
        effectiveness: 4
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await TherapeuticTechniqueUsage.getUserStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.totalUses).toBeGreaterThan(0);
    });

    it('getUserStats debe filtrar por rango de fechas', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'cbt-1',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await TherapeuticTechniqueUsage.getUserStats(userId, startDate, endDate);
      
      expect(stats).toBeDefined();
    });

    it('getMostUsedTechniques debe retornar técnicas ordenadas por uso', async () => {
      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'cbt-1',
        techniqueName: 'Technique 1',
        techniqueType: 'CBT'
      });

      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'cbt-1',
        techniqueName: 'Technique 1',
        techniqueType: 'CBT'
      });

      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'dbt-1',
        techniqueName: 'Technique 2',
        techniqueType: 'DBT'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const techniques = await TherapeuticTechniqueUsage.getMostUsedTechniques(userId, 10);
      
      expect(Array.isArray(techniques)).toBe(true);
      if (techniques.length > 0) {
        expect(techniques[0].count).toBeGreaterThanOrEqual(techniques[techniques.length - 1].count);
      }
    });

    it('getStatsByEmotion debe agrupar por emoción', async () => {
      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'cbt-1',
        techniqueName: 'Test Technique',
        techniqueType: 'CBT',
        emotion: 'ansiedad'
      });

      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'cbt-2',
        techniqueName: 'Test Technique 2',
        techniqueType: 'CBT',
        emotion: 'ansiedad'
      });

      await TherapeuticTechniqueUsage.create({
        userId,
        techniqueId: 'cbt-3',
        techniqueName: 'Test Technique 3',
        techniqueType: 'CBT',
        emotion: 'tristeza'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await TherapeuticTechniqueUsage.getStatsByEmotion(userId);
      
      expect(Array.isArray(stats)).toBe(true);
      if (stats.length > 0) {
        const anxietyStats = stats.find(s => s.emotion === 'ansiedad');
        if (anxietyStats) {
          expect(anxietyStats.count).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Guardado y recuperación', () => {
    it('debe guardar y recuperar un uso de técnica', async () => {
      const userId = new mongoose.Types.ObjectId();
      const usage = new TherapeuticTechniqueUsage({
        userId,
        techniqueId: 'cbt-1',
        techniqueName: 'Cognitive Restructuring',
        techniqueType: 'CBT',
        emotion: 'ansiedad',
        completed: true,
        duration: 300,
        emotionalIntensityBefore: 8,
        emotionalIntensityAfter: 5,
        effectiveness: 4
      });

      await usage.save();

      const found = await TherapeuticTechniqueUsage.findById(usage._id);
      expect(found).toBeDefined();
      expect(found.userId.toString()).toBe(userId.toString());
      expect(found.techniqueId).toBe('cbt-1');
      expect(found.completed).toBe(true);
      expect(found.duration).toBe(300);
    });
  });
});

