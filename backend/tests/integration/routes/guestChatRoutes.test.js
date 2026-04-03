/**
 * Regresión del flujo invitado: contrato /api/chat/guest/*, auth, límites y rate limit.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../../server.js';
import Message from '../../../models/Message.js';
import {
  connectDatabase,
  clearDatabase,
  closeDatabase,
} from '../../helpers/testHelpers.js';
import { GUEST_MAX_CONTENT_LENGTH } from '../../../constants/guestChat.js';

const BASE = '/api/chat/guest';

async function createGuestSession(requestAgent) {
  const res = await requestAgent.post(`${BASE}/session`).expect(201);
  expect(res.body).toHaveProperty('guestToken');
  expect(res.body).toHaveProperty('conversationId');
  expect(typeof res.body.guestToken).toBe('string');
  expect(mongoose.Types.ObjectId.isValid(res.body.conversationId)).toBe(true);
  expect(res.body).toHaveProperty('maxUserMessages');
  expect(typeof res.body.maxUserMessages).toBe('number');
  return res.body;
}

describe('Guest chat routes (regresión)', () => {
  beforeAll(async () => {
    await connectDatabase();
    await new Promise((r) => setTimeout(r, 400));
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
    await new Promise((r) => setTimeout(r, 100));
  }, 20000);

  describe('POST /api/chat/guest/session', () => {
    it('debe crear sesión 201 con token y conversationId', async () => {
      await createGuestSession(request(app));
    });
  });

  describe('GET /api/chat/guest/conversations/:conversationId/messages', () => {
    it('debe responder 401 sin token', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`${BASE}/conversations/${fakeId}/messages`);
      expect(res.status).toBe(401);
      expect(res.body.code || res.body.message).toBeDefined();
    });

    it('debe responder 400 si conversationId no es ObjectId válido', async () => {
      const { guestToken } = await createGuestSession(request(app));
      const res = await request(app)
        .get(`${BASE}/conversations/not-an-id/messages`)
        .set('Authorization', `Bearer ${guestToken}`);
      expect(res.status).toBe(400);
    });

    it('debe listar mensajes 200 con token válido', async () => {
      const { guestToken, conversationId } = await createGuestSession(request(app));
      const res = await request(app)
        .get(`${BASE}/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBeGreaterThan(0);
    });

    it('debe responder 403 si conversationId no pertenece a la sesión', async () => {
      const { guestToken } = await createGuestSession(request(app));
      const otherId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`${BASE}/conversations/${otherId}/messages`)
        .set('Authorization', `Bearer ${guestToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/chat/guest/messages', () => {
    it('debe responder 401 sin token', async () => {
      const { conversationId } = await createGuestSession(request(app));
      const res = await request(app)
        .post(`${BASE}/messages`)
        .send({ conversationId, content: 'Hola' });
      expect(res.status).toBe(401);
    });

    it('debe responder 401 con token inválido', async () => {
      const { conversationId } = await createGuestSession(request(app));
      const res = await request(app)
        .post(`${BASE}/messages`)
        .set('Authorization', 'Bearer token-invalido')
        .send({ conversationId, content: 'Hola' });
      expect(res.status).toBe(401);
    });

    it('debe responder 400 si faltan conversationId o content', async () => {
      const { guestToken } = await createGuestSession(request(app));
      const r1 = await request(app)
        .post(`${BASE}/messages`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ content: 'solo content' });
      expect(r1.status).toBe(400);

      const { guestToken: t2, conversationId } = await createGuestSession(request(app));
      const r2 = await request(app)
        .post(`${BASE}/messages`)
        .set('Authorization', `Bearer ${t2}`)
        .send({ conversationId });
      expect(r2.status).toBe(400);
    });

    it('debe responder 403 si conversationId no coincide con la sesión', async () => {
      const { guestToken, conversationId } = await createGuestSession(request(app));
      const other = new mongoose.Types.ObjectId().toString();
      expect(other).not.toBe(conversationId);
      const res = await request(app)
        .post(`${BASE}/messages`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ conversationId: other, content: 'Hola' });
      expect(res.status).toBe(403);
    });

    it('debe responder 400 si content supera GUEST_MAX_CONTENT_LENGTH', async () => {
      const { guestToken, conversationId } = await createGuestSession(request(app));
      const res = await request(app)
        .post(`${BASE}/messages`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          conversationId,
          content: 'x'.repeat(GUEST_MAX_CONTENT_LENGTH + 1),
        });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('GUEST_CONTENT_TOO_LONG');
    });

    it('debe responder 403 GUEST_LIMIT_REACHED cuando ya hay max mensajes de usuario', async () => {
      const { guestToken, conversationId } = await createGuestSession(request(app));
      const decoded = jwt.decode(guestToken);
      const gsId = new mongoose.Types.ObjectId(decoded.gsid);
      const convOid = new mongoose.Types.ObjectId(conversationId);

      for (let i = 0; i < 5; i += 1) {
        await Message.create({
          conversationId: convOid,
          guestSessionId: gsId,
          role: 'user',
          content: `fill-${i}`,
          metadata: { guest: true },
        });
      }

      const res = await request(app)
        .post(`${BASE}/messages`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ conversationId, content: 'extra' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('GUEST_LIMIT_REACHED');
      expect(res.body.requiresAccount).toBe(true);
    });
  });

  describe('Rate limit creación de sesiones', () => {
    it('debe responder 429 tras exceder límite de POST /session', async () => {
      let lastStatus = 201;
      for (let i = 0; i < 16; i += 1) {
        const res = await request(app).post(`${BASE}/session`);
        lastStatus = res.status;
        if (res.status === 429) {
          expect(res.body).toBeDefined();
          return;
        }
      }
      expect(lastStatus).toBe(429);
    }, 60000);
  });
});
