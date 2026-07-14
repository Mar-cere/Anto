/**
 * Tests unitarios para scheduledSessionsApiCopy.js
 * Feature #15: Sesiones programadas - Validación i18n
 */

import { scheduledSessionsApiCopy } from '../../../utils/scheduledSessionsApiCopy.js';

describe('scheduledSessionsApiCopy', () => {
  describe('paridad ES/EN', () => {
    let copyES;
    let copyEN;

    beforeAll(() => {
      copyES = scheduledSessionsApiCopy('es');
      copyEN = scheduledSessionsApiCopy('en');
    });

    test('debe retornar objeto para español', () => {
      expect(copyES).toBeDefined();
      expect(typeof copyES).toBe('object');
    });

    test('debe retornar objeto para inglés', () => {
      expect(copyEN).toBeDefined();
      expect(typeof copyEN).toBe('object');
    });

    test('debe tener las mismas claves en ES y EN', () => {
      const keysES = Object.keys(copyES).sort();
      const keysEN = Object.keys(copyEN).sort();
      expect(keysES).toEqual(keysEN);
    });

    test('todas las claves deben tener valores no vacíos en ES', () => {
      Object.entries(copyES).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });

    test('todas las claves deben tener valores no vacíos en EN', () => {
      Object.entries(copyEN).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('claves esenciales', () => {
    const essentialKeys = [
      'createdSuccess',
      'updatedSuccess',
      'deletedSuccess',
      'listSuccess',
      'pausedSuccess',
      'resumedSuccess',
      'createError',
      'updateError',
      'deleteError',
      'listError',
      'pauseError',
      'resumeError',
      'notFound',
      'unauthorized',
      'internalError',
      'limitReached',
      'activeLimitReached',
      'duplicateTime',
      'rateLimitExceeded',
      'joiDayOfWeekRequired',
      'joiDayOfWeekNumber',
      'joiDayOfWeekRange',
      'joiDayOfWeekInteger',
      'joiTimeRequired',
      'joiTimeString',
      'joiTimeFormat',
      'joiLabelString',
      'joiLabelMax',
      'joiLabelInvalid',
      'joiIsActiveInvalid',
      'joiNotificationIdString',
      'joiNotificationIdMax',
      'joiPauseDaysRequired',
      'joiPauseDaysNumber',
      'joiPauseDaysRange',
      'joiPauseDaysInteger',
    ];

    test('debe tener todas las claves esenciales en ES', () => {
      const copyES = scheduledSessionsApiCopy('es');
      essentialKeys.forEach((key) => {
        expect(copyES[key]).toBeDefined();
        expect(typeof copyES[key]).toBe('string');
        expect(copyES[key].trim().length).toBeGreaterThan(0);
      });
    });

    test('debe tener todas las claves esenciales en EN', () => {
      const copyEN = scheduledSessionsApiCopy('en');
      essentialKeys.forEach((key) => {
        expect(copyEN[key]).toBeDefined();
        expect(typeof copyEN[key]).toBe('string');
        expect(copyEN[key].trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('normalización de idioma', () => {
    test('debe normalizar "en-US" a "en"', () => {
      const copy = scheduledSessionsApiCopy('en-US');
      expect(copy).toBeDefined();
      expect(copy.createdSuccess).toContain('created successfully');
    });

    test('debe normalizar "es-ES" a "es"', () => {
      const copy = scheduledSessionsApiCopy('es-ES');
      expect(copy).toBeDefined();
      expect(copy.createdSuccess).toContain('creada correctamente');
    });

    test('debe normalizar idioma inválido a "es" (default)', () => {
      const copy = scheduledSessionsApiCopy('fr');
      expect(copy).toBeDefined();
      expect(copy.createdSuccess).toContain('creada correctamente');
    });

    test('debe manejar undefined y devolver default "es"', () => {
      const copy = scheduledSessionsApiCopy(undefined);
      expect(copy).toBeDefined();
      expect(copy.createdSuccess).toContain('creada correctamente');
    });
  });
});
