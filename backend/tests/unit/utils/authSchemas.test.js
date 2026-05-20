import { describe, expect, it } from '@jest/globals';
import { authApiCopy } from '../../../utils/authApiCopy.js';
import { getVerifyCodeSchema } from '../../../utils/authSchemas.js';

describe('authSchemas verification code', () => {
  const copy = authApiCopy('es');

  it('normaliza código con espacios o guiones antes de validar', () => {
    const schema = getVerifyCodeSchema(copy);
    const { error, value } = schema.validate({
      email: 'user@example.com',
      code: ' 123-456 ',
    });
    expect(error).toBeUndefined();
    expect(value.code).toBe('123456');
  });

  it('rechaza código incompleto', () => {
    const schema = getVerifyCodeSchema(copy);
    const { error } = schema.validate({
      email: 'user@example.com',
      code: '12345',
    });
    expect(error).toBeDefined();
  });
});
