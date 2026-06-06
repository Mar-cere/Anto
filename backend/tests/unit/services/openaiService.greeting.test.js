import openaiService from '../../../services/openaiService.js';

describe('openaiService.generarSaludoPersonalizado (i18n)', () => {
  it('devuelve saludo en inglés cuando language es en', () => {
    const greeting = openaiService.generarSaludoPersonalizado({ language: 'en' });
    expect(greeting).toMatch(/Good (morning|afternoon|evening)|^Hi!/i);
    expect(greeting).not.toMatch(/¿Cómo va tu día/i);
  });

  it('devuelve saludo en español por defecto', () => {
    const greeting = openaiService.generarSaludoPersonalizado({});
    expect(greeting).toMatch(/¿|¡/);
  });
});
