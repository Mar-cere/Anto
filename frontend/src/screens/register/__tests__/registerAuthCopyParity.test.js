import { getTranslations } from '../../../constants/translations';
import { authApiCopy } from '../../../../../backend/utils/authApiCopy.js';
import { AUTH_ERROR_CODES } from '../../../constants/authErrorCodes';

describe('register duplicate copy parity (es/en)', () => {
  const languages = ['es', 'en'];

  languages.forEach((lang) => {
    it(`REGISTER.ERRORS.ALREADY_EXISTS coincide con authApiCopy (${lang})`, () => {
      const apiCopy = authApiCopy(lang);
      const uiCopy = getTranslations(lang).REGISTER.ERRORS.ALREADY_EXISTS;
      expect(uiCopy).toBe(apiCopy.emailOrUsernameInUse);
    });
  });

  it('código de error del cliente coincide con el backend', () => {
    expect(AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE).toBe(
      'EMAIL_OR_USERNAME_IN_USE',
    );
  });
});
