import { buildSocketChatErrorPayload } from '../../../utils/socketChatErrorPayload.js';

describe('buildSocketChatErrorPayload', () => {
  it('incluye code en mayúsculas cuando existe', () => {
    expect(
      buildSocketChatErrorPayload({
        message: 'Conversación no autorizada',
        code: 'conversation_forbidden',
      }),
    ).toEqual({
      message: 'Conversación no autorizada',
      code: 'CONVERSATION_FORBIDDEN',
    });
  });

  it('omite code si no viene en el error', () => {
    expect(buildSocketChatErrorPayload(new Error('fallo genérico'))).toEqual({
      message: 'fallo genérico',
    });
  });
});
