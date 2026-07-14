/**
 * Tests de paridad i18n para pantallas de focus
 */
import { FOCUS_ONBOARDING as FOCUS_ONBOARDING_ES, FOCUS_PROGRESS as FOCUS_PROGRESS_ES } from '../es';
import { FOCUS_ONBOARDING as FOCUS_ONBOARDING_EN, FOCUS_PROGRESS as FOCUS_PROGRESS_EN } from '../en';

describe('Focus screens i18n parity', () => {
  describe('FOCUS_ONBOARDING', () => {
    it('debe tener las mismas claves en ES y EN', () => {
      const esKeys = Object.keys(FOCUS_ONBOARDING_ES).sort();
      const enKeys = Object.keys(FOCUS_ONBOARDING_EN).sort();
      
      expect(esKeys).toEqual(enKeys);
    });

    it('no debe tener valores vacíos', () => {
      Object.entries(FOCUS_ONBOARDING_ES).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
      });

      Object.entries(FOCUS_ONBOARDING_EN).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('FOCUS_PROGRESS', () => {
    it('debe tener las mismas claves en ES y EN', () => {
      const esKeys = Object.keys(FOCUS_PROGRESS_ES).sort();
      const enKeys = Object.keys(FOCUS_PROGRESS_EN).sort();
      
      expect(esKeys).toEqual(enKeys);
    });

    it('no debe tener valores vacíos', () => {
      Object.entries(FOCUS_PROGRESS_ES).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
      });

      Object.entries(FOCUS_PROGRESS_EN).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    });
  });
});
