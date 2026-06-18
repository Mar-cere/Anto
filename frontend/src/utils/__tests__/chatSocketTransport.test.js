import {
  shouldFallbackChatTransportToSse,
  SOCKET_CHAT_NON_FALLBACK_CODES,
} from '../chatSocketTransport';

describe('chatSocketTransport', () => {
  it('permite fallback solo en indisponibilidad o timeout', () => {
    expect(shouldFallbackChatTransportToSse({ code: 'SOCKET_UNAVAILABLE' })).toBe(true);
    expect(shouldFallbackChatTransportToSse({ code: 'SOCKET_TIMEOUT' })).toBe(true);
    expect(shouldFallbackChatTransportToSse({ code: 'SOCKET_ERROR' })).toBe(false);
    expect(shouldFallbackChatTransportToSse({ code: 'CONVERSATION_FORBIDDEN' })).toBe(false);
    expect(shouldFallbackChatTransportToSse({ name: 'AbortError', code: 'ABORTED' })).toBe(false);
  });

  it('bloquea fallback para códigos de negocio conocidos', () => {
    for (const code of SOCKET_CHAT_NON_FALLBACK_CODES) {
      expect(shouldFallbackChatTransportToSse({ code })).toBe(false);
    }
  });
});
