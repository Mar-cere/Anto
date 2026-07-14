/**
 * Tests unitarios para scheduledSessionsSchemas.js
 * Feature #15: Sesiones programadas
 */

import { jest } from '@jest/globals';
import Joi from 'joi';
import {
  getCreateSessionSchema,
  getUpdateSessionSchema,
  getPauseSessionsSchema,
} from '../../../utils/scheduledSessionsSchemas.js';

// Mock copy object
const mockCopy = {
  joiDayOfWeekRequired: 'Day of week required',
  joiDayOfWeekNumber: 'Day of week must be number',
  joiDayOfWeekRange: 'Day of week must be 0-6',
  joiDayOfWeekInteger: 'Day of week must be integer',
  joiTimeRequired: 'Time required',
  joiTimeString: 'Time must be string',
  joiTimeFormat: 'Time must be HH:mm',
  joiLabelString: 'Label must be string',
  joiLabelMax: 'Label max 50 chars',
  joiLabelInvalid: 'Label invalid',
  joiIsActiveInvalid: 'isActive must be boolean',
  joiNotificationIdString: 'NotificationId must be string',
  joiNotificationIdMax: 'NotificationId max 128 chars',
  joiPauseDaysRequired: 'Pause days required',
  joiPauseDaysNumber: 'Pause days must be number',
  joiPauseDaysRange: 'Pause days must be 1-90',
  joiPauseDaysInteger: 'Pause days must be integer',
};

describe('scheduledSessionsSchemas', () => {
  describe('getCreateSessionSchema', () => {
    let schema;

    beforeEach(() => {
      schema = getCreateSessionSchema(mockCopy);
    });

    describe('dayOfWeek validation', () => {
      test('debe aceptar dayOfWeek válido (0)', () => {
        const { error } = schema.validate({ dayOfWeek: 0, time: '10:00' });
        expect(error).toBeUndefined();
      });

      test('debe aceptar dayOfWeek válido (6)', () => {
        const { error } = schema.validate({ dayOfWeek: 6, time: '10:00' });
        expect(error).toBeUndefined();
      });

      test('debe aceptar dayOfWeek válido (3)', () => {
        const { error } = schema.validate({ dayOfWeek: 3, time: '10:00' });
        expect(error).toBeUndefined();
      });

      test('debe rechazar dayOfWeek negativo', () => {
        const { error } = schema.validate({ dayOfWeek: -1, time: '10:00' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Day of week must be 0-6');
      });

      test('debe rechazar dayOfWeek > 6', () => {
        const { error } = schema.validate({ dayOfWeek: 7, time: '10:00' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Day of week must be 0-6');
      });

      test('debe rechazar dayOfWeek string', () => {
        const { error } = schema.validate({ dayOfWeek: 'Monday', time: '10:00' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Day of week must be number');
      });

      test('debe rechazar dayOfWeek decimal', () => {
        const { error } = schema.validate({ dayOfWeek: 3.5, time: '10:00' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Day of week must be integer');
      });

      test('debe rechazar dayOfWeek faltante', () => {
        const { error } = schema.validate({ time: '10:00' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Day of week required');
      });
    });

    describe('time validation', () => {
      test('debe aceptar time válido (00:00)', () => {
        const { error } = schema.validate({ dayOfWeek: 1, time: '00:00' });
        expect(error).toBeUndefined();
      });

      test('debe aceptar time válido (23:59)', () => {
        const { error } = schema.validate({ dayOfWeek: 1, time: '23:59' });
        expect(error).toBeUndefined();
      });

      test('debe aceptar time válido (12:30)', () => {
        const { error } = schema.validate({ dayOfWeek: 1, time: '12:30' });
        expect(error).toBeUndefined();
      });

      test('debe rechazar time con espacios extra y hacer trim', () => {
        const { error, value } = schema.validate({ dayOfWeek: 1, time: '  10:00  ' });
        expect(error).toBeUndefined();
        expect(value.time).toBe('10:00');
      });

      test('debe rechazar time con hora > 23', () => {
        const { error } = schema.validate({ dayOfWeek: 1, time: '24:00' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Time must be HH:mm');
      });

      test('debe rechazar time con minutos > 59', () => {
        const { error } = schema.validate({ dayOfWeek: 1, time: '12:60' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Time must be HH:mm');
      });

      test('debe rechazar time formato 12h (12 PM)', () => {
        const { error } = schema.validate({ dayOfWeek: 1, time: '12 PM' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Time must be HH:mm');
      });

      test('debe rechazar time formato corto (9:00 sin leading zero)', () => {
        const { error } = schema.validate({ dayOfWeek: 1, time: '9:00' });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Time must be HH:mm');
      });

      test('debe rechazar time faltante', () => {
        const { error } = schema.validate({ dayOfWeek: 1 });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Time required');
      });
    });

    describe('label validation', () => {
      test('debe aceptar label válido', () => {
        const { error } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: 'Sesión mañana',
        });
        expect(error).toBeUndefined();
      });

      test('debe aceptar label null', () => {
        const { error } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: null,
        });
        expect(error).toBeUndefined();
      });

      test('debe aceptar label vacío', () => {
        const { error } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: '',
        });
        expect(error).toBeUndefined();
      });

      test('debe hacer trim en label', () => {
        const { error, value } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: '  Mi sesión  ',
        });
        expect(error).toBeUndefined();
        expect(value.label).toBe('Mi sesión');
      });

      test('debe rechazar label > 50 caracteres', () => {
        const longLabel = 'a'.repeat(51);
        const { error } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: longLabel,
        });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Label max 50 chars');
      });

      test('debe rechazar label con newlines', () => {
        const { error } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: 'Sesión\nmañana',
        });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Label invalid');
      });

      test('debe rechazar label con tabs', () => {
        const { error } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: 'Sesión\tmañana',
        });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Label invalid');
      });

      test('debe rechazar label con caracteres problemáticos (<>{})', () => {
        const { error } = schema.validate({
          dayOfWeek: 1,
          time: '10:00',
          label: '<script>alert("xss")</script>',
        });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('Label invalid');
      });
    });
  });

  describe('getUpdateSessionSchema', () => {
    let schema;

    beforeEach(() => {
      schema = getUpdateSessionSchema(mockCopy);
    });

    test('debe aceptar actualización parcial: solo dayOfWeek', () => {
      const { error } = schema.validate({ dayOfWeek: 2 });
      expect(error).toBeUndefined();
    });

    test('debe aceptar actualización parcial: solo time', () => {
      const { error } = schema.validate({ time: '15:00' });
      expect(error).toBeUndefined();
    });

    test('debe aceptar actualización parcial: solo isActive', () => {
      const { error } = schema.validate({ isActive: false });
      expect(error).toBeUndefined();
    });

    test('debe aceptar actualización parcial: solo label', () => {
      const { error } = schema.validate({ label: 'Nueva etiqueta' });
      expect(error).toBeUndefined();
    });

    test('debe aceptar actualización parcial: solo notificationId', () => {
      const { error } = schema.validate({ notificationId: 'abc-123' });
      expect(error).toBeUndefined();
    });

    test('debe aceptar actualización múltiple', () => {
      const { error } = schema.validate({
        dayOfWeek: 3,
        time: '16:00',
        label: 'Actualizada',
      });
      expect(error).toBeUndefined();
    });

    test('debe rechazar si no hay al menos un campo', () => {
      const { error } = schema.validate({});
      expect(error).toBeDefined();
    });

    test('debe aceptar notificationId null', () => {
      const { error } = schema.validate({ notificationId: null });
      expect(error).toBeUndefined();
    });

    test('debe rechazar notificationId > 128 caracteres', () => {
      const longId = 'a'.repeat(129);
      const { error } = schema.validate({ notificationId: longId });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('NotificationId max 128 chars');
    });
  });

  describe('getPauseSessionsSchema', () => {
    let schema;

    beforeEach(() => {
      schema = getPauseSessionsSchema(mockCopy);
    });

    test('debe aceptar pauseDays válido (1)', () => {
      const { error } = schema.validate({ pauseDays: 1 });
      expect(error).toBeUndefined();
    });

    test('debe aceptar pauseDays válido (90)', () => {
      const { error } = schema.validate({ pauseDays: 90 });
      expect(error).toBeUndefined();
    });

    test('debe aceptar pauseDays válido (30)', () => {
      const { error } = schema.validate({ pauseDays: 30 });
      expect(error).toBeUndefined();
    });

    test('debe rechazar pauseDays = 0', () => {
      const { error } = schema.validate({ pauseDays: 0 });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Pause days must be 1-90');
    });

    test('debe rechazar pauseDays negativo', () => {
      const { error } = schema.validate({ pauseDays: -5 });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Pause days must be 1-90');
    });

    test('debe rechazar pauseDays > 90', () => {
      const { error } = schema.validate({ pauseDays: 91 });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Pause days must be 1-90');
    });

    test('debe rechazar pauseDays string', () => {
      const { error } = schema.validate({ pauseDays: '30' });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Pause days must be number');
    });

    test('debe rechazar pauseDays decimal', () => {
      const { error } = schema.validate({ pauseDays: 30.5 });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Pause days must be integer');
    });

    test('debe rechazar pauseDays faltante', () => {
      const { error } = schema.validate({});
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Pause days required');
    });
  });
});
