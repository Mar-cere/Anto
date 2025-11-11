/**
 * Middleware de Validación - Gestiona validaciones comunes de datos
 */
import mongoose from 'mongoose';

// Constantes de códigos de estado HTTP
const HTTP_BAD_REQUEST = 400;

// Constantes de mensajes de error
const ERROR_MESSAGES = {
  VALIDATION: 'Error de validación',
  INVALID_ID: 'ID inválido',
  INVALID_USER_ID: 'ID de usuario inválido',
  MESSAGE_CONTENT_REQUIRED: 'El contenido del mensaje es requerido',
  CONVERSATION_ID_REQUIRED: 'El ID de conversación es requerido'
};

// Helper: validar formato de ObjectId
const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id);
};

// Helper: enviar respuesta de error de validación
const sendValidationError = (res, errors) => {
  return res.status(HTTP_BAD_REQUEST).json({
    message: ERROR_MESSAGES.VALIDATION,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Middleware para validar formato de ObjectId en parámetros de ruta
 * Valida que el parámetro 'id' sea un ObjectId válido
 */
export const validateObjectId = (req, res, next) => {
  const id = req.params.id;

  if (!isValidObjectId(id)) {
    return sendValidationError(res, ERROR_MESSAGES.INVALID_ID);
  }

  next();
};

/**
 * Middleware para validar formato de ObjectId del usuario autenticado
 * Valida que req.user._id sea un ObjectId válido
 */
export const validateUserObjectId = (req, res, next) => {
  const userId = req.user?._id || req.user?.userId;

  if (!isValidObjectId(userId)) {
    return sendValidationError(res, ERROR_MESSAGES.INVALID_USER_ID);
  }

  next();
};

/**
 * Middleware para validar datos de mensaje
 * Valida que el mensaje tenga contenido y conversationId válidos
 */
export const validateMessage = (req, res, next) => {
  const { content, conversationId } = req.body;
  const errors = [];

  // Validar contenido del mensaje
  if (!content || typeof content !== 'string' || !content.trim()) {
    errors.push(ERROR_MESSAGES.MESSAGE_CONTENT_REQUIRED);
  }

  // Validar ID de conversación
  if (!conversationId) {
    errors.push(ERROR_MESSAGES.CONVERSATION_ID_REQUIRED);
  } else if (!isValidObjectId(conversationId)) {
    errors.push(ERROR_MESSAGES.INVALID_ID);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Middleware genérico para validar múltiples campos
 * @param {Object} rules - Objeto con reglas de validación { campo: { required, type, validator } }
 * @returns {Function} Middleware de validación
 */
export const validateFields = (rules) => {
  return (req, res, next) => {
    const errors = [];
    const data = { ...req.body, ...req.params, ...req.query };

    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];

      // Validar campo requerido
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} es requerido`);
        return;
      }

      // Si el campo no es requerido y no existe, continuar
      if (!rule.required && (value === undefined || value === null)) {
        return;
      }

      // Validar tipo
      if (rule.type && typeof value !== rule.type) {
        errors.push(`${field} debe ser de tipo ${rule.type}`);
        return;
      }

      // Validar ObjectId
      if (rule.isObjectId && !isValidObjectId(value)) {
        errors.push(`${field} debe ser un ID válido`);
        return;
      }

      // Validar con función personalizada
      if (rule.validator && typeof rule.validator === 'function') {
        const validationResult = rule.validator(value);
        if (validationResult !== true) {
          errors.push(validationResult || `${field} es inválido`);
        }
      }
    });

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    next();
  };
}; 