/**
 * Tests unitarios para modelo ResponseFeedback
 * 
 * @author AntoApp Team
 */

import ResponseFeedback from '../../../models/ResponseFeedback.js';
import mongoose from 'mongoose';

describe('ResponseFeedback Model', () => {
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
  });

  describe('Métodos estáticos', () => {
    it('debe tener método getFeedbackStats', () => {
      expect(ResponseFeedback.getFeedbackStats).toBeDefined();
      expect(typeof ResponseFeedback.getFeedbackStats).toBe('function');
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
  });
});

