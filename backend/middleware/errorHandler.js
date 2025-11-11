/**
 * Middleware de Manejo de Errores - Gestiona y formatea errores de la aplicación
 */
// Constantes de códigos de estado HTTP
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_SERVICE_UNAVAILABLE = 503;

// Constantes de nombres de errores
const ERROR_NAMES = {
  VALIDATION_ERROR: 'ValidationError',
  MONGO_SERVER_ERROR: 'MongoServerError',
  CAST_ERROR: 'CastError',
  OPENAI_ERROR: 'OpenAIError'
};

// Constantes de códigos de error de MongoDB
const MONGO_ERROR_CODES = {
  DUPLICATE_KEY: 11000
};

// Constantes de mensajes de error
const ERROR_MESSAGES = {
  VALIDATION: 'Error de validación',
  DUPLICATE: 'Error de duplicación',
  CAST: 'Error de formato de ID',
  OPENAI: 'Error en el servicio de IA',
  INTERNAL: 'Error interno del servidor'
};

// Helper: verificar si estamos en modo desarrollo
const isDevelopment = () => process.env.NODE_ENV === 'development';

// Helper: manejar errores de validación de Mongoose
const handleValidationError = (err, res) => {
  const errors = Object.values(err.errors).map(e => e.message);
  return res.status(HTTP_BAD_REQUEST).json({
    message: ERROR_MESSAGES.VALIDATION,
    errors
  });
};

// Helper: manejar errores de duplicación de MongoDB
const handleDuplicateError = (err, res) => {
  return res.status(HTTP_BAD_REQUEST).json({
    message: ERROR_MESSAGES.DUPLICATE,
    error: isDevelopment() ? err.message : undefined
  });
};

// Helper: manejar errores de formato de ID (CastError)
const handleCastError = (err, res) => {
  return res.status(HTTP_BAD_REQUEST).json({
    message: ERROR_MESSAGES.CAST,
    error: isDevelopment() ? err.message : undefined
  });
};

// Helper: manejar errores de OpenAI
const handleOpenAIError = (err, res) => {
  return res.status(HTTP_SERVICE_UNAVAILABLE).json({
    message: ERROR_MESSAGES.OPENAI,
    error: isDevelopment() ? err.message : undefined
  });
};

// Helper: manejar errores genéricos
const handleGenericError = (err, res) => {
  console.error('[ErrorHandler] Error no manejado:', err);
  return res.status(HTTP_INTERNAL_SERVER_ERROR).json({
    message: ERROR_MESSAGES.INTERNAL,
    error: isDevelopment() ? err.message : undefined,
    stack: isDevelopment() ? err.stack : undefined
  });
};

/**
 * Middleware de manejo de errores global
 * Captura y formatea todos los errores de la aplicación
 * @param {Error} err - Objeto de error
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export const errorHandler = (err, req, res, next) => {
  // Log del error completo en desarrollo
  if (isDevelopment()) {
    console.error('[ErrorHandler] Error completo:', err);
  } else {
    console.error('[ErrorHandler] Error:', err.message);
  }

  // Errores de validación de Mongoose
  if (err.name === ERROR_NAMES.VALIDATION_ERROR) {
    return handleValidationError(err, res);
  }

  // Errores de duplicación de MongoDB
  if (err.name === ERROR_NAMES.MONGO_SERVER_ERROR && err.code === MONGO_ERROR_CODES.DUPLICATE_KEY) {
    return handleDuplicateError(err, res);
  }

  // Errores de formato de ID (CastError)
  if (err.name === ERROR_NAMES.CAST_ERROR) {
    return handleCastError(err, res);
  }

  // Errores de OpenAI
  if (err.name === ERROR_NAMES.OPENAI_ERROR) {
    return handleOpenAIError(err, res);
  }

  // Error por defecto (genérico)
  return handleGenericError(err, res);
}; 