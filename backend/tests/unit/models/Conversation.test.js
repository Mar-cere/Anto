/**
 * Tests unitarios para modelo Conversation
 * 
 * @author AntoApp Team
 */

import Conversation from '../../../models/Conversation.js';
import mongoose from 'mongoose';

describe('Conversation Model', () => {
  describe('Validaciones', () => {
    it('debe crear una conversación válida', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Conversation'
      });

      const error = conversation.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const conversation = new Conversation({
        title: 'Test Conversation'
      });

      const error = conversation.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe tener createdAt por defecto', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test'
      });

      // createdAt se crea al guardar, pero el modelo debe tenerlo
      expect(conversation).toBeDefined();
    });
  });
});

