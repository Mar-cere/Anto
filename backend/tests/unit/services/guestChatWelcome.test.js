import openaiService from '../../../services/openaiService.js';

describe('guestChat welcome language (#i18n)', () => {
  it('createGuestSession usa generarSaludoPersonalizado con language en', () => {
    const greeting = openaiService.generarSaludoPersonalizado({ language: 'en' });
    expect(greeting).toMatch(/Good (morning|afternoon|evening)|^Hi!/i);
    expect(greeting).not.toMatch(/¿Cómo va tu día/i);
  });
});
