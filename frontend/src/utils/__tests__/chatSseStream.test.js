import { consumeSseDelta, dispatchSsePayloads, streamChatSseWithFetch } from '../chatSseStream';

describe('chatSseStream', () => {
  describe('consumeSseDelta', () => {
    it('agrupa varios bloques SSE en un solo chunk', () => {
      const chunk =
        'data: {"content":"h"}\n\n' +
        'data: {"content":"i"}\n\n';
      const { buffer, payloads } = consumeSseDelta('', chunk);
      expect(buffer).toBe('');
      expect(payloads).toEqual([{ content: 'h' }, { content: 'i' }]);
    });

    it('deja el buffer incompleto al final', () => {
      const { buffer, payloads } = consumeSseDelta('', 'data: {"content":"x"}\n\nda');
      expect(buffer).toBe('da');
      expect(payloads).toEqual([{ content: 'x' }]);
    });

    it('concatena con buffer previo', () => {
      const first = consumeSseDelta('', 'data: {"a":1}\n\nda');
      expect(first.buffer).toBe('da');
      const second = consumeSseDelta(first.buffer, 'ta: {"b":2}\n\n');
      expect(second.buffer).toBe('');
      expect(second.payloads).toEqual([{ b: 2 }]);
    });

    it('normaliza CRLF al separador de eventos', () => {
      const chunk = 'data: {"content":"x"}\r\n\r\n';
      const { buffer, payloads } = consumeSseDelta('', chunk);
      expect(buffer).toBe('');
      expect(payloads).toEqual([{ content: 'x' }]);
    });
  });

  describe('dispatchSsePayloads', () => {
    it('llama onChunk y onDone', () => {
      const onChunk = jest.fn();
      const onDone = jest.fn();
      const done = dispatchSsePayloads(
        [{ content: 'a' }, { done: true, messageId: 'm1' }],
        { onChunk, onDone }
      );
      expect(done).toBe(true);
      expect(onChunk).toHaveBeenCalledWith('a');
      expect(onDone).toHaveBeenCalledWith({ done: true, messageId: 'm1' });
    });

    it('lanza si payload trae error', () => {
      expect(() =>
        dispatchSsePayloads([{ error: 'falló' }], { onChunk: jest.fn(), onDone: jest.fn() })
      ).toThrow('falló');
    });
  });

  describe('streamChatSseWithFetch', () => {
    const origFetch = global.fetch;

    afterEach(() => {
      global.fetch = origFetch;
    });

    it('en errores HTTP adjunta err.response.data (p. ej. 429 MESSAGE_IN_FLIGHT)', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many',
          json: () => Promise.resolve({ message: 'Espera un momento', code: 'MESSAGE_IN_FLIGHT' }),
        })
      );

      await expect(
        streamChatSseWithFetch({
          url: 'http://localhost/api/chat/messages?stream=true',
          headers: {},
          body: '{}',
          onChunk: jest.fn(),
          onDone: jest.fn(),
          timeoutMs: 5000,
        })
      ).rejects.toMatchObject({
        message: 'Espera un momento',
        response: { status: 429, data: { code: 'MESSAGE_IN_FLIGHT' } },
      });
    });
  });
});
