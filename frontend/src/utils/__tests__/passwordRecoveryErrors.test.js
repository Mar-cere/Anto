import { resolvePasswordRecoveryErrorMessage } from '../passwordRecoveryErrors';

const TEXTS_ES = {
  ERROR_SEND_CODE: 'Error al enviar el código de recuperación',
  EMAIL_NOT_FOUND: 'No existe una cuenta con este correo electrónico',
  CONNECTION_ERROR: 'No hay conexión. Verifica tu internet e inténtalo de nuevo.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos.',
  CODE_EXPIRED: 'El código expiró. Solicita uno nuevo.',
  CODE_INVALID: 'El código no es correcto.',
};

const TEXTS_EN = {
  ERROR_SEND_CODE: 'Could not send verification code',
  EMAIL_NOT_FOUND: 'No account exists with this email address',
};

describe('passwordRecoveryErrors', () => {
  it('mapea 404 de email inexistente en español', () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'No existe una cuenta con este correo electrónico' },
      },
    };
    expect(
      resolvePasswordRecoveryErrorMessage(error, TEXTS_ES, 'ERROR_SEND_CODE'),
    ).toBe(TEXTS_ES.EMAIL_NOT_FOUND);
  });

  it('mapea 404 de email inexistente en inglés', () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'No account exists with this email address' },
      },
    };
    expect(
      resolvePasswordRecoveryErrorMessage(error, TEXTS_EN, 'ERROR_SEND_CODE'),
    ).toBe(TEXTS_EN.EMAIL_NOT_FOUND);
  });

  it('mapea RESET_CODE_EXPIRED por código de API', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'El código expiró.', code: 'RESET_CODE_EXPIRED' },
      },
    };
    expect(
      resolvePasswordRecoveryErrorMessage(error, TEXTS_ES, 'CODE_INVALID'),
    ).toBe(TEXTS_ES.CODE_EXPIRED);
  });

  it('mapea RESET_CODE_INVALID por código de API', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'El código no es correcto.', code: 'RESET_CODE_INVALID' },
      },
    };
    expect(
      resolvePasswordRecoveryErrorMessage(error, TEXTS_ES, 'CODE_INVALID'),
    ).toBe(TEXTS_ES.CODE_INVALID);
  });
});
