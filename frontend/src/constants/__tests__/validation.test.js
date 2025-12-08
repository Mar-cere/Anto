/**
 * Tests unitarios para constantes de validación
 * 
 * @author AntoApp Team
 */

import { VALIDATION_LENGTHS, VALIDATION_REGEX } from '../validation';

describe('validation constants', () => {
  describe('VALIDATION_LENGTHS', () => {
    it('debe tener todas las longitudes definidas', () => {
      expect(VALIDATION_LENGTHS.NAME_MIN).toBe(2);
      expect(VALIDATION_LENGTHS.NAME_MAX).toBe(50);
      expect(VALIDATION_LENGTHS.USERNAME_MIN).toBe(3);
      expect(VALIDATION_LENGTHS.USERNAME_MAX).toBe(20);
      expect(VALIDATION_LENGTHS.PASSWORD_MIN).toBe(8);
      expect(VALIDATION_LENGTHS.PASSWORD_MAX).toBe(128);
    });

    it('debe tener valores mínimos menores que máximos', () => {
      expect(VALIDATION_LENGTHS.NAME_MIN).toBeLessThan(VALIDATION_LENGTHS.NAME_MAX);
      expect(VALIDATION_LENGTHS.USERNAME_MIN).toBeLessThan(VALIDATION_LENGTHS.USERNAME_MAX);
      expect(VALIDATION_LENGTHS.PASSWORD_MIN).toBeLessThan(VALIDATION_LENGTHS.PASSWORD_MAX);
    });
  });

  describe('VALIDATION_REGEX', () => {
    describe('EMAIL', () => {
      it('debe validar emails correctos', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.com',
          'user123@test-domain.com'
        ];

        validEmails.forEach(email => {
          expect(VALIDATION_REGEX.EMAIL.test(email)).toBe(true);
        });
      });

      it('debe rechazar emails inválidos', () => {
        const invalidEmails = [
          'invalid',
          '@example.com',
          'user@',
          'user @example.com',
          'user@example',
          'user@.com'
        ];

        invalidEmails.forEach(email => {
          expect(VALIDATION_REGEX.EMAIL.test(email)).toBe(false);
        });
      });
    });

    describe('USERNAME', () => {
      it('debe validar usernames correctos', () => {
        const validUsernames = [
          'user123',
          'user_name',
          'test_user_123',
          'abc123'
        ];

        validUsernames.forEach(username => {
          expect(VALIDATION_REGEX.USERNAME.test(username)).toBe(true);
        });
      });

      it('debe rechazar usernames inválidos', () => {
        const invalidUsernames = [
          'user-name', // guiones no permitidos
          'user name', // espacios no permitidos
          'User123', // mayúsculas no permitidas
          'user@name', // caracteres especiales no permitidos
          'user.name' // puntos no permitidos
        ];

        invalidUsernames.forEach(username => {
          expect(VALIDATION_REGEX.USERNAME.test(username)).toBe(false);
        });
      });
    });

    describe('PASSWORD', () => {
      it('debe validar passwords con minúscula, mayúscula y número', () => {
        const validPasswords = [
          'Password123',
          'Test1234',
          'MyP@ssw0rd',
          'Abc123Xyz'
        ];

        validPasswords.forEach(password => {
          expect(VALIDATION_REGEX.PASSWORD.test(password)).toBe(true);
        });
      });

      it('debe rechazar passwords sin minúscula', () => {
        const invalidPasswords = [
          'PASSWORD123',
          'TEST1234',
          '12345678'
        ];

        invalidPasswords.forEach(password => {
          expect(VALIDATION_REGEX.PASSWORD.test(password)).toBe(false);
        });
      });

      it('debe rechazar passwords sin mayúscula', () => {
        const invalidPasswords = [
          'password123',
          'test1234',
          'abc123xyz'
        ];

        invalidPasswords.forEach(password => {
          expect(VALIDATION_REGEX.PASSWORD.test(password)).toBe(false);
        });
      });

      it('debe rechazar passwords sin número', () => {
        const invalidPasswords = [
          'Password',
          'TestTest',
          'AbcXyz'
        ];

        invalidPasswords.forEach(password => {
          expect(VALIDATION_REGEX.PASSWORD.test(password)).toBe(false);
        });
      });
    });
  });
});

