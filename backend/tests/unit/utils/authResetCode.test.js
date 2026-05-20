import { describe, expect, it } from '@jest/globals';
import {
  isResetCodeExpired,
  isResetCodeValid,
  normalizeVerificationCode,
} from '../../../utils/authResetCode.js';

describe('authResetCode', () => {
  const now = Date.now();

  it('normaliza código con espacios o guiones', () => {
    expect(normalizeVerificationCode(' 123-456 ')).toBe('123456');
  });

  it('acepta código válido antes de expirar', () => {
    const user = {
      resetPasswordCode: '123456',
      resetPasswordExpires: new Date(now + 60_000),
    };
    expect(isResetCodeValid(user, '123456', now)).toBe(true);
  });

  it('rechaza código incorrecto', () => {
    const user = {
      resetPasswordCode: '123456',
      resetPasswordExpires: new Date(now + 60_000),
    };
    expect(isResetCodeValid(user, '654321', now)).toBe(false);
    expect(isResetCodeExpired(user, now)).toBe(false);
  });

  it('rechaza código expirado', () => {
    const user = {
      resetPasswordCode: '123456',
      resetPasswordExpires: new Date(now - 1000),
    };
    expect(isResetCodeValid(user, '123456', now)).toBe(false);
    expect(isResetCodeExpired(user, now)).toBe(true);
  });
});
