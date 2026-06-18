import { BA_API_ERROR_CODES, resolveBaApiErrorMessage } from '../baApiErrors';

describe('resolveBaApiErrorMessage (#88)', () => {
  it('mapea conflicto de vínculo', () => {
    expect(
      resolveBaApiErrorMessage(
        { code: BA_API_ERROR_CODES.SLOT_LINK_CONFLICT, error: 'conflict' },
        { LINK_PRODUCT_TOAST_CONFLICT: 'Ya vinculado' },
      ),
    ).toBe('Ya vinculado');
  });

  it('lee err.response.data de la API', () => {
    expect(
      resolveBaApiErrorMessage({
        response: { data: { code: BA_API_ERROR_CODES.PRODUCT_VALIDATION, error: 'inválido' } },
      }),
    ).toBe('inválido');
  });
});
