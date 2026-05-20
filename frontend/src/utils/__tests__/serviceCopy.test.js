import { getApiErrorsCopy, getChatCopy } from '../serviceCopy';

describe('serviceCopy', () => {
  it('getChatCopy devuelve español por defecto', () => {
    expect(getChatCopy('SERVICE_SESSION_REQUIRED', 'es')).toBe('Sesión requerida');
  });

  it('getChatCopy devuelve inglés cuando se pasa language en', () => {
    expect(getChatCopy('SERVICE_SESSION_REQUIRED', 'en')).toBe('Session required');
  });

  it('getApiErrorsCopy devuelve mensajes de API por idioma', () => {
    expect(getApiErrorsCopy('GENERIC', 'en')).toBe('Something went wrong. Try again.');
    expect(getApiErrorsCopy('GENERIC', 'es')).toBe('Algo ha fallado. Inténtalo de nuevo.');
  });
});
