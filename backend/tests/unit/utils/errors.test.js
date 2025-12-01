/**
 * Tests unitarios para clases de error
 * 
 * @author AntoApp Team
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  OpenAIError,
  SubscriptionRequiredError,
  handleMongooseError,
  handleJWTError,
  isOperationalError,
} from '../../../utils/errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('debe crear un error con status code por defecto', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('debe crear un error con status code personalizado', () => {
      const error = new AppError('Not found', 404);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('debe serializar a JSON correctamente', () => {
      const error = new AppError('Test error', 400);
      const json = error.toJSON();
      expect(json).toHaveProperty('name', 'AppError');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('code', 'BAD_REQUEST');
      expect(json).toHaveProperty('statusCode', 400);
      expect(json).toHaveProperty('timestamp');
    });
  });

  describe('ValidationError', () => {
    it('debe crear un error de validación', () => {
      const error = new ValidationError('Invalid data');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('debe incluir errores específicos', () => {
      const errors = [
        { field: 'email', message: 'Email inválido' },
        { field: 'password', message: 'Password muy corto' },
      ];
      const error = new ValidationError('Validation failed', errors);
      expect(error.errors).toEqual(errors);
      
      const json = error.toJSON();
      expect(json).toHaveProperty('errors', errors);
    });
  });

  describe('AuthenticationError', () => {
    it('debe crear un error de autenticación', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('AuthorizationError', () => {
    it('debe crear un error de autorización', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('NotFoundError', () => {
    it('debe crear un error de recurso no encontrado', () => {
      const error = new NotFoundError('Usuario');
      expect(error.message).toBe('Usuario no encontrado');
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe('Usuario');
    });
  });

  describe('ConflictError', () => {
    it('debe crear un error de conflicto', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('RateLimitError', () => {
    it('debe crear un error de límite de tasa', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('ExternalServiceError', () => {
    it('debe crear un error de servicio externo', () => {
      const error = new ExternalServiceError('OpenAI', 'Service unavailable');
      expect(error.statusCode).toBe(503);
      expect(error.service).toBe('OpenAI');
      expect(error.message).toContain('OpenAI');
    });
  });

  describe('DatabaseError', () => {
    it('debe crear un error de base de datos', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('DB error', originalError);
      expect(error.statusCode).toBe(500);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('OpenAIError', () => {
    it('debe crear un error de OpenAI', () => {
      const error = new OpenAIError('API error');
      expect(error.statusCode).toBe(503);
      expect(error.service).toBe('OpenAI');
      expect(error.code).toBe('OPENAI_ERROR');
    });
  });

  describe('SubscriptionRequiredError', () => {
    it('debe crear un error de suscripción requerida', () => {
      const error = new SubscriptionRequiredError();
      expect(error.statusCode).toBe(403);
      expect(error.requiresSubscription).toBe(true);
    });
  });

  describe('handleMongooseError', () => {
    it('debe convertir ValidationError de Mongoose', () => {
      const mongooseError = {
        name: 'ValidationError',
        errors: {
          email: { path: 'email', message: 'Email inválido' },
        },
      };
      const error = handleMongooseError(mongooseError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toHaveLength(1);
    });

    it('debe convertir error de duplicado', () => {
      const mongooseError = {
        name: 'MongoServerError',
        code: 11000,
        keyPattern: { email: 1 },
      };
      const error = handleMongooseError(mongooseError);
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('debe convertir CastError', () => {
      const mongooseError = {
        name: 'CastError',
        value: 'invalid-id',
      };
      const error = handleMongooseError(mongooseError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('handleJWTError', () => {
    it('debe convertir JsonWebTokenError', () => {
      const jwtError = { name: 'JsonWebTokenError' };
      const error = handleJWTError(jwtError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Token inválido');
    });

    it('debe convertir TokenExpiredError', () => {
      const jwtError = { name: 'TokenExpiredError' };
      const error = handleJWTError(jwtError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Token expirado');
    });
  });

  describe('isOperationalError', () => {
    it('debe retornar true para errores operacionales', () => {
      const error = new AppError('Test', 400, true);
      expect(isOperationalError(error)).toBe(true);
    });

    it('debe retornar false para errores no operacionales', () => {
      const error = new AppError('Test', 500, false);
      expect(isOperationalError(error)).toBe(false);
    });

    it('debe retornar false para errores estándar', () => {
      const error = new Error('Standard error');
      expect(isOperationalError(error)).toBe(false);
    });
  });
});

