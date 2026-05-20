import { getTranslations } from '../../../constants/translations';
import { AUTH_ERROR_CODES } from '../../../constants/authErrorCodes';
import {
  isRegisterDuplicateError,
  resolveRegisterErrorMessage,
} from '../registerErrorUtils';

const buildError = ({ status = 400, message, code }) => ({
  response: {
    status,
    data: {
      ...(message != null ? { message } : {}),
      ...(code != null ? { code } : {}),
    },
  },
});

describe('registerErrorUtils', () => {
  describe.each([
    [
      'es',
      'El email o nombre de usuario ya está en uso',
      getTranslations('es').REGISTER.ERRORS,
    ],
    [
      'en',
      'Email or username is already in use',
      getTranslations('en').REGISTER.ERRORS,
    ],
  ])('idioma %s', (_lang, apiMessage, errorMessages) => {
    it('detecta duplicado por mensaje del backend', () => {
      expect(isRegisterDuplicateError(buildError({ message: apiMessage }))).toBe(
        true,
      );
    });

    it('detecta duplicado por código estable', () => {
      expect(
        isRegisterDuplicateError(
          buildError({
            message: 'Otro texto',
            code: AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE,
          }),
        ),
      ).toBe(true);
    });

    it('devuelve ALREADY_EXISTS y no INVALID_DATA', () => {
      const message = resolveRegisterErrorMessage({
        error: buildError({ message: apiMessage }),
        errorMessages,
      });
      expect(message).toBe(errorMessages.ALREADY_EXISTS);
      expect(message).not.toBe(errorMessages.INVALID_DATA);
    });
  });

  it('prioriza ALREADY_EXISTS sobre error genérico 400', () => {
    const errorMessages = getTranslations('es').REGISTER.ERRORS;
    const message = resolveRegisterErrorMessage({
      error: buildError({
        message: 'El email o nombre de usuario ya está en uso',
      }),
      errorMessages,
    });
    expect(message).toBe(errorMessages.ALREADY_EXISTS);
  });
});
