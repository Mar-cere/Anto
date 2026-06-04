import {
  getChatWelcomeTimePeriod,
  isChatWelcomeMessage,
  localizeChatWelcomeMessages,
  pickChatWelcomeGreeting,
} from '../chatWelcomeGreeting';

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
});
