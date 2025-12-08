/**
 * Tests unitarios para utilidades de Sentry
 * 
 * Nota: Estos tests verifican el comportamiento básico sin inicializar Sentry
 * ya que requiere configuración compleja de mocks.
 * 
 * @author AntoApp Team
 */

import {
  captureException,
  captureMessage,
  setUser,
  clearUser,
  setContext,
  addBreadcrumb
} from '../../../utils/sentry.js';

describe('Sentry Utils', () => {
  describe('captureException', () => {
    it('debe ejecutarse sin errores cuando Sentry no está inicializado', () => {
      const error = new Error('Test error');
      expect(() => captureException(error)).not.toThrow();
    });

    it('debe ejecutarse sin errores con contexto', () => {
      const error = new Error('Test error');
      expect(() => captureException(error, { context: 'test' })).not.toThrow();
    });
  });

  describe('captureMessage', () => {
    it('debe ejecutarse sin errores cuando Sentry no está inicializado', () => {
      expect(() => captureMessage('Test message')).not.toThrow();
    });

    it('debe ejecutarse sin errores con nivel y contexto', () => {
      expect(() => captureMessage('Test message', 'info', { data: 'test' })).not.toThrow();
    });
  });

  describe('setUser', () => {
    it('debe ejecutarse sin errores cuando Sentry no está inicializado', () => {
      expect(() => setUser({ id: '123' })).not.toThrow();
    });
  });

  describe('clearUser', () => {
    it('debe ejecutarse sin errores cuando Sentry no está inicializado', () => {
      expect(() => clearUser()).not.toThrow();
    });
  });

  describe('setContext', () => {
    it('debe ejecutarse sin errores cuando Sentry no está inicializado', () => {
      expect(() => setContext('test', { data: 'value' })).not.toThrow();
    });
  });

  describe('addBreadcrumb', () => {
    it('debe ejecutarse sin errores cuando Sentry no está inicializado', () => {
      expect(() => addBreadcrumb({ message: 'Test', category: 'test' })).not.toThrow();
    });
  });
});

