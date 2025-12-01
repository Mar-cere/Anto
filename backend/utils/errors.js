/**
 * Clases de Error Personalizadas
 * 
 * Proporciona clases de error específicas para diferentes tipos de errores
 * en la aplicación, facilitando el manejo y logging de errores.
 * 
 * @author AntoApp Team
 */

/**
 * Clase base para errores de la aplicación
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, code = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Errores operacionales vs errores de programación
    this.code = code || this.getDefaultCode();
    this.timestamp = new Date().toISOString();
    
    // Mantener el stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  getDefaultCode() {
    // Código por defecto basado en el status code
    const codeMap = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    
    return codeMap[this.statusCode] || 'UNKNOWN_ERROR';
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Error de validación (400)
 */
export class ValidationError extends AppError {
  constructor(message = 'Error de validación', errors = null) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.errors = errors; // Array de errores de validación específicos
  }
  
  toJSON() {
    const base = super.toJSON();
    if (this.errors) {
      base.errors = this.errors;
    }
    return base;
  }
}

/**
 * Error de autenticación (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

/**
 * Error de autorización (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

/**
 * Error de recurso no encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, true, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * Error de conflicto (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409, true, 'CONFLICT');
  }
}

/**
 * Error de límite de tasa excedido (429)
 */
export class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Error de servicio externo (503)
 */
export class ExternalServiceError extends AppError {
  constructor(service, message = 'Error en servicio externo') {
    super(`${service}: ${message}`, 503, true, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Error de base de datos (500)
 */
export class DatabaseError extends AppError {
  constructor(message = 'Error en la base de datos', originalError = null) {
    super(message, 500, true, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Error de OpenAI (503)
 */
export class OpenAIError extends ExternalServiceError {
  constructor(message = 'Error en el servicio de OpenAI') {
    super('OpenAI', message);
    this.code = 'OPENAI_ERROR';
  }
}

/**
 * Error de Mercado Pago (503)
 */
export class MercadoPagoError extends ExternalServiceError {
  constructor(message = 'Error en el servicio de Mercado Pago') {
    super('MercadoPago', message);
    this.code = 'MERCADOPAGO_ERROR';
  }
}

/**
 * Error de suscripción requerida (403)
 */
export class SubscriptionRequiredError extends AuthorizationError {
  constructor(message = 'Se requiere una suscripción activa') {
    super(message);
    this.code = 'SUBSCRIPTION_REQUIRED';
    this.requiresSubscription = true;
  }
}

/**
 * Helper: convertir error de Mongoose a AppError
 */
export const handleMongooseError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
    }));
    return new ValidationError('Error de validación', errors);
  }
  
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new ConflictError(`${field} ya existe`);
  }
  
  if (error.name === 'CastError') {
    return new ValidationError(`ID inválido: ${error.value}`);
  }
  
  return new DatabaseError('Error en la base de datos', error);
};

/**
 * Helper: convertir error de JWT a AppError
 */
export const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Token inválido');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expirado');
  }
  
  return new AuthenticationError('Error de autenticación');
};

/**
 * Helper: verificar si un error es operacional
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

