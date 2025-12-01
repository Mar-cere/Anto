/**
 * Logger estructurado usando Winston
 * 
 * Proporciona logging estructurado con diferentes niveles y formatos
 * según el entorno (desarrollo vs producción).
 * 
 * @author AntoApp Team
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para los niveles (solo en desarrollo)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato para desarrollo (más legible)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Formato para producción (JSON estructurado)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determinar formato según entorno
const isDevelopment = process.env.NODE_ENV === 'development';
const format = isDevelopment ? developmentFormat : productionFormat;

// Transports (dónde se guardan los logs)
const transports = [
  // Console (siempre activo)
  new winston.transports.Console({
    format: format,
    level: isDevelopment ? 'debug' : 'info',
  }),
];

// En producción, también guardar en archivos
if (!isDevelopment) {
  // Logs de error
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Logs combinados
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Crear el logger
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  levels,
  format,
  transports,
  // No salir del proceso si hay un error
  exitOnError: false,
});

// Helper: crear contexto de log
const createContext = (req) => {
  if (!req) return {};
  
  return {
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?._id || req.user?.id,
  };
};

// Helper: sanitizar datos sensibles
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'auth'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  
  return sanitized;
};

// Logger extendido con helpers
const extendedLogger = {
  // Logs básicos
  error: (message, meta = {}) => {
    logger.error(message, sanitizeData(meta));
  },
  
  warn: (message, meta = {}) => {
    logger.warn(message, sanitizeData(meta));
  },
  
  info: (message, meta = {}) => {
    logger.info(message, sanitizeData(meta));
  },
  
  http: (message, meta = {}) => {
    logger.http(message, sanitizeData(meta));
  },
  
  debug: (message, meta = {}) => {
    logger.debug(message, sanitizeData(meta));
  },
  
  // Logs con contexto de request
  request: (req, message = 'Request received', level = 'info') => {
    const context = createContext(req);
    logger[level](message, { context });
  },
  
  // Log de error con request
  requestError: (req, error, message = 'Request error') => {
    const context = createContext(req);
    logger.error(message, {
      context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      },
    });
  },
  
  // Log de operación de base de datos
  database: (operation, meta = {}) => {
    logger.info(`Database: ${operation}`, sanitizeData(meta));
  },
  
  // Log de operación de servicio externo
  externalService: (service, operation, meta = {}) => {
    logger.info(`External Service [${service}]: ${operation}`, sanitizeData(meta));
  },
  
  // Log de autenticación
  auth: (event, meta = {}) => {
    logger.info(`Auth: ${event}`, sanitizeData(meta));
  },
  
  // Log de pago
  payment: (event, meta = {}) => {
    logger.info(`Payment: ${event}`, sanitizeData(meta));
  },
};

export default extendedLogger;

