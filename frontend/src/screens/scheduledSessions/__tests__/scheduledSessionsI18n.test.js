/**
 * Tests de paridad i18n para SCHEDULED_SESSIONS (#15).
 * Verifica que ES y EN tengan las mismas claves y valores no vacíos.
 */
import es from '../../../constants/translations/es';
import en from '../../../constants/translations/en';

describe('SCHEDULED_SESSIONS i18n parity', () => {
  const esKeys = Object.keys(es.SCHEDULED_SESSIONS || {}).sort();
  const enKeys = Object.keys(en.SCHEDULED_SESSIONS || {}).sort();

  it('debe exportar SCHEDULED_SESSIONS en ambos idiomas', () => {
    expect(es.SCHEDULED_SESSIONS).toBeDefined();
    expect(en.SCHEDULED_SESSIONS).toBeDefined();
    expect(typeof es.SCHEDULED_SESSIONS).toBe('object');
    expect(typeof en.SCHEDULED_SESSIONS).toBe('object');
  });

  it('debe tener las mismas claves en ES y EN', () => {
    expect(esKeys).toEqual(enKeys);
  });

  it('debe tener valores no vacíos en ES', () => {
    esKeys.forEach((key) => {
      const value = es.SCHEDULED_SESSIONS[key];
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    });
  });

  it('debe tener valores no vacíos en EN', () => {
    enKeys.forEach((key) => {
      const value = en.SCHEDULED_SESSIONS[key];
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    });
  });

  it('debe tener al menos las claves esenciales', () => {
    const essentialKeys = [
      'SCREEN_TITLE',
      'EMPTY_TITLE',
      'EMPTY_MESSAGE',
      'LOADING',
      'ERROR_LOADING',
      'TOAST_ERROR',
      'TOAST_DELETED',
      'TOAST_SAVED',
      'DELETE_CONFIRM_TITLE',
      'DELETE_CONFIRM_MESSAGE',
      'DAY_MONDAY',
      'DAY_TUESDAY',
      'DAY_WEDNESDAY',
      'DAY_THURSDAY',
      'DAY_FRIDAY',
      'DAY_SATURDAY',
      'DAY_SUNDAY',
    ];

    essentialKeys.forEach((key) => {
      expect(es.SCHEDULED_SESSIONS[key]).toBeDefined();
      expect(en.SCHEDULED_SESSIONS[key]).toBeDefined();
    });
  });

  it('debe tener 65 claves en total', () => {
    // Verificar que la cantidad de claves es la esperada
    expect(esKeys.length).toBe(65);
    expect(enKeys.length).toBe(65);
  });
});
