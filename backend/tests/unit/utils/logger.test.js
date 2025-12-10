/**
 * Tests unitarios para logger
 * 
 * @author AntoApp Team
 */

import logger from '../../../utils/logger.js';

describe('Logger', () => {
  describe('Logging básico', () => {
    it('debe loguear mensajes de error', () => {
      expect(() => {
        logger.error('Test error message');
      }).not.toThrow();
    });

    it('debe loguear mensajes de warning', () => {
      expect(() => {
        logger.warn('Test warning message');
      }).not.toThrow();
    });

    it('debe loguear mensajes de info', () => {
      expect(() => {
        logger.info('Test info message');
      }).not.toThrow();
    });

    it('debe loguear mensajes HTTP', () => {
      expect(() => {
        logger.http('Test HTTP message');
      }).not.toThrow();
    });

    it('debe loguear mensajes de debug', () => {
      expect(() => {
        logger.debug('Test debug message');
      }).not.toThrow();
    });
  });

  describe('Logging con metadata', () => {
    it('debe loguear con metadata adicional', () => {
      expect(() => {
        logger.info('Test message', { userId: '123', action: 'test' });
      }).not.toThrow();
    });

    it('debe sanitizar datos sensibles en metadata', () => {
      expect(() => {
        logger.info('Test message', {
          password: 'secret123',
          token: 'abc123',
          apiKey: 'key123',
          user: {
            email: 'test@example.com',
            password: 'secret',
          },
        });
      }).not.toThrow();
    });
  });

  describe('Logging con request', () => {
    it('debe loguear request correctamente', () => {
      const mockReq = {
        method: 'GET',
        url: '/api/test',
        path: '/api/test',
        ip: '127.0.0.1',
        get: function() { return 'test-agent'; },
        user: { _id: '123' },
      };

      expect(() => {
        logger.request(mockReq, 'Request received');
      }).not.toThrow();
    });

    it('debe loguear error de request correctamente', () => {
      const mockReq = {
        method: 'POST',
        url: '/api/test',
        path: '/api/test',
        ip: '127.0.0.1',
        get: function() { return 'test-agent'; },
      };

      const error = new Error('Test error');

      expect(() => {
        logger.requestError(mockReq, error, 'Request error');
      }).not.toThrow();
    });
  });

  describe('Logging especializado', () => {
    it('debe loguear operaciones de base de datos', () => {
      expect(() => {
        logger.database('find', { collection: 'users' });
      }).not.toThrow();
    });

    it('debe loguear operaciones de servicios externos', () => {
      expect(() => {
        logger.externalService('OpenAI', 'generate response', { model: 'gpt-5' });
      }).not.toThrow();
    });

    it('debe loguear eventos de autenticación', () => {
      expect(() => {
        logger.auth('login', { userId: '123' });
      }).not.toThrow();
    });

    it('debe loguear eventos de pago', () => {
      expect(() => {
        logger.payment('subscription_created', { userId: '123', plan: 'monthly' });
      }).not.toThrow();
    });
  });
});
