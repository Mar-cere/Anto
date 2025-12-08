/**
 * Tests unitarios para modelo Conversation
 * 
 * @author AntoApp Team
 */

import Conversation from '../../../models/Conversation.js';
import mongoose from 'mongoose';
import { connectDatabase, clearDatabase, closeDatabase } from '../../helpers/testHelpers.js';

describe('Conversation Model', () => {
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
    it('debe crear una conversación válida', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId()
      });

      const error = conversation.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const conversation = new Conversation({});

      const error = conversation.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe validar status enum', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(),
        status: 'invalid-status'
      });

      const error = conversation.validateSync();
      expect(error).toBeDefined();
    });

    it('debe tener status por defecto como active', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId()
      });

      expect(conversation.status).toBe('active');
    });

    it('debe generar id automáticamente', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId()
      });

      expect(conversation.id).toBeDefined();
      expect(typeof conversation.id).toBe('string');
      expect(conversation.id.length).toBeGreaterThan(0);
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener lastMessage como referencia opcional', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(),
        lastMessage: new mongoose.Types.ObjectId()
      });

      expect(conversation.lastMessage).toBeDefined();
    });

    it('debe guardar y recuperar una conversación', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversation = new Conversation({
        userId,
        status: 'active'
      });

      await conversation.save();

      const found = await Conversation.findById(conversation._id);
      expect(found).toBeDefined();
      expect(found.userId.toString()).toBe(userId.toString());
      expect(found.status).toBe('active');
      expect(found.id).toBe(conversation.id);
    });

    it('debe aceptar status archived', () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(),
        status: 'archived'
      });

      const error = conversation.validateSync();
      expect(error).toBeUndefined();
      expect(conversation.status).toBe('archived');
    });
  });

  describe('Middleware pre-save', () => {
    it('debe generar id si no existe antes de guardar', async () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId()
      });
      // El id se genera automáticamente en el default, pero podemos forzar undefined
      delete conversation.id;

      await conversation.save();

      expect(conversation.id).toBeDefined();
      expect(typeof conversation.id).toBe('string');
      expect(conversation.id.length).toBeGreaterThan(0);
    });
  });
});

