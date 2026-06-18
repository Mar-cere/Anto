import { normalizeChatSocketTurnPayload } from '../chatSocketTurnPayload';

describe('normalizeChatSocketTurnPayload', () => {
  it('devuelve payload vacío si raw es inválido', () => {
    expect(normalizeChatSocketTurnPayload(null)).toEqual({
      done: true,
      content: '',
      messageId: null,
    });
  });

  it('normaliza message:received con paridad SSE', () => {
    const raw = {
      id: '507f1f77bcf86cd799439099',
      text: 'Hola desde socket',
      conversationId: '507f1f77bcf86cd799439011',
      suggestions: ['Respirar'],
      suggestionsPersonalized: true,
      proposedProductActions: [{ type: 'bad', label: 'x' }],
      productActionStatus: { status: 'pending' },
      tccLite: { step: 2 },
      crisisResources: { country: 'AR' },
      crisisHardStop: true,
    };

    const out = normalizeChatSocketTurnPayload(raw);

    expect(out).toMatchObject({
      done: true,
      messageId: '507f1f77bcf86cd799439099',
      content: 'Hola desde socket',
      conversationId: '507f1f77bcf86cd799439011',
      suggestions: ['Respirar'],
      suggestionsPersonalized: true,
      productActionStatus: { status: 'pending' },
      tccLite: { step: 2 },
      crisisResources: { country: 'AR' },
      crisisHardStop: true,
      transport: 'socket',
    });
    expect(out.proposedProductActions).toEqual([]);
  });
});
