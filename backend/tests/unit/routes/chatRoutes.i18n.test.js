/**
 * Chat: mensajes localizados (copy + middleware con apiCopy simulado).
 */
import { jest } from '@jest/globals';
import { validarConversationId } from '../../../routes/chat/chatMiddleware.js';
import { chatApiCopy } from '../../../utils/chatApiCopy.js';

describe('Chat middleware i18n', () => {
  it('usa apiCopy en inglés para ID inválido', () => {
    const req = {
      params: { conversationId: 'not-an-id' },
      apiCopy: chatApiCopy('en'),
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    validarConversationId(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid conversation ID',
    });
  });
});

describe('chatApiCopy extensiones', () => {
  it('sessionIntentionTooLate en inglés', () => {
    expect(chatApiCopy('en').sessionIntentionTooLate).toMatch(/before your first message/i);
  });

  it('rate limits en inglés', () => {
    const copy = chatApiCopy('en');
    expect(copy.rateLimitSendMessage).toMatch(/Too many messages/i);
  });

  it('assistantProcessingFallback en inglés', () => {
    expect(chatApiCopy('en').assistantProcessingFallback).toMatch(/Sorry/i);
    expect(chatApiCopy('es').assistantProcessingFallback).toMatch(/Lo siento/i);
  });

  it('session WAI copy es/en', () => {
    const es = chatApiCopy('es');
    const en = chatApiCopy('en');
    expect(es.sessionWaiScoresInvalid).toMatch(/1 al 5/i);
    expect(en.sessionWaiScoresInvalid).toMatch(/1 to 5/i);
    expect(es.rateLimitSessionWai).toMatch(/feedback de sesión/i);
    expect(en.rateLimitSessionWai).toMatch(/session feedback/i);
  });
});
