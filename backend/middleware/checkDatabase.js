/**
 * Middleware para verificar la conexión de MongoDB antes de procesar requests
 * Devuelve 503 si la base de datos no está conectada
 */
import mongoose from 'mongoose';
import { ExternalServiceError } from '../utils/errors.js';

export const checkDatabaseConnection = (req, res, next) => {
  // Verificar estado de MongoDB
  const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
  
  if (!isConnected) {
    const error = new ExternalServiceError(
      'MongoDB',
      'Servicio temporalmente no disponible. La base de datos no está conectada.'
    );
    return res.status(503).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: 503
      }
    });
  }
  
  next();
};

