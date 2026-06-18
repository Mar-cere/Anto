import { ABC_API_ERROR_CODES, resolveAbcApiErrorMessage } from '../abcApiErrors';

describe('resolveAbcApiErrorMessage (#86 / #212)', () => {
  it('mapea rango inválido de macro-patterns', () => {
    expect(
      resolveAbcApiErrorMessage(
        { code: ABC_API_ERROR_CODES.MACRO_INVALID_RANGE, error: 'rango' },
        { MACRO_PATTERNS_RANGE_ERROR: 'Rango inválido' },
      ),
    ).toBe('Rango inválido');
  });

  it('lee err.response.data de la API', () => {
    expect(
      resolveAbcApiErrorMessage({
        response: { data: { code: ABC_API_ERROR_CODES.GUARD_ERROR, error: 'fallo' } },
      }),
    ).toBe('fallo');
  });
});
