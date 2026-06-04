import { getRandomGreeting } from '../../../constants/openai.js';

describe('greeting variations i18n', () => {
  it('getRandomGreeting en devuelve texto en inglés', () => {
    const greeting = getRandomGreeting('afternoon', 'en');
    expect(greeting).toMatch(/[A-Za-z]/);
    expect(greeting).not.toMatch(/¿Cómo va tu día/i);
  });

  it('getRandomGreeting es mantiene español', () => {
    const greeting = getRandomGreeting('afternoon', 'es');
    expect(greeting).toMatch(/¿|¡/);
  });
});
