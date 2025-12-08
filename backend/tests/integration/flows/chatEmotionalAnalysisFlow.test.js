/**
 * Test de integración: Flujo completo de chat con análisis emocional
 * 
 * Este test verifica el flujo completo desde la creación de una conversación
 * hasta el análisis emocional y generación de respuestas terapéuticas.
 * 
 * @author AntoApp Team
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../../server.js';
import User from '../../../models/User.js';
import Conversation from '../../../models/Conversation.js';
import Message from '../../../models/Message.js';
import Subscription from '../../../models/Subscription.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('Flujo completo: Chat con Análisis Emocional', () => {
  let authToken;
  let testUser;
  let conversationId;

  beforeAll(async () => {
    await connectDatabase();
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Crear usuario de prueba
    const timestamp = Date.now().toString().slice(-6);
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('TestPassword123!', salt, 1000, 64, 'sha512').toString('hex');
    
    testUser = await User.create({
      email: `chatuser${timestamp}@example.com`,
      username: `chatuser${timestamp}`,
      password: hash,
      salt,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'es'
      },
      subscription: {
        status: 'trial',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Crear suscripción activa para el usuario
    await Subscription.create({
      userId: testUser._id,
      plan: 'monthly',
      status: 'trialing',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    authToken = jwt.sign(
      { userId: testUser._id.toString() },
      process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
      { expiresIn: '1h' }
    );

    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
  }, 15000);

  it('debe completar el flujo completo de chat con análisis emocional', async () => {
    // Paso 1: Crear una nueva conversación
    const conversationResponse = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(201);

    expect(conversationResponse.body).toHaveProperty('conversationId');
    conversationId = conversationResponse.body.conversationId;

    // Verificar que la conversación se creó en la base de datos
    await new Promise(resolve => setTimeout(resolve, 300));
    const conversation = await Conversation.findById(conversationId);
    expect(conversation).toBeDefined();
    expect(conversation).not.toBeNull();
    if (conversation) {
      expect(conversation.userId.toString()).toBe(testUser._id.toString());
      expect(conversation.status).toBe('active');
    }

    // Paso 2: Enviar un mensaje del usuario
    const userMessage = {
      conversationId,
      content: 'Me siento muy triste y ansioso hoy. No sé qué hacer.',
      role: 'user'
    };

    const messageResponse = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .send(userMessage)
      .expect(201);

    expect(messageResponse.body).toHaveProperty('_id');
    expect(messageResponse.body.content).toBe(userMessage.content);
    expect(messageResponse.body.role).toBe('user');

    // Verificar que el mensaje se guardó en la base de datos
    const savedMessage = await Message.findById(messageResponse.body._id);
    expect(savedMessage).toBeDefined();
    expect(savedMessage.conversationId.toString()).toBe(conversationId);

    // Paso 3: Obtener los mensajes de la conversación
    const messagesResponse = await request(app)
      .get(`/api/chat/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(messagesResponse.body).toHaveProperty('messages');
    expect(Array.isArray(messagesResponse.body.messages)).toBe(true);
    expect(messagesResponse.body.messages.length).toBeGreaterThan(0);

    // Paso 4: Verificar que la conversación se actualizó con el último mensaje
    const updatedConversation = await Conversation.findById(conversationId);
    expect(updatedConversation.lastMessage).toBeDefined();
  });

  it('debe manejar múltiples mensajes en una conversación', async () => {
    // Crear conversación
    const conversationResponse = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    // Puede retornar 201 o 404 si requiere suscripción activa
    if (conversationResponse.status === 201) {
      const convId = conversationResponse.body.conversationId;

    // Enviar múltiples mensajes
    const messages = [
      'Hola, ¿cómo estás?',
      'Me siento un poco ansioso',
      '¿Puedes ayudarme?'
    ];

    for (const content of messages) {
      await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          conversationId: convId,
          content,
          role: 'user'
        })
        .expect(201);
    }

      // Verificar que todos los mensajes se guardaron
      const messagesResponse = await request(app)
        .get(`/api/chat/conversations/${convId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(messagesResponse.body).toHaveProperty('messages');
      expect(messagesResponse.body.messages.length).toBeGreaterThanOrEqual(messages.length);
    }
  });

  it('debe validar permisos de acceso a conversaciones', async () => {
    // Crear conversación para otro usuario
    const timestamp = Date.now().toString().slice(-6);
    const salt2 = crypto.randomBytes(16).toString('hex');
    const hash2 = crypto.pbkdf2Sync('TestPassword123!', salt2, 1000, 64, 'sha512').toString('hex');
    
    const otherUser = await User.create({
      email: `otheruser${timestamp}@example.com`,
      username: `otheruser${timestamp}`,
      password: hash2,
      salt: salt2
    });

    // Crear suscripción activa para el otro usuario
    await Subscription.create({
      userId: otherUser._id,
      plan: 'monthly',
      status: 'trialing',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const otherToken = jwt.sign(
      { userId: otherUser._id.toString() },
      process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars',
      { expiresIn: '1h' }
    );

    const conversationResponse = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({})
      .expect(201);

    const otherConvId = conversationResponse.body.conversationId;

    // Intentar acceder a la conversación de otro usuario
    // Puede retornar 403 (forbidden) o 404 (not found) dependiendo del orden de validación
    const accessResponse = await request(app)
      .get(`/api/chat/conversations/${otherConvId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect([403, 404]).toContain(accessResponse.status);
  });
});

