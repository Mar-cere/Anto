import {
  finalizeLoadedChatMessages,
  getChatWelcomeTimePeriod,
  isChatWelcomeMessage,
  localizeChatWelcomeMessages,
  pickChatWelcomeGreeting,
  reconstructPersistedSuggestions,
  reconstructPersistedCommitmentFollowUp,
} from '../chatWelcomeGreeting';

describe('reconstructPersistedCommitmentFollowUp', () => {
  it('reconstruye el bloque desde metadata del último asistente', () => {
    const messages = [
      { id: 'a1', role: 'assistant', metadata: { commitmentFollowUp: { id: 'c1', label: 'caminar' } } },
    ];
    const out = reconstructPersistedCommitmentFollowUp(messages);
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({
      type: 'commitment_follow_up',
      commitmentFollowUp: { id: 'c1', label: 'caminar' },
    });
  });

  it('no duplica si ya hay un bloque en vivo', () => {
    const messages = [
      { id: 'a1', role: 'assistant', metadata: { commitmentFollowUp: { id: 'c1', label: 'x' } } },
      { id: 'b1', type: 'commitment_follow_up', commitmentFollowUp: { id: 'c1', label: 'x' } },
    ];
    expect(reconstructPersistedCommitmentFollowUp(messages)).toHaveLength(2);
  });

  it('devuelve igual si no hay metadata de follow-up', () => {
    const messages = [{ id: 'a1', role: 'assistant', metadata: {} }];
    expect(reconstructPersistedCommitmentFollowUp(messages)).toHaveLength(1);
  });

  it('no reconstruye compromisos con etiqueta genérica de técnica', () => {
    const messages = [
      {
        id: 'a1',
        role: 'assistant',
        metadata: { commitmentFollowUp: { id: 'c1', label: 'Activación conductual' } },
      },
    ];
    expect(reconstructPersistedCommitmentFollowUp(messages)).toHaveLength(1);
  });
});

describe('chatWelcomeGreeting', () => {
  it('pickChatWelcomeGreeting devuelve inglés con language en', () => {
    const noon = new Date('2026-06-04T14:00:00');
    const greeting = pickChatWelcomeGreeting('en', noon);
    expect(greeting).toMatch(/Hi!|Good afternoon/i);
    expect(greeting).not.toMatch(/¿Cómo va tu día/i);
  });

  it('pickChatWelcomeGreeting devuelve español por defecto', () => {
    const noon = new Date('2026-06-04T14:00:00');
    const greeting = pickChatWelcomeGreeting('es', noon);
    expect(greeting).toMatch(/¿|¡/);
  });

  it('getChatWelcomeTimePeriod clasifica tarde', () => {
    expect(getChatWelcomeTimePeriod(new Date('2026-06-04T15:00:00'))).toBe('afternoon');
  });

  it('isChatWelcomeMessage detecta metadata.type welcome', () => {
    expect(
      isChatWelcomeMessage({ role: 'assistant', metadata: { type: 'welcome' }, content: 'Hola' }),
    ).toBe(true);
    expect(isChatWelcomeMessage({ role: 'user', content: 'Hi' })).toBe(false);
  });

  it('localizeChatWelcomeMessages sustituye contenido', () => {
    const out = localizeChatWelcomeMessages(
      [
        {
          _id: '1',
          role: 'assistant',
          metadata: { type: 'welcome' },
          content: '¡Hola! ¿Cómo va tu día?',
        },
      ],
      'en',
    );
    expect(out[0].content).toMatch(/Good (morning|afternoon|evening)|^Hi!/i);
    expect(out[0].content).not.toMatch(/¿Cómo va tu día/i);
  });

  describe('reconstructPersistedSuggestions', () => {
    it('reconstruye la tarjeta del último turno con metadata.suggestions', () => {
      const out = reconstructPersistedSuggestions([
        { _id: 'u1', role: 'user', content: 'tengo ansiedad' },
        {
          _id: 'a1',
          role: 'assistant',
          content: 'Te acompaño',
          metadata: {
            timestamp: '2026-06-19T10:00:00.000Z',
            suggestions: [{ id: 'breathing_exercise', screen: 'BreathingExercise' }],
            suggestionsPersonalized: true,
          },
        },
      ]);
      expect(out).toHaveLength(3);
      const block = out[2];
      expect(block.type).toBe('suggestions');
      expect(block.id).toBe('suggestions-loaded-a1');
      expect(block.suggestions).toHaveLength(1);
      expect(block.metadata.rankingPersonalized).toBe(true);
    });

    it('no duplica si ya hay un bloque de sugerencias en vivo', () => {
      const input = [
        { _id: 'a1', role: 'assistant', metadata: { suggestions: [{ id: 'x' }] } },
        { id: 'live', role: 'suggestions', type: 'suggestions', suggestions: [{ id: 'x' }] },
      ];
      expect(reconstructPersistedSuggestions(input)).toHaveLength(2);
    });

    it('no inserta nada si ningún mensaje tiene sugerencias', () => {
      const input = [{ _id: 'a1', role: 'assistant', content: 'hola', metadata: {} }];
      expect(reconstructPersistedSuggestions(input)).toHaveLength(1);
    });

    it('finalizeLoadedChatMessages integra filtrado + reconstrucción', () => {
      const out = finalizeLoadedChatMessages(
        [
          { _id: 'q', type: 'quickReplies', role: 'assistant' },
          {
            _id: 'a1',
            role: 'assistant',
            content: 'Hola',
            metadata: { suggestions: [{ id: 'grounding_technique' }] },
          },
        ],
        'es',
      );
      expect(out.some((m) => m.type === 'quickReplies')).toBe(false);
      expect(out.some((m) => m.type === 'suggestions')).toBe(true);
    });
  });
});
