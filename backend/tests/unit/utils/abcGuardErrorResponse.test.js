import { describe, expect, it } from '@jest/globals';
import {
  ABC_GUARD_ERROR_CODES,
  buildAbcGuardErrorBody,
} from '../../../utils/abcGuardErrorResponse.js';

describe('buildAbcGuardErrorBody', () => {
  it('mapea rango inválido a ABC_MACRO_INVALID_RANGE', () => {
    expect(buildAbcGuardErrorBody('macroInvalidRange', 'inválido')).toEqual({
      success: false,
      error: 'inválido',
      code: ABC_GUARD_ERROR_CODES.MACRO_INVALID_RANGE,
    });
  });
});
