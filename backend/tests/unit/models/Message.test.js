/**
 * Tests unitarios para modelo Message
 * 
 * @author AntoApp Team
 */

import Message from '../../../models/Message.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('Message Model', () => {
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
    it('debe crear un mensaje válido', () => {
      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        role: 'user',
        content: 'Test message'
      });

      const error = message.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const message = new Message({
        conversationId: new mongoose.Types.ObjectId(),
        role: 'user',
        content: 'Test message'
      });

      const error = message.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe requerir conversationId', () => {
      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        role: 'user',
        content: 'Test message'
      });

      const error = message.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.conversationId).toBeDefined();
    });

    it('debe requerir content', () => {
      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        role: 'user'
      });

      const error = message.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.content).toBeDefined();
    });

    it('debe requerir role', () => {
      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        content: 'Test message'
      });

      const error = message.validateSync();
      expect(error).toBeDefined();
    });

    it('debe validar role enum', () => {
      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        role: 'invalid-role',
        content: 'Test message'
      });

      const error = message.validateSync();
      expect(error).toBeDefined();
    });

    it('debe aceptar roles válidos', () => {
      const roles = ['user', 'assistant', 'system'];
      
      roles.forEach(role => {
        const message = new Message({
          userId: new mongoose.Types.ObjectId(),
          conversationId: new mongoose.Types.ObjectId(),
          role,
          content: 'Test message'
        });

        const error = message.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('debe tener metadata por defecto como objeto vacío', () => {
      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        role: 'user',
        content: 'Test message'
      });

      expect(message.metadata).toEqual({});
    });

    it('debe permitir metadata personalizado', () => {
      const customMetadata = {
        status: 'sent',
        context: {
          emotional: {
            mainEmotion: 'tristeza',
            intensity: 7
          }
        }
      };

      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        role: 'user',
        content: 'Test message',
        metadata: customMetadata
      });

      expect(message.metadata).toEqual(customMetadata);
    });

    it('debe trimear el contenido', () => {
      const message = new Message({
        userId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        role: 'user',
        content: '  Test message  '
      });

      expect(message.content).toBe('Test message');
    });
  });

  describe('Operaciones de base de datos', () => {
    it('debe guardar un mensaje en la base de datos', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      
      const message = new Message({
        userId,
        conversationId,
        role: 'user',
        content: 'Test message'
      });

      const saved = await message.save();
      
      expect(saved._id).toBeDefined();
      expect(saved.userId.toString()).toBe(userId.toString());
      expect(saved.conversationId.toString()).toBe(conversationId.toString());
      expect(saved.content).toBe('Test message');
      expect(saved.role).toBe('user');
    });

    it('debe encontrar mensajes por userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      
      await Message.create({
        userId,
        conversationId,
        role: 'user',
        content: 'Message 1'
      });

      await Message.create({
        userId,
        conversationId,
        role: 'assistant',
        content: 'Message 2'
      });

      const messages = await Message.find({ userId });
      
      expect(messages).toHaveLength(2);
    });

    it('debe encontrar mensajes por conversationId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      
      await Message.create({
        userId,
        conversationId,
        role: 'user',
        content: 'Message 1'
      });

      const messages = await Message.find({ conversationId });
      
      expect(messages).toHaveLength(1);
      expect(messages[0].conversationId.toString()).toBe(conversationId.toString());
    });
  });
});

