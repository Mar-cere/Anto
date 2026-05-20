import {
  isCompleteVerificationCode,
  normalizeVerificationCode,
} from '../verificationCode';

describe('verificationCode', () => {
  it('elimina espacios y guiones al pegar desde el correo', () => {
    expect(normalizeVerificationCode(' 123-456 ')).toBe('123456');
  });

  it('detecta código completo de 6 dígitos', () => {
    expect(isCompleteVerificationCode('123456')).toBe(true);
    expect(isCompleteVerificationCode('12')).toBe(false);
  });
});
