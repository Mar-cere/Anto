import { abcRecordApiCopy } from '../../../utils/abcRecordApiCopy.js';

describe('abcRecordApiCopy', () => {
  it('expone claves es/en en paridad', () => {
    const esKeys = Object.keys(abcRecordApiCopy('es')).sort();
    const enKeys = Object.keys(abcRecordApiCopy('en')).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it('normaliza idioma desconocido a es', () => {
    expect(abcRecordApiCopy('fr').createdSuccess).toBe(
      abcRecordApiCopy('es').createdSuccess,
    );
  });
});
