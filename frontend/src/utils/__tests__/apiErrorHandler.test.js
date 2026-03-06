/**
 * Tests unitarios para el manejador centralizado de errores de API
 *
 * @author AntoApp Team
 */

import {
  getApiErrorMessage,
  isNetworkError,
  isAuthError,
  isRateLimitError,
  isServerError,
  HTTP_STATUS,
  API_ERROR_MESSAGES,
} from '../apiErrorHandler';

describe('apiErrorHandler', () => {
  describe('HTTP_STATUS', () => {
    it('debe exportar códigos HTTP usados', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
      expect(HTTP_STATUS.SERVER_ERROR).toBe(500);
    });
  });

  describe('API_ERROR_MESSAGES', () => {
    it('debe tener mensajes en español para cada tipo', () => {
      expect(API_ERROR_MESSAGES.NETWORK).toBeDefined();
      expect(API_ERROR_MESSAGES.TIMEOUT).toBeDefined();
      expect(API_ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
      expect(API_ERROR_MESSAGES.FORBIDDEN).toBeDefined();
      expect(API_ERROR_MESSAGES.GENERIC).toBeDefined();
      expect(typeof API_ERROR_MESSAGES.NETWORK).toBe('string');
    });
  });

  describe('isNetworkError', () => {
    it('debe retornar true para Network request failed', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
    });
    it('debe retornar true para timeout', () => {
      expect(isNetworkError(new Error('Request timed out'))).toBe(true);
    });
    it('debe retornar true para ECONNREFUSED', () => {
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
    });
    it('debe retornar true cuando no hay response', () => {
      const err = new Error('Something');
      err.response = undefined;
      expect(isNetworkError(err)).toBe(true);
    });
    it('debe retornar false cuando hay response y mensaje no es de red', () => {
      const err = new Error('Bad request');
      err.response = { status: 400 };
      expect(isNetworkError(err)).toBe(false);
    });
    it('debe retornar false para null/undefined', () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('debe retornar true para 401', () => {
      expect(isAuthError({ response: { status: 401 } })).toBe(true);
    });
    it('debe retornar true para 403', () => {
      expect(isAuthError({ response: { status: 403 } })).toBe(true);
    });
    it('debe retornar false para 404', () => {
      expect(isAuthError({ response: { status: 404 } })).toBe(false);
    });
    it('debe retornar false cuando no hay response', () => {
      expect(isAuthError({})).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('debe retornar true para 429', () => {
      expect(isRateLimitError({ response: { status: 429 } })).toBe(true);
    });
    it('debe retornar false para 400', () => {
      expect(isRateLimitError({ response: { status: 400 } })).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('debe retornar true para 500, 502, 503', () => {
      expect(isServerError({ response: { status: 500 } })).toBe(true);
      expect(isServerError({ response: { status: 502 } })).toBe(true);
      expect(isServerError({ response: { status: 503 } })).toBe(true);
    });
    it('debe retornar false para 499 y 400', () => {
      expect(isServerError({ response: { status: 499 } })).toBe(false);
      expect(isServerError({ response: { status: 400 } })).toBe(false);
    });
  });

  describe('getApiErrorMessage', () => {
    it('debe retornar mensaje de red cuando isOffline es true', () => {
      expect(getApiErrorMessage(new Error('Any'), { isOffline: true })).toBe(
        API_ERROR_MESSAGES.NETWORK
      );
    });

    it('debe retornar mensaje genérico para error null/undefined', () => {
      expect(getApiErrorMessage(null)).toBe(API_ERROR_MESSAGES.GENERIC);
      expect(getApiErrorMessage(undefined)).toBe(API_ERROR_MESSAGES.GENERIC);
    });

    it('debe retornar mensaje de timeout cuando el mensaje incluye timeout', () => {
      const err = new Error('Request timeout');
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.TIMEOUT);
    });

    it('debe retornar mensaje de red para errores de red sin response', () => {
      const err = new Error('Network request failed');
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.NETWORK);
    });

    it('debe priorizar mensaje del servidor (response.data.message)', () => {
      const err = new Error('Error');
      err.response = { status: 400, data: { message: 'El email ya está en uso' } };
      expect(getApiErrorMessage(err)).toBe('El email ya está en uso');
    });

    it('debe usar response.data.error si message no está', () => {
      const err = new Error('Error');
      err.response = { status: 400, data: { error: 'Invalid payload' } };
      expect(getApiErrorMessage(err)).toBe('Invalid payload');
    });

    it('debe retornar UNAUTHORIZED para 401 sin mensaje del servidor', () => {
      const err = new Error('Unauthorized');
      err.response = { status: 401, data: {} };
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('debe retornar FORBIDDEN para 403 sin mensaje del servidor', () => {
      const err = new Error('Forbidden');
      err.response = { status: 403, data: {} };
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.FORBIDDEN);
    });

    it('debe retornar NOT_FOUND para 404', () => {
      const err = new Error('Not found');
      err.response = { status: 404, data: {} };
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.NOT_FOUND);
    });

    it('debe retornar TOO_MANY_REQUESTS para 429', () => {
      const err = new Error('Too many requests');
      err.response = { status: 429, data: {} };
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.TOO_MANY_REQUESTS);
    });

    it('debe retornar BAD_REQUEST para 400, 422, 409', () => {
      const err400 = new Error('Bad request');
      err400.response = { status: 400, data: {} };
      expect(getApiErrorMessage(err400)).toBe(API_ERROR_MESSAGES.BAD_REQUEST);

      const err422 = new Error('Unprocessable');
      err422.response = { status: 422, data: {} };
      expect(getApiErrorMessage(err422)).toBe(API_ERROR_MESSAGES.BAD_REQUEST);
    });

    it('debe retornar SERVER para 500, 502, 503', () => {
      const err500 = new Error('Server error');
      err500.response = { status: 500, data: {} };
      expect(getApiErrorMessage(err500)).toBe(API_ERROR_MESSAGES.SERVER);

      const err503 = new Error('Unavailable');
      err503.response = { status: 503, data: {} };
      expect(getApiErrorMessage(err503)).toBe(API_ERROR_MESSAGES.SERVER);
    });

    it('debe retornar SERVER para cualquier 5xx', () => {
      const err = new Error('Error');
      err.response = { status: 504, data: {} };
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.SERVER);
    });

    it('debe retornar BAD_REQUEST para 4xx no mapeado', () => {
      const err = new Error('Error');
      err.response = { status: 418, data: {} };
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.BAD_REQUEST);
    });

    it('debe retornar GENERIC para código desconocido', () => {
      const err = new Error('Error');
      err.response = { status: 399, data: {} };
      expect(getApiErrorMessage(err)).toBe(API_ERROR_MESSAGES.GENERIC);
    });

    it('debe hacer trim del mensaje del servidor', () => {
      const err = new Error('Error');
      err.response = { status: 400, data: { message: '  Mensaje con espacios  ' } };
      expect(getApiErrorMessage(err)).toBe('Mensaje con espacios');
    });
  });
});
