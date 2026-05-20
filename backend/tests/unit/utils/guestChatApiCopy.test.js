import { guestChatApiCopy } from '../../../utils/guestChatApiCopy.js';

describe('guestChatApiCopy', () => {
  it('expone mensajes en inglés', () => {
    const copy = guestChatApiCopy('en');
    expect(copy.sessionStartError).toBe('Could not start guest chat');
    expect(copy.guestTokenRequired).toBe('Guest token required');
    expect(copy.conversationNotAllowed).toMatch(/not allowed/i);
  });

  it('expone rate limits en español', () => {
    const copy = guestChatApiCopy('es');
    expect(copy.rateLimitMessages).toMatch(/Demasiados mensajes/);
  });
});
