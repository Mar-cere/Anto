/** Códigos de error estables para respuestas de auth (cliente i18n). */
export const AUTH_ERROR_CODES = {
  EMAIL_OR_USERNAME_IN_USE: 'EMAIL_OR_USERNAME_IN_USE',
};

export function buildDuplicateRegisterBody(copy) {
  return {
    message: copy.emailOrUsernameInUse,
    code: AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE,
  };
}
