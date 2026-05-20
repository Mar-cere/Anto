import { authApiCopy } from '../../../utils/authApiCopy.js';

describe('authApiCopy', () => {
  it('expone mensajes en inglés', () => {
    const copy = authApiCopy('en');
    expect(copy.invalidData).toBe('Invalid data');
    expect(copy.invalidCredentials).toBe('Incorrect credentials');
    expect(copy.registerSuccess).toMatch(/verify your email/i);
    expect(copy.rateLimitLogin).toMatch(/sign-in attempts/i);
    expect(copy.emailOrUsernameInUse).toBe('Email or username is already in use');
  });

  it('expone mensajes Joi en español', () => {
    const copy = authApiCopy('es');
    expect(copy.joiEmailInvalid).toMatch(/email válido/i);
    expect(copy.joiPasswordMin8).toMatch(/8 caracteres/);
    expect(copy.emailOrUsernameInUse).toBe(
      'El email o nombre de usuario ya está en uso',
    );
  });

  it('normaliza idioma desconocido a español', () => {
    expect(authApiCopy('fr').invalidData).toBe('Datos inválidos');
  });
});
