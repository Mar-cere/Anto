import { AUTH_ERROR_CODES, buildDuplicateRegisterBody } from '../../../utils/authErrorCodes.js';
import { authApiCopy } from '../../../utils/authApiCopy.js';

describe('authErrorCodes', () => {
  it('buildDuplicateRegisterBody incluye mensaje localizado y código', () => {
    const bodyEs = buildDuplicateRegisterBody(authApiCopy('es'));
    expect(bodyEs.message).toBe(authApiCopy('es').emailOrUsernameInUse);
    expect(bodyEs.code).toBe(AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE);

    const bodyEn = buildDuplicateRegisterBody(authApiCopy('en'));
    expect(bodyEn.message).toBe(authApiCopy('en').emailOrUsernameInUse);
    expect(bodyEn.code).toBe(AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE);
  });
});
