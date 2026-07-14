/**
 * Tests de paridad i18n para UserFacts (#63 grounding)
 */

import es from '../../../constants/translations/es';
import en from '../../../constants/translations/en';

describe('UserFacts i18n Parity', () => {
  const esKeys = Object.keys(es.USER_FACTS);
  const enKeys = Object.keys(en.USER_FACTS);

  it('debe tener las mismas claves en ES y EN', () => {
    expect(esKeys.sort()).toEqual(enKeys.sort());
  });

  it('debe tener traducciones no vacías en español', () => {
    esKeys.forEach((key) => {
      expect(es.USER_FACTS[key]).toBeTruthy();
      expect(typeof es.USER_FACTS[key]).toBe('string');
      expect(es.USER_FACTS[key].trim().length).toBeGreaterThan(0);
    });
  });

  it('debe tener traducciones no vacías en inglés', () => {
    enKeys.forEach((key) => {
      expect(en.USER_FACTS[key]).toBeTruthy();
      expect(typeof en.USER_FACTS[key]).toBe('string');
      expect(en.USER_FACTS[key].trim().length).toBeGreaterThan(0);
    });
  });

  it('debe tener al menos las claves esenciales', () => {
    const essentialKeys = [
      'SCREEN_TITLE',
      'EMPTY_TITLE',
      'ADD_FACT_CTA',
      'MODAL_CREATE_TITLE',
      'MODAL_FACT_LABEL',
      'CATEGORY_WORK',
      'CATEGORY_FAMILY',
      'CATEGORY_OTHER',
    ];

    essentialKeys.forEach((key) => {
      expect(es.USER_FACTS[key]).toBeDefined();
      expect(en.USER_FACTS[key]).toBeDefined();
    });
  });
});
