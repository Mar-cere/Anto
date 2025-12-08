/**
 * Tests unitarios para modelo ResponseFeedback
 * 
 * @author AntoApp Team
 */

import ResponseFeedback from '../../../models/ResponseFeedback.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('ResponseFeedback Model', () => {
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
    it('debe crear un feedback válido', () => {
      const feedback = new ResponseFeedback({
        userId: new mongoose.Types.ObjectId(),
        messageId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        rating: 5,
        feedbackType: 'helpful',
        comment: 'Muy útil la respuesta'
      });

      const error = feedback.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const feedback = new ResponseFeedback({
        messageId: new mongoose.Types.ObjectId(),
        rating: 5
      });

      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir messageId', () => {
      const feedback = new ResponseFeedback({
        userId: new mongoose.Types.ObjectId(),
        rating: 5
      });

      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.messageId).toBeDefined();
    });

    it('debe validar rating entre 1 y 5', () => {
      const feedback = new ResponseFeedback({
        userId: new mongoose.Types.ObjectId(),
        messageId: new mongoose.Types.ObjectId(),
        rating: 6 // Mayor que 5
      });

      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.rating).toBeDefined();
    });

    it('debe validar rating mínimo de 1', () => {
      const feedback = new ResponseFeedback({
        userId: new mongoose.Types.ObjectId(),
        messageId: new mongoose.Types.ObjectId(),
        rating: 0
      });

      const error = feedback.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar feedbackType enum', () => {
      const feedback = new ResponseFeedback({
        userId: new mongoose.Types.ObjectId(),
        messageId: new mongoose.Types.ObjectId(),
        rating: 5,
        feedbackType: 'invalid_type'
      });

      const error = feedback.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.feedbackType).toBeDefined();
    });

    it('debe aceptar todos los tipos de feedback válidos', () => {
      const validTypes = ['helpful', 'not_helpful', 'neutral', 'excellent', 'poor'];
      
      validTypes.forEach(type => {
        const feedback = new ResponseFeedback({
          userId: new mongoose.Types.ObjectId(),
          messageId: new mongoose.Types.ObjectId(),
          conversationId: new mongoose.Types.ObjectId(),
          rating: 3,
          feedbackType: type
        });

        const error = feedback.validateSync();
        expect(error).toBeUndefined();
      });
    });
  });

  describe('Métodos estáticos', () => {
    it('debe tener método getFeedbackStats', () => {
      expect(ResponseFeedback.getFeedbackStats).toBeDefined();
      expect(typeof ResponseFeedback.getFeedbackStats).toBe('function');
    });

    it('getFeedbackStats debe retornar estadísticas vacías sin datos', async () => {
      const userId = new mongoose.Types.ObjectId();
      const stats = await ResponseFeedback.getFeedbackStats(userId, 30);
      
      expect(stats).toBeDefined();
      expect(stats.total).toBe(0);
      expect(stats.byType).toBeDefined();
      expect(typeof stats.byType).toBe('object');
    });

    it('getFeedbackStats debe calcular estadísticas con feedbacks', async () => {
      const userId = new mongoose.Types.ObjectId();
      const messageId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      
      const feedback1 = new ResponseFeedback({
        userId,
        messageId,
        conversationId,
        rating: 5,
        feedbackType: 'helpful'
      });
      await feedback1.save();

      const feedback2 = new ResponseFeedback({
        userId,
        messageId: new mongoose.Types.ObjectId(),
        conversationId,
        rating: 3,
        feedbackType: 'not_helpful'
      });
      await feedback2.save();

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await ResponseFeedback.getFeedbackStats(userId, 30);
      
      expect(stats.total).toBe(2);
      expect(stats.byType).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener metadata como objeto', () => {
      const feedback = new ResponseFeedback({
        userId: new mongoose.Types.ObjectId(),
        messageId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        rating: 5,
        feedbackType: 'helpful',
        metadata: { source: 'mobile' }
      });

      expect(feedback.metadata).toBeDefined();
      expect(typeof feedback.metadata).toBe('object');
    });

    it('debe guardar y recuperar feedback', async () => {
      const userId = new mongoose.Types.ObjectId();
      const messageId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      
      const feedback = new ResponseFeedback({
        userId,
        messageId,
        conversationId,
        rating: 5,
        feedbackType: 'helpful',
        comment: 'Excelente respuesta'
      });

      await feedback.save();

      const found = await ResponseFeedback.findById(feedback._id);
      expect(found).toBeDefined();
      expect(found.userId.toString()).toBe(userId.toString());
      expect(found.rating).toBe(5);
      expect(found.feedbackType).toBe('helpful');
    });
  });
});

