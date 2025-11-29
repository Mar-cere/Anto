/**
 * Middleware de Logging Estructurado
 * 
 * Proporciona logging estructurado para todas las peticiones HTTP
 */
import morgan from 'morgan';

// Formato personalizado para logging
const logFormat = (tokens, req, res) => {
  const logData = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)}ms`,
    contentLength: tokens.res(req, res, 'content-length'),
    timestamp: new Date().toISOString(),
    userId: req.user?._id?.toString() || 'anonymous',
    ip: req.ip || req.connection.remoteAddress
  };

  return JSON.stringify(logData);
};

// Middleware de logging estructurado
export const structuredLogging = morgan(logFormat, {
  skip: (req, res) => {
    // Saltar logging de health checks y rutas de sistema
    return req.path === '/health' || req.path === '/';
  }
});

// Middleware para logging de errores
export const errorLogging = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: err.status || 500,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?._id?.toString() || 'anonymous',
    ip: req.ip || req.connection.remoteAddress
  };

  console.error('[Error]', JSON.stringify(errorLog));
  next(err);
};

export default {
  structuredLogging,
  errorLogging
};

