/**
 * Middleware de Manejo de Errores - Gestiona y formatea errores de la aplicación
 * 
 * Usa las clases de error personalizadas y logging estructurado para
 * manejar errores de forma consistente en toda la aplicación.
 * 
 * @author AntoApp Team
 */

import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import {
  AppError,
  ValidationError,
  DatabaseError,
  handleMongooseError,
  handleJWTError,
  isOperationalError,
  ExternalServiceError,
} from '../utils/errors.js';

// Helper: verificar si estamos en modo desarrollo
const isDevelopment = () => process.env.NODE_ENV === 'development';

/**
 * Middleware de manejo de errores global
 * Captura y formatea todos los errores de la aplicación
 * 
 * @param {Error} err - Objeto de error
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.requestError(req, err, 'Error en request');
  
  // Si el error ya es una instancia de AppError, usarlo directamente
  if (err instanceof AppError) {
    return sendErrorResponse(res, err, req);
  }
  
  // Convertir errores de Mongoose a AppError
  if (err.name === 'ValidationError' || err.name === 'MongoServerError' || err.name === 'CastError') {
    const appError = handleMongooseError(err);
    return sendErrorResponse(res, appError, req);
  }
  
  // Detectar errores de conexión de MongoDB
  if (err.message && (
    err.message.includes('MongoServerSelectionError') ||
    err.message.includes('MongoNetworkError') ||
    err.message.includes('MongoTimeoutError') ||
    err.message.includes('connection') ||
    err.message.includes('connect ECONNREFUSED') ||
    err.message.includes('Server selection timed out')
  )) {
    // Verificar estado de MongoDB de forma síncrona
    try {
      const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
      
      if (!isConnected) {
        const appError = new ExternalServiceError(
          'MongoDB',
          'Servicio temporalmente no disponible. La base de datos no está conectada.'
        );
        return sendErrorResponse(res, appError, req);
      }
    } catch (mongooseError) {
      // Si hay error al verificar mongoose, asumir que no está conectado
      const appError = new ExternalServiceError(
        'MongoDB',
        'Servicio temporalmente no disponible. La base de datos no está conectada.'
      );
      return sendErrorResponse(res, appError, req);
    }
  }
  
  // Convertir errores de JWT a AppError
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const appError = handleJWTError(err);
    return sendErrorResponse(res, appError, req);
  }
  
  // Convertir errores de OpenAI
  if (err.name === 'OpenAIError' || err.response?.status === 429 || err.response?.status === 401) {
    const appError = new AppError(
      err.message || 'Error en el servicio de IA',
      503,
      true,
      'OPENAI_ERROR'
    );
    return sendErrorResponse(res, appError, req);
  }
  
  // Error desconocido - crear un AppError genérico
  const appError = new AppError(
    err.message || 'Error interno del servidor',
    500,
    false, // No es un error operacional
    'INTERNAL_SERVER_ERROR'
  );
  
  // En desarrollo, incluir el stack trace original
  if (isDevelopment() && err.stack) {
    appError.stack = err.stack;
  }
  
  return sendErrorResponse(res, appError, req);
};

/**
 * Envía la respuesta de error formateada
 * 
 * @param {Object} res - Response de Express
 * @param {AppError} error - Error de la aplicación
 * @param {Object} req - Request de Express (opcional, para logging)
 */
const sendErrorResponse = (res, error, req = null) => {
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      ...(error.toJSON ? error.toJSON() : {}),
    },
  };
  
  // En desarrollo, incluir información adicional
  if (isDevelopment()) {
    response.error.stack = error.stack;
    if (error.originalError) {
      response.error.originalError = {
        message: error.originalError.message,
        name: error.originalError.name,
      };
    }
  }
  
  // Agregar información adicional si existe
  if (error.requiresSubscription !== undefined) {
    response.error.requiresSubscription = error.requiresSubscription;
  }
  
  // Log del error formateado
  if (req) {
    logger.error('Error response sent', {
      statusCode,
      error: response.error,
      path: req.path,
      method: req.method,
    });
  }
  
  res.status(statusCode).json(response);
};

/**
 * Middleware para manejar rutas no encontradas
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Ruta no encontrada: ${req.method} ${req.path}`,
    404,
    true,
    'NOT_FOUND'
  );
  
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  
  next(error);
};

/**
 * Middleware para capturar errores asíncronos
 * Envuelve funciones async para capturar errores automáticamente
 * 
 * @param {Function} fn - Función async a envolver
 * @returns {Function} Función envuelta
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
