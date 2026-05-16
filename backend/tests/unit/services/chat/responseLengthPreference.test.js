import { describe, expect, it } from '@jest/globals';
import { detectShortModeFromSession } from '../../../../services/chat/responseLengthPreference.js';

describe('responseLengthPreference', () => {
  it('activa short mode cuando el mensaje actual pide brevedad', () => {
    const result = detectShortModeFromSession({
      currentMessage: 'por favor responde breve, no me mandes textos largos'
    });
    expect(result).toBe(true);
  });

  it('activa short mode por preferencia explícita en historial reciente', () => {
    const result = detectShortModeFromSession({
      currentMessage: 'me pasa esto con mi pareja',
      conversationHistoryNewestFirst: [
        { role: 'assistant', content: 'Te leo.' },
        { role: 'user', content: 'sé breve por favor' }
      ]
    });
    expect(result).toBe(true);
  });

  it('desactiva short mode si el pedido más reciente es más detalle', () => {
    const result = detectShortModeFromSession({
      currentMessage: 'mejor explícame con más detalle',
      conversationHistoryNewestFirst: [
        { role: 'user', content: 'sé breve porfa' }
      ]
    });
    expect(result).toBe(false);
  });
});
