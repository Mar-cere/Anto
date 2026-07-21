/**
 * Middleware para verificar la conexión de MongoDB antes de procesar requests.
 * Devuelve 503 si la base de datos no está conectada.
 */
import mongoose from 'mongoose';

export const checkDatabaseConnection = (req, res, next) => {
  const isConnected = mongoose.connection && mongoose.connection.readyState === 1;

  if (!isConnected) {
    res.set('Retry-After', '5');
    return res.status(503).json({
      success: false,
      error:
        'Servicio temporalmente no disponible. La base de datos no está conectada.',
      code: 'DATABASE_UNAVAILABLE',
    });
  }

  return next();
};
