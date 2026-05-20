import { therapeuticApiCopy } from '../../../utils/therapeuticApiCopy.js';

describe('therapeuticApiCopy', () => {
  it('devuelve mensajes en inglés', () => {
    const copy = therapeuticApiCopy('en');
    expect(copy.listError).toMatch(/Could not load/);
    expect(copy.useSuccess).toMatch(/recorded/i);
  });

  it('devuelve mensajes en español por defecto', () => {
    const copy = therapeuticApiCopy('fr');
    expect(copy.listError).toMatch(/Error al obtener/);
  });
});
